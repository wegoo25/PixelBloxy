(() => {
    const page = window.location.pathname.split("/").pop() || "index.html";
    const activeClass = name => page === `${name}.html` ? " active" : "";
    const contactChat = page === "contact.html";

    const header = `
        <nav class="fixed top-0 w-full z-50 glass border-b border-token">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-20 py-3">
                    <a href="index.html" class="flex items-center gap-2 group">
                        <img src="logo.png" alt="PixelBloxy" class="site-logo">
                    </a>
                    <div id="desktop-nav" class="hidden lg:flex items-center gap-9">
                        <a href="index.html" class="nav-link font-medium text-sm nav-home${activeClass("index")}">Home</a>
                        <div class="relative">
                            <a href="shop.html" id="shop-link" class="nav-link font-medium text-sm nav-shop${activeClass("shop")}">Shop</a>
                            <button id="shop-dropdown-toggle" aria-label="Open categories" class="p-2 rounded hover:bg-app-soft ml-2"><i class="fas fa-chevron-down"></i></button>
                            <div id="category-dropdown-menu" class="absolute left-0 mt-2 w-56 bg-surface border border-token rounded-md shadow-lg z-20 hidden">
                                <div class="py-2" id="shop-dropdown-list"></div>
                            </div>
                        </div>
                        <a href="wishlist.html" class="nav-link font-medium text-sm nav-wishlist${activeClass("wishlist")}">Wishlist</a>
                        <a href="help.html" class="nav-link font-medium text-sm nav-help${activeClass("help")}">Help</a>
                        <a href="contact.html" class="nav-link font-medium text-sm nav-contact${activeClass("contact")}">Contact</a>
                    </div>
                    <div class="flex items-center gap-1.5 sm:gap-2">
                        <div class="shopping-now-counter hidden md:flex items-center gap-2 text-xs font-medium text-soft bg-app-soft px-3 py-1.5 rounded-full border border-token">
                            <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                            <span id="viewer-count">213</span> shopping now
                        </div>
                        <div id="search-bar" class="hidden lg:flex relative">
                            <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-soft text-sm"></i>
                            <input type="text" placeholder="Search items" class="w-full pl-11 pr-4 py-2.5 rounded-full bg-app-soft border border-token outline-none focus:border-violet transition-colors text-sm">
                        </div>
                        <button type="button" id="theme-toggle" aria-label="Toggle theme" class="p-2.5 rounded-full hover:bg-app-soft transition-colors relative w-10 h-10">
                            <i class="fas fa-moon theme-icon absolute inset-0 flex items-center justify-center text-sm dark:opacity-0"></i>
                            <i class="fas fa-sun theme-icon absolute inset-0 flex items-center justify-center text-sm opacity-0 dark:opacity-100"></i>
                        </button>
                        <button type="button" id="cart-button" aria-label="Cart" class="p-2.5 rounded-full hover:bg-app-soft transition-colors relative">
                            <i class="fas fa-shopping-bag text-sm"></i>
                            <span id="cart-badge" class="absolute top-0.5 right-0.5 bg-violet text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full transform scale-0 transition-transform">0</span>
                        </button>
                        <button type="button" id="menu-button" aria-label="Menu" class="lg:hidden p-2.5 rounded-full hover:bg-app-soft transition-colors"><i class="fas fa-bars text-sm"></i></button>
                    </div>
                </div>
            </div>
        </nav>
        <div id="mobile-menu" class="fixed inset-0 z-50 hidden">
            <div id="menu-overlay" class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
            <div id="mobile-drawer" class="absolute top-0 right-0 h-full w-72 bg-surface border-l border-token p-6 drawer transform translate-x-full">
                <div class="flex justify-between items-center mb-8">
                    <span class="font-display font-bold text-lg">Menu</span>
                    <button id="close-menu" type="button" aria-label="Close menu" class="p-2 rounded-full hover:bg-app-soft"><i class="fas fa-times"></i></button>
                </div>
                <div class="flex flex-col">
                    <div id="search-bar-mobile" class="lg:hidden relative">
                        <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-soft text-sm"></i>
                        <input type="text" placeholder="Search items" class="w-full pl-11 pr-4 py-2.5 rounded-full bg-app-soft border border-token outline-none focus:border-violet transition-colors text-sm">
                    </div>
                    <a href="index.html" class="text-left px-4 py-3 rounded-xl hover:bg-app-soft font-medium">Home</a>
                    <a href="shop.html" class="text-left px-4 py-3 rounded-xl hover:bg-app-soft font-medium">Shop</a>
                    <a href="wishlist.html" class="mobile-wishlist-link text-left px-4 py-3 rounded-xl hover:bg-app-soft font-medium">Wishlist</a>
                    <a href="help.html" class="text-left px-4 py-3 rounded-xl hover:bg-app-soft font-medium">Help</a>
                    <a href="contact.html" class="text-left px-4 py-3 rounded-xl hover:bg-app-soft font-medium">Contact</a>
                </div>
            </div>
        </div>
        <div id="cart-overlay"></div>
        <div id="cart" class="font-medium">
            <div class="cart-header">
                <div id="title"><h2>Your Cart</h2><span id="cart-count">0</span></div>
                <button id="close-cart" type="button" aria-label="Close cart"><i class="fas fa-times"></i></button>
            </div>
            <div class="cart-content">
                <div id="cart-items" class="space-y-4 hidden"></div>
                <div class="empty-cart"><i class="fas fa-shopping-cart"></i><h3>Your cart is empty</h3><p>Add some items!</p></div>
                <button id="clear-cart-btn" class="hidden text-soft hover:text-violet transition-colors w-full text-left text-sm font-semibold">Empty cart</button>
                <div id="cart-total-row" class="cart-total-row hidden"><span>Total</span><span id="cart-total">$0.00</span></div>
                <button id="checkout-btn" onclick="checkout()" class="hidden text-white/80 hover:text-white w-full mt-3 rounded-2xl bg-violet py-3 font-semibold">Checkout</button>
            </div>
        </div>
    `;

    const footerAndUtilities = `
        <footer class="bg-surface border-t border-token pt-16 pb-8">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-12">
                    <div class="col-span-2">
                        <div class="font-display font-bold text-xl mb-4">PIXEL<span class="text-violet">BLOXY</span></div>
                        <p class="text-soft text-sm leading-relaxed max-w-xs">The fastest, most trusted shop for Roblox digital items. Instant delivery, real humans, 24/7.</p>
                    </div>
                    <div>
                        <h4 class="font-display font-bold text-sm mb-4">Games</h4>
                        <ul id="footer-games" class="space-y-2 text-sm text-soft">
                            <li><a href="shop.html" class="hover:text-violet transition-colors">🌱 Grow A Garden 2</a></li>
                            <li><a href="shop.html" class="hover:text-violet transition-colors">🐉 Adopt Me</a></li>
                            <li><a href="shop.html" class="hover:text-violet transition-colors">🧠 Steal A Brainrot</a></li>
                            <li><a href="shop.html" class="hover:text-violet transition-colors">🔪 Murder Mystery 2</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-display font-bold text-sm mb-4">Shop</h4>
                        <ul class="space-y-2 text-sm text-soft">
                            <li><a href="shop.html" class="hover:text-violet transition-colors">All items</a></li>
                            <li><a href="categories.html" class="hover:text-violet transition-colors">Categories</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-display font-bold text-sm mb-4">Support</h4>
                        <ul class="space-y-2 text-sm text-soft">
                            <li><a href="help.html" class="hover:text-violet transition-colors">Help Center</a></li>
                            <li><a href="contact.html" class="hover:text-violet transition-colors">Contact</a></li>
                            <li><button onclick="toggleChat()" class="hover:text-violet transition-colors">Live chat</button></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-display font-bold text-sm mb-4">Company</h4>
                        <ul class="space-y-2 text-sm text-soft">
                            <li><a href="#" class="hover:text-violet transition-colors">Privacy Policy</a></li>
                            <li><a href="#" class="hover:text-violet transition-colors">Terms of Service</a></li>
                            <li><a href="#" class="hover:text-violet transition-colors">Refund Policy</a></li>
                        </ul>
                    </div>
                </div>
                <div class="border-t border-token pt-8 pb-24 flex flex-col md:flex-row justify-between items-center text-xs text-soft gap-4">
                    <p>© 2026 PixelBloxy. Not affiliated with Roblox Corporation.</p>
                    <div class="flex gap-4 text-base">
                        <a href="https://tiktok.com" class="hover:text-violet transition-colors" target="_blank" rel="noopener"><i class="fab fa-tiktok"></i></a>
                        <a href="https://discord.com" class="hover:text-violet transition-colors" target="_blank" rel="noopener"><i class="fab fa-discord"></i></a>
                        <a href="https://instagram.com" class="hover:text-violet transition-colors" target="_blank" rel="noopener"><i class="fab fa-instagram"></i></a>
                    </div>
                </div>
            </div>
        </footer>
        ${page === "product.html" ? "" : `<div class="${contactChat ? "contact-floating-actions " : ""}site-floating-chat fixed bottom-6 right-6 z-40">
            <button onclick="toggleChat()" aria-label="Open support chat" title="Open support chat" class="btn-primary px-5 py-4 rounded-full shadow-2xl flex items-center font-bold text-sm">
                <i class="fas fa-comment-dots mr-2"></i><span>Chat / Claim Order</span>
            </button>
        </div>`}
        <div id="toast" class="fixed top-24 right-4 z-[60] bg-surface border-l-4 border-emerald-500 shadow-2xl rounded-2xl p-4 flex items-center toast pointer-events-none max-w-sm">
            <div class="text-emerald-500 mr-3 text-xl"><i class="fas fa-circle-check"></i></div>
            <div><h4 class="font-bold text-sm" id="toast-title">Added to cart</h4><p class="text-soft text-xs" id="toast-message">Item added.</p></div>
        </div>
        <div id="chat-widget" class="fixed bottom-24 right-6 w-80 bg-surface rounded-3xl shadow-2xl border border-token transform scale-0 origin-bottom-right transition-transform duration-300 z-40 overflow-hidden">
            <div class="p-4 flex justify-between items-center" style="background:var(--violet)">
                <div class="text-white font-bold text-sm"><i class="fas fa-headset mr-2"></i>PixelBloxy Support</div>
                <button onclick="toggleChat()" aria-label="Close support chat" class="text-white/80 hover:text-white"><i class="fas fa-times"></i></button>
            </div>
            <div class="h-64 p-4 overflow-y-auto bg-app-soft flex flex-col gap-3" id="chat-messages">
                <div class="bg-surface p-3 rounded-2xl rounded-tl-none text-sm shadow-sm">Hi there! 👋 How can we help today?</div>
            </div>
            <div class="p-3 border-t border-token bg-surface">
                <div class="flex">
                    <input id="chat-input" type="text" placeholder="Type a message..." class="flex-1 bg-app-soft border-none rounded-l-full px-4 py-2 text-sm outline-none">
                    <button id="send-message" class="btn-primary px-4 rounded-r-full" aria-label="Send message"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
        </div>
    `;

    const headerMount = document.getElementById("site-header-shell");
    if (headerMount) {
        headerMount.insertAdjacentHTML("beforebegin", header);
        headerMount.remove();
    }

    const footerMount = document.getElementById("site-footer-shell");
    if (footerMount) {
        footerMount.insertAdjacentHTML("beforebegin", footerAndUtilities);
        footerMount.remove();
    }
})();
