import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

/**
 * Generic TikTok event DTO for theme events.
 * Frontend এবং backend দু’টোতেই একই eventId ব্যবহার করে deduplication করা যাবে।
 */
export class TrackTiktokEventDto {
  @IsNotEmpty()
  @IsString()
  event: string; // e.g. 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase'

  @IsNotEmpty()
  @IsString()
  eventId: string;

  @IsOptional()
  @IsString()
  timestamp?: string; // ISO string, optional; না দিলে backend current time নেবে

  // User identifiers (raw, backend এ hash করবে)
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNo?: string;

  @IsOptional()
  @IsString()
  externalId?: string;

  @IsOptional()
  @IsString()
  ttclid?: string;

  @IsOptional()
  @IsString()
  ttp?: string;

  // Event properties
  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsArray()
  contents?: any[];

  @IsOptional()
  @IsObject()
  customProperties?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  testEvent?: boolean;
}
