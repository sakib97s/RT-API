import { Global, Module } from '@nestjs/common';
import { LogReportService } from './log-report.service';
import { MongooseModule } from '@nestjs/mongoose';
import { LogReportSchema } from './schema/log-report.schema';
import { LogReportController } from './log-report.controller';
import { JwtModule } from '@nestjs/jwt';
import { ShopSchema } from '../../pages/shop/schema/shop.schema';

@Global()
@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: 'LogReport', schema: LogReportSchema },
      { name: 'Shop', schema: ShopSchema },
    ]),
  ],
  providers: [LogReportService],
  controllers: [LogReportController],
  exports: [LogReportService],
})
export class LogReportModule {}
