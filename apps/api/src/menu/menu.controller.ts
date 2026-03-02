import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MenuService, NavbarData, FooterData, CategoryNavData } from './menu.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@inzertna-platforma/shared';

@ApiTags('menu')
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('navbar')
  @ApiOperation({ summary: 'Získanie navbar položiek (verejné)' })
  getNavbar() {
    return this.menuService.getNavbar();
  }

  @Get('footer')
  @ApiOperation({ summary: 'Získanie footer dát (verejné)' })
  getFooter() {
    return this.menuService.getFooter();
  }

  @Get('categoryNav')
  @ApiOperation({ summary: 'Získanie category nav položiek (verejné)' })
  getCategoryNav() {
    return this.menuService.getCategoryNav();
  }

  @Get(':type')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Získanie menu podľa typu (admin)' })
  getMenu(@Param('type') type: 'navbar' | 'footer' | 'categoryNav') {
    return this.menuService.getMenu(type);
  }

  @Put(':type')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aktualizácia menu (admin)' })
  updateMenu(
    @Param('type') type: 'navbar' | 'footer' | 'categoryNav',
    @Body() data: NavbarData | FooterData | CategoryNavData,
  ) {
    return this.menuService.updateMenu(type, data);
  }
}
