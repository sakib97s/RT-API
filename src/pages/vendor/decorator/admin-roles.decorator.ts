import { SetMetadata } from '@nestjs/common';
import { AdminRoles } from '../../../enum/admin-roles.enum';
import { ADMIN_ROLES_KEY } from '../../../config/global-variables';

export const AdminMetaRoles = (...roles: AdminRoles[]) =>
  SetMetadata(ADMIN_ROLES_KEY, roles);
