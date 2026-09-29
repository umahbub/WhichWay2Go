/**
 * Which Way to Go! (K2G Online) - AI Opponent Engine
 * Heuristic AI decision maker for solo & multi-bot gameplay.
 */

export class AIPlayer {
  constructor(engine) {
    this.engine = engine;
  }

  // Choose best move during Travel Round
  chooseTravelMove(playerIndex) {
    const player = this.engine.players[playerIndex];
    const validMoves = this.engine.getValidMovesForPlayer(playerIndex);

    if (validMoves.length === 0) return null;

    // Evaluate each move
    const scoredMoves = validMoves.map((move) => {
      let heuristic = 0;
      const targetDist = this.engine.calculateShortestPathDistance(move.targetNodeId, 'STOP');
      const currentDist = this.engine.calculateShortestPathDistance(player.currentNodeId, 'STOP');

      // 1. Distance improvement towards STOP (high priority)
      const distDelta = currentDist - targetDist;
      heuristic += distDelta * 28;

      // 2. Points earned
      heuristic += move.pointsEarned * 2.2;

      // 3. Currency conservation
      if (move.canAfford) {
        // Spending is acceptable if points or progress is high
        heuristic -= move.cost * 1.2;
      } else {
        // High penalty for unpaid bus/train penalties
        heuristic -= (move.unpaidPenalty || 15) * 3;
      }

      // 4. Target node perks
      const target = move.targetNode;
      if (target.isStop) {
        heuristic += 1000; // Finish line priority!
      }
      if (target.hasCard) {
        heuristic += 14; // Drawing ability cards is beneficial
      }
      if (target.hasTrain && player.money >= 9) {
        heuristic += 8; // Access to rapid train line
      }

      // Random jitter for variety based on difficulty
      const jitter = player.aiDifficulty === 'easy' ? (Math.random() * 20 - 10) : (Math.random() * 4 - 2);
      heuristic += jitter;

      return { move, score: heuristic };
    });

    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves[0].move;
  }

  // Choose which card to keep when drawing 2 cards
  chooseCardToKeep(playerIndex, cards) {
    if (!cards || cards.length < 2) return cards[0]?.instanceId;

    const rankCard = (card) => {
      let val = 10;
      if (card.category === 'ADVANTAGE') val += 30;
      if (card.id.includes('CURRENCY')) val += 25;
      if (card.id.includes('RUN')) val += 20;
      if (card.id === 'BYPASS_ROADBLOCK') val += 15;
      if (card.category === 'ATTACK') val += 18;
      if (card.category === 'DISADVANTAGE') val -= 40;
      return val;
    };

    const s0 = rankCard(cards[0]);
    const s1 = rankCard(cards[1]);
    return s0 >= s1 ? cards[0].instanceId : cards[1].instanceId;
  }

  // Choose ability card to play during Ability Round
  chooseAbilityCardToPlay(playerIndex) {
    const player = this.engine.players[playerIndex];
    if (!player.abilityHand || player.abilityHand.length === 0) return null;

    // Pick advantageous card if sensible
    for (const card of player.abilityHand) {
      if (card.id === 'CHANGE_TRAFFIC') {
        return { card, targetDetails: {} };
      }
      if (card.id.startsWith('BLOCK_ROAD') || card.id.startsWith('BLOCK_COLOR')) {
        return { card, targetDetails: { color: 'red' } };
      }
      if (card.id.startsWith('STEAL_')) {
        // Target leading player
        const leaderIdx = this.findLeadingOpponentIndex(playerIndex);
        return { card, targetDetails: { targetPlayerIndex: leaderIdx } };
      }
      if (card.id === 'RUN_9' || card.id === 'RUN_12') {
        return { card, targetDetails: {} };
      }
      if (card.id === 'TAXI_TO_TRAIN') {
        return { card, targetDetails: {} };
      }
    }

    return null;
  }

  findLeadingOpponentIndex(excludeIndex) {
    let bestIdx = (excludeIndex + 1) % this.engine.players.length;
    let maxScore = -1;
    this.engine.players.forEach((p, idx) => {
      if (idx !== excludeIndex && !p.hasFinished && p.score > maxScore) {
        maxScore = p.score;
        bestIdx = idx;
      }
    });
    return bestIdx;
  }
}
