const mongoose = require('mongoose');

// Schemas
const userSchema = new mongoose.Schema({}, { strict: false });
const shopSchema = new mongoose.Schema({}, { strict: false });
const productSchema = new mongoose.Schema({}, { strict: false });
const masterProductSchema = new mongoose.Schema({}, { strict: false });
const orderSchema = new mongoose.Schema({}, { strict: false });

async function migrate() {
    console.log("Connecting to Local DB...");
    const localDb = await mongoose.createConnection('mongodb://127.0.0.1:27017/muna').asPromise();
    console.log("Connected to Local DB.");

    console.log("Connecting to Atlas DB...");
    require('dotenv').config();
    const atlasDb = await mongoose.createConnection(process.env.MONGO_URI).asPromise();
    console.log("Connected to Atlas DB.");

    const collections = [
        { name: 'users', schema: userSchema },
        { name: 'shops', schema: shopSchema },
        { name: 'products', schema: productSchema },
        { name: 'masterproducts', schema: masterProductSchema },
        { name: 'orders', schema: orderSchema }
    ];

    for (const col of collections) {
        console.log(`Migrating ${col.name}...`);
        const LocalModel = localDb.model(col.name, col.schema, col.name);
        const AtlasModel = atlasDb.model(col.name, col.schema, col.name);

        const data = await LocalModel.find({}).lean();
        if (data.length > 0) {
            await AtlasModel.deleteMany({}); // clear existing
            await AtlasModel.insertMany(data);
            console.log(`✅ Migrated ${data.length} records to ${col.name}.`);
        } else {
            console.log(`⚠️ No data found in ${col.name}.`);
        }
    }

    // Attempt to create Search Index programmatically using MongoDB Node driver
    try {
        console.log("\nAttempting to create Atlas Search Index on 'products'...");
        const db = atlasDb.getClient().db('muna');
        const collection = db.collection('products');
        
        await collection.createSearchIndex({
            name: "default",
            definition: {
                "mappings": {
                    "dynamic": false,
                    "fields": {
                        "name": {
                            "type": "string",
                            "analyzer": "lucene.standard"
                        },
                        "category": {
                            "type": "string",
                            "analyzer": "lucene.standard"
                        }
                    }
                }
            }
        });
        console.log("✅ Search Index 'default' created on 'products' collection.");
    } catch (err) {
        console.log("⚠️ Could not create search index programmatically (this is normal on some tiers). Error:", err.message);
    }

    try {
        console.log("\nAttempting to create Atlas Search Index on 'shops'...");
        const db = atlasDb.getClient().db('muna');
        const collection = db.collection('shops');
        
        await collection.createSearchIndex({
            name: "default",
            definition: {
                "mappings": {
                    "dynamic": false,
                    "fields": {
                        "name": {
                            "type": "string",
                            "analyzer": "lucene.standard"
                        },
                        "category": {
                            "type": "string",
                            "analyzer": "lucene.standard"
                        }
                    }
                }
            }
        });
        console.log("✅ Search Index 'default' created on 'shops' collection.");
    } catch (err) {
        console.log("⚠️ Could not create search index programmatically. Error:", err.message);
    }

    console.log("\nMigration completed successfully.");
    process.exit(0);
}

migrate().catch(err => {
    console.error(err);
    process.exit(1);
});
