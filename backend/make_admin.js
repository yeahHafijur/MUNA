require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/muna")
    .then(async () => {
        console.log("Connected to DB. Setting up admins...");

        // Make phone-based admin
        let testAdmin = await User.findOne({ phone: "9999999999" });
        if (!testAdmin) {
            await User.create({
                name: "MUNA Admin (Test)",
                phone: "9999999999",
                role: "super_admin"
            });
            console.log("Created 9999999999 as Super Admin!");
        } else {
            testAdmin.role = "super_admin";
            await testAdmin.save();
            console.log("Made 9999999999 a Super Admin!");
        }

        // Make Google-based admin (yhz01012004@gmail.com)
        let googleAdmin = await User.findOne({ email: "yhz01012004@gmail.com" });
        if (googleAdmin) {
            googleAdmin.role = "super_admin";
            await googleAdmin.save();
            console.log("Made yhz01012004@gmail.com a Super Admin!");
        } else {
            console.log("yhz01012004@gmail.com not found yet. Login with Google first, then run this script again.");
        }

        process.exit();
    })
    .catch((err) => console.log(err));
