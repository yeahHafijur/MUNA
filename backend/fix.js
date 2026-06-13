const mongoose = require('mongoose');

async function fix() {
    await mongoose.connect('mongodb+srv://yhz01012004_db_user:xJaSdREG247oyMCJ@munacluster.dmjrufn.mongodb.net/muna?retryWrites=true&w=majority');
    const Shop = mongoose.model('Shop', new mongoose.Schema({}, {strict: false}), 'shops');
    
    // Set isActive to true for all shops
    const result = await Shop.updateMany(
        { isActive: { $exists: false } },
        { $set: { isActive: true } }
    );
    console.log("Updated shops:", result.modifiedCount);
    
    // Also, if any shop has isActive explicitly set to false incorrectly during testing, let's just make all true for now
    const result2 = await Shop.updateMany({}, { $set: { isActive: true } });
    console.log("Forced all shops to active:", result2.modifiedCount);
    
    process.exit(0);
}

fix();
