// Theme Logic
function initTheme() {
    const savedTheme = localStorage.getItem('jirani_theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
}
initTheme(); // Run immediately

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('jirani_theme', isDark ? 'dark' : 'light');
    updateThemeIcon(isDark);
}

function updateThemeIcon(isDark) {
    const svgs = {
        moon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
        sun: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>'
    };

    const smallSvgs = {
        moon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
        sun: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>'
    };

    // Update all theme toggle buttons (class based)
    const buttons = document.querySelectorAll('.theme-toggle-btn-all');
    buttons.forEach(btn => {
        const isSmall = btn.classList.contains('small-icon');
        btn.innerHTML = isDark ? (isSmall ? smallSvgs.sun : svgs.sun) : (isSmall ? smallSvgs.moon : svgs.moon);
    });

    // Update Dropdown container if exists (Legacy ID support)
    const container = document.getElementById('theme-icon-container');
    if (container) {
        container.innerHTML = isDark ? smallSvgs.sun : smallSvgs.moon;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Jirani Airbnb loaded');

    // Ensure icon is correct on load
    const isDark = document.body.classList.contains('dark-mode');
    updateThemeIcon(isDark);

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

    const isAirbnbPage = document.getElementById('airbnb-grid') !== null;
    const isPropertyPage = document.getElementById('property-grid') !== null;

    // Show Loading State Immediately (Pre-Init)
    if (isAirbnbPage) {
        const cachedAirbnbs = JiraniData.getAirbnbsCached();
        if (cachedAirbnbs.length > 0) {
            console.log("Rendering Airbnbs from cache (Pre-Init)");
            const urlParams = new URLSearchParams(window.location.search);
            const activeCat = urlParams.get('category') || 'all';
            updateCategoryCounts(cachedAirbnbs);
            if (typeof renderCategorySliders === 'function') {
                renderCategorySliders(cachedAirbnbs, 'all');
            }
            if (activeCat && activeCat !== 'all' && typeof window.filterByCategory === 'function') {
                const chip = document.querySelector(`[data-category="${activeCat}"]`);
                window.filterByCategory(activeCat, chip, false);
            } else {
                renderAirbnbs(cachedAirbnbs);
            }
        } else {
            renderLoadingState('airbnb-grid');
        }
    } else if (isPropertyPage) {
        const cachedProperties = JiraniData.getPropertiesCached();
        if (cachedProperties.length > 0) {
            console.log("Rendering Properties from cache (Pre-Init)");
            renderProperties(cachedProperties);
        } else {
            renderLoadingState('property-grid');
        }
    }

    // Initialize Data (Firebase/Sync)
    try {
        await JiraniData.init();
    } catch (e) {
        console.error("Failed to initialize JiraniData:", e);
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


    // Render Fresh Data
    if (isAirbnbPage) {
        const freshAirbnbs = await JiraniData.getAirbnbs();
        console.log("Rendering fresh Airbnbs");
        const urlParams = new URLSearchParams(window.location.search);
        const activeCat = urlParams.get('category') || (document.querySelector('.category-chip.active') ? document.querySelector('.category-chip.active').getAttribute('data-category') : 'all');
        updateCategoryCounts(freshAirbnbs);
        if (typeof renderCategorySliders === 'function') {
            renderCategorySliders(freshAirbnbs, 'all');
        }
        if (activeCat && activeCat !== 'all' && typeof window.filterByCategory === 'function') {
            const chip = document.querySelector(`[data-category="${activeCat}"]`);
            window.filterByCategory(activeCat, chip, false);
        } else {
            renderAirbnbs(freshAirbnbs);
        }
    } else if (isPropertyPage) {
        const freshProperties = await JiraniData.getProperties();
        console.log("Rendering fresh Properties");
        renderProperties(freshProperties);
    }


    // Search Handler
    const searchForm = document.querySelector('.search-form');

    // Make handleSearch globally available for URL param logic
    window.handleSearch = handleSearch;

    if (searchForm) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleSearch(isAirbnbPage ? 'airbnb' : 'property');
            // Minify search on mobile after submitting
            if (window.innerWidth <= 768 && typeof toggleMobileSearch === 'function') {
                toggleMobileSearch(false);
            }
        });

        // Check for URL parameters on load to trigger auto-search
        const urlParams = new URLSearchParams(window.location.search);
        const locationParam = urlParams.get('location');
        if (locationParam) {
            const locationInput = document.getElementById('location');
            if (locationInput) {
                locationInput.value = locationParam;
                // Small delay to ensure data is loaded before filtering
                setTimeout(() => {
                    handleSearch(isAirbnbPage ? 'airbnb' : 'property');
                }, 500);
            }
        }
    }

    async function handleSearch(type) {
        const locationInput = document.getElementById('location');
        const budgetInput = document.getElementById('budget'); // New budget dropdown
        const budgetQuery = budgetInput ? budgetInput.value : '';

        const priceInput = document.getElementById('price');
        const typeInput = document.getElementById('type');
        const roomsInput = document.getElementById('rooms');

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

            // 1. Check direct Price Input (Properties page usually)
            if (!isNaN(priceQuery) && priceQuery > 0) {
                priceMatch = item.price <= priceQuery;
            }
            // 2. Check Budget Dropdown (Airbnb page)
            else if (budgetQuery) {
                const [min, max] = budgetQuery.split('-').map(Number);
                if (max) {
                    // Range: min - max
                    priceMatch = item.price >= min && item.price <= max;
                } else {
                    // Range: min+ (if logic changes, but here we cover large number in max)
                    // Our values are "0-3000", "10000-1000000" etc so split works
                    priceMatch = item.price >= min && item.price <= max;
                }
            }

            // Type Match
            let typeMatch = true;
            if (type === 'property' && typeQuery) {
                typeMatch = item.type === typeQuery;
            }

            // Room Match (Beds)
            let roomMatch = true;
            if (roomsQuery) {
                // If item has explicit rooms/beds data
                if (item.rooms || item.beds) {
                    // Fuzzy match or extract number
                    const beds = String(item.rooms || item.beds).toLowerCase();
                    roomMatch = beds.includes(roomsQuery);
                } else {
                    // Fallback to text matching
                    if (roomsQuery === 'studio') {
                        roomMatch = item.title.toLowerCase().includes('studio') || item.desc.toLowerCase().includes('studio');
                    } else {
                        const r = roomsQuery; // e.g. "1", "2"
                        const content = (item.title + ' ' + item.desc).toLowerCase();
                        roomMatch = content.includes(`${r} bedroom`) || content.includes(`${r}-bedroom`) || content.includes(`${r} bd`) || content.includes(`${r} br`) || content.includes(`${r} room`);
                    }
                }
            }

            // Baths Match
            let bathsMatch = true;
            const bathsInput = document.getElementById('baths');
            const bathsQuery = bathsInput ? bathsInput.value.toLowerCase() : '';
            if (bathsQuery) {
                if (item.baths) {
                    bathsMatch = String(item.baths).includes(bathsQuery);
                } else {
                    // Fallback
                    const b = bathsQuery;
                    const content = (item.title + ' ' + item.desc).toLowerCase();
                    bathsMatch = content.includes(`${b} bath`) || content.includes(`${b}-bath`) || content.includes(`${b} bathroom`);
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

            return textMatch && priceMatch && typeMatch && roomMatch && bathsMatch && amenitiesMatch;
        });

        if (type === 'airbnb') {
            renderAirbnbs(filtered);
        } else {
            renderProperties(filtered);
        }

        // Scroll to results
        const resultsSection = document.getElementById('properties');
        if (resultsSection) {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

// Helper to optimize Cloudinary URLs
function optimizeCloudinaryUrl(url, width) {
    if (!url || typeof url !== 'string') return url;
    // Check if it's a Cloudinary URL and has /upload/
    if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
        // Insert transformations: resize, auto format, auto quality
        return url.replace('/upload/', `/upload/w_${width},f_auto,q_auto/`);
    }
    return url;
}

// Render Loading State (Skeleton)
function renderLoadingState(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    container.style.display = 'block';

    // Create a dummy section
    const section = document.createElement('section');
    section.className = 'location-section';
    section.style.marginBottom = '50px';

    // Dummy Header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '20px';
    header.style.padding = '0 10px';

    const title = document.createElement('div');
    title.className = 'skeleton-box skeleton-text';
    title.style.width = '200px';
    title.style.height = '1.5rem';

    header.appendChild(title);
    section.appendChild(header);

    // Dummy Scroll Container
    const scrollContainer = document.createElement('div');
    scrollContainer.className = 'horizontal-scroll';
    scrollContainer.style.display = 'flex';
    scrollContainer.style.gap = '12px';
    scrollContainer.style.overflowX = 'hidden'; // Hide scrollbar for skeleton
    scrollContainer.style.padding = '10px';

    // Create 4 dummy cards
    for (let i = 0; i < 4; i++) {
        const card = document.createElement('div');
        card.className = 'skeleton-card';
        card.innerHTML = `
            <div class="skeleton-box skeleton-image"></div>
            <div class="skeleton-box skeleton-title"></div>
            <div class="skeleton-box skeleton-desc"></div>
            <div class="skeleton-box skeleton-text skeleton-meta"></div>
            <div class="skeleton-box skeleton-text" style="width: 40%"></div>
        `;
        scrollContainer.appendChild(card);
    }

    section.appendChild(scrollContainer);
    container.appendChild(section);
}


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
            // Removed inline widths to allow CSS control
            article.style.flexShrink = '0';
            article.style.scrollSnapAlign = 'start';
            article.onclick = () => {
                const url = `/listing-details/?id=${item.id}&type=${pageType}`;
                window.location.href = url;
            };

            let images = item.images || (item.image ? [item.image] : []);
            let imageHtml = '';

            if (images.length > 0) {
                // optimizeCloudinaryUrl with width 400 for cards
                const optimizedUrl = optimizeCloudinaryUrl(images[0], 400);
                imageHtml = `<img src="${optimizedUrl}" loading="lazy" onerror="this.onerror=null;this.src='/images/logo.png';this.style.objectFit='contain';this.style.padding='20px';this.style.backgroundColor='#f8f9fa';" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">`;
            } else {
                imageHtml = `<div class="property-card__image-placeholder" style="background-color: ${item.imageColor || '#ddd'}; height: 100%; width: 100%; border-radius: 12px;"></div>`;
            }

            article.innerHTML = `
                <div class="property-card__image-wrapper">
                    ${imageHtml}
                    ${pageType === 'property' ?
                    `<div style="position: absolute; top: 10px; left: 10px; background: ${item.type === 'sale' ? 'rgba(45, 96, 255, 0.88)' : 'rgba(0, 200, 83, 0.88)'}; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.4); color: white; padding: 4px 10px; border-radius: 8px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">${item.type === 'sale' ? 'For Sale' : 'For Rent'}</div>`
                    : `<div style="position: absolute; top: 10px; left: 10px; background: rgba(255, 90, 95, 0.88); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.4); color: white; padding: 4px 10px; border-radius: 8px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 10px rgba(255, 90, 95, 0.25);">Airbnb</div>`}
                    <button class="favorite-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite(event, ${item.id})">
                        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" focusable="false"><path d="M16 28c-7-4.73-14-10-14-17a6.98 6.98 0 0 1 7-7c1.8 0 3.58.68 4.95 2.05L16 8.1l2.05-2.05a6.98 6.98 0 0 1 9.9 0 6.98 6.98 0 0 1 0 9.9L16 28z"></path></svg>
                    </button>
                </div>
                <div class="property-card__content">
                    <div class="property-card__header">
                        <h3 class="property-card__title" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title}</h3>
                    </div>
                    
                    <div class="property-card__stats">
                        <div class="card-stat">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block;">
                                <path d="M2 4v16"></path><path d="M2 8h18a2 2 0 0 1 2 2v10"></path><path d="M2 17h20"></path><path d="M6 8v9"></path>
                            </svg>
                            <span>${item.rooms || item.beds || 0}</span>
                        </div>
                        <div class="card-stat">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block;">
                                <path d="M7 19v2"></path><path d="M17 19v2"></path><path d="M2 12h20"></path><path d="M2 12v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5"></path><path d="M4 12V9a2 2 0 0 1 2-2h2"></path>
                            </svg>
                            <span>${item.baths || 1}</span>
                        </div>
                        ${pageType === 'property' ? `
                        <div class="card-stat">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                            <span>${item.sqft || 0}</span>
                        </div>
                        ` : ''}
                    </div>

                    <p class="property-card__price">
                        <strong style="color: ${pageType === 'property' ? '#2d60ff' : '#FFB300'};">KES ${item.price.toLocaleString()}</strong> 
                        ${pageType === 'airbnb' ? 'night' : (item.priceLabel || '')}
                    </p>
                    <p style="font-size:0.8rem; color:#777; margin-top:4px;">${item.amenities ? item.amenities.split(',').slice(0, 2).join(', ') + '...' : ''}</p>
                </div>
            `;
            scrollContainer.appendChild(article);
        });

        const wrapper = document.createElement('div');
        wrapper.className = 'scroll-wrapper';

        // Prev Button
        const btnPrev = document.createElement('div');
        btnPrev.className = 'scroll-nav-btn prev';
        btnPrev.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>';
        btnPrev.onclick = () => {
            scrollContainer.scrollBy({ left: -300, behavior: 'smooth' });
        };
        wrapper.appendChild(btnPrev);

        wrapper.appendChild(scrollContainer);

        // Next Button
        const btnNext = document.createElement('div');
        btnNext.className = 'scroll-nav-btn next';
        btnNext.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>';
        btnNext.onclick = () => {
            scrollContainer.scrollBy({ left: 300, behavior: 'smooth' });
        };
        wrapper.appendChild(btnNext);

        section.appendChild(wrapper);
        container.appendChild(section);

    });
}

// Helper to parse and check explicit category tags from admin form
const getItemCategories = (item) => {
    if (!item) return [];
    if (Array.isArray(item.categories) && item.categories.length > 0) {
        return item.categories.map(c => String(c).toLowerCase().trim()).filter(Boolean);
    }
    if (typeof item.category === 'string' && item.category.trim()) {
        return item.category.split(',').map(c => c.toLowerCase().trim()).filter(Boolean);
    }
    if (typeof item.categories === 'string' && item.categories.trim()) {
        return item.categories.split(',').map(c => c.toLowerCase().trim()).filter(Boolean);
    }
    return [];
};

const hasExplicitCat = (item, catId) => {
    const cats = getItemCategories(item);
    return cats.includes(catId.toLowerCase());
};

const hasAnyExplicitCat = (item) => {
    return getItemCategories(item).length > 0;
};

// ============================================
// CATEGORY CONFIGURATION FOR AIRBNBS
// ============================================
const CATEGORY_CONFIG = [
    {
        id: 'romantic',
        title: 'Romantic Stays',
        tagline: 'HANDPICKED FOR COUPLES & COZY GETAWAYS',
        subtitle: 'Intimate escapes with ambient lighting, cozy interiors and serene vibes',
        icon: '💖',
        badge: 'Romantic',
        filter: (item) => {
            // Strictly honor admin explicit category tags if assigned!
            if (hasAnyExplicitCat(item)) {
                return hasExplicitCat(item, 'romantic');
            }
            // Fallback heuristic ONLY for unassigned legacy listings without admin tags
            const text = `${item.title} ${item.desc || ''} ${item.amenities || ''}`.toLowerCase();
            const keywords = ['romantic', 'couple', 'honeymoon', 'cozy', 'intimate', 'retreat', 'getaway', 'private', 'quiet', 'serene', 'view', 'balcony', 'jacuzzi'];
            const rooms = parseInt(item.rooms) || 1;
            return keywords.some(k => text.includes(k)) || rooms === 1 || text.includes('studio') || text.includes('1 bedroom');
        }
    },
    {
        id: 'family',
        title: 'Family Stays',
        tagline: 'SPACIOUS & WELCOMING FOR THE WHOLE FAMILY',
        subtitle: 'Multi-bedroom homes with room to play, full kitchens, and family comforts',
        icon: '👨‍👩‍👧',
        badge: 'Family',
        filter: (item) => {
            // Strictly honor admin explicit category tags if assigned!
            if (hasAnyExplicitCat(item)) {
                return hasExplicitCat(item, 'family');
            }
            // Fallback heuristic ONLY for unassigned legacy listings without admin tags
            const text = `${item.title} ${item.desc || ''} ${item.amenities || ''}`.toLowerCase();
            const keywords = ['family', 'kids', 'children', 'spacious', 'large', 'group', 'master', 'garden', 'compound', 'playground'];
            const rooms = parseInt(item.rooms) || 0;
            return keywords.some(k => text.includes(k)) || rooms >= 2 || text.includes('2 bedroom') || text.includes('3 bedroom') || text.includes('4 bedroom');
        }
    },
    {
        id: 'business',
        title: 'Business Stays',
        tagline: 'WORK-READY WITH HIGH-SPEED CONNECTIVITY',
        subtitle: 'Dedicated workstations, ultra-fast Wi-Fi, and prime central business locations',
        icon: '💼',
        badge: 'Business',
        filter: (item) => {
            // Strictly honor admin explicit category tags if assigned!
            if (hasAnyExplicitCat(item)) {
                return hasExplicitCat(item, 'business');
            }
            // Fallback heuristic ONLY for unassigned legacy listings without admin tags
            const text = `${item.title} ${item.desc || ''} ${item.amenities || ''}`.toLowerCase();
            const keywords = ['business', 'work', 'wifi', 'desk', 'office', 'corporate', 'central', 'executive', 'workstation', 'laptop'];
            const hasWifi = item.amenities && item.amenities.toLowerCase().includes('wifi');
            const primeLocs = ['westlands', 'kilimani', 'upperhill', 'cbd', 'kileleshwa'];
            const inPrimeLoc = primeLocs.some(loc => (item.location || '').toLowerCase().includes(loc));
            return keywords.some(k => text.includes(k)) || hasWifi || inPrimeLoc;
        }
    },
    {
        id: 'luxury',
        title: 'Luxury Stays',
        tagline: 'PREMIUM COMFORTS & ELEVATED LIVING',
        subtitle: 'High-end penthouses, modern aesthetics, swimming pools & premier views',
        icon: '✨',
        badge: 'Luxury',
        filter: (item) => {
            // Strictly honor admin explicit category tags if assigned!
            if (hasAnyExplicitCat(item)) {
                return hasExplicitCat(item, 'luxury');
            }
            // Fallback heuristic ONLY for unassigned legacy listings without admin tags
            const text = `${item.title} ${item.desc || ''} ${item.amenities || ''}`.toLowerCase();
            const keywords = ['luxury', 'premium', 'penthouse', 'rooftop', 'executive', 'suite', 'villa', 'pool', 'modern', 'elegance', 'plush', 'jacuzzi'];
            return keywords.some(k => text.includes(k)) || (item.price && item.price >= 6500);
        }
    },
    {
        id: 'budget',
        title: 'Budget Stays',
        tagline: 'TOP VALUE UNDER KES 4,500 / NIGHT',
        subtitle: 'Quality stays and great comfort without breaking your budget',
        icon: '💰',
        badge: 'Budget Friendly',
        filter: (item) => {
            // Strictly honor admin explicit category tags if assigned!
            if (hasAnyExplicitCat(item)) {
                return hasExplicitCat(item, 'budget');
            }
            // Fallback heuristic ONLY for unassigned legacy listings without admin tags
            return item.price && item.price <= 4500;
        }
    }
];

window.CATEGORY_CONFIG = CATEGORY_CONFIG;

function renderAirbnbGallery(containerId, items, activeCategory = 'all') {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: rgba(0,0,0,0.02); border-radius: 20px;">
                <div style="font-size: 2.5rem; margin-bottom: 12px;">🔍</div>
                <h3 style="font-size: 1.4rem; font-weight: 800; margin-bottom: 8px;">No stays found</h3>
                <p style="color: #666; margin-bottom: 20px;">Try adjusting your search criteria or explore another neighborhood.</p>
            </div>
        `;
        return;
    }

    const favorites = (typeof getFavorites === 'function') ? getFavorites().map(String) : [];
    const categoryObj = (typeof CATEGORY_CONFIG !== 'undefined') ? CATEGORY_CONFIG.find(c => c.id === activeCategory) : null;
    const badgeLabel = categoryObj ? `${categoryObj.icon} ${categoryObj.badge}` : 'Airbnb Verified';

    let html = '';
    items.forEach(item => {
        const isFav = favorites.includes(String(item.id));
        const images = item.images || (item.image ? [item.image] : []);
        const imageUrl = images.length > 0 ? optimizeCloudinaryUrl(images[0], 500) : '/images/home-bg.jpg';

        html += `
            <article class="gallery-card" onclick="window.location.href='/listing-details/?id=${item.id}&type=airbnb'">
                <div class="gallery-card__img-wrap">
                    <img src="${imageUrl}" alt="${item.title}" loading="lazy" class="gallery-card__img" onerror="this.onerror=null;this.src='/images/logo.png';this.style.objectFit='contain';this.style.padding='20px';this.style.backgroundColor='#f8f9fa';">
                    <div class="gallery-card__badge">${badgeLabel}</div>
                    <button type="button" class="favorite-btn ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite(event, '${item.id}');" aria-label="Save to favorites">
                        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M16 28c-7-4.73-14-10-14-17a6.98 6.98 0 0 1 7-7c1.8 0 3.58.68 4.95 2.05L16 8.1l2.05-2.05a6.98 6.98 0 0 1 9.9 0 6.98 6.98 0 0 1 0 9.9L16 28z"></path></svg>
                    </button>
                </div>
                <div class="gallery-card__body">
                    <div class="gallery-card__loc">${item.location || 'Nairobi'}</div>
                    <h3 class="gallery-card__title" title="${item.title}">${item.title}</h3>
                    <div class="gallery-card__stats">
                        <span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg> ${item.rooms || item.beds || 1} Bed</span>
                        <span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 19v2"/><path d="M17 19v2"/><path d="M2 12h20"/><path d="M2 12v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5"/><path d="M4 12V9a2 2 0 0 1 2-2h2"/></svg> ${item.baths || 1} Bath</span>
                        ${item.amenities && item.amenities.toLowerCase().includes('wifi') ? `<span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg> Wifi</span>` : ''}
                    </div>
                    <div class="gallery-card__price-row">
                        <div class="gallery-card__price">
                            <strong>KES ${item.price ? item.price.toLocaleString() : '3,000'}</strong> <span class="night-label">/ night</span>
                        </div>
                        <span class="gallery-card__action">View Details &rarr;</span>
                    </div>
                </div>
            </article>
        `;
    });

    container.innerHTML = html;
}

function renderAirbnbs(items, activeCategory = 'all') {
    const isGrid = document.querySelector('#airbnb-grid.airbnb-gallery-grid');
    if (isGrid) {
        renderAirbnbGallery('airbnb-grid', items, activeCategory);
    } else {
        renderGroupedListings('airbnb-grid', items, 'airbnb');
    }
}

function renderProperties(items) {
    renderGroupedListings('property-grid', items, 'property');
}

// Category Options Slider Scroll & Live Counts
window.scrollCategoryOptions = function(direction) {
    const track = document.getElementById('category-options-track');
    if (!track) return;
    const card = track.querySelector('.category-option-card');
    const scrollAmount = card ? (card.offsetWidth + 22) : 340;
    track.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
};

function updateCategoryCounts(items) {
    if (!items || !items.length || typeof CATEGORY_CONFIG === 'undefined') return;
    CATEGORY_CONFIG.forEach(cat => {
        const countEl = document.getElementById(`count-${cat.id}`);
        if (countEl && cat.filter) {
            const count = items.filter(cat.filter).length;
            countEl.textContent = `${count} Stays`;
        }
    });
    const countAll = document.getElementById('count-all');
    if (countAll) {
        countAll.textContent = `${items.length}+ Stays`;
    }
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

// Mobile Search Toggle & Backdrop
window.toggleMobileSearch = function (show = true) {
    const form = document.querySelector('.search-form');
    const toggle = document.querySelector('.search-mobile-toggle');
    let backdrop = document.querySelector('.search-modal-backdrop');

    if (!backdrop && document.body) {
        backdrop = document.createElement('div');
        backdrop.className = 'search-modal-backdrop';
        backdrop.addEventListener('click', () => toggleMobileSearch(false));
        document.body.appendChild(backdrop);
    }

    if (show) {
        if (form) form.classList.add('active');
        if (toggle) toggle.style.display = 'none';
        if (backdrop) backdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        if (form) form.classList.remove('active');
        if (toggle) toggle.style.display = 'flex';
        if (backdrop) backdrop.classList.remove('active');
        document.body.style.overflow = '';
    }
};

// Calculate dynamic hero scroll threshold:
// Triggers only when the hero search bar reaches near the top header,
// rather than disappearing prematurely while the user is still reading the hero.
function getHeroScrollThreshold() {
    const isMobile = window.innerWidth <= 768;
    const heroContent = document.querySelector('.luxury-hero .hero__content');
    if (heroContent) {
        const headerOffset = isMobile ? 65 : 100;
        const searchTop = heroContent.offsetTop + heroContent.offsetHeight;
        return Math.max(isMobile ? 260 : 340, Math.round(searchTop - headerOffset + 20));
    }
    return isMobile ? 280 : 380;
}

// Search Bar & Ratings Scroll Behavior:
// - Desktop: Search bar & ratings ribbon disappear only when reaching header scroll point; reappear when returning to hero.
// - Mobile: Retains search bar in hero. Once scrolled past hero, hides on scroll-down and appears in full on scroll-up.
let lastScrollY = window.scrollY || window.pageYOffset || 0;

window.addEventListener('scroll', () => {
    const scrollPos = Math.max(0, window.scrollY || window.pageYOffset || 0);
    const diff = scrollPos - lastScrollY;
    const isMobile = window.innerWidth <= 768;
    const searchBars = document.querySelectorAll('.search-bar, .luxury-search-bar');
    const heroTrustRibbon = document.querySelector('.hero-trust-ribbon');
    const collapsibleWrap = document.getElementById('hero-search-collapsible-wrap');
    const heroSection = document.querySelector('.luxury-hero');

    // Dynamic threshold: scroll point where search bar actually reaches the top header
    const threshold = getHeroScrollThreshold();
    const returnThreshold = threshold - (isMobile ? 60 : 80);

    // 1. Auto-dismiss mobile search card if open when user scrolled significantly
    const activeForm = document.querySelector('.search-form.active');
    if (activeForm && Math.abs(diff) > 35) {
        if (typeof toggleMobileSearch === 'function') {
            toggleMobileSearch(false);
        }
    }

    if (isMobile) {
        // MOBILE LOGIC:
        if (scrollPos <= returnThreshold) {
            // Inside the hero section: search bar rests in normal inline hero position
            searchBars.forEach(bar => {
                bar.classList.remove('search-card--hidden');
                bar.classList.remove('mobile-scroll-up-active');
            });
            if (heroTrustRibbon) heroTrustRibbon.classList.remove('search-card--hidden');
            if (collapsibleWrap) collapsibleWrap.classList.remove('is-collapsed');
            if (heroSection) heroSection.classList.remove('hero-scrolled-collapsed');
        } else if (scrollPos >= threshold) {
            // Below the hero scroll point on mobile:
            // Hero space stays collapsed so listings occupy top space smoothly
            if (collapsibleWrap) collapsibleWrap.classList.add('is-collapsed');
            if (heroSection) heroSection.classList.add('hero-scrolled-collapsed');
            if (heroTrustRibbon) heroTrustRibbon.classList.add('search-card--hidden');

            if (diff < -6) {
                // SCROLLING UP: Search bar appears in full!
                searchBars.forEach(bar => {
                    bar.classList.remove('search-card--hidden');
                    bar.classList.add('mobile-scroll-up-active');
                });
            } else if (diff > 6) {
                // SCROLLING DOWN: Search bar hides
                searchBars.forEach(bar => {
                    bar.classList.add('search-card--hidden');
                    bar.classList.remove('mobile-scroll-up-active');
                });
            }
        }
    } else {
        // DESKTOP LOGIC:
        if (scrollPos >= threshold) {
            searchBars.forEach(bar => {
                bar.classList.add('search-card--hidden');
                bar.classList.remove('mobile-scroll-up-active');
            });
            if (heroTrustRibbon) heroTrustRibbon.classList.add('search-card--hidden');
            if (collapsibleWrap) collapsibleWrap.classList.add('is-collapsed');
            if (heroSection) heroSection.classList.add('hero-scrolled-collapsed');
        } else if (scrollPos <= returnThreshold) {
            searchBars.forEach(bar => {
                bar.classList.remove('search-card--hidden');
                bar.classList.remove('mobile-scroll-up-active');
            });
            if (heroTrustRibbon) heroTrustRibbon.classList.remove('search-card--hidden');
            if (collapsibleWrap) collapsibleWrap.classList.remove('is-collapsed');
            if (heroSection) heroSection.classList.remove('hero-scrolled-collapsed');
        }
    }

    lastScrollY = scrollPos;
}, { passive: true });

// Window resize listener to cleanly reset mobile-specific classes when transitioning to desktop
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        document.querySelectorAll('.luxury-search-bar').forEach(bar => {
            bar.classList.remove('mobile-scroll-up-active');
        });
    }
});


window.scrollCategorySlider = function (catId, direction) {
    const track = document.getElementById(`cat-track-${catId}`);
    if (!track) return;
    const scrollAmount = Math.max(300, Math.floor(track.clientWidth * 0.75)) * direction;
    track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
};

window.renderCategorySliders = function (items, activeCategory = 'all') {
    const container = document.getElementById('category-sliders-container');
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = '';
        return;
    }

    const favorites = getFavorites().map(String);

    let catsToShow = CATEGORY_CONFIG;
    const isSingleCategory = activeCategory && activeCategory !== 'all';
    if (isSingleCategory) {
        const matched = CATEGORY_CONFIG.find(c => c.id === activeCategory);
        if (matched) {
            catsToShow = [matched];
        }
    }

    let html = '';

    // Active Category Filter Bar
    if (isSingleCategory && catsToShow.length > 0) {
        const currentCat = catsToShow[0];
        let currentItems = items.filter(currentCat.filter);
        if (currentItems.length === 0) currentItems = items.slice(0, 8);
        html += `
        <div class="category-active-bar-wrapper">
            <div class="slider-container">
                <div class="category-active-bar">
                    <div class="active-bar-content">
                        <span class="active-bar-icon">${currentCat.icon}</span>
                        <div class="active-bar-text">
                            <strong>${currentCat.title}</strong>
                            <span>&bull; ${currentItems.length} curated options in Nairobi</span>
                        </div>
                    </div>
                    <button type="button" class="active-bar-reset-btn" onclick="filterByCategory('all', document.querySelector('[data-category=all]'))">
                        &times; Browse All Categories
                    </button>
                </div>
            </div>
        </div>
        `;
    }

    catsToShow.forEach(cat => {
        let catItems = items.filter(cat.filter);
        if (catItems.length === 0) {
            return; // Don't show empty slider tracks with random items
        }

        html += `
        <div class="category-slider-block" id="cat-block-${cat.id}">
            <div class="slider-container">
                <div class="slider-header-flex">
                    <div class="slider-title-group">
                        <div class="slider-tagline">${cat.tagline}</div>
                        <div class="slider-title-row clickable" onclick="window.location.href='gallery.html?category=${cat.id}'" title="Open ${cat.title} Gallery">
                            <span class="slider-icon">${cat.icon}</span>
                            <h2 class="slider-title">${cat.title}</h2>
                            <span class="category-count-badge">${catItems.length} stays</span>
                        </div>
                        <p class="slider-subtitle-text">${cat.subtitle}</p>
                    </div>
                    <div class="slider-header-actions">
                        <button type="button" class="slider-view-all-btn" onclick="window.location.href='gallery.html?category=${cat.id}'" title="Open ${cat.title} Gallery">
                            Open ${cat.title} Gallery (${catItems.length}) &rarr;
                        </button>
                        <div class="slider-nav-arrows">
                            <button type="button" class="slider-arrow-btn prev" onclick="scrollCategorySlider('${cat.id}', -1)" aria-label="Previous ${cat.title}">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                            </button>
                            <button type="button" class="slider-arrow-btn next" onclick="scrollCategorySlider('${cat.id}', 1)" aria-label="Next ${cat.title}">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="slider-track" id="cat-track-${cat.id}">
        `;

        catItems.forEach(item => {
            const isFav = favorites.includes(String(item.id));
            const image = item.images && item.images.length > 0 ? item.images[0] : (item.image || '');
            const optimizedImage = optimizeCloudinaryUrl(image, 400);

            html += `
                <div class="slider-card" onclick="window.location.href='/listing-details/?id=${item.id}&type=airbnb'">
                    <div class="slider-card-img-wrapper">
                        <img src="${optimizedImage}" alt="${item.title}" class="slider-card-img" loading="lazy" onerror="this.onerror=null;this.src='/images/logo.png';this.style.objectFit='contain';this.style.padding='20px';this.style.backgroundColor='#f8f9fa';">
                        <div class="slider-card-badge">${cat.icon} ${cat.badge}</div>
                        <button class="favorite-btn ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite(event, ${item.id});" aria-label="Save to favorites">
                            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M16 28c-7-4.73-14-10-14-17a6.98 6.98 0 0 1 7-7c1.8 0 3.58.68 4.95 2.05L16 8.1l2.05-2.05a6.98 6.98 0 0 1 9.9 0 6.98 6.98 0 0 1 0 9.9L16 28z"></path></svg>
                        </button>
                    </div>
                    <div class="slider-card-info">
                        <div class="slider-card-loc">${item.location || 'Nairobi'}</div>
                        <h3 class="slider-card-title">${item.title}</h3>
                        <div class="slider-card-stats">
                            <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg> ${item.rooms || item.beds || 1} Bed</span>
                            <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 19v2"/><path d="M17 19v2"/><path d="M2 12h20"/><path d="M2 12v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5"/><path d="M4 12V9a2 2 0 0 1 2-2h2"/></svg> ${item.baths || 1} Bath</span>
                        </div>
                        <div class="slider-card-price">KES ${item.price.toLocaleString()} <span class="price-suffix">/ night</span></div>
                    </div>
                </div>
            `;
        });

        // Dedicated "Open Full Gallery" card at the end of every category slider track
        html += `
            <div class="slider-card slider-card--gallery-cta" onclick="window.location.href='gallery.html?category=${cat.id}'" title="Open full ${cat.title} Gallery">
                <div class="gallery-cta-inner">
                    <span class="gallery-cta-icon">${cat.icon}</span>
                    <div class="gallery-cta-badge">${catItems.length}+ STAYS</div>
                    <h4 class="gallery-cta-title">See All ${cat.title}</h4>
                    <p class="gallery-cta-desc">Explore all ${catItems.length} curated stays with neighborhood filters & sorting.</p>
                    <span class="gallery-cta-btn">Open Gallery &rarr;</span>
                </div>
            </div>
        `;

        html += `
                </div>
            </div>
        </div>
        `;
    });

    container.innerHTML = html;
};

// Backward compatibility alias
window.renderFeaturedSlider = function (items) {
    window.renderCategorySliders(items);
};
