/** Single source of truth so every admin page agrees on capacity and time zone. */
export const GYM_CAPACITY = 120;
export const GYM_TIME_ZONE = "Asia/Manila";

/** YYYY-MM-DD in the gym's time zone. */
export const gymDayKey = (value: Date | string | number) =>
  new Date(value).toLocaleDateString("en-CA", { timeZone: GYM_TIME_ZONE });

export const formatMoney = (amount: number) =>
  amount >= 1000
    ? `$${(amount / 1000).toFixed(1)}K`
    : `$${Math.round(amount).toLocaleString("en-US")}`;
