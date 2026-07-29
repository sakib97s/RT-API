import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request } from 'express';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { Setting } from '../customization/setting/interface/setting.interface';
import { UtilsService } from '../../shared/utils/utils.service';
import { TrackTiktokEventDto } from './dto/track-tiktok-event.dto';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';

import * as crypto from 'crypto';

@Injectable()
export class TiktokService {
  private logger = new Logger(TiktokService.name);

  constructor(
    @InjectModel('Setting')
    private readonly settingModel: Model<Setting>,
    private readonly utilsService: UtilsService,
    private readonly httpService: HttpService,
  ) {}

  private hashSha256(value?: string): string | undefined {
    if (!value) return undefined;
    return crypto
      .createHash('sha256')
      .update(value.trim().toLowerCase())
      .digest('hex');
  }

  /**
   * Main entry for Theme TikTok events (server-side)
   * Matches Facebook CAPI trackTheme* methods pattern
   * Uses latest TikTok Events API v1.3 structure
   */
  async trackThemeEvent(
    shop: string,
    req: Request,
    body: TrackTiktokEventDto,
  ): Promise<ResponsePayload> {
    try {
      const fSetting = await this.settingModel
        .findOne({ shop })
        .select('analytics');

      const analytics = fSetting?.analytics;
      if (!analytics?.tiktokPixelId || !analytics?.tiktokAccessToken) {
        return {
          success: false,
          message: 'TikTok Pixel is not configured for this shop',
        } as ResponsePayload;
      }

      const clientIpAddress = this.utilsService.getClientIp(req) || undefined;
      const clientUserAgent =
        (req.headers['user-agent'] as string) || undefined;

      const hostname = req.hostname || '';

      // Hash user identifiers (SHA-256, lowercase, trimmed)
      const hashedEmail = this.hashSha256(body.email);
      const hashedPhone = this.hashSha256(body.phoneNo);
      const hashedExternal = this.hashSha256(body.externalId);

      // Event time in Unix seconds (same as Facebook CAPI)
      const eventTimeSeconds = body.timestamp
        ? Math.floor(new Date(body.timestamp).getTime() / 1000)
        : Math.floor(Date.now() / 1000);

      // Build user object (matches TikTok Events API structure)
      const user: any = {};
      if (hashedEmail) user.email = hashedEmail;
      if (hashedPhone) user.phone_number = hashedPhone;
      if (hashedExternal) user.external_id = hashedExternal;
      if (body.ttclid) user.ttclid = body.ttclid;
      if (body.ttp) user.ttp = body.ttp;
      if (clientIpAddress) user.ip = clientIpAddress;
      if (clientUserAgent) user.user_agent = clientUserAgent;

      // Build properties object
      const properties: any = {};
      if (body.value !== undefined) properties.value = body.value;
      if (body.currency) properties.currency = body.currency || 'BDT';
      if (body.contents && body.contents.length > 0) {
        properties.contents = body.contents;
      }
      if (body.customProperties) {
        Object.assign(properties, body.customProperties);
      }

      // Build TikTok event object (latest API v1.3 structure)
      const tiktokEvent: any = {
        event: body.event,
        event_id: body.eventId,
        event_time: eventTimeSeconds,
        properties: properties,
        user: user,
      };

      // Build payload (matches latest TikTok Events API structure)
      const payload: any = {
        event_source: 'web',
        event_source_id: analytics.tiktokPixelId,
        data: [tiktokEvent],
      };

      // Optional: test event code for debugging in TikTok Events Manager
      if (analytics.isEnablePixelTestEvent && analytics.tiktokTestEventCode) {
        payload.test_event_code = analytics.tiktokTestEventCode;
      }

      const endpoint =
        'https://business-api.tiktok.com/open_api/v1.3/event/track/';

      const response = await firstValueFrom(
        this.httpService.post(endpoint, payload, {
          headers: {
            'Access-Token': analytics.tiktokAccessToken,
            'Content-Type': 'application/json',
          },
        }),
      );

      return {
        success: true,
        message: 'TikTok event tracked successfully',
      } as ResponsePayload;
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || error?.message || 'Unknown error';
      const errorCode =
        error?.response?.data?.code || error?.response?.status || 'N/A';

      this.logger.error(
        `TikTok Events API Error [${errorCode}]: ${errorMessage}`,
      );

      throw new InternalServerErrorException(error.message);
    }
  }
}
