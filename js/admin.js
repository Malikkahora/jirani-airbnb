/**
 * Jirani Admin Dashboard Logic
 * Handles UI interactions, Data rendering, and State management.
 */

// State
let currentTab = 'airbnbs';
let allItems = []; // Combined list or current tab list
let editingId = null;
let editingImages = [];

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

// Navigation
function switchTab(tab) {
    currentTab = tab;

    // Update Sidebar UI
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`nav-${tab}`).classList.add('active');

    // Update Page Title
    document.getElementById('page-title').textContent = tab === 'airbnbs' ? 'Manage Airbnbs' : 'Manage Properties';

    // Show/Hide Type column for properties
    const typeHeader = document.getElementById('th-type');
    if (tab === 'properties') typeHeader.style.display = 'table-cell';
    else typeHeader.style.display = 'none';

    loadData(tab);
}

// Data Loading
async function loadData(tab) {
    const loader = document.getElementById('table-body');
    loader.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading...</td></tr>';

    try {
        if (tab === 'airbnbs') {
            allItems = await JiraniData.getAirbnbs();
        } else {
            allItems = await JiraniData.getProperties();
        }
        renderTable(allItems);
    } catch (e) {
        console.error("Load failed", e);
        loader.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Failed to load data.</td></tr>';
    }
}

// Rendering
function renderTable(items) {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No listings found.</td></tr>';
        return;
    }

    items.forEach(item => {
        const tr = document.createElement('tr');

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
            displayImg = `<div class="listing-img" style="background:#ddd"></div>`;
        }

        const typeCell = currentTab === 'properties' ? `<td><span class="badge badge-info">${item.type || 'N/A'}</span></td>` : '';

        tr.innerHTML = `
            <td>${displayImg}</td>
            <td>
                <div style="font-weight:600;">${item.title}</div>
                <div style="font-size:0.8rem; color:#888;">${item.id}</div>
            </td>
            <td>${item.location}</td>
            <td>TES ${item.price ? item.price.toLocaleString() : '0'}</td>
            ${typeCell}
            <td>
                <button class="btn btn-primary" style="padding:4px 8px; font-size:0.8rem;" onclick="openEditModal('${item.id}')">Edit</button>
                <button class="btn btn-danger" style="padding:4px 8px; font-size:0.8rem;" onclick="deleteItem('${item.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Search
function handleSearch(query) {
    const lower = query.toLowerCase();
    const filtered = allItems.filter(item =>
        item.title.toLowerCase().includes(lower) ||
        item.location.toLowerCase().includes(lower) ||
        (item.id && item.id.toLowerCase().includes(lower))
    );
    renderTable(filtered);
}

// Modal Logic
async function openEditModal(id = null) {
    const modal = document.querySelector('.modal-overlay');
    const form = document.getElementById('edit-form');

    // Reset state
    form.reset();
    editingImages = [];
    document.getElementById('upload-preview').innerHTML = '';

    if (id) {
        // Edit Mode
        editingId = id;
        document.getElementById('modal-title').textContent = 'Edit Listing';

        const item = allItems.find(i => i.id === id);
        if (item) {
            document.getElementById('edit-title').value = item.title;
            document.getElementById('edit-desc').value = item.desc || '';
            document.getElementById('edit-location').value = item.location;
            document.getElementById('edit-price').value = item.price;
            document.getElementById('edit-rooms').value = item.rooms || item.beds || '';
            document.getElementById('edit-baths').value = item.baths || '';
            document.getElementById('edit-amenities').value = item.amenities || '';

            // Type for properties
            const typeContainer = document.getElementById('type-group');
            if (currentTab === 'properties') {
                typeContainer.style.display = 'block';
                document.getElementById('edit-type').value = item.type || 'rent';
            } else {
                typeContainer.style.display = 'none';
            }

            // Images
            editingImages = item.images || (item.image ? [item.image] : []);
            renderImagePreview();
        }
    } else {
        // Create Mode
        editingId = null;
        document.getElementById('modal-title').textContent = `Add New ${currentTab === 'airbnbs' ? 'Airbnb' : 'Property'}`;
        const typeContainer = document.getElementById('type-group');
        typeContainer.style.display = currentTab === 'properties' ? 'block' : 'none';
    }

    modal.classList.add('active');
}

function closeModal() {
    document.querySelector('.modal-overlay').classList.remove('active');
}

// Image Handling
function renderImagePreview() {
    const container = document.getElementById('upload-preview');
    container.innerHTML = '';

    editingImages.forEach((src, index) => {
        const div = document.createElement('div');
        div.className = 'upload-item';
        div.innerHTML = `
            <img src="${src}">
            <button type="button" class="upload-remove" onclick="removeImage(${index})">&times;</button>
        `;
        container.appendChild(div);
    });
}

function removeImage(index) {
    editingImages.splice(index, 1);
    renderImagePreview();
}

// CRUD Operations
async function handleFormSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Saving...';
    btn.disabled = true;

    try {
        // Upload new images
        const finalImages = [];
        for (const img of editingImages) {
            if (img.startsWith('data:')) {
                // It's a base64, needs upload
                const url = await JiraniData.uploadImage(img);
                finalImages.push(url);
            } else {
                finalImages.push(img);
            }
        }

        const formData = {
            title: document.getElementById('edit-title').value,
            desc: document.getElementById('edit-desc').value,
            location: document.getElementById('edit-location').value,
            price: parseInt(document.getElementById('edit-price').value),
            rooms: document.getElementById('edit-rooms').value,
            baths: document.getElementById('edit-baths').value,
            amenities: document.getElementById('edit-amenities').value,
            images: finalImages,
            image: finalImages[0] || ''
        };

        if (currentTab === 'properties') {
            formData.type = document.getElementById('edit-type').value;
        }

        if (editingId) {
            // Update
            const item = { ...allItems.find(i => i.id === editingId), ...formData };
            if (currentTab === 'airbnbs') await JiraniData.updateAirbnb(item);
            else await JiraniData.updateProperty(item);
        } else {
            // Create
            const newItem = {
                id: `${currentTab === 'airbnbs' ? 'airbnb' : 'property'}_${Date.now()}`,
                ...formData,
                rating: 'New'
            };
            if (currentTab === 'airbnbs') await JiraniData.addAirbnb(newItem);
            else await JiraniData.addProperty(newItem);
        }

        await loadData(currentTab);
        closeModal();
    } catch (err) {
        alert('Error saving: ' + err.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

async function deleteItem(id) {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    try {
        if (currentTab === 'airbnbs') {
            await JiraniData.deleteAirbnb(id);
        } else {
            await JiraniData.deleteProperty(id);
        }
        await loadData(currentTab);
    } catch (e) {
        alert('Error deleting: ' + e.message);
    }
}

// Event Listeners
function setupEventListeners() {
    // Menu Toggle
    document.getElementById('menu-toggle').addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('active');
        document.querySelector('.sidebar-overlay').classList.toggle('active');
    });

    // Close Sidebar on Overlay Click
    document.querySelector('.sidebar-overlay').addEventListener('click', () => {
        document.querySelector('.sidebar').classList.remove('active');
        document.querySelector('.sidebar-overlay').classList.remove('active');
    });

    // Close Sidebar on Nav Item Click (Mobile UX)
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                document.querySelector('.sidebar').classList.remove('active');
                document.querySelector('.sidebar-overlay').classList.remove('active');
            }
        });
    });

    // Search
    document.getElementById('search-input').addEventListener('input', (e) => {
        handleSearch(e.target.value);
    });

    // Form Submit
    document.getElementById('edit-form').addEventListener('submit', handleFormSubmit);

    // Image Input
    document.getElementById('image-input').addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                editingImages.push(ev.target.result); // Push base64
                renderImagePreview();
            };
            reader.readAsDataURL(file);
        });
        e.target.value = ''; // Reset
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.clear();
        if (window.auth) window.auth.signOut();
        window.location.href = '../';
    });
}
