# PixelBloxy

A Shopify Storefront-powered product site. The frontend is in `public/`; the Express server serves it and provides the `/chat` endpoint.

## Run locally

1. Install Node.js and Ollama.
2. Shopify product/cart access is configured in `public/shopify.js` with a
   public Storefront API token. Use only the minimum public Storefront scopes;
   never put an Admin API token or app secret in browser code.
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

## Deploying to GitHub Pages

The `main` branch publishes `public/` through `.github/workflows/deploy.yml`.

1. Create a GitHub repository and push the project files, including `public/`, `server.js`, `package.json`, `package-lock.json`, `.gitignore`, and this README. Do not commit `node_modules/` or private credentials.
2. Push to the `main` branch.

3. In Render, create a **Blueprint** from the repository's `main` branch if you want the chat backend. Render reads `render.yaml`. Set `OLLAMA_URL` to a remotely reachable Ollama endpoint; `localhost` on Render is the Render machine, not your PC.
4. Copy the deployed Render service URL, for example `https://pixelbloxy-api.onrender.com`.
5. In GitHub, open **Settings → Secrets and variables → Actions → Variables** and add `PIXELBLOXY_API_URL` with that Render URL. This URL is public, so it is a repository variable, not a secret.
6. In **Settings → Pages**, set **Build and deployment → Source** to **GitHub Actions**. Push to `main` or rerun its workflow. The preview is published at `https://<account>.github.io/<repository>/` and uses Render only for chat.

GitHub Pages is static. Shopify product/cart requests go directly to the Storefront API from the browser. The Express `/chat` route and Ollama model run on Render if configured. The Storefront token is public by design and must have only public Storefront permissions. The old token was previously committed, so rotate it in Shopify before relying on it.
