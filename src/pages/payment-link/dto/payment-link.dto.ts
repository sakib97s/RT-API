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

export class AddPaymentLinkDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug: string;

  @IsNotEmpty()
  @IsString()
  shop: string;

  @IsOptional()
  @IsNumber()
  quantity: number;
}

export class InsertManyPaymentLinkDto {
  @Type(() => AddPaymentLinkDto)
  data: AddPaymentLinkDto[];

  option: OptionPayloadDto;
}

export class FilterPaymentLinkDto {
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
}

export class FilterPaymentLinkGroupDto {
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

export class OptionPaymentLinkDto {
  @IsOptional()
  @IsBoolean()
  deleteMany: boolean;
}

export class UpdatePaymentLinkDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  slug: string;

  @IsOptional()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  ids: string[];
}

export class DeletePaymentLinkDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  ids: string[];
}

export class GetPaymentLinkByIdsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  ids: string[];
}

export class FilterAndPaginationPaymentLinkDto {
  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterPaymentLinkDto)
  filter: FilterPaymentLinkDto;

  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterPaymentLinkGroupDto)
  filterGroup: FilterPaymentLinkGroupDto;

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
}
