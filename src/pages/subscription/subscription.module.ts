import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { SubscriptionSchema } from './schema/subscription.schema';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { PackageSchema } from 'src/schema/package.schema';
import { SubscriptionReportSchema } from './schema/subscription-report.schema';
import {ShopSchema} from "../shop/schema/shop.schema";

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: 'Subscription', schema: SubscriptionSchema },
      { name: 'SubscriptionReport', schema: SubscriptionReportSchema },
      { name: 'Package', schema: PackageSchema },
      { name: 'Shop', schema: ShopSchema },
    ]),
  ],
  providers: [SubscriptionService],
  controllers: [SubscriptionController],
})
export class SubscriptionModule {}
