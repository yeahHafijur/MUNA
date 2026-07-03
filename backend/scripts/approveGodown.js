const mongoose = require('mongoose');

async function approveGodown() {
    await mongoose.connect('mongodb+srv://yhz01012004_db_user:xJaSdREG247oyMCJ@munacluster.dmjrufn.mongodb.net/muna?retryWrites=true&w=majority');
    const MasterProduct = mongoose.model('MasterProduct', new mongoose.Schema({}, {strict: false}), 'masterproducts');
    
    // Update all unapproved items
    const result = await MasterProduct.updateMany(
        { $or: [{ isApproved: false }, { isApproved: { $exists: false } }] },
        { $set: { isApproved: true } }
    );
    
    console.log(`Approved ${result.modifiedCount} items in the Godown.`);
    process.exit(0);
}

approveGodown();
