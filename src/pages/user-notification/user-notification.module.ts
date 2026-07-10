import { Module } from '@nestjs/common';
import { UserNotificationService } from './user-notification.service';
import { UserNotificationController } from './user-notification.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserNotificationSchema } from './schema/user-notification.schema';
import { JwtModule } from '@nestjs/jwt';
import { ShopSchema } from '../shop/schema/shop.schema';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: 'UserNotification', schema: UserNotificationSchema },
      { name: 'Shop', schema: ShopSchema },
    ]),
  ],
  providers: [UserNotificationService],
  controllers: [UserNotificationController],
  exports: [UserNotificationService],
})
export class UserNotificationModule {}
