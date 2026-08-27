/**
 * ============================================================================
 * Chat Engine Module - AlwaysBotMC
 * Clean text-only chat, Bangla slangs, gamer & anime quotes, mention handling
 * ============================================================================
 */

const logger = require('./logger');
const config = require('./config');

const IDLE_QUOTES = [
  // YumeZone & General Gaming
  "Welcome to YumeZone.",
  "YumeVanguard standing guard over YumeZone.",
  "Dreams become reality in YumeZone.",
  "Powered by YumeZone. Always online 24/7.",
  "Guarding the server for Weber and the squad.",
  "In YumeZone, the grind never stops.",
  "AFK in body, vigilant in spirit.",
  "The realm is safe under my watch.",
  "Mining diamonds, living legends.",
  "24/7 guardian of this world.",
  "Lag is temporary, glory is eternal.",
  "Crafting greatness one tick at a time.",
  "Standing guard while everyone sleeps.",
  "Always online, never offline.",
  "Just chilling in the Overworld.",

  // Classic Anime
  "Yokoso, watashi no Soul Society e.",
  "Bankai: Minazuki.",
  "Tatakae! If you don't fight, you can't win.",
  "Omae wa mou shindeiru.",
  "Gomu Gomu no Red Hawk!",
  "Dattebayo! The grind never stops.",
  "I will surpass my limits, right here, right now!",
  "Shinra Tensei!",
  "Domain Expansion: Infinite Void.",
  "Stand proud, you are strong.",
  "Whatever you lose, you will find it again.",
  "I alone will stand at the top.",
  "A sword wields no strength unless the hand that holds it has courage.",
  "Kamehameha!",
  "Rasengan!",
  "Sasageyo! Shinzou wo Sasageyo!"
];

const BANGLA_SLANGS = [
  "Kire mama, ki obostha?",
  "Pera nai mama, ekdom chill.",
  "Ami to 24/7 AFK mama.",
  "Dhur bal, lag ditesi naki?",
  "Kono pera nai, shob thik ache.",
  "Ghum dio na mama, grind chalao.",
  "Kire polapan, ki khobor shobar?",
  "Ekdom chupchap mining kortesi.",
  "Bhai keu diamond pele amake diyo.",
  "Weber bhai er shathe keu panga nio na.",
  "Server on rakhbo 24 ghonta, pera chara.",
  "Ami achi to shob chill.",
  "Khali ghure fire block bhangtesi.",
  "Ki obostha bhai shokol?",
  "Bhai akash theke porlam naki?"
];

const GREETINGS = [
  "Welcome back, {player}!",
  "Yo {player}! Good to see you in YumeZone!",
  "Greetings, {player}! The server awaits!",
  "Hey {player}! Welcome to the world!",
  "Yokoso {player}! Let's build something epic!"
];

const BANGLA_GREETINGS = [
  "Kire {player} mama! Ki obostha?",
  "Arey {player} bhai ashche! Welcome mama!",
  "Yo {player}! Kemon choltese shob?"
];

const WEBER_GREETINGS = [
  "Welcome back, Lord Weber! YumeZone is secure.",
  "Master Weber has joined the server! All hail!",
  "Creator Weber is online! YumeZone at your command.",
  "Yokoso, Weber bhai! Server pura ready ache."
];

const FAREWELLS = [
  "See you later, {player}! Take care.",
  "Farewell {player}, until next time in YumeZone.",
  "Safe travels, {player}."
];

const MENTION_RESPONSES = [
  "I'm here! Guarding YumeZone 24/7.",
  "Always active, always watching for Weber.",
  "Need assistance or just saying hi?",
  "Standing by and keeping the server alive.",
  "Yokoso! YumeVanguard never sleeps.",
  "Bolo mama ki dorkar? Ami to online achi."
];

class ChatEngine {
  constructor(bot) {
    this.bot = bot;
    this.lastChatTime = 0;
    this.idleChatInterval = null;
  }

  start() {
    if (!config.chat.enableRandomChat) return;

    // Periodic idle chat
    this.idleChatInterval = setInterval(() => {
      this.triggerIdleChat();
    }, 60000 + Math.random() * 60000);
  }

  stop() {
    if (this.idleChatInterval) {
      clearInterval(this.idleChatInterval);
      this.idleChatInterval = null;
    }
  }

  canSendChat() {
    const now = Date.now();
    return (now - this.lastChatTime >= config.chat.chatCooldownMs);
  }

  send(message) {
    if (!this.bot || !this.bot.isReady || !this.canSendChat()) return;

    try {
      this.lastChatTime = Date.now();
      logger.chat(`[Sending] "${message}"`);
      this.bot.chat(message);
    } catch (err) {
      logger.warn(`Could not send chat: ${err.message}`);
    }
  }

  triggerIdleChat() {
    if (!this.canSendChat()) return;

    if (Math.random() < 0.25) {
      let pool = [...IDLE_QUOTES];
      if (config.chat.enableBanglaSlang) {
        pool = [...pool, ...BANGLA_SLANGS];
      }
      const quote = pool[Math.floor(Math.random() * pool.length)];
      this.send(quote);
    }
  }

  handlePlayerJoin(player) {
    if (!config.chat.enableGreetings || !player || player.username === this.bot.username) return;

    const usernameLower = player.username.toLowerCase();
    const isWeber = usernameLower.includes('weber') || usernameLower.includes('otakuweber');

    setTimeout(() => {
      if (this.canSendChat()) {
        if (isWeber) {
          const weberMsg = WEBER_GREETINGS[Math.floor(Math.random() * WEBER_GREETINGS.length)];
          this.send(weberMsg);
        } else if (Math.random() > 0.3) {
          let pool = GREETINGS;
          if (config.chat.enableBanglaSlang && Math.random() > 0.5) {
            pool = BANGLA_GREETINGS;
          }
          const template = pool[Math.floor(Math.random() * pool.length)];
          this.send(template.replace('{player}', player.username));
        }
      }
    }, 2500);
  }

  handlePlayerLeave(player) {
    if (!config.chat.enableFarewells || !player || player.username === this.bot.username) return;
    if (this.canSendChat() && Math.random() > 0.6) {
      const template = FAREWELLS[Math.floor(Math.random() * FAREWELLS.length)];
      this.send(template.replace('{player}', player.username));
    }
  }

  handleIncomingMessage(username, rawMessage) {
    if (!username || username === this.bot.username) return;

    const lower = rawMessage.toLowerCase();
    const botName = this.bot.username.toLowerCase();

    // Check if bot is mentioned or greeted directly
    const isMentioned = lower.includes(botName) ||
      lower.includes('yume') ||
      (lower.includes('bot') && (lower.includes('hi') || lower.includes('hello') || lower.includes('hey') || lower.includes('status') || lower.includes('kire')));

    if (isMentioned && config.chat.enableMentionReplies && this.canSendChat()) {
      setTimeout(() => {
        const reply = MENTION_RESPONSES[Math.floor(Math.random() * MENTION_RESPONSES.length)];
        this.send(`@${username} ${reply}`);
      }, 1500 + Math.random() * 1000);
    }
  }
}

module.exports = ChatEngine;
