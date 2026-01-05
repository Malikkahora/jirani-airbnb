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
            renderAirbnbs(cachedAirbnbs);
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
        renderAirbnbs(freshAirbnbs);
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
                const url = `listing-details.html?id=${item.id}&type=${pageType}`;
                window.location.href = url;
            };

            let images = item.images || (item.image ? [item.image] : []);
            let imageHtml = '';

            if (images.length > 0) {
                // optimizeCloudinaryUrl with width 400 for cards
                const optimizedUrl = optimizeCloudinaryUrl(images[0], 400);
                imageHtml = `<img src="${optimizedUrl}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">`;
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
