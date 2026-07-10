import { Global, Module } from '@nestjs/common';
import { PaymentControlService } from './payment-control.service';
import { HttpModule } from '@nestjs/axios';

@Global()
@Module({
  imports: [HttpModule],
  providers: [PaymentControlService],
  exports: [PaymentControlService],
})
export class PaymentControlModule {}
