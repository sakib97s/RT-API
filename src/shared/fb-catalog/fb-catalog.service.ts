import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FbCatalogService {
  private logger = new Logger(FbCatalogService.name);

  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService,
  ) { }

  /**
   * Facebook Catalog
   * addFbCatalogProduct()
   */
  public async addFbCatalogProduct(shop: string, data: any) {
    // const fbCatalogAccessToken = this.configService.get<string>(
    //   'fbCatalogAccessToken',
    // );
    // const fbCatalogId = this.configService.get<string>('fbCatalogId');
    const cdnUrlBase = this.configService.get<string>('cdnUrlBase');

    const apiUrl = `${cdnUrlBase}/upload/csv-upload`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(apiUrl, data, {
          params: { shop: shop },
        }),
      );
      // console.log("response.data",response);
      return response.data;
    } catch (error) {
      this.logger.error(
        'Failed to add product to Facebook Catalog',
        error.response?.data,
      );
      throw error;
    }
  }

  public async addFbCatalogProducts(shop: string) {
    const cdnUrlBase = this.configService.get<string>('cdnUrlBase'); // e.g., http://localhost:3013
    const apiUrl = `${cdnUrlBase}/upload/csv-product-upload`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(apiUrl, null, {
          // POST body = null
          params: { shop }, // Query param
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        'Failed to add product to Facebook Catalog',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  public async updateFbCatalogProduct(productId: string, data: any) {
    const fbCatalogAccessToken = this.configService.get<string>(
      'fbCatalogAccessToken',
    );
    const fbCatalogId = this.configService.get<string>('fbCatalogId');

    const fbApiUrl = `https://graph.facebook.com/v22.0/${fbCatalogId}/products/${productId}`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(fbApiUrl, data, {
          params: { access_token: fbCatalogAccessToken },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        'Failed to update product in Facebook Catalog',
        error.response?.data,
      );
      throw error;
    }
  }
}
