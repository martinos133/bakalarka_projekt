import { Controller, Post, Body, Get, UseGuards, Request, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto, CreateUserDto } from '@inzertna-platforma/shared';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrácia nového používateľa' })
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Prihlásenie používateľa' })
  async login(@Body() loginDto: LoginDto, @Req() req: any) {
    const ip = this.resolveIp(req);
    const userAgent = req.headers['user-agent'];
    return this.authService.login(loginDto, ip, userAgent);
  }

  private resolveIp(req: any): string {
    let raw = req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || '';
    if (typeof raw === 'string' && raw.includes(',')) raw = raw.split(',')[0].trim();
    if (raw === '::1' || raw === '::ffff:127.0.0.1') raw = '127.0.0.1';
    if (raw.startsWith('::ffff:')) raw = raw.replace('::ffff:', '');
    return raw;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Získanie aktuálneho používateľa' })
  async getMe(@Request() req) {
    return this.authService.validateUser(req.user.userId);
  }

  @Post('heartbeat')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aktualizovať stav online aktivity' })
  async heartbeat(@Request() req) {
    return this.authService.updateLastLogin(req.user.userId);
  }
}
