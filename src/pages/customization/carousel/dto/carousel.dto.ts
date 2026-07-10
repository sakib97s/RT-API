import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsMongoId,
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

export class AddCarouselDto {
  @IsNotEmpty()
  @IsMongoId({ message: 'Invalid id' })
  shop: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  type: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images: string;

  @IsOptional()
  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  urlType: string;

  @IsOptional()
  @IsString()
  status?: any;

  @IsOptional()
  priority: number;
}

export class InsertManyCarouselDto {
  @Type(() => AddCarouselDto)
  data: AddCarouselDto[];

  option: OptionPayloadDto;
}

export class GetCarouselByIdsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  ids: string[];
}

export class FilterCarouselDto {
  @IsOptional()
  @IsString()
  title: string;
}

export class UpdateCarouselDto {
  @IsOptional()
  @IsString()
  title: string;

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
  status?: any;

  @IsOptional()
  priority: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  ids: string[];
}

export class FilterAndPaginationCarouselDto {
  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterCarouselDto)
  filter: FilterCarouselDto;

  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterCarouselDto)
  filterGroup: any;

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

export class DeleteCarouselDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  ids: string[];
}
