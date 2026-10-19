# PixelBloxy

A Shopify Storefront-powered product site. The frontend is in `public/`; the Express server serves it and provides the `/chat` endpoint.

## Run locally

1. Install Node.js and Ollama.
2. Copy `.env.example` to `.env` and enter your Shopify Storefront credentials:

   ```powershell
   Copy-Item .env.example .env
   ```

   Set `SHOPIFY_STORE_DOMAIN` to your `*.myshopify.com` domain and
   `SHOPIFY_STOREFRONT_TOKEN` to a Storefront API token. `.env` is ignored by
   Git; never commit it. Use a Storefront token with only the required public
   storefront permissions, not an Admin API token.

3. Start Ollama and install the model once:

   ```powershell
   ollama pull llama3.2
   ```

4. From the project folder, install dependencies and start the site:

   ```powershell
   npm install
   npm start
   ```

5. Open `http://localhost:3000`.

Keep Ollama running while testing chat. If it is not already running as a desktop service, start it in another terminal with `ollama serve`.

## Beta preview on GitHub Pages

The `beta` branch deploys only `public/` through `.github/workflows/deploy-beta.yml`.

1. Create a GitHub repository and push the project files, including `public/`, `server.js`, `package.json`, `package-lock.json`, `.gitignore`, and this README. Do not commit `node_modules/`, `.env`, or private credentials.
2. Push your preview work to a branch named `beta`:

   ```powershell
   git switch -c beta
   git push -u origin beta
   ```

3. In the GitHub repository, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
4. Push commits to `beta`. The workflow publishes a preview at `https://<account>.github.io/<repository>/`.

GitHub Pages hosts static files only. The storefront can be previewed there, but Shopify product/cart requests now use the Express `/api/shopify` proxy, so product data and cart operations will not work on Pages by themselves. The local Express `/chat` endpoint and Ollama model also do not run on Pages. For a fully functional deployment, host this Express server on a persistent service, set `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_TOKEN`, `OLLAMA_URL`, and `OLLAMA_MODEL` in that service's environment, and configure the frontend to use that backend. Never expose the Ollama port or commit `.env`/private API keys.
