import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AdvertisementsModule } from './advertisements/advertisements.module';
import { AdminModule } from './admin/admin.module';
import { CategoriesModule } from './categories/categories.module';
import { FiltersModule } from './filters/filters.module';
import { ReportsModule } from './reports/reports.module';
import { MessagesModule } from './messages/messages.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { MenuModule } from './menu/menu.module';
import { SiteConfigModule } from './config/config.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UsersModule,
    AdvertisementsModule,
    AdminModule,
    CategoriesModule,
    FiltersModule,
    ReportsModule,
    MessagesModule,
    AnalyticsModule,
    MenuModule,
    SiteConfigModule,
  ],
})
export class AppModule {}
