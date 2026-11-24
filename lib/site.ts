export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SCHOOL_NAME || "M.K.B.H High School",
  shortName: process.env.NEXT_PUBLIC_SCHOOL_SHORT_NAME || "MKBH Alumni",
  tagline: process.env.NEXT_PUBLIC_SCHOOL_TAGLINE || "Official alumni network for verified members.",
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    "Official alumni network for M.K.B.H High School (Established 1989, EIIN: 109626). Verified alumni network, cohort batches, events, treasury ledger, and digital ID verification.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://mkbhalumni.vercel.app",
  logo: "/logo.png",
  payment: {
    bkash: process.env.NEXT_PUBLIC_PAYMENT_BKASH || "",
    nagad: process.env.NEXT_PUBLIC_PAYMENT_NAGAD || "",
    bank: process.env.NEXT_PUBLIC_PAYMENT_BANK || "",
    accountName: process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT_NAME || "M.K.B.H High School Alumni Association",
  },
};
