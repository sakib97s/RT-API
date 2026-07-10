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

export class AddSubCategoryDto {
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

export class InsertManySubCategoryDto {
  @Type(() => AddSubCategoryDto)
  data: AddSubCategoryDto[];

  option: OptionPayloadDto;
}

export class FilterSubCategoryDto {
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

export class FilterSubCategoryGroupDto {
  @IsOptional()
  @IsBoolean()
  isGroup: boolean;

  @IsOptional()
  @IsBoolean()
  subCategory: boolean;

  @IsOptional()
  @IsBoolean()
  subSubCategory: boolean;

  @IsOptional()
  @IsBoolean()
  brand: boolean;
}

export class OptionSubCategoryDto {
  @IsOptional()
  @IsBoolean()
  deleteMany: boolean;
}

export class UpdateSubCategoryDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  status: string;
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

export class DeleteSubCategoryDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  ids: string[];
}

export class GetSubCategoryByIdsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  ids: string[];
}

export class FilterAndPaginationSubCategoryDto {
  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterSubCategoryDto)
  filter: FilterSubCategoryDto;

  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterSubCategoryGroupDto)
  filterGroup: FilterSubCategoryGroupDto;

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
