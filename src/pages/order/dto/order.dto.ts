import {
  ArrayMinSize, ArrayNotEmpty,
  IsArray, IsBoolean,
  IsIn, IsMongoId,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { OptionPayloadDto } from '../../../dto/api-response.dto';
import { PaginationDto } from '../../../dto/pagination.dto';
import { OrderStatus } from '../../../enum/order.enum';

export class AddOrderDto {
  @IsNotEmpty()
  @IsString()
  orderType: string;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phoneNo: string;

  @IsOptional()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  paymentStatus: string;

  @IsOptional()
  @IsString()
  orderStatus: string;

  @IsOptional()
  @IsNumber()
  subTotal: number;

  @IsOptional()
  @IsNumber()
  discount: number;

  @IsOptional()
  @IsNumber()
  grandTotal: number;

  @IsOptional()
  @IsString()
  checkoutDate: string;

  @IsOptional()
  @IsString()
  note: string;

  @IsOptional()
  @IsString()
  user: string;

  @IsOptional()
  @IsString()
  paymentType: string;

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  orderedItems: any[];

  @IsOptional()
  @IsString()
  registrationDate: string;

  @IsOptional()
  @IsString()
  incompleteOrderId: string;

  @IsOptional()
  @IsString()
  status: any;
}

export class AddOrderByUserDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  carts: string[];

  @IsArray()
  cartData: any[];

  @IsOptional()
  @IsString()
  division: string;

  @IsOptional()
  @IsString()
  paymentTransactionId: string;

  @IsOptional()
  @IsString()
  deliveryType: string;

  @IsOptional()
  @IsString()
  orderFrom: string;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  incompleteOrderId: string;


  @IsOptional()
  @IsString()
  affiliateProductId: string;


  @IsOptional()
  @IsString()
  affiliateId: string;

  @IsOptional()
  @IsString()
  phoneNo: string;

  @IsOptional()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  paymentStatus: string;

  @IsOptional()
  @IsString()
  orderStatus: string;

  @IsOptional()
  @IsNumber()
  subTotal: number;

  @IsOptional()
  @IsNumber()
  discount: number;

  @IsOptional()
  @IsNumber()
  grandTotal: number;

  @IsOptional()
  @IsString()
  checkoutDate: string;

  @IsOptional()
  @IsString()
  note: string;

  @IsOptional()
  @IsString()
  coupon: string;

  @IsOptional()
  @IsString()
  user: string;

  @IsOptional()
  @IsString()
  paymentType: string;

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  orderedItems: any[];

  @IsOptional()
  @IsString()
  registrationDate: string;

  @IsOptional()
  @IsString()
  orderType: string;

  @IsOptional()
  @IsString()
  userOffer: string;

  @IsOptional()
  @IsBoolean()
  needSaveAddress: boolean;

  @IsOptional()
  @IsNumber()
  advancePayment: number;
}

export class InsertManyOrderDto {
  @Type(() => AddOrderDto)
  data: AddOrderDto[];

  option: OptionPayloadDto;
}

export class FilterOrderDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  user: any;

  @IsOptional()
  phoneNo: any;

  @IsOptional()
  status?: any;
}

export class UpdateOrderDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phoneNo: string;

  @IsOptional()
  @IsString()
  blockTime: string;

  @IsOptional()

  carts: string[];

  @IsOptional()
  cartData: any[];

  @IsOptional()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  status: string;


  @IsOptional()
  @IsString()
  paymentStatus: string;

  @IsOptional()
  @IsString()
  orderStatus: string;

  @IsOptional()
  @IsString()
  advancePaymentStatus: string;

  @IsOptional()
  @IsNumber()
  subTotal: number;

  @IsOptional()
  @IsNumber()
  discount: number;

  @IsOptional()
  @IsNumber()
  grandTotal: number;

  @IsOptional()
  @IsString()
  checkoutDate: string;

  @IsOptional()
  @IsString()
  note: string;

  @IsOptional()
  @IsString()
  user: string;

  @IsOptional()
  @IsString()
  orderType: string;


  @IsOptional()
  @IsString()
  paymentMethod: string;

  @IsOptional()
  @IsString()
  paymentApiType: string;

  @IsOptional()
  @IsString()
  paymentRefId: string;

  @IsOptional()
  @IsObject()
  orderItem: any;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  ids: string[];
}

export class UpdateOrderPaymentDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  stripPaymentId: string;
}

export class FilterUserOrderDto {
  @IsOptional()
  filter: string;
}

export class FilterAndPaginationOrderDto {
  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterOrderDto)
  filter: FilterOrderDto;

  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => PaginationDto)
  pagination: PaginationDto;

  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  sort: object;

  @IsOptional()
  user: object;

  @IsOptional()
  phoneNo: object;

  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  select: any;
}

export class UpdateOrderStatusDto {
  @IsOptional()
  @IsNumber()
  @IsIn([
    OrderStatus.PENDING,
    OrderStatus.CONFIRM,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPING,
    OrderStatus.DELIVERED,
    OrderStatus.CANCEL,
    OrderStatus.REFUND,
  ])
  orderStatus: number;

  @IsOptional()
  status: string;

  @IsOptional()
  paidAmount: number;

  @IsOptional()
  products: string[];
}

export class GenerateInvoicesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  ids: string[];
}