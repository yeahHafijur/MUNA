const mongoose = require('mongoose');

async function makeAdmin() {
    await mongoose.connect('mongodb+srv://yhz01012004_db_user:xJaSdREG247oyMCJ@munacluster.dmjrufn.mongodb.net/muna?retryWrites=true&w=majority');
    const User = mongoose.model('User', new mongoose.Schema({}, {strict: false}), 'users');
    
    const emails = ["yhz01012004@gmail.com", "ofassam@gmail.com"];
    
    const result = await User.updateMany(
        { email: { $in: emails } },
        { $set: { role: 'super_admin' } }
    );
    
    console.log(`Updated ${result.modifiedCount} users to super_admin`);
    process.exit(0);
}

makeAdmin();
