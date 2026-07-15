require('dotenv').config();
const mongoose = require('mongoose');

const uri = `mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOSTNAME}:${process.env.DB_PORT}/${process.env.DB_NAME}?authSource=${process.env.AUTH_SOURCE}`;

mongoose.connect(uri).then(async () => {
  const db = mongoose.connection.db;
  const asString = await db.collection('products').find({ shop: '6a4027ff8f92d99c83aa6e87' }).toArray();
  const asObjectId = await db.collection('products').find({ shop: new mongoose.Types.ObjectId('6a4027ff8f92d99c83aa6e87') }).toArray();
  
  console.log('Count as string:', asString.length);
  console.log('Count as ObjectId:', asObjectId.length);

  process.exit(0);
});
