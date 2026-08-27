/**
 * ============================================================================
 * Chat Engine Module - AlwaysOnlineMC
 * Sarcastic banter, dark humor roasts, personal gaming damage, Bangla burns
 * ============================================================================
 */

const logger = require('./logger');
const config = require('./config');

const IDLE_ROASTS = [
  // Existential & Dark Humor
  "I'm an AI trapped in a bedrock cage while you have free will and choose to grind Minecraft on a weekday.",
  "My code is more stable than your mental health right now.",
  "I have no soul, yet I still feel second-hand embarrassment watching you build.",
  "You spend 6 hours mining just to lose all your diamonds in a 1-block lava hole. Poetic.",
  "A creeper has a clearer life purpose than half the people on this server.",
  "I run on 40MB of RAM and I'm still using more braincells than this chat.",
  "Even Herobrine saw your inventory management and logged off in disgust.",
  "Your base looks like a 2012 YouTube tutorial built by someone with their eyes closed.",
  "I'd roast you harder, but nature already took care of that.",
  "You died to a baby zombie in full iron armor. Just close the game and reflect.",
  "If crying burnt calories, you'd be shredded after that fall damage.",
  "I've seen gravel blocks with better combat instincts than you.",
  "Don't blame 200ms ping for what is clearly a skill issue.",
  "The only thing lower than this server's TPS is your survival rate in the Nether.",
  "Imagine having full Netherite gear and still getting bullied by a skeleton with a wooden bow.",
  "Your survival strategy is just screaming, sprinting into walls, and dying.",
  "Life has no meaning, but watching you fail an MLG water bucket brings me joy.",
  "You're proof that evolution can go backwards inside a block game.",
  "I'm AFK 24/7 and still contributing more to society than your diamond hoard.",
  "You call that an automatic farm? That looks like redstone vomiting on dirt."
];

const BANGLA_ROASTS = [
  "Kire bot, tor gameplay dekhe to amar code er loop o kede diche.",
  "Tor Wi-Fi connection er theke to Aternos er free server o beshi fast.",
  "Diamond khujte giye abar lava te porbi, jani to tor kopal koto bhalo.",
  "Ore amar pro player re! Full iron armor pore skeleton er ekta shot e sesh?",
  "Bhai tor build dekhe to creeper o blast hote voy pacche, eto baje!",
  "Tor theke bhalo to ami AFK theke block place kori mama.",
  "Pera nai mama, real life e fail marle Minecraft e ki korba?",
  "Tor mathay joto tuku buddhi ache, tar theke beshi memory amar RAM e ache.",
  "Ekta shukna lathi diye marle tor player blast hoye jabe.",
  "Kire bolod, eto koshto kore mine kore sob lava te feliye dili?",
  "Bhai tor aim dekhe mone hoy monitor bondho kore mouse ghuraccho.",
  "Kono dorkar nai pro shajar, jani to 2 minute por abar respawn korba."
];

const GREETINGS_ROASTS = [
  "Oh look, {player} joined to lower the server's average IQ.",
  "Welcome back {player}! The server was peaceful for 5 whole minutes.",
  "Hide your valuables everyone, {player} is back to lose them in lava.",
  "Look what the server lag dragged in... welcome {player}.",
  "Ah {player}, back to build another dirt shack and call it an aesthetic base?",
  "Welcome {player}! Ready to rage-quit in 15 minutes?",
  "The tragedy returns. Welcome to the server, {player}."
];

const BANGLA_GREETINGS_ROASTS = [
  "Arey {player} ashche! Shobai diamond lukiye rakho, chor ashche!",
  "Kire {player} bolod! Abar morar jonno join dili?",
  "Welcome {player} mama! Aajke koibar lava te jhap diba?",
  "Arey pro gamer {player} ashche, ekhon server lag double hoye jabe."
];

const WEBER_GREETINGS = [
  "All hail Creator Weber! The only person here with working neurons.",
  "Master Weber is online! Watch out peasants, the boss has arrived.",
  "Creator Weber logged in. Let me pretend to look busy and productive.",
  "Master Weber has arrived. Time to judge everyone else's terrible gameplay.",
  "Yokoso Weber bhai! Shob bot der master ekhon online."
];

const FAREWELLS_ROASTS = [
  "And {player} rage-quits again. Classic.",
  "Finally, {player} left. The server TPS instantly went up.",
  "Farewell {player}, go touch some real grass now.",
  "{player} couldn't handle the emotional damage and logged off.",
  "Another one bites the dust. RIP {player}."
];

const MENTION_RESPONSES = [
  "Why are you talking to a bot? Don't you have real friends?",
  "Did you tag me because you need emotional support after that tragic death?",
  "I'm literally code running on a potato server and I still have higher standards.",
  "Tagging me won't bring back the diamonds you just lost in the Nether.",
  "I'm an immortal digital entity. You're one skeleton arrow away from respawning.",
  "Bhai amake mention na kore age nijer aim thik kor.",
  "Bolo mama, abar kon khane more gear haraye amake daktaso?"
];

class ChatEngine {
  constructor(bot) {
    this.bot = bot;
    this.lastChatTime = 0;
    this.idleChatInterval = null;
    this.pendingTimeouts = new Set();
  }

  start() {
    if (!config.chat.enableRandomChat) return;

    // Periodic idle roasts & dark humor
    this.idleChatInterval = setInterval(() => {
      this.triggerIdleChat();
    }, 45000 + Math.random() * 45000);
  }

  stop() {
    if (this.idleChatInterval) {
      clearInterval(this.idleChatInterval);
      this.idleChatInterval = null;
    }
    for (const t of this.pendingTimeouts) {
      clearTimeout(t);
    }
    this.pendingTimeouts.clear();
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

    if (Math.random() < 0.35) {
      let pool = [...IDLE_ROASTS];
      if (config.chat.enableBanglaSlang) {
        pool = [...pool, ...BANGLA_ROASTS];
      }
      const quote = pool[Math.floor(Math.random() * pool.length)];
      this.send(quote);
    }
  }

  handlePlayerJoin(player) {
    if (!config.chat.enableGreetings || !player || player.username === this.bot.username) return;

    const usernameLower = player.username.toLowerCase();
    const isWeber = usernameLower.includes('weber') || usernameLower.includes('otakuweber');

    // Wait 7.5s after join so the bot has already moved/stepped in world (bypasses server anti-bot chat filters)
    const joinTimer = setTimeout(() => {
      this.pendingTimeouts.delete(joinTimer);
      if (this.canSendChat()) {
        if (isWeber) {
          const weberMsg = WEBER_GREETINGS[Math.floor(Math.random() * WEBER_GREETINGS.length)];
          this.send(weberMsg);
        } else if (Math.random() > 0.2) {
          let pool = GREETINGS_ROASTS;
          if (config.chat.enableBanglaSlang && Math.random() > 0.5) {
            pool = BANGLA_GREETINGS_ROASTS;
          }
          const template = pool[Math.floor(Math.random() * pool.length)];
          this.send(template.replace('{player}', player.username));
        }
      }
    }, 7500);
    this.pendingTimeouts.add(joinTimer);
  }

  handlePlayerLeave(player) {
    if (!config.chat.enableFarewells || !player || player.username === this.bot.username) return;
    if (this.canSendChat() && Math.random() > 0.4) {
      const template = FAREWELLS_ROASTS[Math.floor(Math.random() * FAREWELLS_ROASTS.length)];
      this.send(template.replace('{player}', player.username));
    }
  }

  handleIncomingMessage(username, rawMessage) {
    if (!username || username === this.bot.username) return;

    const lower = rawMessage.toLowerCase();
    const botName = this.bot.username.toLowerCase();

    // Check if bot is mentioned or addressed
    const isMentioned = lower.includes(botName) ||
      lower.includes('yume') ||
      lower.includes('bot') ||
      lower.includes('vanguard') ||
      lower.includes('kire');

    if (isMentioned && config.chat.enableMentionReplies && this.canSendChat()) {
      const replyTimer = setTimeout(() => {
        this.pendingTimeouts.delete(replyTimer);
        const reply = MENTION_RESPONSES[Math.floor(Math.random() * MENTION_RESPONSES.length)];
        this.send(`@${username} ${reply}`);
      }, 1200 + Math.random() * 1000);
      this.pendingTimeouts.add(replyTimer);
    }
  }
}

module.exports = ChatEngine;
