/**
 * ============================================================================
 * AlwaysBotMC - Production 24/7 Minecraft Anti-AFK Bot
 * Target: Minecraft Java Edition (PC) 1.21.4 (Protocol 769)
 * ============================================================================
 */

require('dotenv').config({ override: true });
const mineflayer = require('mineflayer');
const config = require('./src/config');
const logger = require('./src/logger');
const Humanizer = require('./src/humanizer');
const ChatEngine = require('./src/chatEngine');
const failover = require('./src/failover');

let activeBot = null;
let humanizer = null;
let chatEngine = null;
let reconnectTimer = null;
let isShuttingDown = false;

// ---------------------------------------------------------
// Application Banner
// ---------------------------------------------------------
logger.banner(
  `AlwaysBotMC 24/7 Engine v2.5.0 [${config.bot.username}]`,
  `Target: MC ${config.bot.version} | PC / Java Edition Server`
);

logger.info(`Initialized with configuration:`);
logger.info(`• Primary Host: ${config.server.primaryHost}:${config.server.primaryPort}`);
if (config.server.fallbackHost && config.server.fallbackHost !== config.server.primaryHost) {
  logger.info(`• Dynamic Fallback: ${config.server.fallbackHost}:${config.server.fallbackPort}`);
}
logger.info(`• Bot Identity: ${config.bot.username} (Auth: ${config.bot.authMode})`);
logger.info(`• Anti-AFK Frequency: ${config.behavior.antiAfkMin / 1000}s - ${config.behavior.antiAfkMax / 1000}s`);

// ---------------------------------------------------------
// Bot Lifecycle Management
// ---------------------------------------------------------
function cleanup() {
  if (humanizer) {
    humanizer.stop();
    humanizer = null;
  }
  if (chatEngine) {
    chatEngine.stop();
    chatEngine = null;
  }
  if (activeBot) {
    activeBot.isReady = false;
    activeBot.removeAllListeners();
    try {
      activeBot.quit();
    } catch (e) {}
    activeBot = null;
  }
}

function scheduleReconnect(reason = 'Connection lost') {
  if (isShuttingDown || reconnectTimer) return;

  cleanup();
  failover.recordFailure();

  const delayMs = failover.getReconnectDelay();
  const nextEndpoint = failover.getCurrentEndpoint();

  logger.warn(`${reason}. Reconnecting to ${nextEndpoint.label} in ${(delayMs / 1000).toFixed(1)}s...`);

  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    await startBot();
  }, delayMs);
}

async function startBot() {
  if (isShuttingDown) return;

  cleanup();

  const endpoint = await failover.getNextViableEndpoint();
  logger.info(`Connecting to ${endpoint.label} (${endpoint.host}:${endpoint.port})...`);

  const botOptions = {
    host: endpoint.host,
    port: endpoint.port,
    username: config.bot.username,
    auth: config.bot.authMode,
    version: config.bot.version || false,
    viewDistance: config.bot.viewDistance,
    checkTimeoutInterval: config.network.checkTimeoutInterval,
    keepAlive: true,
    hideErrors: true,
  };

  let bot;
  try {
    bot = mineflayer.createBot(botOptions);
    activeBot = bot;
  } catch (err) {
    logger.warn(`Server connection initial handshake note: ${err.message}`);
    scheduleReconnect('Handshake retry');
    return;
  }

  bot.isReady = false;
  bot.isRespawning = false;

  // Instantiate Subsystems
  humanizer = new Humanizer(bot);
  chatEngine = new ChatEngine(bot);

  // -------------------------------------------------------
  // Core Events
  // -------------------------------------------------------
  bot.on('login', () => {
    logger.success(`Logged in successfully to ${endpoint.host}:${endpoint.port}!`);
    failover.recordSuccess();
    bot.isRespawning = false;
  });

  bot.on('spawn', () => {
    bot.isReady = true;
    bot.isRespawning = false;

    const pos = bot.entity ? bot.entity.position : { x: 0, y: 0, z: 0 };
    logger.success(`Spawned in world at (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)})`);

    // Launch humanizer and chat engine after world settlement
    setTimeout(() => {
      if (bot.isReady && humanizer && chatEngine) {
        logger.info('Engaging Humanizer movement engine & Chat modules...');
        humanizer.start();
        chatEngine.start();
      }
    }, 2500);
  });

  // Resource pack acceptance
  if (config.behavior.autoAcceptResourcePacks) {
    bot.on('resourcePack', () => {
      logger.info('Server requested resource pack. Accepting automatically...');
      try {
        bot.acceptResourcePack();
      } catch (err) {
        logger.warn(`Resource pack acceptance note: ${err.message}`);
      }
    });
  }

  // Health and food alert
  bot.on('health', () => {
    if (bot.health !== undefined && bot.health <= 6 && bot.health > 0) {
      logger.warn(`Low Health: ${bot.health.toFixed(1)}/20 HP | Food: ${bot.food}/20`);
    }
  });

  // Death and auto-respawn
  bot.on('death', () => {
    logger.warn('Bot died! Initiating auto-respawn sequence...');
    bot.isRespawning = true;
    bot.isReady = false;

    if (humanizer) humanizer.stop();

    // Auto-dismount from vehicle if any
    if (bot.vehicle) {
      try {
        bot.dismount();
      } catch (e) {}
    }

    if (config.behavior.autoRespawn) {
      setTimeout(() => {
        try {
          logger.info('Sending respawn request packet...');
          bot.respawn();
        } catch (err) {
          logger.warn(`Respawn attempt failed (${err.message}). Retrying in 3s...`);
          setTimeout(() => {
            try {
              bot.respawn();
            } catch (e) {
              logger.error(`Second respawn attempt failed: ${e.message}`);
            }
          }, 3000);
        }
      }, 2500);
    }
  });

  // Player Join & Leave hooks
  bot.on('playerJoined', (player) => {
    logger.info(`Player joined: ${player.username}`);
    if (chatEngine) chatEngine.handlePlayerJoin(player);
  });

  bot.on('playerLeft', (player) => {
    logger.info(`Player left: ${player.username}`);
    if (chatEngine) chatEngine.handlePlayerLeave(player);
  });

  // Track inventory collection
  bot.on('playerCollect', (collector) => {
    if (collector && collector.username === bot.username) {
      logger.info('Picked up items into inventory! Ready for block placing.');
    }
  });

  // Chat message listener
  bot.on('chat', (username, message) => {
    logger.chat(`<${username}> ${message}`);
    if (chatEngine) chatEngine.handleIncomingMessage(username, message);
  });

  bot.on('message', (jsonMsg) => {
    const text = jsonMsg.toString().trim();
    if (text && !text.startsWith('<')) {
      logger.chat(`[Server] ${text}`);
    }
  });

  // Disconnect & Error Handlers
  bot.on('kicked', (reason) => {
    const reasonText = typeof reason === 'object' ? JSON.stringify(reason) : reason;
    scheduleReconnect(`Kicked: ${reasonText}`);
  });

  bot.on('end', (reason) => {
    scheduleReconnect(`Connection ended (${reason || 'Server restart/offline'})`);
  });

  bot.on('error', (err) => {
    const msg = err.message || '';
    const code = err.code || '';
    const isRestarting =
      code === 'ECONNRESET' ||
      code === 'ECONNREFUSED' ||
      code === 'ETIMEDOUT' ||
      code === 'ENOTFOUND' ||
      code === 'EHOSTUNREACH' ||
      code === 'EPIPE' ||
      msg.includes('ECONNRESET') ||
      msg.includes('timed out');

    if (isRestarting) {
      logger.warn(`Server is offline or restarting (${code || msg}). Waiting for server...`);
      scheduleReconnect(`Server rebooting (${code || 'offline'})`);
    } else {
      logger.error(`Bot socket notice: ${msg}`);
      scheduleReconnect(`Socket issue: ${msg}`);
    }
  });
}

// ---------------------------------------------------------
// Global Process Management
// ---------------------------------------------------------
process.on('uncaughtException', (err) => {
  const code = err?.code || '';
  const msg = err?.message || String(err || '');
  const isConnError =
    code === 'ECONNRESET' ||
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT' ||
    code === 'EPIPE' ||
    msg.includes('ECONNRESET') ||
    msg.includes('socketClosed') ||
    msg.includes('write') ||
    msg.includes('read');

  if (isConnError) {
    logger.warn(`Server network reset during reboot (${code || 'ECONNRESET'}). Retrying...`);
  } else {
    logger.error(`Exception notice: ${msg}`);
  }

  if (!reconnectTimer && (!activeBot || !activeBot.isReady)) {
    scheduleReconnect('Process recovery');
  }
});

process.on('unhandledRejection', (reason) => {
  const str = String(reason);
  if (!str.includes('ECONNRESET') && !str.includes('socketClosed')) {
    logger.warn(`Async notice: ${str}`);
  }
});

function handleShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('');
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  cleanup();
  logger.success('AlwaysBotMC safely disconnected. Goodbye! ⚔️');
  process.exit(0);
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

// Launch
startBot();