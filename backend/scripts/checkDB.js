require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const stats = await mongoose.connection.db.stats();
  console.log("DB Stats:", stats);
  
  const MasterProduct = mongoose.model('MasterProduct', new mongoose.Schema({},{strict:false}),'masterproducts');
  const prods = await MasterProduct.find({});
  let totalLength = 0;
  for (let p of prods) {
    if (p.image) {
       totalLength += p.image.length;
       if (p.image.length > 1000) {
           console.log("Found long image:", p.image.substring(0, 50));
       }
    }
  }
  console.log("Total length of all MasterProduct images:", totalLength);
  process.exit(0);
}
check();
