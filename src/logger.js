/**
 * ============================================================================
 * Logger Module - AlwaysOnlineMC
 * Professional CLI styling with ANSI colors, aligned brackets, and crisp icons
 * ============================================================================
 */

const config = require('./config');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgCyan: '\x1b[46m\x1b[30m',
  bgBlue: '\x1b[44m\x1b[37m',
};

function getTimestamp() {
  try {
    const options = {
      timeZone: config.network.timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    };
    return new Date().toLocaleTimeString('en-US', options);
  } catch (err) {
    return new Date().toLocaleTimeString('en-US', { hour12: true });
  }
}

function format(icon, tag, msg, tagColor = colors.cyan) {
  const time = `${colors.dim}[${getTimestamp()}]${colors.reset}`;
  const badge = `${tagColor}${colors.bright}${icon} [${tag}]${colors.reset}`;
  return `${time} ${badge} ${msg}`;
}

const logger = {
  info: (msg) => console.log(format('ℹ', 'INFO   ', msg, colors.cyan)),
  success: (msg) => console.log(format('✔', 'SUCCESS', msg, colors.green)),
  warn: (msg) => console.log(format('▲', 'WARN   ', msg, colors.yellow)),
  error: (msg) => console.log(format('✖', 'ERROR  ', msg, colors.red)),
  action: (msg) => console.log(format('⚡', 'ACTION ', msg, colors.magenta)),
  chat: (msg) => console.log(format('💬', 'CHAT   ', msg, colors.blue)),
  failover: (msg) => console.log(format('🔄', 'ROUTE  ', msg, colors.yellow)),
  human: (msg) => console.log(format('👀', 'MOTION ', msg, colors.cyan)),
  banner: (title, subtitle) => {
    console.log(`${colors.cyan}╔══════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.cyan}║${colors.bright}  ${title.padEnd(58)}  ${colors.reset}${colors.cyan}║${colors.reset}`);
    if (subtitle) {
      console.log(`${colors.cyan}║${colors.dim}  ${subtitle.padEnd(58)}  ${colors.reset}${colors.cyan}║${colors.reset}`);
    }
    console.log(`${colors.cyan}╚══════════════════════════════════════════════════════════════╝${colors.reset}`);
  }
};

module.exports = logger;
