export const optimizeImage = (url, width = 400) => {
    if (!url || typeof url !== 'string') return url;
    
    // Check if it's a Cloudinary URL
    if (url.includes('res.cloudinary.com')) {
        // If it already has transformations (like /upload/v1234/), inject f_auto,q_auto,w_{width}
        if (url.includes('/upload/')) {
            // Check if f_auto or q_auto already exists to avoid duplicates
            if (url.includes('f_auto') || url.includes('q_auto')) return url;
            
            return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`);
        }
    }
    
    return url;
};
