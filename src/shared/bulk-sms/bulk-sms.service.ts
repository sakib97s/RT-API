import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { SmsSentConfig } from './interfaces/bulk-sms.interface';
import axios from 'axios';
@Injectable()
export class BulkSmsService {
  private logger = new Logger(BulkSmsService.name);

  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService,
  ) {}

  /**
   * SMS API Methods
   * sentSmsWithProvider()
   * sentSingleSms()
   */

  public sentSmsWithProvider(smsSentConfig: SmsSentConfig) {
    const {
      providerName,
      apiKey,
      smsSenderSecret,
      smsSenderId,
      phoneNo,
      message,
      smsClientId,
      countryCode,
    } = smsSentConfig;

    switch (providerName) {
      case 'Bulk SMS BD':
        const bulkSmsUrl = `http://bulksmsbd.net/api/smsapi?api_key=${smsSenderSecret}&type=text&number=${phoneNo}&senderid=${smsSenderId}&message=${message}`;
        console.log('bulkSmsUrl', bulkSmsUrl);
        this.httpService.post<{ data: string }>(bulkSmsUrl, {}).subscribe({
          next: (res) => {
            this.logger.log(res.data);
          },
          error: (err) => {
            console.log(err);
          },
        });
        break;

      case 'iSMS Plus SSL Wireless':
        const smsData = {
          api_token: smsSenderSecret,
          msisdn: '88' + phoneNo,
          sms: message,
          sid: smsSenderId,
          csms_id: phoneNo,
        };
        const sslCommerzUrl = 'https://smsplus.sslwireless.com/api/v3/send-sms';
        this.httpService
          .get<{ data: string }>(sslCommerzUrl, { params: smsData })
          .subscribe({
            next: (res) => {
              this.logger.log(res.data);
            },
            error: (err) => {
              console.log(err);
            },
          });
        break;

      case 'Smsq BD':
        const smsqData = {
          ApiKey: smsSenderSecret,
          ClientId: smsClientId,
          SenderId: smsSenderId,
          Message: message,
          MobileNumbers: '88' + phoneNo,
        };

        const smsqUrl = 'https://api.smsq.global/api/v2/SendSMS';

        this.httpService
          .post<{ data: string }>(smsqUrl, smsqData, {
            headers: { 'Content-Type': 'application/json' },
          })
          .subscribe({
            next: (res) => {
              this.logger.log(res.data);
            },
            error: (err) => {
              console.log('SMSQ API Error:', err);
            },
          });
        break;

      case 'Revesms':
        const reveSmsUrl = `http://103.177.125.106:7788/sendtext?apikey=${apiKey}&secretkey=${smsSenderSecret}&callerID=${smsSenderId}&toUser=${phoneNo}&messageContent=${message}`;
        // console.log('reveSmsUrl', reveSmsUrl);
        this.httpService.post<{ data: string }>(reveSmsUrl, {}).subscribe({
          next: (res) => {
            this.logger.log(res.data);
          },
          error: (err) => {
            console.log(err);
          },
        });
        break;

      case 'Elitbuzz':
        // const elitbuzzSmsUrl = `https://www.880sms.com/smsapi?api_key=${smsSenderSecret}&type=text&contacts=${phoneNo}&senderid=${smsSenderId}&msg=${message}`;
        const elitbuzzSmsUrl = ` https://msg.elitbuzz-bd.com/smsapi?api_key=${smsSenderSecret}&type=text&contacts=${phoneNo}&senderid=${smsSenderId}&msg=${message}`;
        console.log('bulkSmsUrl', elitbuzzSmsUrl);
        this.httpService.get(elitbuzzSmsUrl).subscribe(
          (res) => {
            // You can log or handle response here
            console.log('SMS Sent:', res.data);
          },
          (error) => {
            console.error('SMS Error:', error);
            this.logger.error(error);
          },
        );
        break;

      case 'Twilio':
        // const client = twilio(smsSenderId, smsSenderSecret);
        this.sendSmsWithTwilioRaw(
          phoneNo,
          countryCode,
          message,
          smsClientId, // FROM number
          smsSenderId, // Account SID
          smsSenderSecret, // Auth Token
        );
        break;

      case 'SMS.TO':
        const url = `https://api.sms.to/sms/send`;
        const body = {
          message: message,
          to: phoneNo,
          sender_id: smsSenderId,
        };
        const headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${smsSenderSecret}`,
        };
        this.httpService
          .post<{ data: string }>(url, body, { headers: headers })
          .subscribe({
            next: (res) => {
              this.logger.log(res.data);
            },
            error: (err) => {
              console.log(err);
            },
          });
        break;

      default:
        break;
    }
  }

  formatPhoneNumber(phoneNo: string, countryCode: string): string {
    const cleaned = phoneNo.replace(/\D/g, ''); // remove non-digits
    if (cleaned.startsWith('00')) {
      return '+' + cleaned.slice(2);
    } else if (cleaned.startsWith('0')) {
      return `+${countryCode}${cleaned.slice(1)}`;
    } else if (!cleaned.startsWith('+')) {
      return `+${countryCode}${cleaned}`;
    }
    return cleaned;
  }

  async sendSmsWithTwilioRaw(
    phoneNo: string,
    countryCode: string,
    message: string,
    smsClientId: string, // Twilio FROM number
    smsSenderId: string, // Twilio Account SID
    smsSenderSecret: string, // Twilio Auth Token
  ) {
    try {
      const formattedTo = this.formatPhoneNumber(phoneNo, countryCode);

      const params = new URLSearchParams();
      params.append('To', formattedTo);
      params.append('From', smsClientId);
      params.append('Body', message);

      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${smsSenderId}/Messages.json`,
        params,
        {
          auth: {
            username: smsSenderId,
            password: smsSenderSecret,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.logger.log(
        `Twilio SMS sent successfully. SID: ${response.data.sid}`,
      );
    } catch (err) {
      this.logger.error(
        `Twilio SMS failed: ${err?.response?.data?.message || err.message}`,
      );
    }
  }

  /**
   * Administrator Uses Only
   * sentSmsByAdmin()
   */
  public sentSmsByAdmin(phoneNo: string, message: string) {
    const smsApiKey = this.configService.get<string>('smsApiKey');
    const smsSenderId = this.configService.get<string>('smsSenderId');

    const url = `http://bulksmsbd.net/api/smsapi?api_key=${smsApiKey}&type=text&number=${phoneNo}&senderid=${smsSenderId}&message=${message}`;

    const productionBuild = this.configService.get<string>('productionBuild');

    if (productionBuild) {
      this.httpService.post<{ data: string }>(url, {}).subscribe({
        next: (res) => {
          this.logger.log(res.data);
          console.log(res.data);
        },
        error: (err) => {
          console.log(err);
        },
      });
    }
  }
}
