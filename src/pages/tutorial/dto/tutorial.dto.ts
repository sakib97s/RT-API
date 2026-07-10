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

export class AddTutorialDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  status?: StatusType;
}

export class InsertManyTutorialDto {
  @Type(() => AddTutorialDto)
  data: AddTutorialDto[];

  option: OptionPayloadDto;
}

export class FilterTutorialDto {
  @IsOptional()
  @IsString()
  name: string;
}

export class OptionTutorialDto {
  @IsOptional()
  @IsBoolean()
  deleteMany: boolean;
}

export class UpdateTutorialDto {
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

export class FilterAndPaginationTutorialDto {
  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterTutorialDto)
  filter: FilterTutorialDto;

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
