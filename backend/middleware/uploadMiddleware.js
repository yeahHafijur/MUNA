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

// ── Magic-byte validation (defense in depth) ─────────────────────────────
// The MIME check above only trusts the client-supplied Content-Type.
// This middleware verifies the actual file bytes before they reach Cloudinary.
const hasMagic = (buf, magic) => magic.every((byte, i) => buf[i] === byte);

const isLikelyImage = (buffer) => {
    if (!buffer || buffer.length < 12) return false;
    // JPEG: FF D8 FF
    if (hasMagic(buffer, [0xff, 0xd8, 0xff])) return true;
    // PNG: 89 50 4E 47
    if (hasMagic(buffer, [0x89, 0x50, 0x4e, 0x47])) return true;
    // GIF: 47 49 46 38
    if (hasMagic(buffer, [0x47, 0x49, 0x46, 0x38])) return true;
    // BMP: 42 4D
    if (hasMagic(buffer, [0x42, 0x4d])) return true;
    // WebP: RIFF....WEBP
    if (buffer.slice(0, 4).toString('latin1') === 'RIFF' &&
        buffer.slice(8, 12).toString('latin1') === 'WEBP') return true;
    return false;
};

// Post-multer middleware: reject files whose bytes are not a known image format.
// (SVG and other HTML-capable formats are intentionally rejected to avoid stored XSS.)
const validateUploadedImages = (req, res, next) => {
    const files = [];
    if (req.file) files.push(req.file);
    if (req.files) {
        for (const group of Object.values(req.files)) {
            if (Array.isArray(group)) files.push(...group);
        }
    }
    for (const file of files) {
        if (!isLikelyImage(file.buffer)) {
            return res.status(400).json({ message: "Invalid image file. Only JPEG, PNG, GIF, BMP, or WebP are allowed." });
        }
    }
    next();
};

module.exports = upload;
module.exports.validateUploadedImages = validateUploadedImages;
