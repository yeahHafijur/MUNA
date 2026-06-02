require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("Connected to DB. Dropping old indexes...");
        
        try {
            await mongoose.connection.collection('users').dropIndex('phone_1');
            console.log("Dropped phone_1 index.");
        } catch (e) {
            console.log("phone_1 index not found or already dropped.");
        }
        
        try {
            await mongoose.connection.collection('users').dropIndex('email_1');
            console.log("Dropped email_1 index.");
        } catch (e) {
            console.log("email_1 index not found or already dropped.");
        }

        console.log("Done. Mongoose will rebuild sparse indexes on next startup.");
        process.exit();
    })
    .catch((err) => {
        console.log(err);
        process.exit(1);
    });
