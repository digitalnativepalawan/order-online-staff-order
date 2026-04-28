import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "jaycee_nav_visibility";

export interface NavItem {
  key: string;
  label: string;
  path: string;
  visible: boolean;
}

const DEFAULT_HIDDEN_ITEMS: NavItem[] = [
  { key: "faq", label: "FAQ", path: "/faq", visible: false },
  { key: "about", label: "About", path: "/about", visible: false },
  { key: "contact", label: "Contact", path: "/contact", visible: false },
  { key: "testimonials", label: "Testimonials", path: "/testimonials", visible: false },
];

function loadNavItems(): NavItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Record<string, boolean>;
      return DEFAULT_HIDDEN_ITEMS.map(item => ({
        ...item,
        visible: saved[item.key] ?? item.visible,
      }));
    }
  } catch {}
  return DEFAULT_HIDDEN_ITEMS;
}

function saveNavItems(items: NavItem[]) {
  const map: Record<string, boolean> = {};
  items.forEach(i => { map[i.key] = i.visible; });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event("nav-visibility-changed"));
}

export function useNavVisibility() {
  const [items, setItems] = useState<NavItem[]>(loadNavItems);

  useEffect(() => {
    const handler = () => setItems(loadNavItems());
    window.addEventListener("nav-visibility-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("nav-visibility-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const toggleItem = useCallback((key: string) => {
    setItems(prev => {
      const updated = prev.map(i => i.key === key ? { ...i, visible: !i.visible } : i);
      saveNavItems(updated);
      return updated;
    });
  }, []);

  const visibleItems = items.filter(i => i.visible);

  return { items, visibleItems, toggleItem };
}
