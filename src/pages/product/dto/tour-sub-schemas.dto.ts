import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class LocationDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
  @IsOptional() @IsString() googleMapUrl?: string;
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
  @IsOptional() @IsNumber() sortOrder?: number;
}

export class TextItemDto {
  @IsOptional() @IsString() text?: string;
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
  @IsOptional() @IsNumber() maximumCapacity?: number;
  @IsOptional() @IsNumber() remainingCapacity?: number;
}

export class ItineraryStopDto {
  @IsOptional() @IsNumber() stopNumber?: number;
  @IsOptional() @IsString() stopName?: string;
  @IsOptional() @IsString() shortDescription?: string;
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
