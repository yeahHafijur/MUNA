const VendorRequest = require('../models/VendorRequest');

// Create a new vendor request
const createVendorRequest = async (req, res) => {
    try {
        const { name, shopName, phone, address } = req.body;

        if (!name || !shopName || !phone || !address) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if user already has a pending request
        const existingRequest = await VendorRequest.findOne({ userId: req.user._id, status: 'pending' });
        if (existingRequest) {
            return res.status(400).json({ message: "You already have a pending request. Please wait for our team to contact you." });
        }

        const vendorRequest = await VendorRequest.create({
            userId: req.user._id,
            name: name.trim(),
            shopName: shopName.trim(),
            phone: phone.trim(),
            address: address.trim()
        });

        res.status(201).json({ message: "Request submitted successfully", vendorRequest });
    } catch (error) {
        console.error("Error creating vendor request:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get all vendor requests (Admin only)
const getVendorRequests = async (req, res) => {
    try {
        const requests = await VendorRequest.find().populate('userId', 'name email').sort({ createdAt: -1 });
        res.status(200).json(requests);
    } catch (error) {
        console.error("Error fetching vendor requests:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Update request status (Admin only)
const updateVendorRequestStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'contacted', 'approved', 'rejected'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const request = await VendorRequest.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        res.status(200).json({ message: "Status updated", request });
    } catch (error) {
        console.error("Error updating status:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    createVendorRequest,
    getVendorRequests,
    updateVendorRequestStatus
};
