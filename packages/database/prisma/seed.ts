import { PrismaClient, UserRole } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { config } from 'dotenv'
import { resolve } from 'path'

// Načítanie .env súboru z root adresára
config({ path: resolve(__dirname, '../../../.env') })

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Hash hesla
  const hashedPassword = await bcrypt.hash('Welcome2025+', 10)

  // Vytvorenie alebo aktualizácia admin používateľa
  const admin = await prisma.user.upsert({
    where: { email: 'muha@becode.sk' },
    update: {
      password: hashedPassword,
      role: UserRole.ADMIN,
      firstName: 'Admin',
      lastName: 'User',
    },
    create: {
      email: 'muha@becode.sk',
      password: hashedPassword,
      role: UserRole.ADMIN,
      firstName: 'Admin',
      lastName: 'User',
    },
  })

  console.log('✅ Admin user created/updated:', {
    id: admin.id,
    email: admin.email,
    role: admin.role,
  })

  console.log('🎉 Seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
