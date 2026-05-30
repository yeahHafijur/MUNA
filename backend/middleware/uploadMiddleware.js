const multer = require('multer');
const path = require('path');

// Storage Configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Ye 'uploads' folder me save karega
    },
    filename: function (req, file, cb) {
        // Har file ka ek unique naam banate hain taaki conflict na ho
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

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
