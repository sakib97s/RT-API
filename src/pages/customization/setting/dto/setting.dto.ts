import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
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

export class RewardPointSettingsDto {
  @IsOptional()
  @IsBoolean()
  isEnableRewardPoint?: boolean;

  @IsOptional()
  @IsNumber()
  rewardPointValue?: number;

  @IsOptional()
  @IsNumber()
  rewardPointCurrency?: number;

  @IsOptional()
  @IsNumber()
  conversionRate?: number;

  @IsOptional()
  @IsBoolean()
  usePercentageBasedRewardPoints?: boolean;

  @IsOptional()
  @IsNumber()
  rewardPointPercentage?: number;

  @IsOptional()
  @IsString()
  calculationMethod?: string;

  @IsOptional()
  @IsNumber()
  exampleSalePrice?: number;
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

  @IsOptional()
  @ValidateNested()
  @Type(() => RewardPointSettingsDto)
  rewardPointSettings?: RewardPointSettingsDto;

  @IsOptional()
  @IsObject()
  productSetting?: any;

  @IsOptional()
  @IsObject()
  brandsPage?: {
    title?: string;
    description?: string;
    bannerImage?: string;
    bannerAlt?: string;
  };

  @IsOptional()
  @IsBoolean()
  defaultUserHasAccess?: boolean;

  @IsOptional()
  @IsBoolean()
  allowUserPhoneChange?: boolean;

  @IsOptional()
  @IsBoolean()
  userPhoneChangeRequireOtp?: boolean;

  @IsOptional()
  @IsBoolean()
  allowUserEmailChange?: boolean;

  @IsOptional()
  @IsBoolean()
  userEmailChangeRequireOtp?: boolean;

  @IsOptional()
  @IsObject()
  diamondOffer?: {
    isEnableDiamondOffer?: boolean;
    isEnableOnLandingPage?: boolean;
    threshold?: number;
    notificationText?: string;
    cartNotificationText?: string;
    confirmationMessage?: string;
    diamondMessage?: string;
    normalMessage?: string;
    startDate?: string;
    endDate?: string;
    logo?: string;
    title?: string;
  };

  @IsOptional()
  @IsArray()
  themeViewSettings?: Array<{
    type?: string;
    value?: string[];
  }>;

  @IsOptional()
  @IsObject()
  appliedDemoThemeDesign?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  bizmation?: {
    isEnable?: boolean;
    inventoryId?: number;
    apiAccessToken?: string;
  };
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

export class UpdateGlobalCheckoutDto {
  @IsBoolean()
  enabled: boolean;

  @IsIn(['disabled', 'dry-run', 'live'])
  mode: 'disabled' | 'dry-run' | 'live';

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(0)
  @ArrayMaxSize(6)
  allowedMarkets: string[];

  @IsOptional()
  @IsString()
  confirmationText?: string;
}

export class GlobalShippingRateDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  name: string;

  @IsString()
  deliveryType: string;

  @IsNumber()
  amount: number;

  @IsString()
  currencyCode: string;

  @IsBoolean()
  enabled: boolean;

  @IsOptional()
  @IsString()
  estimatedDelivery?: string;
}

export class UpdateGlobalShippingDto {
  @IsBoolean()
  enabled: boolean;

  @IsIn(['disabled', 'flat-rate'])
  mode: 'disabled' | 'flat-rate';

  @IsString()
  marketCode: string;

  @IsString()
  currencyCode: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GlobalShippingRateDto)
  rates: GlobalShippingRateDto[];
}
