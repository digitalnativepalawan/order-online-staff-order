// Loyalty stamp program utilities

export const STAMP_PER_AMOUNT = 500; // 1 stamp per ₱500

export const TIER_THRESHOLDS = {
  regular: { min: 0, max: 19, multiplier: 1 },
  silver: { min: 20, max: 49, multiplier: 1.25 },
  gold: { min: 50, max: Infinity, multiplier: 1.5 },
};

export const REWARD_THRESHOLDS = [
  { stamps: 5, type: "free_item", label: "Free item up to ₱500" },
  { stamps: 10, type: "discount_10", label: "10% off" },
  { stamps: 20, type: "discount_20", label: "20% off" },
  { stamps: 30, type: "priority", label: "VIP priority + 20% off" },
];

export function getTier(lifetimeStamps: number): string {
  if (lifetimeStamps >= 50) return "gold";
  if (lifetimeStamps >= 20) return "silver";
  return "regular";
}

export function getTierMultiplier(tier: string): number {
  switch (tier) {
    case "gold": return 1.5;
    case "silver": return 1.25;
    default: return 1;
  }
}

export function calculateStamps(orderTotal: number, tier: string): number {
  const base = Math.floor(orderTotal / STAMP_PER_AMOUNT);
  return Math.floor(base * getTierMultiplier(tier));
}

export function getNextRewardThreshold(currentStamps: number): typeof REWARD_THRESHOLDS[0] | null {
  for (const r of REWARD_THRESHOLDS) {
    if (currentStamps < r.stamps) return r;
  }
  return null;
}

export function getEarnedReward(stampCount: number): typeof REWARD_THRESHOLDS[0] | null {
  // Find highest threshold crossed
  let earned: typeof REWARD_THRESHOLDS[0] | null = null;
  for (const r of REWARD_THRESHOLDS) {
    if (stampCount >= r.stamps) earned = r;
  }
  return earned;
}

export function generateRewardCode(rewardType: string): string {
  const typeMap: Record<string, string> = {
    free_item: "FREE",
    discount_10: "D10",
    discount_20: "D20",
    priority: "VIP",
  };
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let rand = "";
  for (let i = 0; i < 4; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `JAYCEE-${typeMap[rewardType] || "RWD"}-${rand}`;
}

export function getDiscountPercent(rewardType: string): number {
  switch (rewardType) {
    case "discount_10": return 10;
    case "discount_20": return 20;
    case "priority": return 20;
    default: return 0;
  }
}

export const TIER_COLORS: Record<string, string> = {
  regular: "bg-secondary text-foreground",
  silver: "bg-blue-500/15 text-blue-600 border-blue-300",
  gold: "bg-amber-500/15 text-amber-600 border-amber-300",
};
