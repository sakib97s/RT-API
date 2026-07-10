import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { OptionPayloadDto } from '../../../../dto/api-response.dto';
import { PaginationDto } from '../../../../dto/pagination.dto';
import { FileType } from '../../../../types/all-data-types.type';

export class AddGalleryDto {
  @IsNotEmpty()
  @IsString()
  shop: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  folder: string;

  @IsOptional()
  @IsNumber()
  size: number;

  @IsOptional()
  @IsString()
  status?: FileType;
}

export class InsertManyGalleryDto {
  @Type(() => AddGalleryDto)
  data: AddGalleryDto[];

  option: OptionPayloadDto;
}

export class FilterGalleryDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  status?: 'draft' | 'publish';
}

export class UpdateGalleryDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  folder: string;

  @IsOptional()
  @IsNumber()
  size: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  ids: string[];
}

export class FilterAndPaginationGalleryDto {
  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterGalleryDto)
  filter: FilterGalleryDto;

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
