import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

export interface SteadfastCourierPayload {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_email?: string;
  recipient_address: string;
  cod_amount: number;
  item_description?: string;
  note?: string;
  [key: string]: any;
}

@Injectable()
export class CourierService {
  private readonly logger = new Logger(CourierService.name);

  constructor(private readonly httpService: HttpService) {}

  async checkFraudOrder(phoneNo: string, shop: string): Promise<any> {
    try {
      this.logger.log(`Courier fraud check for phone: ${phoneNo}`);
      return null;
    } catch (error) {
      this.logger.warn(`Courier fraud check failed: ${error?.message}`);
      return null;
    }
  }

  async createOrderWithProvider(
    courierApiConfig: any,
    payload: any,
  ): Promise<any> {
    try {
      this.logger.log(
        `Creating order with courier provider: ${courierApiConfig?.providerName}`,
      );
      return { status: 0, message: 'Courier service not configured' };
    } catch (error) {
      this.logger.warn(`Courier order creation failed: ${error?.message}`);
      return null;
    }
  }

  async getOrderStatusFormCourier(
    courierApiConfig: any,
    consignmentId: string,
  ): Promise<any> {
    try {
      this.logger.log(
        `Getting order status from courier: ${courierApiConfig?.providerName}`,
      );
      return { status: 0, message: 'Courier service not configured' };
    } catch (error) {
      this.logger.warn(`Courier status check failed: ${error?.message}`);
      return null;
    }
  }
}
