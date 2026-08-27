/**
 * ============================================================================
 * Configuration Module - AlwaysOnlineMC
 * ============================================================================
 */

require('dotenv').config({ override: true });

function parseBool(val, fallback) {
  if (val === undefined || val === null || val === '') return fallback;
  return String(val).trim().toLowerCase() === 'true';
}

function parseIntSafe(val, fallback, min = 0, max = Infinity) {
  const parsed = parseInt(val, 10);
  if (isNaN(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

const config = {
  // Endpoints
  server: {
    primaryHost: process.env.SERVER_HOST || 'localhost',
    primaryPort: parseIntSafe(process.env.SERVER_PORT, 25565, 1, 65535),
    fallbackHost: process.env.FALLBACK_HOST || '',
    fallbackPort: parseIntSafe(process.env.FALLBACK_PORT, 25565, 1, 65535),
    enableDynamicFailover: parseBool(process.env.ENABLE_DYNAMIC_FAILOVER, false),
  },

  // Bot Profile
  bot: {
    username: process.env.BOT_USERNAME || 'YumeVanguard',
    authMode: process.env.AUTH_MODE || 'offline',
    version: (process.env.MC_VERSION && process.env.MC_VERSION.toLowerCase() !== 'auto')
      ? process.env.MC_VERSION.trim()
      : '1.21.4',
    viewDistance: process.env.VIEW_DISTANCE || 'tiny',
  },

  // Anti-AFK & Humanization
  behavior: {
    antiAfkMin: parseIntSafe(process.env.ANTI_AFK_MIN_INTERVAL, 3500, 1000, 60000),
    antiAfkMax: parseIntSafe(process.env.ANTI_AFK_MAX_INTERVAL, 9000, 2000, 120000),
    enableHumanLook: parseBool(process.env.ENABLE_HUMAN_LOOK, true),
    enablePlayerTracking: parseBool(process.env.ENABLE_PLAYER_TRACKING, true),
    enableBlockInteraction: parseBool(process.env.ENABLE_BLOCK_PLACING, true) && parseBool(process.env.ENABLE_BLOCK_INTERACTION, true),
    autoAcceptResourcePacks: parseBool(process.env.AUTO_ACCEPT_RESOURCE_PACKS, true),
    autoRespawn: parseBool(process.env.AUTO_RESPAWN, true),
  },

  // Chat Engine
  chat: {
    enableRandomChat: parseBool(process.env.ENABLE_CHAT, true) && parseBool(process.env.ENABLE_RANDOM_CHAT, true),
    enableBanglaSlang: parseBool(process.env.ENABLE_BANGLA_SLANG, true),
    enableGreetings: parseBool(process.env.ENABLE_CHAT, true) && parseBool(process.env.ENABLE_GREETINGS, true),
    enableFarewells: parseBool(process.env.ENABLE_CHAT, true) && parseBool(process.env.ENABLE_FAREWELLS, true),
    enableMentionReplies: parseBool(process.env.ENABLE_CHAT, true) && parseBool(process.env.ENABLE_MENTION_REPLIES, true),
    chatCooldownMs: parseIntSafe(process.env.CHAT_COOLDOWN_MS, 45000, 5000, 300000),
  },

  // Network & Resilience
  network: {
    reconnectBaseDelay: parseIntSafe(process.env.RECONNECT_DELAY, 10000, 3000, 60000),
    maxReconnectDelay: parseIntSafe(process.env.MAX_RECONNECT_DELAY, 45000, 10000, 300000),
    checkTimeoutInterval: parseIntSafe(process.env.TIMEOUT_INTERVAL, 60000, 10000, 120000),
    timezone: process.env.TIMEZONE || 'Asia/Dhaka',
  }
};

module.exports = config;
