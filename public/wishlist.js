const wishlistGrid = document.getElementById("wishlist-grid");
const wishlistEmpty = document.getElementById("wishlist-empty");
const wishlistCount = document.getElementById("wishlist-count");
let wishlistProducts = window.shopifyProducts || [];
let wishlistCatalogLoaded = Array.isArray(window.shopifyProducts);
let wishlistCatalogError = false;

function escapeWishlistText(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function renderWishlist() {
    if (!wishlistGrid || !wishlistEmpty || !wishlistCount) return;

    if (!wishlistCatalogLoaded) {
        wishlistCount.textContent = "Loading wishlist...";
        return;
    }

    if (wishlistCatalogError) {
        wishlistCount.textContent = "Unavailable";
        wishlistGrid.innerHTML = "";
        wishlistGrid.classList.add("hidden");
        wishlistEmpty.classList.remove("hidden");
        wishlistEmpty.querySelector("h2").textContent = "Couldn't load your wishlist";
        wishlistEmpty.querySelector("p").textContent = "Check your connection and reload the page.";
        wishlistEmpty.querySelector(".wishlist-browse-link").classList.add("hidden");
        return;
    }

    const savedIds = window.getWishlistProductIds?.() || [];
    const savedSet = new Set(savedIds);
    const products = wishlistProducts.filter(product => savedSet.has(product.id));

    wishlistCount.textContent = `${products.length} ${products.length === 1 ? "item" : "items"}`;
    wishlistGrid.innerHTML = "";
    wishlistGrid.classList.toggle("hidden", products.length === 0);
    wishlistEmpty.classList.toggle("hidden", products.length > 0);

    if (!products.length) {
        const heading = wishlistEmpty.querySelector("h2");
        const description = wishlistEmpty.querySelector("p");
        const browseLink = wishlistEmpty.querySelector(".wishlist-browse-link");
        heading.textContent = "Your wishlist is empty";
        description.textContent = "Save products you want to come back to.";
        browseLink.classList.remove("hidden");
        return;
    }

    wishlistGrid.innerHTML = products.map(product => {
        const title = escapeWishlistText(product.title);
        const image = escapeWishlistText(product.image || "placeholder.png");
        const productUrl = product.handle
            ? `product.html?handle=${encodeURIComponent(product.handle)}`
            : `product.html?id=${encodeURIComponent(product.id)}`;
        const discount = product.hasDiscount
            ? `<span class="wishlist-discount">${Math.round((1 - product.price / product.compareAtPrice) * 100)}% OFF</span>`
            : "";
        const comparePrice = product.hasDiscount
            ? `<span class="wishlist-compare-price">$${product.compareAtPrice.toFixed(2)}</span>`
            : "";

        return `
            <article class="product-card wishlist-card">
                    <div class="product-card-image-wrap">
                        <a class="wishlist-product-link" href="${productUrl}">
                        <img src="${image}" alt="${title}" class="product-image" loading="lazy">
                        </a>
                        ${discount}
                    </div>
                    <div class="product-card-body p-5">
                        <h3 class="product-title" title="${title}"><a class="wishlist-product-link" href="${productUrl}">${title}</a></h3>
                        <div class="wishlist-price-row">
                            <span class="product-price">$${product.price.toFixed(2)}</span>
                            ${comparePrice}
                        </div>
                        <div class="product-card-actions">
                            ${window.productWishlistButtonMarkup?.(product) || ""}
                            <button type="button" class="add-to-cart" data-id="${escapeWishlistText(product.variantId)}" ${product.available ? "" : "disabled"}>
                                ${product.available ? "Add to Cart" : "Sold Out"}
                            </button>
                        </div>
                    </div>
            </article>
        `;
    }).join("");
}

wishlistGrid?.addEventListener("click", async event => {
    const addButton = event.target.closest(".add-to-cart");
    if (addButton && !addButton.disabled) {
        event.preventDefault();
        addButton.disabled = true;
        try {
            await window.addShopifyProductToCart(addButton.dataset.id);
        } finally {
            addButton.disabled = false;
        }
    }
});

window.addEventListener("shopify:products-loaded", event => {
    wishlistProducts = event.detail.products || [];
    wishlistCatalogLoaded = true;
    renderWishlist();
});
window.addEventListener("shopify:products-error", () => {
    wishlistCatalogLoaded = true;
    wishlistCatalogError = true;
    renderWishlist();
});
window.addEventListener("wishlist:updated", renderWishlist);
window.addEventListener("storage", event => {
    if (event.key === "pixelbloxy_wishlist") renderWishlist();
});

renderWishlist();
