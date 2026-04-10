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
import { FavoritesModule } from './favorites/favorites.module';
import { SearchModule } from './search/search.module';
import { StaticPagesModule } from './static-pages/static-pages.module';
import { BlogModule } from './blog/blog.module';
import { ReviewsModule } from './reviews/reviews.module';
import { CalendarModule } from './calendar/calendar.module';

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
    FavoritesModule,
    SearchModule,
    StaticPagesModule,
    BlogModule,
    ReviewsModule,
    CalendarModule,
  ],
})
export class AppModule {}
