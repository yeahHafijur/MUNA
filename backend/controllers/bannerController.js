const Banner = require('../models/Banner');

// @desc    Get all active banners
// @route   GET /api/banners
// @access  Public
exports.getBanners = async (req, res) => {
    try {
        const query = req.query.all === 'true' ? {} : { isActive: true };
        const banners = await Banner.find(query).sort({ position: 1, sortOrder: 1, createdAt: -1 });
        res.json(banners);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching banners' });
    }
};

// @desc    Create a banner
// @route   POST /api/banners
// @access  Private/Admin
exports.createBanner = async (req, res) => {
    try {
        const { position, link, isActive, sortOrder } = req.body;
        
        let image = req.body.image || '';

        // Handle image upload using cloudinary
        if (req.file) {
            const { uploadStream } = require('../utils/cloudinary');
            const result = await uploadStream(req.file.buffer, 'muna/banners');
            image = result.secure_url;
        } else if (req.body.image && req.body.image.startsWith('data:image')) {
            const { uploadBase64 } = require('../utils/cloudinary');
            const result = await uploadBase64(req.body.image, 'muna/banners');
            image = result.secure_url;
        }

        if (!image) {
            return res.status(400).json({ message: 'Image is required' });
        }
        if (!position || !['top', 'mid'].includes(position)) {
            return res.status(400).json({ message: 'Valid position (top/mid) is required' });
        }

        const banner = await Banner.create({
            image,
            position,
            link: link || '',
            isActive: isActive !== undefined ? isActive : true,
            sortOrder: sortOrder || 0
        });

        res.status(201).json(banner);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error creating banner' });
    }
};

// @desc    Update a banner
// @route   PUT /api/banners/:id
// @access  Private/Admin
exports.updateBanner = async (req, res) => {
    try {
        const { isActive, sortOrder, link, position, image } = req.body;
        const banner = await Banner.findById(req.params.id);

        if (!banner) {
            return res.status(404).json({ message: 'Banner not found' });
        }

        if (isActive !== undefined) banner.isActive = isActive;
        if (sortOrder !== undefined) banner.sortOrder = sortOrder;
        if (link !== undefined) banner.link = link;
        if (position !== undefined) banner.position = position;

        // Handle image upload
        if (req.file) {
            const { uploadStream } = require('../utils/cloudinary');
            const result = await uploadStream(req.file.buffer, 'muna/banners');
            banner.image = result.secure_url;
        } else if (req.body.image && req.body.image.startsWith('data:image')) {
            const { uploadBase64 } = require('../utils/cloudinary');
            const result = await uploadBase64(req.body.image, 'muna/banners');
            banner.image = result.secure_url;
        } else if (req.body.image) {
            banner.image = req.body.image;
        }

        await banner.save();
        res.json(banner);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error updating banner' });
    }
};

// @desc    Delete a banner
// @route   DELETE /api/banners/:id
// @access  Private/Admin
exports.deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) {
            return res.status(404).json({ message: 'Banner not found' });
        }

        await banner.deleteOne();
        res.json({ message: 'Banner removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error deleting banner' });
    }
};
