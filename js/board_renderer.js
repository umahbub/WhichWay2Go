/**
 * Which Way to Go! (K2G Online) - Board Canvas & Overlay Renderer
 * Supports Pan, Zoom, Interactive Nodes, Route Highlighting, and Animated Tokens.
 */

import { BOARD_CONFIG, BOARD_NODES, BOARD_EDGES, SPEED_CHART } from './game_data.js';

export class BoardRenderer {
  constructor(canvas, engine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.engine = engine;

    this.boardWidth = BOARD_CONFIG.width;
    this.boardHeight = BOARD_CONFIG.height;

    // Viewport transform (Pan & Zoom)
    this.scale = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;

    // Board Image
    this.bgImage = new Image();
    this.imageLoaded = false;
    this.bgImage.onload = () => {
      this.imageLoaded = true;
      this.render();
    };
    this.bgImage.src = BOARD_CONFIG.imageSrc;

    // Interaction state
    this.hoveredNode = null;
    this.selectedMoveOption = null;
    this.highlightedMoves = []; // Valid move options for current active player
    this.showVectorOverlay = true;
    this.showNodeLabels = true;
    this.editMode = false;
    this.draggingNode = null;

    this.animationPulse = 0;
    this.initEvents();
    this.startAnimationLoop();
  }

  initEvents() {
    window.addEventListener('resize', () => this.resizeCanvas());
    this.resizeCanvas();

    // Mouse drag for panning
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('mouseup', () => this.onMouseUp());

    // Wheel for zooming
    this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

    // Touch support for mobile/tablet
    this.initTouchEvents();
  }

  resizeCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.fitBoardToView();
  }

  fitBoardToView() {
    const scaleX = this.canvas.width / this.boardWidth;
    const scaleY = this.canvas.height / this.boardHeight;
    this.scale = Math.min(scaleX, scaleY) * 0.95;
    this.panX = (this.canvas.width - this.boardWidth * this.scale) / 2;
    this.panY = (this.canvas.height - this.boardHeight * this.scale) / 2;
    this.render();
  }

  // Coordinate Conversion
  screenToWorld(screenX, screenY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (screenX - rect.left - this.panX) / this.scale;
    const y = (screenY - rect.top - this.panY) / this.scale;
    return { x, y };
  }

  worldToScreen(worldX, worldY) {
    return {
      x: worldX * this.scale + this.panX,
      y: worldY * this.scale + this.panY
    };
  }

  getNodePixel(node) {
    return {
      x: node.x * this.boardWidth,
      y: node.y * this.boardHeight
    };
  }

  findNodeAt(worldX, worldY, radius = 38) {
    for (const node of this.engine.nodesMap.values()) {
      const p = this.getNodePixel(node);
      const dist = Math.hypot(p.x - worldX, p.y - worldY);
      if (dist <= radius) {
        return node;
      }
    }
    return null;
  }

  onMouseDown(e) {
    const pos = this.screenToWorld(e.clientX, e.clientY);
    const clickedNode = this.findNodeAt(pos.x, pos.y);

    if (this.editMode && clickedNode) {
      this.draggingNode = clickedNode;
      return;
    }

    if (clickedNode && this.onNodeClick) {
      this.onNodeClick(clickedNode);
      return;
    }

    // Otherwise, start drag pan
    this.isDragging = true;
    this.dragStartX = e.clientX - this.panX;
    this.dragStartY = e.clientY - this.panY;
  }

  onMouseMove(e) {
    if (this.editMode && this.draggingNode) {
      const pos = this.screenToWorld(e.clientX, e.clientY);
      this.draggingNode.x = Math.max(0.01, Math.min(0.99, +(pos.x / this.boardWidth).toFixed(3)));
      this.draggingNode.y = Math.max(0.01, Math.min(0.99, +(pos.y / this.boardHeight).toFixed(3)));
      this.render();
      return;
    }

    if (this.isDragging) {
      this.panX = e.clientX - this.dragStartX;
      this.panY = e.clientY - this.dragStartY;
      this.render();
      return;
    }

    const pos = this.screenToWorld(e.clientX, e.clientY);
    const node = this.findNodeAt(pos.x, pos.y);
    if (node !== this.hoveredNode) {
      this.hoveredNode = node;
      this.canvas.style.cursor = node ? 'pointer' : 'grab';
      this.render();
      if (this.onNodeHover) {
        this.onNodeHover(node);
      }
    }
  }

  onMouseUp() {
    this.isDragging = false;
    this.draggingNode = null;
  }

  onWheel(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newScale = Math.max(0.25, Math.min(4.5, this.scale * zoomFactor));
    this.panX = mouseX - (mouseX - this.panX) * (newScale / this.scale);
    this.panY = mouseY - (mouseY - this.panY) * (newScale / this.scale);
    this.scale = newScale;
    this.render();
  }

  initTouchEvents() {
    let lastTouchDist = 0;
    let touchStartX = 0;
    let touchStartY = 0;

    this.canvas.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length === 1) {
          touchStartX = e.touches[0].clientX - this.panX;
          touchStartY = e.touches[0].clientY - this.panY;
        } else if (e.touches.length === 2) {
          lastTouchDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
        }
      },
      { passive: true }
    );

    this.canvas.addEventListener(
      'touchmove',
      (e) => {
        if (e.touches.length === 1) {
          this.panX = e.touches[0].clientX - touchStartX;
          this.panY = e.touches[0].clientY - touchStartY;
          this.render();
        } else if (e.touches.length === 2) {
          const dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          if (lastTouchDist > 0) {
            const factor = dist / lastTouchDist;
            this.scale = Math.max(0.25, Math.min(4.5, this.scale * factor));
            this.render();
          }
          lastTouchDist = dist;
        }
      },
      { passive: true }
    );

    this.canvas.addEventListener('touchend', (e) => {
      if (e.touches.length === 0 && e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        const pos = this.screenToWorld(touch.clientX, touch.clientY);
        const node = this.findNodeAt(pos.x, pos.y);
        if (node && this.onNodeClick) {
          this.onNodeClick(node);
        }
      }
    });
  }

  startAnimationLoop() {
    const loop = () => {
      this.animationPulse = (Date.now() / 600) % (Math.PI * 2);
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // --- Rendering Pipeline ---
  render() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(this.panX, this.panY);
    ctx.scale(this.scale, this.scale);

    // 1. Draw Board Background Image
    if (this.imageLoaded) {
      ctx.drawImage(this.bgImage, 0, 0, this.boardWidth, this.boardHeight);
    } else {
      // Elegant fallback background
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, this.boardWidth, this.boardHeight);
    }

    // 2. Vector Roads & Railroad Overlays
    if (this.showVectorOverlay) {
      this.drawEdges();
    }

    // 3. Highlighted Valid Destination Roads
    this.drawValidMovePaths();

    // 4. Draw Roadblocks
    this.drawRoadblocks();

    // 5. Draw Interactive Nodes
    this.drawNodes();

    // 6. Draw Player Tokens
    this.drawPlayerTokens();

    ctx.restore();
  }

  drawEdges() {
    const { ctx } = this;

    for (const edge of this.engine.edges) {
      const fromNode = this.engine.nodesMap.get(edge.from);
      const toNode = this.engine.nodesMap.get(edge.to);
      if (!fromNode || !toNode) continue;

      const p1 = this.getNodePixel(fromNode);
      const p2 = this.getNodePixel(toNode);

      ctx.save();
      if (edge.type === 'rail') {
        // Railroad track (Purple sleeper lines)
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Inner railway track dash
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.setLineDash([12, 10]);
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      } else {
        // Road colors (red, green, blue)
        let color = '#3b82f6';
        if (edge.color === 'red') color = '#ef4444';
        if (edge.color === 'green') color = '#10b981';

        const isColorBlocked = this.engine.blockedColors.has(edge.color);

        ctx.strokeStyle = isColorBlocked ? '#64748b' : color;
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.globalAlpha = isColorBlocked ? 0.35 : 0.45;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  drawValidMovePaths() {
    if (!this.highlightedMoves || this.highlightedMoves.length === 0) return;
    const { ctx } = this;
    const activePlayer = this.engine.players[this.engine.activePlayerIndex];
    if (!activePlayer) return;

    const currentPos = this.getNodePixel(this.engine.nodesMap.get(activePlayer.currentNodeId));

    ctx.save();
    for (const move of this.highlightedMoves) {
      const targetPos = this.getNodePixel(move.targetNode);

      // Animated glowing dash towards valid targets
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.setLineDash([16, 12]);
      ctx.lineDashOffset = -Date.now() / 35;
      ctx.globalAlpha = 0.85;

      ctx.beginPath();
      ctx.moveTo(currentPos.x, currentPos.y);
      ctx.lineTo(targetPos.x, targetPos.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawRoadblocks() {
    const { ctx } = this;
    for (const edgeId of this.engine.blockedEdges) {
      const edge = this.engine.edges.find((e) => e.id === edgeId);
      if (!edge) continue;
      const p1 = this.getNodePixel(this.engine.nodesMap.get(edge.from));
      const p2 = this.getNodePixel(this.engine.nodesMap.get(edge.to));
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      ctx.save();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(midX, midY, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Roadblock X
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(midX - 10, midY - 10);
      ctx.lineTo(midX + 10, midY + 10);
      ctx.moveTo(midX + 10, midY - 10);
      ctx.lineTo(midX - 10, midY + 10);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawNodes() {
    const { ctx } = this;
    const pulseVal = Math.sin(this.animationPulse);
    const validTargetIds = new Set(this.highlightedMoves.map((m) => m.targetNodeId));

    for (const node of this.engine.nodesMap.values()) {
      const p = this.getNodePixel(node);
      const isHovered = this.hoveredNode === node;
      const isValidTarget = validTargetIds.has(node.id);

      ctx.save();

      // 1. Valid Target Pulsing Halo
      if (isValidTarget) {
        const haloRadius = 34 + pulseVal * 6;
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 6;
        ctx.globalAlpha = 0.8 + pulseVal * 0.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, haloRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 2. Node Circle
      let radius = node.isStart || node.isStop ? 36 : 26;
      if (isHovered) radius += 4;

      if (node.isStart) {
        ctx.fillStyle = '#eab308'; // START Yellow
        ctx.strokeStyle = '#ca8a04';
      } else if (node.isStop) {
        ctx.fillStyle = '#22c55e'; // STOP Emerald Green
        ctx.strokeStyle = '#15803d';
      } else {
        ctx.fillStyle = '#0f172a'; // Deep Navy Node
        ctx.strokeStyle = isValidTarget ? '#f59e0b' : '#94a3b8';
      }

      ctx.lineWidth = isValidTarget ? 5 : 3;
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 3. Inner Label / Icon
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (node.isStart) {
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText('START', p.x, p.y);
      } else if (node.isStop) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('STOP', p.x, p.y);
      } else if (node.hasCard) {
        // Red 'A' Ability badge
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('A', p.x, p.y);
      } else if (node.hasHospital) {
        // Red Cross
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('✚', p.x, p.y);
      } else if (node.hasTrain) {
        ctx.font = '16px sans-serif';
        ctx.fillText('🚂', p.x, p.y);
      } else if (node.hasBus) {
        ctx.font = '16px sans-serif';
        ctx.fillText('🚌', p.x, p.y);
      } else if (node.hasCar) {
        ctx.font = '14px sans-serif';
        ctx.fillText('🚗', p.x, p.y);
      } else if (node.hasBike) {
        ctx.font = '14px sans-serif';
        ctx.fillText('🏍️', p.x, p.y);
      }

      // 4. Mini Badges around Node (Icons for multi-vehicle nodes)
      this.drawNodeBadges(node, p);

      ctx.restore();
    }
  }

  drawNodeBadges(node, p) {
    if (node.isStart || node.isStop) return;
    const { ctx } = this;
    const badges = [];
    if (node.hasTrain && !node.hasCard) badges.push('🚂');
    if (node.hasBus) badges.push('🚌');
    if (node.hasCar) badges.push('🚗');
    if (node.hasBike) badges.push('🏍️');
    if (node.hasHospital) badges.push('🏥');

    if (badges.length > 1) {
      badges.forEach((badge, idx) => {
        const angle = -Math.PI / 2 + (idx * (Math.PI * 2)) / badges.length;
        const bx = p.x + Math.cos(angle) * 34;
        const by = p.y + Math.sin(angle) * 34;

        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bx, by, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badge, bx, by);
        ctx.restore();
      });
    }
  }

  drawPlayerTokens() {
    const { ctx } = this;
    // Group players by current node
    const nodeGroups = new Map();
    this.engine.players.forEach((player, idx) => {
      const list = nodeGroups.get(player.currentNodeId) || [];
      list.push({ player, idx });
      nodeGroups.set(player.currentNodeId, list);
    });

    nodeGroups.forEach((playersAtNode, nodeId) => {
      const node = this.engine.nodesMap.get(nodeId);
      if (!node) return;
      const p = this.getNodePixel(node);
      const count = playersAtNode.length;

      playersAtNode.forEach(({ player, idx }, rank) => {
        let tx = p.x;
        let ty = p.y;

        // If multiple players share a node, spread them around the circumference
        if (count > 1) {
          const angle = (rank * Math.PI * 2) / count;
          const offsetRadius = 26;
          tx += Math.cos(angle) * offsetRadius;
          ty += Math.sin(angle) * offsetRadius;
        }

        const isActive = idx === this.engine.activePlayerIndex;
        const tokenRadius = isActive ? 16 : 13;

        ctx.save();
        // Drop shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // Player Token Outer Ring
        ctx.fillStyle = player.color.hex;
        ctx.strokeStyle = isActive ? '#fbbf24' : '#ffffff';
        ctx.lineWidth = isActive ? 4 : 2;
        ctx.beginPath();
        ctx.arc(tx, ty, tokenRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Player Initial
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = player.color.text;
        ctx.font = `bold ${isActive ? '13px' : '11px'} sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.name.charAt(0).toUpperCase(), tx, ty);

        // Active Player Floating Crown / Marker
        if (isActive) {
          ctx.font = '16px sans-serif';
          ctx.fillText('👑', tx, ty - 22);
        }

        ctx.restore();
      });
    });
  }
}
