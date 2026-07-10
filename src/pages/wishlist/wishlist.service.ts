import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AddWishlistDto,
  DeleteWishlistDto,
  UpdateWishlistDto,
  UpdateWishlistQty,
} from './dto/wishlist.dto';
import { Wishlist } from './interfaces/wishlist.interface';
import { User } from '../user/interfaces/user.interface';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { Shop } from '../shop/interfaces/shop.interface';

const ObjectId = Types.ObjectId;

@Injectable()
export class WishlistService {
  private logger = new Logger(WishlistService.name);

  constructor(
    @InjectModel('User') private readonly userModel: Model<Wishlist>,
    @InjectModel('Wishlist') private readonly wishlistModel: Model<Wishlist>,
  ) {}

  /**
   * Wishlist Service Methods
   * addToWishlist()
   * addToWishlistMultiple()
   * getWishlistByUserId()
   * updateWishlistById()
   * updateWishlistQty()
   * deleteWishlistById()
   */
  async addToWishlist(
    shop: string,
    user: User,
    addWishlistDto: AddWishlistDto,
  ): Promise<ResponsePayload> {
    try {
      const { product } = addWishlistDto;
      const final = { ...addWishlistDto, ...{ user: user._id, shop: shop } };
      const wishlistData = await this.wishlistModel.findOne({
        user: user._id,
        product: product,
        shop: shop,
      });

      if (wishlistData) {
        await this.wishlistModel.findByIdAndUpdate(wishlistData._id, {
          $inc: { selectedQty: addWishlistDto.selectedQty },
        });
        return {
          success: true,
          message: 'Wishlist Item Updated Successfully!',
          data: {
            _id: wishlistData._id,
          },
        } as ResponsePayload;
      } else {
        const saveData = await this.wishlistModel.create(final);

        return {
          success: true,
          message: 'Added to Wishlist Successfully!',
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

  async addToWishlistMultiple(
    shop: string,
    user: User,
    addWishlistDto: AddWishlistDto[],
  ): Promise<ResponsePayload> {
    const userId = user._id;

    try {
      for (const data of addWishlistDto) {
        const wishlistData = await this.wishlistModel.findOne({
          user: userId,
          product: data.product,
          shop: shop,
        });

        if (wishlistData) {
          await this.wishlistModel.findByIdAndUpdate(wishlistData._id, {
            $inc: { selectedQty: data.selectedQty },
          });
        } else {
          const final = { ...data, ...{ user: userId } };
          await this.wishlistModel.create(final);
        }
      }
      return {
        success: true,
        message: 'Multiple Added to Wishlist Successfully!',
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllWishlistByShop(
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

      const data = await this.wishlistModel
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
   * getWishlistByUserId()
   */
  async getAllWishlistByShopByUserId(
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
      const data = await this.wishlistModel
        .find({ user: user, shop: shop })
        .populate([
          {
            path: 'product',
            select:
              'name slug description  costPrice salePrice sku tax discountType discountAmount images quantity category subCategory  brand tags unit productPaymentType advancePaymentAmount',
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

  async updateWishlistById(
    shop: string,
    user: User,
    updateWishlistDto: UpdateWishlistDto,
  ): Promise<ResponsePayload> {
    try {
      const { ids, isSelected, selectedQty } = updateWishlistDto;
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

      await this.wishlistModel.updateMany(
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

  async updateWishlistQty(
    id: string,
    updateWishlistQty: UpdateWishlistQty,
  ): Promise<ResponsePayload> {
    try {
      if (updateWishlistQty.type == 'increment') {
        await this.wishlistModel.findByIdAndUpdate(id, {
          $inc: {
            selectedQty: updateWishlistQty.selectedQty,
          },
        });
      }

      if (updateWishlistQty.type == 'decrement') {
        await this.wishlistModel.findByIdAndUpdate(id, {
          $inc: {
            selectedQty: -updateWishlistQty.selectedQty,
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

  async deleteWishlistByUserById(
    shop: string,
    id: string,
  ): Promise<ResponsePayload> {
    try {
      console.log('shop', shop);

      await this.wishlistModel.findByIdAndDelete(id);
      return {
        success: true,
        message: 'Item Removed Successfully From WishList!',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteWishlistById(
    shop: string,
    user: User,
    deleteWishlistDto: DeleteWishlistDto,
  ): Promise<ResponsePayload> {
    try {
      const { ids } = deleteWishlistDto;
      await this.wishlistModel.deleteMany({
        shop: shop,
        user: user._id,
        _id: { $in: ids.map((m) => new ObjectId(m)) },
      });
      return {
        success: true,
        message: 'Item Removed Successfully From Wishlist!',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }
}
