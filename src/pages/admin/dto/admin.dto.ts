import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { AdminRoles } from '../../../enum/admin-roles.enum';
import { GenderTypes } from '../../../enum/gender-types.enum';
import { PaginationDto } from '../../../dto/pagination.dto';

export class CreateAdminDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  password: string;

  @IsNotEmpty()
  @IsString()
  @IsIn([AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN, AdminRoles.EDITOR])
  role: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(4)
  permissions: string[];

  @IsOptional()
  @IsString()
  @IsIn([GenderTypes.MALE, GenderTypes.FEMALE, GenderTypes.OTHER])
  gender: string;

  @IsOptional()
  @IsString()
  phoneNo: string;

  @IsOptional()
  @IsString()
  email: string;

  @IsOptional()
  @IsBoolean()
  hasAccess: string;

  @IsOptional()
  @IsString()
  registrationAt: string;
}

export class AuthAdminDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  password: string;
}

export class AdminSelectFieldDto {
  @IsOptional()
  @Matches(/^((?!password).)*$/)
  select: string;
}

export class FilterAdminDto {
  @IsOptional()
  @IsBoolean()
  hasAccess: boolean;

  @IsOptional()
  @IsString()
  @IsIn([AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN, AdminRoles.EDITOR])
  role: string;

  @IsOptional()
  @IsString()
  @IsIn([GenderTypes.MALE, GenderTypes.FEMALE, GenderTypes.OTHER])
  gender: string;
}

export class FilterAndPaginationAdminDto {
  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterAdminDto)
  filter: FilterAdminDto;

  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => PaginationDto)
  pagination: PaginationDto;

  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  sort: object;

  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  select: any;
}

export class UpdateAdminDto {
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  newPassword: string;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  username: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  password: string;

  @IsOptional()
  @IsString()
  @IsIn([AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN, AdminRoles.EDITOR])
  role: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(4)
  permissions: string[];

  @IsOptional()
  @IsString()
  @IsIn([GenderTypes.MALE, GenderTypes.FEMALE, GenderTypes.OTHER])
  gender: string;

  @IsOptional()
  @IsString()
  phoneNo: string;

  @IsOptional()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  profileImg: string;

  @IsOptional()
  @IsBoolean()
  hasAccess: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  ids: string[];
}

/**
 * DTO FOR SWAGGER
 */
class AdminAuthSuccessPayloadData {
  _id: string;

  role: string;

  permissions: string[];
}

class AdminRegistrationPayloadData {
  _id: string;

  username: string;

  name: string;
}

export class AdminRegistrationPayloadDto {
  success: boolean;

  message: string;

  data: AdminRegistrationPayloadData;
}

export class AdminAuthPayloadDto {
  success: boolean;

  message: string;

  data: AdminAuthSuccessPayloadData;

  token: string;

  tokenExpiredIn: number;
}

export class VerifyTwoFactorDto {
  @IsMongoId()
  @IsNotEmpty()
  twoFactorId: string;

  @IsString()
  @Length(6, 6)
  code: string; // 6-digit
}

export class ChangePasswordDto {
  @IsString()
  oldPassword: string;

  @IsString()
  @MinLength(8)
  password: string;
}


export class RequestPasswordResetDto {
  // logged-in admin এর জন্য আলাদা ইনপুট দরকার নেই, placeholder রাখা হলো
  @IsOptional()
  note?: string;
}

export class VerifyPasswordResetDto {
  @IsString()
  code: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}
