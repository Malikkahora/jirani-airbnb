const JiraniData = {
    // Flag to check if we are using Firebase
    isFirebase: true,

    init: async function () {
        if (typeof initFirebase === 'function') {
            initFirebase();
        }

        if (!db) {
            console.warn("Firebase DB not initialized. Check js/firebase-config.js");
            return;
        }

        // Auto-seed if empty and we have defaults
        try {
            const airbnbs = await this.getAirbnbs();
            if (airbnbs.length === 0 && typeof savedExportData !== 'undefined' && savedExportData.airbnbs && savedExportData.airbnbs.length > 0) {
                console.log(`Seeding Firebase Airbnbs (Count: ${savedExportData.airbnbs.length})...`);
                for (const item of savedExportData.airbnbs) {
                    await this.addAirbnb(item);
                }
            }

            const properties = await this.getProperties();
            if (properties.length === 0 && typeof savedExportData !== 'undefined' && savedExportData.properties && savedExportData.properties.length > 0) {
                console.log(`Seeding Firebase Properties (Count: ${savedExportData.properties.length})...`);
                for (const item of savedExportData.properties) {
                    await this.addProperty(item);
                }
            }
        } catch (e) {
            console.error("Error auto-seeding:", e);
        }
    },

    getAirbnbsCached: function () {
        const cached = localStorage.getItem(STORE_AIRBNBS);
        if (cached) {
            try {
                return JSON.parse(cached);
            } catch (e) {
                console.error("Error parsing cached airbnbs:", e);
                return [];
            }
        }
        return [];
    },

    getAirbnbs: async function () {
        if (!db) return [];
        try {
            const snapshot = await db.collection(STORE_AIRBNBS).get();
            const items = snapshot.docs.map(doc => {
                let data = doc.data();
                data.id = doc.id; // Ensure ID is part of object
                return data;
            });
            // Cache the result
            try {
                try { localStorage.setItem(STORE_AIRBNBS, JSON.stringify(items)); } catch (e) { console.warn("Cache full"); }
            } catch (quotaError) {
                console.warn("LocalStorage full, airbnbs caching skipped:", quotaError);
            }
            return items;
        } catch (e) {
            console.error("Error getting airbnbs:", e);
            return [];
        }
    },

    getPropertiesCached: function () {
        const cached = localStorage.getItem(STORE_PROPERTIES);
        if (cached) {
            try {
                return JSON.parse(cached);
            } catch (e) {
                console.error("Error parsing cached properties:", e);
                return [];
            }
        }
        return [];
    },

    getProperties: async function () {
        if (!db) return [];
        try {
            const snapshot = await db.collection(STORE_PROPERTIES).get();
            const items = snapshot.docs.map(doc => {
                let data = doc.data();
                data.id = doc.id;
                return data;
            });
            // Cache the result
            try {
                try { localStorage.setItem(STORE_PROPERTIES, JSON.stringify(items)); } catch (e) { console.warn("Cache full"); }
            } catch (quotaError) {
                console.warn("LocalStorage full, properties caching skipped:", quotaError);
            }
            return items;
        } catch (e) {
            console.error("Error getting properties:", e);
            return [];
        }
    },

    saveAirbnbs: async function (items) {
        console.warn("Bulk saveAirbnbs called - not fully implemented for Firebase to avoid overwrites");
        return true;
    },

    addAirbnb: async function (item) {
        if (!db) return;
        try {
            // Using ID from item if available to keep consistency
            if (item.id) {
                await db.collection(STORE_AIRBNBS).doc(item.id.toString()).set(item);
            } else {
                await db.collection(STORE_AIRBNBS).add(item);
            }
        } catch (e) {
            console.error("Error adding airbnb:", e);
            throw e;
        }
    },

    addProperty: async function (item) {
        if (!db) return;
        try {
            if (item.id) {
                await db.collection(STORE_PROPERTIES).doc(item.id.toString()).set(item);
            } else {
                await db.collection(STORE_PROPERTIES).add(item);
            }
        } catch (e) {
            console.error("Error adding property:", e);
            throw e;
        }
    },

    updateAirbnb: async function (item) {
        if (!db) return;
        try {
            await db.collection(STORE_AIRBNBS).doc(item.id.toString()).update(item);
        } catch (e) {
            console.error("Error updating airbnb:", e);
            throw e;
        }
    },

    updateProperty: async function (item) {
        if (!db) return;
        try {
            await db.collection(STORE_PROPERTIES).doc(item.id.toString()).update(item);
        } catch (e) {
            console.error("Error updating property:", e);
            throw e;
        }
    },

    deleteAirbnb: async function (id) {
        if (!db) return;
        await db.collection(STORE_AIRBNBS).doc(id.toString()).delete();
    },

    deleteProperty: async function (id) {
        if (!db) return;
        await db.collection(STORE_PROPERTIES).doc(id.toString()).delete();
    },

    resetData: async function () {
        if (!db) return;
        const airbnbs = await this.getAirbnbs();
        for (const item of airbnbs) {
            await this.deleteAirbnb(item.id);
        }

        const properties = await this.getProperties();
        for (const item of properties) {
            await this.deleteProperty(item.id);
        }

        await this.init();
        return true;
    },

    deleteAllData: async function () {
        if (!db) return;
        console.log("Deleting all data...");
        // Clear LocalStorage
        localStorage.removeItem(STORE_AIRBNBS);
        localStorage.removeItem(STORE_PROPERTIES);

        // Clear Firestore
        const airbnbs = await this.getAirbnbs();
        for (const item of airbnbs) {
            await this.deleteAirbnb(item.id);
        }

        const properties = await this.getProperties();
        for (const item of properties) {
            await this.deleteProperty(item.id);
        }
        console.log("All data deleted.");
        return true;
    },

    getExportData: async function () {
        const airbnbs = await this.getAirbnbs();
        const properties = await this.getProperties();
        const data = { airbnbs, properties };
        return `const savedExportData = ${JSON.stringify(data, null, 4)};`;
    },

    uploadImage: async function (base64Data) {
        // Cloudinary Implementation
        const CLOUD_NAME = 'dfx52cix9';
        const UPLOAD_PRESET = 'JIRANI';

        if (!base64Data) return null;

        // If it's already a URL, return it
        if (!base64Data.startsWith('data:')) return base64Data;

        const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

        const formData = new FormData();
        formData.append('file', base64Data);
        formData.append('upload_preset', UPLOAD_PRESET);

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Cloudinary upload failed: ${errorData.error.message}`);
            }

            const data = await response.json();
            return data.secure_url;
        } catch (e) {
            console.error('Upload failed:', e);
            throw e;
        }
    }
};

const STORE_AIRBNBS = 'jirani_airbnbs';
const STORE_PROPERTIES = 'jirani_properties';
