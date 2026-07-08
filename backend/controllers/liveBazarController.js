const LiveBazarItem = require('../models/LiveBazarItem');
const { uploadStream } = require('../utils/cloudinary');

// 1. Post a new item
const postItem = async (req, res) => {
    try {
        const { title, price, description, longitude, latitude, durationHours } = req.body;
        
        if (!title || !price || !longitude || !latitude) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        let imageUrl = '';
        if (req.file) {
            const result = await uploadStream(req.file.buffer, 'muna/live_bazar');
            imageUrl = result.secure_url;
        } else {
            return res.status(400).json({ message: "Image is required for Live Bazar." });
        }

        const hours = parseInt(durationHours) || 24;
        const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

        const newItem = await LiveBazarItem.create({
            userId: req.user._id,
            title,
            price: Number(price),
            description,
            image: imageUrl,
            location: {
                type: 'Point',
                coordinates: [Number(longitude), Number(latitude)]
            },
            expiresAt
        });

        res.status(201).json({ message: "Item posted successfully", item: newItem });
    } catch (error) {
        console.error("LiveBazar postItem Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 2. Get nearby active items (with optional maxDistance in km, default 1000km)
const getNearbyItems = async (req, res) => {
    try {
        const { lng, lat, maxDistance = 1000 } = req.query;

        if (!lng || !lat) {
            return res.status(400).json({ message: "Longitude and Latitude are required." });
        }

        // Convert maxDistance from km to meters
        const distanceInMeters = Number(maxDistance) * 1000;

        const items = await LiveBazarItem.find({
            status: 'active',
            location: {
                $nearSphere: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [Number(lng), Number(lat)]
                    },
                    $maxDistance: distanceInMeters
                }
            }
        }).populate('userId', 'name phone profilePicture').sort({ createdAt: -1 });

        res.status(200).json(items);
    } catch (error) {
        console.error("LiveBazar getNearbyItems Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// 3. Get my items
const getMyItems = async (req, res) => {
    try {
        const items = await LiveBazarItem.find({ userId: req.user._id })
            .sort({ createdAt: -1 });
        res.status(200).json(items);
    } catch (error) {
        console.error("LiveBazar getMyItems Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 4. Update status (mark as sold out)
const updateStatus = async (req, res) => {
    try {
        const item = await LiveBazarItem.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        if (item.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to update this item." });
        }

        item.status = req.body.status || 'soldout';
        await item.save();

        res.status(200).json({ message: `Item marked as ${item.status}`, item });
    } catch (error) {
        console.error("LiveBazar updateStatus Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 5. Delete an item
const deleteItem = async (req, res) => {
    try {
        const item = await LiveBazarItem.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        if (item.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to delete this item." });
        }

        await item.deleteOne();
        res.status(200).json({ message: "Item deleted successfully" });
    } catch (error) {
        console.error("LiveBazar deleteItem Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 5. Get Single Item By ID
const getItemById = async (req, res) => {
    try {
        const item = await LiveBazarItem.findById(req.params.id)
            .populate('userId', 'name profilePicture');
            
        if (!item) return res.status(404).json({ message: "Item not found" });
        
        res.status(200).json(item);
    } catch (error) {
        console.error("LiveBazar getItemById Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    postItem,
    getNearbyItems,
    getMyItems,
    updateStatus,
    deleteItem,
    getItemById
};
