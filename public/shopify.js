const SHOP_DOMAIN = "3zyhp0-pm.myshopify.com";
const STOREFRONT_TOKEN = "dd4ff066d0d6fdfe138f9d99a4b9b57b";
const SITE_CURRENCY = "USD";
const WISHLIST_STORAGE_KEY = "pixelbloxy_wishlist";

function getWishlistProductIds() {
    try {
        const saved = JSON.parse(localStorage.getItem(WISHLIST_STORAGE_KEY) || "[]");
        return Array.isArray(saved)
            ? [...new Set(saved.filter(id => typeof id === "string"))]
            : [];
    } catch {
        return [];
    }
}

function isWishlistProductSaved(productId) {
    return getWishlistProductIds().includes(productId);
}

function toggleWishlistProduct(productId) {
    if (!productId) return false;
    const saved = getWishlistProductIds();
    const isSaved = saved.includes(productId);
    const updated = isSaved
        ? saved.filter(id => id !== productId)
        : [...saved, productId];

    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("wishlist:updated", { detail: { productIds: updated } }));
    return !isSaved;
}

window.getWishlistProductIds = getWishlistProductIds;
window.isWishlistProductSaved = isWishlistProductSaved;
window.toggleWishlistProduct = toggleWishlistProduct;

function productWishlistButtonMarkup(product) {
    const saved = isWishlistProductSaved(product.id);
    return `
        <button type="button" class="product-wishlist-button${saved ? " is-saved" : ""}" data-wishlist-toggle="${product.id}" aria-label="${saved ? "Remove from wishlist" : "Add to wishlist"}" title="${saved ? "Remove from wishlist" : "Add to wishlist"}">
            <i class="${saved ? "fas" : "far"} fa-heart" aria-hidden="true"></i>
        </button>
    `;
}

window.productWishlistButtonMarkup = productWishlistButtonMarkup;

document.addEventListener("click", event => {
    const button = event.target.closest("[data-wishlist-toggle]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    toggleWishlistProduct(button.dataset.wishlistToggle);
});

window.addEventListener("wishlist:updated", () => {
    document.querySelectorAll("[data-wishlist-toggle]").forEach(button => {
        const saved = isWishlistProductSaved(button.dataset.wishlistToggle);
        button.classList.toggle("is-saved", saved);
        button.setAttribute("aria-label", saved ? "Remove from wishlist" : "Add to wishlist");
        button.title = saved ? "Remove from wishlist" : "Add to wishlist";
        const icon = button.querySelector("i");
        if (icon) icon.className = `${saved ? "fas" : "far"} fa-heart`;
    });
});

async function shopifyRequest(query, variables = {}) {
    const response = await fetch(
        `https://${SHOP_DOMAIN}/api/2025-01/graphql.json`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN
            },
            body: JSON.stringify({ query, variables })
        }
    );

    if (!response.ok) {
        throw new Error(`Shopify request failed (${response.status}).`);
    }

    const payload = await response.json();
    if (payload.errors?.length) {
        throw new Error(payload.errors.map(error => error.message).join(", "));
    }
    if (!payload.data) {
        throw new Error("Shopify returned an invalid response.");
    }

    return payload.data;
}

window.shopifyRequest = shopifyRequest;

function throwOnCartUserErrors(result) {
    if (!result) {
        throw new Error("Shopify did not complete the cart operation.");
    }
    if (result.userErrors?.length) {
        throw new Error(result.userErrors.map(error => error.message).join(", "));
    }
}

const grid = document.getElementById("products-grid");

let PRODUCTS = [];
let COLLECTIONS = [];

let filters = {
    search: "",
    rawSearch: "",
    category: "all"
};

function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name) || "";
}

function updateQueryParam(name, value) {
    const params = new URLSearchParams(window.location.search);
    if (value && value !== "all") {
        params.set(name, value);
    } else {
        params.delete(name);
    }
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState(null, "", newUrl);
}

function getProductPageUrl(product) {
    if (product.handle) {
        return `product.html?handle=${encodeURIComponent(product.handle)}`;
    }
    return `product.html?id=${encodeURIComponent(product.id)}`;
}

const shopifyStoredSearchQuery = localStorage.getItem("searchQuery");
if (shopifyStoredSearchQuery) {
    const trimmedQuery = shopifyStoredSearchQuery.trim();
    filters.search = trimmedQuery.toLowerCase();
    filters.rawSearch = trimmedQuery;
}

function getFilteredProducts() {
    let list = PRODUCTS;
    if (filters.category && filters.category !== "all") {
        list = list.filter(product =>
            product.categories?.includes(filters.category)
        );
    }
    if (!filters.search) return list;
    return list.filter(product => {
        const title = product.title.toLowerCase();
        const description = (product.description || "").toLowerCase();
        return title.includes(filters.search) || description.includes(filters.search);
    });
}

function bindCategoryLinks() {
    document.querySelectorAll("#category-dropdown-menu a, #mobile-category-list a").forEach(link => {
        link.addEventListener("click", event => {
            const url = new URL(link.href, window.location.origin);
            const category = url.searchParams.get("category") || "all";
            if (link.closest("#mobile-category-list")) {
                window.closeMobileMenu?.();
            }
            // If already on the shop page, intercept and filter in-place
            if (window.location.pathname.endsWith("shop.html") || window.location.pathname.endsWith("/shop")) {
                event.preventDefault();
                filters.category = category;
                updateQueryParam("category", category);
                renderProducts(getFilteredProducts());
                if (window.updateShopActiveState) window.updateShopActiveState();
            }
            // Otherwise allow the link to navigate to shop.html?category=...
        });
    });
}

function populateShopDropdown() {
    const links = COLLECTIONS.map(c => `
        <a href="shop.html?category=${encodeURIComponent(c.handle)}">${c.title}</a>
    `).join('');
    const desktopContainer = document.getElementById('shop-dropdown-list')
        || document.querySelector('#category-dropdown-menu .py-2');
    const mobileContainer = document.getElementById('mobile-category-list');
    if (desktopContainer) desktopContainer.innerHTML = links;
    if (mobileContainer) mobileContainer.innerHTML = links;
    bindCategoryLinks();
}

async function loadProducts() {
    const shopSearchInputs = Array.from(document.querySelectorAll("#search-bar input, #search-bar-mobile input"));
    const syncShopSearchInputs = (value) => {
        shopSearchInputs.forEach(input => {
            input.value = value;
        });
    };
    const bindShopSearch = () => {
        shopSearchInputs.forEach(input => {
            input.addEventListener("input", () => {
                const query = input.value.trim();
                syncShopSearchInputs(query);
                filters.rawSearch = query;
                filters.search = query.toLowerCase();
                if (query) {
                    localStorage.setItem("searchQuery", query);
                } else {
                    localStorage.removeItem("searchQuery");
                }
                renderProducts(getFilteredProducts());
            });
        });
    };
    if (shopSearchInputs.length) {
        bindShopSearch();
        if (filters.rawSearch) {
            syncShopSearchInputs(filters.rawSearch);
        }
    }
    // If products are already loaded (via initShopData), render for current grid
    if (PRODUCTS.length && grid) {
        filters.category = getQueryParam("category") || filters.category || "all";
        renderProducts(getFilteredProducts());
    }
}

// Fetch collections and products site-wide so dropdown can be populated on every page
async function initShopData() {
    try {
        const data = await shopifyRequest(`
            {
                collections(first: 50) {
                    edges {
                        node { id title handle }
                    }
                }
                products(first: 100) {
                    edges {
                        node {
                            id
                            title
                            description
                            handle
                            tags
                            collections(first: 5) {
                                edges {
                                    node { handle title }
                                }
                            }
                            featuredImage { url }
                            variants(first: 1) {
                                edges {
                                    node {
                                        id
                                        availableForSale
                                        price { amount }
                                        compareAtPrice { amount }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `);
        const collections = [{ handle: "all", title: "All categories" }, ...data.collections.edges.map(({ node }) => ({
            handle: node.handle,
            title: node.title
        }))];
        const products = data.products.edges.map(({ node }) => {
            const variant = node.variants.edges[0].node;
            const price = Number(variant.price.amount);
            const compareAtPrice = variant.compareAtPrice?.amount
                ? Number(variant.compareAtPrice.amount)
                : null;
            return {
                id: node.id,
                handle: node.handle,
                title: node.title,
                description: node.description,
                image: node.featuredImage
                    ? node.featuredImage.url
                    : "placeholder.png",
                price,
                compareAtPrice,
                hasDiscount: compareAtPrice && compareAtPrice > price,
                variantId: variant.id,
                available: variant.availableForSale,
                tags: node.tags || [],
                categories: node.collections.edges.map(c => c.node.handle),
                categoryName: node.collections.edges[0]?.node.title || "All categories"
            };
        });
        COLLECTIONS = collections;
        PRODUCTS = products;
        window.shopifyProducts = products;
        filters.category = getQueryParam("category") || "all";
        populateShopDropdown();
        if (grid) renderProducts(getFilteredProducts());
        // Populate homepage sections if present
        renderHomeCategories();
        renderHomeBestSellers();
        renderHeroCards();
        window.dispatchEvent(new CustomEvent("shopify:products-loaded", {
            detail: { products }
        }));
    } catch (error) {
        console.error("Shopify error:", error);
        window.dispatchEvent(new CustomEvent("shopify:products-error"));
        if (grid) {
            grid.innerHTML = `
                <p class="text-center py-10">
                Failed to load products.
            </p>
            `;
        }
    }
}

function renderHomeCategories() {
    const container = document.getElementById('home-categories');
    if (!container || !COLLECTIONS.length) return;
        // Exclude the "all" pseudo-collection and the Best Sellers collection from the homepage tiles
        const cats = COLLECTIONS
                .filter(c => c.handle !== 'all' && c.handle !== 'best-sellers' && !/best\s*-?\s*sellers?/i.test(c.title))
                .slice(0, 8);
    container.innerHTML = cats.map(c => `
        <a href="shop.html?category=${encodeURIComponent(c.handle)}" class="item-card p-6 flex items-center justify-center hover:shadow-md">
          <div class="text-center">
            <div class="text-sm text-soft mb-2">Game</div>
            <div class="font-semibold">${c.title}</div>
          </div>
        </a>
    `).join('');
}

function renderHeroCards() {
    const hero = document.getElementById("hero-cards");
    if (!hero) return;
    // Find the Best Sellers collection
    const bestSellerCollection = COLLECTIONS.find(c =>
        c.handle === "best-sellers" ||
        /best.?sellers?/i.test(c.title)
    );
    let heroProducts = [];
    if (bestSellerCollection) {
        heroProducts = PRODUCTS.filter(product =>
            product.categories.includes(bestSellerCollection.handle)
        );
    }
    // Fallback if collection is empty
    if (heroProducts.length < 3) {
        heroProducts = PRODUCTS;
    }
    heroProducts = heroProducts.slice(0, 3);
    const positions = [
        "hero-left",
        "hero-center",
        "hero-right"
    ];
    hero.innerHTML = heroProducts.map((product, index) => `
        <a
            href="${getProductPageUrl(product)}"
            class="hero-product-card ${positions[index]}"
        >
            <div class="hero-card-image">
                <img
                    src="${product.image}"
                    alt="${product.title}"
                    loading="lazy"
                >
            </div>
            <div class="hero-card-footer">
                <h3>${product.title}</h3>
            </div>
        </a>
    `).join("");
}

function renderHomeBestSellers() {
    const container = document.getElementById('home-best-grid');
    if (!container || !COLLECTIONS.length || !PRODUCTS.length) return;
    // try to find a collection named best-sellers or similar
    const bs = COLLECTIONS.find(c => c.handle === 'best-sellers' || /best.?sellers?/i.test(c.title));
    if (!bs) {
        container.innerHTML = `<div class="col-span-full text-soft">No best-sellers collection found.</div>`;
        return;
    }
    const handle = bs.handle;
    const items = PRODUCTS.filter(p => p.categories?.includes(handle)).slice(0, 8);
    if (!items.length) {
        container.innerHTML = `<div class="col-span-full text-soft">No items in Best sellers.</div>`;
        return;
    }
    container.innerHTML = items.map(product => {
        const discountBadge = product.hasDiscount
            ? `<div class="discount-badge">${Math.round((1 - product.price / product.compareAtPrice) * 100)}% OFF</div>`
            : "";
        return `
        <div class="product-card">
            <div class="product-card-image-wrap">
                <a href="${getProductPageUrl(product)}">
                    <img
                        src="${product.image}"
                        alt="${product.title}"
                        class="product-image">
                </a>
              ${discountBadge}
            </div>
            <div class="product-card-body p-4">
                <h3 class="product-title">
                    <a href="${getProductPageUrl(product)}">
                        ${product.title}
                    </a>
                </h3>
                <div class="product-price-row">
                  <div>
                    <p class="product-price">$${product.price.toFixed(2)}</p>
                    ${product.hasDiscount ? `<p class="product-price-compare">$${product.compareAtPrice.toFixed(2)}</p>` : ""}
                  </div>
                </div>
                <div class="product-card-actions">
                    ${productWishlistButtonMarkup(product)}
                    <button class="add-to-cart" data-id="${product.variantId}" ${!product.available ? 'disabled' : ''}>
                        ${product.available ? 'Add To Cart' : 'Sold Out'}
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');
    // ensure add-to-cart buttons bind
    attachCartEvents();
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

function productCardMarkup(product, bodyPadding = "p-5") {
    const discountBadge = product.hasDiscount
        ? `<div class="discount-badge">${Math.round((1 - product.price / product.compareAtPrice) * 100)}% OFF</div>`
        : "";
    return `
        <div class="product-card">
            <div class="product-card-image-wrap">
                <a href="${getProductPageUrl(product)}">
                    <img
                        src="${product.image}"
                        alt="${escapeHtml(product.title)}"
                        class="product-image">
                </a>
              ${discountBadge}
            </div>
            <div class="product-card-body ${bodyPadding}">
                <h3 class="product-title">
                    <a href="${getProductPageUrl(product)}">
                        ${escapeHtml(product.title)}
                    </a>
                </h3>
                <div class="product-price-row">
                  <div>
                    <p class="product-price">$${product.price.toFixed(2)}</p>
                    ${product.hasDiscount ? `<p class="product-price-compare">$${product.compareAtPrice.toFixed(2)}</p>` : ""}
                  </div>
                </div>
                <div class="product-card-actions">
                    ${productWishlistButtonMarkup(product)}
                    <button
                        class="add-to-cart"
                        data-id="${product.variantId}"
                        ${!product.available ? "disabled" : ""}>
                        ${product.available ? "Add To Cart" : "Sold Out"}
                    </button>
                </div>
            </div>
        </div>
    `;
}

const GRID_CLASSES = "grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3";

const BEST_SELLERS_RE = /best\s*-?\s*sellers?/i;

function buildShopSections(products) {
    const sections = [];
    const addSection = (title, href, items) => { if (items.length) sections.push({ title, href, items }); };
    if (!filters.category || filters.category === "all") {
        const placed = new Set();
        COLLECTIONS
            .filter(c => c.handle !== "all" && !BEST_SELLERS_RE.test(c.handle) && !BEST_SELLERS_RE.test(c.title))
            .forEach(collection => {
                const items = products.filter(p => p.categories?.includes(collection.handle));
                items.forEach(p => placed.add(p.id));
                addSection(collection.title, `shop.html?category=${encodeURIComponent(collection.handle)}`, items);
            });
        addSection(sections.length ? "More items" : "All items", "", products.filter(p => !placed.has(p.id)));
        return sections;
    }
    // Inside a game: Best Sellers first, then one row per product tag (sub category).
    const byTag = new Map();
    products.forEach(p => (p.tags || []).forEach(tag => {
        if (!byTag.has(tag)) byTag.set(tag, []);
        byTag.get(tag).push(p);
    }));
    if (!byTag.size) return null;
    const tags = [...byTag.keys()].sort((a, b) => Number(BEST_SELLERS_RE.test(b)) - Number(BEST_SELLERS_RE.test(a)));
    tags.forEach(tag => addSection(tag, "", byTag.get(tag)));
    const untagged = products.filter(p => !(p.tags || []).length);
    addSection("More items", "", untagged);
    return sections;
}

function shopSectionsMarkup(sections) {
    return sections.map(section => `
        <section class="shop-section">
            <div class="shop-section-head">
                <h2 class="shop-section-title">${escapeHtml(section.title)}</h2>
                <div class="shop-section-tools">
                    ${section.href ? `<a href="${section.href}" class="shop-section-link">View all</a>` : ""}
                    <button type="button" class="shop-row-arrow" data-dir="-1" aria-label="Scroll left"><i class="fas fa-chevron-left"></i></button>
                    <button type="button" class="shop-row-arrow" data-dir="1" aria-label="Scroll right"><i class="fas fa-chevron-right"></i></button>
                </div>
            </div>
            <div class="shop-row-track">
                ${section.items.map(product => `<div class="shop-row-item">${productCardMarkup(product, "p-3")}</div>`).join("")}
            </div>
        </section>
    `).join("");
}

function renderProducts(products) {
    if (!grid) return;
    if (!products.length) {
        grid.className = GRID_CLASSES;
        grid.innerHTML = `
          <div class="col-span-full text-center py-16 text-soft">
            No items found.
          </div>
        `;
        return;
    }
    const sections = !filters.search && COLLECTIONS.length ? buildShopSections(products) : null;
    if (sections && sections.length) {
        grid.className = "shop-sections";
        grid.innerHTML = shopSectionsMarkup(sections);
    } else {
        grid.className = GRID_CLASSES;
        grid.innerHTML = products.map(product => productCardMarkup(product, "p-3")).join("");
    }
    if (!grid.dataset.rowArrowsBound) {
        grid.dataset.rowArrowsBound = "1";
        grid.addEventListener("click", event => {
            const arrow = event.target.closest(".shop-row-arrow");
            if (!arrow) return;
            const track = arrow.closest(".shop-section").querySelector(".shop-row-track");
            track.scrollBy({ left: Number(arrow.dataset.dir) * track.clientWidth * 0.85, behavior: "smooth" });
        });
    }
    attachCartEvents();
}
let cartId = localStorage.getItem("shopify_cart");
const cartItemsContainer = document.getElementById("cart-items");
const emptyCartBlock = document.querySelector("#cart .empty-cart");
const cartContent = document.querySelector("#cart .cart-content");
const checkoutBtn = document.getElementById("checkout-btn");
const clearCartBtn = document.getElementById("clear-cart-btn");
const cartBadge = document.getElementById("cart-badge");
const cartTotalRow = document.getElementById("cart-total-row");
let currentCart = null;
let confirmedCart = null;
let cartMutationQueue = Promise.resolve();

function getKnownStockLimit(variantId) {
    if (!variantId) return null;
    const storedLimit = sessionStorage.getItem(`shopify-stock-limit:${variantId}`);
    if (storedLimit === null) return null;
    const limit = Number(storedLimit);
    return Number.isInteger(limit) && limit >= 0 ? limit : null;
}

function rememberStockLimit(variantId, quantity) {
    if (!variantId || !Number.isInteger(quantity) || quantity < 0) return;
    sessionStorage.setItem(`shopify-stock-limit:${variantId}`, String(quantity));
}

function getCartVariantQuantity(variantId) {
    return (currentCart?.lines?.edges || []).reduce((sum, { node }) => {
        return sum + (node.merchandise?.id === variantId ? Number(node.quantity || 0) : 0);
    }, 0);
}

function setCartVisibility(quantity) {
    cartContent?.classList.toggle("is-empty", quantity === 0);
    cartContent?.classList.toggle("has-items", quantity > 0);
    if (quantity > 0) {
        emptyCartBlock?.classList.add("hidden");
        cartItemsContainer?.classList.remove("hidden");
        clearCartBtn?.classList.remove("hidden");
        checkoutBtn?.classList.remove("hidden");
        cartTotalRow?.classList.remove("hidden");
        cartBadge?.classList.add("scale-100");
        cartBadge?.classList.remove("scale-0");
    } else {
        emptyCartBlock?.classList.remove("hidden");
        cartItemsContainer?.classList.add("hidden");
        clearCartBtn?.classList.add("hidden");
        checkoutBtn?.classList.add("hidden");
        cartTotalRow?.classList.add("hidden");
        cartBadge?.classList.add("scale-0");
        cartBadge?.classList.remove("scale-100");
    }
}

function formatPrice(amount) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: SITE_CURRENCY
    }).format(Number(amount));
}

function getCartSubtotal(cart) {
    const subtotal = cart.cost?.subtotalAmount?.amount;
    if (subtotal !== undefined && Number.isFinite(Number(subtotal))) {
        return Number(subtotal);
    }

    return (cart.lines?.edges || []).reduce((sum, { node }) => {
        const lineTotal = node.cost?.totalAmount?.amount;
        if (lineTotal !== undefined && Number.isFinite(Number(lineTotal))) {
            return sum + Number(lineTotal);
        }
        return sum + Number(node.merchandise?.price?.amount || 0) * Number(node.quantity || 0);
    }, 0);
}

function cartLinesSelection() {
    return `
        totalQuantity
        cost {
            subtotalAmount { amount currencyCode }
        }
        lines(first: 100) {
            edges {
                node {
                    id
                    quantity
                    cost {
                        totalAmount { amount currencyCode }
                    }
                    merchandise {
                        ... on ProductVariant {
                            id
                            title
                            product { title }
                            image { url }
                            price { amount currencyCode }
                        }
                    }
                }
            }
        }
    `;
}

function updateCartSummary(cart) {
    const lines = cart.lines?.edges || [];
    const count = lines.reduce((sum, { node }) => sum + Number(node.quantity || 0), 0);
    setCartVisibility(lines.length);
    const cartCount = document.getElementById("cart-count");
    if (cartCount) cartCount.textContent = String(count);
    if (cartBadge) cartBadge.textContent = String(count);
    const totalElement = document.getElementById("cart-total");
    if (totalElement) {
        totalElement.textContent = formatPrice(getCartSubtotal(cart));
    }
}

function renderCartItems(cart) {
    if (!cartItemsContainer) return;
    currentCart = cart;
    confirmedCart = cart;
    const lines = cart.lines?.edges || [];
    cartItemsContainer.innerHTML = "";

    lines.forEach(({ node }) => {
        const variant = node.merchandise;
        const productTitle = variant?.product?.title || variant?.title || "Item";
        const itemTitle = variant?.title || "Variant";
        const imageUrl = variant?.image?.url || "placeholder.png";
        const price = variant?.price?.amount || "0.00";
        const stockLimit = getKnownStockLimit(variant?.id);
        const atStockLimit = stockLimit !== null && Number(node.quantity) >= stockLimit;

        const itemEl = document.createElement("div");
        itemEl.className = "cart-item";
        itemEl.dataset.lineId = node.id;
        itemEl.innerHTML = `
            <img src="${imageUrl}" alt="${productTitle}" class="w-20 h-20 rounded-2xl object-cover flex-shrink-0">
            <div class="flex-1 min-w-0">
                <div class="font-semibold text-sm truncate">${productTitle}</div>
                <div class="text-xs text-soft truncate">${itemTitle}</div>
                <div class="text-violet font-bold mt-1">${formatPrice(price)}</div>
            </div>
            <div class="cart-quantity-control flex items-center gap-2 flex-shrink-0">
                <button type="button" class="cart-quantity-button" data-quantity-change="-1" data-line-id="${node.id}" aria-label="Decrease ${productTitle} quantity">−</button>
                <span class="cart-quantity-value" aria-live="polite">${node.quantity}</span>
                <button type="button" class="cart-quantity-button" data-quantity-change="1" data-line-id="${node.id}" aria-label="Increase ${productTitle} quantity" ${atStockLimit ? 'disabled title="Maximum available quantity reached"' : ""}>+</button>
            </div>
        `;
        cartItemsContainer.appendChild(itemEl);
    });
    updateCartSummary(cart);
    if (typeof window.syncProductStockControls === "function") {
        window.syncProductStockControls();
    }

    cartItemsContainer.querySelectorAll("[data-quantity-change]").forEach(button => {
        button.addEventListener("click", () => {
            const lineId = button.dataset.lineId;
            const quantityControl = button.parentElement;
            const valueElement = quantityControl.querySelector(".cart-quantity-value");
            const quantity = Number(valueElement.textContent);
            const change = Number(button.dataset.quantityChange);
            const nextQuantity = quantity + change;
            if (nextQuantity < 0) return;
            const line = currentCart.lines.edges.find(edge => edge.node.id === lineId)?.node;
            const variantId = line?.merchandise?.id;
            const stockLimit = getKnownStockLimit(variantId);
            if (change > 0 && stockLimit !== null && nextQuantity > stockLimit) return;

            const previousCart = currentCart;
            quantityControl.querySelectorAll("button").forEach(control => {
                control.disabled = true;
            });

            cartMutationQueue = cartMutationQueue.then(async () => {
                const updatedCart = await updateCartLineQuantity(lineId, nextQuantity);
                if (updatedCart) {
                    confirmedCart = updatedCart;
                    currentCart = updatedCart;
                    const updatedLine = updatedCart.lines?.edges
                        .find(edge => edge.node.id === lineId)?.node;
                    if (updatedLine && updatedLine.quantity < nextQuantity) {
                        rememberStockLimit(variantId, updatedLine.quantity);
                        showToast(
                            "Stock limit reached",
                            `Only ${updatedLine.quantity} available for this product.`
                        );
                    }
                } else {
                    currentCart = confirmedCart || previousCart;
                }
                renderCartItems(currentCart);
            }).catch(error => {
                console.error("Unable to process cart quantity update:", error);
                currentCart = confirmedCart || previousCart;
                renderCartItems(currentCart);
            });
        });
    });
}

async function fetchCart() {
    cartId = localStorage.getItem("shopify_cart");
    if (!cartId) return null;
    const data = await shopifyRequest(
        `query Cart($cartId: ID!) {
                  cart(id: $cartId) {
                    ${cartLinesSelection()}
                  }
                }`,
        { cartId }
    );
    const cart = data.cart;
    if (!cart) {
        localStorage.removeItem("shopify_cart");
        cartId = null;
    }
    return cart;
}

async function updateCartLineQuantity(lineId, quantity) {
    cartId = localStorage.getItem("shopify_cart");
    if (!cartId || !lineId || !Number.isInteger(quantity) || quantity < 0) return;
    try {
        const data = await shopifyRequest(
            `mutation UpdateCartLine($cartId: ID!, $lineId: ID!, $quantity: Int!) {
                  cartLinesUpdate(
                    cartId: $cartId
                    lines: [{ id: $lineId, quantity: $quantity }]
                  ){
                                        cart { ${cartLinesSelection()} }
                    userErrors {
                      message
                    }
                  }
                }`,
            { cartId, lineId, quantity }
        );
        throwOnCartUserErrors(data.cartLinesUpdate);
        if (!data.cartLinesUpdate.cart) {
            throw new Error("Shopify couldn't update your cart.");
        }
        return data.cartLinesUpdate.cart;
    } catch (error) {
        console.error("Unable to update cart item quantity:", error);
        showToast("Cart Error", error.message || "We couldn't update this item.");
        return false;
    }
}

async function clearCart() {
    cartId = localStorage.getItem("shopify_cart");
    if (!cartId) return;
    try {
        const lineIds = Array.from(
            cartItemsContainer?.querySelectorAll(".cart-item") || [],
            item => item.dataset.lineId
        ).filter(Boolean);
        if (!lineIds.length) return;
        const data = await shopifyRequest(
            `mutation RemoveCartLines($cartId: ID!, $lineIds: [ID!]!) {
                  cartLinesRemove(
                    cartId: $cartId
                    lineIds: $lineIds
                  ){
                    cart { totalQuantity }
                    userErrors {
                      message
                    }
                  }
                }`,
            { cartId, lineIds }
        );
        throwOnCartUserErrors(data.cartLinesRemove);
        if (!data.cartLinesRemove.cart) {
            throw new Error("Shopify couldn't update your cart.");
        }
        renderCartItems({
            ...data.cartLinesRemove.cart,
            lines: { edges: [] }
        });
    } catch (error) {
        console.error("Unable to clear cart:", error);
        showToast("Cart Error", error.message || "We couldn't clear your cart.");
    }
}

if (clearCartBtn) {
    clearCartBtn.addEventListener("click", clearCart);
}

async function addShopifyProductToCart(variantId) {
    let added = false;
    try {
        if (!variantId) {
            throw new Error("This item is unavailable.");
        }
        cartId = localStorage.getItem("shopify_cart");
        if (!cartId) {
            const createData = await shopifyRequest(
                `mutation CreateCartWithLine($variantId: ID!) {
                    cartCreate(input: {
                        lines: [{ merchandiseId: $variantId, quantity: 1 }]
                    }) {
                        cart { id ${cartLinesSelection()} }
                        userErrors { message }
                    }
                }`,
                { variantId }
            );
            throwOnCartUserErrors(createData.cartCreate);
            const cart = createData.cartCreate?.cart;
            cartId = cart?.id;
            if (!cartId) throw new Error("Shopify couldn't create a cart.");
            localStorage.setItem(
                "shopify_cart",
                cartId
            );
            added = true;
            renderCartItems(cart);
            showToast("Added to Cart", "Item has been added to your cart.");
            return;
        }
        const addData = await shopifyRequest(
            `mutation AddCartLine($cartId: ID!, $variantId: ID!) {
                      cartLinesAdd(
                        cartId: $cartId
                        lines:[
                          {
                            merchandiseId: $variantId
                            quantity:1
                          }
                        ]
                      ){
                        cart { ${cartLinesSelection()} }
                        userErrors {
                          message
                        }
                      }
                    }`,
            { cartId, variantId }
        );
        throwOnCartUserErrors(addData.cartLinesAdd);
        if (!addData.cartLinesAdd?.cart) {
            throw new Error("Shopify couldn't add this item to your cart.");
        }
        added = true;
        renderCartItems(addData.cartLinesAdd.cart);
        showToast("Added to Cart", "Item has been added to your cart.");
    }
    catch(error){
        console.error(error);
        showToast(
            added ? "Cart Refresh Error" : "Cart Error",
            added
                ? "Item added, but the cart display couldn't refresh."
                : error.message || "We couldn't add this item to your cart."
        );
    }
}

window.addShopifyProductToCart = addShopifyProductToCart;

function attachCartEvents(){
    document
    .querySelectorAll(".add-to-cart")
    .forEach(button=>{
        button.onclick=async()=>{
            if (button.disabled) return;
            button.disabled = true;
            const originalText = button.textContent;
            button.dataset.processing = "true";
            await addShopifyProductToCart(button.dataset.id);
            button.disabled = originalText.trim() === "Sold Out";
            delete button.dataset.processing;
        };
    });
}

async function updateCartCount() {
    const badge = document.getElementById("cart-count");
    cartId = localStorage.getItem("shopify_cart");
    if (!cartId) {
        if (badge) badge.textContent = "0";
        setCartVisibility(0);
        return;
    }
    const cart = await fetchCart();
    if (!cart) {
        if (badge) badge.textContent = "0";
        if (cartBadge) cartBadge.textContent = "0";
        setCartVisibility(0);
        return;
    }
    const quantity = Number(cart.totalQuantity || cart.lines?.edges?.reduce((sum, { node }) => sum + node.quantity, 0) || 0);
    if (badge) badge.textContent = quantity;
    if (cartBadge) cartBadge.textContent = quantity;
    renderCartItems(cart);
    setCartVisibility(quantity);
}

// Initialize data and UI handlers
initShopData();
loadProducts();
updateCartCount().catch(error => {
    console.error("Unable to load cart:", error);
    showToast("Cart Error", error.message || "We couldn't load your cart.");
});

async function checkout(){
    cartId = localStorage.getItem("shopify_cart");
    if (!cartId) {
        showToast("Checkout Error", "Your cart is empty.");
        return;
    }
    try {
        const data = await shopifyRequest(
            `query CartCheckout($cartId: ID!) {
                  cart(id: $cartId) {
                    checkoutUrl
                  }
                }`,
            { cartId }
        );
        const checkoutUrl = data.cart?.checkoutUrl;
        if (!checkoutUrl) throw new Error("Shopify couldn't create a checkout link.");
        window.location.href = checkoutUrl;
    } catch (error) {
        console.error("Unable to start checkout:", error);
        showToast("Checkout Error", error.message || "We couldn't start checkout.");
    }
}
