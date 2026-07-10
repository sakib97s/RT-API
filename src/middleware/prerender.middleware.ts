import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../pages/product/product.service';

@Injectable()
export class PrerenderMiddleware implements NestMiddleware {
  constructor(private readonly productsService: ProductService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const ua = (req.headers['user-agent'] || '').toString().toLowerCase();
    const crawlerAgents = [
      'facebookexternalhit',
      'facebot', // FB এর আরেকটা UA
      'twitterbot',
      'googlebot',
      'bingbot',
      'linkedinbot',
      'whatsapp',
      'slackbot',
      'telegrambot',
    ];

    console.log('ua', ua);
    const isCrawler = crawlerAgents.some((a) => ua.includes(a));

    // Prefer forwarded headers behind proxy
    const forwardedHost = (req.headers['x-forwarded-host'] as string) || '';
    const forwardedProto = (req.headers['x-forwarded-proto'] as string) || '';
    const domain = forwardedHost || req.get('host') || '';
    const protocol = forwardedProto || req.protocol || 'https';

    // normalize only www -> root (api, shop ইত্যাদি সাবডোমেইন থাকলে থাকবে)
    const normalizeDomain = (d: string) => {
      if (!d) return '';
      let clean = d.trim().toLowerCase();
      if (clean.startsWith('www.')) clean = clean.slice(4);
      return clean;
    };
    const onlyDomain = normalizeDomain(domain);

    const fullUrl = `${protocol}://${domain}${req.originalUrl}`;

    // Helper: absolute image
    const toAbsolute = (url?: string) => {
      if (!url) return '';
      if (/^https?:\/\//i.test(url)) return url;
      return `${protocol}://${domain}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    if (!isCrawler) return next();

    // ---------- Homepage ----------
    // Nginx crawler rewrite: "/" -> "/api/" তাই এখানে /api এবং /api/ কভার করি
    if (req.path === '/api' || req.path === '/api/' || req.path === '/') {
      try {
        const shop =
          await this.productsService.getShopByDomainForPrerender(onlyDomain);
        if (shop) {
          res.set('Content-Type', 'text/html; charset=utf-8');
          return res.send(`<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${shop.websiteName ?? 'Home'}</title>
<meta property="og:title" content="${shop.websiteName ?? ''}">
<meta property="og:description" content="${shop.shortDescription ?? ''}">
<meta property="og:image" content="${toAbsolute(shop.logoPrimary)}">
<meta property="og:url" content="${fullUrl}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${shop.websiteName ?? ''}">
<meta name="twitter:card" content="summary_large_image">
</head><body><p>Loading...</p>
<script>setTimeout(function(){location.href='${fullUrl}';},800);</script>
</body></html>`);
        }
      } catch {}
      return next();
    }

    // ---------- Product Details ----------
    // Regex দিয়ে /product-details/slug এবং /api/product-details/slug — দুটোই ধরুন
    const m = req.originalUrl.match(
      /\/product-details\/([^\/\?\#]+)(?:[\/\?\#]|$)/i,
    );
    if (m && m[1]) {
      const slug = decodeURIComponent(m[1]);
      try {
        const select = 'name seoTitle images';
        const product = await this.productsService.getProductBySlugForPrerender(
          onlyDomain,
          slug,
          select,
        );
        if (product) {
          const title = product.seoTitle ?? product.name ?? '';
          const ogImage = toAbsolute(
            Array.isArray(product.images) && product.images.length
              ? product.images[0]
              : '',
          );
          res.set('Content-Type', 'text/html; charset=utf-8');
          return res.send(`<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta property="og:title" content="${title}">
<meta property="og:image" content="${ogImage}">
<meta property="og:url" content="${fullUrl}">
<meta property="og:type" content="product">
<meta property="og:site_name" content="${onlyDomain}">
<meta name="twitter:card" content="summary_large_image">
</head><body><p>Loading...</p>
<script>setTimeout(function(){location.href='${fullUrl}';},800);</script>
</body></html>`);
        }
      } catch {}
      return next();
    }

    return next();
  }
}
