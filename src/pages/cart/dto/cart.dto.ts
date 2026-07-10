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

export class AddCartDto {
  @IsNotEmpty()
  @IsString()
  product: string;

  @IsOptional()
  variation: any;

  @IsNotEmpty()
  @IsNumber()
  selectedQty: number;
}

export class InsertManyCartDto {
  @Type(() => AddCartDto)
  data: AddCartDto[];

  option: OptionPayloadDto;
}

export class FilterCartDto {
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

export class OptionCartDto {
  @IsOptional()
  @IsBoolean()
  deleteMany: boolean;
}

export class DeleteCartDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  ids: string[];
}

export class UpdateCartDto {
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

export class UpdateCartQty {
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

export class FilterAndPaginationCartDto {
  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterCartDto)
  filter: FilterCartDto;

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
