import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmptyObject,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { PaginationDto } from 'src/dto/pagination.dto';

export class SmsCustomMessagesDto {
  @IsOptional()
  @IsString()
  @MaxLength(320) // SMS can be up to 320 chars for long SMS
  orderPlaced?: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  orderConfirmed?: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  orderDelivered?: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  orderCanceled?: string;
}

export class AddSettingDto {
  @IsOptional()
  @IsString()
  shop: string;

  @IsOptional()
  @IsBoolean()
  needRebuild: boolean;

  @IsOptional()
  @IsObject()
  smsSendingOption?: {
    orderPlaced?: boolean;
    orderConfirmed?: boolean;
    orderDelivered?: boolean;
    orderCanceled?: boolean;
  };

  @IsOptional()
  @ValidateNested()
  @Type(() => SmsCustomMessagesDto)
  smsCustomMessages?: SmsCustomMessagesDto;
}

export class FilterSettingDto {
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

export class OptionSettingDto {
  @IsOptional()
  @IsBoolean()
  deleteMany: boolean;
}

export class UpdateSettingDto {
  @IsOptional()
  @IsNumber()
  deliveryInDhaka: number;

  @IsOptional()
  @IsNumber()
  deliveryOutsideDhaka: number;

  @IsOptional()
  @IsNumber()
  deliveryOutsideBD: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  ids: string[];
}

export class FilterAndPaginationSettingDto {
  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterSettingDto)
  filter: FilterSettingDto;

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
