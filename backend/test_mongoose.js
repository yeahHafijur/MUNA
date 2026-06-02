const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect("mongodb+srv://yhz01012004_db_user:xJaSdREG247oyMCJ@munacluster.dmjrufn.mongodb.net/muna?retryWrites=true&w=majority")
    .then(async () => {
        try {
            const vendorEmail = "test_vendor@gmail.com";
            const cleanEmail = vendorEmail.trim().toLowerCase();
            
            const vendor = await User.create({
                name: "Test Vendor",
                email: cleanEmail,
                phone: "9998887776",
                role: "vendor"
            });
            console.log("Created vendor:");
            console.log(vendor);
        } catch(e) {
            console.error(e);
        }
        process.exit();
    });
