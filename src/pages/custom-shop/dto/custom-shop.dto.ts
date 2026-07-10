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
import { VendorJwtPayload } from '../../vendor/interfaces/vendor.interface';

export class CreatePreCustomShopDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  websiteName: string;

  @IsOptional()
  @IsString()
  phoneNo: string;

  @IsOptional()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  sslDirect: string;

  @IsOptional()
  @IsString()
  purchaseType: string;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  shop: string;

  @IsOptional()
  @IsString()
  themeId: string;

  @IsOptional()
  @IsString()
  userId: string;


  @IsOptional()
  @IsString()
  affiliateProductId: string;

  @IsOptional()
  @IsString()
  affiliateUrl: string;
}
export class CreateCustomShopRenewDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(11)
  @MaxLength(20)
  phoneNo: string;

  @IsOptional()
  @IsString()
  sslDirect: string;

  @IsOptional()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  shop: string;

  @IsOptional()
  @IsString()
  affiliateUrl: string;
}

export class SendPreCustomShopDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(11)
  @MaxLength(20)
  phoneNo: string;

  @IsOptional()
  _id: string;
}

export class CheckCustomShopAvailabilityDto {
  @IsNotEmpty()
  @IsString()
  subDomain: string;
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

export class CheckCustomShopAvailabilityAndOtpDto {
  @IsNotEmpty()
  @IsString()
  domain: string;

  @IsOptional()
  @IsString()
  phoneNo: string;


  @IsOptional()
  @IsString()
  email: string;
}

export class ChangeDomainDto {
  @IsNotEmpty()
  @IsString()
  domain: string;
}

export class SignupAndCreateCustomShopDto {
  @IsNotEmpty()
  @IsString()
  preCustomShopId: string;

  @IsNotEmpty()
  @IsString()
  websiteName: string;

  @IsNotEmpty()
  @IsString()
  name: string;

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

  @IsOptional()
  @IsString()
  cloneWebUrl: string;

  @IsOptional()
  @IsString()
  domain: string;

  @IsOptional()
  @IsString()
  domainType: 'sub-domain' | 'domain' | 'domain-http-www' | 'domain-www-http';

  @IsOptional()
  @IsBoolean()
  isSsr: boolean;

  @IsOptional()
  themeColor: any;

  @IsOptional()
  @IsBoolean()
  needData: boolean;
}
export class AddVendorAndCustomShopDto {
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

export class AddCustomShopDto {
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

export class InsertManyCustomShopDto {
  @Type(() => AddCustomShopDto)
  data: AddCustomShopDto[];

  option: OptionPayloadDto;
}

export class FilterCustomShopDto {
  @IsOptional()
  @IsString()
  status?: 'draft' | 'publish';
}

export class UpdateCustomShopDto {
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

export class FilterAndPaginationCustomShopDto {
  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterCustomShopDto)
  filter: FilterCustomShopDto;

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

export class CloneDataFromCustomShopDto {
  @IsOptional()
  @IsString()
  fromCustomShop: string;

  @IsOptional()
  @IsString()
  toCustomShop: string;
}

export class DeleteCustomShopDto {
  @IsNotEmpty()
  @IsMongoId({ message: 'Invalid theme id' })
  shop: string;

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
