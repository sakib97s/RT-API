import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { GenderTypes } from '../../../enum/gender-types.enum';
import { PaginationDto } from '../../../dto/pagination.dto';

export class CheckUserDto {
  @IsOptional()
  @IsString()
  username: string;

  @IsOptional()
  @IsString()
  phoneNo: string;

  @IsOptional()
  @IsString()
  countryCode: string;
}

export class CreateUserDto {
  @IsOptional()
  @IsString()
  shop: string;

  @IsOptional()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsBoolean()
  isPasswordLess: boolean;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  username: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  password: string;

  @IsOptional()
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  phoneNo: string;

  @IsOptional()
  @IsString()
  countryCode: string;

  @IsOptional()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  registrationType: string;
}

export class AuthUserDto {
  @IsOptional()
  @IsString()
  shop: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  username: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  password: string;
}

/**
 * Address dto
 */

export class AddAddressDto {
  @IsOptional()
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  city: string;

  @IsOptional()
  user: any;

  @IsOptional()
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  addressType: string;
}

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(11)
  phone: string;

  @IsOptional()
  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  address: string;

  @IsOptional()
  @IsBoolean()
  isDefaultAddress: boolean;

  @IsOptional()
  @IsString()
  addressType: string;
}

export class UserSelectFieldDto {
  @IsOptional()
  @Matches(/^((?!password).)*$/)
  select: string;
}

export class FilterUserDto {
  @IsOptional()
  @IsBoolean()
  hasAccess: boolean;

  @IsOptional()
  @IsString()
  @IsIn([GenderTypes.MALE, GenderTypes.FEMALE, GenderTypes.OTHER])
  gender: string;
}
export class GetUserByIdsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  ids: string[];

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(11)
  phoneNo: string;
}
export class FilterAndPaginationUserDto {
  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterUserDto)
  filter: FilterUserDto;

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

export class UpdateUserDto {
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
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  ids: string[];
}

export class DeleteUserDto {
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
class UserAuthSuccessPayloadData {
  _id: string;

  role: string;

  permissions: string[];
}

class UserRegistrationPayloadData {
  _id: string;

  username: string;

  name: string;
}

export class UserRegistrationPayloadDto {
  success: boolean;

  message: string;

  data: UserRegistrationPayloadData;
}

export class UserAuthPayloadDto {
  success: boolean;

  message: string;

  data: UserAuthSuccessPayloadData;

  token: string;

  tokenExpiredIn: number;
}

export class ResetUserPasswordDto {
  @IsOptional()
  @IsString()
  phoneNo: string;

  @IsOptional()
  @IsString()
  countryCode: string;

  @IsOptional()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  password: string;
}
