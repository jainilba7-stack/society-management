const cloudinary = require('../config/cloudinary');

const uploadImageToCloudinary = (fileBuffer, folder = 'society_app') => {
  return new Promise((resolve, reject) => {
    if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'dydu5cvok') {
      // If credentials exist, attempt upload via stream
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: folder, resource_type: 'auto' },
        (error, result) => {
          if (error) {
            console.warn('[Cloudinary Stream Upload Warning]:', error.message);
            // Fallback to data URI placeholder if network/key fails
            return resolve(`data:image/png;base64,${fileBuffer.toString('base64')}`);
          }
          resolve(result.secure_url);
        }
      );
      uploadStream.end(fileBuffer);
    } else {
      resolve(`data:image/png;base64,${fileBuffer.toString('base64')}`);
    }
  });
};

module.exports = { uploadImageToCloudinary };
