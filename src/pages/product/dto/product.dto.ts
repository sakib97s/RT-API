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
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from 'src/dto/pagination.dto';

import { OptionPayloadDto } from 'src/dto/api-response.dto';
import {
  LocationDto,
  LanguageItemDto,
  HighlightDto,
  IncludeExcludeDto,
  TextItemDto,
  FAQDto,
  TimeSlotDto,
  ItineraryStopDto,
  ExtraServiceDto
} from './tour-sub-schemas.dto';

export class AddProductDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug: string;

  @IsOptional()
  @IsBoolean()
  autoSlug: boolean;

  @IsOptional()
  @IsString()
  shop: string;

  @IsOptional()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsNumber()
  costPrice?: number;

  @IsOptional()
  @IsNumber()
  purchasePrice?: number;

  @IsOptional()
  @IsNumber()
  salePrice?: number;

  @IsOptional()
  @IsNumber()
  regularPrice?: number;

  @IsOptional()
  @Type(() => Date)
  expiryDate?: Date;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  warranty?: string;
  @IsOptional()
  @IsString()
  returnPolicy?: string;

  @IsOptional()
  @IsString()
  exchangePolicy?: string;

  @IsOptional()
  @IsString()
  deliveryTime?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  category?: any;

  @IsOptional()
  subCategory?: any;

  @IsOptional()
  childCategory?: any;

  @IsOptional()
  brand?: any;

  @IsNotEmpty()
  @IsArray()
  @ArrayNotEmpty()
  tags?: any;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsArray()
  specifications?: any[];

  @IsOptional()
  @IsBoolean()
  isVariation?: boolean;

  @IsOptional()
  @IsString()
  variation?: string;

  @IsOptional()
  @IsArray()
  variationOptions?: string[];

  @IsOptional()
  @IsString()
  variation2?: string;

  @IsOptional()
  @IsArray()
  variation2Options?: string[];

  @IsOptional()
  @IsArray()
  variationList?: any[];

  // --- Tour / Experience Specific Fields ---
  @IsOptional() @IsString() productType?: string;
  @IsOptional() @IsString() bookingStatus?: string;
  @IsOptional() @IsBoolean() freeCancellation?: boolean;
  @IsOptional() @IsNumber() freeCancellationBeforeHours?: number;
  @IsOptional() @IsBoolean() nonRefundable?: boolean;
  @IsOptional() @IsBoolean() partialRefund?: boolean;
  @IsOptional() @IsNumber() refundPercentage?: number;
  @IsOptional() @IsString() scheduleType?: string;
  @IsOptional() @IsArray() @Type(() => Date) availableDates?: Date[];
  @IsOptional() @IsArray() @Type(() => Date) specialDates?: Date[];
  @IsOptional() @IsArray() @Type(() => Date) closedDates?: Date[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => TimeSlotDto) timeSlots?: TimeSlotDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => LocationDto) multipleMeetingPoints?: LocationDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => LocationDto) pickupLocations?: LocationDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => LocationDto) dropLocations?: LocationDto[];
  @IsOptional() @ValidateNested() @Type(() => LocationDto) routeStartLocation?: LocationDto;
  @IsOptional() @ValidateNested() @Type(() => LocationDto) routeEndLocation?: LocationDto;
  @IsOptional() @IsString() emergencyContact?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() whatsapp?: string;
  @IsOptional() @IsString() vendorId?: string;
  @IsOptional() @IsString() guideId?: string;
  @IsOptional() @IsString() operatorId?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => LanguageItemDto) languages?: LanguageItemDto[];
  @IsOptional() @IsNumber() durationValue?: number;
  @IsOptional() @IsString() durationUnit?: string;
  @IsOptional() @IsString() difficulty?: string;
  @IsOptional() @IsString() accessibility?: string;
  @IsOptional() @IsBoolean() pickupAvailable?: boolean;
  @IsOptional() @IsNumber() minimumAge?: number;
  @IsOptional() @IsNumber() maximumAge?: number;
  @IsOptional() @IsNumber() maximumParticipants?: number;
  @IsOptional() @IsBoolean() instantConfirmation?: boolean;
  @IsOptional() @IsBoolean() mobileTicket?: boolean;
  @IsOptional() @IsBoolean() skipTheLine?: boolean;
  @IsOptional() @IsBoolean() privateTour?: boolean;
  @IsOptional() @IsBoolean() smallGroup?: boolean;
  @IsOptional() @IsBoolean() wheelchairAccessible?: boolean;
  @IsOptional() @IsBoolean() petFriendly?: boolean;
  @IsOptional() @IsBoolean() outdoor?: boolean;
  @IsOptional() @IsBoolean() indoor?: boolean;
  @IsOptional() @IsString() priceType?: string;
  @IsOptional() @IsNumber() adultPrice?: number;
  @IsOptional() @IsNumber() youthPrice?: number;
  @IsOptional() @IsNumber() childPrice?: number;
  @IsOptional() @IsNumber() infantPrice?: number;
  @IsOptional() @IsNumber() seniorPrice?: number;
  @IsOptional() @IsNumber() groupPrice?: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsBoolean() taxIncluded?: boolean;
  @IsOptional() @IsNumber() bookingFee?: number;
  @IsOptional() @IsNumber() serviceCharge?: number;
  @IsOptional() @Type(() => Date) offerStartDate?: Date;
  @IsOptional() @Type(() => Date) offerEndDate?: Date;
  @IsOptional() @IsNumber() totalCapacity?: number;
  @IsOptional() @IsNumber() remainingCapacity?: number;
  @IsOptional() @IsNumber() reservedCapacity?: number;
  @IsOptional() @IsNumber() bookedCapacity?: number;
  @IsOptional() @IsBoolean() guideIncluded?: boolean;
  @IsOptional() @IsString() guideName?: string;
  @IsOptional() @IsString() guideType?: string;
  @IsOptional() @IsBoolean() certified?: boolean;
  @IsOptional() @IsString() thumbnail?: string;
  @IsOptional() @IsString() bannerImage?: string;
  @IsOptional() @IsString() coverImage?: string;
  @IsOptional() @IsString() mapImage?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) highlightImages?: string[];
  @IsOptional() @IsString() videoThumbnail?: string;
  @IsOptional() @IsString() threeSixtyTourUrl?: string;
  @IsOptional() @IsString() audioGuideUrl?: string;
  @IsOptional() @IsString() pdfUploadUrl?: string;
  @IsOptional() @IsString() imageAlt?: string;
  @IsOptional() @IsString() imageCaption?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => HighlightDto) highlights?: HighlightDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => IncludeExcludeDto) includes?: IncludeExcludeDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => IncludeExcludeDto) excludes?: IncludeExcludeDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => TextItemDto) importantInfo?: TextItemDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => TextItemDto) knowBeforeYouGo?: TextItemDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => FAQDto) faq?: FAQDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ItineraryStopDto) itineraryStops?: ItineraryStopDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ExtraServiceDto) extraServices?: ExtraServiceDto[];
  @IsOptional() @IsString() cancellationPolicy?: string;
  @IsOptional() @IsString() keyFeatures?: string;
  @IsOptional() @IsBoolean() trending?: boolean;
  @IsOptional() @IsBoolean() bestSeller?: boolean;
  @IsOptional() @IsBoolean() newArrival?: boolean;
  @IsOptional() @IsBoolean() recommended?: boolean;
  @IsOptional() @IsBoolean() homepage?: boolean;
  @IsOptional() @IsBoolean() visible?: boolean;
  @IsOptional() @IsBoolean() publish?: boolean;
  @IsOptional() @IsBoolean() draft?: boolean;
  @IsOptional() @IsBoolean() archived?: boolean;
  @IsOptional() @Type(() => Date) publishDate?: Date;
  @IsOptional() @Type(() => Date) expireDate?: Date;
  @IsOptional() @IsBoolean() schedulePublish?: boolean;
  @IsOptional() @IsBoolean() requireBooking?: boolean;
  @IsOptional() @IsBoolean() allowMultipleBooking?: boolean;
  @IsOptional() @IsNumber() minimumQuantity?: number;
  @IsOptional() @IsNumber() maximumQuantity?: number;
  @IsOptional() @IsString() bookingNotice?: string;
  @IsOptional() @IsString() availabilityType?: string;
  @IsOptional() @IsString() bookingCutoffTime?: string;
  @IsOptional() @IsNumber() wishlistCount?: number;
  @IsOptional() @IsNumber() shareCount?: number;
  @IsOptional() @IsNumber() clickCount?: number;
  @IsOptional() @IsNumber() conversionCount?: number;
  @IsOptional() @IsString() workflowStatus?: string;
  @IsOptional() @IsString() metaTitle?: string;
  @IsOptional() @IsString() metaDescription?: string;
  @IsOptional() @IsString() metaKeywords?: string;
  @IsOptional() @IsString() ogTitle?: string;
  @IsOptional() @IsString() ogDescription?: string;
  @IsOptional() @IsString() ogImage?: string;
  @IsOptional() @IsString() canonicalUrl?: string;
  @IsOptional() @IsString() robots?: string;
  @IsOptional() @IsString() twitterCard?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) relatedProducts?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) crossSell?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) upsell?: string[];
}

export class InsertManyProductDto {
  @Type(() => AddProductDto)
  data: AddProductDto[];

  option: OptionPayloadDto;
}

export class FilterProductDto {
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

  @IsOptional()
  @IsNumber()
  shop: any;
}

export class FilterProductGroupDto {
  @IsOptional()
  @IsBoolean()
  isGroup: boolean;

  @IsOptional()
  @IsBoolean()
  category: boolean;

  @IsOptional()
  @IsBoolean()
  subCategory: boolean;

  @IsOptional()
  @IsBoolean()
  brand: boolean;
}

export class OptionProductDto {
  @IsOptional()
  @IsBoolean()
  deleteMany: boolean;
}

export class UpdateProductDto {
  @IsOptional() @IsNumber() version?: number;
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  slug: string;

  @IsOptional()
  @IsBoolean()
  autoSlug: boolean;

  @IsOptional()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  ids: string[];

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsNumber()
  costPrice?: number;

  @IsOptional()
  @IsNumber()
  purchasePrice?: number;

  @IsOptional()
  @IsNumber()
  salePrice?: number;

  @IsOptional()
  @IsNumber()
  regularPrice?: number;

  @IsOptional()
  @Type(() => Date)
  expiryDate?: Date;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  warranty?: string;
  @IsOptional()
  @IsString()
  returnPolicy?: string;

  @IsOptional()
  @IsString()
  exchangePolicy?: string;

  @IsOptional()
  @IsString()
  deliveryTime?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  category?: any;

  @IsOptional()
  subCategory?: any;

  @IsOptional()
  childCategory?: any;

  @IsOptional()
  brand?: any;

  @IsOptional()
  tags?: any;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsArray()
  specifications?: any[];

  @IsOptional()
  @IsBoolean()
  isVariation?: boolean;

  @IsOptional()
  @IsString()
  variation?: string;

  @IsOptional()
  @IsArray()
  variationOptions?: string[];

  @IsOptional()
  @IsString()
  variation2?: string;

  @IsOptional()
  @IsArray()
  variation2Options?: string[];

  @IsOptional()
  @IsArray()
  variationList?: any[];

  // --- Tour / Experience Specific Fields ---
  @IsOptional() @IsString() productType?: string;
  @IsOptional() @IsString() bookingStatus?: string;
  @IsOptional() @IsBoolean() freeCancellation?: boolean;
  @IsOptional() @IsNumber() freeCancellationBeforeHours?: number;
  @IsOptional() @IsBoolean() nonRefundable?: boolean;
  @IsOptional() @IsBoolean() partialRefund?: boolean;
  @IsOptional() @IsNumber() refundPercentage?: number;
  @IsOptional() @IsString() scheduleType?: string;
  @IsOptional() @IsArray() @Type(() => Date) availableDates?: Date[];
  @IsOptional() @IsArray() @Type(() => Date) specialDates?: Date[];
  @IsOptional() @IsArray() @Type(() => Date) closedDates?: Date[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => TimeSlotDto) timeSlots?: TimeSlotDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => LocationDto) multipleMeetingPoints?: LocationDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => LocationDto) pickupLocations?: LocationDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => LocationDto) dropLocations?: LocationDto[];
  @IsOptional() @ValidateNested() @Type(() => LocationDto) routeStartLocation?: LocationDto;
  @IsOptional() @ValidateNested() @Type(() => LocationDto) routeEndLocation?: LocationDto;
  @IsOptional() @IsString() emergencyContact?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() whatsapp?: string;
  @IsOptional() @IsString() vendorId?: string;
  @IsOptional() @IsString() guideId?: string;
  @IsOptional() @IsString() operatorId?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => LanguageItemDto) languages?: LanguageItemDto[];
  @IsOptional() @IsNumber() durationValue?: number;
  @IsOptional() @IsString() durationUnit?: string;
  @IsOptional() @IsString() difficulty?: string;
  @IsOptional() @IsString() accessibility?: string;
  @IsOptional() @IsBoolean() pickupAvailable?: boolean;
  @IsOptional() @IsNumber() minimumAge?: number;
  @IsOptional() @IsNumber() maximumAge?: number;
  @IsOptional() @IsNumber() maximumParticipants?: number;
  @IsOptional() @IsBoolean() instantConfirmation?: boolean;
  @IsOptional() @IsBoolean() mobileTicket?: boolean;
  @IsOptional() @IsBoolean() skipTheLine?: boolean;
  @IsOptional() @IsBoolean() privateTour?: boolean;
  @IsOptional() @IsBoolean() smallGroup?: boolean;
  @IsOptional() @IsBoolean() wheelchairAccessible?: boolean;
  @IsOptional() @IsBoolean() petFriendly?: boolean;
  @IsOptional() @IsBoolean() outdoor?: boolean;
  @IsOptional() @IsBoolean() indoor?: boolean;
  @IsOptional() @IsString() priceType?: string;
  @IsOptional() @IsNumber() adultPrice?: number;
  @IsOptional() @IsNumber() youthPrice?: number;
  @IsOptional() @IsNumber() childPrice?: number;
  @IsOptional() @IsNumber() infantPrice?: number;
  @IsOptional() @IsNumber() seniorPrice?: number;
  @IsOptional() @IsNumber() groupPrice?: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsBoolean() taxIncluded?: boolean;
  @IsOptional() @IsNumber() bookingFee?: number;
  @IsOptional() @IsNumber() serviceCharge?: number;
  @IsOptional() @Type(() => Date) offerStartDate?: Date;
  @IsOptional() @Type(() => Date) offerEndDate?: Date;
  @IsOptional() @IsNumber() totalCapacity?: number;
  @IsOptional() @IsNumber() remainingCapacity?: number;
  @IsOptional() @IsNumber() reservedCapacity?: number;
  @IsOptional() @IsNumber() bookedCapacity?: number;
  @IsOptional() @IsBoolean() guideIncluded?: boolean;
  @IsOptional() @IsString() guideName?: string;
  @IsOptional() @IsString() guideType?: string;
  @IsOptional() @IsBoolean() certified?: boolean;
  @IsOptional() @IsString() thumbnail?: string;
  @IsOptional() @IsString() bannerImage?: string;
  @IsOptional() @IsString() coverImage?: string;
  @IsOptional() @IsString() mapImage?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) highlightImages?: string[];
  @IsOptional() @IsString() videoThumbnail?: string;
  @IsOptional() @IsString() threeSixtyTourUrl?: string;
  @IsOptional() @IsString() audioGuideUrl?: string;
  @IsOptional() @IsString() pdfUploadUrl?: string;
  @IsOptional() @IsString() imageAlt?: string;
  @IsOptional() @IsString() imageCaption?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => HighlightDto) highlights?: HighlightDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => IncludeExcludeDto) includes?: IncludeExcludeDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => IncludeExcludeDto) excludes?: IncludeExcludeDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => TextItemDto) importantInfo?: TextItemDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => TextItemDto) knowBeforeYouGo?: TextItemDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => FAQDto) faq?: FAQDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ItineraryStopDto) itineraryStops?: ItineraryStopDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ExtraServiceDto) extraServices?: ExtraServiceDto[];
  @IsOptional() @IsString() cancellationPolicy?: string;
  @IsOptional() @IsString() keyFeatures?: string;
  @IsOptional() @IsBoolean() trending?: boolean;
  @IsOptional() @IsBoolean() bestSeller?: boolean;
  @IsOptional() @IsBoolean() newArrival?: boolean;
  @IsOptional() @IsBoolean() recommended?: boolean;
  @IsOptional() @IsBoolean() homepage?: boolean;
  @IsOptional() @IsBoolean() visible?: boolean;
  @IsOptional() @IsBoolean() publish?: boolean;
  @IsOptional() @IsBoolean() draft?: boolean;
  @IsOptional() @IsBoolean() archived?: boolean;
  @IsOptional() @Type(() => Date) publishDate?: Date;
  @IsOptional() @Type(() => Date) expireDate?: Date;
  @IsOptional() @IsBoolean() schedulePublish?: boolean;
  @IsOptional() @IsBoolean() requireBooking?: boolean;
  @IsOptional() @IsBoolean() allowMultipleBooking?: boolean;
  @IsOptional() @IsNumber() minimumQuantity?: number;
  @IsOptional() @IsNumber() maximumQuantity?: number;
  @IsOptional() @IsString() bookingNotice?: string;
  @IsOptional() @IsString() availabilityType?: string;
  @IsOptional() @IsString() bookingCutoffTime?: string;
  @IsOptional() @IsNumber() wishlistCount?: number;
  @IsOptional() @IsNumber() shareCount?: number;
  @IsOptional() @IsNumber() clickCount?: number;
  @IsOptional() @IsNumber() conversionCount?: number;
  @IsOptional() @IsString() workflowStatus?: string;
  @IsOptional() @IsString() metaTitle?: string;
  @IsOptional() @IsString() metaDescription?: string;
  @IsOptional() @IsString() metaKeywords?: string;
  @IsOptional() @IsString() ogTitle?: string;
  @IsOptional() @IsString() ogDescription?: string;
  @IsOptional() @IsString() ogImage?: string;
  @IsOptional() @IsString() canonicalUrl?: string;
  @IsOptional() @IsString() robots?: string;
  @IsOptional() @IsString() twitterCard?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) relatedProducts?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) crossSell?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) upsell?: string[];
}

export class DeleteProductDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  ids: string[];
}

export class GetProductByIdsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  ids: string[];
}

export class FilterAndPaginationProductDto {
  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterProductDto)
  filter: FilterProductDto;

  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterProductGroupDto)
  filterGroup: FilterProductGroupDto;

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

  @IsOptional()
  @IsString()
  shop: string;
}
