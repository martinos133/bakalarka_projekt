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

  // Predvolené menu (navbar a footer)
  const defaultNavbar = {
    items: [
      { id: '1', label: 'RentMe Pro', href: '#', order: 0 },
      { id: '2', label: 'Preskúmať', href: '#', order: 1 },
      { id: '3', label: 'Stať sa predajcom', href: '/become-seller', order: 2 },
    ],
  }
  const defaultFooter = {
    sections: [
      {
        id: 'cat',
        key: 'categories',
        title: 'Kategórie',
        links: [
          { id: 'c1', label: 'Grafika a dizajn', href: '#' },
          { id: 'c2', label: 'Digitálny marketing', href: '#' },
          { id: 'c3', label: 'Písanie a preklad', href: '#' },
          { id: 'c4', label: 'Video a animácia', href: '#' },
          { id: 'c5', label: 'Hudba a audio', href: '#' },
          { id: 'c6', label: 'Programovanie a technológie', href: '#' },
          { id: 'c7', label: 'Podnikanie', href: '#' },
          { id: 'c8', label: 'Životný štýl', href: '#' },
        ],
      },
      {
        id: 'about',
        key: 'about',
        title: 'O nás',
        links: [
          { id: 'a1', label: 'Kariéra', href: '#' },
          { id: 'a2', label: 'Tlačové správy', href: '#' },
          { id: 'a3', label: 'Partnerstvá', href: '#' },
          { id: 'a4', label: 'Zásady ochrany súkromia', href: '#' },
          { id: 'a5', label: 'Podmienky služby', href: '#' },
          { id: 'a6', label: 'Nároky na duševné vlastníctvo', href: '#' },
          { id: 'a7', label: 'Vzťahy s investormi', href: '#' },
        ],
      },
      {
        id: 'support',
        key: 'support',
        title: 'Podpora',
        links: [
          { id: 's1', label: 'Pomoc a podpora', href: '#' },
          { id: 's2', label: 'Dôvera a bezpečnosť', href: '#' },
          { id: 's3', label: 'Predaj na RentMe', href: '#' },
          { id: 's4', label: 'Nákup na RentMe', href: '#' },
          { id: 's5', label: 'Sprievodcovia RentMe', href: '#' },
        ],
      },
      {
        id: 'community',
        key: 'community',
        title: 'Komunita',
        links: [
          { id: 'co1', label: 'Udalosti', href: '#' },
          { id: 'co2', label: 'Blog', href: '#' },
          { id: 'co3', label: 'Podcast', href: '#' },
          { id: 'co4', label: 'Pozvať priateľa', href: '#' },
          { id: 'co5', label: 'Stať sa predajcom', href: '#' },
          { id: 'co6', label: 'Komunitné štandardy', href: '#' },
        ],
      },
    ],
  }

  await prisma.siteMenu.upsert({
    where: { type: 'navbar' },
    create: { type: 'navbar', data: defaultNavbar },
    update: {},
  })
  await prisma.siteMenu.upsert({
    where: { type: 'footer' },
    create: { type: 'footer', data: defaultFooter },
    update: {},
  })

  console.log('✅ Menu (navbar, footer) initialized')

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
