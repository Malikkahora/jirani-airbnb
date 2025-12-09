const JiraniData = {
    init: function () {
        if (!localStorage.getItem('jirani_airbnbs')) {
            const initialAirbnbs = [
    {
        "id": 1,
        "title": "Nairobi, Kenya",
        "desc": "Stay with James",
        "dates": "Oct 11 - 16",
        "price": 8500,
        "rating": "4.98",
        "imageColor": "#ddd",
        "location": "nairobi",
        "amenities": "Wifi, Kitchen, Parking"
    },
    {
        "id": 2,
        "title": "Mombasa, Kenya",
        "desc": "Beachfront Villa",
        "dates": "Nov 3 - 8",
        "price": 15000,
        "rating": "4.85",
        "imageColor": "#ddd",
        "location": "mombasa",
        "amenities": "Pool, Beach Access, AC"
    },
    {
        "id": 3,
        "title": "Naivasha, Kenya",
        "desc": "Lakeside Cottage",
        "dates": "Dec 20 - 24",
        "price": 12000,
        "rating": "5.0",
        "imageColor": "#ddd",
        "location": "naivasha",
        "amenities": "Lake View, Fireplace, Garden"
    }
];
            localStorage.setItem('jirani_airbnbs', JSON.stringify(initialAirbnbs));
        } else {
            // Migration: Convert old Dollar prices to KES if they look like dollars (< 500)
            const currentData = JSON.parse(localStorage.getItem('jirani_airbnbs'));
            let updated = false;
            const migratedData = currentData.map(item => {
                if (item.price < 500) {
                    item.price = item.price * 100;
                    updated = true;
                }
                return item;
            });
            if (updated) {
                localStorage.setItem('jirani_airbnbs', JSON.stringify(migratedData));
            }
        }

        if (!localStorage.getItem('jirani_properties')) {
            const initialProperties = [
    {
        "id": 1,
        "title": "3 Bdrm Apt, Kilimani",
        "type": "rent",
        "desc": "Modern amenities, Gym, Pool",
        "dates": "Available Now",
        "price": 80000,
        "priceLabel": "/month",
        "rating": "For Rent",
        "imageColor": "#cce0ff",
        "location": "kilimani",
        "amenities": "Gym, Pool, Elevator"
    },
    {
        "id": 2,
        "title": "4 Bdrm House, Karen",
        "type": "buy",
        "desc": "0.5 Acre, Gated Community",
        "dates": "New Listing",
        "price": 65000000,
        "priceLabel": "",
        "rating": "For Sale",
        "imageColor": "#cce0ff",
        "location": "karen",
        "amenities": "Garden, Security, sq"
    },
    {
        "id": 3,
        "title": "Office Space, Westlands",
        "type": "rent",
        "desc": "2000 sq ft, Fully Fitted",
        "dates": "Available Dec 1st",
        "price": 150,
        "priceLabel": "/sq ft",
        "rating": "For Rent",
        "imageColor": "#cce0ff",
        "location": "westlands",
        "amenities": "Parking, CCTV, Cafe"
    }
];
            localStorage.setItem('jirani_properties', JSON.stringify(initialProperties));
        }
    },

    getAirbnbs: function () {
        return JSON.parse(localStorage.getItem('jirani_airbnbs')) || [];
    },

    getProperties: function () {
        return JSON.parse(localStorage.getItem('jirani_properties')) || [];
    },

    saveAirbnbs: function (data) {
        localStorage.setItem('jirani_airbnbs', JSON.stringify(data));
    },

    saveProperties: function (data) {
        localStorage.setItem('jirani_properties', JSON.stringify(data));
    },

    updateAirbnb: function (updatedItem) {
        const items = this.getAirbnbs();
        const index = items.findIndex(i => i.id === updatedItem.id);
        if (index !== -1) {
            items[index] = updatedItem;
            this.saveAirbnbs(items);
        }
    },

    updateProperty: function (updatedItem) {
        const items = this.getProperties();
        const index = items.findIndex(i => i.id === updatedItem.id);
        if (index !== -1) {
            items[index] = updatedItem;
            this.saveProperties(items);
        }
    },

    addAirbnb: function (newItem) {
        const items = this.getAirbnbs();
        // Generate ID
        const maxId = items.reduce((max, item) => item.id > max ? item.id : max, 0);
        newItem.id = maxId + 1;
        items.push(newItem);
        this.saveAirbnbs(items);
    },

    addProperty: function (newItem) {
        const items = this.getProperties();
        const maxId = items.reduce((max, item) => item.id > max ? item.id : max, 0);
        newItem.id = maxId + 1;
        items.push(newItem);
        this.saveProperties(items);
    },

    deleteAirbnb: function (id) {
        const items = this.getAirbnbs();
        const filtered = items.filter(i => i.id !== id);
        this.saveAirbnbs(filtered);
    },

    deleteProperty: function (id) {
        const items = this.getProperties();
        const filtered = items.filter(i => i.id !== id);
        this.saveProperties(filtered);
    },

    moveItem: function (type, id, direction) {
        const items = type === 'airbnb' ? this.getAirbnbs() : this.getProperties();
        const index = items.findIndex(i => i.id === id);
        if (index === -1) return;

        const newIndex = index + direction;
        if (newIndex >= 0 && newIndex < items.length) {
            // Swap
            const temp = items[index];
            items[index] = items[newIndex];
            items[newIndex] = temp;

            if (type === 'airbnb') this.saveAirbnbs(items);
            else this.saveProperties(items);
        }
    }
};

JiraniData.init();
