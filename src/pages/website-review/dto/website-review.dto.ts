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

export class AddWebsiteReviewDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  shop: string;

  @IsOptional()
  @IsNumber()
  quantity: number;
}

export class InsertManyWebsiteReviewDto {
  @Type(() => AddWebsiteReviewDto)
  data: AddWebsiteReviewDto[];

  option: OptionPayloadDto;
}

export class FilterWebsiteReviewDto {
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

export class FilterWebsiteReviewGroupDto {
  @IsOptional()
  @IsBoolean()
  isGroup: boolean;

  @IsOptional()
  @IsBoolean()
  websiteReview: boolean;

  @IsOptional()
  @IsBoolean()
  subWebsiteReview: boolean;
}

export class OptionWebsiteReviewDto {
  @IsOptional()
  @IsBoolean()
  deleteMany: boolean;
}

export class UpdateWebsiteReviewDto {
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

export class DeleteWebsiteReviewDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  ids: string[];
}

export class GetWebsiteReviewByIdsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  ids: string[];
}

export class FilterAndPaginationWebsiteReviewDto {
  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterWebsiteReviewDto)
  filter: FilterWebsiteReviewDto;

  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterWebsiteReviewGroupDto)
  filterGroup: FilterWebsiteReviewGroupDto;

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
