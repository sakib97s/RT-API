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

export class AddWishlistDto {
  @IsNotEmpty()
  @IsString()
  product: string;

  @IsNotEmpty()
  @IsNumber()
  selectedQty: number;
}

export class InsertManyWishlistDto {
  @Type(() => AddWishlistDto)
  data: AddWishlistDto[];

  option: OptionPayloadDto;
}

export class FilterWishlistDto {
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

export class OptionWishlistDto {
  @IsOptional()
  @IsBoolean()
  deleteMany: boolean;
}

export class DeleteWishlistDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  ids: string[];
}

export class UpdateWishlistDto {
  @IsOptional()
  @IsString()
  product: string;

  @IsOptional()
  @IsString()
  user: string;

  @IsOptional()
  @IsNumber()
  selectedQty: number;

  @IsOptional()
  @IsBoolean()
  isSelected: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  ids: string[];
}

export class UpdateWishlistQty {
  @IsOptional()
  @IsString()
  type: string;

  @IsOptional()
  @IsNumber()
  selectedQty: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  ids: string[];
}

export class FilterAndPaginationWishlistDto {
  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterWishlistDto)
  filter: FilterWishlistDto;

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
