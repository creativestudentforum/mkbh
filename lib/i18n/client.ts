"use client";

import { useSyncExternalStore } from "react";
import { dictionaries, type I18nKey, type Lang } from "./dictionaries";

function readCookieLang(): Lang {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|; )lang=(en|bn)(?:;|$)/);
  return (match?.[1] as Lang | undefined) || "en";
}

export function useI18n() {
  const lang = useSyncExternalStore<Lang>(
    (callback) => {
      window.addEventListener("languagechange", callback);
      return () => window.removeEventListener("languagechange", callback);
    },
    readCookieLang,
    () => "en"
  );

  const setLang = (nextLang: Lang) => {
    document.cookie = `lang=${nextLang}; path=/; max-age=31536000; samesite=lax`;
    window.dispatchEvent(new Event("languagechange"));
  };

  const t = (key: I18nKey) => dictionaries[lang][key] || dictionaries.en[key];

  return { lang, setLang, t };
}

export function translateTitle(title: string | undefined, t: (key: I18nKey) => string) {
  const titleMap: Record<string, I18nKey> = {
    Dashboard: "dashboard.title",
    "Alumni Directory": "nav.directory",
    Events: "events.title",
    Batches: "nav.batches",
    "My Profile": "nav.profile",
    Teachers: "nav.teachers",
    Gallery: "nav.gallery",
    "Blood Finder": "nav.blood",
    Fund: "nav.fund",
    "In Memoriam": "nav.memorial",
    "Digital ID": "nav.idCard",
    "User Management": "nav.users",
    "Manage Teachers": "nav.manageTeachers",
    "Manage Events": "nav.manageEvents",
    "Manage Batches": "nav.manageBatches",
    "Manage Gallery": "nav.manageGallery",
    "Alumni Roster": "nav.roster",
    "Manage Fund": "nav.manageFund",
    "Manage Memorials": "nav.manageMemorial",
  };

  return title && titleMap[title] ? t(titleMap[title]) : title;
}
