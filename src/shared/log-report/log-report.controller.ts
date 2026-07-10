import {
  Body,
  Controller,
  Logger,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { LogReportService } from './log-report.service';
import { FilterAndPaginationLogReportDto } from './dto/log-report.dto';
import { ResponsePayload } from '../../interfaces/response-payload.interface';
import { VendorAuthGuard } from '../../pages/vendor/guards/vendor-auth.guard';
import { MongoIdValidationPipe } from '../../pipes/mongo-id-validation.pipe';

@Controller('log-report')
export class LogReportController {
  private logger = new Logger(LogReportController.name);

  constructor(private logReportService: LogReportService) {}

  /**
   * Vendor Secure Api
   * getAllLogReportByShop()
   */

  @Version(VERSION_NEUTRAL)
  @Post('/get-all-by-shop')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async getAllLogReportByShop(
    @Body() filterLogReportDto: FilterAndPaginationLogReportDto,
    @Query('q') searchString: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.logReportService.getAllLogReportByShop(
      req.user,
      shop,
      filterLogReportDto,
      searchString,
    );
  }

  /**
   * getAllLogReports
   * getLogReportById
   */
  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async getAllLogReports(
    @Body() filterLogReportDto: FilterAndPaginationLogReportDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.logReportService.getAllLogReports(
      filterLogReportDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-data-by-id')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleLogReportById(
    @Body() data: { ids: string[] },
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.logReportService.deleteMultipleLogReportsById(
      data.ids,
      Boolean(checkUsage),
    );
  }
}
