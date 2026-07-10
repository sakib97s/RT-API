import { Global, Module } from '@nestjs/common';
import { BuildScriptService } from './build-script.service';
import { HttpModule } from '@nestjs/axios';

@Global()
@Module({
  imports: [HttpModule],
  providers: [BuildScriptService],
  exports: [BuildScriptService],
})
export class BuildScriptModule {}
