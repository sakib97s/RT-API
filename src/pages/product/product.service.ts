import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AddProductDto,
  FilterAndPaginationProductDto,
  GetProductByIdsDto,
  UpdateProductDto,
} from './dto/product.dto';
import { Product } from './interfaces/product.interface';
import { Vendor } from 'src/pages/vendor/interfaces/vendor.interface';
import { UtilsService } from 'src/shared/utils/utils.service';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { Shop } from '../shop/interfaces/shop.interface';
import * as schedule from 'node-schedule';
import { MAX_PRODUCT_UPLOAD } from '../../config/global-variables';
import { FbCatalogService } from '../../shared/fb-catalog/fb-catalog.service';
import { Setting } from '../customization/setting/interface/setting.interface';
import { ShopInformation } from '../customization/shop-information/interfaces/shop-information.interface';
import { ErrorCodes } from '../../enum/error-code.enum';

import { Brand } from '../catalog/brand/interfaces/brand.interface';
import { Category } from '../catalog/category/interfaces/category.interface';
import { SubCategory } from '../catalog/sub-category/interfaces/sub-category.interface';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as FormData from 'form-data';
import { v4 as uuidv4 } from 'uuid';
import { ChildCategory } from '../catalog/child-category/interfaces/child-category.interface';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { Gallery } from "../image-gallery/gallery/interfaces/gallery.interface";

const ObjectId = Types.ObjectId;

@Injectable()
export class ProductService {
  private logger = new Logger(ProductService.name);
  private categoryCache = new Map<string, any>(); // key: `${shopId}::${name}`

  constructor(
    @InjectModel('Product') private readonly productModel: Model<Product>,
    @InjectModel('Shop') private readonly shopModel: Model<Shop>,
    @InjectModel('Setting') private readonly settingModel: Model<Setting>,
    @InjectModel('Brand') private brandModel: Model<Brand>,
    @InjectModel('Category') private categoryModel: Model<Category>,
    @InjectModel('SubCategory') private subCategoryModel: Model<SubCategory>,
    @InjectModel('ChildCategory')
    private childCategoryModel: Model<ChildCategory>,
    @InjectModel('ShopInformation')
    private readonly shopInformationModel: Model<ShopInformation>,
    @InjectModel('Gallery')
    private readonly galleryModel: Model<Gallery>,

    private utilsService: UtilsService,
    private readonly configService: ConfigService,
    private fbCatalogService: FbCatalogService,
    private readonly http: HttpService,
  ) {
    this.checkExpireEveryday();
  }

  /**
   * addProduct()
   * getAllProductByShop()
   * getProductById()
   * getAllProducts()
   * getProductBySlug()
   * getProductByIds()
   * updateProductById()
   * updateMultipleProductById()
   * updateMultipleVendorProductById()
   * deleteMultipleTrashProduct()
   * deleteMultipleProductByIdByVendor()
   * deleteMultipleProductById()
   */
  async addProduct(
    vendor: Vendor,
    shop: string,
    addProductDto: AddProductDto,
  ): Promise<ResponsePayload> {
    try {
      let fSlug: string;
      let fData: any;
      let finalSlug: string;

      const { quantity, name, autoSlug, slug } = addProductDto;

      const fShop = await this.shopModel.exists({
        _id: shop,
        'users._id': vendor._id,
      });

      if (!fShop) {
        return {
          success: false,
          message: 'Sorry! you have no access in this shop',
        } as ResponsePayload;
      }

      const totalProducts = await this.productModel.countDocuments({
        shop: shop,
      });

      if (totalProducts && totalProducts > MAX_PRODUCT_UPLOAD) {
        return {
          success: false,
          message: 'Sorry! exists your product upload limit with this shop.',
        } as ResponsePayload;
      }

      if (autoSlug) {
        fSlug = this.utilsService.transformToSlug(name);
        fData = await this.productModel.exists({ slug: fSlug });

        finalSlug = fData
          ? this.utilsService.transformToSlug(name, true)
          : fSlug;
      } else {
        fSlug = this.utilsService.transformToSlug(slug);
        fData = await this.productModel.exists({ slug: fSlug });

        finalSlug = fData
          ? this.utilsService.transformToSlug(slug, true)
          : fSlug;
      }

      const defaultData = {
        slug: finalSlug,
        quantity: quantity ? quantity : 0,
        dateString: this.utilsService.getDateString(new Date()),
      };

      // Handle expiry date string
      if (addProductDto.expiryDate) {
        defaultData['expiryDateString'] = this.utilsService.getDateString(addProductDto.expiryDate);
      }

      const finalData = {
        ...addProductDto,
        ...defaultData,
        ...{
          shop: shop,
          month: this.utilsService.getDateMonth(new Date(), false),
          year: this.utilsService.getDateYear(new Date()),
        },
      };

      const saveData: any = await this.productModel.create(finalData);
      const data = {
        _id: saveData._id,
      };

      // Setting Data
      const fSetting = await this.settingModel
        .findOne({ shop: shop })
        .select('facebookCatalog');

      if (
        fSetting?.facebookCatalog &&
        fSetting?.facebookCatalog?.isEnableFacebookCatalog
      ) {
        this.productUpdateOnFbCatalog(shop);
      }

      // Affiliate Product logic removed
      // Product Purchase History logic removed

      return {
        success: true,
        message: 'Success! Product added successfully.',
        data,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }
  // for (const p of products) {
  //   try {
  //     // Unique slug check
  //     let slug = p.slug;
  //     let count = 1;
  //     while (await this.productModel.exists({ slug })) {
  //       slug = `${p.slug}-${count++}`;
  //     }
  //
  //     let category = await this.categoryModel.findOne({
  //       name: p.category,
  //       shop,
  //     });
  //     if (!category) {
  //       category = await this.categoryModel.create({
  //         name: p.category,
  //         shop,
  //         slug: this.utilsService.transformToSlug(p.category, true),
  //       });
  //     }
  //
  //     // SubCategory check/create
  //
  //     let subCategory = await this.subCategoryModel.findOne({
  //       name: p.subCategory,
  //       'category._id': category._id,
  //       shop,
  //     });
  //     if (!subCategory) {
  //       subCategory = await this.subCategoryModel.create({
  //         name: p.subCategory,
  //         shop,
  //         slug: this.utilsService.transformToSlug(p.subCategory, true),
  //         category: category,
  //       });
  //     }
  //
  //     // Create product
  //     const product = await this.productModel.create({
  //       shop,
  //       name: p.name,
  //       slug,
  //       costPrice: p.costPrice,
  //       salePrice: p.salePrice,
  //       regularPrice: p.regularPrice,
  //       quantity: p.quantity,
  //       category: {
  //         _id: category._id,
  //         name: category.name,
  //         slug: category.slug,
  //       },
  //       subCategory: {
  //         _id: subCategory._id,
  //         name: subCategory.name,
  //         slug: subCategory.slug,
  //       },
  //       status: 'publish',
  //     });
  //
  //     insertedProducts.push(product);
  //   } catch (innerError) {
  //     failedProducts.push({
  //       product: p,
  //       error: innerError.message || 'Unknown error',
  //     });
  //   }
  // }

  // async bulkInsertProducts(
  //   products: any[],
  //   shop: string,
  // ): Promise<ResponsePayload> {
  //   try {
  //     const insertedProducts = [];
  //     const failedProducts = [];
  //
  //     for (const p of products) {
  //       try {
  //         // ✅ Unique Slug Generation
  //         let slug = this.utilsService.transformToSlug(p.slug);
  //         let count = 1;
  //         while (await this.productModel.exists({ slug })) {
  //           slug = `${p.slug}-${count++}`;
  //         }
  //
  //         // ✅ Category Handling
  //         let category = await this.categoryModel.findOne({
  //           name: p.category,
  //           shop,
  //         });
  //
  //         if (!category) {
  //           category = await this.categoryModel.create({
  //             name: p.category,
  //             shop,
  //             slug: this.utilsService.transformToSlug(p.category, true),
  //             status: 'publish',
  //           });
  //         }
  //
  //         // ✅ SubCategory Handling
  //         let subCategory = await this.subCategoryModel.findOne({
  //           name: p.subCategory,
  //           shop,
  //           'category._id': category._id,
  //         });
  //         if (!subCategory) {
  //           subCategory = await this.subCategoryModel.create({
  //             name: p.subCategory,
  //             shop,
  //             slug: this.utilsService.transformToSlug(p.subCategory, true),
  //             category: {
  //               _id: category._id,
  //               name: category.name,
  //               slug: category.slug,
  //             },
  //             status: 'publish',
  //           });
  //         }
  //
  //         // ✅ ChildCategory Handling
  //         let childCategory = null;
  //         if (p.childCategory) {
  //           childCategory = await this.childCategoryModel.findOne({
  //             name: p.childCategory,
  //             shop,
  //             'category._id': category._id,
  //             'subCategory._id': subCategory._id,
  //           });
  //           if (!childCategory) {
  //             childCategory = await this.childCategoryModel.create({
  //               name: p.childCategory,
  //               shop,
  //               slug: this.utilsService.transformToSlug(p.childCategory, true),
  //               category: {
  //                 _id: category._id,
  //                 name: category.name,
  //                 slug: category.slug,
  //               },
  //               subCategory: {
  //                 _id: subCategory._id,
  //                 name: subCategory.name,
  //                 slug: subCategory.slug,
  //               },
  //               status: 'publish',
  //             });
  //           }
  //         }
  //
  //         // ✅ Brand Handling
  //         let brand = null;
  //         if (p.brand) {
  //           brand = await this.brandModel.findOne({ name: p.brand, shop });
  //           if (!brand) {
  //             brand = await this.brandModel.create({
  //               name: p.brand,
  //               slug: this.utilsService.transformToSlug(p.brand, true),
  //               shop,
  //               status: 'publish',
  //             });
  //           }
  //         }
  //
  //         // ✅ Image Upload
  //         const images: any[] = [];
  //         // if (p.thumbnail_img) {
  //         //   const thumbUpload = await this.downloadAndUploadImage(
  //         //     p.thumbnail_img,
  //         //     shop,
  //         //   );
  //         //   if (thumbUpload.length) {
  //         //     images.push(thumbUpload[0]); // first image for thumbnail
  //         //   }
  //         // }
  //         if (p.photos) {
  //           const photoUrls = p.photos
  //             .split(',')
  //             .map((p) => p.trim())
  //             .filter((url) => this.isValidImageUrl(url));
  //           for (const url of photoUrls) {
  //             const uploaded = await this.downloadAndUploadImage(url, shop);
  //             const uploadedUrls = uploaded.map((img) => img.url); // ✅ শুধু URL
  //             // console.log('✅ Uploaded URLs:', uploadedUrls);
  //             images.push(...uploadedUrls); // ✅ শুধু string[] হবে
  //           }
  //         }
  //
  //         // ✅ Product Create
  //         const product = await this.productModel.create({
  //           shop,
  //           name: p.name,
  //           slug,
  //           sku: p.sku,
  //           costPrice: p.costPrice,
  //           salePrice: p.salePrice,
  //           regularPrice: p.regularPrice,
  //           quantity: p.quantity,
  //           unit: p.unit,
  //           seoTitle: p.seoTitle,
  //           seoDescription: p.seoDescription,
  //           seoKeyword: p.seoKeyword,
  //           description: p.description,
  //           keyFeature: p.keyFeature,
  //           shortDescription: p.shortDescription,
  //           category: {
  //             _id: category._id,
  //             name: category.name,
  //             slug: category.slug,
  //           },
  //           subCategory: {
  //             _id: subCategory._id,
  //             name: subCategory.name,
  //             slug: subCategory.slug,
  //           },
  //           childCategory: childCategory
  //             ? {
  //                 _id: childCategory._id,
  //                 name: childCategory.name,
  //                 slug: childCategory.slug,
  //               }
  //             : null,
  //           brand: brand
  //             ? {
  //                 _id: brand._id,
  //                 name: brand.name,
  //                 slug: brand.slug,
  //               }
  //             : null,
  //           images,
  //           status: 'publish',
  //         });
  //         insertedProducts.push(product);
  //       } catch (err) {
  //         failedProducts.push({ product: p, error: err.message });
  //       }
  //     }
  //
  //     return {
  //       success: true,
  //       message: 'Product import process completed',
  //       insertedCount: insertedProducts.length,
  //       failedCount: failedProducts.length,
  //       failedProducts,
  //     } as ResponsePayload;
  //   } catch (err) {
  //     throw new InternalServerErrorException(
  //       err.message || 'Something went wrong',
  //     );
  //   }
  // }

  async bulkInsertProducts(
    products: any[],
    shop: string,
  ): Promise<ResponsePayload> {
    // ---------- helpers ----------
    const toStr = (v: any): string => {
      if (v === null || v === undefined) return '';
      return typeof v === 'string' ? v.trim() : String(v).trim();
    };

    const hasText = (v: any): boolean => toStr(v) !== '';

    const safeSlug = (v: any, allowUnicode = true): string => {
      const base = toStr(v);
      // utilsService.transformToSlug স্ট্রিংে replace ইউজ করে, তাই ফাঁকা হলে ডিফল্ট দিন
      return this.utilsService.transformToSlug(base || 'item', allowUnicode);
    };

    // "A, B > C > D, X" থেকে সবচেয়ে অর্থবহ path বাছাই ও split
    const parseCategoryPath = (
      raw: any,
    ): { cat: string | null; sub: string | null; child: string | null } => {
      const txt = toStr(raw);
      if (!txt) return { cat: null, sub: null, child: null };

      // কমা দিয়ে সম্ভাব্য একাধিক path
      const candidates = txt
        .split(',')
        .map((s) => toStr(s))
        .filter(Boolean);

      // '>' থাকা সবচেয়ে বড় path পছন্দ; না থাকলে প্রথম টোকেন
      const chosen =
        candidates.find((s) => s.includes('>')) ??
        candidates.sort((a, b) => b.length - a.length)[0];

      if (!chosen) return { cat: null, sub: null, child: null };

      const parts = chosen
        .split('>')
        .map((s) => toStr(s))
        .filter(Boolean);
      const [cat, sub, child] = [
        parts[0] || null,
        parts[1] || null,
        parts[2] || null,
      ];
      return { cat, sub, child };
    };

    const collectImageUrls = (p: any): string[] => {
      // photos / images—দুটিই সাপোর্ট করুন; নিউলাইন/কমা/pipe যেকোনো সেপারেটর
      const raw = [p?.photos, p?.images].map(toStr).filter(Boolean).join('\n');
      if (!raw) return [];

      const urls = raw
        .split(/[\n,|]+/)
        .map((u) => toStr(u))
        .filter((u) => !!u && this.isValidImageUrl(u));

      return Array.from(new Set(urls)); // ডুপ্লিকেট কেটে দিন
    };

    const ensureCategory = async (name: string | null) => {
      const catName = toStr(name) || 'Uncategorized';
      let category = await this.categoryModel.findOne({ name: catName, shop });
      if (!category) {
        category = await this.categoryModel.create({
          name: catName,
          shop,
          slug: safeSlug(catName, true),
          status: 'publish',
        });
      }
      return category;
    };

    const ensureSubCategory = async (name: string | null, category: any) => {
      const subName = toStr(name);
      if (!subName) return null;

      let sub = await this.subCategoryModel.findOne({
        name: subName,
        shop,
        'category._id': category._id,
      });

      if (!sub) {
        sub = await this.subCategoryModel.create({
          name: subName,
          shop,
          slug: safeSlug(subName, true),
          category: {
            _id: category._id,
            name: category.name,
            slug: category.slug,
          },
          status: 'publish',
        });
      }
      return sub;
    };

    const ensureChildCategory = async (
      name: string | null,
      category: any,
      subCategory: any,
    ) => {
      const childName = toStr(name);
      if (!childName || !subCategory) return null;

      let child = await this.childCategoryModel.findOne({
        name: childName,
        shop,
        'category._id': category._id,
        'subCategory._id': subCategory._id,
      });

      if (!child) {
        child = await this.childCategoryModel.create({
          name: childName,
          shop,
          slug: safeSlug(childName, true),
          category: {
            _id: category._id,
            name: category.name,
            slug: category.slug,
          },
          subCategory: {
            _id: subCategory._id,
            name: subCategory.name,
            slug: subCategory.slug,
          },
          status: 'publish',
        });
      }
      return child;
    };

    const ensureBrand = async (name: string | null) => {
      const brandName = toStr(name);
      if (!brandName) return null;

      let brand = await this.brandModel.findOne({ name: brandName, shop });
      if (!brand) {
        brand = await this.brandModel.create({
          name: brandName,
          slug: safeSlug(brandName, true),
          shop,
          status: 'publish',
        });
      }
      return brand;
    };

    const uniqueSlug = async (
      baseInput: any,
      fallbackName: any,
    ): Promise<string> => {
      const baseSlug = safeSlug(
        hasText(baseInput) ? baseInput : fallbackName || `item-${Date.now()}`,
        true,
      );
      let slug = baseSlug;
      let i = 1;
      while (await this.productModel.exists({ slug })) {
        slug = `${baseSlug}-${i++}`;
      }
      return slug;
    };
    // --------------------------------

    try {
      const insertedProducts: any[] = [];
      const failedProducts: any[] = [];

      for (const p of products) {
        try {
          // ---------- slug ----------
          const slug = await uniqueSlug(p?.slug, p?.name);

          // ---------- category / sub / child ----------
          const parsed = parseCategoryPath(p?.category);

          const category = await ensureCategory(parsed.cat);

          // যদি ইনপুটে subCategory/childCategory থাকে, সেগুলো নাও; না থাকলে parsed থেকে নাও
          const subToUse = hasText(p?.subCategory)
            ? toStr(p?.subCategory)
            : parsed.sub;
          const subCategory = await ensureSubCategory(subToUse, category);

          // child create করার আগে sub থাকতে হবে; ইনপুটে child থাকলে সেটাই, না থাকলে parsed থেকে
          const childToUse = hasText(p?.childCategory)
            ? toStr(p?.childCategory)
            : parsed.child;
          const childCategory = await ensureChildCategory(
            childToUse,
            category,
            subCategory,
          );

          // ---------- brand ----------
          const brand = await ensureBrand(p?.brand);

          // ---------- images (download & upload) with retry logic ----------
          const imageUrls = collectImageUrls(p);
          const images: string[] = [];

          console.log(`Processing product: ${toStr(p?.name)} - Found ${imageUrls.length} image URLs`);

          for (const url of imageUrls) {
            try {
              const uploaded = await this.downloadAndUploadImage(url, shop);
              const onlyUrls = (uploaded || [])
                .map((img: any) => img?.url)
                .filter(Boolean);
              images.push(...onlyUrls);
              console.log(`✓ Image uploaded: ${url}`);
            } catch (imgErr: any) {
              console.error(`✗ Image upload failed for ${url}: ${imgErr?.message}`);
              // Continue with other images even if one fails
            }
          }

          // If no images uploaded but URLs were provided, log warning
          if (imageUrls.length > 0 && images.length === 0) {
            console.warn(`⚠ Product ${toStr(p?.name)} has ${imageUrls.length} images but none uploaded successfully`);
          }

          // ---------- product create ----------
          const product = await this.productModel.create({
            shop,
            name: toStr(p?.name),
            slug,
            sku: hasText(p?.sku) ? toStr(p?.sku) : null,

            costPrice: Number.isFinite(+p?.costPrice) ? +p.costPrice : 0,
            salePrice: Number.isFinite(+p?.salePrice) ? +p.salePrice : 0,
            regularPrice: Number.isFinite(+p?.regularPrice)
              ? +p.regularPrice
              : 0,
            quantity: Number.isFinite(+p?.quantity) ? +p.quantity : 0,

            unit: hasText(p?.unit) ? toStr(p?.unit) : null,

            seoTitle: hasText(p?.seoTitle) ? toStr(p?.seoTitle) : null,
            seoDescription: hasText(p?.seoDescription)
              ? toStr(p?.seoDescription)
              : null,
            seoKeyword: hasText(p?.seoKeyword) ? toStr(p?.seoKeyword) : null,

            description: hasText(p?.description) ? toStr(p?.description) : null,
            keyFeature: hasText(p?.keyFeature) ? toStr(p?.keyFeature) : null,
            shortDescription: hasText(p?.shortDescription)
              ? toStr(p?.shortDescription)
              : null,

            category: category
              ? { _id: category._id, name: category.name, slug: category.slug }
              : null,

            subCategory: subCategory
              ? {
                _id: subCategory._id,
                name: subCategory.name,
                slug: subCategory.slug,
              }
              : null,

            childCategory: childCategory
              ? {
                _id: childCategory._id,
                name: childCategory.name,
                slug: childCategory.slug,
              }
              : null,

            brand: brand
              ? { _id: brand._id, name: brand.name, slug: brand.slug }
              : null,

            images,
            status: 'publish',
          });

          console.log(`✓ Product created: ${product.name} with ${images.length} images`);
          insertedProducts.push(product);
        } catch (err: any) {
          console.error(`✗ Product creation failed for ${toStr(p?.name)}: ${err?.message}`);
          failedProducts.push({
            product: p,
            error: err?.message || 'Unknown error',
          });
        }
      }

      return {
        success: true,
        message: 'Product import process completed',
        insertedCount: insertedProducts.length,
        failedCount: failedProducts.length,
        failedProducts,
      } as ResponsePayload;
    } catch (err: any) {
      throw new InternalServerErrorException(
        err?.message || 'Something went wrong',
      );
    }
  }

  // async downloadAndUploadImage(url: string, shopId: string): Promise<any[]> {
  //   try {
  //     const headRes = await axios.head(url);
  //     if (headRes.status !== 200) {
  //       throw new Error(`Image not found at URL: ${url}`);
  //     }
  //
  //     const extension = path.extname(url.split('?')[0]) || '.jpg';
  //     const filename = uuidv4() + extension;
  //     const tempPath = `./upload/${filename}`;
  //     const uploadDir = './upload';
  //     if (!fs.existsSync(uploadDir)) {
  //       fs.mkdirSync(uploadDir, { recursive: true });
  //     }
  //     const response = await axios.get(url, { responseType: 'stream' });
  //     const writer = fs.createWriteStream(tempPath);
  //     response.data.pipe(writer);
  //
  //     await new Promise((resolve, reject) => {
  //       writer.on('finish', resolve);
  //       writer.on('error', reject);
  //     });
  //
  //     const formData = new FormData();
  //     formData.append('image', fs.createReadStream(tempPath));
  //
  //     const uploadRes = await axios.post(
  //       `${this.configService.get('cdnUrlBase')}/upload/single-image?shop=${shopId}`,
  //       formData,
  //       {
  //         headers: formData.getHeaders(),
  //       },
  //     );
  //
  //     fs.unlinkSync(tempPath);
  //
  //     return [uploadRes.data];
  //   } catch (err) {
  //     console.error(`Image upload failed: ${err.message} | URL: ${url}`);
  //     return [];
  //   }
  // }

  async downloadAndUploadImage(url: string, shopId: string, maxRetries = 2): Promise<any[]> {
    const uploadDir = './upload';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const filename = uuidv4() + (path.extname(url.split('?')[0]) || '.jpg');
      const tempPath = path.join(uploadDir, filename);
      let cleanupNeeded = false;

      try {
        if (attempt > 0) {
          console.log(`Retrying image upload (attempt ${attempt + 1}/${maxRetries + 1}): ${url}`);
        }

        // Download image
        const response = await axios.get(url, {
          responseType: 'stream',
          timeout: 30000, // 30 seconds timeout
        });

        await new Promise<void>((resolve, reject) => {
          const writer = fs.createWriteStream(tempPath);
          response.data.pipe(writer);
          writer.on('finish', () => resolve());
          writer.on('error', reject);
        });
        cleanupNeeded = true;

        // Get file size in KB
        const stat = fs.statSync(tempPath);
        const sizeKB = (stat.size / 1024).toFixed(2);

        // Prepare upload form
        const formData = new FormData();
        formData.append('image', fs.createReadStream(tempPath));

        const cdnBase = this.configService.get<string>('cdnUrlBase');
        const uploadRes = await axios.post(
          `${cdnBase}/upload/single-image?shop=${shopId}`,
          formData,
          {
            headers: formData.getHeaders(),
            timeout: 60000, // 60 seconds timeout for upload
          },
        );

        const uploadData = uploadRes?.data;
        const cdnUrl =
          uploadData?.url ||
          uploadData?.data?.url ||
          uploadData?.path ||
          uploadData?.data?.path ||
          uploadData;

        if (!cdnUrl || typeof cdnUrl !== 'string') {
          throw new Error('Invalid upload response');
        }

        // If CDN returns dimension info (optional)
        const widthStr =
          uploadData?.width?.toString() ||
          uploadData?.data?.width?.toString() ||
          '';
        const heightStr =
          uploadData?.height?.toString() ||
          uploadData?.data?.height?.toString() ||
          '';

        const now = new Date();
        const galleryPayload: Partial<any> = {
          shop: new Types.ObjectId(shopId),
          name: path.basename(filename, path.extname(filename)),
          url: cdnUrl,
          folder: 'Default',
          type: 'image',
          size: sizeKB,
          width: widthStr,
          height: heightStr,
          createdAt: now,
          updatedAt: now,
        };

        const created = await this.galleryModel.create(galleryPayload);

        if (cleanupNeeded && fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }

        return [created];
      } catch (err: any) {
        lastError = err;

        if (cleanupNeeded && fs.existsSync(tempPath)) {
          try {
            fs.unlinkSync(tempPath);
          } catch (cleanupErr) {
            // Ignore cleanup errors
          }
        }

        // If this was the last attempt, log and return
        if (attempt === maxRetries) {
          console.error(`Image upload failed after ${maxRetries + 1} attempts: ${err.message} | URL: ${url}`);
          return [];
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }

    return [];
  }
  isValidImageUrl(url: string): boolean {
    return /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(url); // ✅ added `i` flag
  }

  generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async getAllProductForUi(payload: any): Promise<ResponsePayload> {
    try {
      const { shop, status, page, limit } = payload;
      const fSetting: any = await this.settingModel
        .findOne({ shop: shop })
        .select('productSetting -_id');

      const tagName = payload['tags.name'] || payload?.tags?.name;

      console.log('getAllProductForUi payload:', payload);

      // Match exact shop ObjectId OR legacy products without a shop field
      const mFilter: any = {
        $or: [
          { shop: new Types.ObjectId(shop) },
          { shop: { $exists: false } },
          { shop: null },
        ],
      };

      if (status) {
        mFilter.status = status;
      }

      if (tagName) {
        // Case-insensitive regex match on embedded tag name
        mFilter['tags.name'] = { $regex: new RegExp(`^${tagName}$`, 'i') };
      }

      let sortQuery: any = {};
      if (fSetting?.productSetting?.isEnableSoldQuantitySort) {
        sortQuery = { totalSold: -1 };
      } else if (fSetting?.productSetting?.isEnablePrioritySort) {
        sortQuery = { priority: -1 };
      } else {
        sortQuery = { createdAt: -1 };
      }

      const skip = (Number(page) - 1) * Number(limit);

      const data = await this.productModel
        .find(mFilter)
        .select(
          'name variation variationOptions productCondition isEnablePhoneModel variation2Options seoKeyword seoTitle seoDescription variation2 slug tags quantity regularPrice salePrice images variationList isVariation prices ratingCount ratingTotal reviewTotal',
        )
        .skip(Number(skip))
        .limit(Number(limit))
        .sort(sortQuery);

      const totalCount = await this.productModel.countDocuments(mFilter);

      return {
        success: true,
        message: 'Success! Data fetch successfully.',
        data,
        count: totalCount,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getAllProductForCSV(payload: any): Promise<ResponsePayload> {
    try {
      const { shop } = payload;

      const mFilter: any = {
        shop: shop,
        isFacebookCatalog: true,
        status: 'publish',
      };

      const data = await this.productModel
        .find(mFilter)
        .select(
          'name shop variation variationOptions variation2Options  variation2 slug  quantity category brand regularPrice salePrice images variationList isVariation prices',
        )
        .sort({ priority: -1 });

      const totalCount = await this.productModel.countDocuments(mFilter);

      return {
        success: true,
        message: 'Success! Data fetch successfully.',
        data,
        count: totalCount,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getAllProductByShop(
    shop: string,
    filterProductDto: FilterAndPaginationProductDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    try {
      if (!shop) {
        return {
          success: false,
          message: 'Sorry! no data found.',
        } as ResponsePayload;
      }
      // const fSetting: any = await this.settingModel
      //   .findOne({ shop: shop })
      //   .select('productSetting -_id');
      //
      // let sortQuery: any = {};
      // if (fSetting.productSetting.isEnableSoldQuantitySort) {
      //   sortQuery = { totalSold: -1 };
      // } else if (fSetting.productSetting.isEnablePrioritySort) {
      //   sortQuery = { priority: -1 };
      // } else {
      //   sortQuery = { createdAt: -1 };
      // }
      // Modify Filter: match exact shop OR legacy products without a shop field
      const { filter } = filterProductDto;
      filterProductDto.filter = {
        ...(filter as any),
        $or: [
          { shop: new Types.ObjectId(shop) },
          { shop: { $exists: false } },
          { shop: null },
        ],
      } as any;

      return this.getAllProducts(filterProductDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllSearchProductByShop(
    shop: string,
    filterProductDto: FilterAndPaginationProductDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    try {
      if (!shop) {
        return {
          success: false,
          message: 'Sorry! no data found.',
        } as ResponsePayload;
      }

      // Modify Filter
      const { filter } = filterProductDto;
      filterProductDto.filter = { ...filter, ...{ shop: shop } };

      return this.getAllSearchProducts(filterProductDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllProductByShopUi(
    shop: string,
    filterProductDto: FilterAndPaginationProductDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    try {
      if (!shop) {
        return {
          success: false,
          message: 'Sorry! no data found.',
        } as ResponsePayload;
      }

      // Modify Filter
      const { filter } = filterProductDto;
      filterProductDto.filter = { ...filter, ...{ shop: shop } };

      return this.getAllProducts(filterProductDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }


  async getPreviewProductById(
    id: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.productModel.findById(id).select(select);
      return {
        success: true,
        message: 'Success',
        data,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getProductById(

    vendor: Vendor,
    shop: string,
    id: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const fShop = await this.shopModel.exists({
        _id: shop,
        'users._id': vendor._id,
      });

      if (!fShop) {
        return {
          success: false,
          message: 'Sorry! you have no access in this shop',
        } as ResponsePayload;
      }

      const data = await this.productModel
        .findOne({ _id: id, $or: [{ shop: shop }, { shop: { $exists: false } }, { shop: null }] })
        .select(select);

      return {
        success: true,
        message: 'Success! Data fetch successfully.',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  // async getAllProducts(
  //   filterProductDto: FilterAndPaginationProductDto,
  //   searchQuery?: string,
  // ): Promise<ResponsePayload> {
  //   const { filter } = filterProductDto;
  //   const { pagination } = filterProductDto;
  //   const { sort } = filterProductDto;
  //   const { select } = filterProductDto;
  //   const { filterGroup } = filterProductDto;
  //
  //   // Aggregate Stages
  //   const aggregateStages = [];
  //   const aggregateCategoryGroupStages = [];
  //   const aggregateBrandGroupStages = [];
  //   const aggregateSubCategoryGroupStages = [];
  //
  //   // Essential Variables
  //   let mFilter = {};
  //   let mSort = {};
  //   let mSelect = {};
  //   let mPagination = {};
  //
  //   // Match
  //   if (filter) {
  //     if (filter['category._id']) {
  //       filter['category._id'] = new ObjectId(filter['category._id']);
  //     }
  //
  //     if (filter['subCategory._id']) {
  //       filter['subCategory._id'] = new ObjectId(filter['subCategory._id']);
  //     }
  //
  //     if (filter['brand._id']) {
  //       filter['brand._id'] = new ObjectId(filter['brand._id']);
  //     }
  //
  //     if (filter['skinType._id']) {
  //       filter['skinType._id'] = new ObjectId(filter['skinType._id']);
  //     }
  //
  //     if (filter['skinConcern._id']) {
  //       filter['skinConcern._id'] = new ObjectId(filter['skinConcern._id']);
  //     }
  //
  //     if (filter['tags']) {
  //       filter['tags'] = new ObjectId(filter['tags']);
  //     }
  //
  //     if (filter['shop']) {
  //       filter['shop'] = new ObjectId(filter['shop']);
  //     }
  //     mFilter = { ...mFilter, ...filter };
  //   }
  //   if (searchQuery) {
  //     // const mSearchQuery = searchQuery.replace(/[^a-zA-Z0-9 ]/g, '');
  //
  //     mFilter = {
  //       $and: [
  //         mFilter,
  //         {
  //           $or: [
  //             { name: this.utilsService.createRegexFromString(searchQuery) },
  //             { keyWord: this.utilsService.createRegexFromString(searchQuery) },
  //             // { name: { $regex: mSearchQuery, $options: 'i' } },
  //             // ✅ New: search inside orderedItems
  //             { sku: this.utilsService.createRegexFromString(searchQuery) },
  //             {
  //               'variationList.sku':
  //                 this.utilsService.createRegexFromString(searchQuery),
  //             },
  //             {
  //               'category.name':
  //                 this.utilsService.createRegexFromString(searchQuery),
  //             },
  //           ],
  //         },
  //       ],
  //     };
  //   }
  //   // Sort
  //   if (sort) {
  //     mSort = sort;
  //   } else {
  //     mSort = { createdAt: -1 };
  //   }
  //
  //   // Select
  //   if (select) {
  //     mSelect = { ...select };
  //   } else {
  //     mSelect = { name: 1 };
  //   }
  //
  //   // GROUPING FOR FILTER PRODUCTS
  //   let groupCategory: any;
  //   let groupBrand: any;
  //   let groupSubCategory: any;
  //
  //   if (filterGroup && filterGroup.isGroup) {
  //     if (filterGroup.category) {
  //       groupCategory = [
  //         {
  //           $match: { shop: new ObjectId(filter.shop) }, // Filter by shop ID
  //         },
  //         {
  //           $group: {
  //             _id: { category: '$category._id' },
  //             name: { $first: '$category.name' },
  //             slug: { $first: '$category.slug' },
  //             images: { $first: '$category.images' },
  //             total: { $sum: 1 },
  //           },
  //         },
  //       ];
  //     }
  //
  //     if (filterGroup.brand) {
  //       groupBrand = [
  //         {
  //           $match: { shop: filter.shop }, // Filter by shop ID
  //         },
  //         {
  //           $group: {
  //             _id: { brand: '$brand._id' },
  //             name: { $first: '$brand.name' },
  //             slug: { $first: '$brand.slug' },
  //             images: { $first: '$brand.images' },
  //             total: { $sum: 1 },
  //           },
  //         },
  //       ];
  //     }
  //
  //     if (filterGroup.subCategory) {
  //       groupSubCategory = [
  //         {
  //           $match: { shop: filter.shop }, // Filter by shop ID
  //         },
  //         {
  //           $group: {
  //             _id: { subCategory: '$subCategory._id' },
  //             name: { $first: '$subCategory.name' },
  //             slug: { $first: '$subCategory.slug' },
  //             images: { $first: '$subCategory.images' },
  //             total: { $sum: 1 },
  //           },
  //         },
  //       ];
  //     }
  //   }
  //
  //   // Search A-Z
  //   if (searchQuery) {
  //     aggregateStages.push({
  //       $addFields: {
  //         sortBySearch: {
  //           $indexOfCP: ['$name', searchQuery.toLowerCase()],
  //         },
  //       },
  //     });
  //   }
  //
  //   // Finalize
  //   if (Object.keys(mFilter).length) {
  //     // Main
  //     aggregateStages.push({ $match: mFilter });
  //
  //     // Category Groups
  //     if (groupCategory) {
  //       // aggregateCategoryGroupStages.push({ $match: mFilter });
  //       aggregateCategoryGroupStages.push(groupCategory);
  //     }
  //
  //     // Sub Category Groups
  //     if (groupSubCategory) {
  //       // aggregateSubCategoryGroupStages.push({ $match: mFilter });
  //       aggregateSubCategoryGroupStages.push(groupSubCategory);
  //     }
  //
  //     // Brand Groups
  //     if (groupBrand) {
  //       // aggregateBrandGroupStages.push({ $match: mFilter });
  //       aggregateBrandGroupStages.push(groupBrand);
  //     }
  //   } else {
  //     if (groupCategory) {
  //       aggregateCategoryGroupStages.push(groupCategory);
  //     }
  //     if (groupSubCategory) {
  //       aggregateSubCategoryGroupStages.push(groupSubCategory);
  //     }
  //     if (groupBrand) {
  //       aggregateBrandGroupStages.push(groupBrand);
  //     }
  //   }
  //
  //   if (Object.keys(mSort).length) {
  //     aggregateStages.push({ $sort: mSort });
  //   }
  //
  //   if (!pagination) {
  //     aggregateStages.push({ $project: mSelect });
  //   }
  //
  //   // Pagination
  //   if (pagination) {
  //     if (Object.keys(mSelect).length) {
  //       mPagination = {
  //         $facet: {
  //           metadata: [{ $count: 'total' }],
  //           data: [
  //             {
  //               $skip: pagination.pageSize * pagination.currentPage,
  //             } /* IF PAGE START FROM 0 OR (pagination.currentPage - 1) IF PAGE 1*/,
  //             { $limit: pagination.pageSize },
  //             { $project: mSelect },
  //           ],
  //         },
  //       };
  //     } else {
  //       mPagination = {
  //         $facet: {
  //           metadata: [{ $count: 'total' }],
  //           data: [
  //             {
  //               $skip: pagination.pageSize * pagination.currentPage,
  //             } /* IF PAGE START FROM 0 OR (pagination.currentPage - 1) IF PAGE 1*/,
  //             { $limit: pagination.pageSize },
  //           ],
  //         },
  //       };
  //     }
  //
  //     aggregateStages.push(mPagination);
  //
  //     aggregateStages.push({
  //       $project: {
  //         data: 1,
  //         count: { $arrayElemAt: ['$metadata.total', 0] },
  //       },
  //     });
  //   }
  //
  //   try {
  //     // Main
  //     const dataAggregates = await this.productModel.aggregate(
  //       aggregateStages,
  //       { allowDiskUse: true },
  //     );
  //
  //     // GROUP FILTER PRODUCTS DATA
  //     let categoryAggregates: any;
  //     let subCategoryAggregates: any;
  //     let brandAggregates: any;
  //
  //     // Category
  //     if (filterGroup && filterGroup.isGroup && filterGroup.category) {
  //       categoryAggregates = await this.productModel.aggregate(
  //         aggregateCategoryGroupStages,
  //         { allowDiskUse: true },
  //       );
  //     }
  //
  //     // Sub Category
  //     if (filterGroup && filterGroup.isGroup && filterGroup.subCategory) {
  //       subCategoryAggregates = await this.productModel.aggregate(
  //         aggregateSubCategoryGroupStages,
  //         { allowDiskUse: true },
  //       );
  //     }
  //
  //     // Brand
  //     if (filterGroup && filterGroup.isGroup && filterGroup.brand) {
  //       brandAggregates = await this.productModel.aggregate(
  //         aggregateBrandGroupStages,
  //         { allowDiskUse: true },
  //       );
  //     }
  //
  //     // Main Filter Data
  //     let allFilterGroups: any;
  //     if (filterGroup && filterGroup.isGroup) {
  //       allFilterGroups = {
  //         categories:
  //           categoryAggregates && categoryAggregates.length
  //             ? categoryAggregates
  //             : [],
  //         subCategories:
  //           subCategoryAggregates && subCategoryAggregates.length
  //             ? subCategoryAggregates
  //             : [],
  //         brands:
  //           brandAggregates && brandAggregates.length ? brandAggregates : [],
  //       };
  //     } else {
  //       allFilterGroups = null;
  //     }
  //
  //     if (pagination) {
  //       if (
  //         pagination.currentPage < 1 &&
  //         filter == null &&
  //         JSON.stringify(sort) == JSON.stringify({ createdAt: -1 })
  //       ) {
  //       }
  //
  //       return {
  //         ...{ ...dataAggregates[0] },
  //         ...{
  //           success: true,
  //           message: 'Success',
  //           filterGroup: allFilterGroups,
  //         },
  //       } as ResponsePayload;
  //     } else {
  //       return {
  //         data: dataAggregates,
  //         success: true,
  //         message: 'Success',
  //         count: dataAggregates.length,
  //         filterGroup: allFilterGroups,
  //       } as ResponsePayload;
  //     }
  //   } catch (error) {
  //     console.log(error);
  //     throw new InternalServerErrorException();
  //   }
  // }

  async getAllProducts(
    filterProductDto: FilterAndPaginationProductDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterProductDto;
    const { pagination } = filterProductDto;
    const { sort } = filterProductDto;
    const { select } = filterProductDto;
    const { filterGroup } = filterProductDto;

    // Aggregate Stages
    const aggregateStages: any[] = [];
    const aggregateCategoryGroupStages: any[] = [];
    const aggregateBrandGroupStages: any[] = [];
    const aggregateSubCategoryGroupStages: any[] = [];

    // Essential Variables
    let mFilter: any = {};
    let mSort: any = {};
    let mSelect: any = {};
    let mPagination: any = {};

    // ------ Match / Filter ------
    if (filter) {
      if (filter['category._id']) {
        filter['category._id'] = new ObjectId(filter['category._id']);
      }
      if (filter['subCategory._id']) {
        filter['subCategory._id'] = new ObjectId(filter['subCategory._id']);
      }
      if (filter['brand._id']) {
        filter['brand._id'] = new ObjectId(filter['brand._id']);
      }
      if (filter['skinType._id']) {
        filter['skinType._id'] = new ObjectId(filter['skinType._id']);
      }
      if (filter['skinConcern._id']) {
        filter['skinConcern._id'] = new ObjectId(filter['skinConcern._id']);
      }
      if (filter['tags']) {
        filter['tags'] = new ObjectId(filter['tags']);
      }
      if (filter['shop']) {
        filter['shop'] = new ObjectId(filter['shop']);
      }
      mFilter = { ...mFilter, ...filter };
    }

    if (searchQuery) {
      mFilter = {
        $and: [
          mFilter,
          {
            $or: [
              { name: this.utilsService.createRegexFromString(searchQuery) },
              { keyWord: this.utilsService.createRegexFromString(searchQuery) },
              { sku: this.utilsService.createRegexFromString(searchQuery) },
              { barcode: this.utilsService.createRegexFromString(searchQuery) },
              {
                'variationList.sku':
                  this.utilsService.createRegexFromString(searchQuery),
              }, {
                'variationList.barcode':
                  this.utilsService.createRegexFromString(searchQuery),
              },
              {
                'category.name':
                  this.utilsService.createRegexFromString(searchQuery),
              },
            ],
          },
        ],
      };
    }

    // ------ Sort (default) ------

    const fSetting: any = await this.settingModel
      .findOne({ shop: filterProductDto?.shop })
      .select('productSetting -_id');

    if (sort) {
      mSort = sort;
    } else {
      // mSort = { createdAt: -1 };
      if (fSetting?.productSetting?.isEnableSoldQuantitySort) {
        mSort = { totalSold: -1 };
      } else if (fSetting?.productSetting?.isEnablePrioritySort) {
        mSort = { priority: -1 };
      } else {
        mSort = { createdAt: -1 };
      }
    }

    // ------ Select (default) ------
    if (select) {
      mSelect = { ...select };
    } else {
      mSelect = { name: 1 };
    }

    // ------ GROUPING FOR FILTER PRODUCTS ------
    let groupCategory: any;
    let groupBrand: any;
    let groupSubCategory: any;

    if (filterGroup && filterGroup.isGroup) {
      if (filterGroup.category) {
        groupCategory = [
          { $match: { shop: filter?.shop ?? null } }, // shop must already be ObjectId above
          {
            $group: {
              _id: { category: '$category._id' },
              name: { $first: '$category.name' },
              slug: { $first: '$category.slug' },
              images: { $first: '$category.images' },
              total: { $sum: 1 },
            },
          },
        ];
      }

      if (filterGroup.brand) {
        groupBrand = [
          { $match: { shop: filter?.shop ?? null } },
          {
            $group: {
              _id: { brand: '$brand._id' },
              name: { $first: '$brand.name' },
              slug: { $first: '$brand.slug' },
              images: { $first: '$brand.images' },
              total: { $sum: 1 },
            },
          },
        ];
      }

      if (filterGroup.subCategory) {
        groupSubCategory = [
          { $match: { shop: filter?.shop ?? null } },
          {
            $group: {
              _id: { subCategory: '$subCategory._id' },
              name: { $first: '$subCategory.name' },
              slug: { $first: '$subCategory.slug' },
              images: { $first: '$subCategory.images' },
              total: { $sum: 1 },
            },
          },
        ];
      }
    }

    // ------ Finalize: push $match ------
    if (Object.keys(mFilter).length) {
      aggregateStages.push({ $match: mFilter });

      if (groupCategory) aggregateCategoryGroupStages.push(groupCategory);
      if (groupSubCategory)
        aggregateSubCategoryGroupStages.push(groupSubCategory);
      if (groupBrand) aggregateBrandGroupStages.push(groupBrand);
    } else {
      if (groupCategory) aggregateCategoryGroupStages.push(groupCategory);
      if (groupSubCategory)
        aggregateSubCategoryGroupStages.push(groupSubCategory);
      if (groupBrand) aggregateBrandGroupStages.push(groupBrand);
    }

    // ------ Search-aware sorting helpers (ONLY when searchQuery exists) ------
    if (searchQuery) {
      const qLower = searchQuery.toLowerCase();

      // helper fields
      aggregateStages.push(
        { $addFields: { _nameLower: { $toLower: '$name' } } },
        {
          $addFields: {
            _idx: { $indexOfCP: ['$_nameLower', qLower] },
            _notFound: {
              $cond: [
                { $eq: [{ $indexOfCP: ['$_nameLower', qLower] }, -1] },
                1,
                0,
              ],
            },
            _startsWith: {
              $cond: [
                { $eq: [{ $indexOfCP: ['$_nameLower', qLower] }, 0] },
                1,
                0,
              ],
            },
          },
        },
      );

      // override sort for search ranking
      mSort = {
        _notFound: 1, // found first
        _startsWith: -1, // startsWith first
        _idx: 1, // earlier match first
        _nameLower: 1, // pure A→Z
      };
    }

    // ------ Sort ------
    if (Object.keys(mSort).length) {
      aggregateStages.push({ $sort: mSort });
    }

    // helper fields remove (keep response clean)
    if (searchQuery) {
      aggregateStages.push({
        $unset: ['_idx', '_startsWith', '_notFound', '_nameLower'],
      });
    }

    // ------ Projection (no pagination) ------
    if (!pagination) {
      aggregateStages.push({ $project: mSelect });
    }

    // ------ Pagination ------
    if (pagination) {
      if (Object.keys(mSelect).length) {
        mPagination = {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [
              { $skip: pagination.pageSize * pagination.currentPage },
              { $limit: pagination.pageSize },
              { $project: mSelect },
            ],
          },
        };
      } else {
        mPagination = {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [
              { $skip: pagination.pageSize * pagination.currentPage },
              { $limit: pagination.pageSize },
            ],
          },
        };
      }

      aggregateStages.push(mPagination);
      aggregateStages.push({
        $project: {
          data: 1,
          count: { $arrayElemAt: ['$metadata.total', 0] },
        },
      });
    }

    try {
      // Main
      const dataAggregates = await this.productModel.aggregate(
        aggregateStages,
        {
          allowDiskUse: true,
        },
      );

      // GROUP FILTER PRODUCTS DATA
      let categoryAggregates: any;
      let subCategoryAggregates: any;
      let brandAggregates: any;

      if (filterGroup && filterGroup.isGroup && filterGroup.category) {
        categoryAggregates = await this.productModel.aggregate(
          aggregateCategoryGroupStages,
          { allowDiskUse: true },
        );
      }
      if (filterGroup && filterGroup.isGroup && filterGroup.subCategory) {
        subCategoryAggregates = await this.productModel.aggregate(
          aggregateSubCategoryGroupStages,
          { allowDiskUse: true },
        );
      }
      if (filterGroup && filterGroup.isGroup && filterGroup.brand) {
        brandAggregates = await this.productModel.aggregate(
          aggregateBrandGroupStages,
          { allowDiskUse: true },
        );
      }

      let allFilterGroups: any;
      if (filterGroup && filterGroup.isGroup) {
        allFilterGroups = {
          categories: categoryAggregates?.length ? categoryAggregates : [],
          subCategories: subCategoryAggregates?.length
            ? subCategoryAggregates
            : [],
          brands: brandAggregates?.length ? brandAggregates : [],
        };
      } else {
        allFilterGroups = null;
      }

      if (pagination) {
        if (
          pagination.currentPage < 1 &&
          filter == null &&
          JSON.stringify(sort) == JSON.stringify({ createdAt: -1 })
        ) {
          // no-op
        }

        return {
          ...{ ...dataAggregates[0] },
          ...{
            success: true,
            message: 'Success',
            filterGroup: allFilterGroups,
          },
        } as ResponsePayload;
      } else {
        return {
          data: dataAggregates,
          success: true,
          message: 'Success',
          count: dataAggregates.length,
          filterGroup: allFilterGroups,
        } as ResponsePayload;
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  async getAllSearchProducts(
    filterProductDto: FilterAndPaginationProductDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterProductDto;
    const { pagination } = filterProductDto;
    const { sort } = filterProductDto;
    const { select } = filterProductDto;
    const { filterGroup } = filterProductDto;

    // Aggregate Stages
    const aggregateStages = [];
    const aggregateCategoryGroupStages = [];
    const aggregateBrandGroupStages = [];
    const aggregateSubCategoryGroupStages = [];

    // Essential Variables
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
      if (filter['category._id']) {
        filter['category._id'] = new ObjectId(filter['category._id']);
      }

      if (filter['subCategory._id']) {
        filter['subCategory._id'] = new ObjectId(filter['subCategory._id']);
      }

      if (filter['brand._id']) {
        filter['brand._id'] = new ObjectId(filter['brand._id']);
      }

      if (filter['skinType._id']) {
        filter['skinType._id'] = new ObjectId(filter['skinType._id']);
      }

      if (filter['skinConcern._id']) {
        filter['skinConcern._id'] = new ObjectId(filter['skinConcern._id']);
      }

      if (filter['tags']) {
        filter['tags'] = new ObjectId(filter['tags']);
      }

      if (filter['shop']) {
        filter['shop'] = new ObjectId(filter['shop']);
      }
      mFilter = { ...mFilter, ...filter };
    }
    if (searchQuery) {
      // const mSearchQuery = searchQuery.replace(/[^a-zA-Z0-9 ]/g, '');

      mFilter = {
        $and: [
          mFilter,
          {
            $or: [
              { name: this.utilsService.createRegexFromString(searchQuery) },
              { keyWord: this.utilsService.createRegexFromString(searchQuery) },
              {
                'brand?.name':
                  this.utilsService.createRegexFromString(searchQuery),
              },
              {
                'category?.name':
                  this.utilsService.createRegexFromString(searchQuery),
              },
              // { name: { $regex: mSearchQuery, $options: 'i' } },
            ],
          },
        ],
      };
    }
    // Sort
    if (sort) {
      mSort = sort;
    } else {
      mSort = { createdAt: -1 };
    }

    // Select
    if (select) {
      mSelect = { ...select };
    } else {
      mSelect = { name: 1 };
    }

    // GROUPING FOR FILTER PRODUCTS
    let groupCategory: any;
    let groupBrand: any;
    let groupSubCategory: any;

    if (filterGroup && filterGroup.isGroup) {
      if (filterGroup.category) {
        groupCategory = [
          {
            $match: { shop: new ObjectId(filter.shop) }, // Filter by shop ID
          },
          {
            $group: {
              _id: { category: '$category._id' },
              name: { $first: '$category.name' },
              slug: { $first: '$category.slug' },
              images: { $first: '$category.images' },
              total: { $sum: 1 },
            },
          },
        ];
      }

      if (filterGroup.brand) {
        groupBrand = [
          {
            $match: { shop: filter.shop }, // Filter by shop ID
          },
          {
            $group: {
              _id: { brand: '$brand._id' },
              name: { $first: '$brand.name' },
              slug: { $first: '$brand.slug' },
              images: { $first: '$brand.images' },
              total: { $sum: 1 },
            },
          },
        ];
      }

      if (filterGroup.subCategory) {
        groupSubCategory = [
          {
            $match: { shop: filter.shop }, // Filter by shop ID
          },
          {
            $group: {
              _id: { subCategory: '$subCategory._id' },
              name: { $first: '$subCategory.name' },
              slug: { $first: '$subCategory.slug' },
              images: { $first: '$subCategory.images' },
              total: { $sum: 1 },
            },
          },
        ];
      }
    }

    // Search A-Z
    if (searchQuery) {
      aggregateStages.push({
        $addFields: {
          sortBySearch: {
            $indexOfCP: ['$name', searchQuery.toLowerCase()],
          },
        },
      });
    }

    // Finalize
    if (Object.keys(mFilter).length) {
      // Main
      aggregateStages.push({ $match: mFilter });

      // Category Groups
      if (groupCategory) {
        // aggregateCategoryGroupStages.push({ $match: mFilter });
        aggregateCategoryGroupStages.push(groupCategory);
      }

      // Sub Category Groups
      if (groupSubCategory) {
        // aggregateSubCategoryGroupStages.push({ $match: mFilter });
        aggregateSubCategoryGroupStages.push(groupSubCategory);
      }

      // Brand Groups
      if (groupBrand) {
        // aggregateBrandGroupStages.push({ $match: mFilter });
        aggregateBrandGroupStages.push(groupBrand);
      }
    } else {
      if (groupCategory) {
        aggregateCategoryGroupStages.push(groupCategory);
      }
      if (groupSubCategory) {
        aggregateSubCategoryGroupStages.push(groupSubCategory);
      }
      if (groupBrand) {
        aggregateBrandGroupStages.push(groupBrand);
      }
    }

    if (Object.keys(mSort).length) {
      aggregateStages.push({ $sort: mSort });
    }

    if (!pagination) {
      aggregateStages.push({ $project: mSelect });
    }

    // Pagination
    if (pagination) {
      if (Object.keys(mSelect).length) {
        mPagination = {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [
              {
                $skip: pagination.pageSize * pagination.currentPage,
              } /* IF PAGE START FROM 0 OR (pagination.currentPage - 1) IF PAGE 1*/,
              { $limit: pagination.pageSize },
              { $project: mSelect },
            ],
          },
        };
      } else {
        mPagination = {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [
              {
                $skip: pagination.pageSize * pagination.currentPage,
              } /* IF PAGE START FROM 0 OR (pagination.currentPage - 1) IF PAGE 1*/,
              { $limit: pagination.pageSize },
            ],
          },
        };
      }

      aggregateStages.push(mPagination);

      aggregateStages.push({
        $project: {
          data: 1,
          count: { $arrayElemAt: ['$metadata.total', 0] },
        },
      });
    }

    try {
      // Main
      const dataAggregates = await this.productModel.aggregate(
        aggregateStages,
        { allowDiskUse: true },
      );

      // GROUP FILTER PRODUCTS DATA
      let categoryAggregates: any;
      let subCategoryAggregates: any;
      let brandAggregates: any;

      // Category
      if (filterGroup && filterGroup.isGroup && filterGroup.category) {
        categoryAggregates = await this.productModel.aggregate(
          aggregateCategoryGroupStages,
          { allowDiskUse: true },
        );
      }

      // Sub Category
      if (filterGroup && filterGroup.isGroup && filterGroup.subCategory) {
        subCategoryAggregates = await this.productModel.aggregate(
          aggregateSubCategoryGroupStages,
          { allowDiskUse: true },
        );
      }

      // Brand
      if (filterGroup && filterGroup.isGroup && filterGroup.brand) {
        brandAggregates = await this.productModel.aggregate(
          aggregateBrandGroupStages,
          { allowDiskUse: true },
        );
      }

      let matchedBrands = [];
      let matchedCategories = [];

      // if (searchQuery) {
      //   const regex = this.utilsService.createRegexFromString(searchQuery);
      //
      //   matchedBrands = await this.brandModel
      //     .find({
      //       name: { $regex: regex }, // Case-insensitive
      //       shop: filter['shop'],
      //       status: 'publish',
      //     })
      //     .select('name slug images')
      //     .lean();
      //
      //   matchedCategories = await this.categoryModel
      //     .find({
      //       name: { $regex: regex }, // Case-insensitive
      //       shop: filter['shop'],
      //       status: 'publish',
      //     })
      //     .select('name slug images')
      //     .lean();
      // }
      if (searchQuery && dataAggregates?.[0]?.data?.length) {
        const productResults = dataAggregates[0].data;

        const brandIds = [
          ...new Set(
            productResults
              .filter((p) => p.brand?._id)
              .map((p) => new ObjectId(p.brand._id)),
          ),
        ];
        const categoryIds = [
          ...new Set(
            productResults
              .filter((p) => p.category?._id)
              .map((p) => new ObjectId(p.category._id)),
          ),
        ];

        if (brandIds.length) {
          matchedBrands = await this.brandModel
            .find({
              _id: { $in: brandIds },
              shop: filter['shop'],
              status: 'publish',
            })
            .select('name slug images')
            .lean();
        }

        if (categoryIds.length) {
          matchedCategories = await this.categoryModel
            .find({
              _id: { $in: categoryIds },
              shop: filter['shop'],
              status: 'publish',
            })
            .select('name slug images')
            .lean();
        }
      }
      // Main Filter Data
      let allFilterGroups: any;
      if (filterGroup && filterGroup.isGroup) {
        allFilterGroups = {
          categories:
            categoryAggregates && categoryAggregates.length
              ? categoryAggregates
              : [],
          subCategories:
            subCategoryAggregates && subCategoryAggregates.length
              ? subCategoryAggregates
              : [],
          brands:
            brandAggregates && brandAggregates.length ? brandAggregates : [],
        };
      } else {
        allFilterGroups = null;
      }

      if (pagination) {
        if (
          pagination.currentPage < 1 &&
          filter == null &&
          JSON.stringify(sort) == JSON.stringify({ createdAt: -1 })
        ) {
        }

        return {
          ...{ ...dataAggregates[0] },
          ...{
            success: true,
            message: 'Success',
            filterGroup: allFilterGroups,
            matchedBrands,
            matchedCategories,
          },
        } as ResponsePayload;
      } else {
        return {
          data: dataAggregates,
          success: true,
          message: 'Success',
          count: dataAggregates.length,
          filterGroup: allFilterGroups,
        } as ResponsePayload;
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  async getProductBySlug(
    shop: string,
    slug: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.productModel
        .findOne({
          slug: slug,
          $or: [
            { shop: new Types.ObjectId(shop) },
            { shop: { $exists: false } },
            { shop: null },
          ],
        })
        .select(select);

      // Increment view count
      if (data) {
        await this.productModel.findByIdAndUpdate(data._id, {
          $inc: {
            totalView: 1,
          },
        });
      }

      return {
        success: true,
        message: 'Success! data fetch successfully.',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getProductBySlugForPrerender(
    domain: string,
    slug: string,
    select: string,
  ): Promise<any> {
    try {
      const fShop = await this.shopModel
        .findOne({ domain: domain })
        .select('_id');
      return await this.productModel
        .findOne({ slug: slug, shop: fShop._id })
        .select(select);
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async getShopByDomainForPrerender(domain: string): Promise<any> {
    try {
      const fShop = await this.shopModel
        .findOne({ domain: domain })
        .select('_id');
      return await this.shopInformationModel
        .findOne({ shop: fShop._id })
        .select('websiteName shortDescription logoPrimary');
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async getProductByUserById(
    shop: string,
    id: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.productModel
        .findOne({ _id: id, shop: shop })
        .select(select);

      // Increment view count
      if (data) {
        await this.productModel.findByIdAndUpdate(data._id, {
          $inc: {
            totalView: 1,
          },
        });
      }

      return {
        success: true,
        message: 'Success! data fetch successfully.',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getProductByIds(
    shop: string,
    getProductByIdsDto: GetProductByIdsDto,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const mIds = getProductByIdsDto.ids.map((m) => new ObjectId(m));
      const data = await this.productModel
        .find({ _id: mIds, shop: shop })
        .select(select);

      return {
        success: true,
        message: 'Success',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  /**
   * updateProductById
   * updateMultipleProductById
   */
  async updateProductById(
    vendor: Vendor,
    shop: string,
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<ResponsePayload> {
    try {
      const { name, autoSlug, slug } = updateProductDto;

      const fShop = await this.shopModel.exists({
        _id: shop,
        'users._id': vendor._id,
      });

      if (!fShop) {
        return {
          success: false,
          message: 'Sorry! you have no access in this shop',
        } as ResponsePayload;
      }

      let fSlug: string;
      let fData: any;
      let finalSlug: string;

      if (autoSlug) {
        const fData = await this.productModel.findOne({ _id: id, shop });

        if (fData) {
          if (name !== undefined && fData.name?.trim() !== name?.trim()) {
            // name change → always generate fresh slug
            const newSlug = this.utilsService.transformToSlug(name);
            const isExists = await this.productModel.exists({
              slug: newSlug,
              shop,
            });
            finalSlug = isExists
              ? this.utilsService.transformToSlug(name, true)
              : newSlug;
          } else {
            // name same → use given
            finalSlug = fData.slug;
          }
        }

        // fSlug = this.utilsService.transformToSlug(name);
        // fData = await this.productModel.exists({ slug: fSlug });
        //
        // finalSlug = fData
        //   ? this.utilsService.transformToSlug(name, true)
        //   : fSlug;
      } else {
        const fData = await this.productModel.findOne({ _id: id, shop });

        if (fData) {
          if (slug !== undefined && fData.slug?.trim() !== slug?.trim()) {
            fSlug = this.utilsService.transformToSlug(slug);
            const isExists = await this.productModel.exists({ slug: fSlug });

            finalSlug = isExists
              ? this.utilsService.transformToSlug(slug, true)
              : fSlug;
          } else {
            // name same → use given
            finalSlug = fData.slug;
          }
        }
      }

      // Get current product data for price history
      const currentProduct = await this.productModel.findById(id);
      const previousPrice = {
        costPrice: (currentProduct?.costPrice || currentProduct?.purchasePrice) || 0,
        salePrice: (currentProduct?.salePrice || currentProduct?.salePrise) || 0,
        regularPrice: (currentProduct?.regularPrice || currentProduct?.regularPrise) || 0,
      };

      const finalData = {
        ...updateProductDto,
        ...{
          slug: finalSlug,
        },
      };

      // Handle expiry date string if provided
      if (updateProductDto.expiryDate) {
        finalData['expiryDateString'] = this.utilsService.getDateString(
          updateProductDto.expiryDate,
        );
      }


      const filterQuery: any = { _id: id };
      if (updateProductDto.version !== undefined && updateProductDto.version !== null) {
        if (updateProductDto.version === 0) {
          filterQuery.$or = [{ version: 0 }, { version: { $exists: false } }];
        } else {
          filterQuery.version = updateProductDto.version;
        }
      }
      // Strip 'version' from $set payload to avoid ConflictingUpdateOperators:
      // $inc: { version: 1 } already handles the version bump — setting it
      // explicitly in $set at the same time causes MongoDB error code 40.
      const { version: _versionField, ...finalDataWithoutVersion } = finalData;

      const updateResult = await this.productModel.findOneAndUpdate(
        filterQuery,
        {
          $set: finalDataWithoutVersion,
          $inc: { version: 1 }
        },
        { new: true }
      );
      if (!updateResult) {
        throw new HttpException('Conflict: Product has been modified by another user.', 409);
      }


      // Record price history if prices changed
      const newPrice = {
        costPrice: (updateProductDto.costPrice ?? updateProductDto.purchasePrice) ?? previousPrice.costPrice,
        salePrice: updateProductDto.salePrice ?? previousPrice.salePrice,
        regularPrice: updateProductDto.regularPrice ?? previousPrice.regularPrice,
      };



      // Setting Data
      const fSetting = await this.settingModel
        .findOne({ shop: shop })
        .select('facebookCatalog');

      if (
        fSetting?.facebookCatalog &&
        fSetting?.facebookCatalog?.isEnableFacebookCatalog
      ) {
        this.productUpdateOnFbCatalog(shop);
      }

      // Update affiliate Product

      if (fData) {
        await this.updateAffiliateProduct(fData);
      }

      return {
        success: true,
        message: 'Success! data updated successfully.',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async updateMultipleProductById(
    vendor: Vendor,
    shop: string,
    ids: string[],
    updateProductDto: UpdateProductDto,
  ): Promise<ResponsePayload> {
    try {
      const fShop = await this.shopModel.exists({
        _id: shop,
        'users._id': vendor._id,
      });

      if (!fShop) {
        return {
          success: false,
          message: 'Sorry! you have no access in this shop',
        } as ResponsePayload;
      }
      // Setting Data
      const fSetting = await this.settingModel
        .findOne({ shop: shop })
        .select('facebookCatalog');

      if (
        fSetting?.facebookCatalog &&
        fSetting?.facebookCatalog?.isEnableFacebookCatalog
      ) {
        this.productUpdateOnFbCatalog(shop);
      }

      if (ids && ids.length) {
        const mIds = ids.map((m) => new ObjectId(m));

        // Delete No Multiple Action Data
        if (updateProductDto.slug) {
          delete updateProductDto.slug;
        }
        await this.productModel.updateMany(
          { _id: { $in: mIds } },
          { $set: updateProductDto },
        );

        return {
          success: true,
          message: 'Success! multiple data updated successfully',
        } as ResponsePayload;
      } else {
        return {
          success: true,
          message: 'Sorry! no id found',
        } as ResponsePayload;
      }
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async cloneProductByVendor(
    vendor: Vendor,
    shop: string,
    id: string,
  ): Promise<ResponsePayload> {
    try {
      const fShop = await this.shopModel.exists({
        _id: shop,
        'users._id': vendor._id,
      });

      if (!fShop) {
        return {
          success: false,
          message: 'Sorry! you have no access in this shop',
        } as ResponsePayload;
      }

      const data = await this.productModel.findById(id);
      const jData = JSON.stringify(data);
      const product = JSON.parse(jData);

      product.name = `${product.name}(Clone-${this.utilsService.getRandomInt(
        0,
        100,
      )})`;

      product.slug = this.utilsService.transformToSlug(product.name, true);

      delete product._id;
      delete product.createdAt;
      delete product.updatedAt;

      const newData = new this.productModel(product);
      const saveData = await newData.save();

      const response = {
        _id: saveData._id,
      };

      return {
        success: true,
        message: 'Data Clone Success',
        data: response,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      if (error.code && error.code.toString() === ErrorCodes.UNIQUE_FIELD) {
        throw new ConflictException('Slug Must be Unique');
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }

  async deleteMultipleTrashProduct(
    vendor: Vendor,
    shop: string,
    ids: string[],
  ): Promise<ResponsePayload> {
    try {
      const fShop = await this.shopModel.exists({
        _id: shop,
        'users._id': vendor._id,
      });

      if (!fShop) {
        return {
          success: false,
          message: 'Sorry! you have no access in this shop',
        } as ResponsePayload;
      }

      await this.productModel.deleteMany({ _id: ids, status: 'trash' });

      // Setting Data
      const fSetting = await this.settingModel
        .findOne({ shop: shop })
        .select('facebookCatalog');

      if (
        fSetting?.facebookCatalog &&
        fSetting?.facebookCatalog?.isEnableFacebookCatalog
      ) {
        this.productUpdateOnFbCatalog(shop);
      }
      return {
        success: true,
        message: 'Success! Product permanently deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteAllTrashByShop(shop: string): Promise<ResponsePayload> {
    try {
      const fShop = await this.shopModel.exists({
        _id: shop,
      });

      if (!fShop) {
        return {
          success: false,
          message: 'Sorry! you have no access in this shop',
        } as ResponsePayload;
      }

      await this.productModel.deleteMany({ shop: shop, status: 'trash' });
      return {
        success: true,
        message: 'Success! order permanently deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleProductByIdByVendor(
    vendor: Vendor,
    shop: string,
    ids: string[],
  ): Promise<ResponsePayload> {
    try {
      const fShop = await this.shopModel.exists({
        _id: shop,
        'users._id': vendor._id,
      });

      if (!fShop) {
        return {
          success: false,
          message: 'Sorry! you have no access in this shop',
        } as ResponsePayload;
      }

      await this.productModel.updateMany(
        { _id: ids },
        {
          $set: {
            status: 'trash',
            deleteDateString: this.utilsService.getDateString(new Date()),
          },
        },
      );
      // Setting Data
      const fSetting = await this.settingModel
        .findOne({ shop: shop })
        .select('facebookCatalog');

      if (
        fSetting?.facebookCatalog &&
        fSetting?.facebookCatalog?.isEnableFacebookCatalog
      ) {
        this.productUpdateOnFbCatalog(shop);
      }

      return {
        success: true,
        message: 'Success! Product deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleProductsById(
    vendor: Vendor,
    shop: string,
    ids: string[],
  ): Promise<ResponsePayload> {
    try {
      const fShop = await this.shopModel.exists({
        _id: shop,
        'users._id': vendor._id,
      });

      if (!fShop) {
        return {
          success: false,
          message: 'Sorry! you have no access in this shop',
        } as ResponsePayload;
      }

      await this.productModel.deleteMany({ _id: ids });

      // Setting Data
      const fSetting = await this.settingModel
        .findOne({ shop: shop })
        .select('facebookCatalog');

      if (
        fSetting?.facebookCatalog &&
        fSetting?.facebookCatalog?.isEnableFacebookCatalog
      ) {
        this.productUpdateOnFbCatalog(shop);
      }

      return {
        success: true,
        message: 'Success! Product deleted successfully.',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleProductById(ids: string[]): Promise<ResponsePayload> {
    try {
      await this.productModel.deleteMany({ _id: ids });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  private async productUpdateOnFbCatalog(shop: string) {
    await this.fbCatalogService.addFbCatalogProducts(shop);
  }

  /**
   * Corn JOB
   */
  private async checkExpireEveryday() {
    schedule.scheduleJob('30 3 * * *', async () => {
      await this.checkExpireFromDb();
      await this.checkExpiryDateAlerts();
    });
  }

  private async checkExpireFromDb() {
    try {
      // Calculate the date 10 days ago
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      // Perform deletion of orders with status 'trash' and deleteDateString <= 10 days ago
      await this.productModel.deleteMany({
        status: 'trash',
        deleteDateString: {
          $lte: tenDaysAgo.toISOString().split('T')[0], // Compare as ISO string for date format matching
        },
      });

      // console.log('Auto-deletion task executed successfully.');
    } catch (err) {
      console.error('Error during auto-deletion:', err);
    }
  }

  /**
   * Check Expiry Date Alerts
   * Check products that are expiring within 30 days
   */
  private async checkExpiryDateAlerts() {
    try {
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      const expiringProducts = await this.productModel.find({
        expiryDate: {
          $gte: today,
          $lte: thirtyDaysFromNow,
        },
        quantity: { $gt: 0 },
      });

      if (expiringProducts.length > 0) {
        this.logger.warn(
          `Found ${expiringProducts.length} products expiring within 30 days`,
        );
        // You can add notification logic here
        // e.g., send email, create notification records, etc.
      }
    } catch (err) {
      console.error('Error during expiry date check:', err);
    }
  }

  /**
   * Get Expiring Products
   */
  async getExpiringProducts(
    shop: string,
    days: number = 30,
  ): Promise<ResponsePayload> {
    try {
      const today = new Date();
      const targetDate = new Date();
      targetDate.setDate(today.getDate() + days);

      const expiringProducts = await this.productModel.aggregate([
        {
          $match: { shop: shop },
        },
        {
          $match: {
            $or: [
              {
                expiryDate: { $gte: today, $lte: targetDate },
                quantity: { $gt: 0 },
              },
              {
                $expr: {
                  $gt: [
                    {
                      $size: {
                        $filter: {
                          input: '$variationList',
                          as: 'v',
                          cond: {
                            $and: [
                              { $gte: ['$$v.expiryDate', today] },
                              { $lte: ['$$v.expiryDate', targetDate] },
                              { $gt: ['$$v.quantity', 0] },
                            ],
                          },
                        },
                      },
                    },
                    0,
                  ],
                },
              },
            ],
          },
        },
        {
          $project: {
            name: 1,
            sku: 1,
            expiryDate: 1,
            expiryDateString: 1,
            quantity: 1,
            variationList: 1,
          },
        },
        { $sort: { expiryDate: 1 } },
      ]);

      return {
        success: true,
        message: 'Expiring products retrieved successfully',
        data: expiringProducts,
        count: expiringProducts.length,
      } as ResponsePayload;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * Get Low Stock Products
   */
  async getLowStockProducts(
    shop: string,
    branch?: string,
  ): Promise<ResponsePayload> {
    try {
      const lowStockProducts = await this.productModel
        .find({
          shop: shop,
          $or: [
            {
              $expr: {
                $lte: [
                  '$quantity',
                  { $ifNull: ['$lowStockThreshold', 10] },
                ],
              },
              quantity: { $gte: 0 },
            },
            {
              $expr: {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: '$variationList',
                        as: 'v',
                        cond: {
                          $lte: [
                            '$$v.quantity',
                            {
                              $ifNull: [
                                '$$v.lowStockThreshold',
                                { $ifNull: ['$lowStockThreshold', 10] },
                              ],
                            },
                          ],
                        },
                      },
                    },
                  },
                  0,
                ],
              },
            },
          ],
        })
        .select('name sku quantity lowStockThreshold variationList')
        .sort({ quantity: 1 })
        .lean();

      return {
        success: true,
        message: 'Low stock products retrieved successfully',
        data: lowStockProducts,
        count: lowStockProducts.length,
      } as ResponsePayload;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  private async updateAffiliateProduct(finalData: any) {
    // Affiliate logic removed
  }

  // Product facth from Another api

  async fetchAllFromClient(): Promise<any[]> {
    const baseUrl = 'https://mohasagor.com.bd/api/reseller/product';
    const apiKey = 'pM4LjMl3oI8m1SE7';
    const secretKey =
      'ea26bc2c284a7c1db934b303a3ece61d46c6296c4aff6048efc53f5b958cfb14';

    let page = 1;
    let allProducts: any[] = [];

    while (true) {
      const { data } = await firstValueFrom(
        this.http.get(baseUrl, {
          params: { page },
          headers: {
            'api-key': apiKey,
            'secret-key': secretKey,
          },
        }),
      );

      const products = Array.isArray(data)
        ? data
        : data?.data || data?.products || [];

      if (!products || products.length === 0) {
        break; // আর কোনো ডেটা নাই
      }

      allProducts = allProducts.concat(products);
      page++;
    }

    return allProducts;
  }

  // ---- আপনার মূল ফাংশন: সব শর্ত পালন করে আপসার্ট ----

  // async refreshFromClient(shopId: string) {
  //   const start = Date.now();
  //   console.log(`[refreshFromClient] START shopId=${shopId}`);
  //
  //   try {
  //     if (!shopId) throw new Error('shopId is required');
  //     const shopObjectId: any = new Types.ObjectId(shopId);
  //
  //     // 1) client API থেকে সব পেজ টেনে আনুন
  //     const clientProducts = await this.fetchAllFromClient();
  //     console.log(
  //       `[refreshFromClient] Pulled from client API: total=${clientProducts.length}`,
  //     );
  //
  //     const CHUNK_SIZE = 500;
  //     const ops: any[] = [];
  //     const seen = new Set<string>();
  //
  //     let created = 0;
  //     let updated = 0;
  //     const errors: { id?: string; message: string }[] = [];
  //
  //     for (const p of clientProducts) {
  //       const extId = String(p?.id ?? '');
  //       if (!extId) {
  //         console.warn(`[refreshFromClient] Skip: missing client product id`);
  //         errors.push({ message: 'missing client product id' });
  //         continue;
  //       }
  //       if (seen.has(extId)) {
  //         console.log(`[refreshFromClient] Skip duplicate extId=${extId}`);
  //         continue;
  //       }
  //       seen.add(extId);
  //
  //       try {
  //         // 2) hash + map
  //         const contentHash = this.hashClientProduct(p);
  //
  //         // console.log('ppppppppp',p);
  //         const baseDoc = await this.mapClientToOurDoc(p, shopId); // ✅ await দরকার
  //
  //         // সেফ গার্ড (redundant হলেও নিরাপদ)
  //         baseDoc.external = baseDoc.external ?? {
  //           source: 'mohasagor',
  //           id: String(p.id),
  //           productCode: p?.product_code ? String(p.product_code) : null,
  //           lastHash: null,
  //           lastSyncedAt: null,
  //         };
  //
  //         // এখন নিশ্চিন্তে সেট করুন
  //         baseDoc.external.lastHash = contentHash;
  //         baseDoc.external.lastSyncedAt = new Date();
  //
  //         // ensure shop ObjectId type
  //         baseDoc.shop = shopObjectId;
  //
  //         // 3) only change when hash changed
  //         const filter = {
  //           shop: shopObjectId,
  //           'external.source': 'mohasagor',
  //           'external.id': extId,
  //           'external.lastHash': { $ne: contentHash },
  //         };
  //
  //         // 4) build $set / $unset to avoid path conflicts (category/brand null হলে unset)
  //         const setDoc: any = { ...baseDoc };
  //         const unsetDoc: any = {};
  //
  //         for (const key of [
  //           'category',
  //           'subCategory',
  //           'childCategory',
  //           'brand',
  //           'variation2',
  //         ]) {
  //           if (setDoc[key] === null || setDoc[key] === undefined) {
  //             unsetDoc[key] = '';
  //             delete setDoc[key];
  //           }
  //         }
  //         if (
  //           !setDoc.variation2Options ||
  //           setDoc.variation2Options.length === 0
  //         ) {
  //           unsetDoc['variation2Options'] = '';
  //           delete setDoc.variation2Options;
  //         }
  //
  //         const updateDoc: any = { $set: setDoc };
  //         if (Object.keys(unsetDoc).length) updateDoc.$unset = unsetDoc;
  //
  //         ops.push({
  //           updateOne: {
  //             filter,
  //             update: updateDoc,
  //             upsert: true, // 🔸 $setOnInsert দিচ্ছি না—কনফ্লিক্ট এড়াতে
  //           },
  //         });
  //
  //         // 5) chunk flush
  //         if (ops.length >= CHUNK_SIZE) {
  //           try {
  //             const r = await this.productModel.bulkWrite(ops, {
  //               ordered: false,
  //             });
  //             const c = r?.upsertedCount || 0;
  //             const u = r?.modifiedCount || 0;
  //             created += c;
  //             updated += u;
  //             console.log(
  //               `[refreshFromClient] Chunk flushed: upserted=${c}, modified=${u}, ops=${ops.length}`,
  //             );
  //           } catch (e: any) {
  //             console.error(
  //               `[refreshFromClient] bulkWrite chunk error: ${e?.message}`,
  //             );
  //             errors.push({
  //               id: extId,
  //               message: e?.message || 'bulkWrite chunk error',
  //             });
  //           } finally {
  //             ops.length = 0;
  //           }
  //         }
  //       } catch (e: any) {
  //         console.warn(
  //           `[refreshFromClient] transform error for extId=${extId}: ${e?.message}`,
  //         );
  //         errors.push({ id: extId, message: e?.message || 'transform error' });
  //       }
  //     }
  //
  //     // 6) flush remaining
  //     if (ops.length > 0) {
  //       try {
  //         const r = await this.productModel.bulkWrite(ops, { ordered: false });
  //         const c = r?.upsertedCount || 0;
  //         const u = r?.modifiedCount || 0;
  //         created += c;
  //         updated += u;
  //         console.log(
  //           `[refreshFromClient] Final flush: upserted=${c}, modified=${u}, remainingOps=${ops.length}`,
  //         );
  //       } catch (e: any) {
  //         console.error(
  //           `[refreshFromClient] bulkWrite final error: ${e?.message}`,
  //         );
  //         errors.push({ message: e?.message || 'bulkWrite final error' });
  //       }
  //     }
  //
  //     const uniquePulled = seen.size;
  //     const unchanged = Math.max(uniquePulled - (created + updated), 0);
  //     const took = Date.now() - start;
  //
  //     console.log(
  //       `[refreshFromClient] DONE pulled=${uniquePulled} created=${created} updated=${updated} unchanged=${unchanged} errors=${errors.length} tookMs=${took}`,
  //     );
  //
  //     return {
  //       success: errors.length === 0,
  //       message: errors.length
  //         ? 'Some products failed'
  //         : 'Products refreshed successfully',
  //       created,
  //       updated,
  //       unchanged,
  //       errors,
  //       totalPulled: uniquePulled,
  //       tookMs: took,
  //     };
  //   } catch (e: any) {
  //     console.error(`[refreshFromClient] FAILED: ${e?.message}`);
  //     return {
  //       success: false,
  //       message: e?.message || 'refreshFromClient failed',
  //       created: 0,
  //       updated: 0,
  //       unchanged: 0,
  //       errors: [{ message: e?.stack || String(e) }],
  //       totalPulled: 0,
  //       tookMs: Date.now() - start,
  //     };
  //   }
  // }
  //

  async refreshFromClient(shopId: string) {
    const start = Date.now();
    console.log(`[refreshFromClient] START shopId=${shopId}`);

    try {
      if (!shopId) throw new Error('shopId is required');
      const shopObjectId: any = new Types.ObjectId(shopId);

      // 1) client API থেকে সব পেজ টেনে আনুন
      const clientProducts = await this.fetchAllFromClient();
      console.log(
        `[refreshFromClient] Pulled from client API: total=${clientProducts.length}`,
      );

      const CHUNK_SIZE = 500; // ops count (নীচে প্রতি প্রোডাক্টে ২টা অপ যোগ হচ্ছে)
      const ops: any[] = [];
      const seen = new Set<string>();

      let created = 0;
      let updated = 0;
      const errors: { id?: string; message: string }[] = [];

      for (const p of clientProducts) {
        const extId = String(p?.id ?? '');
        if (!extId) {
          console.warn(`[refreshFromClient] Skip: missing client product id`);
          errors.push({ message: 'missing client product id' });
          continue;
        }
        if (seen.has(extId)) {
          console.log(`[refreshFromClient] Skip duplicate extId=${extId}`);
          continue;
        }
        seen.add(extId);

        try {
          const contentHash = this.hashClientProduct(p);
          const baseDoc = await this.mapClientToOurDoc(p, shopId);

          // সেফ গার্ড
          baseDoc.external = baseDoc.external ?? {
            source: 'mohasagor',
            id: extId,
            productCode: p?.product_code ? String(p.product_code) : null,
            lastHash: null,
            lastSyncedAt: null,
          };
          baseDoc.external.lastHash = contentHash;
          baseDoc.external.lastSyncedAt = new Date();

          // ensure ObjectId type
          baseDoc.shop = shopObjectId;

          // --- আপডেট অপ (শুধু hash change হলে) ---
          // null ফিল্ডগুলো unset, বাকিগুলো set (path conflict এড়াতে)
          const setDoc: any = { ...baseDoc };
          const unsetDoc: any = {};
          for (const key of [
            'category',
            'subCategory',
            'childCategory',
            'brand',
            'variation2',
          ]) {
            if (setDoc[key] === null || setDoc[key] === undefined) {
              unsetDoc[key] = '';
              delete setDoc[key];
            }
          }
          if (
            !setDoc.variation2Options ||
            setDoc.variation2Options.length === 0
          ) {
            unsetDoc['variation2Options'] = '';
            delete setDoc.variation2Options;
          }

          const updateOnlyDoc: any = { $set: setDoc };
          if (Object.keys(unsetDoc).length) updateOnlyDoc.$unset = unsetDoc;

          const filterForUpdate = {
            shop: shopObjectId,
            'external.source': 'mohasagor',
            'external.id': extId,
            'external.lastHash': { $ne: contentHash }, // ✅ শুধু বদলালে আপডেট
          };

          ops.push({
            updateOne: {
              filter: filterForUpdate,
              update: updateOnlyDoc,
              upsert: false, // ✅ আপসার্ট নয়
            },
          });

          // --- ইনসার্ট অপ (না থাকলে তৈরি) ---
          const filterForInsert = {
            shop: shopObjectId,
            'external.source': 'mohasagor',
            'external.id': extId,
          };

          ops.push({
            updateOne: {
              filter: filterForInsert,
              update: { $setOnInsert: baseDoc }, // ✅ শুধু ইনসার্ট সময় সেট হবে
              upsert: true,
            },
          });

          // চাঙ্ক ফ্লাশ
          if (ops.length >= CHUNK_SIZE) {
            try {
              const r = await this.productModel.bulkWrite(ops, {
                ordered: false,
              });
              const c = r?.upsertedCount || 0;
              const u = r?.modifiedCount || 0;
              created += c;
              updated += u;
              console.log(
                `[refreshFromClient] Chunk flushed: upserted=${c}, modified=${u}, ops=${ops.length}`,
              );
            } catch (e: any) {
              console.error(
                `[refreshFromClient] bulkWrite chunk error: ${e?.message}`,
              );
              // E11000 হলে offender extId বের করে delete -> retry once
              if (e?.code === 11000 || /E11000/.test(e?.message || '')) {
                const dupExtId = this.extractDupExtId(e.message);
                if (dupExtId) {
                  console.warn(
                    `[refreshFromClient] Duplicate for extId=${dupExtId}. Cleaning duplicates & retrying chunk...`,
                  );
                  await this.productModel.deleteMany({
                    shop: shopObjectId,
                    'external.source': 'mohasagor',
                    'external.id': dupExtId,
                  });
                  // একবার রিট্রাই
                  try {
                    const r2 = await this.productModel.bulkWrite(ops, {
                      ordered: false,
                    });
                    const c2 = r2?.upsertedCount || 0;
                    const u2 = r2?.modifiedCount || 0;
                    created += c2;
                    updated += u2;
                    console.log(
                      `[refreshFromClient] Chunk retried OK: upserted=${c2}, modified=${u2}`,
                    );
                  } catch (e2: any) {
                    console.error(
                      `[refreshFromClient] chunk retry failed: ${e2?.message}`,
                    );
                    errors.push({
                      id: dupExtId,
                      message: e2?.message || 'bulkWrite retry failed',
                    });
                  }
                } else {
                  errors.push({
                    message: e?.message || 'bulkWrite chunk error',
                  });
                }
              } else {
                errors.push({ message: e?.message || 'bulkWrite chunk error' });
              }
            } finally {
              ops.length = 0;
            }
          }
        } catch (e: any) {
          console.warn(
            `[refreshFromClient] transform error for extId=${extId}: ${e?.message}`,
          );
          errors.push({ id: extId, message: e?.message || 'transform error' });
        }
      }

      // ফাইনাল ফ্লাশ
      if (ops.length > 0) {
        try {
          const r = await this.productModel.bulkWrite(ops, { ordered: false });
          const c = r?.upsertedCount || 0;
          const u = r?.modifiedCount || 0;
          created += c;
          updated += u;
          console.log(
            `[refreshFromClient] Final flush: upserted=${c}, modified=${u}, remainingOps=${ops.length}`,
          );
        } catch (e: any) {
          console.error(
            `[refreshFromClient] bulkWrite final error: ${e?.message}`,
          );
          if (e?.code === 11000 || /E11000/.test(e?.message || '')) {
            const dupExtId = this.extractDupExtId(e.message);
            if (dupExtId) {
              console.warn(
                `[refreshFromClient] Final flush duplicate for extId=${dupExtId}. Cleaning & retrying...`,
              );
              await this.productModel.deleteMany({
                shop: shopObjectId,
                'external.source': 'mohasagor',
                'external.id': dupExtId,
              });
              try {
                const r2 = await this.productModel.bulkWrite(ops, {
                  ordered: false,
                });
                const c2 = r2?.upsertedCount || 0;
                const u2 = r2?.modifiedCount || 0;
                created += c2;
                updated += u2;
                console.log(
                  `[refreshFromClient] Final retry OK: upserted=${c2}, modified=${u2}`,
                );
              } catch (e2: any) {
                console.error(
                  `[refreshFromClient] final retry failed: ${e2?.message}`,
                );
                errors.push({
                  id: dupExtId,
                  message: e2?.message || 'bulkWrite final retry failed',
                });
              }
            } else {
              errors.push({ message: e?.message || 'bulkWrite final error' });
            }
          } else {
            errors.push({ message: e?.message || 'bulkWrite final error' });
          }
        }
      }

      const uniquePulled = seen.size;
      const unchanged = Math.max(uniquePulled - (created + updated), 0);
      const took = Date.now() - start;

      console.log(
        `[refreshFromClient] DONE pulled=${uniquePulled} created=${created} updated=${updated} unchanged=${unchanged} errors=${errors.length} tookMs=${took}`,
      );

      return {
        success: errors.length === 0,
        message: errors.length
          ? 'Some products failed'
          : 'Products refreshed successfully',
        created,
        updated,
        unchanged,
        errors,
        totalPulled: uniquePulled,
        tookMs: took,
      };
    } catch (e: any) {
      console.error(`[refreshFromClient] FAILED: ${e?.message}`);
      return {
        success: false,
        message: e?.message || 'refreshFromClient failed',
        created: 0,
        updated: 0,
        unchanged: 0,
        errors: [{ message: e?.stack || String(e) }],
        totalPulled: 0,
        tookMs: Date.now() - start,
      };
    }
  }

  // ---- Helper: hash content to detect change (safe) ----
  hashClientProduct(p: any): string {
    try {
      const raw = JSON.stringify({
        id: p?.id,
        name: p?.name,
        slug: p?.slug,
        price: p?.price,
        sale_price: p?.sale_price,
        details: p?.details,
        status: p?.status,
        variants: p?.product_variants?.map((v: any) => ({
          a: v?.attribute,
          v: v?.variant,
        })),
        images: p?.product_images?.map((i: any) => i?.product_image),
        category: p?.category,
      });
      return crypto.createHash('sha256').update(raw).digest('hex');
    } catch (err: any) {
      // ফলোব্যাক: মিনিমাল ইনফো দিয়ে হ্যাশ, যাতে আপডেট ফ্লো ভেঙে না যায়
      const fallback = JSON.stringify({
        id: p?.id ?? `unknown-${Date.now()}`,
        name: p?.name ?? 'unknown',
      });
      return crypto.createHash('sha256').update(fallback).digest('hex');
    }
  }

  async mapClientToOurDoc(p: any, shopId: string) {
    try {
      console.log('product data from api', p);
      // অপরিহার্য গার্ড
      if (!p?.id) throw new Error('client product missing id');
      if (!p?.name) throw new Error(`client product ${p?.id} missing name`);
      if (!shopId) throw new Error('shopId is required');

      const shopObjectId = new Types.ObjectId(shopId);
      const extId = String(p.id);
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const dateString = now.toISOString().slice(0, 10);

      // images
      const images = (
        Array.isArray(p?.product_images) && p.product_images.length
          ? p.product_images.map((i: any) => i?.product_image)
          : p?.thumbnail_img
            ? [p.thumbnail_img]
            : []
      ).filter(Boolean);

      const regularPrice = Number(p?.price ?? 0) || 0;
      const salePrice = Number(p?.price ?? 0) || 0;
      const costPrice = Number(p?.sale_price ?? regularPrice) || 0;

      const isVariation =
        Array.isArray(p?.product_variants) && p.product_variants.length > 0;

      const variationAttr = isVariation
        ? p.product_variants[0]?.attribute || 'Option'
        : null;

      const variationOptions = isVariation
        ? Array.from(
          new Set(
            p.product_variants
              .map((v: any) => v?.variant)
              .filter((x: any) => !!x),
          ),
        )
        : [];

      const variationList = isVariation
        ? variationOptions.map((v: string) => ({
          name: v,
          sku: `${p?.product_code ?? extId}-${this.slugify(String(v))}`,
          costPrice,
          regularPrice,
          salePrice,
          quantity: 1000,
          image: images[0] ?? null,
        }))
        : [];

      // কোলিশন-রেজিস্ট্যান্ট স্লাগ (DB lookup ছাড়া)
      const uniqueSlug = p?.slug
        ? String(p.slug)
        : `${this.slugify(p.name)}-${extId}`;

      // 🔹 Category resolve/create (থাকলে add, না থাকলে null)
      let category: any = null;
      if (typeof p?.category === 'string' && p.category.trim()) {
        category = await this.ensureCategoryForShop(
          p.category.trim(),
          shopObjectId,
        );
        // will be {_id, name, slug}
      }

      // sub/child/brand আপাতত null (পরে চাইলে একইভাবে ensure করতে পারেন)
      const subCategory = null;
      const childCategory = null;
      const brand = null;

      return {
        category, // {_id, name, slug} | null
        subCategory,
        childCategory,
        brand,

        ratingDetails: {
          oneStar: 0,
          twoStar: 0,
          threeStar: 0,
          fourStar: 0,
          fiveStar: 0,
        },
        shop: shopObjectId, // ObjectId হিসেবে সেট
        name: p.name,
        slug: uniqueSlug,
        tags: [],
        images,

        month,
        year,
        dateString,
        description: p?.details ?? null,

        costPrice,
        salePrice,
        regularPrice,
        quantity: isVariation ? 1000 : 1000,

        ratingCount: 0,
        ratingTotal: 0,
        reviewTotal: 0,
        status: p?.status === 'active' ? 'publish' : 'draft',

        isVariation,
        variation: isVariation ? variationAttr : null,
        variationOptions: isVariation ? variationOptions : [],
        variation2: null,
        variation2Options: [],
        variationList,

        external: {
          source: 'mohasagor',
          id: extId,
          productCode: p?.product_code ? String(p.product_code) : null,
          lastHash: null, // call-site এ সেট করবেন
          lastSyncedAt: null, // call-site এ সেট করবেন
        },
      };
    } catch (err: any) {
      const pid = p?.id ?? '?';
      throw new Error(
        `mapClientToOurDoc failed for product ${pid}: ${err?.message || err}`,
      );
    }
  }

  // client category string -> ensure Category doc exists, return {_id,name,slug}
  // client category string -> ensure Category doc exists, return {_id,name,slug}
  private async ensureCategoryForShop(
    categoryName: string,
    shopObjectId: Types.ObjectId,
  ) {
    const key = `${shopObjectId.toHexString()}::${categoryName}`;
    if (this.categoryCache.has(key)) return this.categoryCache.get(key);

    const slug = this.slugify(categoryName);

    const setOnInsert = {
      shop: shopObjectId,
      name: categoryName,
      slug,
      images: [],
      description: null,
      priority: null,
      status: 'publish',
      categoryProducts: 0,
    };

    const doc = await this.categoryModel
      .findOneAndUpdate(
        { shop: shopObjectId, slug },
        { $setOnInsert: setOnInsert },
        { new: true, upsert: true },
      )
      .lean();

    const ret = { _id: doc._id, name: doc.name, slug: doc.slug };
    this.categoryCache.set(key, ret);
    return ret;
  }

  slugify = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  private extractDupExtId(msg: string): string | null {
    if (!msg) return null;
    const m = msg.match(/external\.id:\s*"([^"]+)"/);
    return m?.[1] || null;
  }
}



