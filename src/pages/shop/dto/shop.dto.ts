import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { OptionPayloadDto } from 'src/dto/api-response.dto';
import { PaginationDto } from 'src/dto/pagination.dto';

// ⚠️ DEPRECATED - These DTOs are no longer used but kept for backward compatibility
// These endpoints have been removed from the controller
export class CreatePreShopDto {
  websiteName?: string;
  phoneNo?: string;
  packageType?: string;
  email?: string;
  sslDirect?: string;
  purchaseType?: string;
  packageId?: string;
  name?: string;
  shop?: string;
  themeId?: string;
  userId?: string;
  affiliateProductId?: string;
  affiliateUrl?: string;
}

export class CreateShopRenewDto {
  phoneNo?: string;
  sslDirect?: string;
  name?: string;
  shop?: string;
  affiliateUrl?: string;
}

export class SendPreShopDto {
  phoneNo?: string;
  _id?: string;
}

export class CheckShopAvailabilityDto {
  subDomain?: string;
}

export class CheckShopAvailabilityAndOtpDto {
  domain?: string;
  phoneNo?: string;
  email?: string;
}

export class SignupAndCreateShopDto {
  preShopId?: string;
  websiteName?: string;
  name?: string;
  password?: string;
  phoneNo?: string;
  email?: string;
  cloneWebUrl?: string;
  domain?: string;
  domainType?: 'sub-domain' | 'domain' | 'domain-http-www' | 'domain-www-http';
  isSsr?: boolean;
  themeColor?: any;
  needData?: boolean;
}

export class ChangeThemeDto {
  @IsOptional()
  @IsString()
  theme: string;

  @IsOptional()
  @IsString()
  cloneWebUrl: string;

  @IsOptional()
  @IsBoolean()
  needReset: boolean;
}

export class ChangeDomainDto {
  @IsNotEmpty()
  @IsString()
  domain: string;
}

export class AddVendorAndShopDto {
  @IsNotEmpty()
  @IsString()
  name: string;

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
  phoneNo: string;

  @IsOptional()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsBoolean()
  isPasswordLess: boolean;

  @IsOptional()
  @IsString()
  registrationType: string;

  @IsNotEmpty()
  @IsString()
  websiteName: string;

  @IsOptional()
  @IsString()
  domain: string;

  @IsOptional()
  @IsString()
  domainType: 'sub-domain' | 'domain' | 'domain-http-www' | 'domain-www-http';

  @IsOptional()
  @IsString()
  owner: string;

  @IsOptional()
  @IsString()
  subDomain: string;

  @IsOptional()
  @IsString()
  theme: string;

  @IsOptional()
  themeColor: any;

  @IsOptional()
  @IsString()
  packageId: string;

  @IsOptional()
  @IsString()
  serverIp: string;

  @IsOptional()
  @IsString()
  cloneWebUrl: string;

  @IsOptional()
  @IsBoolean()
  needWebsiteBuild: boolean;

  @IsOptional()
  @IsBoolean()
  needWww: boolean;

  @IsOptional()
  @IsBoolean()
  needData: boolean;

  @IsOptional()
  @IsBoolean()
  isSsr: boolean;
}

export class AddShopDto {
  @IsNotEmpty()
  @IsString()
  websiteName: string;

  @IsOptional()
  @IsString()
  domain: string;

  @IsNotEmpty()
  @IsString()
  owner: string;

  @IsOptional()
  @IsString()
  subDomain: string;

  @IsOptional()
  @IsString()
  theme: string;

  @IsOptional()
  @IsString()
  packageId: string;

  @IsOptional()
  @IsBoolean()
  needWebsiteBuild: boolean;
}

export class InsertManyShopDto {
  @Type(() => AddShopDto)
  data: AddShopDto[];

  option: OptionPayloadDto;
}

export class FilterShopDto {
  @IsOptional()
  @IsString()
  status?: 'draft' | 'publish';
}

export class UpdateShopDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  image: string;

  @IsOptional()
  @IsBoolean()
  isTrailPrice: boolean;

  @IsOptional()
  @IsString()
  pageName: string;

  @IsOptional()
  @IsString()
  shopDescription: string;

  @IsOptional()
  @IsString()
  keyWord: string;

  @IsOptional()
  @IsString()
  buildStatus: string;

  @IsOptional()
  @IsString()
  updateStatus: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  ids: string[];
}

export class FilterAndPaginationShopDto {
  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterShopDto)
  filter: FilterShopDto;

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

export class CloneDataFromShopDto {
  @IsOptional()
  @IsString()
  fromShop: string;

  @IsOptional()
  @IsString()
  toShop: string;
}

export class DeleteShopDto {
  @IsOptional()
  @IsMongoId({ message: 'Invalid theme id' })
  shop: string;

  @IsOptional()
  @IsString()
  domain: string;

  @IsOptional()
  @IsBoolean()
  needWebsiteDelete: boolean;

  @IsOptional()
  @IsBoolean()
  needDataDelete: boolean;

  @IsOptional()
  @IsBoolean()
  needUserDelete: boolean;

  @IsOptional()
  @IsBoolean()
  nedRemoveDomain: boolean;
}
