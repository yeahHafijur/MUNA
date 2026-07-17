const Shop = require('../models/Shop');
const Product = require('../models/Product');

// Global Search (Shops & Products)
const globalSearch = async (req, res) => {
    try {
        const query = req.query.q;

        if (!query || query.trim() === '') {
            return res.status(200).json({ shops: [], products: [] });
        }

        const safeQuery = query.trim();

        // Escape special characters to prevent NoSQL injection
        const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const sanitizedQuery = escapeRegex(safeQuery);

        // 1. Search Shops using Atlas Search (Fallback to Regex if index is building)
        let shops = [];
        try {
            shops = await Shop.aggregate([
                {
                    $search: {
                        index: "default",
                        text: {
                            query: safeQuery, // Atlas Search handles escaping
                            path: ["name", "category"],
                            fuzzy: { maxEdits: 1 }
                        }
                    }
                },
                { $limit: 10 }
            ]);
        } catch (searchErr) {
            console.log("Atlas Search failed for shops (falling back to regex):", searchErr.message);
            shops = await Shop.find({
                $or: [
                    { name: { $regex: sanitizedQuery, $options: 'i' } },
                    { category: { $regex: sanitizedQuery, $options: 'i' } }
                ]
            }).limit(10).lean();
        }

        // 2. Search Products using Atlas Search + Lookup Shop details
        let products = [];
        try {
            products = await Product.aggregate([
                {
                    $search: {
                        index: "default",
                        text: {
                            query: safeQuery,
                            path: ["name", "category"],
                        }
                    }
                },
                { $limit: 20 },
                // Filter by approved status
                { $match: { approvalStatus: 'approved' } },
                // Match with shop to ensure shop exists and is active
                {
                    $lookup: {
                        from: "shops",
                        localField: "shopId",
                        foreignField: "_id",
                        as: "shopDetails"
                    }
                },
                { $unwind: "$shopDetails" },
                // Project the fields we need
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        price: 1,
                        category: 1,
                        image: 1,
                        inStock: 1,
                        shopId: 1,
                        shopName: "$shopDetails.name",
                        shopAddress: "$shopDetails.address",
                        shopIsOpen: "$shopDetails.isOpen",
                        score: { $meta: "searchScore" }
                    }
                }
            ]);
        } catch (searchErr) {
            console.log("Atlas Search failed for products (falling back to regex):", searchErr.message);
            products = await Product.aggregate([
                {
                    $match: {
                        approvalStatus: 'approved',
                        $or: [
                            { name: { $regex: sanitizedQuery, $options: 'i' } },
                            {
                                $expr: {
                                    $regexMatch: {
                                        input: { $toString: { $ifNull: ["$category", ""] } },
                                        regex: sanitizedQuery,
                                        options: "i"
                                    }
                                }
                            }
                        ]
                    }
                },
                { $limit: 20 },
                {
                    $lookup: {
                        from: "shops",
                        localField: "shopId",
                        foreignField: "_id",
                        as: "shopDetails"
                    }
                },
                { $unwind: "$shopDetails" },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        price: 1,
                        category: 1,
                        image: 1,
                        inStock: 1,
                        shopId: 1,
                        shopName: "$shopDetails.name",
                        shopAddress: "$shopDetails.address",
                        shopIsOpen: "$shopDetails.isOpen"
                    }
                }
            ]);
        }

        res.status(200).json({ shops, products });

    } catch (error) {
        console.error("Global search error:", error);
        res.status(500).json({ message: "Something went wrong while searching." });
    }
};

module.exports = {
    globalSearch
};
