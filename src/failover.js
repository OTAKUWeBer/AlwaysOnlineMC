/**
 * ============================================================================
 * Failover & Endpoint Manager - AlwaysBotMC
 * Intelligent DNS pre-flight checking, route health scoring & failover
 * ============================================================================
 */

const dns = require('dns').promises;
const logger = require('./logger');
const config = require('./config');

class FailoverManager {
  constructor() {
    this.endpoints = [
      {
        id: 'primary',
        host: config.server.primaryHost,
        port: config.server.primaryPort,
        label: 'Primary Route',
        consecutiveFails: 0,
      },
      ...(config.server.fallbackHost && config.server.fallbackHost !== config.server.primaryHost
        ? [{
            id: 'fallback',
            host: config.server.fallbackHost,
            port: config.server.fallbackPort,
            label: 'Dynamic Fallback Route',
            consecutiveFails: 0,
          }]
        : [])
    ];

    this.currentIndex = 0;
    this.totalAttempts = 0;
  }

  getCurrentEndpoint() {
    return this.endpoints[this.currentIndex];
  }

  /**
   * Fast DNS check with timeout to avoid stalling on dead hostnames
   */
  async preflightCheck(host, timeoutMs = 4000) {
    try {
      const lookupPromise = dns.lookup(host);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DNS resolution timed out')), timeoutMs)
      );

      const res = await Promise.race([lookupPromise, timeoutPromise]);
      return { ok: true, ip: res.address };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  /**
   * Selects best viable endpoint for next connection attempt
   */
  async getNextViableEndpoint() {
    this.totalAttempts++;

    // Try current endpoint first
    let candidate = this.getCurrentEndpoint();
    const check = await this.preflightCheck(candidate.host);

    if (check.ok) {
      logger.info(`Resolved ${candidate.label} (${candidate.host}) -> [${check.ip}:${candidate.port}]`);
      return candidate;
    }

    logger.warn(`DNS check failed for ${candidate.label} (${candidate.host}): ${check.error}`);

    // If candidate failed and we have a fallback, switch immediately
    if (this.endpoints.length > 1) {
      this.currentIndex = (this.currentIndex + 1) % this.endpoints.length;
      candidate = this.getCurrentEndpoint();
      logger.failover(`Failing over to ${candidate.label} (${candidate.host}:${candidate.port})...`);

      const fallbackCheck = await this.preflightCheck(candidate.host);
      if (fallbackCheck.ok) {
        logger.info(`Resolved ${candidate.label} (${candidate.host}) -> [${fallbackCheck.ip}:${candidate.port}]`);
      } else {
        logger.warn(`Fallback DNS check also reported: ${fallbackCheck.error}`);
      }
    }

    return candidate;
  }

  recordFailure() {
    const current = this.getCurrentEndpoint();
    current.consecutiveFails++;

    if (this.endpoints.length > 1) {
      this.currentIndex = (this.currentIndex + 1) % this.endpoints.length;
      const next = this.getCurrentEndpoint();
      logger.failover(`Switched active route to ${next.label} (${next.host}:${next.port})`);
    }
  }

  recordSuccess() {
    const current = this.getCurrentEndpoint();
    current.consecutiveFails = 0;
    this.totalAttempts = 0;
  }

  getReconnectDelay() {
    const base = config.network.reconnectBaseDelay;
    const max = config.network.maxReconnectDelay;
    const currentFails = this.getCurrentEndpoint().consecutiveFails;

    // Exponential curve with 15% random jitter
    const exp = Math.min(base * Math.pow(1.25, Math.min(currentFails, 6)), max);
    const jitter = exp * (0.85 + Math.random() * 0.3);
    return Math.round(jitter);
  }
}

module.exports = new FailoverManager();
