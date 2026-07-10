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

export class AddPaymentLinkHistoryDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug: string;

  @IsNotEmpty()
  @IsString()
  phoneNo: string;

  @IsOptional()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  sslDirect: string;

  @IsOptional()
  @IsString()
  shop: string;

  @IsOptional()
  @IsString()
  paymentLinkId: string;
}

export class InsertManyPaymentLinkHistoryDto {
  @Type(() => AddPaymentLinkHistoryDto)
  data: AddPaymentLinkHistoryDto[];

  option: OptionPayloadDto;
}

export class FilterPaymentLinkHistoryDto {
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

export class FilterPaymentLinkHistoryGroupDto {
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

export class OptionPaymentLinkHistoryDto {
  @IsOptional()
  @IsBoolean()
  deleteMany: boolean;
}

export class UpdatePaymentLinkHistoryDto {
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

export class DeletePaymentLinkHistoryDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  ids: string[];
}

export class GetPaymentLinkHistoryByIdsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  ids: string[];
}

export class FilterAndPaginationPaymentLinkHistoryDto {
  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterPaymentLinkHistoryDto)
  filter: FilterPaymentLinkHistoryDto;

  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterPaymentLinkHistoryGroupDto)
  filterGroup: FilterPaymentLinkHistoryGroupDto;

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
