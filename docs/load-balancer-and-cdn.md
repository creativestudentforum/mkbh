# Production Load Balancer and CDN Setup Guide

This guide outlines how to deploy AlumniHub with high-availability load balancing, Edge CDN caching, and payload compression.

## 1. Load Balancing Architectures

### Option A: PM2 Cluster Mode (Single Server / VPS)
Runs multiple Node.js worker threads balancing incoming requests across all CPU cores:
```bash
npm install -g pm2
npm run build
pm2 start ecosystem.config.js
```
- **Zero downtime reload**: `pm2 reload ecosystem.config.js`
- **Monitoring**: `pm2 monit`

### Option B: Nginx Reverse Proxy / Load Balancer
Nginx acts as the front-facing gateway balancing across multiple Next.js instances:
- Config located at `nginx/load-balancer.conf`
- Uses `least_conn` algorithm to route requests to the least busy worker.
- Gzip payload compression enabled for fast client transfers.
- Static assets (`/_next/static/*`) cached with `Cache-Control: public, max-age=31536000, immutable`.

### Option C: Docker Compose Cluster
Launch 2+ Next.js application instances behind an Nginx load balancer:
```bash
docker compose up -d --scale app1=2 --build
```

---

## 2. CDN (Content Delivery Network) Configuration

### Static Assets & Global CDN
1. **Cloudflare CDN**:
   - Point your DNS A record to your server or load balancer IP through Cloudflare (orange-cloud proxied).
   - Enable **Cloudflare Auto Minify** (JS/CSS/HTML) and **Brotli Compression**.
   - Create a Cache Rule for `*.example.com/_next/static/*`:
     - Cache Level: *Cache Everything*
     - Edge Cache TTL: *1 month*
     - Browser Cache TTL: *1 year*

2. **Cloudinary Global Image CDN**:
   - All uploaded avatars and gallery images automatically route through Cloudinary's Akamai/Fastly CDN.
   - Dynamic on-the-fly transformations deliver WebP/AVIF format (`f_auto,q_auto`) resized to device screen width.
