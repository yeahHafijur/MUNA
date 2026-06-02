const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect("mongodb+srv://yhz01012004_db_user:xJaSdREG247oyMCJ@munacluster.dmjrufn.mongodb.net/muna?retryWrites=true&w=majority")
    .then(async () => {
        const vendor = await User.findOne({ phone: "6001275419" });
        console.log(vendor);
        process.exit();
    });
