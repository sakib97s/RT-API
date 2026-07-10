import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PaymentLinkHistorySchema } from './schema/payment-link-history.schema';
import { PaymentLinkHistoryService } from './payment-link-history.service';
import { PaymentLinkHistoryController } from './payment-link-history.controller';
import { OtpService } from '../otp/otp.service';
import { HttpModule } from '@nestjs/axios';
import { OtpSchema } from '../otp/schema/otp.schema';
import { OtpAdminSchema } from '../otp/schema/otp-admin.schema';
import { PaymentLinkSchema } from '../payment-link/schema/payment-link.schema';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: 'PaymentLinkHistory', schema: PaymentLinkHistorySchema },
      { name: 'PaymentLink', schema: PaymentLinkSchema },
    ]),
    HttpModule,
  ],
  providers: [PaymentLinkHistoryService],
  controllers: [PaymentLinkHistoryController],
})
export class PaymentLinkHistoryModule {}
