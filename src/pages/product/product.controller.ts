import {
  Body,
  Controller,
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
import { ProductService } from './product.service';
import {
  AddProductDto,
  DeleteProductDto,
  FilterAndPaginationProductDto,
  GetProductByIdsDto,
  UpdateProductDto,
} from './dto/product.dto';
import { AdminMetaRoles } from 'src/pages/admin/decorator/admin-roles.decorator';
import { AdminRoles } from 'src/enum/admin-roles.enum';
import { AdminRolesGuard } from 'src/pages/admin/guards/admin-roles.guard';
import { AdminMetaPermissions } from 'src/pages/admin/decorator/admin-permissions.decorator';
import { AdminPermissions } from 'src/enum/admin-permission.enum';
import { AdminPermissionGuard } from 'src/pages/admin/guards/admin-permission.guard';
import { AdminAuthGuard } from 'src/pages/admin/guards/admin-auth.guard';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { VendorAuthGuard } from 'src/pages/vendor/guards/vendor-auth.guard';
import { MongoIdValidationPipe } from 'src/pipes/mongo-id-validation.pipe';

@Controller('product')
export class ProductController {
  private logger = new Logger(ProductController.name);

  constructor(private productService: ProductService) {}

  /**
   * Public Api
   * getAllProductByShop()
   * getProductBySlug()
   * getProductByIds()
   */
  @Get('/get-all-data')
  @UsePipes(ValidationPipe)
  async getAllTagForUi(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query() query: Record<string, any>,
  ): Promise<ResponsePayload> {
    return await this.productService.getAllProductForUi(query);
  }

  @Get('/get-all-product-csv')
  @UsePipes(ValidationPipe)
  async getAllProductForCSV(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query() query: Record<string, any>,
  ): Promise<ResponsePayload> {
    return await this.productService.getAllProductForCSV(query);
  }

  @Post('/get-all-by-shop')
  @UsePipes(ValidationPipe)
  async getAllProductByShop(
    @Body() filterProductDto: FilterAndPaginationProductDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return await this.productService.getAllProductByShop(
      shop,
      filterProductDto,
      searchString,
    );
  }

  @Post('/get-all-by-shop-by-search')
  @UsePipes(ValidationPipe)
  async getAllProductSearchByShop(
    @Body() filterProductDto: FilterAndPaginationProductDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return await this.productService.getAllSearchProductByShop(
      shop,
      filterProductDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by-slug/:slug')
  async getProductBySlug(
    @Param('slug') slug: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.productService.getProductBySlug(shop, slug, select);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-product-by-id/:id')
  async getProductByUserById(
    @Param('id') id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
  ): Promise<ResponsePayload> {
    return await this.productService.getProductByUserById(shop, id, select);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-products-by-ids')
  async getProductByIds(
    @Body() getProductByIdsDto: GetProductByIdsDto,
    @Query('select') select: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.productService.getProductByIds(
      shop,
      getProductByIdsDto,
      select,
    );
  }

  /**
   * Vendor Secure Api
   * addProduct()
   * getProductById()
   * updateProductById()
   * updateMultipleProductById()
   * deleteMultipleProductByIdByVendor()
   * deleteMultipleTrashProduct()
   */

  @Post('/add')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async addProduct(
    @Body()
    addProductDto: AddProductDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.productService.addProduct(req.user, shop, addProductDto);
  }

  @Post('bulk-import')
  async bulkImport(
    @Body()
    products: any[],
    @Query('shop', MongoIdValidationPipe) shop: string,
  ) {
    return this.productService.bulkInsertProducts(products, shop);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by-id/:id')
  @UseGuards(VendorAuthGuard)
  async getProductById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('select') select: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.productService.getProductById(req.user, shop, id, select);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update/:id')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateProductById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateProductDto: UpdateProductDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.productService.updateProductById(
      req.user,
      shop,
      id,
      updateProductDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async updateMultipleProductById(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Body() updateProductDto: UpdateProductDto,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.productService.updateMultipleProductById(
      req.user,
      shop,
      updateProductDto.ids,
      updateProductDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/clone-by-vendor')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async cloneProductByVendor(
    @Body('id')
    id: string,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.productService.cloneProductByVendor(req.user, shop, id);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleProductByIdByVendor(
    @Body() deleteProductDto: DeleteProductDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.productService.deleteMultipleProductByIdByVendor(
      req.user,
      shop,
      deleteProductDto.ids,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-products')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleProductsById(
    @Body() deleteProductDto: DeleteProductDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.productService.deleteMultipleProductsById(
      req.user,
      shop,
      deleteProductDto.ids,
    );
  }

  /**
   * Get Low Stock Products
   */
  @Version(VERSION_NEUTRAL)
  @Get('/low-stock')
  @UseGuards(VendorAuthGuard)
  async getLowStockProducts(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('branch') branch?: string,
  ): Promise<ResponsePayload> {
    return await this.productService.getLowStockProducts(shop, branch);
  }

  /**
   * Get Expiring Products
   */
  @Version(VERSION_NEUTRAL)
  @Get('/expiring')
  @UseGuards(VendorAuthGuard)
  async getExpiringProducts(
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Query('days') days?: number,
  ): Promise<ResponsePayload> {
    return await this.productService.getExpiringProducts(
      shop,
      days ? parseInt(days.toString()) : 30,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-trash')
  @UsePipes(ValidationPipe)
  @UseGuards(VendorAuthGuard)
  async deleteMultipleTrashProduct(
    @Body() deleteProductDto: DeleteProductDto,
    @Query('shop', MongoIdValidationPipe) shop: string,
    @Req() req: any,
  ): Promise<ResponsePayload> {
    return await this.productService.deleteMultipleTrashProduct(
      req.user,
      shop,
      deleteProductDto.ids,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-all-trash-by-shop')
  @UsePipes(ValidationPipe)
  // @UseGuards(AffiliateAuthGuard)
  async deleteAllTrashByShop(
    @Query('shop', MongoIdValidationPipe) shop: string,
  ): Promise<ResponsePayload> {
    return await this.productService.deleteAllTrashByShop(shop);
  }
  /**
   * Admin Secure Api
   * getAllProducts()
   * deleteMultipleProductById()
   */

  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.ADMIN, AdminRoles.SUPER_ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminAuthGuard)
  async getAllProducts(
    @Body() filterProductDto: FilterAndPaginationProductDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.productService.getAllProducts(filterProductDto, searchString);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-by-admin')
  @UsePipes(ValidationPipe)
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminAuthGuard)
  async deleteMultipleProductById(
    @Body() data: { ids: string[] },
  ): Promise<ResponsePayload> {
    return await this.productService.deleteMultipleProductById(data.ids);
  }

  @Post('refresh')
  async refresh(@Query('shop') shop: string) {
    if (!shop) throw new Error('shop is required');
    const res = await this.productService.refreshFromClient(
      shop,

    );
    return { success: true, ...res };
  }
}
