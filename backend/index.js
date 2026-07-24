const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const cron = require("node-cron");
const moment = require("moment-timezone");
const compression = require("compression");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const ChatMessage = require("./models/ChatMessage");
const jwt = require("jsonwebtoken");

dotenv.config();

const app = express();
const server = http.createServer(app);

// ---- SOCKET.IO SETUP ----
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
    'https://munastore.in',
    'https://www.munastore.in',
    'https://munahut.in',
    'https://www.munahut.in',
    process.env.FRONTEND_URL   // Set this in .env for production
].filter(Boolean);

const io = new Server(server, {
    cors: {
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            if (origin.endsWith('.vercel.app')) {
                return callback(null, true);
            }
            return callback(new Error('Not allowed by CORS'));
        },
        methods: ["GET", "POST"],
        credentials: true
    },
    maxHttpBufferSize: 1e6
});

app.set('socketio', io); // Make it accessible in controllers

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('Authentication required'));
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const User = require('./models/User');
        const user = await User.findById(decoded.id);
        if (!user) return next(new Error('User not found'));
        
        socket.user = user;
        next();
    } catch (err) {
        next(new Error('Invalid token'));
    }
});

io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on("join_room", async (sessionId) => {
        try {
            const ChatSession = require('./models/ChatSession');
            const session = await ChatSession.findById(sessionId);
            if (!session) return;
            
            const userId = socket.user._id.toString();
            if (session.buyerId.toString() !== userId && session.sellerId.toString() !== userId) {
                return; // Unauthorized
            }
            
            socket.join(sessionId);
            console.log(`User with ID: ${socket.id} joined room: ${sessionId}`);
        } catch(err) {
            console.error("Socket join_room Error:", err);
        }
    });

    socket.on("mark_as_read", async (data) => {
        // data: { sessionId, messageIds }
        try {
            if (data.messageIds && Array.isArray(data.messageIds) && data.messageIds.length > 0) {
                const validIds = data.messageIds.filter(id => mongoose.Types.ObjectId.isValid(id));
                if (validIds.length > 0) {
                    await ChatMessage.updateMany(
                        { _id: { $in: validIds } },
                        { $set: { isRead: true } }
                    );
                }
            }
            // Emit back to the room so the sender's UI updates the ticks
            socket.to(data.sessionId).emit("messages_read", data.messageIds);
        } catch (err) {
            console.error("Socket mark_as_read Error:", err);
        }
    });

    socket.on("disconnect", () => {
        console.log("User Disconnected", socket.id);
    });
});

app.use(helmet());

// Compress all responses for extreme performance
app.use(compression());

// Parse cookies
app.use(cookieParser());

// Render and other cloud providers use reverse proxies.
// We must trust the proxy for express-rate-limit to get the correct user IP.
app.set('trust proxy', 1);

// ---- SECURITY MIDDLEWARE ----

// CORS — Only allow your own frontend origin
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        
        // Check exact match in allowedOrigins
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        // Allow any vercel.app domain dynamically
        if (origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

// Body size limit — prevent DoS via huge payloads
app.use(express.json({ limit: '10mb' }));

// Global rate limiter — 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { message: "Too many requests. Please try again later." }
});
app.use('/api/', globalLimiter);

// Strict rate limiter for auth routes — 10 requests per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: "Too many login attempts. Please try again later." }
});
app.use('/api/auth/', authLimiter);

app.use('/api/shops', (req, res, next) => {
    if (req.method === 'GET') {
        if (req.path === '/my-shop') {
            res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        } else {
            res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
        }
    }
    next();
});

app.use('/api/orders', (req, res, next) => {
    if (req.method === 'GET') {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }
    next();
});

app.use('/api/settings', (req, res, next) => {
    if (req.method === 'GET') {
        res.set('Cache-Control', 'public, max-age=300');
    }
    next();
});

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---- ROUTES ----
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/users', require('./routes/userRoutes')); // Alias for older app versions
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/shops', require('./routes/shopRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/admin/catalog', require('./routes/adminCatalogRoutes'));
app.use('/api/master-products', require('./routes/masterProductRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/shop-categories', require('./routes/shopCategoryRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/vendor-requests', require('./routes/vendorRequestRoutes'));
app.use('/api/live-bazar', require('./routes/liveBazarRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/banners', require('./routes/bannerRoutes'));

app.get("/", (req, res) => {
    res.send("MUNA is running")
});

app.get('/api/sitemap.xml', async (req, res) => {
    try {
        const Shop = require('./models/Shop');
        const shops = await Shop.find({ isActive: true });
        
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://www.munastore.in/</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>https://www.munastore.in/privacy-policy</loc>
        <changefreq>monthly</changefreq>
        <priority>0.5</priority>
    </url>
    <url>
        <loc>https://www.munastore.in/terms-and-conditions</loc>
        <changefreq>monthly</changefreq>
        <priority>0.5</priority>
    </url>
    <url>
        <loc>https://www.munastore.in/about-us</loc>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>
    <url>
        <loc>https://www.munastore.in/contact</loc>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>`;

        shops.forEach(shop => {
            xml += `
    <url>
        <loc>https://www.munastore.in/shop/${shop._id}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>`;
        });

        xml += `\n</urlset>`;

        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (error) {
        console.error("Sitemap generation error:", error);
        res.status(500).end();
    }
});

// Global 404 handler for API routes
app.use('/api', (req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global error handler to prevent HTML responses
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Something went wrong. Please try again." });
});

// ---- DATABASE + SERVER START ----
const PORT = process.env.PORT || 5000;
const Shop = require("./models/Shop");

// Connect to MongoDB FIRST, then start server
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected");

        // Start the server only after DB is connected (Using `server.listen` instead of `app.listen`)
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

        console.log("🚀 MUNA BACKEND LIVE - FCM NOTIFICATION ENABLED v2.1");
        
        // Start Auto Shop Schedule Cron Job (Runs every minute)
        cron.schedule('* * * * *', async () => {
            try {
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
                        shouldBeOpen = currentTime >= openTime && currentTime < closeTime;
                    } else {
                        shouldBeOpen = currentTime >= openTime || currentTime < closeTime;
                    }
                    
                    if (shop.isOpen !== shouldBeOpen) {
                        shop.isOpen = shouldBeOpen;
                        await shop.save();
                        updatedCount++;
                    }
                }
                
                if (updatedCount > 0) {
                    console.log(`[Auto Schedule] Updated status for ${updatedCount} shop(s).`);
                }
            } catch (err) {
                console.error("[Auto Schedule] Cron job error:", err.message);
            }
        });
        console.log("⏱️  Auto Shop Scheduler Started");
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err.message);
        process.exit(1);  // Exit if DB connection fails
    });

// Graceful Shutdown
const gracefulShutdown = () => {
    console.log('Received kill signal, shutting down gracefully');
    server.close(() => {
        console.log('Closed out remaining connections');
        mongoose.connection.close(false).then(() => {
            console.log('MongoDb connection closed.');
            process.exit(0);
        });
    });
    
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
