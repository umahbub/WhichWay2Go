/**
 * Which Way to Go! (K2G Online) - Multiplayer & Room Lobby Network Manager
 * Provides zero-backend real-time multiplayer over public WebSockets (HiveMQ/EMQX)
 * with automatic BroadcastChannel fallback for local/multi-tab play.
 */
(function(window) {
  'use strict';

  const BROKER_URLS = [
    'wss://broker.hivemq.com:8884/mqtt',
    'wss://broker.emqx.io:8084/mqtt'
  ];

  class MultiplayerManager {
    constructor() {
      this.clientId = 'client_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).slice(-4);
      this.mqttClient = null;
      this.currentRoomId = null;
      this.isHost = false;
      this.localPlayer = null;
      this.roomState = null;
      this.heartbeatTimer = null;
      this.openRooms = new Map(); // roomId -> { roomId, hostName, maxPlayers, players, status, updatedAt }
      this.processedMsgIds = new Set();
      
      this.onOpenRoomsChanged = null;
      this.onRoomStateChanged = null;
      this.onGameActionReceived = null;
      this.onChatMessageReceived = null;
      this.onConnectionStatusChanged = null;

      this.localLobbyChannel = null;
      this.localRoomChannel = null;

      this.initLocalChannels();
      this.connectBroker();
      this.startRoomCleaner();
    }

    initLocalChannels() {
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          this.localLobbyChannel = new BroadcastChannel('k2g_lobby_broadcast');
          this.localLobbyChannel.onmessage = (e) => {
            if (e.data) this.handleLobbyMessage(e.data);
          };
        } catch (err) {
          console.warn('[Multiplayer] BroadcastChannel not supported:', err);
        }
      }
    }

    connectBroker(brokerIdx = 0) {
      if (typeof mqtt === 'undefined') {
        console.warn('[Multiplayer] MQTT.js not loaded. Operating in BroadcastChannel local mode.');
        if (this.onConnectionStatusChanged) this.onConnectionStatusChanged('local-only');
        return;
      }

      const brokerUrl = BROKER_URLS[brokerIdx % BROKER_URLS.length];
      console.log(`[Multiplayer] Connecting to WebSocket broker: ${brokerUrl}`);
      if (this.onConnectionStatusChanged) this.onConnectionStatusChanged('connecting');

      try {
        this.mqttClient = mqtt.connect(brokerUrl, {
          clientId: this.clientId,
          clean: true,
          connectTimeout: 5000,
          reconnectPeriod: 6000
        });

        this.mqttClient.on('connect', () => {
          console.log('[Multiplayer] Connected to WebSocket broker successfully!');
          if (this.onConnectionStatusChanged) this.onConnectionStatusChanged('online');
          
          // Subscribe to public lobby announcements
          this.mqttClient.subscribe('k2g/v1/lobby/discovery', { qos: 0 });
          
          // If already in a room, resubscribe
          if (this.currentRoomId) {
            this.mqttClient.subscribe(`k2g/v1/room/${this.currentRoomId}`, { qos: 0 });
          }

          // Request discovery ping
          this.publishLobbyPing();
        });

        this.mqttClient.on('message', (topic, message) => {
          try {
            const data = JSON.parse(message.toString());
            if (topic === 'k2g/v1/lobby/discovery') {
              this.handleLobbyMessage(data);
            } else if (this.currentRoomId && topic === `k2g/v1/room/${this.currentRoomId}`) {
              this.handleRoomMessage(data);
            }
          } catch (e) {
            console.error('[Multiplayer] Failed to parse incoming message:', e);
          }
        });

        this.mqttClient.on('error', (err) => {
          console.warn('[Multiplayer] MQTT broker error:', err);
          if (this.onConnectionStatusChanged) this.onConnectionStatusChanged('error');
        });

        this.mqttClient.on('close', () => {
          if (this.onConnectionStatusChanged) this.onConnectionStatusChanged('disconnected');
        });
      } catch (err) {
        console.error('[Multiplayer] Exception initializing MQTT client:', err);
      }
    }

    // Generate random 6-character alphanumeric Game ID (e.g., K2G-4819)
    generateGameId() {
      const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
      let id = 'K2G-';
      for (let i = 0; i < 4; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return id;
    }

    // ==========================================
    // LOBBY DISCOVERY & HEARTBEAT
    // ==========================================
    publishLobbyPing() {
      const payload = { type: 'LOBBY_PING', senderId: this.clientId, time: Date.now() };
      this.sendToLobby(payload);
    }

    sendToLobby(data) {
      const str = JSON.stringify(data);
      if (this.mqttClient && this.mqttClient.connected) {
        this.mqttClient.publish('k2g/v1/lobby/discovery', str);
      }
      if (this.localLobbyChannel) {
        this.localLobbyChannel.postMessage(data);
      }
    }

    handleLobbyMessage(data) {
      if (!data || !data.type) return;

      if (data.type === 'ROOM_HEARTBEAT') {
        const { roomId, hostName, maxPlayers, players, status } = data;
        if (!roomId) return;
        this.openRooms.set(roomId, {
          roomId,
          hostName,
          maxPlayers: maxPlayers || 4,
          players: players || [],
          playerCount: (players && players.length) || 1,
          status: status || 'WAITING',
          updatedAt: Date.now()
        });
        this.notifyOpenRoomsChanged();
      } else if (data.type === 'LOBBY_PING') {
        // If we are host, respond immediately with heartbeat
        if (this.isHost && this.currentRoomId && this.roomState) {
          this.broadcastRoomHeartbeat();
        }
      }
    }

    startRoomCleaner() {
      // Periodically purge stale rooms older than 10 seconds
      setInterval(() => {
        const now = Date.now();
        let changed = false;
        for (const [roomId, room] of this.openRooms.entries()) {
          if (now - room.updatedAt > 10000) {
            this.openRooms.delete(roomId);
            changed = true;
          }
        }
        if (changed) this.notifyOpenRoomsChanged();
      }, 3000);
    }

    notifyOpenRoomsChanged() {
      if (this.onOpenRoomsChanged) {
        const list = Array.from(this.openRooms.values()).sort((a, b) => b.updatedAt - a.updatedAt);
        this.onOpenRoomsChanged(list);
      }
    }

    // ==========================================
    // ROOM CREATION & MANAGEMENT
    // ==========================================
    createRoom(hostName, colorHex, maxPlayers = 4) {
      const roomId = this.generateGameId();
      this.currentRoomId = roomId;
      this.isHost = true;

      this.localPlayer = {
        clientId: this.clientId,
        name: hostName || 'Host',
        color: colorHex || '#ef4444',
        isHost: true,
        isAi: false
      };

      this.roomState = {
        roomId: roomId,
        hostId: this.clientId,
        maxPlayers: maxPlayers,
        status: 'WAITING', // 'WAITING', 'PLAYING'
        players: [this.localPlayer],
        messages: []
      };

      this.initRoomNetworking(roomId);
      this.broadcastRoomHeartbeat();

      // Start periodic heartbeat
      if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = setInterval(() => {
        if (this.isHost && this.currentRoomId) {
          this.broadcastRoomHeartbeat();
        }
      }, 3000);

      if (this.onRoomStateChanged) this.onRoomStateChanged(this.roomState);
      return roomId;
    }

    joinRoom(roomId, playerName, colorHex) {
      const cleanedId = roomId.trim().toUpperCase();
      this.currentRoomId = cleanedId;
      this.isHost = false;

      this.localPlayer = {
        clientId: this.clientId,
        name: playerName || 'Player',
        color: colorHex || '#3b82f6',
        isHost: false,
        isAi: false
      };

      this.roomState = {
        roomId: cleanedId,
        hostId: null,
        maxPlayers: 4,
        status: 'WAITING',
        players: [this.localPlayer],
        messages: []
      };

      this.initRoomNetworking(cleanedId);

      // Request join to room
      const joinMsg = {
        type: 'PLAYER_JOIN_REQUEST',
        roomId: cleanedId,
        player: this.localPlayer,
        msgId: this.generateMsgId(),
        time: Date.now()
      };
      this.sendToRoom(joinMsg);

      if (this.onRoomStateChanged) this.onRoomStateChanged(this.roomState);
      return cleanedId;
    }

    leaveRoom() {
      if (this.currentRoomId) {
        this.sendToRoom({
          type: 'PLAYER_LEAVE',
          clientId: this.clientId,
          playerName: this.localPlayer ? this.localPlayer.name : 'A player',
          msgId: this.generateMsgId(),
          time: Date.now()
        });

        if (this.localRoomChannel) {
          this.localRoomChannel.close();
          this.localRoomChannel = null;
        }
        if (this.mqttClient && this.mqttClient.connected) {
          this.mqttClient.unsubscribe(`k2g/v1/room/${this.currentRoomId}`);
        }
      }

      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }

      this.currentRoomId = null;
      this.isHost = false;
      this.roomState = null;
      if (this.onRoomStateChanged) this.onRoomStateChanged(null);
    }

    initRoomNetworking(roomId) {
      if (this.mqttClient && this.mqttClient.connected) {
        this.mqttClient.subscribe(`k2g/v1/room/${roomId}`, { qos: 0 });
      }

      if (typeof BroadcastChannel !== 'undefined') {
        if (this.localRoomChannel) this.localRoomChannel.close();
        this.localRoomChannel = new BroadcastChannel(`k2g_room_${roomId}`);
        this.localRoomChannel.onmessage = (e) => {
          if (e.data) this.handleRoomMessage(e.data);
        };
      }
    }

    broadcastRoomHeartbeat() {
      if (!this.roomState) return;
      const heartbeat = {
        type: 'ROOM_HEARTBEAT',
        roomId: this.roomState.roomId,
        hostName: this.localPlayer ? this.localPlayer.name : 'Host',
        maxPlayers: this.roomState.maxPlayers,
        players: this.roomState.players.map(p => ({ name: p.name, color: p.color, isAi: p.isAi })),
        status: this.roomState.status,
        time: Date.now()
      };
      this.sendToLobby(heartbeat);
    }

    addAiBotToRoom(botName, botColorHex) {
      if (!this.isHost || !this.roomState) return;
      if (this.roomState.players.length >= this.roomState.maxPlayers) return;

      const botPlayer = {
        clientId: 'bot_' + Math.random().toString(36).substr(2, 6),
        name: botName || `AI Bot ${this.roomState.players.length + 1}`,
        color: botColorHex || '#10b981',
        isHost: false,
        isAi: true
      };

      this.roomState.players.push(botPlayer);
      this.broadcastRoomSync();
      this.broadcastRoomHeartbeat();
      if (this.onRoomStateChanged) this.onRoomStateChanged(this.roomState);
    }

    removePlayerFromRoom(clientId) {
      if (!this.isHost || !this.roomState) return;
      this.roomState.players = this.roomState.players.filter(p => p.clientId !== clientId);
      this.broadcastRoomSync();
      this.broadcastRoomHeartbeat();
      if (this.onRoomStateChanged) this.onRoomStateChanged(this.roomState);
    }

    broadcastRoomSync() {
      if (!this.isHost || !this.roomState) return;
      const syncMsg = {
        type: 'ROOM_SYNC',
        roomState: this.roomState,
        msgId: this.generateMsgId(),
        time: Date.now()
      };
      this.sendToRoom(syncMsg);
    }

    sendChatMessage(text) {
      if (!text || !this.currentRoomId || !this.localPlayer) return;
      const chatMsg = {
        type: 'CHAT_MESSAGE',
        senderName: this.localPlayer.name,
        senderColor: this.localPlayer.color,
        text: text.trim(),
        msgId: this.generateMsgId(),
        time: Date.now()
      };
      this.sendToRoom(chatMsg);
    }

    sendGameAction(actionType, actionData) {
      if (!this.currentRoomId) return;
      const msg = {
        type: 'GAME_ACTION',
        actionType: actionType,
        actionData: actionData,
        senderId: this.clientId,
        msgId: this.generateMsgId(),
        time: Date.now()
      };
      this.sendToRoom(msg);
    }

    sendToRoom(msg) {
      const str = JSON.stringify(msg);
      if (this.mqttClient && this.mqttClient.connected && this.currentRoomId) {
        this.mqttClient.publish(`k2g/v1/room/${this.currentRoomId}`, str);
      }
      if (this.localRoomChannel) {
        this.localRoomChannel.postMessage(msg);
      }
      // If chat message, immediately record locally too
      if (msg.type === 'CHAT_MESSAGE') {
        this.handleRoomMessage(msg);
      }
    }

    generateMsgId() {
      return this.clientId + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }

    // ==========================================
    // ROOM MESSAGE DISPATCHER
    // ==========================================
    handleRoomMessage(msg) {
      if (!msg || !msg.type || !msg.msgId) return;
      if (this.processedMsgIds.has(msg.msgId)) return;
      this.processedMsgIds.add(msg.msgId);
      if (this.processedMsgIds.size > 200) {
        // Prune oldest
        const first = this.processedMsgIds.values().next().value;
        this.processedMsgIds.delete(first);
      }

      switch (msg.type) {
        case 'PLAYER_JOIN_REQUEST': {
          if (this.isHost && this.roomState) {
            const newP = msg.player;
            const existing = this.roomState.players.find(p => p.clientId === newP.clientId);
            if (!existing) {
              if (this.roomState.players.length < this.roomState.maxPlayers) {
                this.roomState.players.push(newP);
                this.broadcastRoomSync();
                this.broadcastRoomHeartbeat();
                if (this.onRoomStateChanged) this.onRoomStateChanged(this.roomState);
              }
            } else {
              this.broadcastRoomSync();
            }
          }
          break;
        }

        case 'ROOM_SYNC': {
          if (!this.isHost && msg.roomState) {
            this.roomState = msg.roomState;
            if (this.onRoomStateChanged) this.onRoomStateChanged(this.roomState);
          }
          break;
        }

        case 'PLAYER_LEAVE': {
          if (this.roomState) {
            this.roomState.players = this.roomState.players.filter(p => p.clientId !== msg.clientId);
            if (this.isHost) {
              this.broadcastRoomSync();
              this.broadcastRoomHeartbeat();
            }
            if (this.onRoomStateChanged) this.onRoomStateChanged(this.roomState);
          }
          break;
        }

        case 'CHAT_MESSAGE': {
          if (this.onChatMessageReceived) {
            this.onChatMessageReceived({
              senderName: msg.senderName,
              senderColor: msg.senderColor,
              text: msg.text,
              time: msg.time
            });
          }
          break;
        }

        case 'GAME_ACTION': {
          // If action originated from other player, fire callback
          if (this.onGameActionReceived && msg.senderId !== this.clientId) {
            this.onGameActionReceived(msg.actionType, msg.actionData);
          }
          break;
        }
      }
    }
  }

  window.K2GMultiplayer = new MultiplayerManager();

})(window);
