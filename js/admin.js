/**
 * Jirani Admin Dashboard Logic
 * Location-separated listings, rapid duplication, drag & drop media upload, and state management.
 */

// State
let currentTab = 'airbnbs';
let allItems = []; // Full loaded dataset for current tab
let activeLocationFilter = 'all';
let viewMode = 'grouped'; // 'grouped' (separate by location) or 'table' (single table)
let editingId = null;
let editingImages = [];
let searchQuery = '';

// Init
document.addEventListener('DOMContentLoaded', async () => {
    // Auth Check
    if (!sessionStorage.getItem('jirani_admin_logged_in')) {
        window.location.href = '../login/';
        return;
    }

    // Initialize Data Layer
    await JiraniData.init();

    // Initial Render
    await loadData('airbnbs');
    setupEventListeners();
});

// Navigation between Airbnbs & Properties
function switchTab(tab) {
    currentTab = tab;
    activeLocationFilter = 'all';
    searchQuery = '';
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';

    // Update Sidebar UI
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => el.classList.remove('active'));
    const navEl = document.getElementById(`nav-${tab}`);
    if (navEl) navEl.classList.add('active');

    // Update Page Title
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = tab === 'airbnbs' ? 'Manage Airbnbs' : 'Manage Properties';

    loadData(tab);
}

// Data Loading
async function loadData(tab) {
    const container = document.getElementById('listings-view-container');
    if (container) {
        container.innerHTML = `
            <div style="text-align:center; padding:50px 20px; color:#64748b;">
                <i class="fas fa-spinner fa-spin fa-2x" style="margin-bottom:12px; color:#2d60ff;"></i>
                <div>Loading listings...</div>
            </div>
        `;
    }

    try {
        if (tab === 'airbnbs') {
            allItems = await JiraniData.getAirbnbs();
        } else {
            allItems = await JiraniData.getProperties();
        }

        // Sort by newest added by default (highest timestamp or id)
        allItems.sort((a, b) => {
            const timeA = a.createdAt || a.timestamp || 0;
            const timeB = b.createdAt || b.timestamp || 0;
            return timeB - timeA;
        });

        updateDashboardStats();
        renderLocationFilters();
        renderCurrentView();
    } catch (e) {
        console.error("Load failed", e);
        if (container) {
            container.innerHTML = `
                <div class="empty-state-box" style="color:#ef4444;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Failed to load listings</h3>
                    <p>${e.message || 'Please check your connection and refresh.'}</p>
                </div>
            `;
        }
    }
}

// Helper: Normalize location string for clean grouping (e.g. "kilimani" -> "Kilimani")
function normalizeLocation(loc) {
    if (!loc) return 'Unspecified';
    const clean = loc.trim();
    if (!clean) return 'Unspecified';
    return clean.replace(/\w\S*/g, (txt) => (txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()));
}

// Update Stats Ribbon
function updateDashboardStats() {
    const totalEl = document.getElementById('stat-total-count');
    const locsEl = document.getElementById('stat-locations-count');
    const avgEl = document.getElementById('stat-avg-price');

    if (!totalEl || !locsEl || !avgEl) return;

    totalEl.textContent = allItems.length;

    // Unique locations count
    const uniqueLocs = new Set(allItems.map(i => normalizeLocation(i.location)));
    locsEl.textContent = uniqueLocs.size;

    // Average price calculation
    const validPrices = allItems.map(i => parseInt(i.price)).filter(p => !isNaN(p) && p > 0);
    if (validPrices.length > 0) {
        const sum = validPrices.reduce((a, b) => a + b, 0);
        const avg = Math.round(sum / validPrices.length);
        avgEl.textContent = `KES ${avg.toLocaleString()}`;
    } else {
        avgEl.textContent = 'KES 0';
    }
}

// Render Dynamic Location Filter Chips
function renderLocationFilters() {
    const bar = document.getElementById('location-filters-bar');
    if (!bar) return;

    // Count listings per normalized location
    const counts = {};
    allItems.forEach(item => {
        const norm = normalizeLocation(item.location);
        counts[norm] = (counts[norm] || 0) + 1;
    });

    // Sort locations by highest listing count first
    const sortedLocs = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

    let html = `
        <span class="loc-filter-label"><i class="fas fa-filter"></i> Location:</span>
        <button type="button" class="loc-chip ${activeLocationFilter === 'all' ? 'active' : ''}" data-loc="all" onclick="filterByLocation('all')">
            All Locations <span class="chip-count">${allItems.length}</span>
        </button>
    `;

    sortedLocs.forEach(loc => {
        const count = counts[loc];
        const isActive = activeLocationFilter.toLowerCase() === loc.toLowerCase();
        html += `
            <button type="button" class="loc-chip ${isActive ? 'active' : ''}" data-loc="${loc}" onclick="filterByLocation('${loc}')">
                ${loc} <span class="chip-count">${count}</span>
            </button>
        `;
    });

    bar.innerHTML = html;
}

// Filter by Location Click
window.filterByLocation = function (loc) {
    activeLocationFilter = loc;
    document.querySelectorAll('.loc-chip').forEach(btn => {
        const dataLoc = btn.getAttribute('data-loc');
        if (dataLoc && dataLoc.toLowerCase() === loc.toLowerCase()) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    renderCurrentView();
};

// Toggle View Mode ('grouped' or 'table')
window.setViewMode = function (mode) {
    viewMode = mode;
    document.getElementById('view-mode-grouped')?.classList.toggle('active', mode === 'grouped');
    document.getElementById('view-mode-table')?.classList.toggle('active', mode === 'table');
    renderCurrentView();
};

// Search handling
function handleSearch(query) {
    searchQuery = (query || '').toLowerCase().trim();
    renderCurrentView();
}

// Main View Router
function renderCurrentView() {
    const container = document.getElementById('listings-view-container');
    if (!container) return;

    // Filter items based on active location & search query
    let filtered = allItems.filter(item => {
        // Location filter
        if (activeLocationFilter !== 'all') {
            const itemLoc = normalizeLocation(item.location).toLowerCase();
            if (itemLoc !== activeLocationFilter.toLowerCase()) return false;
        }

        // Search Query filter
        if (searchQuery) {
            const title = (item.title || '').toLowerCase();
            const loc = (item.location || '').toLowerCase();
            const id = String(item.id || '').toLowerCase();
            const desc = (item.desc || '').toLowerCase();
            const matches = title.includes(searchQuery) || loc.includes(searchQuery) || id.includes(searchQuery) || desc.includes(searchQuery);
            if (!matches) return false;
        }

        return true;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state-box">
                <i class="fas fa-search"></i>
                <h3 style="margin-bottom:8px; color:#1e293b;">No listings found</h3>
                <p>No listings match your current filters (${activeLocationFilter !== 'all' ? `Location: ${activeLocationFilter}` : 'All Locations'}${searchQuery ? `, Search: "${searchQuery}"` : ''}).</p>
                <button class="btn btn-primary" style="margin-top:14px;" onclick="resetFilters()">
                    <i class="fas fa-undo"></i> Reset Filters
                </button>
            </div>
        `;
        return;
    }

    if (viewMode === 'grouped') {
        renderGroupedView(filtered, container);
    } else {
        renderTableView(filtered, container);
    }
}

// Reset Filters
window.resetFilters = function () {
    activeLocationFilter = 'all';
    searchQuery = '';
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    renderLocationFilters();
    renderCurrentView();
};

// 1. GROUPED VIEW: Separate by Location Cards
function renderGroupedView(items, container) {
    // Group items by normalized location
    const groups = {};
    items.forEach(item => {
        const norm = normalizeLocation(item.location);
        if (!groups[norm]) groups[norm] = [];
        groups[norm].push(item);
    });

    // Sort locations by listing count descending
    const sortedLocs = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length);

    let html = '';
    sortedLocs.forEach(locName => {
        const locItems = groups[locName];
        
        // Calculate average price for this location
        const validPrices = locItems.map(i => parseInt(i.price)).filter(p => !isNaN(p) && p > 0);
        let avgStr = '';
        if (validPrices.length > 0) {
            const avg = Math.round(validPrices.reduce((a, b) => a + b, 0) / validPrices.length);
            avgStr = `<span class="loc-avg-price">· Avg: KES ${avg.toLocaleString()}/night</span>`;
        }

        html += `
            <div class="location-group-card">
                <div class="location-group-header">
                    <div class="loc-header-left">
                        <span class="loc-pin-icon"><i class="fas fa-map-marker-alt"></i></span>
                        <h3 class="loc-title">${locName}</h3>
                        <span class="loc-badge-count">${locItems.length} Listing${locItems.length === 1 ? '' : 's'}</span>
                        ${avgStr}
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="openEditModal(null, '${locName}')">
                        <i class="fas fa-plus"></i> Add in ${locName}
                    </button>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th width="75">Photo</th>
                                <th>Title / Details</th>
                                <th width="120">Specs</th>
                                <th width="120">Price / Night</th>
                                ${currentTab === 'properties' ? '<th width="90">Type</th>' : ''}
                                <th width="200" style="text-align:right;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${locItems.map(item => renderTableRowHTML(item)).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// 2. SINGLE TABLE VIEW
function renderTableView(items, container) {
    const html = `
        <div class="table-card">
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th width="75">Photo</th>
                            <th>Title / ID</th>
                            <th>Location</th>
                            <th width="120">Specs</th>
                            <th width="130">Price</th>
                            ${currentTab === 'properties' ? '<th width="90">Type</th>' : ''}
                            <th width="200" style="text-align:right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => renderTableRowHTML(item, true)).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    container.innerHTML = html;
}

// Row Renderer Helper
function renderTableRowHTML(item, showLocationCell = false) {
    // Image handling
    let displayImg = '';
    let images = item.images || (item.image ? [item.image] : []);
    if (images.length > 0) {
        let src = images[0];
        if (src.includes('res.cloudinary.com')) {
            src = src.replace('/upload/', '/upload/w_100,f_auto,q_auto/');
        }
        displayImg = `<img src="${src}" class="listing-img" alt="${item.title}" onerror="this.onerror=null;this.src='/images/logo.png';this.style.objectFit='contain';">`;
    } else {
        displayImg = `<div class="listing-img" style="background:#e2e8f0; display:flex; align-items:center; justify-content:center; color:#94a3b8;"><i class="fas fa-image"></i></div>`;
    }

    const typeCell = currentTab === 'properties' 
        ? `<td><span class="badge badge-info" style="text-transform:capitalize;">${item.type || 'N/A'}</span></td>` 
        : '';

    // Category Tags
    const catList = Array.isArray(item.categories) ? item.categories : (item.category ? [item.category] : []);
    const catBadges = catList.length > 0 
        ? `<div style="display:flex; gap:4px; margin-top:4px; flex-wrap:wrap;">${catList.map(c => `<span class="badge" style="background:#e8f4ec; color:#2d6a4f; font-size:0.68rem; padding:2px 6px; text-transform:capitalize;">${c}</span>`).join('')}</div>`
        : '';

    // Room & Bath specs
    const roomsVal = item.rooms || item.beds || '-';
    const bathsVal = item.baths ? `${item.baths} Bath` : '';
    const specsStr = `${roomsVal}${bathsVal ? ` · ${bathsVal}` : ''}`;

    const locationCell = showLocationCell 
        ? `<td><span style="font-weight:600; color:#334155;"><i class="fas fa-map-marker-alt" style="color:#2d60ff; font-size:0.75rem; margin-right:4px;"></i>${item.location || 'N/A'}</span></td>` 
        : '';

    return `
        <tr>
            <td>
                <div style="position:relative; width:48px; height:48px;">
                    ${displayImg}
                    ${images.length > 1 ? `<span style="position:absolute; bottom:2px; right:2px; background:rgba(0,0,0,0.65); color:#fff; font-size:0.6rem; font-weight:700; padding:1px 3px; border-radius:3px;">+${images.length - 1}</span>` : ''}
                </div>
            </td>
            <td>
                <div style="font-weight:600; color:#0f172a; font-size:0.92rem;">${item.title || 'Untitled'}</div>
                <div style="font-size:0.75rem; color:#888;">ID: ${item.id}</div>
                ${catBadges}
            </td>
            ${locationCell}
            <td>
                <span style="font-size:0.84rem; color:#475569;">${specsStr}</span>
            </td>
            <td>
                <strong style="color:#0f172a;">KES ${item.price ? item.price.toLocaleString() : '0'}</strong>
                <span style="font-size:0.75rem; color:#64748b; display:block;">/ night</span>
            </td>
            ${typeCell}
            <td style="text-align:right; white-space:nowrap;">
                <button type="button" class="btn btn-primary btn-sm" onclick="openEditModal('${item.id}')" title="Edit listing">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button type="button" class="btn btn-duplicate btn-sm" onclick="duplicateItem('${item.id}')" title="Duplicate into a new listing">
                    <i class="fas fa-copy"></i>
                </button>
                <button type="button" class="btn btn-danger btn-sm" onclick="deleteItem('${item.id}')" title="Delete listing">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `;
}

// Category Tag Toggle
window.toggleCategoryTag = function (cat, btnEl = null) {
    const btn = btnEl || document.querySelector(`.btn-cat-tag[data-val="${cat}"]`);
    if (btn) btn.classList.toggle('active');

    const activeTags = [];
    document.querySelectorAll('.btn-cat-tag.active').forEach(b => {
        activeTags.push(b.getAttribute('data-val'));
    });

    const input = document.getElementById('edit-categories');
    if (!input) return;
    const existing = (input.value || '').split(',').map(s => s.trim()).filter(Boolean);
    const standard = ['romantic', 'family', 'business', 'luxury', 'budget'];
    const customs = existing.filter(t => !standard.includes(t.toLowerCase()));

    const combined = [...new Set([...activeTags, ...customs])];
    input.value = combined.join(', ');
};
function toggleCategoryTag(cat, btnEl) { return window.toggleCategoryTag(cat, btnEl); }

// Amenity Tag Toggle
window.toggleAmenityTag = function (amenity, btnEl = null) {
    const btn = btnEl || document.querySelector(`.btn-amenity-tag[data-val="${amenity}"]`);
    if (btn) btn.classList.toggle('active');

    const activeAmenityTags = [];
    document.querySelectorAll('.btn-amenity-tag.active').forEach(b => {
        activeAmenityTags.push(b.getAttribute('data-val'));
    });

    const standardMap = {
        'swimming pool': 'Swimming Pool',
        'gym': 'Gym',
        'sauna': 'Sauna',
        'ample parking': 'Ample Parking',
        'rooftop bar': 'Rooftop Bar',
        'balcony': 'Balcony'
    };

    const input = document.getElementById('edit-amenities');
    if (!input) return;
    const existing = (input.value || '').split(',').map(s => s.trim()).filter(Boolean);
    const standardKeys = Object.keys(standardMap);
    const customs = existing.filter(t => !standardKeys.some(k => t.toLowerCase() === k));

    const formattedActive = activeAmenityTags.map(k => standardMap[k] || k);
    const combined = [...new Set([...formattedActive, ...customs])];
    input.value = combined.join(', ');
};
function toggleAmenityTag(amenity, btnEl) { return window.toggleAmenityTag(amenity, btnEl); }

// Quick Auto-fill Helpers inside Modal
window.setQuickLocation = function (loc) {
    const input = document.getElementById('edit-location');
    if (input) input.value = loc;
    document.querySelectorAll('#location-quick-chips .btn-quick-chip').forEach(btn => {
        btn.classList.toggle('selected', btn.textContent.trim().toLowerCase() === loc.toLowerCase());
    });
};

window.setQuickRooms = function (rooms) {
    const input = document.getElementById('edit-rooms');
    if (input) input.value = rooms;
};

window.setQuickBaths = function (baths) {
    const input = document.getElementById('edit-baths');
    if (input) input.value = baths;
};

// Open Modal (Create / Edit / Pre-fill Location)
window.openEditModal = async function (id = null, defaultLocation = null) {
    const modal = document.querySelector('.modal-overlay');
    const form = document.getElementById('edit-form');

    // Reset Form & Media
    form.reset();
    editingImages = [];
    document.getElementById('upload-preview').innerHTML = '';
    const imgCountBadge = document.getElementById('image-count-badge');
    if (imgCountBadge) imgCountBadge.textContent = '0 photos';
    const pricePreview = document.getElementById('price-preview-helper');
    if (pricePreview) pricePreview.textContent = 'Preview: KES 0 / night';

    // Reset Tags
    document.querySelectorAll('.btn-cat-tag').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.btn-amenity-tag').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.btn-quick-chip').forEach(b => b.classList.remove('selected'));

    const titleEl = document.getElementById('modal-title');
    const subtitleEl = document.getElementById('modal-subtitle');
    const typeContainer = document.getElementById('type-group');

    if (id) {
        // Edit Mode
        editingId = id;
        if (titleEl) titleEl.textContent = 'Edit Listing';
        if (subtitleEl) subtitleEl.textContent = `ID: ${id}`;

        const item = allItems.find(i => String(i.id) === String(id));
        if (item) {
            document.getElementById('edit-title').value = item.title || '';
            document.getElementById('edit-desc').value = item.desc || '';
            document.getElementById('edit-location').value = item.location || '';
            document.getElementById('edit-price').value = item.price || '';
            document.getElementById('edit-rooms').value = item.rooms || item.beds || '';
            document.getElementById('edit-baths').value = item.baths || '';
            document.getElementById('edit-amenities').value = item.amenities || '';

            // Update Price preview
            if (pricePreview && item.price) {
                pricePreview.textContent = `Preview: KES ${parseInt(item.price).toLocaleString()} / night`;
            }

            // Highlight matching location chip
            if (item.location) {
                document.querySelectorAll('#location-quick-chips .btn-quick-chip').forEach(btn => {
                    if (btn.textContent.trim().toLowerCase() === item.location.trim().toLowerCase()) {
                        btn.classList.add('selected');
                    }
                });
            }

            // Amenities
            const amenitiesText = (item.amenities || '').toLowerCase();
            const standardAmenityKeys = ['swimming pool', 'gym', 'sauna', 'ample parking', 'rooftop bar', 'balcony'];
            standardAmenityKeys.forEach(key => {
                const btn = document.querySelector(`.btn-amenity-tag[data-val="${key}"]`);
                if (!btn) return;
                let hasIt = amenitiesText.includes(key);
                if (key === 'swimming pool' && (amenitiesText.includes('pool') || amenitiesText.includes('swimming'))) hasIt = true;
                if (key === 'ample parking' && (amenitiesText.includes('parking') || amenitiesText.includes('garage'))) hasIt = true;
                if (key === 'rooftop bar' && (amenitiesText.includes('rooftop bar') || (amenitiesText.includes('rooftop') && amenitiesText.includes('bar')))) hasIt = true;
                if (hasIt) btn.classList.add('active');
            });

            // Categories
            const catInput = document.getElementById('edit-categories');
            const catList = Array.isArray(item.categories) 
                ? item.categories 
                : (item.category ? String(item.category).split(',').map(s => s.trim()) : []);

            if (catInput) catInput.value = catList.join(', ');
            catList.forEach(c => {
                const btn = document.querySelector(`.btn-cat-tag[data-val="${c.toLowerCase()}"]`);
                if (btn) btn.classList.add('active');
            });

            // Type for properties
            if (typeContainer) {
                typeContainer.style.display = currentTab === 'properties' ? 'block' : 'none';
                if (currentTab === 'properties') document.getElementById('edit-type').value = item.type || 'rent';
            }

            // Images
            editingImages = [...(item.images || (item.image ? [item.image] : []))];
            renderImagePreview();
        }
    } else {
        // Create Mode
        editingId = null;
        if (titleEl) titleEl.textContent = `Add New ${currentTab === 'airbnbs' ? 'Airbnb' : 'Property'}`;
        if (subtitleEl) subtitleEl.textContent = 'Enter details below to publish immediately';
        if (typeContainer) typeContainer.style.display = currentTab === 'properties' ? 'block' : 'none';

        // Pre-fill location if opened from a location section button
        if (defaultLocation) {
            setQuickLocation(defaultLocation);
        }
    }

    if (modal) modal.classList.add('active');
};

window.closeModal = function () {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.classList.remove('active');
};

// DUPLICATE LISTING: Pre-fills new entry with existing listing data
window.duplicateItem = function (id) {
    const item = allItems.find(i => String(i.id) === String(id));
    if (!item) return;

    // Open modal in create mode
    openEditModal();

    const titleEl = document.getElementById('modal-title');
    const subtitleEl = document.getElementById('modal-subtitle');
    if (titleEl) titleEl.textContent = `Duplicate: ${item.title || 'Listing'}`;
    if (subtitleEl) subtitleEl.textContent = `Cloned from ${item.id} — adjust details and click Save to create new listing`;

    // Fill all fields
    document.getElementById('edit-title').value = `${item.title || 'Listing'} (Copy)`;
    document.getElementById('edit-desc').value = item.desc || '';
    document.getElementById('edit-location').value = item.location || '';
    document.getElementById('edit-price').value = item.price || '';
    document.getElementById('edit-rooms').value = item.rooms || item.beds || '';
    document.getElementById('edit-baths').value = item.baths || '';
    document.getElementById('edit-amenities').value = item.amenities || '';

    // Price preview
    const pricePreview = document.getElementById('price-preview-helper');
    if (pricePreview && item.price) {
        pricePreview.textContent = `Preview: KES ${parseInt(item.price).toLocaleString()} / night`;
    }

    // Matching location chip
    if (item.location) {
        document.querySelectorAll('#location-quick-chips .btn-quick-chip').forEach(btn => {
            if (btn.textContent.trim().toLowerCase() === item.location.trim().toLowerCase()) {
                btn.classList.add('selected');
            }
        });
    }

    // Amenities tags
    const amenitiesText = (item.amenities || '').toLowerCase();
    const standardAmenityKeys = ['swimming pool', 'gym', 'sauna', 'ample parking', 'rooftop bar', 'balcony'];
    standardAmenityKeys.forEach(key => {
        const btn = document.querySelector(`.btn-amenity-tag[data-val="${key}"]`);
        if (!btn) return;
        let hasIt = amenitiesText.includes(key);
        if (key === 'swimming pool' && (amenitiesText.includes('pool') || amenitiesText.includes('swimming'))) hasIt = true;
        if (key === 'ample parking' && (amenitiesText.includes('parking') || amenitiesText.includes('garage'))) hasIt = true;
        if (key === 'rooftop bar' && (amenitiesText.includes('rooftop bar') || (amenitiesText.includes('rooftop') && amenitiesText.includes('bar')))) hasIt = true;
        if (hasIt) btn.classList.add('active');
    });

    // Categories
    const catInput = document.getElementById('edit-categories');
    const catList = Array.isArray(item.categories) 
        ? item.categories 
        : (item.category ? String(item.category).split(',').map(s => s.trim()) : []);

    if (catInput) catInput.value = catList.join(', ');
    catList.forEach(c => {
        const btn = document.querySelector(`.btn-cat-tag[data-val="${c.toLowerCase()}"]`);
        if (btn) btn.classList.add('active');
    });

    // Copy images array
    editingImages = [...(item.images || (item.image ? [item.image] : []))];
    renderImagePreview();
};

// Image Preview Renderer with Cover Photo & Reorder
function renderImagePreview() {
    const container = document.getElementById('upload-preview');
    const badge = document.getElementById('image-count-badge');
    if (!container) return;

    if (badge) {
        badge.textContent = `${editingImages.length} photo${editingImages.length === 1 ? '' : 's'} attached`;
    }

    container.innerHTML = '';
    editingImages.forEach((src, index) => {
        const div = document.createElement('div');
        div.className = `upload-item ${index === 0 ? 'is-cover' : ''}`;
        
        let thumbSrc = src;
        if (thumbSrc.includes('res.cloudinary.com')) {
            thumbSrc = thumbSrc.replace('/upload/', '/upload/w_180,f_auto,q_auto/');
        }

        const isCover = index === 0;
        div.innerHTML = `
            <img src="${thumbSrc}" alt="Listing Photo ${index + 1}">
            ${isCover ? '<span class="cover-badge"><i class="fas fa-star"></i> Cover Photo</span>' : ''}
            ${!isCover ? `<button type="button" class="set-cover-btn" onclick="setCoverImage(${index})"><i class="fas fa-star"></i> Set as Cover</button>` : ''}
            <button type="button" class="upload-remove" title="Remove photo" onclick="removeImage(${index})">&times;</button>
        `;
        container.appendChild(div);
    });
}

// Make image at index the primary cover photo
window.setCoverImage = function (index) {
    if (index <= 0 || index >= editingImages.length) return;
    const selected = editingImages.splice(index, 1)[0];
    editingImages.unshift(selected); // Put at index 0 (main card cover)
    renderImagePreview();
};

// Remove photo
window.removeImage = function (index) {
    editingImages.splice(index, 1);
    renderImagePreview();
};

// Add Photo via direct URL
window.addImageFromUrl = function () {
    const input = document.getElementById('image-url-input');
    if (!input) return;
    const url = input.value.trim();
    if (!url) {
        alert('Please enter or paste an image URL');
        return;
    }
    editingImages.push(url);
    renderImagePreview();
    input.value = '';
};

// CRUD Operations: Form Submit
async function handleFormSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('save-btn') || e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    btn.disabled = true;

    try {
        // Upload any local base64 images to storage
        const finalImages = [];
        for (const img of editingImages) {
            if (img.startsWith('data:')) {
                const url = await JiraniData.uploadImage(img);
                finalImages.push(url);
            } else {
                finalImages.push(img);
            }
        }

        // Parse Category Tags
        const rawCategories = (document.getElementById('edit-categories')?.value || '');
        const categoriesArray = rawCategories.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

        const formData = {
            title: document.getElementById('edit-title').value.trim(),
            desc: document.getElementById('edit-desc').value.trim(),
            location: document.getElementById('edit-location').value.trim(),
            price: parseInt(document.getElementById('edit-price').value),
            rooms: document.getElementById('edit-rooms').value.trim(),
            baths: document.getElementById('edit-baths').value.trim(),
            amenities: document.getElementById('edit-amenities').value.trim(),
            categories: categoriesArray,
            category: categoriesArray[0] || '',
            images: finalImages,
            image: finalImages[0] || ''
        };

        if (currentTab === 'properties') {
            formData.type = document.getElementById('edit-type').value;
        }

        if (editingId) {
            // Update
            const existing = allItems.find(i => String(i.id) === String(editingId)) || {};
            const item = { ...existing, ...formData, id: editingId };
            if (currentTab === 'airbnbs') await JiraniData.updateAirbnb(item);
            else await JiraniData.updateProperty(item);
        } else {
            // Create
            const newItem = {
                id: `${currentTab === 'airbnbs' ? 'airbnb' : 'property'}_${Date.now()}`,
                ...formData,
                createdAt: Date.now(),
                timestamp: Date.now(),
                rating: 'New'
            };
            if (currentTab === 'airbnbs') await JiraniData.addAirbnb(newItem);
            else await JiraniData.addProperty(newItem);
        }

        try {
            localStorage.removeItem('jirani_airbnbs');
            localStorage.removeItem('jirani_properties');
        } catch (e) {}

        await loadData(currentTab);
        closeModal();
    } catch (err) {
        alert('Error saving listing: ' + err.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Delete item
async function deleteItem(id) {
    if (!confirm('Are you sure you want to permanently delete this listing?')) return;

    try {
        if (currentTab === 'airbnbs') {
            await JiraniData.deleteAirbnb(id);
        } else {
            await JiraniData.deleteProperty(id);
        }
        await loadData(currentTab);
    } catch (e) {
        alert('Error deleting listing: ' + e.message);
    }
}

// Setup Event Listeners & Drag/Drop
function setupEventListeners() {
    // Menu Toggle
    document.getElementById('menu-toggle')?.addEventListener('click', () => {
        document.querySelector('.sidebar')?.classList.toggle('active');
        document.querySelector('.sidebar-overlay')?.classList.toggle('active');
    });

    // Close Sidebar on Overlay Click
    document.querySelector('.sidebar-overlay')?.addEventListener('click', () => {
        document.querySelector('.sidebar')?.classList.remove('active');
        document.querySelector('.sidebar-overlay')?.classList.remove('active');
    });

    // Search Input
    document.getElementById('search-input')?.addEventListener('input', (e) => {
        handleSearch(e.target.value);
    });

    // Live Price Helper
    document.getElementById('edit-price')?.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        const helper = document.getElementById('price-preview-helper');
        if (helper) {
            helper.textContent = !isNaN(val) && val > 0 
                ? `Preview: KES ${val.toLocaleString()} / night` 
                : 'Preview: KES 0 / night';
        }
    });

    // Form Submit
    document.getElementById('edit-form')?.addEventListener('submit', handleFormSubmit);

    // Image Input via Browser File Dialog
    const imageInput = document.getElementById('image-input');
    if (imageInput) {
        imageInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    editingImages.push(ev.target.result);
                    renderImagePreview();
                };
                reader.readAsDataURL(file);
            });
            e.target.value = '';
        });
    }

    // Drag & Drop Handling on Dropzone
    const dropZone = document.getElementById('drop-zone');
    if (dropZone) {
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.remove('dragover');
            });
        });

        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = Array.from(dt.files).filter(f => f.type.startsWith('image/'));
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    editingImages.push(ev.target.result);
                    renderImagePreview();
                };
                reader.readAsDataURL(file);
            });
        });
    }

    // Enter Key on Image URL Input
    document.getElementById('image-url-input')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addImageFromUrl();
        }
    });

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.clear();
        if (window.auth) window.auth.signOut();
        window.location.href = '../';
    });
}
