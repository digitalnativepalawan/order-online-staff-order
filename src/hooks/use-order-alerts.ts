import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SOUND_KEY = "admin_sound_enabled";
const LAST_VIEWED_KEY = "admin_orders_last_viewed";
const NOTIFICATION_URL = "/notification.mp3";

function playChime(enabled: boolean) {
  if (!enabled) return;
  // Try MP3 first
  const audio = new Audio(NOTIFICATION_URL);
  audio.volume = 0.6;
  audio.play().catch(() => {
    // Fallback: Web Audio API ding
    try {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
      const ctx = new Ctx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
      o.start(); o.stop(ctx.currentTime + 0.45);
    } catch {}
  });
}

export function useSoundEnabled() {
  const [enabled, setEnabled] = useState(() => {
    const v = localStorage.getItem(SOUND_KEY);
    return v === null ? true : v === "true";
  });
  const toggle = useCallback(() => {
    setEnabled(prev => {
      const next = !prev;
      localStorage.setItem(SOUND_KEY, String(next));
      return next;
    });
  }, []);
  return { enabled, toggle };
}

export function useUnviewedOrders(orders: any[] | undefined) {
  const [lastViewed, setLastViewed] = useState<number>(() => {
    const v = localStorage.getItem(LAST_VIEWED_KEY);
    return v ? parseInt(v, 10) : Date.now();
  });

  const markViewed = useCallback(() => {
    const now = Date.now();
    localStorage.setItem(LAST_VIEWED_KEY, String(now));
    setLastViewed(now);
  }, []);

  const unviewedCount = orders
    ? orders.filter(o => new Date(o.created_at).getTime() > lastViewed && o.order_status === "pending").length
    : 0;

  return { unviewedCount, markViewed, lastViewed };
}

export function useOrderRealtime(soundEnabled: boolean) {
  const qc = useQueryClient();
  const soundRef = useRef(soundEnabled);
  soundRef.current = soundEnabled;

  useEffect(() => {
    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const o: any = payload.new;
          qc.invalidateQueries({ queryKey: ["admin-orders"] });
          qc.invalidateQueries({ queryKey: ["admin-orders-full"] });
          playChime(soundRef.current);
          toast.success(`🔔 New order from ${o.customer_name} — ₱${Number(o.total_price).toFixed(2)}`, {
            duration: 6000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}
