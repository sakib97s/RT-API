import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { OptionPayloadDto } from '../../../../dto/api-response.dto';
import { PaginationDto } from '../../../../dto/pagination.dto';

export class AddFileFolderDto {
  @IsOptional()
  @IsString()
  shop: string;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug: string;
}

export class InsertManyFileFolderDto {
  @Type(() => AddFileFolderDto)
  data: AddFileFolderDto[];

  option: OptionPayloadDto;
}

export class FilterFileFolderDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  status?: 'draft' | 'publish';
}

export class UpdateFileFolderDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  ids: string[];
}

export class FilterAndPaginationFileFolderDto {
  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterFileFolderDto)
  filter: FilterFileFolderDto;

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
