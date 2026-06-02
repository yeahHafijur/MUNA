require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("Connected to DB. Setting up Super Admins...");

        const emailsToAdmin = ["ofassam@gmail.com", "yhz01012004@gmail.com"];

        for (let email of emailsToAdmin) {
            let user = await User.findOne({ email: email });
            if (user) {
                user.role = "super_admin";
                await user.save();
                console.log(`✅ Made ${email} a Super Admin!`);
            } else {
                console.log(`❌ ${email} not found in database. Please log in with this Google account first on the website.`);
            }
        }

        process.exit();
    })
    .catch((err) => {
        console.log("Error:", err);
        process.exit(1);
    });
