const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

//middleware
app.use(cors());
app.use(express.json());

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/authRoutes'));

app.use('/api/products', require('./routes/productRoutes'));

app.use('/api/shops', require('./routes/shopRoutes'));

app.use('/api/orders', require('./routes/orderRoutes'));

app.use('/api/admin', require('./routes/adminRoutes'));

app.use('/api/master-products', require('./routes/masterProductRoutes'));

app.use('/api/notifications', require('./routes/notificationRoutes'));


app.get("/", (req, res) => {
    res.send("MUNA is running")
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Global 404 handler for API routes
app.use('/api', (req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global error handler to prevent HTML responses
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message || "Internal Server Error" });
});

const mongoose = require("mongoose");
const cron = require("node-cron");
const moment = require("moment-timezone");
const Shop = require("./models/Shop");

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected");
        console.log("🚀 MUNA BACKEND LIVE - ONESIGNAL NOTIFICATION ENABLED v1.1");
        
        // Start Auto Shop Schedule Cron Job (Runs every minute)
        cron.schedule('* * * * *', async () => {
            try {
                // Find all active shops with autoSchedule enabled
                const shops = await Shop.find({ isActive: true, 'autoSchedule.enabled': true });
                
                let updatedCount = 0;
                for (const shop of shops) {
                    const tz = shop.autoSchedule.timezone || 'Asia/Kolkata';
                    const now = moment().tz(tz);
                    
                    const currentTime = now.format('HH:mm');
                    const openTime = shop.autoSchedule.openTime || '09:00';
                    const closeTime = shop.autoSchedule.closeTime || '21:00';
                    
                    let shouldBeOpen = false;
                    
                    if (openTime <= closeTime) {
                        // Normal case: open at 09:00, close at 21:00
                        shouldBeOpen = currentTime >= openTime && currentTime < closeTime;
                    } else {
                        // Overnight case: open at 22:00, close at 02:00
                        shouldBeOpen = currentTime >= openTime || currentTime < closeTime;
                    }
                    
                    if (shop.isOpen !== shouldBeOpen) {
                        shop.isOpen = shouldBeOpen;
                        await shop.save();
                        updatedCount++;
                    }
                }
                
                if (updatedCount > 0) {
                    console.log(`[Auto Schedule] Updated open/close status for ${updatedCount} shop(s).`);
                }
            } catch (err) {
                console.error("[Auto Schedule] Cron job error:", err);
            }
        });
        console.log("⏱️  Auto Shop Scheduler Started");
    })
    .catch((err) => console.log("Eroor is :", err));
