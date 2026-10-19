# PixelBloxy

A Shopify Storefront-powered product site. The frontend is in `public/`; the Express server serves it and provides the `/chat` endpoint.

## Run locally

1. Install Node.js and Ollama.
2. Start Ollama and install the model once:

   ```powershell
   ollama pull llama3.2
   ```

3. From the project folder, install dependencies and start the site:

   ```powershell
   npm install
   npm start
   ```

4. Open `http://localhost:3000`.

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

GitHub Pages hosts static files only. The storefront can be previewed there, but the local Express `/chat` endpoint and Ollama model do not run on GitHub Pages. To test AI chat in a deployed preview, host the Express server and Ollama separately on a machine reachable from the browser, or use a hosted model API, then configure a secure `/chat` proxy. Never expose the Ollama port or commit private API keys.
