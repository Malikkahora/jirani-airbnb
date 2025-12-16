document.addEventListener('DOMContentLoaded', async () => {
    console.log('Jirani Airbnb loaded');
    await JiraniData.init();

    // Sticky header shadow
    const header = document.querySelector('.header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 0) {
                header.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08)';
            } else {
                header.style.boxShadow = 'none';
            }
        });
    }

    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle && header) {
        menuToggle.addEventListener('click', () => {
            header.classList.toggle('nav-open');
            document.body.style.overflow = header.classList.contains('nav-open') ? 'hidden' : '';
        });

        const navLinks = document.querySelectorAll('.nav__link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                header.classList.remove('nav-open');
                document.body.style.overflow = '';
            });
        });
    }

    // Determine current page type
    const isAirbnbPage = document.getElementById('airbnb-grid') !== null;
    const isPropertyPage = document.getElementById('property-grid') !== null;

    // Initial Render
    if (isAirbnbPage) {
        const cachedAirbnbs = JiraniData.getAirbnbsCached();
        if (cachedAirbnbs.length > 0) {
            console.log("Rendering Airbnbs from cache");
            renderAirbnbs(cachedAirbnbs);
        }
        const freshAirbnbs = await JiraniData.getAirbnbs();
        console.log("Rendering fresh Airbnbs");
        renderAirbnbs(freshAirbnbs);
    } else if (isPropertyPage) {
        const cachedProperties = JiraniData.getPropertiesCached();
        if (cachedProperties.length > 0) {
            console.log("Rendering Properties from cache");
            renderProperties(cachedProperties);
        }
        const freshProperties = await JiraniData.getProperties();
        console.log("Rendering fresh Properties");
        renderProperties(freshProperties);
    }

    // Search Handler
    const searchForm = document.querySelector('.search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleSearch(isAirbnbPage ? 'airbnb' : 'property');
        });
    }

    async function handleSearch(type) {
        const locationInput = document.getElementById('location');
        const priceInput = document.getElementById('price');
        const typeInput = document.getElementById('type'); // Property page only
        const roomsInput = document.getElementById('rooms'); // Airbnb page only (new)

        const query = locationInput ? locationInput.value.toLowerCase().trim() : '';
        const priceQuery = priceInput ? parseInt(priceInput.value.replace(/[^0-9]/g, '')) : NaN;
        const typeQuery = typeInput ? typeInput.value.toLowerCase() : '';
        const roomsQuery = roomsInput ? roomsInput.value.toLowerCase() : '';

        const allItems = type === 'airbnb' ? await JiraniData.getAirbnbs() : await JiraniData.getProperties();

        const filtered = allItems.filter(item => {
            // Text Match
            let textMatch = true;
            if (query) {
                const searchStr = `${item.title} ${item.location} ${item.desc} ${item.amenities || ''}`.toLowerCase();
                textMatch = searchStr.includes(query);
            }

            // Price Match
            let priceMatch = true;
            if (!isNaN(priceQuery) && priceQuery > 0) {
                priceMatch = item.price <= priceQuery;
            }

            // Type Match
            let typeMatch = true;
            if (type === 'property' && typeQuery) {
                typeMatch = item.type === typeQuery;
            }

            // Room Match
            let roomMatch = true;
            if (roomsQuery) {
                if (item.rooms) {
                    roomMatch = item.rooms === roomsQuery;
                } else {
                    if (roomsQuery === 'studio') {
                        roomMatch = item.title.toLowerCase().includes('studio') || item.desc.toLowerCase().includes('studio');
                    } else {
                        const r = roomsQuery;
                        const content = (item.title + ' ' + item.desc).toLowerCase();
                        roomMatch = content.includes(`${r} bedroom`) || content.includes(`${r}-bedroom`) || content.includes(`${r} bd`) || content.includes(`${r} br`) || content.includes(`${r} room`);
                    }
                }
            }

            // Amenities Match
            let amenitiesMatch = true;
            const amenitiesQuery = document.getElementById('amenities') ? document.getElementById('amenities').value.toLowerCase().trim() : '';
            if (amenitiesQuery) {
                const itemAmenities = (item.amenities || '').toLowerCase();
                const searchTerms = amenitiesQuery.split(',').map(t => t.trim()).filter(t => t);
                amenitiesMatch = searchTerms.every(term => itemAmenities.includes(term));
            }

            return textMatch && priceMatch && typeMatch && roomMatch && amenitiesMatch;
        });

        if (type === 'airbnb') {
            renderAirbnbs(filtered);
        } else {
            renderProperties(filtered);
        }
    }
});

// Shared helper for carousel button click
window.scrollCarousel = function (id, direction) {
    const container = document.getElementById(id);
    if (container) {
        const scrollAmount = container.clientWidth;
        container.scrollBy({
            left: direction * scrollAmount,
            behavior: 'smooth'
        });
    }
};

// Favorites Logic
function getFavorites() {
    return JSON.parse(localStorage.getItem('jirani_favorites') || '[]');
}

function toggleFavorite(event, id) {
    event.stopPropagation();
    const favs = getFavorites();
    const index = favs.findIndex(f => String(f) === String(id));
    const btn = event.currentTarget;

    if (index === -1) {
        favs.push(id);
        btn.classList.add('active');
    } else {
        favs.splice(index, 1);
        btn.classList.remove('active');
    }
    localStorage.setItem('jirani_favorites', JSON.stringify(favs));
}

let isShowingFavorites = false;

window.toggleFavoritesFilter = async function () {
    const isAirbnb = document.getElementById('airbnb-grid') !== null;
    const items = isAirbnb ? await JiraniData.getAirbnbs() : await JiraniData.getProperties();
    const containerId = isAirbnb ? 'airbnb-grid' : 'property-grid';
    const type = isAirbnb ? 'airbnb' : 'property';
    const favs = getFavorites().map(String);
    const headerBtn = document.querySelector('.header__favorites-btn svg');

    isShowingFavorites = !isShowingFavorites;

    if (!isShowingFavorites) {
        renderGroupedListings(containerId, items, type);
        if (headerBtn) {
            headerBtn.style.fill = 'none';
            headerBtn.style.stroke = 'currentColor';
        }
        return;
    }

    if (headerBtn) {
        headerBtn.style.fill = '#FF385C';
        headerBtn.style.stroke = '#FF385C';
    }

    const filtered = items.filter(item => favs.includes(String(item.id)));

    if (filtered.length === 0) {
        const container = document.getElementById(containerId);
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <h3 style="font-size: 1.5rem; margin-bottom: 10px;">No favorites yet</h3>
                <p style="color: #666; margin-bottom: 20px;">Click the heart icon on any listing to save it here.</p>
                <button class="btn btn--primary" onclick="toggleFavoritesFilter()">Browse Listings</button>
            </div>
        `;
        container.style.display = 'block';
    } else {
        renderGroupedListings(containerId, filtered, type);
    }
};

// Shared Grouped Renderer
function renderGroupedListings(containerId, items, pageType) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const favorites = getFavorites().map(String);

    container.innerHTML = '';
    container.style.display = 'block';

    if (items.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">No results found.</div>';
        return;
    }

    const grouped = items.reduce((acc, item) => {
        const key = item.location ? (item.location.charAt(0).toUpperCase() + item.location.slice(1)) : 'Other';
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});

    const sortedLocations = Object.keys(grouped).sort();

    sortedLocations.forEach(location => {
        const locationItems = grouped[location];

        const section = document.createElement('section');
        section.className = 'location-section';
        section.style.marginBottom = '50px';

        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '20px';
        header.style.padding = '0 10px';

        const title = document.createElement('h2');
        title.className = 'location-header';
        title.innerText = location;

        const count = document.createElement('span');
        count.style.color = '#777';
        count.style.fontSize = '0.9rem';
        count.innerText = `${locationItems.length} ${locationItems.length === 1 ? 'stay' : 'stays'}`;

        header.appendChild(title);
        header.appendChild(count);
        section.appendChild(header);

        const scrollContainer = document.createElement('div');
        scrollContainer.className = 'horizontal-scroll';
        scrollContainer.style.display = 'flex';
        scrollContainer.style.gap = '12px';
        scrollContainer.style.overflowX = 'auto';
        scrollContainer.style.padding = '10px';
        scrollContainer.style.scrollSnapType = 'x mandatory';
        scrollContainer.style.scrollbarWidth = 'none';

        locationItems.forEach(item => {
            const isFav = favorites.includes(String(item.id));
            const article = document.createElement('article');
            article.className = 'property-card';
            article.style.minWidth = '300px';
            article.style.width = '300px';
            article.style.flexShrink = '0';
            article.style.scrollSnapAlign = 'start';
            article.onclick = () => openDetailModal(item.id);

            let images = item.images || (item.image ? [item.image] : []);
            let imageHtml = '';

            if (images.length > 0) {
                imageHtml = `<img src="${images[0]}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">`;
            } else {
                imageHtml = `<div class="property-card__image-placeholder" style="background-color: ${item.imageColor || '#ddd'}; height: 100%; width: 100%; border-radius: 12px;"></div>`;
            }

            article.innerHTML = `
                <div class="property-card__image-wrapper">
                    ${imageHtml}
                    ${pageType === 'property' ?
                    `<div style="position: absolute; top: 10px; left: 10px; background: ${item.type === 'sale' ? '#2d60ff' : '#00C853'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase;">${item.type === 'sale' ? 'For Sale' : 'For Rent'}</div>`
                    : ''}
                    <button class="favorite-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite(event, ${item.id})">
                        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" focusable="false"><path d="M16 28c-7-4.73-14-10-14-17a6.98 6.98 0 0 1 7-7c1.8 0 3.58.68 4.95 2.05L16 8.1l2.05-2.05a6.98 6.98 0 0 1 9.9 0 6.98 6.98 0 0 1 0 9.9L16 28z"></path></svg>
                    </button>
                </div>
                <div class="property-card__content">
                    <div class="property-card__header">
                        <h3 class="property-card__title" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title}</h3>
                    </div>
                    <p class="property-card__desc" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 3em;">${item.desc}</p>
                    <p class="property-card__price">
                        <strong style="color: ${pageType === 'property' ? '#2d60ff' : '#FFB300'};">KES ${item.price.toLocaleString()}</strong> 
                        ${pageType === 'airbnb' ? 'night' : (item.priceLabel || '')}
                    </p>
                    <p style="font-size:0.8rem; color:#777; margin-top:4px;">${item.amenities ? item.amenities.split(',').slice(0, 2).join(', ') + '...' : ''}</p>
                </div>
            `;
            scrollContainer.appendChild(article);
        });

        section.appendChild(scrollContainer);
        container.appendChild(section);
    });
}

function renderAirbnbs(items) {
    renderGroupedListings('airbnb-grid', items, 'airbnb');
}

function renderProperties(items) {
    renderGroupedListings('property-grid', items, 'property');
}

// Profile Dropdown Functionality
document.addEventListener('DOMContentLoaded', () => {
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');

    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!profileDropdown.contains(e.target) && !profileBtn.contains(e.target)) {
                profileDropdown.classList.remove('active');
            }
        });
    }
});

// Multi-Select Logic
function setupMultiSelect(containerId, textId, inputId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const selectBox = container.querySelector('.select-box');
    const checkboxes = container.querySelector('.checkboxes');
    const hiddenInput = document.getElementById(inputId);
    const textSpan = document.getElementById(textId);
    const inputs = checkboxes.querySelectorAll('input[type="checkbox"]');

    selectBox.addEventListener('click', (e) => {
        e.stopPropagation();
        checkboxes.classList.toggle('active');
    });

    inputs.forEach(input => {
        input.addEventListener('change', () => {
            const selected = Array.from(inputs).filter(i => i.checked).map(i => i.value);
            hiddenInput.value = selected.join(',');
            textSpan.textContent = selected.length > 0 ? selected.map(v => v.charAt(0).toUpperCase() + v.slice(1)).join(', ') : 'Select Amenities';
        });
    });

    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            checkboxes.classList.remove('active');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupMultiSelect('amenities-select', 'amenities-text', 'amenities');
    setupMultiSelect('amenities-select-airbnb', 'amenities-text-airbnb', 'amenities');
});
