require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const users = await User.find({ phone: "6001275419" });
        console.log("Users with phone 6001275419:");
        console.log(users);
        process.exit();
    });
