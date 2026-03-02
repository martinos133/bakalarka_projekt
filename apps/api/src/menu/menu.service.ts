import { Injectable, BadRequestException } from '@nestjs/common';
import { prisma } from '@inzertna-platforma/database';

export interface NavbarItem {
  id: string;
  label: string;
  href: string;
  order: number;
}

export interface FooterLink {
  id: string;
  label: string;
  href: string;
}

export interface FooterSection {
  id: string;
  key: string;
  title: string;
  links: FooterLink[];
}

export type NavbarData = { items: NavbarItem[] };
export type FooterData = { sections: FooterSection[] };

const DEFAULT_NAVBAR: NavbarData = {
  items: [
    { id: '1', label: 'RentMe Pro', href: '#', order: 0 },
    { id: '2', label: 'Preskúmať', href: '#', order: 1 },
    { id: '3', label: 'Stať sa predajcom', href: '/become-seller', order: 2 },
  ],
};

const DEFAULT_FOOTER: FooterData = {
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
};

@Injectable()
export class MenuService {
  private async getOrCreate(type: 'navbar' | 'footer', defaultData: NavbarData | FooterData) {
    let menu = await prisma.siteMenu.findUnique({
      where: { type },
    });

    if (!menu) {
      menu = await prisma.siteMenu.create({
        data: {
          type,
          data: defaultData as object,
        },
      });
    }

    return menu;
  }

  async getNavbar(): Promise<NavbarData> {
    const menu = await this.getOrCreate('navbar', DEFAULT_NAVBAR);
    return menu.data as NavbarData;
  }

  async getFooter(): Promise<FooterData> {
    const menu = await this.getOrCreate('footer', DEFAULT_FOOTER);
    return menu.data as FooterData;
  }

  async getMenu(type: 'navbar' | 'footer'): Promise<NavbarData | FooterData> {
    if (type === 'navbar') return this.getNavbar();
    if (type === 'footer') return this.getFooter();
    throw new BadRequestException('Neplatný typ menu. Povolené: navbar, footer');
  }

  async updateMenu(
    type: 'navbar' | 'footer',
    data: NavbarData | FooterData,
  ): Promise<NavbarData | FooterData> {
    if (type === 'navbar') {
      const validated = data as NavbarData;
      if (!Array.isArray(validated.items)) {
        throw new BadRequestException('Navbar musí obsahovať pole items');
      }
    } else if (type === 'footer') {
      const validated = data as FooterData;
      if (!Array.isArray(validated.sections)) {
        throw new BadRequestException('Footer musí obsahovať pole sections');
      }
    }

    const menu = await prisma.siteMenu.upsert({
      where: { type },
      create: { type, data: data as object },
      update: { data: data as object },
    });

    return menu.data as NavbarData | FooterData;
  }
}
