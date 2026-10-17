import { siteConfig } from "@/lib/site";

export async function GET() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <rect width="1200" height="630" fill="#0a0a0a"/>
      <circle cx="930" cy="60" r="360" fill="#ff6363" opacity="0.16"/>
      <circle cx="160" cy="560" r="260" fill="#ff9a63" opacity="0.10"/>
      <rect x="80" y="80" width="1040" height="470" rx="36" fill="#141414" stroke="rgba(255,255,255,0.10)"/>
      <text x="120" y="180" fill="#ff9a63" font-family="Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="3">ALUMNI NETWORK</text>
      <text x="120" y="300" fill="#fafafa" font-family="Arial, sans-serif" font-size="76" font-weight="800">${siteConfig.name}</text>
      <text x="120" y="375" fill="#a0a0a0" font-family="Arial, sans-serif" font-size="34">${siteConfig.tagline}</text>
      <text x="120" y="475" fill="#777" font-family="Arial, sans-serif" font-size="24">Directory · Events · Gallery · Fund · Digital ID</text>
    </svg>
  `;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
