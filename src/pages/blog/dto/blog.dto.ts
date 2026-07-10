import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray, IsBoolean,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OptionPayloadDto } from '../../../dto/api-response.dto';
import { PaginationDto } from '../../../dto/pagination.dto';

export class AddBlogDto {
  @IsNotEmpty()
  @IsString()
  shop: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  slug: string;

  @IsOptional()
  images: string;

  @IsOptional()
  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  urlType: string;

  @IsOptional()
  @IsString()
  status: any;

  @IsOptional()
  priority: number;


  @IsOptional()
  autoSlug: boolean;
}

export class InsertManyBlogDto {
  @Type(() => AddBlogDto)
  data: AddBlogDto[];

  option: OptionPayloadDto;
}

export class GetBlogByIdsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  ids: string[];
}

export class FilterBlogDto {
  @IsOptional()
  @IsString()
  title: string;
}

export class UpdateBlogDto {
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
  status: any;

  @IsOptional()
  priority: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  ids: string[];

  @IsOptional()
  @IsString()
  slug: string;

  @IsOptional()
  @IsBoolean()
  autoSlug: boolean;

}

export class FilterAndPaginationBlogDto {
  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterBlogDto)
  filter: FilterBlogDto;

  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterBlogDto)
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

export class DeleteBlogDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  ids: string[];
}
