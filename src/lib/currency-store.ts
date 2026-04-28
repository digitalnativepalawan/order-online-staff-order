import { useEffect, useState } from "react";

export type CurrencyCode = "PHP" | "USD" | "EUR";

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  PHP: "₱",
  USD: "$",
  EUR: "€",
};

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  PHP: "Philippine Peso",
  USD: "US Dollar",
  EUR: "Euro",
};

const KEY = "preferred-currency";

type Listener = (c: CurrencyCode) => void;
const listeners = new Set<Listener>();

export function getStoredCurrency(fallback: CurrencyCode = "PHP"): CurrencyCode {
  if (typeof window === "undefined") return fallback;
  const v = localStorage.getItem(KEY) as CurrencyCode | null;
  return v && v in CURRENCY_SYMBOLS ? v : fallback;
}

export function setStoredCurrency(c: CurrencyCode) {
  localStorage.setItem(KEY, c);
  listeners.forEach((l) => l(c));
}

export function useCurrency(defaultCurrency: CurrencyCode = "PHP") {
  const [currency, setCurrency] = useState<CurrencyCode>(() => getStoredCurrency(defaultCurrency));
  useEffect(() => {
    const l: Listener = (c) => setCurrency(c);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return {
    currency,
    symbol: CURRENCY_SYMBOLS[currency],
    setCurrency: setStoredCurrency,
  };
}