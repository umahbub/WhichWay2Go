# Which Way to Go! (K2G Online) - Project & Agent Guidelines

## 1. Project Overview
**Which Way to Go!** (K2G) is an online multiplayer board game adaptation of the original board game designed by Upal Mahbub (2022). Set in a stylized transit network of Dhaka, Bangladesh, players navigate from the **START** node to the **STOP** node using multiple modes of transportation (Walk/Run, Bike, Car, Bus, Train), balancing speed, money, dynamic traffic conditions, and strategic ability cards.

- **Game Title**: Which Way to Go! / K2G Game Online
- **Creator**: Upal Mahbub
- **Target Platform**: HTML5 Modern Web Application (Desktop & Mobile Browser friendly)
- **Supported Players**: 2 to 8 Players (Local Pass-and-Play + Smart AI Bots + Online WebRTC/Socket ready)

---

## 2. Directory Structure & Assets
- `board_game_assets/`
  - `K2G-WhichWayToGo-Borad-v2.jpg`: Original Dhaka board game map (1728x1728) with START/STOP nodes, red/green/blue roads, train lines, hospitals, and vehicle stations.
  - `power_cards_accessories.pdf`: Official graphics for Score Card, Traffic Status Indicator Card, Speed Chart, Player Boards, Tokens, and Ability Cards.
  - `Which Way 2 Go - Generic Rule Book.docx`: Comprehensive game rulebook.
- `index.html`: Main HTML5 game entrance.
- `css/style.css`: Modern UI stylesheets and animations.
- `js/`: Modular JavaScript codebase:
  - `game_data.js`: Board graph definition, traffic status table, speed charts, and ability card decks.
  - `multiplayer.js`: Zero-backend real-time WebSockets & BroadcastChannel room manager.
  - `audio.js`: Procedural Web Audio API sound effects.
  - `game_engine.js`: Turn/Phase state machine, movement validation, scoring, cards, and endgame calculations.
  - `ai_player.js`: Heuristic AI opponent bot for solo & mixed play.
  - `board_renderer.js`: Canvas/SVG renderer with zoom, pan, token animations, and visual overlays.
  - `game.js`: Integrated standalone game application controller and HUD dispatcher.

---

## 3. Core Game Mechanics & Rules Summary

### A. Setup
- 2–8 players with unique token colors.
- Starting Currency: **12 Units** (4 coins × 3 units each).
- Starting Position: All tokens at **START**.
- Round 1 Traffic: All roads are **MEDIUM TRAFFIC**.
- Priority Token randomly assigned to Player 1.
- **Opening Ability Card Draft**: At the very start of the game, each player draws 2 random Ability Cards from the deck and chooses 1 to keep secretly in hand before traveling begins, providing strategic influence from turn 1.

### B. Rounds & Turn Phases
1. **Ability Round**:
   - Skipped in Round 1.
   - Priority token holder goes first, then rotates clockwise.
   - Play mandatory cards (*Play Right Away / Play At Once*) or optional cards (*Play Once Any Time*).
2. **Travel Round**:
   - Priority token holder moves first.
   - Player must move forward or laterally along a connected valid route (no backward movement toward START).
   - Choose transport:
     - **Walk/Run**: 0 cost. Earns 3 pts (all traffic). Always available.
     - **Bike**: 2 cost. Earns 8 (Heavy) / 8 (Med) / 10 (Light) pts. Board at Bike Station (including START); stays with you on consecutive road turns.
     - **Bus**: 3 cost. Earns 6 (Heavy) / 10 (Med) / 13 (Light) pts. Board at any Bus Station (including START).
     - **Car**: 6 cost. Earns 6 (Heavy) / 12 (Med) / 19 (Light) pts. Board at a Car Station or via "Call a Uber"; stays with you on consecutive road turns.
     - **Train**: 6 cost. Earns 16 pts (fixed). Board at a Train Station along a Rail Track. Immune to traffic & roadblocks.
3. **Traffic System**:
   - From Round 2+, roll 6-sided dice to determine traffic row on the Traffic Status Card:
     - Row 1: Blue=Heavy, Red=Med, Green=Light
     - Row 2: Blue=Heavy, Green=Med, Red=Light
     - Row 3: Green=Heavy, Red=Med, Blue=Light
     - Row 4: Green=Heavy, Blue=Med, Red=Light
     - Row 5: Red=Heavy, Green=Med, Blue=Light
     - Row 6: Red=Heavy, Blue=Med, Green=Light
4. **Ability Cards & Nodes**:
   - Landing on an `'A'` node (once per `'A'` node per player): Draw 2 cards, keep 1, discard 1.
   - Landing on a Hospital (`+`) node grants +3 Currency relief bonus.
   - Cards include personal buffs, personal penalties, opponent attacks, and global traffic/road manipulation.
5. **Score & End Game**:
   - Points milestone bonus: Crossing 35, 70, 105 points grants +2 coins (+6 currency).
   - **Equal-Turn Final Round**: When the first player reaches **STOP**, all remaining players finish the current Travel Round so everyone gets an equal number of turns.
   - **Fastest Player Bonuses**: 1st player to reach STOP earns **+12 pts**; 2nd player to reach STOP in the final round earns **+6 pts**.
   - **Remaining Money Bonus**: 1 currency = +1 pt.
   - **Distance Penalty**: Remaining players lose 5 pts per node distance to STOP.
   - Highest total score wins!

---

## 4. Online Multiplayer & GitHub Pages Deployment

### A. Zero-Backend Serverless Multiplayer Architecture
- Uses public WebSocket MQTT brokers (`wss://broker.hivemq.com:8884/mqtt` and `wss://broker.emqx.io:8084/mqtt`) combined with browser `BroadcastChannel` for local multi-tab fallback.
- **Room Discovery Topic**: `k2g/v1/lobby/discovery` sends heartbeats every 3s to populate the Open Rooms Lobby.
- **Room Session Topic**: `k2g/v1/room/{roomId}` syncs player joins, host start events, map data, travel moves, card plays, and in-game chat in real time.
- Shareable Room Links: `https://<domain>/?room=K2G-XXXX` automatically connects remote friends to the room.

### B. Publishing via GitHub Pages
1. Push the repository to GitHub:
   ```bash
   git add .
   git commit -m "Publish Which Way to Go online"
   git push origin main
   ```
2. In the GitHub repository, navigate to **Settings** ➔ **Pages**.
3. Under **Build and deployment** ➔ **Source**, select **Deploy from a branch**.
4. Select branch `main` and folder `/ (root)`. Click **Save**.
5. Within 1–2 minutes, the live game is accessible worldwide at:
   `https://umahbub.github.io/WhichWay2Go/`

---

## 5. Development Guidelines for Antigravity Agents
1. **Zero External Dependencies**: All game features run client-side using standard HTML5 Canvas, Web Audio API, and vanilla modern ES6+ JavaScript.
2. **Documentation Integrity**: Maintain clear inline comments and modular design.
3. **Asset Preservation**: Do not alter original assets in `board_game_assets/`.
