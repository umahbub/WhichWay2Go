# Which Way to Go! (K2G Online) - HTML5 Board Game

An interactive HTML5 web adaptation of the strategic board game **Which Way to Go!** designed by **Upal Mahbub** (2022). Set in the dynamic transit system of Dhaka, Bangladesh, players race from **START** to **STOP** using multiple modes of transportation, navigating traffic conditions, scoring speed points, and deploying tactical ability cards.

---

## 🎮 How to Play

### 1. Launching the Game
You can launch the game in any of the following ways:
- **Option A (Double-Click)**: Simply double-click `start_game.bat` on Windows. It will start a local server and automatically open your default browser at `http://localhost:8000`.
- **Option B (Direct Browser)**: Double-click or open `index.html` directly in any modern browser (Chrome, Edge, Firefox, Safari).
- **Option C (Custom Server)**: In PowerShell/Terminal, run:
  ```powershell
  python -m http.server 8000
  ```
  and navigate to `http://localhost:8000`.

---

## 🚦 Core Game Mechanics

### 1. Setup & Starting Conditions
- **Players**: 2 to 8 players (supports any combination of Human and AI bot players).
- **Starting Currency**: 12 units (equivalent to 4 coins of 3 units each).
- **Starting Position**: All player tokens begin at **START** (Gulshan / Tejgaon junction).
- **Round 1 Special Rule**: All roads have **Medium Traffic**. The Ability Round is skipped in Round 1 since players start with 0 cards.

### 2. Turn Structure
Each round has two consecutive phases:
1. **Ability Round**:
   - The player holding the **Priority Token** goes first, then turns rotate clockwise.
   - Players may play optional cards (*Play Once Any Time*) or resolve mandatory cards (*Play Right Away / Play At Once*).
2. **Travel Round**:
   - Starting from the priority token holder, each player moves to a connected intersection.
   - Players select their mode of transport based on availability, traffic, and currency:
     - **🏃 Walk / Run**: Cost 0, 3 mph (3 pts across all traffic).
     - **🏍️ Motorcycle / Bike**: Cost 3, 3 pts (Heavy), 6 pts (Medium), 9 pts (Light).
     - **🚗 Car / Taxi**: Cost 6, 9 pts (Heavy), 12 pts (Medium), 18 pts (Light).
     - **🚌 Public Bus**: Cost 3, 6 pts (Heavy), 9 pts (Medium), 12 pts (Light). Requires bus station to board or exit. (-6 pts penalty if unpaid).
     - **🚂 Train**: Cost 9, fixed 15 pts! Runs exclusively on Railroad tracks and completely ignores road traffic. (-24 pts penalty if unpaid).

### 3. Dynamic Traffic System
From Round 2 onward, a 6-sided dice roll at the start of each round determines which road colors are **Heavy**, **Medium**, and **Light** using the official 6-row Traffic Status Card.

### 4. Ability Cards
Landing on an intersection marked with an Ability Card icon (**A**) triggers a card draw:
- Draw 2 cards from the deck.
- Choose 1 card to **KEEP**; discard the other.
- Cards feature speed boosts, cash grants, roadblocks, traffic manipulation, and opponent disruptions!

### 5. Scoring & Endgame
- **Milestone Bonuses**: Reaching or crossing 33, 66, and 100 points grants +3 coins (+9 currency units).
- **Finish Line**: The game race concludes when a player reaches the **STOP** node in Keraniganj.
- **Final Tallies**:
  - **Fastest Player Bonus**: First player to finish receives **+15 points**.
  - **Money Bonus**: Every 1 unit of leftover currency = **+1 point**.
  - **Distance Penalty**: For each opponent still on the board, find their shortest path to STOP and deduct **-6 points per intersection**.
- The player with the highest total score is crowned champion!

---

## 📂 Project Architecture
```
K2G_game_online/
├── board_game_assets/
│   ├── K2G-WhichWayToGo-Borad-v2.jpg     # Authentic board illustration (1728x1728)
│   ├── power_cards_accessories.pdf       # Original card & component artwork
│   └── Which Way 2 Go - Generic Rule Book.docx # Original rulebook
├── css/
│   └── style.css                         # Modern dark glassmorphic UI styling
├── js/
│   ├── game_data.js                      # Graph data, speed charts & cards
│   ├── audio.js                          # Web Audio synthesizer for SFX
│   ├── game_engine.js                    # State machine & game rules
│   ├── ai_player.js                      # Heuristic AI opponent bot
│   ├── board_renderer.js                 # Pan/Zoom Canvas overlay renderer
│   ├── app.js                            # UI event bindings & modals
│   └── game.js                           # Consolidated browser bundle
├── index.html                            # Main HTML5 game entrance
├── start_game.bat                        # Windows 1-click launcher
├── GEMINI.md                             # Antigravity project configuration
└── AGENTS.md                             # Agent guidelines
```
