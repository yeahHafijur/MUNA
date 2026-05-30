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


app.get("/", (req, res) => {
    res.send("MUNA is running")
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
});

const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.log("Eroor is :", err));


