import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AddCartDto,
  DeleteCartDto,
  UpdateCartDto,
  UpdateCartQty,
} from './dto/cart.dto';
import { Cart } from './interfaces/cart.interface';
import { User } from '../user/interfaces/user.interface';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';

const ObjectId = Types.ObjectId;

@Injectable()
export class CartService {
  private logger = new Logger(CartService.name);

  constructor(
    @InjectModel('User') private readonly userModel: Model<Cart>,
    @InjectModel('Cart') private readonly cartModel: Model<Cart>,
  ) {}

  /**
   * Cart Service Methods
   * addToCart()
   * addToCartMultiple()
   * getCartByUserId()
   * updateCartById()
   * updateCartQty()
   * deleteCartById()
   */
  async addToCart(
    shop: string,
    user: User,
    addCartDto: AddCartDto,
  ): Promise<ResponsePayload> {
    try {
      const { product, variation } = addCartDto;
      let filter: any;
      if (variation) {
        filter = {
          user: user._id,
          product: product,
          'variation._id': variation._id,
          shop: shop,
        };
      } else {
        filter = {
          user: user._id,
          product: product,
          shop: shop,
        };
      }
      const cartData = await this.cartModel.findOne(filter);

      const finalData = { ...addCartDto, ...{ user: user._id, shop: shop } };
      if (cartData) {
        await this.cartModel.findByIdAndUpdate(cartData._id, {
          $set: finalData,
        });
        return {
          success: true,
          message: 'Added to Cart Successfully!',
          data: {
            _id: cartData._id,
          },
        } as ResponsePayload;
      } else {
        const saveData = await this.cartModel.create(finalData);

        return {
          success: true,
          message: 'Added to Cart Successfully!',
          data: {
            _id: saveData._id,
          },
        } as ResponsePayload;
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async addToCartMultiple(
    shop: string,
    user: User,
    addCartDto: AddCartDto[],
  ): Promise<ResponsePayload> {
    try {
      for (const data of addCartDto) {
        const { product, variation } = data;
        let filter: any;
        if (variation) {
          filter = {
            user: user._id,
            product: product,
            'variation._id': variation._id,
            shop: shop,
          };
        } else {
          filter = {
            user: user._id,
            product: product,
            shop: shop,
          };
        }

        const cartData = await this.cartModel.findOne(filter);

        const finalData = { ...data, ...{ user: user._id, shop: shop } };

        if (cartData) {
          await this.cartModel.findByIdAndUpdate(cartData._id, {
            $set: finalData,
          });
        } else {
          await this.cartModel.create(finalData);
        }
      }
      return {
        success: true,
        message: 'Multiple Added to Cart Successfully!',
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllCartByShop(
    shop: string,
    user: User,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      if (!shop) {
        return {
          success: false,
          message: 'Sorry! no data found.',
        } as ResponsePayload;
      }

      const data = await this.cartModel
        .find({ user: user._id, shop: shop })
        .populate({
          path: 'product',
          select: select,
        });
      return {
        data: data,
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * getCartByUserId()
   */
  async getCartByShopByUserId(
    user: any,
    shop: string,
  ): Promise<ResponsePayload> {
    try {
      if (!shop) {
        return {
          success: false,
          message: 'Sorry! no data found.',
        } as ResponsePayload;
      }
      const data = await this.cartModel
        .find({ user: user, shop: shop })
        .populate([
          {
            path: 'product',
            select:
              'name slug description  costPrice salePrice sku tax discountType discountAmount images quantity category subCategory  brand tags unit productPaymentType advancePaymentAmount advancePayment',
          },
          {
            path: 'user',
            select: 'name phoneNo',
          },
        ]);

      return {
        data: data,
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async updateCartById(
    shop: string,
    user: User,
    updateCartDto: UpdateCartDto,
  ): Promise<ResponsePayload> {
    try {
      const { ids, isSelected, selectedQty } = updateCartDto;
      const updateFields: any = {};
      if (typeof isSelected !== 'undefined') {
        updateFields.isSelected = isSelected;
      }
      if (typeof selectedQty !== 'undefined') {
        updateFields.selectedQty = selectedQty;
      }

      if (Object.keys(updateFields).length === 0) {
        return {
          success: false,
          message: 'No fields to update',
        } as ResponsePayload;
      }

      await this.cartModel.updateMany(
        {
          shop: shop,
          user: user._id,
          _id: { $in: ids.map((m) => new ObjectId(m)) },
        },
        {
          $set: updateFields,
        },
      );

      return {
        success: true,
        message: 'Item(s) updated successfully!',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async updateCartQty(
    id: string,
    updateCartQty: UpdateCartQty,
  ): Promise<ResponsePayload> {
    try {
      if (updateCartQty.type == 'increment') {
        await this.cartModel.findByIdAndUpdate(id, {
          $inc: {
            selectedQty: updateCartQty.selectedQty,
          },
        });
      }

      if (updateCartQty.type == 'decrement') {
        await this.cartModel.findByIdAndUpdate(id, {
          $inc: {
            selectedQty: -updateCartQty.selectedQty,
          },
        });
      }

      return {
        success: true,
        message: 'Quantity Updated Successfully!',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteCartById(
    shop: string,
    user: User,
    deleteCartDto: DeleteCartDto,
  ): Promise<ResponsePayload> {
    try {
      const { ids } = deleteCartDto;
      await this.cartModel.deleteMany({
        shop: shop,
        user: user._id,
        _id: { $in: ids.map((m) => new ObjectId(m)) },
      });
      return {
        success: true,
        message: 'Item Removed Successfully From Cart!',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteCartBySingleId(
    shop: string,
    id: any,
    user: User,
  ): Promise<ResponsePayload> {
    try {
      // const { id } = id;
      await this.cartModel.findByIdAndDelete({
        shop: shop,
        user: user._id,
        _id: id,
      });
      return {
        success: true,
        message: 'Item Removed Successfully From Cart!',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }
}
