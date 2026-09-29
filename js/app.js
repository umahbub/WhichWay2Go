/**
 * Which Way to Go! (K2G Online) - Main Application Controller
 * Connects the Game Engine, Board Renderer, Audio Synthesizer, AI, and DOM UI.
 */

import { GameEngine } from './game_engine.js';
import { BoardRenderer } from './board_renderer.js';
import { AIPlayer } from './ai_player.js';
import { audio } from './audio.js';
import { PLAYER_COLORS, SPEED_CHART, TRAFFIC_STATUS_ROWS } from './game_data.js';

class AppController {
  constructor() {
    this.engine = new GameEngine();
    this.ai = new AIPlayer(this.engine);
    this.canvas = document.getElementById('boardCanvas');
    this.renderer = new BoardRenderer(this.canvas, this.engine);

    this.initCallbacks();
    this.bindDOM();
    this.showNewGameModal();
  }

  initCallbacks() {
    // Renderer callbacks
    this.renderer.onNodeClick = (node) => this.handleNodeClick(node);
    this.renderer.onNodeHover = (node) => this.handleNodeHover(node);

    // Engine callbacks
    this.engine.onLogCallback = (entry) => this.appendLogEntry(entry);
    this.engine.onCardDrawPrompt = (playerIdx, cards) => this.showCardDrawModal(playerIdx, cards);
    this.engine.onGameOverCallback = (standings) => this.showGameOverModal(standings);
  }

  bindDOM() {
    // Setup modal controls
    const playerCountSelect = document.getElementById('playerCountSelect');
    playerCountSelect.addEventListener('change', () => this.generatePlayerConfigInputs());

    document.getElementById('startGameBtn').addEventListener('click', () => this.startNewGameFromModal());
    document.getElementById('newGameNavBtn').addEventListener('click', () => this.showNewGameModal());
    document.getElementById('rulesNavBtn').addEventListener('click', () => this.toggleModal('rulesModal', true));
    document.getElementById('closeRulesBtn').addEventListener('click', () => this.toggleModal('rulesModal', false));

    // Audio & View toggles
    document.getElementById('soundToggleBtn').addEventListener('click', () => {
      const isMuted = audio.toggleMute();
      document.getElementById('soundToggleBtn').innerText = isMuted ? '🔇 Sound: Off' : '🔊 Sound: On';
    });

    document.getElementById('resetZoomBtn').addEventListener('click', () => this.renderer.fitBoardToView());
    document.getElementById('toggleOverlayBtn').addEventListener('click', () => {
      this.renderer.showVectorOverlay = !this.renderer.showVectorOverlay;
      this.renderer.render();
    });

    // End Ability Round button
    document.getElementById('passAbilityBtn').addEventListener('click', () => {
      if (this.engine.phase === 'ABILITY_ROUND') {
        this.engine.endAbilityTurn();
        this.updateHUD();
        this.checkAITurn();
      }
    });

    // Close Modals on background click
    window.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-backdrop')) {
        e.target.classList.remove('active');
      }
    });
  }

  // --- Game Initialization ---
  showNewGameModal() {
    this.generatePlayerConfigInputs();
    this.toggleModal('setupModal', true);
  }

  generatePlayerConfigInputs() {
    const container = document.getElementById('playerInputsContainer');
    const count = parseInt(document.getElementById('playerCountSelect').value, 10);
    container.innerHTML = '';

    for (let i = 0; i < count; i++) {
      const color = PLAYER_COLORS[i % PLAYER_COLORS.length];
      const div = document.createElement('div');
      div.className = 'player-config-row';
      div.innerHTML = `
        <div class="color-badge" style="background-color: ${color.hex}"></div>
        <input type="text" class="player-name-input" value="Player ${i + 1}" placeholder="Player Name" />
        <select class="player-type-select">
          <option value="human" ${i === 0 ? 'selected' : ''}>Human</option>
          <option value="ai" ${i > 0 ? 'selected' : ''}>AI Bot</option>
        </select>
      `;
      container.appendChild(div);
    }
  }

  startNewGameFromModal() {
    audio.ensureContext();
    const rows = document.querySelectorAll('.player-config-row');
    const configs = [];

    rows.forEach((row, idx) => {
      const name = row.querySelector('.player-name-input').value.trim() || `Player ${idx + 1}`;
      const type = row.querySelector('.player-type-select').value;
      const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];

      configs.push({
        name,
        color,
        isAi: type === 'ai',
        aiDifficulty: 'medium'
      });
    });

    this.toggleModal('setupModal', false);
    this.engine.initGame(configs);
    this.renderer.fitBoardToView();
    this.updateHUD();
    this.checkAITurn();
  }

  // --- Turn Handling & Movement Interaction ---
  updateHUD() {
    const activePlayer = this.engine.players[this.engine.activePlayerIndex];
    if (!activePlayer) return;

    // Phase Indicator
    const phaseBadge = document.getElementById('phaseBadge');
    const roundNumber = document.getElementById('roundNumber');
    roundNumber.innerText = `Round ${this.engine.round}`;

    if (this.engine.phase === 'ABILITY_ROUND') {
      phaseBadge.innerText = '✨ ABILITY ROUND';
      phaseBadge.className = 'phase-tag ability-phase';
      document.getElementById('abilityActionsPanel').style.display = activePlayer.isAi ? 'none' : 'flex';
    } else if (this.engine.phase === 'TRAVEL_ROUND') {
      phaseBadge.innerText = '🚗 TRAVEL ROUND';
      phaseBadge.className = 'phase-tag travel-phase';
      document.getElementById('abilityActionsPanel').style.display = 'none';
    } else {
      phaseBadge.innerText = '🏁 GAME OVER';
      phaseBadge.className = 'phase-tag game-over-phase';
      document.getElementById('abilityActionsPanel').style.display = 'none';
    }

    // Active Player Card
    const cardEl = document.getElementById('activePlayerCard');
    cardEl.style.borderColor = activePlayer.color.hex;
    document.getElementById('activePlayerName').innerText = activePlayer.name + (activePlayer.isAi ? ' 🤖 (AI)' : '');
    document.getElementById('activePlayerColorDot').style.backgroundColor = activePlayer.color.hex;
    document.getElementById('activePlayerScore').innerText = `${activePlayer.score} pts`;
    document.getElementById('activePlayerMoney').innerText = `${activePlayer.money} (🪙 ${Math.floor(activePlayer.money / 3)} coins)`;

    // Vehicle tokens
    const tokensContainer = document.getElementById('activeVehicleTokens');
    tokensContainer.innerHTML = '';
    if (activePlayer.vehicleTokens.size === 0) {
      tokensContainer.innerHTML = '<span class="empty-hint">None</span>';
    } else {
      activePlayer.vehicleTokens.forEach((t) => {
        const badge = document.createElement('span');
        badge.className = 'vehicle-badge';
        badge.innerText = t === 'bike' ? '🏍️ Bike' : '🚗 Car';
        tokensContainer.appendChild(badge);
      });
    }

    // Priority Token holder badge
    const priorityHolder = this.engine.players[this.engine.priorityIndex];
    document.getElementById('priorityHolderName').innerText = priorityHolder.name;

    // Traffic Status Card Widget
    this.updateTrafficCardWidget();

    // Player Cards Carousel / Sidebar
    this.updateAllPlayersSidebar();

    // Update Valid Movement Highlights on Board
    if (this.engine.phase === 'TRAVEL_ROUND' && !activePlayer.isAi) {
      this.renderer.highlightedMoves = this.engine.getValidMovesForPlayer(this.engine.activePlayerIndex);
    } else {
      this.renderer.highlightedMoves = [];
    }
    this.renderer.render();
  }

  updateTrafficCardWidget() {
    const diceDisplay = document.getElementById('trafficDiceDisplay');
    diceDisplay.innerText = this.engine.diceRoll ? `🎲 ${this.engine.diceRoll}` : '⚪ Round 1 (All Med)';

    const rowsContainer = document.getElementById('trafficCardRows');
    rowsContainer.innerHTML = '';

    TRAFFIC_STATUS_ROWS.forEach((row) => {
      const isCurrent = this.engine.diceRoll === row.roll;
      const div = document.createElement('div');
      div.className = `traffic-row ${isCurrent ? 'active-traffic-row' : ''}`;
      div.innerHTML = `
        <span class="row-num">${row.roll}</span>
        <span class="color-pill ${row.heavy}">Heavy: ${row.heavy}</span>
        <span class="color-pill ${row.medium}">Med: ${row.medium}</span>
        <span class="color-pill ${row.light}">Light: ${row.light}</span>
      `;
      rowsContainer.appendChild(div);
    });
  }

  updateAllPlayersSidebar() {
    const list = document.getElementById('allPlayersList');
    list.innerHTML = '';

    this.engine.players.forEach((p, idx) => {
      const isCurrent = idx === this.engine.activePlayerIndex;
      const isPriority = idx === this.engine.priorityIndex;
      const item = document.createElement('div');
      item.className = `player-mini-card ${isCurrent ? 'current' : ''}`;
      item.style.borderLeftColor = p.color.hex;
      item.innerHTML = `
        <div class="player-mini-header">
          <strong style="color:${p.color.hex}">${p.name} ${p.isAi ? '🤖' : ''}</strong>
          ${isPriority ? '<span title="Holds Priority Token">⭐</span>' : ''}
          ${p.hasFinished ? '<span class="badge-finished">🏁 FINISHED</span>' : ''}
        </div>
        <div class="player-mini-stats">
          <span>🏆 ${p.score} pts</span>
          <span>💰 ${p.money} units</span>
          <span>📍 ${p.currentNodeId}</span>
        </div>
      `;
      list.appendChild(item);
    });
  }

  // --- Node Clicks & Movement Execution ---
  handleNodeClick(node) {
    if (this.engine.phase !== 'TRAVEL_ROUND') return;
    const activePlayer = this.engine.players[this.engine.activePlayerIndex];
    if (!activePlayer || activePlayer.isAi) return;

    // Check if clicked node is among valid moves
    const matchingMoves = this.renderer.highlightedMoves.filter((m) => m.targetNodeId === node.id);
    if (matchingMoves.length === 0) return;

    if (matchingMoves.length === 1) {
      // Execute directly
      this.executeMove(matchingMoves[0]);
    } else {
      // Multiple vehicle options available (e.g. Run vs Car vs Bike)
      this.showVehicleChoiceModal(node, matchingMoves);
    }
  }

  showVehicleChoiceModal(node, moves) {
    const container = document.getElementById('vehicleOptionsContainer');
    container.innerHTML = '';
    document.getElementById('vehicleChoiceNodeName').innerText = node.name;

    moves.forEach((move) => {
      const btn = document.createElement('div');
      btn.className = `vehicle-option-card ${move.canAfford ? '' : 'unaffordable'}`;
      btn.innerHTML = `
        <div class="vehicle-icon">${move.vehicleIcon}</div>
        <div class="vehicle-info">
          <h4>${move.vehicleName}</h4>
          <p>Speed: <strong>+${move.pointsEarned} pts</strong> (${move.traffic} traffic)</p>
          <p>Cost: <strong>${move.cost} currency</strong> ${!move.canAfford ? `<span class="penalty-warning">(-${move.unpaidPenalty} pts penalty)</span>` : ''}</p>
        </div>
      `;
      btn.addEventListener('click', () => {
        this.toggleModal('vehicleChoiceModal', false);
        this.executeMove(move);
      });
      container.appendChild(btn);
    });

    this.toggleModal('vehicleChoiceModal', true);
  }

  executeMove(moveOption) {
    audio.playMove(moveOption.vehicleId);
    this.engine.executePlayerMove(this.engine.activePlayerIndex, moveOption);
    this.updateHUD();
    this.checkAITurn();
  }

  // --- Ability Cards Interaction ---
  showCardDrawModal(playerIdx, cards) {
    audio.playCardDraw();
    const player = this.engine.players[playerIdx];

    if (player.isAi) {
      // AI chooses automatically
      const keptId = this.ai.chooseCardToKeep(playerIdx, cards);
      setTimeout(() => {
        this.engine.resolveCardSelection(playerIdx, keptId);
        this.updateHUD();
        this.checkAITurn();
      }, 1000);
      return;
    }

    // Human player modal
    const container = document.getElementById('drawCardsContainer');
    container.innerHTML = '';
    document.getElementById('cardDrawPlayerName').innerText = player.name;

    cards.forEach((card) => {
      const cardEl = document.createElement('div');
      cardEl.className = `ability-card-view category-${card.category.toLowerCase()}`;
      cardEl.innerHTML = `
        <div class="card-header">${card.category}</div>
        <div class="card-title">${card.title}</div>
        <div class="card-type">${card.type.replace('_', ' ')}</div>
        <div class="card-desc">${card.description}</div>
        <button class="keep-card-btn">KEEP THIS CARD</button>
      `;
      cardEl.querySelector('.keep-card-btn').addEventListener('click', () => {
        this.toggleModal('cardDrawModal', false);
        this.engine.resolveCardSelection(playerIdx, card.instanceId);
        this.updateHUD();
        this.checkAITurn();
      });
      container.appendChild(cardEl);
    });

    this.toggleModal('cardDrawModal', true);
  }

  // --- AI Turn Coordinator ---
  checkAITurn() {
    if (this.engine.phase === 'GAME_OVER') return;

    const activePlayer = this.engine.players[this.engine.activePlayerIndex];
    if (!activePlayer || !activePlayer.isAi || activePlayer.hasFinished) return;

    // Ability Round AI Turn
    if (this.engine.phase === 'ABILITY_ROUND') {
      setTimeout(() => {
        const abilityDecision = this.ai.chooseAbilityCardToPlay(this.engine.activePlayerIndex);
        if (abilityDecision) {
          this.engine.executeAbilityCard(this.engine.activePlayerIndex, abilityDecision.card, abilityDecision.targetDetails);
        }
        this.engine.endAbilityTurn();
        this.updateHUD();
        this.checkAITurn();
      }, 1100);
      return;
    }

    // Travel Round AI Turn
    if (this.engine.phase === 'TRAVEL_ROUND') {
      setTimeout(() => {
        const bestMove = this.ai.chooseTravelMove(this.engine.activePlayerIndex);
        if (bestMove) {
          this.executeMove(bestMove);
        } else {
          // No valid moves (miss turn)
          this.engine.endTravelTurn();
          this.updateHUD();
          this.checkAITurn();
        }
      }, 1300);
    }
  }

  // --- End Game Modal ---
  showGameOverModal(standings) {
    audio.playVictory();
    const tbody = document.getElementById('leaderboardBody');
    tbody.innerHTML = '';

    standings.forEach((p, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>#${idx + 1}</strong></td>
        <td><span style="color:${p.color.hex}">●</span> ${p.name} ${p.isAi ? '🤖' : ''}</td>
        <td><strong>${p.score}</strong></td>
        <td>+${p.fastestBonus || 0}</td>
        <td>+${p.moneyBonus || 0}</td>
        <td>-${p.distancePenalty || 0} (${p.distanceToStop} stops)</td>
      `;
      tbody.appendChild(tr);
    });

    this.toggleModal('gameOverModal', true);
  }

  // --- UI Helpers ---
  toggleModal(modalId, show) {
    const el = document.getElementById(modalId);
    if (el) {
      if (show) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    }
  }

  appendLogEntry(entry) {
    const logBox = document.getElementById('gameLogBox');
    if (!logBox) return;

    const div = document.createElement('div');
    div.className = `log-entry log-${entry.type}`;
    div.innerText = entry.text;
    logBox.appendChild(div);
    logBox.scrollTop = logBox.scrollHeight;
  }

  handleNodeHover(node) {
    const tooltip = document.getElementById('nodeTooltip');
    if (!node) {
      tooltip.style.display = 'none';
      return;
    }

    const screenPos = this.renderer.worldToScreen(node.x * this.renderer.boardWidth, node.y * this.renderer.boardHeight);
    tooltip.style.left = `${screenPos.x + 18}px`;
    tooltip.style.top = `${screenPos.y - 20}px`;
    tooltip.style.display = 'block';

    const vehicles = [];
    if (node.hasTrain) vehicles.push('Train 🚂');
    if (node.hasBus) vehicles.push('Bus 🚌');
    if (node.hasCar) vehicles.push('Car 🚗');
    if (node.hasBike) vehicles.push('Bike 🏍️');
    if (node.hasHospital) vehicles.push('Hospital 🏥');
    if (node.hasCard) vehicles.push('Ability Card 🎴');

    tooltip.innerHTML = `
      <strong>${node.name}</strong>
      <div>Region: ${node.area}</div>
      <div>Vehicles: ${vehicles.length > 0 ? vehicles.join(', ') : 'Walk only'}</div>
    `;
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  new AppController();
});
