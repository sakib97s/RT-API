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

export class AddShopInformationDto {
  @IsNotEmpty()
  @IsString()
  siteName: string;

  @IsNotEmpty()
  @IsString()
  shop: string;
}

export class InsertManyShopInformationDto {
  @Type(() => AddShopInformationDto)
  data: AddShopInformationDto[];

  option: OptionPayloadDto;
}

export class FilterShopInformationDto {
  @IsOptional()
  @IsString()
  siteName: string;

  @IsOptional()
  @IsString()
  status?: 'draft' | 'publish';
}

export class UpdateShopInformationDto {
  @IsOptional()
  @IsString()
  siteName: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  ids: string[];
}

export class FilterAndPaginationShopInformationDto {
  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterShopInformationDto)
  filter: FilterShopInformationDto;

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
