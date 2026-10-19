// Theme toggle
const themeBtn = document.getElementById("theme-toggle");

// Load saved theme
if(localStorage.getItem("theme") === "dark"){
    document.documentElement.classList.add("dark");
    themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
}
// Shop dropdown toggle (desktop): open/close and outside-click handling
const shopToggleBtn = document.getElementById('shop-dropdown-toggle');
const shopDropdown = document.getElementById('category-dropdown-menu');
function closeShopDropdown() {
    shopDropdown?.classList.add('hidden');
}
if (shopToggleBtn && shopDropdown) {
    shopToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!window.matchMedia('(min-width: 1024px)').matches) return;
        shopDropdown.classList.toggle('hidden');
    });
    shopDropdown.addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('click', () => {
        if (window.matchMedia('(min-width: 1024px)').matches) closeShopDropdown();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeShopDropdown();
    });
    window.addEventListener('resize', () => {
        if (!window.matchMedia('(min-width: 1024px)').matches) {
            shopDropdown.classList.add('hidden');
        }
    });
}

// Highlight Shop nav when on shop page or when a category query is present
function updateShopActiveState() {
    const shopLink = document.getElementById('shop-link');
    if (!shopLink) return;
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const hasCategory = params.get('category');
    if (path.endsWith('shop.html') || path.endsWith('/shop') || hasCategory) {
        shopLink.classList.add('active');
    } else {
        shopLink.classList.remove('active');
    }
}

updateShopActiveState();
window.addEventListener('popstate', updateShopActiveState);

// Viewer count simulation: seed from DOM or random, then jitter periodically
function initViewerCount() {
    const el = document.getElementById('viewer-count');
    if (!el) return;
    // try data-count attribute, then parse text, else seed random
    let count = parseInt(el.dataset.count) || parseInt(el.textContent) || Math.floor(150 + Math.random() * 200);
    if (isNaN(count) || count <= 0) count = 200;
    el.textContent = count;

    function tick() {
        // small random fluctuation: -1..+3
        const change = (Math.random() < 0.2) ? -1 : Math.floor(Math.random() * 4);
        count = Math.max(1, count + change);
        el.textContent = count;
        // next update between 6 and 12 seconds
        setTimeout(tick, 6000 + Math.random() * 6000);
    }

    // start after a short delay to avoid jank
    setTimeout(tick, 2000 + Math.random() * 2000);
}

initViewerCount();
themeBtn.addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
    if(document.documentElement.classList.contains("dark")){
        localStorage.setItem("theme","dark");
        themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }else{
        localStorage.setItem("theme","light");
        themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
    }
});

const words = ["Grow A Garden 2", "Steal A Brainrot", "Adopt Me", "Murder Mystery 2"];
let wordIndex=0, charIndex=0, isDeleting=false;
function startTypingEffect(){
  const el = document.getElementById('hero-typing');
  if (!el) return; // Safety check for non-home pages
  const word = words[wordIndex];
  el.textContent = isDeleting ? word.substring(0, charIndex-1) : word.substring(0, charIndex+1);
  charIndex += isDeleting ? -1 : 1;
  let delay = isDeleting ? 45 : 95;
  if(!isDeleting && charIndex===word.length){ delay=1800; isDeleting=true; }
  else if(isDeleting && charIndex===0){ isDeleting=false; wordIndex=(wordIndex+1)%words.length; delay=400; }
  setTimeout(startTypingEffect, delay);
}
startTypingEffect();

const cartBtn = document.getElementById("cart-button");
const cart = document.getElementById("cart");
const overlay = document.getElementById("cart-overlay");
const closeBtn = document.getElementById("close-cart");
const mobileMenuBtn = document.getElementById("menu-button");
const closeMobileMenuBtn = document.getElementById("close-menu");
const mobileMenu = document.getElementById("mobile-menu");
const mobileDrawer = document.getElementById("mobile-drawer");
const menuOverlay = document.getElementById("menu-overlay");

const mobileShopLink = mobileDrawer?.querySelector('a[href="shop.html"]');
if (mobileShopLink && !document.getElementById("mobile-category-section")) {
    const categorySection = document.createElement("div");
    categorySection.id = "mobile-category-section";
    categorySection.className = "mobile-category-section";
    categorySection.innerHTML = `
        <button type="button" id="mobile-category-toggle" class="mobile-category-toggle" aria-expanded="false" aria-controls="mobile-category-list">
            <span>Categories</span>
            <i class="fas fa-chevron-down" aria-hidden="true"></i>
        </button>
        <div id="mobile-category-list" class="mobile-category-list hidden"></div>
    `;
    mobileShopLink.insertAdjacentElement("afterend", categorySection);

    const categoryToggle = categorySection.querySelector("#mobile-category-toggle");
    const categoryList = categorySection.querySelector("#mobile-category-list");
    categoryToggle.addEventListener("click", () => {
        const expanded = categoryToggle.getAttribute("aria-expanded") === "true";
        categoryToggle.setAttribute("aria-expanded", String(!expanded));
        categoryList.classList.toggle("hidden", expanded);
        categoryToggle.querySelector("i")?.classList.toggle("fa-chevron-up", !expanded);
        categoryToggle.querySelector("i")?.classList.toggle("fa-chevron-down", expanded);
    });
}

const desktopNav = document.getElementById("desktop-nav");
const desktopShopLink = document.getElementById("shop-link");
if (desktopNav && desktopShopLink && !desktopNav.querySelector(".nav-wishlist")) {
    const wishlistLink = document.createElement("a");
    wishlistLink.href = "wishlist.html";
    wishlistLink.className = "nav-link font-medium text-sm nav-wishlist";
    wishlistLink.textContent = "Wishlist";
    if (window.location.pathname.endsWith("wishlist.html")) {
        wishlistLink.classList.add("active");
    }
    desktopShopLink.closest(".relative")?.insertAdjacentElement("afterend", wishlistLink);
}

const mobileCategorySection = document.getElementById("mobile-category-section");
const mobileShopLinkForWishlist = mobileDrawer?.querySelector('a[href="shop.html"]');
if (mobileDrawer && mobileShopLinkForWishlist && !mobileDrawer.querySelector(".mobile-wishlist-link")) {
    const wishlistLink = document.createElement("a");
    wishlistLink.href = "wishlist.html";
    wishlistLink.className = "mobile-wishlist-link text-left px-4 py-3 rounded-xl hover:bg-app-soft font-medium";
    wishlistLink.textContent = "Wishlist";
    (mobileCategorySection || mobileShopLinkForWishlist).insertAdjacentElement("afterend", wishlistLink);
}

function openCart(){
    cart.classList.add("active");
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
}
function closeCart(){
    cart.classList.remove("active");
    overlay.classList.remove("active");
    document.body.style.overflow = "";
}
function openMobileMenu(){
    if (mobileMenu) {
        mobileMenu.classList.add("active");
        mobileMenu.classList.remove("hidden");
        mobileDrawer.classList.add("active");
        menuOverlay?.classList.add("active");
        document.body.style.overflow = "hidden";
    }
}
function closeMobileMenu(){
    if (mobileMenu) {
        mobileMenu.classList.add("hidden");
        mobileMenu.classList.remove("active");
        mobileDrawer.classList.remove("active");
        menuOverlay?.classList.remove("active");
        document.body.style.overflow = "";
    }
}

cartBtn?.addEventListener("click", openCart);
closeBtn?.addEventListener("click", closeCart);
overlay?.addEventListener("click", closeCart);
mobileMenuBtn?.addEventListener("click", openMobileMenu);
closeMobileMenuBtn?.addEventListener("click", closeMobileMenu);
menuOverlay?.addEventListener("click", closeMobileMenu);
document.addEventListener("keydown", e=>{
    if(e.key==="Escape"){
        closeCart();
        closeMobileMenu();
    }
});

function handleContactSubmit(e){
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  const subject = formData.get("subject");
  const body = [
    `Name: ${formData.get("name")}`,
    `Email: ${formData.get("email")}`,
    "",
    formData.get("message")
  ].join("\n");
  const mailto = `mailto:support@pixelbloxy.gg?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  showToast("Opening email app", "Send the prepared message in your email app to contact support.");
  window.location.href = mailto;
}

function setupContactSubjectPicker() {
    const picker = document.querySelector(".contact-subject-picker");
    const toggle = document.getElementById("contact-subject-toggle");
    const valueInput = document.getElementById("contact-subject-value");
    const options = document.getElementById("contact-subject-options");
    if (!picker || !toggle || !valueInput || !options) return;

    const optionButtons = [...options.querySelectorAll('[role="option"]')];
    const close = (returnFocus = false) => {
        options.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
        options.classList.remove("opens-up");
        if (returnFocus) toggle.focus();
    };
    const open = () => {
        options.hidden = false;
        options.classList.remove("opens-up");
        options.style.maxHeight = "";

        const rect = toggle.getBoundingClientRect();
        const spaceBelow = Math.max(0, window.innerHeight - rect.bottom - 12);
        const spaceAbove = Math.max(0, rect.top - 12);
        const requiredHeight = Math.min(240, options.scrollHeight);
        const openUp = spaceBelow < requiredHeight && spaceAbove > spaceBelow;
        const availableSpace = openUp ? spaceAbove : spaceBelow;
        options.classList.toggle("opens-up", openUp);
        options.style.maxHeight = `${Math.max(0, Math.min(240, availableSpace))}px`;
        toggle.setAttribute("aria-expanded", "true");
    };

    toggle.addEventListener("click", () => {
        if (options.hidden) open();
        else close();
    });
    toggle.addEventListener("keydown", event => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            open();
            const selected = options.querySelector('[aria-selected="true"]') || optionButtons[0];
            selected?.focus();
        }
    });
    optionButtons.forEach((option, index) => {
        option.addEventListener("click", () => {
            valueInput.value = option.dataset.value;
            toggle.querySelector(".contact-subject-label").textContent = option.dataset.value;
            optionButtons.forEach(button => {
                button.setAttribute("aria-selected", String(button === option));
            });
            close(true);
        });
        option.addEventListener("keydown", event => {
            let nextIndex = index;
            if (event.key === "ArrowDown") nextIndex = (index + 1) % optionButtons.length;
            else if (event.key === "ArrowUp") nextIndex = (index - 1 + optionButtons.length) % optionButtons.length;
            else if (event.key === "Home") nextIndex = 0;
            else if (event.key === "End") nextIndex = optionButtons.length - 1;
            else if (event.key === "Escape") {
                event.preventDefault();
                close(true);
                return;
            } else return;
            event.preventDefault();
            optionButtons[nextIndex].focus();
        });
    });
    document.addEventListener("click", event => {
        if (!picker.contains(event.target)) close();
    });
    window.addEventListener("resize", () => {
        if (!options.hidden) close();
    });
}

function toggleChat(){
  document.getElementById('chat-widget')?.classList.toggle('scale-0');
}
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-message");
function addMessage(text, sender) {
    const row = document.createElement("div");
    row.className = "chat-message-row";
    row.style.display = "flex";
    if (sender === "user") {
        row.style.justifyContent = "flex-end";
    } else {
        row.style.justifyContent = "flex-start";
    }
    const bubble = document.createElement("div");
    bubble.textContent = text;
    bubble.style.maxWidth = "75%";
    bubble.style.padding = "12px 16px";
    bubble.style.borderRadius = "18px";
    bubble.style.wordBreak = "break-word";
    bubble.style.fontSize = "14px";
    bubble.style.lineHeight = "1.5";
    if (sender === "user") {
        bubble.style.background = "var(--violet)";
        bubble.style.color = "#fff";
        bubble.style.borderBottomRightRadius = "6px";
    } else {
        bubble.style.background = "var(--surface)";
        bubble.style.color = "var(--text)";
        bubble.style.border = "1px solid var(--border)";
        bubble.style.borderBottomLeftRadius = "6px";
    }
    row.appendChild(bubble);
    chatMessages.appendChild(row);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    addMessage(message, "user");
    chatInput.value = "";
    if (sendBtn) sendBtn.disabled = true;
    try {
        const products = Array.isArray(window.shopifyProducts)
            ? window.shopifyProducts.slice(0, 40).map(product => ({
                title: product.title,
                handle: product.handle,
                description: product.description,
                categoryName: product.categoryName,
                price: product.price,
                compareAtPrice: product.compareAtPrice,
                available: product.available
            }))
            : [];
        const response = await fetch(window.pixelBloxyApiUrl("/chat"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message,
                products
            })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || typeof data.reply !== "string" || !data.reply.trim()) {
            throw new Error(data.reply || "Chat service returned an invalid response.");
        }
        addMessage(data.reply, "bot");
    } catch (error) {
        const message = error instanceof TypeError
            ? "Can't reach the chat server. Start the website with npm start, then try again."
            : error.message || "The chat service is unavailable. Please try again.";
        addMessage(message, "bot");
    } finally {
        if (sendBtn) sendBtn.disabled = false;
    }
}
sendBtn?.addEventListener("click", sendMessage);
chatInput?.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        sendMessage();
    }
});

setupContactSubjectPicker();
document.getElementById("contact-form")?.addEventListener("submit", handleContactSubmit);

function showToast(title, message){
  const toast = document.getElementById('toast');
  const toastTitle = document.getElementById('toast-title');
  const toastMessage = document.getElementById('toast-message');
  if (!toast || !toastTitle || !toastMessage) return;
  toastTitle.textContent = title;
  toastMessage.textContent = message;
  toast.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(()=> toast.classList.remove('show'), 3200);
}

const searchInputs = Array.from(document.querySelectorAll("#search-bar input, #search-bar-mobile input"));
const storedSearchQuery = localStorage.getItem("searchQuery") || "";
if (storedSearchQuery && searchInputs.length) {
    searchInputs.forEach(input => {
        input.value = storedSearchQuery;
    });
}
function getSearchQuery() {
    return searchInputs
        .map(input => input.value.trim())
        .find(Boolean) || "";
}
function runSearch() {
    const query = getSearchQuery();
    if (!query) {
        localStorage.removeItem("searchQuery");
        return;
    }

    localStorage.setItem("searchQuery", query);

    if (window.location.pathname.endsWith("shop.html") || window.location.pathname.endsWith("/shop")) {
        return;
    }
    window.location.href = "shop.html";
}
if (searchInputs.length) {
    searchInputs.forEach(input => {
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                runSearch();
            }
            if (e.key === "Escape") {
                searchInputs.forEach(otherInput => otherInput.value = "");
                localStorage.removeItem("searchQuery");
                searchInputs.forEach(otherInput => otherInput.dispatchEvent(new Event("input", { bubbles: true })));
            }
        });
        input.addEventListener("input", () => {
            const query = input.value.trim();
            searchInputs.forEach(otherInput => {
                if (otherInput !== input) {
                    otherInput.value = query;
                }
            });
            if (query) {
                localStorage.setItem("searchQuery", query);
            } else {
                localStorage.removeItem("searchQuery");
            }
        });
    });
}