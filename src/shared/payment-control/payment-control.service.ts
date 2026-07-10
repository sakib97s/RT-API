import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ResponsePayload } from '../../interfaces/response-payload.interface';
import {
  BkashApiConfig,
  SslCommerzApiConfig,
  SslCommerzInit,
} from './interfaces/payment-control.interface';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PaymentControlService {
  private logger = new Logger(PaymentControlService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly http: HttpService,
  ) {}

  /**
   * BKASH PAYMENT BASED ON VENDOR WEBSITE
   * getBkashToken()
   * executeBkashPayment()
   * createBkashPayment()
   */

  private async getBkashToken(bkashApiConfig: BkashApiConfig): Promise<any> {
    try {
      const { username, password, appKey, appSecret, url } = bkashApiConfig;

      const httpReq = async () => {
        return new Promise((resolve, reject) => {
          this.http
            .post(
              `${url}/token/grant`,
              {
                app_key: appKey,
                app_secret: appSecret,
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  Accept: 'application/json',
                  username: username,
                  password: password,
                },
              },
            )
            .subscribe({
              next: (res) => {
                resolve(res);
              },
              error: (err) => {
                reject(err);
                console.log(err);
              },
            });
        });
      };

      const result = await httpReq();
      return result['data'];
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  public async executeBkashPayment(
    bkashApiConfig: BkashApiConfig,
  ): Promise<any> {
    try {
      const { appKey, paymentID, url } = bkashApiConfig;
      const token = await this.getBkashToken(bkashApiConfig);

      const httpReq = async () => {
        return new Promise((resolve, reject) => {
          this.http
            .post(
              `${url}/execute`,
              {
                paymentID: paymentID,
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  Accept: 'application/json',
                  authorization: token['id_token'],
                  'x-app-key': appKey,
                },
              },
            )
            .subscribe({
              next: (res) => {
                resolve(res);
              },
              error: (err) => {
                reject(err);
                console.log(err);
              },
            });
        });
      };

      const result = await httpReq();
      return result['data'];
    } catch (error) {
      console.warn(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async createBkashPayment(
    bkashApiConfig: BkashApiConfig,
  ): Promise<ResponsePayload> {
    try {
      const { url, appKey } = bkashApiConfig;
      const token = await this.getBkashToken(bkashApiConfig);

      const httpReq = async () => {
        return new Promise((resolve, reject) => {
          this.http
            .post(`${url}/create`, bkashApiConfig, {
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                authorization: token['id_token'],
                'x-app-key': appKey,
              },
            })
            .subscribe({
              next: (res) => {
                resolve(res);
              },
              error: (err) => {
                reject(err);
                console.log(err);
              },
            });
        });
      };

      const result = await httpReq();

      return {
        success: true,
        message: 'Success',
        data: result['data'],
      } as ResponsePayload;
    } catch (error) {
      console.warn(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * SSL COMMERZ PAYMENT BASED ON VENDOR WEBSITE
   * getBkashToken()
   * executeBkashPayment()
   * createBkashPayment()
   */

  private convertToFormData(data: SslCommerzInit): FormData {
    const formData = new FormData();
    for (const key in data) {
      formData.append(key, data[key] || '');
    }

    return formData;
  }

  async sslCommerzInit(data: SslCommerzInit) {
    const { baseUrl } = data;
    const url = `${baseUrl}/gwprocess/v4/api.php`;
    const formData = this.convertToFormData(data);
    const response = this.http.post(url, formData);
    return firstValueFrom(response).then((res) => res.data);
  }

  async validateSslCommerzPayment(data: SslCommerzInit): Promise<any> {
    // const { url } = data;
    // const queryUrl = `${this.validationURL}val_id=${data.val_id}&store_id=${this.storeId}&store_passwd=${this.storePassword}&v=1&format=json`;
    const response = this.http.get('');
    return firstValueFrom(response).then((res) => res.data);
  }

  async transactionQueryBySessionId(data: SslCommerzApiConfig): Promise<any> {
    const { baseUrl, store_id, store_passwd, sessionKey } = data;
    const url = `${baseUrl}/validator/api/merchantTransIDvalidationAPI.php?sessionkey=${sessionKey}&store_id=${store_id}&store_passwd=${store_passwd}&v=1&format=json`;
    console.log('url', url);
    const response = this.http.get(url);
    return firstValueFrom(response).then((res: any) => res.data);
  }

  async transactionQueryByTransactionId(
    data: SslCommerzApiConfig,
  ): Promise<any> {
    const { baseUrl, store_id, store_passwd, tran_id } = data;
    const url = `${baseUrl}/validator/api/merchantTransIDvalidationAPI.php?tran_id=${tran_id}&store_id=${store_id}&store_passwd=${store_passwd}&v=1&format=json`;
    const response: any = this.http.get(url);
    return firstValueFrom(response).then((res: any) => res.data);
  }
}
