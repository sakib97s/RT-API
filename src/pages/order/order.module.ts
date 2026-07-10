import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { UniqueIdSchema } from '../../schema/unique-id.schema';
import { LogReportSchema } from '../../shared/log-report/schema/log-report.schema';
import { SmsTemplateModule } from '../../shared/sms-template/sms-template.module';
import { SmsModule } from '../../shared/sms/sms.module';
import { AffiliateProductSchema } from '../affiliate-product/schema/affiliate-product.schema';
import { AffiliateReportSchema } from '../affiliate-report/schema/affiliate-report.schema';
import { CartSchema } from '../cart/schema/cart.schema';
import { SettingSchema } from '../customization/setting/schema/setting.schema';
import { ShopInformationSchema } from '../customization/shop-information/schema/shop-information.schema';
import { IpBlockSchema } from '../ip-block/schema/ip-block.schema';
import { NotificationModule } from '../notification/notification.module';
import { ProductSchema } from '../product/schema/product.schema';
import { ShopSchema } from '../shop/schema/shop.schema';
import { UserSchema } from '../user/schema/user.schema';
import { VendorSchema } from '../vendor/schema/vendor.schema';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { IncompleteOrderSchema } from './schema/incomplete-order.schema';
import { OrderSchema } from './schema/order.schema';
import { CourierModule } from '../../shared/courier/courier.module';

@Module({
  imports: [
    JwtModule,
    HttpModule,
    MongooseModule.forFeature([
      { name: 'Order', schema: OrderSchema },
      { name: 'UniqueId', schema: UniqueIdSchema },
      { name: 'Product', schema: ProductSchema },
      { name: 'Cart', schema: CartSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Shop', schema: ShopSchema },
      { name: 'Setting', schema: SettingSchema },
      { name: 'LogReport', schema: LogReportSchema },
      { name: 'ShopInformation', schema: ShopInformationSchema },
      { name: 'Coupon', schema: new (require('mongoose').Schema)({}, { strict: false }) },
      { name: 'Vendor', schema: VendorSchema },
      { name: 'IncompleteOrder', schema: IncompleteOrderSchema },
      { name: 'AffiliateProduct', schema: AffiliateProductSchema },
      { name: 'AffiliateReport', schema: AffiliateReportSchema },
      { name: 'IpBlock', schema: IpBlockSchema },
    ]),
    NotificationModule,
    SmsTemplateModule,
    SmsModule,
    CourierModule,
  ],
  providers: [OrderService],
  controllers: [OrderController],
})
export class OrderModule {}
