require('dotenv').config();
const mongoose = require('mongoose');
const MasterProduct = require('./models/MasterProduct');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const prod = await MasterProduct.findOne({ image: { $exists: true, $ne: null } });
  console.log(prod ? prod.image.substring(0, 100) : 'none');
  process.exit(0);
}
test();
