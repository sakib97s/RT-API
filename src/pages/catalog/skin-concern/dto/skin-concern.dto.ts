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

export class AddSkinConcernDto {
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

export class InsertManySkinConcernDto {
  @Type(() => AddSkinConcernDto)
  data: AddSkinConcernDto[];

  option: OptionPayloadDto;
}

export class FilterSkinConcernDto {
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

export class FilterSkinConcernGroupDto {
  @IsOptional()
  @IsBoolean()
  isGroup: boolean;

  @IsOptional()
  @IsBoolean()
  skinConcern: boolean;

  @IsOptional()
  @IsBoolean()
  subSkinConcern: boolean;
}

export class OptionSkinConcernDto {
  @IsOptional()
  @IsBoolean()
  deleteMany: boolean;
}

export class UpdateSkinConcernDto {
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

export class DeleteSkinConcernDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  ids: string[];
}

export class GetSkinConcernByIdsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  ids: string[];
}

export class FilterAndPaginationSkinConcernDto {
  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterSkinConcernDto)
  filter: FilterSkinConcernDto;

  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterSkinConcernGroupDto)
  filterGroup: FilterSkinConcernGroupDto;

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
