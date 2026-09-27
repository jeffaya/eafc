import { readFileSync } from "node:fs";

const config = JSON.parse(
  readFileSync(new URL("../club.config.json", import.meta.url), "utf8")
);

for (const key of ["clubId", "clubName", "platform", "timezone"]) {
  if (!config[key]) {
    throw new Error(`Missing "${key}" in club.config.json`);
  }
}

export const CLUB_ID = String(config.clubId);
export const CLUB_NAME = config.clubName;
export const PLATFORM = config.platform;
export const TIME_ZONE = config.timezone;
export const MAX_PROCESSED_IDS = 80;
