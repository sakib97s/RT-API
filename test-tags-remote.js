require('dotenv').config();
const mongoose = require('mongoose');

const uri = `mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOSTNAME}:${process.env.DB_PORT}/${process.env.DB_NAME}?authSource=${process.env.AUTH_SOURCE}`;

mongoose.connect(uri).then(async () => {
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  const Tag = mongoose.model('Tag', new mongoose.Schema({}, { strict: false }));
  
  const tags = await Tag.find({ shop: '6a4027ff8f92d99c83aa6e87', status: 'publish' });
  console.log('Tags:', JSON.stringify(tags, null, 2));

  for (let tag of tags) {
    const products = await Product.find({ shop: '6a4027ff8f92d99c83aa6e87', 'tags.name': tag.name, status: 'publish' });
    console.log(`Tag: ${tag.name} -> Products count: ${products.length}`);
  }

  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
