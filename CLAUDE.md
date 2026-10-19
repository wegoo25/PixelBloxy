# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the shopify store repository.

## 📋 Table of Contents
- [Development Commands](#-development-commands)
- [Architecture Overview](#-architecture-overview)
- [Folder Structure](#-folder-structure)
- [Common Tasks](#-common-tasks)

## 🛠 Development Commands

### Setup and Local Development
```bash
npm install
npm start
# Visit http://localhost:3000
```

The Express server serves the `public` site and its `/chat` endpoint from the
same origin. The local AI chat also requires Ollama and the `llama3.2` model.
Install Ollama, then run `ollama pull llama3.2` once. Keep Ollama running while
using the site; on Windows, open the Ollama app or run `ollama serve` in a
separate terminal. Check installed models with `ollama list`. If you use a
different model, set `OLLAMA_MODEL` before starting the server.

If chat says Ollama is not running, start the Ollama app/service and verify
`http://localhost:11434/api/tags` responds. If the server says the model is
missing, run `ollama pull llama3.2` (or pull the model named by `OLLAMA_MODEL`).
Then start the website with `npm start` in the repository and open
`http://localhost:3000`.

The chat receives the current Shopify product catalog with each question and
is instructed to avoid guessing product, price, stock, or policy details. For
deployment, serve `public`, proxy `/chat` to this server, and run Ollama where
the server can reach it; set `PORT`, `OLLAMA_URL`, and `OLLAMA_MODEL` as needed.
Only add verified shop policies to the system prompt in `server.js`; the model
cannot look up customer orders, so it directs order-specific questions to Live
Chat.

### Testing
Since this is a static site, testing involves:
1. Opening HTML files in a browser to verify functionality
2. Checking responsive design across different screen sizes
3. Testing interactive elements (dropdowns, modals, forms)
4. Verifying theme persistence (light/dark mode)
5. Testing cart functionality
6. Verifying product rendering from JavaScript arrays

## 🏗 Architecture Overview

This is a static e-commerce website built with HTML, CSS (Tailwind), and JavaScript.

### Core Technologies
- **HTML5**: Semantic markup for all pages
- **CSS**: Tailwind CSS for utility-first styling
- **JavaScript**: Vanilla ES6+ for interactivity
- **Icons**: Font Awesome 6.4.0
- **Fonts**: Space Grotesk, Inter, JetBrains Mono via Google Fonts

### Architecture Layers
1. **Presentation Layer** - HTML files in `/public` directory
2. **Styling Layer** - Tailwind CSS (`tailwind.css`) + custom styles (`styles.css`)
3. **Logic Layer** - JavaScript (`script.js`) handling all interactivity
4. **Asset Layer** - Images, fonts, and icons

### Key Components
- **Navigation Bar**: Fixed header with theme toggle, cart, menu, and category dropdown
- **Mobile Menu**: Slide-out drawer for navigation on small screens
- **Theme System**: Dark/light mode toggle with localStorage persistence
- **Shopping Cart**: Slide-out cart with add/remove functionality
- **Product Display**: Dynamic rendering from JavaScript arrays
- **Typing Effect**: Animated hero text on homepage
- **Chat Widget**: Floating AI support chatbot
- **Toast Notifications**: Feedback messages for user actions
- **View Counter**: Simulated live visitor count

### Data Flow
1. Product data stored in JavaScript arrays (`shopProducts`, `bestSellerProducts`)
2. On page load, `renderProducts()` function generates HTML cards from arrays
3. Shopify integration attempted first (fallback to local arrays if fails)
4. User interactions update state and re-render UI as needed
5. Cart state managed in JavaScript

## 📁 Folder Structure
```
shopify store/
├── public/
│   ├── index.html          # Homepage
│   ├── shop.html           # Shop page
│   ├── categories.html     # Categories page
│   ├── help.html           # Help/FAQ page
│   ├── contact.html        # Contact page
│   ├── script.js           # Main JavaScript logic
│   ├── tailwind.css        # Tailwind CSS base
│   └── styles.css          # Custom styles
└── CLAUDE.md               # This file
```

## 🛠 Common Tasks

### Adding New Products
1. Edit `script.js`
2. Delete all product arrays (The products are gonna be added automatically through Shopify)
4. Ensure product has: id, title, image, price, was (optional), category, inventory, available, variantId 

### Modifying Site Content
1. Edit the relevant HTML file for text/content changes
2. Update Tailwind classes for styling changes
3. Modify `script.js` for behavior changes
4. Modify the dropdown menu so it fits the text

### Changing Theme Colors
1. Edit `tailwind.css` to modify color palette
2. Or adjust CSS variables in `styles.css`

### Updating Navigation
1. Update navigation links in all HTML files (header and mobile menu)
2. Update category dropdown in all HTML files
3. Update footer links in all HTML files
4. Add all the missing links like the Discord link

### Troubleshooting
- **Dropdown not working**: Verify event listeners in `script.js`
- **Cart not updating**: Check `addToCart()` function and event listeners
- **Theme not persisting**: Verify localStorage usage in theme toggle
- **Search not working**: Check `runSearch()` function and navigation logic
- **Chat not opening**: Verify `toggleChat()` function and element IDs