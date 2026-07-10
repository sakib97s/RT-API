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

export class AddGtmPageViewDto {
  @IsNotEmpty()
  @IsString()
  eventId: string;

  @IsNotEmpty()
  @IsString()
  eventName: string;

  @IsOptional()
  @IsString()
  pageUrl: string;

  @IsOptional()
  @IsString()
  pageTitle: string;

  @IsOptional()
  @IsString()
  referrer: string;

  @IsOptional()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  phoneNo: string;
}

export class AddGtmViewContentDto {
  @IsNotEmpty()
  @IsString()
  eventId: string;

  @IsNotEmpty()
  @IsString()
  eventName: string;

  @IsOptional()
  @IsString()
  contentId: string;

  @IsOptional()
  @IsString()
  contentName: string;

  @IsOptional()
  @IsString()
  contentCategory: string;

  @IsOptional()
  @IsString()
  contentSubCategory: string;

  @IsOptional()
  @IsNumber()
  value: number;

  @IsOptional()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  currency: string;

  @IsOptional()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  phoneNo: string;
}

export class AddGtmThemePageViewDto {
  @IsOptional()
  @IsString()
  eventId: string;

  @IsOptional()
  @IsObject()
  user_data: any;

  @IsOptional()
  @IsString()
  eventName: string;

  @IsOptional()
  @IsString()
  pageUrl: string;

  @IsOptional()
  @IsString()
  pageTitle: string;

  @IsOptional()
  @IsString()
  referrer: string;

  @IsOptional()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  phoneNo: string;
}

export class AddGtmThemeViewContentDto {
  @IsOptional()
  @IsString()
  eventId: string;

  @IsOptional()
  @IsObject()
  user_data: any;

  @IsOptional()
  @IsString()
  eventName: string;

  @IsOptional()
  @IsString()
  contentId: string;

  @IsOptional()
  @IsString()
  contentName: string;

  @IsOptional()
  @IsString()
  contentCategory: string;

  @IsOptional()
  @IsString()
  contentSubCategory: string;

  @IsOptional()
  @IsNumber()
  value: number;

  @IsOptional()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  currency: string;

  @IsOptional()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  phoneNo: string;
}
