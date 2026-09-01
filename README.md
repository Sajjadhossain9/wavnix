# Wavnix

Official website for **Wavnix Software Services**.

Wavnix provides custom software, AI automation, web and mobile development, education technology, domain and hosting, Meta marketing, and digital growth services.

Official domain: [wavnix.com](https://wavnix.com)

## Deployment

The site deploys as a Cloudflare Worker with static assets:

- `index.html` contains the interactive website.
- `partials/` contains the shared header and footer.
- `worker.js` handles `/api/domain-check`.
- `wrangler.jsonc` routes API requests through the Worker and serves the static site through the `ASSETS` binding.

Cloudflare build command: none  
Cloudflare deploy command: `npx wrangler deploy`

## Domain search

The domain tool uses the official IANA RDAP bootstrap to query the appropriate public registry. A result is always treated as preliminary until Wavnix confirms it with the registrar. Prices displayed on the site are Wavnix asking prices, not live Namecheap checkout prices.
