require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
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
