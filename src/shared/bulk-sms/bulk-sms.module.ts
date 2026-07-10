import { Global, Module } from '@nestjs/common';
import { BulkSmsService } from './bulk-sms.service';
import { HttpModule } from '@nestjs/axios';

@Global()
@Module({
  imports: [HttpModule],
  providers: [BulkSmsService],
  exports: [BulkSmsService],
})
export class BulkSmsModule {}
