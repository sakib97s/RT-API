import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AnalyticsService {
  private logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService,
  ) {}

  /**
   * Tracker
   * trackFbConversionEvent()
   */
  public async trackFbConversionEvent(data: any) {
    const fbPixelAccessToken =
      this.configService.get<string>('fbPixelAccessToken');
    const fbPixelId = this.configService.get<string>('fbPixelId');

    const fbEndpoint = `https://graph.facebook.com/v22.0/${fbPixelId}/events`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(fbEndpoint, data, {
          params: { access_token: fbPixelAccessToken },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        'Error forwarding event to Facebook Conversion API',
        error.stack,
      );
      throw error;
    }
  }

  public async trackFbConversionEventClient(
    fbPixelId: string,
    fbPixelAccessToken: string,
    data: any,
  ) {
    const fbEndpoint = `https://graph.facebook.com/v22.0/${fbPixelId}/events`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(fbEndpoint, data, {
          params: { access_token: fbPixelAccessToken },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        'Error forwarding event to Facebook Conversion API',
        error.stack,
      );
      throw error;
    }
  }
}
