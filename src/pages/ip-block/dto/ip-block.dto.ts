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
import { OptionPayloadDto } from '../../../dto/api-response.dto';
import { PaginationDto } from '../../../dto/pagination.dto';


export class AddIpBlockDto {
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
}

export class InsertManyIpBlockDto {
  @Type(() => AddIpBlockDto)
  data: AddIpBlockDto[];

  option: OptionPayloadDto;
}

export class GetIpBlockByIdsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  ids: string[];
}

export class FilterIpBlockDto {
  @IsOptional()
  @IsString()
  title: string;
}

export class UpdateIpBlockDto {
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
}

export class FilterAndPaginationIpBlockDto {
  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterIpBlockDto)
  filter: FilterIpBlockDto;

  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterIpBlockDto)
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

export class DeleteIpBlockDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  ids: string[];
}
