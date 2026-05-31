const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/muna")
    .then(async () => {
        console.log("Connected to DB. Checking for admin users...");

        // Pehla Admin (Real number)
        let realAdmin = await User.findOne({ phone: "9101503060" });
        if (realAdmin) {
            realAdmin.role = "super_admin";
            await realAdmin.save();
            console.log("Made 9101503060 a Super Admin!");
        } else {
            console.log("Number 9101503060 not found, waiting for user to login first.");
        }

        // Dusra Admin (Test number)
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

        process.exit();
    })
    .catch((err) => console.log(err));
