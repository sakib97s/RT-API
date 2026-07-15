const { MongoClient, ObjectId } = require('mongodb');

async function run() {
  const uri = "mongodb://sakibsmsit:6Nle8Ejs10vd8KNd@ac-uyuzhlb-shard-00-00.v2sc77r.mongodb.net:27017,ac-uyuzhlb-shard-00-01.v2sc77r.mongodb.net:27017,ac-uyuzhlb-shard-00-02.v2sc77r.mongodb.net:27017/saleecom?ssl=true&replicaSet=atlas-mysmt6-shard-0&authSource=admin&retryWrites=true&w=majority";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('saleecom');
    
    // Find superadmin
    const admin = await db.collection('admins').findOne({ username: 'superadmin' });
    if (!admin) {
      console.log("Admin 'superadmin' not found.");
      return;
    }
    console.log("Admin ID:", admin._id);

    // Update shop
    const shopId = new ObjectId('6a4027ff8f92d99c83aa6e87');
    const shop = await db.collection('shops').findOne({ _id: shopId });
    if (!shop) {
      console.log("Shop does NOT exist!");
      return;
    }
    console.log("Shop exists!", shop.name);
    
    const result = await db.collection('shops').updateOne(
      { _id: shopId },
      { $addToSet: { users: { _id: admin._id } } }
    );
    
    console.log("Update Result:", result.modifiedCount, "document(s) modified.");
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
