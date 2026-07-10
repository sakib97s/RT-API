import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Query,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { GtmService } from './gtm.service';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import {
  AddGtmThemePageViewDto,
  AddGtmThemeViewContentDto,
} from './dto/gtm.dto';
import { MongoIdValidationPipe } from '../../pipes/mongo-id-validation.pipe';

@Controller('gtag')
export class GtmController {
  private logger = new Logger(GtmController.name);

  constructor(private gtmService: GtmService) {}

  @Get('/get-ip')
  @UsePipes(ValidationPipe)
  async getIP(@Req() req: Request): Promise<ResponsePayload> {
    return await this.gtmService.getIP(req);
  }

  /**
   * Main
   * trackPageView()
   * trackViewContent()
   */

  @Post('/track-fb-event')
  @UsePipes(ValidationPipe)
  async trackPageView(
    @Req() req: Request,
    @Body() bodyData: any,
  ): Promise<ResponsePayload> {
    return await this.gtmService.trackFbEvent(req, bodyData);
  }
  /**
   * Main
   * trackThemePageView()
   * trackThemeViewContent()
   */

  @Post('/track-theme-page-view')
  @UsePipes(ValidationPipe)
  async trackThemePageView(
    @Req() req: Request,
    @Body() addGtmThemePageViewDto: AddGtmThemePageViewDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.gtmService.trackThemePageView(
      shop,
      req,
      addGtmThemePageViewDto,
    );
  }

  @Post('/track-theme-view-content')
  @UsePipes(ValidationPipe)
  async trackThemeViewContent(
    @Req() req: Request,
    @Body() addGtmThemeViewContentDto: AddGtmThemeViewContentDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.gtmService.trackThemeViewContent(
      shop,
      req,
      addGtmThemeViewContentDto,
    );
  }

  @Post('/track-theme-add-to-cart')
  @UsePipes(ValidationPipe)
  async trackThemeAddToCart(
    @Req() req: Request,
    @Body() bodyData: any,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.gtmService.trackThemeAddToCart(shop, req, bodyData);
  }

  @Post('/track-theme-initial-checkout')
  @UsePipes(ValidationPipe)
  async trackThemeInitialCheckout(
    @Req() req: Request,
    @Body() bodyData: any,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.gtmService.trackThemeInitialCheckout(shop, req, bodyData);
  }

  @Post('/track-theme-purchase')
  @UsePipes(ValidationPipe)
  async trackThemePurchase(
    @Req() req: Request,
    @Body() bodyData: any,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.gtmService.trackThemePurchase(shop, req, bodyData);
  }
}
