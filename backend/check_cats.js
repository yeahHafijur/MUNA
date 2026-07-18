const mongoose = require('mongoose');

const uri = "mongodb+srv://yhz01012004_db_user:xJaSdREG247oyMCJ@munacluster.dmjrufn.mongodb.net/muna?retryWrites=true&w=majority";

async function run() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");
    
    // Check global categories
    const db = mongoose.connection.db;
    const categories = await db.collection('categories').find({}).toArray();
    console.log("Found", categories.length, "categories in DB:");
    for (const cat of categories) {
      console.log(`- ${cat.name}: hasImage=${!!cat.image} (type=${typeof cat.image})`);
    }
  } catch (error) {
    console.error(error);
  } finally {
    mongoose.disconnect();
  }
}

run();
