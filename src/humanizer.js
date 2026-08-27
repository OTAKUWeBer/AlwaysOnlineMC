/**
 * ============================================================================
 * Humanizer Module - AlwaysBotMC
 * Active block placement, lively movement, natural curiosity & anti-drift
 * ============================================================================
 */

const logger = require('./logger');
const config = require('./config');

class Humanizer {
  constructor(bot) {
    this.bot = bot;
    this.active = true;
    this.currentLookTarget = null;
    this.antiAfkTimeout = null;
    this.jitterInterval = null;
    this.curiosityInterval = null;
    this.spawnPosition = null;
  }

  start() {
    this.active = true;
    if (this.bot && this.bot.entity) {
      this.spawnPosition = this.bot.entity.position.clone();
    }

    // Initial movement burst to unlock server anti-bot chat filters
    setTimeout(() => {
      if (this.active && this.bot && this.bot.entity) {
        this.bot.setControlState('forward', true);
        setTimeout(() => {
          if (this.active && this.bot) {
            this.bot.setControlState('forward', false);
            this.bot.setControlState('sneak', true);
            setTimeout(() => {
              if (this.active && this.bot) this.bot.setControlState('sneak', false);
            }, 300);
          }
        }, 600);
      }
    }, 1000);

    this.scheduleNextAction();
    this.startMicroJitter();
    if (config.behavior.enablePlayerTracking) {
      this.startPlayerCuriosity();
    }
  }

  stop() {
    this.active = false;
    if (this.antiAfkTimeout) clearTimeout(this.antiAfkTimeout);
    if (this.jitterInterval) clearInterval(this.jitterInterval);
    if (this.curiosityInterval) clearInterval(this.curiosityInterval);
    this.antiAfkTimeout = null;
    this.jitterInterval = null;
    this.curiosityInterval = null;
  }

  /**
   * Smoothly interpolates the bot's head direction toward a target yaw/pitch
   */
  async smoothLook(targetYaw, targetPitch, durationMs = 250) {
    if (!this.active || !this.bot || !this.bot.entity) return;

    const startYaw = this.bot.entity.yaw;
    const startPitch = this.bot.entity.pitch;
    const steps = 4;
    const stepDuration = Math.max(20, Math.floor(durationMs / steps));

    for (let i = 1; i <= steps; i++) {
      if (!this.active || !this.bot || !this.bot.entity) break;
      const progress = i / steps;
      const ease = 1 - Math.pow(1 - progress, 2);

      let deltaYaw = targetYaw - startYaw;
      while (deltaYaw > Math.PI) deltaYaw -= 2 * Math.PI;
      while (deltaYaw < -Math.PI) deltaYaw += 2 * Math.PI;

      const currentYaw = startYaw + deltaYaw * ease;
      const currentPitch = startPitch + (targetPitch - startPitch) * ease;

      try {
        await this.bot.look(currentYaw, currentPitch, true);
      } catch (e) {
        break;
      }
      await new Promise((r) => setTimeout(r, stepDuration));
    }
  }

  /**
   * Natural micro-jitters
   */
  startMicroJitter() {
    this.jitterInterval = setInterval(() => {
      if (!this.active || !this.bot || !this.bot.entity || !config.behavior.enableHumanLook) return;
      if (this.bot.isRespawning || !this.bot.isReady) return;

      const yawJitter = (Math.random() - 0.5) * 0.15;
      const pitchJitter = (Math.random() - 0.5) * 0.10;

      const currentYaw = this.bot.entity.yaw + yawJitter;
      const currentPitch = Math.max(-0.6, Math.min(0.6, this.bot.entity.pitch + pitchJitter));

      this.bot.look(currentYaw, currentPitch, true).catch(() => {});
    }, 3000 + Math.random() * 2000);
  }

  /**
   * Look at nearby players
   */
  startPlayerCuriosity() {
    this.curiosityInterval = setInterval(() => {
      if (!this.active || !this.bot || !this.bot.entity || this.bot.isRespawning) return;

      const filter = (entity) =>
        entity.type === 'player' &&
        entity.username !== this.bot.username &&
        entity.position.distanceTo(this.bot.entity.position) < 7;

      const nearestPlayer = this.bot.nearestEntity(filter);

      if (nearestPlayer && Math.random() > 0.3) {
        const eyePos = nearestPlayer.position.offset(0, nearestPlayer.height * 0.85, 0);
        logger.human(`Looking at ${nearestPlayer.username}...`);
        this.bot.lookAt(eyePos, true).catch(() => {});

        if (nearestPlayer.position.distanceTo(this.bot.entity.position) < 3.5 && Math.random() > 0.4) {
          setTimeout(() => {
            if (this.active && this.bot && this.bot.entity) {
              this.bot.swingArm('right');
              this.bot.setControlState('sneak', true);
              setTimeout(() => {
                if (this.active && this.bot) this.bot.setControlState('sneak', false);
              }, 350);
            }
          }, 400);
        }
      }
    }, 5000 + Math.random() * 3000);
  }

  scheduleNextAction() {
    if (!this.active) return;
    const { antiAfkMin, antiAfkMax } = config.behavior;
    const delay = Math.floor(antiAfkMin + Math.random() * (antiAfkMax - antiAfkMin));

    this.antiAfkTimeout = setTimeout(async () => {
      await this.executeHumanRoutine();
      this.scheduleNextAction();
    }, delay);
  }

  isGroundSafe() {
    if (!this.bot || !this.bot.entity) return false;
    const below = this.bot.blockAt(this.bot.entity.position.offset(0, -1, 0));
    if (!below) return true;
    return below.name !== 'lava' && below.name !== 'fire';
  }

  /**
   * Places whatever block is in hand or inventory
   */
  async handleBlockAction() {
    if (!config.behavior.enableBlockInteraction || !this.bot || !this.bot.entity || !this.bot.entity.position) {
      return;
    }

    try {
      const Vec3Class = this.bot.entity.position.constructor;
      const botPos = this.bot.entity.position;

      // 1. Get held item or first inventory item
      const held = this.bot.heldItem;
      const items = this.bot.inventory?.items() || [];
      const itemToPlace = held || (items.length > 0 ? items[0] : null);

      if (itemToPlace) {
        // Ensure equipped in hand
        if (!held || held.name !== itemToPlace.name) {
          await this.bot.equip(itemToPlace, 'hand').catch(() => {});
        }

        // Scan all 6 faces for valid placement surface
        const candidates = [];
        const directions = [
          { ref: [0, -1, 0], face: [0, 1, 0], air: [0, 0, 0] },
          { ref: [1, -1, 0], face: [0, 1, 0], air: [1, 0, 0] },
          { ref: [-1, -1, 0], face: [0, 1, 0], air: [-1, 0, 0] },
          { ref: [0, -1, 1], face: [0, 1, 0], air: [0, 0, 1] },
          { ref: [0, -1, -1], face: [0, 1, 0], air: [0, 0, -1] },
          { ref: [1, 0, 0], face: [-1, 0, 0], air: [0, 0, 0] },
          { ref: [-1, 0, 0], face: [1, 0, 0], air: [0, 0, 0] },
          { ref: [0, 0, 1], face: [0, 0, -1], air: [0, 0, 0] },
          { ref: [0, 0, -1], face: [0, 0, 1], air: [0, 0, 0] },
        ];

        for (const d of directions) {
          const refBlock = this.bot.blockAt(botPos.offset(d.ref[0], d.ref[1], d.ref[2]));
          const airBlock = this.bot.blockAt(botPos.offset(d.air[0], d.air[1], d.air[2]));

          if (refBlock && refBlock.name !== 'air' && refBlock.name !== 'lava' && airBlock && airBlock.name === 'air') {
            candidates.push({ refBlock, face: new Vec3Class(d.face[0], d.face[1], d.face[2]) });
          }
        }

        if (candidates.length > 0) {
          const target = candidates[Math.floor(Math.random() * candidates.length)];
          await this.bot.lookAt(target.refBlock.position.offset(0.5, 0.5, 0.5), true).catch(() => {});
          logger.action(`Placing ${itemToPlace.name} on ${target.refBlock.name}...`);
          try {
            await this.bot.placeBlock(target.refBlock, target.face);
            this.bot.swingArm('right');
            return;
          } catch (e) {
            this.bot.swingArm('right');
          }
        }
      }

      // 2. Otherwise interact with nearby block
      const randomBlock = this.bot.blockAt(botPos.offset(
        (Math.random() - 0.5) * 2,
        Math.random() > 0.5 ? -1 : 0,
        (Math.random() - 0.5) * 2
      ));

      if (randomBlock && randomBlock.name !== 'air' && randomBlock.name !== 'lava') {
        logger.action(`Interacting with block: ${randomBlock.name}`);
        this.bot.swingArm('right');
        await this.bot.activateBlock(randomBlock).catch(() => {});
      }
    } catch (err) {
      // Safe ignore
    }
  }

  async executeHumanRoutine() {
    if (!this.active || !this.bot || !this.bot.entity || this.bot.isRespawning || !this.bot.isReady) {
      return;
    }

    const hasItem = !!this.bot.heldItem || (this.bot.inventory?.items()?.length || 0) > 0;

    let routines;
    if (hasItem) {
      // Constant placing actions when holding any item in hand or inventory
      routines = [
        'interact_block',
        'interact_block',
        'interact_block',
        'safe_wander_return',
        'jump_and_step'
      ];
    } else {
      routines = [
        'safe_wander_return',
        'safe_wander_return',
        'jump_and_step',
        'strafe_step',
        'look_skyward',
        'crouch_wave',
        'interact_block'
      ];
    }

    const chosen = routines[Math.floor(Math.random() * routines.length)];

    try {
      switch (chosen) {
        case 'safe_wander_return': {
          logger.action('Executing wander step & view turn...');
          const newYaw = Math.random() * Math.PI * 2;
          const newPitch = (Math.random() * 0.5) - 0.25;
          await this.smoothLook(newYaw, newPitch, 250);

          if (this.isGroundSafe()) {
            const moveDir = Math.random() > 0.5 ? 'forward' : (Math.random() > 0.5 ? 'left' : 'right');
            const opposite = moveDir === 'forward' ? 'back' : (moveDir === 'left' ? 'right' : 'left');

            this.bot.setControlState(moveDir, true);
            await new Promise((r) => setTimeout(r, 450));
            this.bot.setControlState(moveDir, false);

            await new Promise((r) => setTimeout(r, 150));

            this.bot.setControlState(opposite, true);
            await new Promise((r) => setTimeout(r, 400));
            this.bot.setControlState(opposite, false);
          }
          break;
        }

        case 'jump_and_step': {
          logger.action('Executing forward hop & arm swing...');
          if (this.isGroundSafe()) {
            this.bot.setControlState('forward', true);
            this.bot.setControlState('jump', true);
            await new Promise((r) => setTimeout(r, 350));
            this.bot.setControlState('jump', false);
            this.bot.setControlState('forward', false);
            this.bot.swingArm('right');

            await new Promise((r) => setTimeout(r, 150));

            this.bot.setControlState('back', true);
            await new Promise((r) => setTimeout(r, 320));
            this.bot.setControlState('back', false);
          }
          break;
        }

        case 'crouch_wave': {
          logger.action('Executing crouch greeting pulse...');
          this.bot.setControlState('sneak', true);
          await new Promise((r) => setTimeout(r, 200));
          this.bot.swingArm('right');
          await new Promise((r) => setTimeout(r, 200));
          this.bot.setControlState('sneak', false);
          break;
        }

        case 'look_skyward': {
          logger.action('Observing surroundings...');
          const skyPitch = -(0.25 + Math.random() * 0.35);
          const randYaw = this.bot.entity.yaw + (Math.random() - 0.5) * 1.4;
          await this.smoothLook(randYaw, skyPitch, 300);
          await new Promise((r) => setTimeout(r, 350));
          await this.smoothLook(randYaw, 0.0, 250);
          break;
        }

        case 'strafe_step': {
          logger.action('Executing strafe step...');
          const strafe = Math.random() > 0.5 ? 'left' : 'right';
          const opposite = strafe === 'left' ? 'right' : 'left';
          this.bot.setControlState(strafe, true);
          await new Promise((r) => setTimeout(r, 300));
          this.bot.setControlState(strafe, false);
          await new Promise((r) => setTimeout(r, 120));
          this.bot.setControlState(opposite, true);
          await new Promise((r) => setTimeout(r, 280));
          this.bot.setControlState(opposite, false);
          break;
        }

        case 'interact_block': {
          await this.handleBlockAction();
          break;
        }
      }
    } catch (err) {
      logger.warn(`Humanizer action note: ${err.message}`);
    }
  }
}

module.exports = Humanizer;
