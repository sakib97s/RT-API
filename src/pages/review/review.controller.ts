import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';

import {
  AddReviewDto,
  FilterAndPaginationReviewDto,
  UpdateReviewDto,
} from './dto/review.dto';
import { MongoIdValidationPipe } from '../../pipes/mongo-id-validation.pipe';
import { ReviewService } from './review.service';
import { UserAuthGuard } from '../user/guards/user-auth.guard';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { AdminMetaRoles } from '../admin/decorator/admin-roles.decorator';
import { AdminRoles } from 'src/enum/admin-roles.enum';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import { AdminMetaPermissions } from '../admin/decorator/admin-permissions.decorator';
import { AdminPermissions } from 'src/enum/admin-permission.enum';
import { AdminPermissionGuard } from '../admin/guards/admin-permission.guard';
import { AdminAuthGuard } from '../admin/guards/admin-auth.guard';
import { VendorAuthGuard } from '../vendor/guards/vendor-auth.guard';
import { FilterAndPaginationOrderDto } from '../order/dto/order.dto';

@Controller('review')
export class ReviewController {
  private logger = new Logger(ReviewController.name);

  constructor(private reviewService: ReviewService) {}

  /**
   * User Secure Api
   * addReview()
   * getReviewByUser()
   * deleteReviewByUser()
   */

  @Post('/add-review-by-user')
  @UsePipes(ValidationPipe)
  @UseGuards(UserAuthGuard)
  async addReviewByUser(
    @Req() req: any,
    @Body()
    addReviewDto: AddReviewDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.reviewService.addReviewByUser(
      shop,
      req.user,
      addReviewDto,
    );
  }

  @Post('/add-review-by-vendor')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async addReviewByVendor(
    @Req() req: any,
    @Body()
    addReviewDto: AddReviewDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.reviewService.addReviewByVendor(
      shop,
      req.user,
      addReviewDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-Review-by-user')
  @UsePipes(ValidationPipe)
  @UseGuards(UserAuthGuard)
  async getAllReviewsByUser(
    @Body() filterAndPaginationReviewDto: FilterAndPaginationReviewDto,
    @Query('q') searchString: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return this.reviewService.getAllReviewsByUser(
      shop,
      req.user,
      filterAndPaginationReviewDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-pending-review-by-user')
  @UsePipes(ValidationPipe)
  @UseGuards(UserAuthGuard)
  async getAllPendingReviewsByUser(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return this.reviewService.getAllPendingReviewItemsByUser(shop, req.user);
  }

  @Version(VERSION_NEUTRAL)
  @Delete('/delete-review-by-user/:id')
  @UsePipes(ValidationPipe)
  @UseGuards(UserAuthGuard)
  async deleteReviewByUser(
    @Param('id', MongoIdValidationPipe) id: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.reviewService.deleteReviewByUser(id, req.user);
  }

  @Version(VERSION_NEUTRAL)
  @Get('get-by/:id')
  @UsePipes(ValidationPipe)
  async getReviewByUserById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query() select: string,
  ): Promise<ResponsePayload> {
    return await this.reviewService.getReviewById(id, select);
  }

  /**
   * Admin Secure Api
   * addReviewByAdmin()
   * getAllReviews()
   * getAllReviewsByQuery()
   * getReviewById()
   * updateReviewById()
   * updateReviewByIdAndDelete()
   * deleteReviewById()
   */

  @Post('/add-by-admin')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminAuthGuard)
  async addReviewByAdmin(
    @Body()
    addReviewDto: AddReviewDto,
  ): Promise<ResponsePayload> {
    return await this.reviewService.addReviewByAdmin(addReviewDto);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-all-review')
  @UsePipes(ValidationPipe)
  async getAllReviews(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return this.reviewService.getAllReviews(shop);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-all-product-review')
  @UsePipes(ValidationPipe)
  async updateAllProductRatingsByShop(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return this.reviewService.updateAllProductRatingsByShop(shop);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-all-by-shop')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async getAllReviewByShop(
    @Body() filterAndPaginationReviewDto: FilterAndPaginationReviewDto,
    @Query('q') searchString: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.reviewService.getAllReviewByShop(
      req.user,
      shop,
      filterAndPaginationReviewDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-all-review-by-query')
  @UsePipes(ValidationPipe)
  async getAllReviewsByQuery(
    @Body() filterReviewDto: FilterAndPaginationReviewDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.reviewService.getAllReviewsByQuery(
      filterReviewDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/:id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminAuthGuard)
  async getReviewById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query() select: string,
  ): Promise<ResponsePayload> {
    return await this.reviewService.getReviewById(id, select);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminAuthGuard)
  async updateReviewById(
    @Body() updateReviewDto: UpdateReviewDto,
  ): Promise<ResponsePayload> {
    return await this.reviewService.updateReviewById(updateReviewDto);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-user')
  @UsePipes(ValidationPipe)
  @UseGuards(UserAuthGuard)
  async updateReviewByUserById(
    @Body() updateReviewDto: UpdateReviewDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.reviewService.updateReviewById(updateReviewDto);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-vendor')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateReviewByVendorById(
    @Body() updateReviewDto: UpdateReviewDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.reviewService.updateReviewById(updateReviewDto);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-and-review-remove')
  // @UsePipes(ValidationPipe)
  // @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  // @UseGuards(AdminRolesGuard)
  // @AdminMetaPermissions(AdminPermissions.EDIT)
  // @UseGuards(AdminPermissionGuard)
  // @UseGuards(AdminJwtAuthGuard)
  async updateReviewByIdAndDelete(
    @Body() updateReviewDto: UpdateReviewDto,
  ): Promise<ResponsePayload> {
    return await this.reviewService.updateReviewByIdAndDelete(updateReviewDto);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple-by-vendor')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateMultipleReviewById(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.reviewService.updateMultipleReviewById(
      req.user,
      shop,
      updateReviewDto.ids,
      updateReviewDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Delete('/delete/:id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async deleteReviewById(
    @Param('id', MongoIdValidationPipe) id: string,
  ): Promise<ResponsePayload> {
    return await this.reviewService.deleteReviewById(id);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-all-trash-by-shop')
  @UsePipes(ValidationPipe)
  // @UseGuards(AffiliateAuthGuard)
  async deleteAllTrashByShop(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.reviewService.deleteAllTrashByShop(shop);
  }

  /**
   * Vendor Secure Api
   * getAllReviewsByVendor()
   * updateReviewByVendor()
   * deleteVendorReviewById()
   */

  @Version(VERSION_NEUTRAL)
  @Post('/get-all-review-by-vendor')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async getAllReviewsByVendor(
    @Body() filterReviewDto: FilterAndPaginationReviewDto,
    @Query('q') searchString: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    filterReviewDto.filter = {
      ...filterReviewDto.filter,
      ...{ vendor: req.user?._id },
    };
    return this.reviewService.getAllReviewsByQuery(
      filterReviewDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('get-by-id/:id')
  @UseGuards(VendorAuthGuard)
  async getCategoryById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.reviewService.getReviewVendorById(
      req.user,
      shop,
      id,
      select,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-by-vendor')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateReviewByVendor(
    @Body() updateReviewDto: UpdateReviewDto,
  ): Promise<ResponsePayload> {
    return await this.reviewService.updateReviewById(updateReviewDto);
  }

  @Version(VERSION_NEUTRAL)
  @Delete('/delete-by-vendor/:id')
  @UseGuards(VendorAuthGuard)
  async deleteVendorReviewById(
    @Param('id', MongoIdValidationPipe) id: string,
  ): Promise<ResponsePayload> {
    return await this.reviewService.deleteReviewById(id);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-by-vendor')
  @UseGuards(VendorAuthGuard)
  async deleteMultipleProductById(
    @Body() data: { ids: string[] },
  ): Promise<ResponsePayload> {
    return await this.reviewService.deleteMultipleReviewById(data.ids);
  }
}
