import { IsBoolean, IsOptional } from 'class-validator';

export class ErrorPayloadDto {
  statusCode: number;

  message: string;

  error: string[];
}

export class PayloadObjectDto {
  message: string;

  success: boolean;

  data: any;
}

export class PayloadObjectArrayDto {
  message: string;

  success: boolean;

  data: any[];
}

export class PayloadMultipleIdDto {
  ids: any[];
}

export class ConflictPayloadDto {
  statusCode: number;

  message: string;

  error: string;
}

export class OptionPayloadDto {
  @IsOptional()
  @IsBoolean()
  deleteMany: boolean;
}
