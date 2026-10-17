export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SCHOOL_NAME || "AlumniHub",
  shortName: process.env.NEXT_PUBLIC_SCHOOL_SHORT_NAME || "AlumniHub",
  tagline: process.env.NEXT_PUBLIC_SCHOOL_TAGLINE || "Private alumni network for verified members.",
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    "A private alumni network for verified members, events, directory, gallery, fund ledger, and digital ID verification.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  payment: {
    bkash: process.env.NEXT_PUBLIC_PAYMENT_BKASH || "",
    nagad: process.env.NEXT_PUBLIC_PAYMENT_NAGAD || "",
    bank: process.env.NEXT_PUBLIC_PAYMENT_BANK || "",
    accountName: process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT_NAME || "Alumni Association Committee",
  },
};
