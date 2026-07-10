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

import { OptionPayloadDto } from 'src/dto/api-response.dto';
import { StatusType } from '../../../types/all-data-types.type';
import { PaginationDto } from '../../../dto/pagination.dto';

export class AddSupportDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  status?: StatusType;
}

export class InsertManySupportDto {
  @Type(() => AddSupportDto)
  data: AddSupportDto[];

  option: OptionPayloadDto;
}

export class FilterSupportDto {
  @IsOptional()
  @IsString()
  name: string;
}

export class OptionSupportDto {
  @IsOptional()
  @IsBoolean()
  deleteMany: boolean;
}

export class UpdateSupportDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  status?: 'draft' | 'publish';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  ids: string[];
}

export class FilterAndPaginationSupportDto {
  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterSupportDto)
  filter: FilterSupportDto;

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
