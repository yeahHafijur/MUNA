const multer = require('multer');
const path = require('path');

// Storage Configuration
const storage = multer.memoryStorage();

// File Filter (Sirf images allow karega)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Sirf images upload ki ja sakti hain!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Max 5MB file
});

module.exports = upload;
