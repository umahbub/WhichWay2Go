/**
 * Which Way to Go! (K2G Online) - Core Game Engine
 * Manages game state, phases, movement validation, traffic, ability cards, and scoring.
 * Implements the authentic rules by Upal Mahbub.
 */

import {
  BOARD_NODES,
  BOARD_EDGES,
  SPEED_CHART,
  TRAFFIC_STATUS_ROWS,
  buildAbilityDeck
} from './game_data.js';

export class GameEngine {
  constructor() {
    this.nodesMap = new Map();
    BOARD_NODES.forEach((node) => this.nodesMap.set(node.id, node));

    this.edges = BOARD_EDGES;
    this.resetState();
  }

  resetState() {
    this.round = 1;
    this.phase = 'SETUP'; // 'SETUP' | 'ABILITY_ROUND' | 'TRAVEL_ROUND' | 'GAME_OVER'
    this.priorityIndex = 0;
    this.activePlayerIndex = 0;
    this.travelMovedThisRound = new Set();
    this.abilityPlayedThisRound = new Set();

    this.diceRoll = null;
    this.trafficStatus = {
      red: 'medium',
      green: 'medium',
      blue: 'medium'
    };

    this.blockedEdges = new Set(); // Set of edge IDs with roadblocks
    this.blockedColors = new Set(); // Set of road colors ('red', 'green', 'blue') blocked

    this.players = [];
    this.abilityDeck = [];
    this.discardPile = [];
    this.pendingCardSelection = null; // When drawing cards: { playerIndex, cards: [c1, c2] }
    this.winner = null;
    this.logs = [];
    this.finishOrder = [];
  }

  log(message, type = 'info') {
    const entry = {
      round: this.round,
      phase: this.phase,
      text: message,
      type: type,
      timestamp: Date.now()
    };
    this.logs.push(entry);
    if (this.onLogCallback) {
      this.onLogCallback(entry);
    }
  }

  initGame(playerConfigs) {
    this.resetState();
    this.abilityDeck = buildAbilityDeck();

    this.players = playerConfigs.map((cfg, idx) => ({
      id: `p_${idx + 1}`,
      name: cfg.name || `Player ${idx + 1}`,
      color: cfg.color,
      isAi: !!cfg.isAi,
      aiDifficulty: cfg.aiDifficulty || 'medium',
      currentNodeId: 'START',
      previousNodeId: null,
      score: 0,
      money: 12, // Starting currency: 12 units (4 coins x 3 units)
      vehicleTokens: new Set(),
      abilityHand: [],
      milestonesClaimed: new Set(),
      missNextTurn: false,
      lightTrafficBonus: false,
      bypassRoadblock: false,
      runSpeedBonus: 0, // When Run at 9 or 12 is active
      hasFinished: false,
      finishRank: null,
      totalMoves: 0
    }));

    // Randomize initial priority token holder
    this.priorityIndex = Math.floor(Math.random() * this.players.length);
    this.activePlayerIndex = this.priorityIndex;

    this.log(`🎲 Game initialized with ${this.players.length} players!`, 'system');
    this.log(`⭐ ${this.players[this.priorityIndex].name} holds the Priority Token.`, 'system');

    // In Round 1, all roads are Medium traffic, ability round is skipped
    this.startRound(1);
  }

  startRound(roundNumber) {
    this.round = roundNumber;
    this.travelMovedThisRound.clear();
    this.abilityPlayedThisRound.clear();
    this.blockedColors.clear(); // Clear temporary color blocks from previous round

    if (this.round === 1) {
      this.log(`🏁 Round 1 begins: All roads have MEDIUM TRAFFIC. Ability Round is skipped.`, 'system');
      this.trafficStatus = { red: 'medium', green: 'medium', blue: 'medium' };
      this.diceRoll = null;
      this.startTravelRound();
    } else {
      // Roll dice to determine traffic condition from Round 2 onwards
      this.rollTrafficDice();
      this.startAbilityRound();
    }
  }

  rollTrafficDice() {
    this.diceRoll = Math.floor(Math.random() * 6) + 1;
    const row = TRAFFIC_STATUS_ROWS.find((r) => r.roll === this.diceRoll);
    if (row) {
      this.trafficStatus = {
        [row.heavy]: 'heavy',
        [row.medium]: 'medium',
        [row.light]: 'light'
      };
      this.log(
        `🎲 Dice rolled a ${this.diceRoll}! Traffic conditions: [Heavy: ${row.heavy.toUpperCase()}] [Medium: ${row.medium.toUpperCase()}] [Light: ${row.light.toUpperCase()}]`,
        'traffic'
      );
    }
    return this.diceRoll;
  }

  // --- Phase 1: Ability Round ---
  startAbilityRound() {
    this.phase = 'ABILITY_ROUND';
    this.activePlayerIndex = this.priorityIndex;
    this.log(`✨ Ability Round starts. Starting with ${this.players[this.activePlayerIndex].name}.`, 'phase');
    this.checkAutoAdvanceAbility();
  }

  checkAutoAdvanceAbility() {
    // If active player has finished, pass turn
    const player = this.players[this.activePlayerIndex];
    if (player.hasFinished) {
      this.endAbilityTurn();
    }
  }

  endAbilityTurn() {
    this.abilityPlayedThisRound.add(this.activePlayerIndex);

    // Find next unfinished player clockwise
    let nextIdx = (this.activePlayerIndex + 1) % this.players.length;
    let checked = 0;
    while (checked < this.players.length && this.abilityPlayedThisRound.has(nextIdx)) {
      nextIdx = (nextIdx + 1) % this.players.length;
      checked++;
    }

    if (checked >= this.players.length || this.abilityPlayedThisRound.size >= this.getUnfinishedPlayerCount()) {
      // Ability round is complete, move to Travel Round
      this.startTravelRound();
    } else {
      this.activePlayerIndex = nextIdx;
      this.log(`Turn passes to ${this.players[this.activePlayerIndex].name} for Ability Round.`, 'turn');
      this.checkAutoAdvanceAbility();
    }
  }

  // --- Phase 2: Travel Round ---
  startTravelRound() {
    this.phase = 'TRAVEL_ROUND';
    this.travelMovedThisRound.clear();
    this.activePlayerIndex = this.priorityIndex;
    this.log(`🚗 Travel Round starts. Priority token holder ${this.players[this.activePlayerIndex].name} moves first!`, 'phase');
    this.processTravelTurnStart();
  }

  processTravelTurnStart() {
    const player = this.players[this.activePlayerIndex];
    if (player.hasFinished) {
      this.endTravelTurn();
      return;
    }

    if (player.missNextTurn) {
      player.missNextTurn = false;
      this.log(`🛑 ${player.name} misses their turn due to a Driving Violation.`, 'alert');
      this.endTravelTurn();
      return;
    }
  }

  endTravelTurn() {
    this.travelMovedThisRound.add(this.activePlayerIndex);

    // Reset temporary turn perks for this player
    const player = this.players[this.activePlayerIndex];
    player.bypassRoadblock = false;
    player.lightTrafficBonus = false;
    player.runSpeedBonus = 0;

    // Check if game is over (any player reached STOP)
    if (this.winner) {
      this.finishGame();
      return;
    }

    // Check if all active players have moved in this round
    const unfinishedCount = this.getUnfinishedPlayerCount();
    if (this.travelMovedThisRound.size >= unfinishedCount) {
      this.endRound();
    } else {
      // Find next unfinished player clockwise
      let nextIdx = (this.activePlayerIndex + 1) % this.players.length;
      let count = 0;
      while (count < this.players.length && (this.players[nextIdx].hasFinished || this.travelMovedThisRound.has(nextIdx))) {
        nextIdx = (nextIdx + 1) % this.players.length;
        count++;
      }
      this.activePlayerIndex = nextIdx;
      this.log(`👉 It is now ${this.players[this.activePlayerIndex].name}'s turn to travel.`, 'turn');
      this.processTravelTurnStart();
    }
  }

  endRound() {
    this.log(`🔔 Round ${this.round} has ended.`, 'system');
    // Rotate priority token to the next player clockwise
    this.priorityIndex = (this.priorityIndex + 1) % this.players.length;
    this.log(`⭐ Priority Token passes to ${this.players[this.priorityIndex].name}.`, 'system');

    // Remove single-turn road blocks
    this.blockedEdges.clear();

    this.startRound(this.round + 1);
  }

  getUnfinishedPlayerCount() {
    return this.players.filter((p) => !p.hasFinished).length;
  }

  // --- Movement & Edge Queries ---
  getConnectedEdges(nodeId) {
    return this.edges.filter((e) => e.from === nodeId || e.to === nodeId);
  }

  getAdjacentNodeId(edge, fromNodeId) {
    return edge.from === fromNodeId ? edge.to : edge.from;
  }

  getValidMovesForPlayer(playerIndex) {
    const player = this.players[playerIndex];
    if (player.hasFinished) return [];

    const currentNode = this.nodesMap.get(player.currentNodeId);
    if (!currentNode) return [];

    const connectedEdges = this.getConnectedEdges(currentNode.id);
    const validMoves = [];

    for (const edge of connectedEdges) {
      const neighborId = this.getAdjacentNodeId(edge, currentNode.id);
      const neighborNode = this.nodesMap.get(neighborId);
      if (!neighborNode) continue;

      // Check roadblocks
      const isEdgeBlocked = this.blockedEdges.has(edge.id);
      const isColorBlocked = edge.type === 'road' && this.blockedColors.has(edge.color);
      const isBlocked = isEdgeBlocked || isColorBlocked;

      if (isBlocked && !player.bypassRoadblock) {
        continue; // Blocked by roadblock
      }

      // Check available transportation for this edge
      if (edge.type === 'rail') {
        // Rail requires Train
        // Player can only enter Train if current node has Train Station (hasTrain = true)
        // OR player is already riding train from previous node
        const canRideTrain = currentNode.hasTrain || player.ridingTrain;
        if (canRideTrain) {
          const moveOption = this.createMoveOption(player, neighborNode, edge, 'train');
          validMoves.push(moveOption);
        }
      } else {
        // Road edge (red, green, blue)
        // 1. Walk / Run: Always possible on any road! Cost = 0.
        validMoves.push(this.createMoveOption(player, neighborNode, edge, 'run'));

        // 2. Bike: Available if current node has Bike OR player holds Bike token
        if (currentNode.hasBike || player.vehicleTokens.has('bike')) {
          validMoves.push(this.createMoveOption(player, neighborNode, edge, 'bike'));
        }

        // 3. Car: Available if current node has Car OR player holds Car token
        if (currentNode.hasCar || player.vehicleTokens.has('car')) {
          validMoves.push(this.createMoveOption(player, neighborNode, edge, 'car'));
        }

        // 4. Bus: Available if current node has Bus Station (hasBus) OR player is riding Bus
        const canRideBus = currentNode.hasBus || player.ridingBus;
        if (canRideBus) {
          validMoves.push(this.createMoveOption(player, neighborNode, edge, 'bus'));
        }
      }
    }

    return validMoves;
  }

  createMoveOption(player, targetNode, edge, vehicleId) {
    const vehicle = SPEED_CHART[vehicleId];
    let traffic = 'medium';

    if (edge.type === 'rail') {
      traffic = 'none'; // Train immune to traffic
    } else if (player.lightTrafficBonus) {
      traffic = 'light';
    } else {
      traffic = this.trafficStatus[edge.color] || 'medium';
    }

    // Points earned
    let points = 0;
    if (vehicleId === 'run' && player.runSpeedBonus > 0) {
      points = player.runSpeedBonus;
    } else {
      points = vehicle[traffic] || vehicle.medium;
    }

    // Cost calculation & Unpaid penalties
    let cost = vehicle.cost;
    let unpaidPenalty = 0;
    let canAfford = player.money >= cost;

    if (!canAfford) {
      if (vehicleId === 'bus') {
        // Special rule: if out of money, deduct 6 pts per node
        unpaidPenalty = 6;
      } else if (vehicleId === 'train') {
        // Special rule: if out of money, deduct 24 pts per node
        unpaidPenalty = 24;
      }
    }

    return {
      targetNodeId: targetNode.id,
      targetNodeName: targetNode.name,
      targetNode: targetNode,
      edgeId: edge.id,
      edgeType: edge.type,
      edgeColor: edge.color,
      vehicleId: vehicleId,
      vehicleName: vehicle.name,
      vehicleIcon: vehicle.icon,
      traffic: traffic,
      pointsEarned: points,
      cost: cost,
      canAfford: canAfford,
      unpaidPenalty: unpaidPenalty
    };
  }

  // --- Execute Move ---
  executePlayerMove(playerIndex, moveOption) {
    const player = this.players[playerIndex];
    if (!player || player.hasFinished) return false;

    const { targetNodeId, vehicleId, edgeId, pointsEarned, cost, canAfford, unpaidPenalty } = moveOption;
    const targetNode = this.nodesMap.get(targetNodeId);

    // 1. Process Cost & Deductions
    if (canAfford) {
      player.money -= cost;
      this.log(`💰 ${player.name} paid ${cost} currency to ride ${SPEED_CHART[vehicleId].name}. (Remaining: ${player.money})`, 'action');
    } else {
      // Unpaid ticket penalty
      player.score = Math.max(0, player.score - unpaidPenalty);
      this.log(`⚠️ ${player.name} couldn't afford ${vehicleId} fare! Deducted ${unpaidPenalty} points penalty.`, 'alert');
    }

    // 2. Award Points
    player.score += pointsEarned;
    this.log(`⚡ ${player.name} earned +${pointsEarned} points traveling via ${SPEED_CHART[vehicleId].name} (${moveOption.traffic} traffic).`, 'score');

    // 3. Milestone Check (33, 66, 100 points -> +3 coins / 9 currency)
    this.checkPointsMilestones(player);

    // 4. Update Token and Position
    player.previousNodeId = player.currentNodeId;
    player.currentNodeId = targetNodeId;
    player.totalMoves++;

    // 5. Vehicle Token Management
    // If using vehicle, gain token unless already owned or available at target node
    if (vehicleId === 'bike' || vehicleId === 'car') {
      if (!player.vehicleTokens.has(vehicleId) && !targetNode[`has${vehicleId.charAt(0).toUpperCase() + vehicleId.slice(1)}`]) {
        player.vehicleTokens.add(vehicleId);
        this.log(`🎫 ${player.name} acquired a ${vehicleId.toUpperCase()} token.`, 'item');
      }
    }

    // Forfeit token if node already has it
    if (vehicleId === 'bike' && targetNode.hasBike && player.vehicleTokens.has('bike')) {
      player.vehicleTokens.delete('bike');
      this.log(`🔄 ${player.name} reached a bike hub and returned their Bike token.`, 'item');
    }
    if (vehicleId === 'car' && targetNode.hasCar && player.vehicleTokens.has('car')) {
      player.vehicleTokens.delete('car');
      this.log(`🔄 ${player.name} reached a taxi stand and returned their Car token.`, 'item');
    }

    // Train & Bus Riding State (must board/exit at stations)
    if (vehicleId === 'train') {
      player.ridingTrain = !targetNode.hasTrain; // If target has train station, can exit freely
    } else {
      player.ridingTrain = false;
    }

    if (vehicleId === 'bus') {
      player.ridingBus = !targetNode.hasBus;
    } else {
      player.ridingBus = false;
    }

    // 6. Check STOP Node
    if (targetNode.isStop) {
      player.hasFinished = true;
      this.finishOrder.push(player);
      player.finishRank = this.finishOrder.length;
      this.log(`🏆🏁 ${player.name} HAS REACHED THE STOP NODE!`, 'victory');
      if (!this.winner) {
        this.winner = player;
      }
      this.endTravelTurn();
      return true;
    }

    // 7. Check Ability Node ('A')
    if (targetNode.hasCard) {
      this.triggerAbilityCardDraw(playerIndex);
    } else {
      this.endTravelTurn();
    }

    return true;
  }

  checkPointsMilestones(player) {
    const milestones = [33, 66, 100];
    for (const m of milestones) {
      if (player.score >= m && !player.milestonesClaimed.has(m)) {
        player.milestonesClaimed.add(m);
        player.money += 9; // +3 coins = 9 currency
        this.log(`🌟 MILESTONE! ${player.name} reached ${m} points and received +9 Currency (3 coins)!`, 'bonus');
      }
    }
  }

  // --- Ability Cards Draw (Draw 2, Keep 1) ---
  triggerAbilityCardDraw(playerIndex) {
    const player = this.players[playerIndex];
    if (this.abilityDeck.length < 2) {
      // Reshuffle discard pile
      this.abilityDeck.push(...this.discardPile);
      this.discardPile = [];
      // Fisher-Yates shuffle
      for (let i = this.abilityDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.abilityDeck[i], this.abilityDeck[j]] = [this.abilityDeck[j], this.abilityDeck[i]];
      }
    }

    if (this.abilityDeck.length === 0) {
      this.log(`⚠️ Deck is empty. No ability card drawn.`, 'info');
      this.endTravelTurn();
      return;
    }

    const card1 = this.abilityDeck.pop();
    const card2 = this.abilityDeck.pop() || card1;

    this.pendingCardSelection = {
      playerIndex: playerIndex,
      cards: [card1, card2]
    };

    this.log(`🎴 ${player.name} landed on an Ability Card node and drew 2 cards!`, 'card');

    if (this.onCardDrawPrompt) {
      this.onCardDrawPrompt(playerIndex, [card1, card2]);
    }
  }

  resolveCardSelection(playerIndex, keptCardInstanceId) {
    if (!this.pendingCardSelection || this.pendingCardSelection.playerIndex !== playerIndex) return;

    const { cards } = this.pendingCardSelection;
    const keptCard = cards.find((c) => c.instanceId === keptCardInstanceId) || cards[0];
    const discardedCard = cards.find((c) => c.instanceId !== keptCard.instanceId) || cards[1];

    if (discardedCard) {
      this.discardPile.push(discardedCard);
    }
    this.pendingCardSelection = null;

    const player = this.players[playerIndex];
    this.log(`🔒 ${player.name} selected 1 Ability Card and placed it secretly in hand.`, 'card');

    // If Play At Once / Play Right Away, execute immediately
    if (keptCard.type === 'PLAY_AT_ONCE') {
      this.executeAbilityCard(playerIndex, keptCard);
    } else {
      player.abilityHand.push(keptCard);
    }

    this.endTravelTurn();
  }

  // --- Ability Card Execution ---
  executeAbilityCard(playerIndex, card, targetDetails = {}) {
    const player = this.players[playerIndex];
    this.log(`💥 ${player.name} activates Ability Card: [${card.title}]!`, 'card');

    switch (card.id) {
      case 'RUN_9':
        player.runSpeedBonus = 9;
        this.log(`🏃 ${player.name} will run at 9 MPH for this turn!`, 'action');
        break;

      case 'RUN_12':
        player.runSpeedBonus = 12;
        this.log(`⚡ ${player.name} will run at 12 MPH for this move!`, 'action');
        break;

      case 'GET_9_CURRENCY':
        player.money += 9;
        this.log(`💵 ${player.name} gained +9 Currency!`, 'bonus');
        break;

      case 'GET_12_CURRENCY':
        player.money += 12;
        this.log(`💵 ${player.name} gained +12 Currency!`, 'bonus');
        break;

      case 'BYPASS_ROADBLOCK':
        player.bypassRoadblock = true;
        this.log(`🚧 ${player.name} can bypass all roadblocks this turn!`, 'bonus');
        break;

      case 'ACCIDENT': {
        // Move to nearest hospital
        const nearestHospital = this.findNearestNode(player.currentNodeId, (n) => n.hasHospital);
        if (nearestHospital) {
          player.previousNodeId = player.currentNodeId;
          player.currentNodeId = nearestHospital.id;
          this.log(`🚑 ACCIDENT! ${player.name} was rushed to ${nearestHospital.name}!`, 'alert');
        }
        break;
      }

      case 'DRIVING_VIOLATION':
        player.missNextTurn = true;
        this.log(`👮 DRIVING VIOLATION! ${player.name} must miss their next travel turn.`, 'alert');
        break;

      case 'MOVE_OWN_PREV':
        if (player.previousNodeId) {
          player.currentNodeId = player.previousNodeId;
          this.log(`↩️ ${player.name} moved back to previous node ${player.previousNodeId}.`, 'action');
        }
        break;

      case 'MOVE_ALL_PREV':
        this.players.forEach((p, idx) => {
          if (idx !== playerIndex && p.previousNodeId && !p.hasFinished) {
            p.currentNodeId = p.previousNodeId;
            this.log(`↩️ ${p.name} was moved back to ${p.previousNodeId}!`, 'action');
          }
        });
        break;

      case 'FORFEIT_VEHICLES':
        player.vehicleTokens.clear();
        this.log(`🚲❌ ${player.name} forfeited all vehicle tokens!`, 'alert');
        break;

      case 'STEAL_3_POINTS': {
        const targetIdx = targetDetails.targetPlayerIndex ?? (playerIndex + 1) % this.players.length;
        const target = this.players[targetIdx];
        if (target && target.score > 0) {
          const stolen = Math.min(3, target.score);
          target.score -= stolen;
          player.score += stolen;
          this.log(`🦹 ${player.name} stole ${stolen} points from ${target.name}!`, 'action');
        }
        break;
      }

      case 'STEAL_VEHICLE': {
        const targetIdx = targetDetails.targetPlayerIndex ?? (playerIndex + 1) % this.players.length;
        const target = this.players[targetIdx];
        if (target && target.vehicleTokens.size > 0) {
          const token = Array.from(target.vehicleTokens)[0];
          target.vehicleTokens.delete(token);
          player.vehicleTokens.add(token);
          this.log(`🦹 ${player.name} snatched a ${token} token from ${target.name}!`, 'action');
        }
        break;
      }

      case 'STEAL_CARD': {
        const targetIdx = targetDetails.targetPlayerIndex ?? (playerIndex + 1) % this.players.length;
        const target = this.players[targetIdx];
        if (target && target.abilityHand.length > 0) {
          const stolen = target.abilityHand.pop();
          player.abilityHand.push(stolen);
          this.log(`🦹 ${player.name} took an ability card from ${target.name}!`, 'action');
        }
        break;
      }

      case 'MOVE_ANY_NEIGHBOR': {
        const targetIdx = targetDetails.targetPlayerIndex ?? playerIndex;
        const target = this.players[targetIdx];
        if (target && !target.hasFinished) {
          const neighbors = this.getConnectedEdges(target.currentNodeId).map((e) =>
            this.getAdjacentNodeId(e, target.currentNodeId)
          );
          if (neighbors.length > 0) {
            target.previousNodeId = target.currentNodeId;
            target.currentNodeId = neighbors[0];
            this.log(`🔀 ${target.name} was moved to adjacent node ${target.currentNodeId}!`, 'action');
          }
        }
        break;
      }

      case 'PAY_NEIGHBORS': {
        const neighbors = this.getConnectedEdges(player.currentNodeId).map((e) =>
          this.getAdjacentNodeId(e, player.currentNodeId)
        );
        this.players.forEach((p, idx) => {
          if (idx !== playerIndex && neighbors.includes(p.currentNodeId) && player.money >= 3) {
            player.money -= 3;
            p.money += 3;
            this.log(`🤝 ${player.name} paid 3 units currency to neighbor ${p.name}.`, 'action');
          }
        });
        break;
      }

      case 'CHANGE_TRAFFIC':
        this.rollTrafficDice();
        break;

      case 'BLOCK_ROAD_1':
      case 'BLOCK_ROAD_3': {
        const targetEdgeId = targetDetails.edgeId || (this.edges[Math.floor(Math.random() * this.edges.length)]?.id);
        if (targetEdgeId) {
          this.blockedEdges.add(targetEdgeId);
          this.log(`🚧 Roadblock placed on segment ${targetEdgeId}!`, 'alert');
        }
        break;
      }

      case 'BLOCK_COLOR_1': {
        const color = targetDetails.color || ['red', 'green', 'blue'][Math.floor(Math.random() * 3)];
        this.blockedColors.add(color);
        this.log(`⛔ ALL ${color.toUpperCase()} ROADS are blocked for this round!`, 'alert');
        break;
      }

      case 'BLOCK_COLOR_2': {
        const colors = ['red', 'green'];
        colors.forEach((c) => this.blockedColors.add(c));
        this.log(`⛔ ALL RED and GREEN ROADS are blocked for this round!`, 'alert');
        break;
      }

      case 'LIGHT_TRAFFIC_OTHERS':
        this.players.forEach((p, idx) => {
          if (idx !== playerIndex) {
            p.lightTrafficBonus = true;
          }
        });
        this.log(`🟢 Traffic has cleared to LIGHT for all other players this turn!`, 'bonus');
        break;

      case 'TAXI_TO_TRAIN': {
        const nearestTrain = this.findNearestNode(player.currentNodeId, (n) => n.hasTrain);
        if (nearestTrain) {
          player.previousNodeId = player.currentNodeId;
          player.currentNodeId = nearestTrain.id;
          this.log(`🚕 ${player.name} took a Taxi to Train Station ${nearestTrain.name}!`, 'action');
        }
        break;
      }

      default:
        break;
    }

    // Send card to discard pile
    this.discardPile.push(card);
    const handIdx = player.abilityHand.findIndex((c) => c.instanceId === card.instanceId);
    if (handIdx !== -1) {
      player.abilityHand.splice(handIdx, 1);
    }
  }

  // --- Graph BFS Utilities ---
  findNearestNode(fromNodeId, predicate) {
    const queue = [{ nodeId: fromNodeId, dist: 0 }];
    const visited = new Set([fromNodeId]);

    while (queue.length > 0) {
      const { nodeId, dist } = queue.shift();
      const node = this.nodesMap.get(nodeId);
      if (node && predicate(node)) {
        return node;
      }

      const connectedEdges = this.getConnectedEdges(nodeId);
      for (const edge of connectedEdges) {
        const neighborId = this.getAdjacentNodeId(edge, nodeId);
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push({ nodeId: neighborId, dist: dist + 1 });
        }
      }
    }
    return null;
  }

  calculateShortestPathDistance(fromNodeId, toNodeId) {
    if (fromNodeId === toNodeId) return 0;
    const queue = [{ nodeId: fromNodeId, dist: 0 }];
    const visited = new Set([fromNodeId]);

    while (queue.length > 0) {
      const { nodeId, dist } = queue.shift();
      if (nodeId === toNodeId) return dist;

      const connectedEdges = this.getConnectedEdges(nodeId);
      for (const edge of connectedEdges) {
        const neighborId = this.getAdjacentNodeId(edge, nodeId);
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push({ nodeId: neighborId, dist: dist + 1 });
        }
      }
    }
    return 10; // Default fallback
  }

  // --- Final Endgame Calculations ---
  finishGame() {
    this.phase = 'GAME_OVER';
    this.log(`🏁 === THE RACE HAS CONCLUDED! TALLYING FINAL SCORES === 🏁`, 'victory');

    // 1. Fastest Player Bonus (+15 pts for 1st place to finish)
    if (this.winner) {
      this.winner.score += 15;
      this.winner.fastestBonus = 15;
      this.log(`🥇 ${this.winner.name} receives the +15 PTS Fastest Player Bonus!`, 'bonus');
    }

    // 2. Money Bonus & Distance Penalties
    this.players.forEach((p) => {
      // Money bonus: 1 leftover unit currency = 1 point
      p.moneyBonus = p.money;
      p.score += p.money;
      this.log(`💰 ${p.name} earned +${p.money} pts from leftover currency.`, 'bonus');

      // Distance penalty: -6 pts per intersection from STOP if not finished
      if (!p.hasFinished) {
        const distance = this.calculateShortestPathDistance(p.currentNodeId, 'STOP');
        const penalty = distance * 6;
        p.distanceToStop = distance;
        p.distancePenalty = penalty;
        p.score = Math.max(0, p.score - penalty);
        this.log(`📏 ${p.name} was ${distance} stops away from STOP (-${penalty} pts penalty).`, 'alert');
      } else {
        p.distanceToStop = 0;
        p.distancePenalty = 0;
      }
    });

    // 3. Sort players by final score descending + tiebreakers
    this.players.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Tiebreaker 1: Closer to STOP (less distance penalty)
      if (a.distanceToStop !== b.distanceToStop) return a.distanceToStop - b.distanceToStop;
      // Tiebreaker 2: More money
      return b.money - a.money;
    });

    const champion = this.players[0];
    this.log(`👑🏆 CHAMPION: ${champion.name} with ${champion.score} total points!`, 'victory');

    if (this.onGameOverCallback) {
      this.onGameOverCallback(this.players);
    }
  }
}
