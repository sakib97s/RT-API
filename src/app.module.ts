import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { AdditionalPageModule } from './pages/additional-page/additional-page.module';
import { CartModule } from './pages/cart/cart.module';
import { BrandModule } from './pages/catalog/brand/brand.module';
import { CategoryModule } from './pages/catalog/category/category.module';
import { ChildCategoryModule } from './pages/catalog/child-category/child-category.module';
import { TagModule } from './pages/catalog/tag/tag.module';
import { ContactModule } from './pages/contact/contact.module';
import { AnnouncementModule } from './pages/customization/announcement/announcement.module';
import { BannerModule } from './pages/customization/banner/banner.module';
import { CarouselModule } from './pages/customization/carousel/carousel.module';
import { PopupModule } from './pages/customization/popup/popup.module';

import { ShopInformationModule } from './pages/customization/shop-information/shop-information.module';
import { StoryModule } from './pages/customization/story/story.module';
import { DashboardModule } from './pages/dashboard/dashboard.module';
import { FileFolderModule } from './pages/image-gallery/file-folder/file-folder.module';
import { GalleryModule } from './pages/image-gallery/gallery/gallery.module';
import { OrderModule } from './pages/order/order.module';
import { OtpModule } from './pages/otp/otp.module';
import { ProductModule } from './pages/product/product.module';
import { ReviewModule } from './pages/review/review.module';
import { SeoModule } from './pages/seo/seo.module';
import { UserModule } from './pages/user/user.module';
import { VendorModule } from './pages/vendor/vendor.module';
import { UtilsModule } from './shared/utils/utils.module';
import { ShopModule } from './pages/shop/shop.module';
import { SubCategoryModule } from './pages/catalog/sub-category/sub-category.module';
import { BuildScriptModule } from './shared/build-script/build-script.module';
import { SubscriptionModule } from './pages/subscription/subscription.module';
import { WishlistModule } from './pages/wishlist/wishlist.module';
import { NotificationModule } from './pages/notification/notification.module';
import { LogReportModule } from './shared/log-report/log-report.module';
import { SettingModule } from './pages/customization/setting/setting.module';
import { PaymentControlModule } from './shared/payment-control/payment-control.module';
import { GtmModule } from './pages/gtm/gtm.module';
import { TiktokModule } from './pages/tiktok/tiktok.module';
import { FbCatalogModule } from './shared/fb-catalog/fb-catalog.module';
import { PrerenderMiddleware } from './middleware/prerender.middleware';
import { EmailModule } from './shared/email/email.module';
import { TutorialModule } from './pages/tutorial/tutorial.module';

import { SupportModule } from './pages/support/support.module';
import { SeoPageModule } from './pages/seo-page/seo-page.module';
import { SkinTypeModule } from './pages/catalog/skin-type/skin-type.module';
import { SkinConcernModule } from './pages/catalog/skin-concern/skin-concern.module';
import { PaymentLinkModule } from './pages/payment-link/payment-link.module';
import { PaymentLinkHistoryModule } from './pages/payment-link-history/payment-link-history.module';
import { WebsiteReviewModule } from './pages/website-review/website-review.module';
import { UserNotificationModule } from './pages/user-notification/user-notification.module';
import { ExpenseModule } from './pages/expense/expense.module';
import { ExpenseCategoryModule } from './pages/expense-category/expense-category.module';
import { AdminModule } from './pages/admin/admin.module';
import { ScriptModule } from './shared/script/script.module';
import { UploadModule } from './pages/upload/upload.module';
import { NewsletterModule } from './pages/newsletter/newsletter.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    MongooseModule.forRoot(configuration().mongoCluster),
    // ThrottlerModule.forRoot([
    //   {
    //     ttl: 6000,
    //     limit: 100,
    //   },
    // ]),
    AdminModule,
    VendorModule,
    ShopModule,
    OrderModule,
    UserModule,
    BuildScriptModule,
    GalleryModule,
    FileFolderModule,
    UtilsModule,
    BannerModule,
    CategoryModule,
    SubCategoryModule,
    ChildCategoryModule,
    CarouselModule,
    TagModule,
    ReviewModule,
    AdditionalPageModule,
    OtpModule,
    DashboardModule,
    ShopInformationModule,
    BrandModule,
    ProductModule,
    CartModule,
    ContactModule,
    SeoModule,
    StoryModule,
    AnnouncementModule,
    PopupModule,
    SubscriptionModule,
    WishlistModule,
    NotificationModule,
    LogReportModule,
    SettingModule,
    PaymentControlModule,
    GtmModule,
    TiktokModule,
    FbCatalogModule,
    EmailModule,
    TutorialModule,
    SupportModule,
    SeoPageModule,
    SkinTypeModule,
    SkinConcernModule,
    PaymentLinkModule,
    PaymentLinkHistoryModule,
    WebsiteReviewModule,
    UserNotificationModule,
    ExpenseModule,
    ExpenseCategoryModule,
    ScriptModule,
    UploadModule,
    NewsletterModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrerenderMiddleware],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // / (হোমপেজ) এবং /product-details/:slug রিকোয়েস্টের জন্য PrerenderMiddleware প্রয়োগ করা হচ্ছে
    consumer
      .apply(PrerenderMiddleware)
      .forRoutes(
        { path: '/', method: RequestMethod.GET },
        { path: 'product-details/:slug', method: RequestMethod.GET },
      );
  }
}
