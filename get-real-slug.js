const http = require('http');

const data = JSON.stringify({
  pagination: { pageSize: 10, currentPage: 0 },
  select: {
    name: 1,
    slug: 1,
    shortDescription: 1,
    description: 1,
    images: 1,
    salePrice: 1,
    regularPrice: 1,
    highlights: 1,
    includes: 1,
    excludes: 1,
    itineraryStops: 1,
    durationValue: 1,
    durationUnit: 1,
    difficulty: 1,
    bookingStatus: 1,
    experienceType: 1,
    cancellationPolicy: 1,
    faq: 1,
    specifications: 1,
    multipleMeetingPoints: 1,
    pickupLocations: 1
  }
});

const req = http.request({
  hostname: 'localhost',
  port: 3013,
  path: '/api/product/get-all-by-shop?shop=6a4027ff8f92d99c83aa6e87',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('REAL_DB_PRODUCTS_START');
    console.log(body);
    console.log('REAL_DB_PRODUCTS_END');
  });
});

req.write(data);
req.end();
