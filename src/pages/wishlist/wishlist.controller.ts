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
  AddWishlistDto,
  DeleteWishlistDto,
  UpdateWishlistDto,
  UpdateWishlistQty,
} from './dto/wishlist.dto';
import { MongoIdValidationPipe } from '../../pipes/mongo-id-validation.pipe';
import { WishlistService } from './wishlist.service';
import { UserAuthGuard } from '../user/guards/user-auth.guard';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';

@Controller('wishlist')
export class WishlistController {
  private logger = new Logger(WishlistController.name);

  constructor(private wishlistService: WishlistService) {}

  /**
   * User Secure Api
   * addToWishlist()
   * addToWishlistMultiple()
   * getAllWishlistByShop()
   * updateWishlistById()
   * updateWishlistQty()
   * deleteWishlistById()
   */

  @Post('/add-to-wishlist')
  @UsePipes(ValidationPipe)
  @UseGuards(UserAuthGuard)
  async addToWishlist(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body()
    addWishlistDto: AddWishlistDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.wishlistService.addToWishlist(
      shop,
      req.user,
      addWishlistDto,
    );
  }

  @Post('/add-to-wishlist-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(UserAuthGuard)
  async addToWishlistMultiple(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body()
    addWishlistDto: AddWishlistDto[],
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.wishlistService.addToWishlistMultiple(
      shop,
      req.user,
      addWishlistDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-wishlists-by-user')
  @UsePipes(ValidationPipe)
  @UseGuards(UserAuthGuard)
  async getAllWishlistByShop(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return this.wishlistService.getAllWishlistByShop(shop, req.user, select);
  }

  // Vendor
  @Version(VERSION_NEUTRAL)
  @Get('/get-all-wishlist-by-user/:id')
  @UsePipes(ValidationPipe)
  // @UseGuards(UserAuthGuard)
  async getAllWishlistByShopByUserId(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Param('id', MongoIdValidationPipe) id: string,
  ): Promise<ResponsePayload> {
    return this.wishlistService.getAllWishlistByShopByUserId(id, shop);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update')
  @UsePipes(ValidationPipe)
  @UseGuards(UserAuthGuard)
  async updateWishlistById(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
    @Body() updateWishlistDto: UpdateWishlistDto,
  ): Promise<ResponsePayload> {
    return await this.wishlistService.updateWishlistById(
      shop,
      req.user,
      updateWishlistDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-qty/:id')
  @UsePipes(ValidationPipe)
  @UseGuards(UserAuthGuard)
  async updateWishlistQty(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateWishlistQty: UpdateWishlistQty,
  ): Promise<ResponsePayload> {
    return await this.wishlistService.updateWishlistQty(id, updateWishlistQty);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete')
  @UsePipes(ValidationPipe)
  @UseGuards(UserAuthGuard)
  async deleteWishlistById(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() deleteWishlistDto: DeleteWishlistDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.wishlistService.deleteWishlistById(
      shop,
      req.user,
      deleteWishlistDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Delete('/delete-by/:id')
  @UsePipes(ValidationPipe)
  // @UseGuards(UserAuthGuard)
  async deleteWishlistByUserById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.wishlistService.deleteWishlistByUserById(shop, id);
  }
}
