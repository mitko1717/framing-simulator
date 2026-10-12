# Framing Simulator

An interactive camera simulator that teaches framing and composition through hands-on lessons.

## Features

- Explore eight lessons covering horizons, leading lines, portraits, camera angles, and more.
- Adjust camera distance, height, focal length, rotation, tilt, and roll.
- See framing feedback, complete lesson checks, and reveal suggested solutions.
- Capture shots and compare them in the shot feed.

## Getting started

Requirements: Node.js 22 or later and npm.

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the simulator.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Build the app and its Cloudflare Worker bundle with OpenNext. |
| `npm run preview` | Build and preview the Worker locally. |
| `npm run deploy` | Build and deploy the Worker to Cloudflare. |
| `npm run typecheck` | Check TypeScript types. |

## Deployment

This project uses [OpenNext for Cloudflare](https://opennext.js.org/cloudflare) to deploy to Cloudflare Workers. Set the Cloudflare build command to `npm run build` and deploy with Wrangler. The Next.js version is pinned to 16.3.8 because OpenNext 1.20.10 does not yet support the preview-props manifest introduced in Next.js 16.4.
