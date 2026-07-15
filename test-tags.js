const mongoose = require('mongoose');
const { Schema } = mongoose;

mongoose.connect('mongodb://localhost:27017/RT').then(async () => {
  const Product = mongoose.model('Product', new Schema({}, { strict: false }));
  const products = await Product.find({ shop: '6a4027ff8f92d99c83aa6e87' });
  console.log('Total products for shop:', products.length);
  for (let p of products) {
    if (p.tags && p.tags.length > 0) {
      console.log('Product with tags:', p.name, JSON.stringify(p.tags));
    }
  }
  process.exit(0);
});
