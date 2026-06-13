const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadStream = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const cld_upload_stream = cloudinary.uploader.upload_stream(
      { folder: folder },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    streamifier.createReadStream(buffer).pipe(cld_upload_stream);
  });
};

const uploadBase64 = async (base64Str, folder) => {
  return await cloudinary.uploader.upload(base64Str, { folder: folder });
};

module.exports = { cloudinary, uploadStream, uploadBase64 };
