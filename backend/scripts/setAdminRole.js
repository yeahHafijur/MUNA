/**
 * Script to set super_admin role for specific email addresses.
 * Usage: node scripts/setAdminRole.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN_EMAILS = [
    'ofassam@gmail.com',
    'yhz01012004@gmail.com'
];

async function setAdminRoles() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        for (const email of ADMIN_EMAILS) {
            const user = await User.findOne({ email });
            if (!user) {
                console.log(`❌ User not found: ${email}`);
                continue;
            }

            const previousRole = user.role;
            user.role = 'super_admin';
            await user.save();
            console.log(`✅ ${email}: role changed from "${previousRole}" → "super_admin"`);
        }

        console.log('\n🎉 Done! Admin roles updated.');
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

setAdminRoles();
