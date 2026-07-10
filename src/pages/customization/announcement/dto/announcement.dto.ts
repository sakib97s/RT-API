import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { OptionPayloadDto } from '../../../../dto/api-response.dto';
import { PaginationDto } from '../../../../dto/pagination.dto';
import { StatusType } from '../../../../types/all-data-types.type';

export class AddAnnouncementDto {
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
  priority: number;
}

export class InsertManyAnnouncementDto {
  @Type(() => AddAnnouncementDto)
  data: AddAnnouncementDto[];

  option: OptionPayloadDto;
}

export class FilterAnnouncementDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  status?: 'draft' | 'publish';
}

export class UpdateAnnouncementDto {
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

export class FilterAndPaginationAnnouncementDto {
  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterAnnouncementDto)
  filter: FilterAnnouncementDto;

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
