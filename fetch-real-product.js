require('dotenv').config();
const mongoose = require('mongoose');

const uri = `mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOSTNAME}:${process.env.DB_PORT}/${process.env.DB_NAME}?authSource=${process.env.AUTH_SOURCE}`;

mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 }).then(async () => {
  const db = mongoose.connection.db;
  const products = await db.collection('products').find({}).limit(5).toArray();
  console.log('REAL_PRODUCTS_FOUND:', products.length);
  for (const p of products) {
    console.log('-----------------------------------------');
    console.log('_id:', p._id.toString());
    console.log('name:', p.name);
    console.log('slug:', p.slug);
    console.log('salePrice:', p.salePrice);
    console.log('regularPrice:', p.regularPrice);
    console.log('images:', p.images);
    console.log('description:', p.description ? p.description.substring(0, 100) : null);
    console.log('highlights:', p.highlights);
    console.log('includes:', p.includes);
    console.log('excludes:', p.excludes);
    console.log('itineraryStops:', p.itineraryStops);
  }
  process.exit(0);
}).catch(err => {
  console.error('MONGO_CONNECT_ERROR:', err.message);
  process.exit(1);
});
