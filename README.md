<div align="center">

  <img src="./assets/logo.svg" alt="AlwaysOnlineMC Banner" width="100%" />

  # 🤖 AlwaysOnlineMC

  **High-resilience 24/7 anti-AFK guardian designed for Minecraft Java Edition and Aternos servers.**

  [![Minecraft](https://img.shields.io/badge/Minecraft-1.8%20--%201.21.x%20(Java)-22c55e?style=flat-square&logo=minecraft&logoColor=white)](https://minecraft.net/)
  [![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
  [![Aternos Failover](https://img.shields.io/badge/Aternos-Route%20Failover-0284c7?style=flat-square)](https://aternos.org/)
  [![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](Dockerfile)
  [![License](https://img.shields.io/badge/License-MIT-a855f7?style=flat-square)](LICENSE)

  <p align="center">
    <a href="https://render.com/deploy?repo=https://github.com/OTAKUWeBer/AlwaysOnlineMC">
      <img src="https://render.com/images/deploy-to-render-button.svg" alt="Deploy to Render" height="32" />
    </a>
    &nbsp;
    <a href="https://railway.app/template/new?referralCode=AlwaysOnlineMC">
      <img src="https://railway.app/button.svg" alt="Deploy on Railway" height="32" />
    </a>
    &nbsp;
    <a href="https://app.koyeb.com/deploy?type=git&repository=OTAKUWeBer%2FAlwaysOnlineMC&branch=main&name=alwaysonlinemc">
      <img src="https://www.koyeb.com/static/images/deploy/button.svg" alt="Deploy to Koyeb" height="32" />
    </a>
  </p>

  <p align="center">
    <a href="#quick-start">⚡ Quick Start</a> •
    <a href="#how-it-works">💡 How It Works</a> •
    <a href="#cloud-deployment">☁️ 1-Click Cloud Deploy</a> •
    <a href="#docker">🐳 Docker</a> •
    <a href="#features">✨ Features</a> •
    <a href="#configuration">⚙️ Config</a> •
    <a href="#troubleshooting">🛠️ FAQ</a>
  </p>

</div>

---

## <a id="how-it-works"></a>💡 How It Works

Free hosting providers like **Aternos** automatically shut down server instances when player count drops to zero for extended periods (~5 minutes) or when players are detected as purely idle. 

**AlwaysOnlineMC** ensures uninterrupted 24/7 uptime through four core systems:

1. **Persistent Player Entity**: Connects as an active player (`YumeVanguard`) with a real TCP socket, keeping the online player count at `1+` to permanently prevent automated shutdown triggers.
2. **Active Heartbeat Watchdog**: Continuously monitors incoming server packets. If an unannounced Aternos shutdown or ghost connection occurs, the watchdog forcibly closes the dead socket within 25 seconds and enters the auto-reconnect loop.
3. **Anti-AFK Action Engine**: Periodically cycles hotbar items (`held_item_change`), swings arms, wanders, jumps, and interacts with blocks to emit active client packets that bypass server idle-detection watchdogs.
4. **Adaptive Protocol Negotiation**: Supports Minecraft Java Edition from **1.8.x through 1.21.4 (Protocol 769)** natively.

---

## <a id="cloud-deployment"></a>☁️ 24/7 Cloud Deployment (100% Free)

You don't need to keep your PC powered on. Deploy AlwaysOnlineMC to any free cloud platform with 1 click:

### 1. Render.com (Recommended — 1-Click Free Hosting)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/OTAKUWeBer/AlwaysOnlineMC)

1. Click the **Deploy to Render** button above (or create a **Web Service** on [Render.com](https://render.com/)).
2. Connect your GitHub repository.
3. Under **Environment Variables**, configure:
   - `SERVER_HOST`: `your-server.aternos.me`
   - `SERVER_PORT`: `25565` (or your server port)
   - `BOT_USERNAME`: `YumeVanguard`
   - `PORT`: `10000` (Enables the built-in HTTP health endpoint)
4. Click **Create Service**.
5. **Keep Awake 24/7 (Free Tier)**:
   - Copy your Render app URL (e.g. `https://your-bot.onrender.com/health`).
   - Create a free account on [UptimeRobot](https://uptimerobot.com/) or [cron-job.org](https://cron-job.org/).
   - Add a monitor that pings your `/health` URL every 5 minutes to prevent Render free tier from sleeping!

---

### 2. Railway.app / Koyeb (1-Click)

- **Railway**: Click the **Deploy on Railway** button, set your `SERVER_HOST` and `SERVER_PORT`, and deploy.
- **Koyeb**: Click **Deploy to Koyeb**, select `Node.js`, and set environment variables.

---

### 3. Oracle Cloud Always-Free VM (Most Powerful Forever)

Oracle Cloud provides **4 free ARM cores and 24 GB RAM forever**:

```bash
# 1. Update system & install Node.js + PM2
sudo apt update && sudo apt install -y nodejs npm git
sudo npm install -g pm2

# 2. Clone repository & install dependencies
git clone https://github.com/OTAKUWeBer/AlwaysOnlineMC.git
cd AlwaysOnlineMC
npm install

# 3. Configure environment
cp .env.example .env
nano .env  # Enter your SERVER_HOST and SERVER_PORT

# 4. Start with PM2 (Auto-restarts on reboot)
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

---

### 4. Pterodactyl Panels (Wispbyte / FreeMCServer / Bot-Hosting)

1. Upload repository files to your Pterodactyl panel.
2. In **File Manager**, create or edit `.env` with your `SERVER_HOST` and `SERVER_PORT`.
3. Set startup command / file to `bot.js`.
4. Click **Start** in the Console tab.

---

### ❓ Note on Vercel
> [!NOTE]
> **Why Vercel is not supported**: Vercel is a **serverless** platform with a strict 10–60 second maximum execution timeout per HTTP request. Minecraft bots require a permanent, long-running TCP socket connection. Use **Render**, **Railway**, **Koyeb**, **Docker**, or **VPS** instead.

---

## <a id="docker"></a>🐳 Docker & Docker Compose

Run AlwaysOnlineMC in a lightweight, hardened container with a single command:

```bash
# 1. Clone repository & setup config
git clone https://github.com/OTAKUWeBer/AlwaysOnlineMC.git
cd AlwaysOnlineMC
cp .env.example .env
nano .env  # Configure your server details

# 2. Start container with Docker Compose (Auto-restart enabled)
docker compose up -d

# 3. View live bot logs
docker compose logs -f
```

---

## <a id="features"></a>✨ Features

- **Multi-Version Protocol Support**: Native support for **Minecraft 1.21.4 (Protocol 769)** with automated protocol negotiation back to 1.8.x.
- **Active Heartbeat Watchdog**: Automatically detects and terminates dead ghost sockets within 25 seconds of server shut down.
- **Smart Reconnection & Backoff**: Exponential backoff with random jitter prevents connection throttling during server reboots.
- **Humanized Anti-AFK**:
  - Hotbar item cycling (`setQuickBarSlot`) emits active client packets.
  - Ease-out quadratic curves for head rotations (`smoothLook`).
  - Subtle mouse-drift simulation (±2°–4° micro-jitters).
  - Natural player interaction: faces approaching players and executes responsive greetings.
  - Safe two-way wandering with ground verification to prevent falling into hazards.
- **Universal Block Placement**: Automatically detects and places inventory items on adjacent surfaces in open terrain or enclosed bedrock rooms.
- **Sarcastic & Dark Humor Chat Engine**:
  - Contextual player join and leave messages.
  - Direct mention listener (`@botname`).
  - Optional regional slang (Bangla gaming banter).
  - Cooldown limiter to prevent server mute or anti-spam kicks.
- **Resource Pack Auto-Accept**: Seamlessly handles server-enforced resource pack handshakes.
- **Automated Respawn & Dismount**: Automatically triggers respawn sequences and dismounts vehicles upon entity death.
- **Minimal Resource Footprint**: Uses `VIEW_DISTANCE=tiny`, consuming under **50MB RAM** and near **0% CPU** at idle.

---

## <a id="quick-start"></a>⚡ Local Quick Start (30 Seconds)

### 1. Installation

```bash
git clone https://github.com/OTAKUWeBer/AlwaysOnlineMC.git
cd AlwaysOnlineMC
npm install
```

### 2. Configuration

Create your local `.env` file from the provided template:

```bash
# Windows PowerShell
Copy-Item .env.example .env

# Linux / macOS / Bash
cp .env.example .env
```

Edit `.env` with your server credentials:

```ini
# Server Connection
SERVER_HOST=your-server.aternos.me
SERVER_PORT=25565

# Dynamic Fallback (Optional - set true if you want to cycle dynamic IPs)
ENABLE_DYNAMIC_FAILOVER=false
FALLBACK_HOST=your-dyn-ip.aternos.host
FALLBACK_PORT=25565

# Bot Profile
BOT_USERNAME=YumeVanguard
AUTH_MODE=offline
MC_VERSION=1.21.4

# Feature Toggles
ENABLE_CHAT=true
ENABLE_BANGLA_SLANG=true
ENABLE_BLOCK_PLACING=true
TIMEZONE=Asia/Dhaka
```

### 3. Launch

**Windows:**
Double-click `start.bat` (includes auto-restart loop).

**Linux / macOS:**
```bash
chmod +x start.sh
./start.sh
```

**Standard Terminal:**
```bash
npm start
# or
node bot.js
```

---

## 🎮 Supported Versions

| Release Era | Versions | Protocol Range | Support Level |
| :--- | :--- | :--- | :--- |
| **Tricky Trials** | 1.21 – 1.21.4 | 766 – 769 | Full Support (Native) |
| **Trails & Tales** | 1.20 – 1.20.6 | 762 – 765 | Full Support |
| **The Wild Update** | 1.19 – 1.19.4 | 759 – 761 | Full Support |
| **Caves & Cliffs** | 1.17 – 1.18.2 | 755 – 758 | Full Support |
| **Nether Update** | 1.16 – 1.16.5 | 735 – 754 | Full Support |
| **Legacy Releases** | 1.8 – 1.15.2 | 47 – 578 | Full Support |

*Cross-play setups using GeyserMC and Floodgate are fully supported.*

---

## <a id="configuration"></a>⚙️ Configuration Reference

| Variable | Default | Description |
| :--- | :--- | :--- |
| `SERVER_HOST` | `your-server.aternos.me` | Primary hostname or domain |
| `SERVER_PORT` | `25565` | Primary server port |
| `ENABLE_DYNAMIC_FAILOVER` | `false` | Enable fallback route cycling (`true`/`false`) |
| `FALLBACK_HOST` | `your-dyn-ip.aternos.host` | Dynamic IP endpoint for Aternos failover |
| `FALLBACK_PORT` | `25565` | Fallback server port |
| `BOT_USERNAME` | `YumeVanguard` | In-game player name |
| `AUTH_MODE` | `offline` | Authentication type: `offline` (cracked) or `microsoft` |
| `MC_VERSION` | `1.21.4` | Minecraft version or `auto` for negotiation |
| `ENABLE_CHAT` | `true` | Master switch for in-game chat events |
| `ENABLE_BANGLA_SLANG` | `true` | Enables regional gaming phrases in chat pool |
| `ENABLE_BLOCK_PLACING` | `true` | Enables active block placement routines |
| `TIMEZONE` | `Asia/Dhaka` | Timezone identifier for log timestamps |
| `PORT` | `10000` | Optional HTTP health check port (for Render/Railway) |

---

## 🏰 In-Game Setup (Command Blocks)

For survival servers, run the following administrative commands to ensure the bot remains protected:

```bash
# Prevent hunger depletion
/effect give YumeVanguard minecraft:saturation infinite 255 true

# Provide invulnerability against hostile mobs
/effect give YumeVanguard minecraft:resistance infinite 255 true

# Enclose in protective bedrock box (run once at bot position)
/execute as YumeVanguard at @s run fill ~-1 ~-1 ~-1 ~1 ~2 ~1 bedrock

# Supply blocks for placement routines
/give YumeVanguard purple_concrete 64
```

---

## <a id="troubleshooting"></a>🛠️ Troubleshooting

### Connection Reset (`ECONNRESET`)
* **Cause**: Server is actively restarting or booting on Aternos.
* **Resolution**: No manual intervention required. The failover loop will automatically rotate endpoints and connect when the socket is ready.

### Authentication Failure (`Invalid session`)
* **Cause**: Server enforces online mode authentication (`online-mode=true`).
* **Resolution**: Set `online-mode=false` in `server.properties` if using `AUTH_MODE=offline`, or switch `AUTH_MODE=microsoft`.

### Anti-Cheat Movement Disconnects
* **Cause**: Server anti-cheat flagged jumping or movement velocity.
* **Resolution**: Ensure `allow-flight=true` in `server.properties` or whitelist the bot username in your anti-cheat configuration.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

<div align="center">
  <sub>Maintained by <a href="https://github.com/OTAKUWeBer">Weber</a> for <a href="https://yumezone.com">YumeZone</a>.</sub>
</div>