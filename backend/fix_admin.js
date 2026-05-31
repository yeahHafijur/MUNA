const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("Connected. Creating Admin...");
        const adminId = '6a16f22c6d76b8490fd3b245';
        
        // Delete if already exists just in case
        await User.deleteOne({ _id: adminId });
        await User.deleteOne({ phone: '9999999999' });

        await User.create({
            _id: adminId,
            name: 'MUNA Admin',
            phone: '9999999999',
            role: 'super_admin'
        });

        console.log("Admin created successfully!");
        process.exit();
    })
    .catch(err => console.log(err));
