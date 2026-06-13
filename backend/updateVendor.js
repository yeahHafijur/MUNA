require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Shop = require('./models/Shop');

async function updateVendor() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const email = 'irctcshorif@gmail.com';
    let user = await User.findOne({ email });
    
    if (!user) {
      console.log(`User with email ${email} not found.`);
      process.exit(0);
    }

    user.role = 'vendor';
    await user.save();
    console.log(`Updated user ${email} to vendor.`);

    // Check if ticket point shop exists and link it
    const shop = await Shop.findOne({ name: { $regex: /ticket point/i } });
    if (shop) {
      shop.vendorId = user._id;
      await shop.save();
      console.log(`Linked ${shop.name} to vendor ${email}.`);
    } else {
      console.log('Quickkart shop not found in database.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error updating:", error);
    process.exit(1);
  }
}

updateVendor();
