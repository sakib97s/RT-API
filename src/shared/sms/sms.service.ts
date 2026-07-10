import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Send SMS using the active provider
   */
  async sendSms(payload: {
    phoneNumber: string;
    message: string;
    provider: any; // Active SMS provider with credentials
  }): Promise<boolean> {
    try {
      const { phoneNumber, message, provider } = payload;

      // Log for debugging
      this.logger.log(
        `Sending SMS to ${phoneNumber} via ${provider.providerName}`,
      );

      // Route to appropriate provider
      switch (provider.providerName) {
        case 'Bulk SMS BD':
          return await this.sendViaBulkSmsBd(phoneNumber, message, provider);

        case 'Smsq BD':
          return await this.sendViaSmsqBd(phoneNumber, message, provider);

        case 'Revesms':
          return await this.sendViaRevesms(phoneNumber, message, provider);

        case 'Twilio':
          return await this.sendViaTwilio(phoneNumber, message, provider);

        case 'iSMS Plus SSL Wireless':
          return await this.sendViaSslWireless(phoneNumber, message, provider);

        case 'Elitbuzz':
          return await this.sendViaElitbuzz(phoneNumber, message, provider);

        case 'SMS.TO':
          return await this.sendViaSmsTo(phoneNumber, message, provider);

        default:
          this.logger.warn(`Unknown SMS provider: ${provider.providerName}`);
          return false;
      }
    } catch (error) {
      this.logger.error('Error sending SMS:', error.message);
      return false;
    }
  }

  /**
   * BulkSMS BD Implementation
   */
  private async sendViaBulkSmsBd(
    phone: string,
    message: string,
    provider: any,
  ): Promise<boolean> {
    try {
      // Properly encode the message to preserve newlines
      const encodedMessage = encodeURIComponent(message);
      const url = `http://bulksmsbd.net/api/smsapi?api_key=${provider.secretKey}&type=text&number=${phone}&senderid=${provider.senderId}&message=${encodedMessage}`;

      const response = await firstValueFrom(this.httpService.post(url, {}));

      this.logger.log('BulkSMS BD Response:', response.data);
      return true; // Assume success if no error thrown
    } catch (error) {
      this.logger.error('BulkSMS BD Error:', error.message);
      return false;
    }
  }

  /**
   * Smsq BD Implementation
   */
  private async sendViaSmsqBd(
    phone: string,
    message: string,
    provider: any,
  ): Promise<boolean> {
    try {
      const url = 'https://api.smsq.global/api/v2/SendSMS';
      const data = {
        ApiKey: provider.secretKey,
        ClientId: provider.clientId,
        SenderId: provider.senderId,
        Message: message,
        MobileNumbers: '88' + phone,
      };

      const response = await firstValueFrom(
        this.httpService.post(url, data, {
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      this.logger.log('Smsq BD Response:', response.data);
      return response.data.Success === true;
    } catch (error) {
      this.logger.error('Smsq BD Error:', error.message);
      return false;
    }
  }

  /**
   * Revesms Implementation
   */
  private async sendViaRevesms(
    phone: string,
    message: string,
    provider: any,
  ): Promise<boolean> {
    try {
      // Properly encode the message to preserve newlines
      const encodedMessage = encodeURIComponent(message);
      const url = `http://103.177.125.106:7788/sendtext?apikey=${provider.apiKey}&secretkey=${provider.secretKey}&callerID=${provider.senderId}&toUser=${phone}&messageContent=${encodedMessage}`;

      const response = await firstValueFrom(this.httpService.post(url, {}));

      this.logger.log('Revesms Response:', response.data);
      return true; // Assume success if no error thrown
    } catch (error) {
      this.logger.error('Revesms Error:', error.message);
      return false;
    }
  }

  /**
   * Twilio Implementation
   */
  private async sendViaTwilio(
    phone: string,
    message: string,
    provider: any,
  ): Promise<boolean> {
    try {
      const accountSid = provider.clientId;
      const authToken = provider.secretKey;
      const fromNumber = provider.senderId;

      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

      const response = await firstValueFrom(
        this.httpService.post(
          url,
          new URLSearchParams({
            To: phone,
            From: fromNumber,
            Body: message,
          }),
          {
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );

      this.logger.log('Twilio Response:', response.data);
      return response.data.sid !== undefined;
    } catch (error) {
      this.logger.error('Twilio Error:', error.message);
      return false;
    }
  }

  /**
   * SSL Wireless Implementation
   */
  private async sendViaSslWireless(
    phone: string,
    message: string,
    provider: any,
  ): Promise<boolean> {
    try {
      const smsData = {
        api_token: provider.secretKey,
        msisdn: '88' + phone,
        sms: message,
        sid: provider.senderId,
        csms_id: phone,
      };

      const url = 'https://smsplus.sslwireless.com/api/v3/send-sms';

      const response = await firstValueFrom(
        this.httpService.get(url, { params: smsData }),
      );

      this.logger.log('SSL Wireless Response:', response.data);
      return true; // Assume success if no error thrown
    } catch (error) {
      this.logger.error('SSL Wireless Error:', error.message);
      return false;
    }
  }

  /**
   * Elitbuzz Implementation
   */
  private async sendViaElitbuzz(
    phone: string,
    message: string,
    provider: any,
  ): Promise<boolean> {
    try {
      const url = `https://msg.elitbuzz-bd.com/smsapi?api_key=${provider.secretKey}&type=text&contacts=${phone}&senderid=${provider.senderId}&msg=${message}`;

      const response = await firstValueFrom(this.httpService.get(url));

      this.logger.log('Elitbuzz Response:', response.data);
      return true; // Assume success if no error thrown
    } catch (error) {
      this.logger.error('Elitbuzz Error:', error.message);
      return false;
    }
  }

  /**
   * SMS.TO Implementation
   */
  private async sendViaSmsTo(
    phone: string,
    message: string,
    provider: any,
  ): Promise<boolean> {
    try {
      const url = `https://api.sms.to/sms/send`;
      const body = {
        message: message,
        to: phone,
        sender_id: provider.senderId,
      };
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.secretKey}`,
      };

      const response = await firstValueFrom(
        this.httpService.post(url, body, { headers: headers }),
      );

      this.logger.log('SMS.TO Response:', response.data);
      return true; // Assume success if no error thrown
    } catch (error) {
      this.logger.error('SMS.TO Error:', error.message);
      return false;
    }
  }
}
