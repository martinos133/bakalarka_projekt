import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { prisma } from '@inzertna-platforma/database';
import { UserRole } from '@inzertna-platforma/shared';
import { LoginDto, CreateUserDto } from '@inzertna-platforma/shared';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async register(createUserDto: CreateUserDto) {
    const existingUser = await prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new UnauthorizedException('Email už je registrovaný');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        phone: createUserDto.phone,
        dateOfBirth: createUserDto.dateOfBirth ? new Date(createUserDto.dateOfBirth) : null,
        gender: createUserDto.gender as any,
        isCompany: createUserDto.isCompany || false,
        companyName: createUserDto.companyName,
        companyId: createUserDto.companyId,
        companyTaxId: createUserDto.companyTaxId,
        address: createUserDto.address,
        city: createUserDto.city,
        postalCode: createUserDto.postalCode,
        country: createUserDto.country,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const token = this.jwtService.sign({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    return {
      user,
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      console.error(`[Auth] User not found: ${loginDto.email}`);
      throw new UnauthorizedException('Neplatné prihlasovacie údaje');
    }

    // Kontrola banu
    if (user.banned) {
      const now = new Date();
      if (user.bannedUntil && user.bannedUntil > now) {
        const daysLeft = Math.ceil((user.bannedUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        throw new UnauthorizedException(
          `Váš účet je zablokovaný do ${user.bannedUntil.toLocaleDateString('sk-SK')} (${daysLeft} ${daysLeft === 1 ? 'deň' : 'dní'}). Dôvod: ${user.banReason || 'Porušenie podmienok'}`
        );
      } else if (!user.bannedUntil) {
        // Trvalý ban
        throw new UnauthorizedException(
          `Váš účet je trvalo zablokovaný. Dôvod: ${user.banReason || 'Porušenie podmienok'}`
        );
      } else {
        // Ban vypršal, odblokuj používateľa
        await prisma.user.update({
          where: { id: user.id },
          data: { banned: false, bannedUntil: null, banReason: null },
        });
      }
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      console.error(`[Auth] Invalid password for user: ${loginDto.email}`);
      throw new UnauthorizedException('Neplatné prihlasovacie údaje');
    }

    console.log(`[Auth] Successful login for user: ${user.email}`);

    // Aktualizuj čas posledného prihlásenia
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = this.jwtService.sign({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    };
  }

  async validateUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }
}
