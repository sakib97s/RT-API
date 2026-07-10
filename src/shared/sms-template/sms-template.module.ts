import { Module } from '@nestjs/common';
import { SmsTemplateService } from './sms-template.service';

@Module({
  providers: [SmsTemplateService],
  exports: [SmsTemplateService],
})
export class SmsTemplateModule {}
