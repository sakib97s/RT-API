import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CourierService } from './courier.service';

@Module({
  imports: [HttpModule],
  providers: [CourierService],
  exports: [CourierService],
})
export class CourierModule {}
