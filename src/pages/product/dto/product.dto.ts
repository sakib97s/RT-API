import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from 'src/dto/pagination.dto';

import { OptionPayloadDto } from 'src/dto/api-response.dto';

export class AddProductDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug: string;

  @IsOptional()
  @IsBoolean()
  autoSlug: boolean;

  @IsNotEmpty()
  @IsString()
  shop: string;

  @IsOptional()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsNumber()
  costPrice?: number;

  @IsOptional()
  @IsNumber()
  purchasePrice?: number;

  @IsOptional()
  @IsNumber()
  salePrice?: number;

  @IsOptional()
  @IsNumber()
  regularPrice?: number;

  @IsOptional()
  @Type(() => Date)
  expiryDate?: Date;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  warranty?: string;
  @IsOptional()
  @IsString()
  returnPolicy?: string;

  @IsOptional()
  @IsString()
  exchangePolicy?: string;

  @IsOptional()
  @IsString()
  deliveryTime?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  category?: any;

  @IsOptional()
  subCategory?: any;

  @IsOptional()
  childCategory?: any;

  @IsOptional()
  brand?: any;

  @IsOptional()
  tags?: any;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsArray()
  specifications?: any[];

  @IsOptional()
  @IsBoolean()
  isVariation?: boolean;

  @IsOptional()
  @IsString()
  variation?: string;

  @IsOptional()
  @IsArray()
  variationOptions?: string[];

  @IsOptional()
  @IsString()
  variation2?: string;

  @IsOptional()
  @IsArray()
  variation2Options?: string[];

  @IsOptional()
  @IsArray()
  variationList?: any[];
}

export class InsertManyProductDto {
  @Type(() => AddProductDto)
  data: AddProductDto[];

  option: OptionPayloadDto;
}

export class FilterProductDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  visibility: boolean;

  @IsOptional()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  shop: any;
}

export class FilterProductGroupDto {
  @IsOptional()
  @IsBoolean()
  isGroup: boolean;

  @IsOptional()
  @IsBoolean()
  category: boolean;

  @IsOptional()
  @IsBoolean()
  subCategory: boolean;

  @IsOptional()
  @IsBoolean()
  brand: boolean;
}

export class OptionProductDto {
  @IsOptional()
  @IsBoolean()
  deleteMany: boolean;
}

export class UpdateProductDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  slug: string;

  @IsOptional()
  @IsBoolean()
  autoSlug: boolean;

  @IsOptional()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  ids: string[];

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsNumber()
  costPrice?: number;

  @IsOptional()
  @IsNumber()
  purchasePrice?: number;

  @IsOptional()
  @IsNumber()
  salePrice?: number;

  @IsOptional()
  @IsNumber()
  regularPrice?: number;

  @IsOptional()
  @Type(() => Date)
  expiryDate?: Date;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  warranty?: string;
  @IsOptional()
  @IsString()
  returnPolicy?: string;

  @IsOptional()
  @IsString()
  exchangePolicy?: string;

  @IsOptional()
  @IsString()
  deliveryTime?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  category?: any;

  @IsOptional()
  subCategory?: any;

  @IsOptional()
  childCategory?: any;

  @IsOptional()
  brand?: any;

  @IsOptional()
  tags?: any;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsArray()
  specifications?: any[];

  @IsOptional()
  @IsBoolean()
  isVariation?: boolean;

  @IsOptional()
  @IsString()
  variation?: string;

  @IsOptional()
  @IsArray()
  variationOptions?: string[];

  @IsOptional()
  @IsString()
  variation2?: string;

  @IsOptional()
  @IsArray()
  variation2Options?: string[];

  @IsOptional()
  @IsArray()
  variationList?: any[];
}

export class DeleteProductDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  ids: string[];
}

export class GetProductByIdsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  ids: string[];
}

export class FilterAndPaginationProductDto {
  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterProductDto)
  filter: FilterProductDto;

  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterProductGroupDto)
  filterGroup: FilterProductGroupDto;

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

  @IsOptional()
  @IsString()
  vendor: string;

  @IsOptional()
  @IsString()
  shop: string;
}
