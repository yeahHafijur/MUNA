require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        // Find the customer account that was accidentally created
        const customer = await User.findOne({ email: 'shorif1596@gmail.com' });
        // Find the vendor account that was created without email
        const vendor = await User.findOne({ phone: '8447122439', role: 'vendor' });

        if (customer && vendor) {
            // Update the vendor with the email and google details
            vendor.email = 'shorif1596@gmail.com';
            vendor.googleId = customer.googleId;
            vendor.profilePic = customer.profilePic;
            await vendor.save();
            console.log("Vendor updated with email.");

            // Delete the duplicate customer account
            await User.deleteOne({ _id: customer._id });
            console.log("Duplicate customer account deleted.");
        } else {
            console.log("Could not find either customer or vendor.");
        }
        
        process.exit();
    });
