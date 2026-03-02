import { Injectable } from '@nestjs/common';
import { prisma } from '@inzertna-platforma/database';

export interface PlatformConfig {
  siteName?: string;
  siteDescription?: string;
  contactEmail?: string;
  contactPhone?: string;
  supportEmail?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  copyrightText?: string;
  defaultLanguage?: string;
}

export interface AdminConfig {
  itemsPerPage?: number;
  maxUploadSize?: number;
  enableNotifications?: boolean;
  maintenanceMode?: boolean;
}

const DEFAULT_PLATFORM: PlatformConfig = {
  siteName: 'RentMe',
  siteDescription: 'Inzertná platforma pre služby a prenájom',
  contactEmail: 'info@rentme.sk',
  supportEmail: 'podpora@rentme.sk',
  copyrightText: '© RentMe International Ltd. 2024',
  defaultLanguage: 'sk',
};

const DEFAULT_ADMIN: AdminConfig = {
  itemsPerPage: 20,
  maxUploadSize: 10,
  enableNotifications: true,
  maintenanceMode: false,
};

@Injectable()
export class ConfigService {
  private async getOrCreate(key: 'platform' | 'admin', defaultValue: object) {
    let config = await prisma.siteConfig.findUnique({
      where: { key },
    });

    if (!config) {
      config = await prisma.siteConfig.create({
        data: { key, value: defaultValue as object },
      });
    }

    return config;
  }

  async getPlatformConfig(): Promise<PlatformConfig> {
    const config = await this.getOrCreate('platform', DEFAULT_PLATFORM);
    return { ...DEFAULT_PLATFORM, ...(config.value as object) } as PlatformConfig;
  }

  async getAdminConfig(): Promise<AdminConfig> {
    const config = await this.getOrCreate('admin', DEFAULT_ADMIN);
    return { ...DEFAULT_ADMIN, ...(config.value as object) } as AdminConfig;
  }

  async getConfig(key: 'platform' | 'admin'): Promise<PlatformConfig | AdminConfig> {
    if (key === 'platform') return this.getPlatformConfig();
    if (key === 'admin') return this.getAdminConfig();
    throw new Error('Neplatný kľúč konfigurácie');
  }

  async updateConfig(
    key: 'platform' | 'admin',
    value: PlatformConfig | AdminConfig
  ): Promise<PlatformConfig | AdminConfig> {
    const config = await prisma.siteConfig.upsert({
      where: { key },
      create: { key, value: value as object },
      update: { value: value as object },
    });
    return config.value as PlatformConfig | AdminConfig;
  }
}
