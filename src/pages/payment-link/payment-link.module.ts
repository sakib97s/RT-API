import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PaymentLinkSchema } from './schema/payment-link.schema';
import { PaymentLinkService } from './payment-link.service';
import { PaymentLinkController } from './payment-link.controller';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: 'PaymentLink', schema: PaymentLinkSchema },
    ]),
  ],
  providers: [PaymentLinkService],
  controllers: [PaymentLinkController],
})
export class PaymentLinkModule {}
