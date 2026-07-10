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
  AddCartDto,
  DeleteCartDto,
  UpdateCartDto,
  UpdateCartQty,
} from './dto/cart.dto';
import { MongoIdValidationPipe } from '../../pipes/mongo-id-validation.pipe';
import { CartService } from './cart.service';
import { UserAuthGuard } from '../user/guards/user-auth.guard';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';

@Controller('cart')
export class CartController {
  private logger = new Logger(CartController.name);

  constructor(private cartService: CartService) {}

  /**
   * User Secure Api
   * addToCart()
   * addToCartMultiple()
   * getAllCartByShop()
   * updateCartById()
   * updateCartQty()
   * deleteCartById()
   */

  @Post('/add-to-cart')
  @UsePipes(ValidationPipe)
  @UseGuards(UserAuthGuard)
  async addToCart(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body()
    addCartDto: AddCartDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.cartService.addToCart(shop, req.user, addCartDto);
  }

  @Post('/add-to-cart-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(UserAuthGuard)
  async addToCartMultiple(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body()
    addCartDto: AddCartDto[],
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.cartService.addToCartMultiple(shop, req.user, addCartDto);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-carts-by-user')
  @UsePipes(ValidationPipe)
  @UseGuards(UserAuthGuard)
  async getAllCartByShop(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return this.cartService.getAllCartByShop(shop, req.user, select);
  }

  // Vendor
  @Version(VERSION_NEUTRAL)
  @Get('/get-all-carts-by-user/:id')
  @UsePipes(ValidationPipe)
  // @UseGuards(UserAuthGuard)
  async getCartByShopByUserId(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Param('id', MongoIdValidationPipe) id: string,
  ): Promise<ResponsePayload> {
    return this.cartService.getCartByShopByUserId(id, shop);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update')
  @UsePipes(ValidationPipe)
  @UseGuards(UserAuthGuard)
  async updateCartById(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
    @Body() updateCartDto: UpdateCartDto,
  ): Promise<ResponsePayload> {
    return await this.cartService.updateCartById(shop, req.user, updateCartDto);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-qty/:id')
  @UsePipes(ValidationPipe)
  @UseGuards(UserAuthGuard)
  async updateCartQty(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateCartQty: UpdateCartQty,
  ): Promise<ResponsePayload> {
    return await this.cartService.updateCartQty(id, updateCartQty);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete')
  @UsePipes(ValidationPipe)
  @UseGuards(UserAuthGuard)
  async deleteCartById(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() deleteCartDto: DeleteCartDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.cartService.deleteCartById(shop, req.user, deleteCartDto);
  }

  /**
   * deleteCartById()
   */
  @Version(VERSION_NEUTRAL)
  @Delete('/delete-by-id/:id')
  @UsePipes(ValidationPipe)
  @UseGuards(UserAuthGuard)
  async deleteCartBySingleId(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Param('id', MongoIdValidationPipe) id: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.cartService.deleteCartBySingleId(shop, id, req.user);
  }
}
