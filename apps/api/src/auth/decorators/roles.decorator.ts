import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@inzertna-platforma/shared';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
