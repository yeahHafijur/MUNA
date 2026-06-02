require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const vendor = await User.findOne({ phone: "6001275419" });
        console.log(vendor);
        process.exit();
    });
