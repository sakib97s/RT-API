import {
  Body,
  Controller,
  Logger,
  Post,
  Query, Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { OtpService } from './otp.service';
import { AddOtpDto, ValidateOtpDto } from './dto/otp.dto';
import { ResponsePayload } from '../../interfaces/response-payload.interface';
import { MongoIdValidationPipe } from '../../pipes/mongo-id-validation.pipe';

@Controller('otp')
export class OtpController {
  private logger = new Logger(OtpController.name);

  constructor(private otpService: OtpService) {}

  /**
   * addOtp
   * insertManyOtp
   */
  @Post('/generate-otp')
  @UsePipes(ValidationPipe)
  async generateOtpWithPhoneNo(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body()
    addOtpDto: AddOtpDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    const userIpAddress =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      null;
    return await this.otpService.generateOtpWithPhoneNo(shop, addOtpDto,userIpAddress);
  }

  @Post('/generate-otp-with-email')
  @UsePipes(ValidationPipe)
  async generateOtpWithEmail(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body()
    addOtpDto: AddOtpDto,
  ): Promise<ResponsePayload> {
    return await this.otpService.generateOtpWithEmail(shop, addOtpDto);
  }

  @Post('/validate-admin-otp')
  @UsePipes(ValidationPipe)
  async validateAdminOtpWithPhoneNo(
    @Body()
    validateOtpDto: ValidateOtpDto,
  ): Promise<ResponsePayload> {
    return await this.otpService.validateAdminOtpWithPhoneNo(validateOtpDto);
  }

  @Post('/validate-otp')
  @UsePipes(ValidationPipe)
  async validateOtpWithPhoneNoOrEmail(
    @Body()
    validateOtpDto: ValidateOtpDto,
  ): Promise<ResponsePayload> {
    return await this.otpService.validateOtpWithPhoneNoOrEmail(validateOtpDto);
  }

  @Post('/validate-otp-vendor')
  @UsePipes(ValidationPipe)
  async validateOtpWithUsername(
    @Body()
    validateOtpDto: ValidateOtpDto,
  ): Promise<ResponsePayload> {
    return await this.otpService.validateOtpWithUsername(validateOtpDto);
  }

  @Post('/validate-otp-affiliate')
  @UsePipes(ValidationPipe)
  async validateAffiliateOtpWithUsername(
    @Body()
    validateOtpDto: ValidateOtpDto,
  ): Promise<ResponsePayload> {
    return await this.otpService.validateAffiliateOtpWithUsername(
      validateOtpDto,
    );
  }

  @Post('/validate-otp-with-email')
  @UsePipes(ValidationPipe)
  async validateOtpWithEmail(
    @Body()
    validateOtpDto: ValidateOtpDto,
  ): Promise<ResponsePayload> {
    return await this.otpService.validateOtpWithEmail(validateOtpDto);
  }
}
