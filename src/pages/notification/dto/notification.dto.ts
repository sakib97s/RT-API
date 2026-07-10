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

import { StatusType } from '../../../types/all-data-types.type';
import { PaginationDto } from '../../../dto/pagination.dto';
import { OptionPayloadDto } from '../../../dto/api-response.dto';

export class AddNotificationDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  image: string;

  @IsOptional()
  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  urlType: string;

  @IsOptional()
  @IsString()
  status?: StatusType;

  @IsOptional()
  @IsNumber()
  priority: number;
}

export class InsertManyNotificationDto {
  @Type(() => AddNotificationDto)
  data: AddNotificationDto[];

  option: OptionPayloadDto;
}

export class FilterNotificationDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  status?: 'draft' | 'publish';
}

export class UpdateNotificationDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  image: string;

  @IsOptional()
  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  urlType: string;

  @IsOptional()
  @IsString()
  status?: StatusType;

  @IsOptional()
  priority: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  ids: string[];
}

export class FilterAndPaginationNotificationDto {
  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterNotificationDto)
  filter: FilterNotificationDto;

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
