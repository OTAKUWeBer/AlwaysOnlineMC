/**
 * ============================================================================
 * Web Server Module - AlwaysOnlineMC
 * Lightweight HTTP healthcheck server for Render, Railway, Koyeb, Docker & UptimeRobot
 * ============================================================================
 */

const http = require('http');
const config = require('./config');
const logger = require('./logger');

let serverInstance = null;

function startWebServer(getBotStatus) {
  const port = process.env.PORT || process.env.WEB_PORT || null;
  if (!port) return;

  try {
    serverInstance = http.createServer((req, res) => {
      if (req.url === '/' || req.url === '/health' || req.url === '/status') {
        const status = typeof getBotStatus === 'function' ? getBotStatus() : {};
        const responseData = {
          status: status.isReady ? 'online' : (status.isConnecting ? 'connecting' : 'reconnecting'),
          app: 'AlwaysOnlineMC',
          version: '2.5.0',
          bot: config.bot.username,
          target: `${config.server.primaryHost}:${config.server.primaryPort}`,
          uptimeSeconds: Math.floor(process.uptime()),
          memoryMB: (process.memoryUsage().rss / 1024 / 1024).toFixed(1),
          timestamp: new Date().toISOString()
        };

        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify(responseData, null, 2));
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    });

    serverInstance.listen(port, '0.0.0.0', () => {
      logger.info(`Web health endpoint active on http://0.0.0.0:${port}/health`);
    });

    serverInstance.on('error', (err) => {
      if (err.code !== 'EADDRINUSE') {
        logger.warn(`Web server notice: ${err.message}`);
      }
    });
  } catch (err) {
    logger.warn(`Could not start web health server: ${err.message}`);
  }
}

function stopWebServer() {
  if (serverInstance) {
    try {
      serverInstance.close();
    } catch (e) {}
    serverInstance = null;
  }
}

module.exports = { startWebServer, stopWebServer };
