import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ParticipantTypeDto {
  @IsOptional() @IsString() participantName?: string;
  @IsOptional() @IsNumber() ageFrom?: number;
  @IsOptional() @IsNumber() ageTo?: number;
  @IsOptional() @IsNumber() basePrice?: number;
  @IsOptional() @IsNumber() salePrice?: number;
  @IsOptional() @IsNumber() tax?: number;
  @IsOptional() @IsNumber() maxQuantity?: number;
  @IsOptional() @IsNumber() minQuantity?: number;
  @IsOptional() @IsNumber() capacity?: number;
  @IsOptional() @IsNumber() remainingSeat?: number;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsBoolean() defaultSelected?: boolean;
}

export class LocationDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
  @IsOptional() @IsString() googleMapUrl?: string;
  @IsOptional() @IsString() instructions?: string;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsBoolean() primaryMeetingPoint?: boolean;
  @IsOptional() @IsBoolean() pickupAvailable?: boolean;
  @IsOptional() @IsBoolean() dropoffAvailable?: boolean;
  @IsOptional() @IsNumber() sortOrder?: number;
}

export class LanguageItemDto {
  @IsOptional() @IsString() language?: string;
  @IsOptional() @IsBoolean() audioGuide?: boolean;
  @IsOptional() @IsBoolean() liveGuide?: boolean;
  @IsOptional() @IsBoolean() included?: boolean;
}

export class HighlightDto {
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() subtitle?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
}

export class IncludeExcludeDto {
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
}

export class TextItemDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() text?: string;
  @IsOptional() @IsBoolean() warning?: boolean;
  @IsOptional() @IsNumber() priority?: number;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
}

export class FAQDto {
  @IsOptional() @IsString() question?: string;
  @IsOptional() @IsString() answer?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
  @IsOptional() @IsBoolean() expanded?: boolean;
}

export class TimeSlotDto {
  @IsOptional() @IsString() startTime?: string;
  @IsOptional() @IsString() endTime?: string;
  @IsOptional() @IsString() duration?: string;
  @IsOptional() @IsNumber() capacity?: number;
  @IsOptional() @IsNumber() maximumCapacity?: number;
  @IsOptional() @IsNumber() remainingCapacity?: number;
  @IsOptional() @IsNumber() adultPrice?: number;
  @IsOptional() @IsNumber() childPrice?: number;
  @IsOptional() @IsNumber() infantPrice?: number;
  @IsOptional() @IsNumber() priceOverride?: number;
  @IsOptional() @IsString() guideName?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() bookingCutoff?: string;
  @IsOptional() @IsNumber() bookingLimit?: number;
  @IsOptional() @IsString() color?: string;
}

export class BookingDateDto {
  @IsOptional() @Type(() => Date) date?: Date;
  @IsOptional() @IsString() dateString?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => TimeSlotDto) timeSlots?: TimeSlotDto[];
}

export class ItineraryStopDto {
  @IsOptional() @IsNumber() stopNumber?: number;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() stopName?: string;
  @IsOptional() @IsString() shortDescription?: string;
  @IsOptional() @IsString() fullDescription?: string;
  @IsOptional() @IsString() longDescription?: string;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
  @IsOptional() @IsString() googleMapUrl?: string;
  @IsOptional() @IsString() arrivalTime?: string;
  @IsOptional() @IsString() departureTime?: string;
  @IsOptional() @IsString() duration?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
}

export class ExtraServiceDto {
  @IsOptional() @IsString() serviceType?: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsNumber() price?: number;
  @IsOptional() @IsString() description?: string;
}

export class SeasonalDateDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @Type(() => Date) startDate?: Date;
  @IsOptional() @Type(() => Date) endDate?: Date;
  @IsOptional() @IsNumber() priceMultiplier?: number;
}

export class RecurringDateDto {
  @IsOptional() @IsString() frequency?: string;
  @IsOptional() @IsArray() @IsNumber({}, { each: true }) daysOfWeek?: number[];
  @IsOptional() @IsString() recurringRule?: string;
}
