import {
  Body,
  Controller,
  Post,
  Query,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { TiktokService } from './tiktok.service';
import { TrackTiktokEventDto } from './dto/track-tiktok-event.dto';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { MongoIdValidationPipe } from '../../pipes/mongo-id-validation.pipe';

@Controller('tiktok')
export class TiktokController {
  constructor(private readonly tiktokService: TiktokService) {}

  /**
   * Theme TikTok server-side tracking endpoint
   * Frontend থেকে event, eventId, value, currency, contents, user data পাঠানো হবে
   */
  @Post('/track-theme-event')
  @UsePipes(ValidationPipe)
  async trackThemeEvent(
    @Req() req: Request,
    @Body() dto: TrackTiktokEventDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return this.tiktokService.trackThemeEvent(shop, req, dto);
  }
}
