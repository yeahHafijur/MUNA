const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/muna').then(async () => {
    const Shop = require('./models/Shop');
    const Product = require('./models/Product');
    const lat = 26.64;
    const lng = 92.07;
    
    try {
        const nearbyShops = await Shop.find({
            'location.coordinates': {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    },
                    $maxDistance: 50000000
                }
            }
        }).select('_id name');
        console.log('Nearby shops with location.coordinates:', nearbyShops);
    } catch(err) {
        console.error("Error with location.coordinates:", err.message);
    }
    
    try {
        const nearbyShops2 = await Shop.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    },
                    $maxDistance: 50000000
                }
            }
        }).select('_id name');
        console.log('Nearby shops with location:', nearbyShops2);
    } catch(err) {
        console.error("Error with location:", err.message);
    }
    
    mongoose.disconnect();
});
