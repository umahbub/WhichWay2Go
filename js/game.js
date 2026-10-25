/**
 * Which Way to Go! (K2G Online) - Standalone Browser Bundle
 * Concept & Original Game Design by Upal Mahbub (2022).
 * 
 * Features:
 * - Unified Single-Turn Flow (Each player takes 1 turn per round: Play Ability Cards + Move)
 * - Staggered Multi-tier Graph (organic node distances across Dhaka)
 * - Beautiful Curved Railroad Lines (Quadratic Bézier curves with perpendicular railway ties)
 * - Single Outgoing Train Line Rule (Max 1 outgoing track per station, multiple incoming lines allowed)
 * - Interactive Ability Card Execution with Choice Modals (Roadblock color, Vehicle permit, Target opponent steal)
 * - Unobscured Node Side Badges (Hospital, Ability Card, Vehicle stations on outer perimeter)
 * - Full Roster Player Locator with target highlight
 */

(function () {
  'use strict';

  // ==========================================
  // 1. GAME DATA & CONFIGURATION
  // ==========================================
  const BOARD_CONFIG = {
    width: 1728,
    height: 1728,
    imageSrc: 'board_game_assets/K2G-WhichWayToGo-Borad-v2.jpg'
  };

  const SPEED_CHART = {
    run:   { id: 'run',   name: 'Walk / Run',        icon: '🏃', cost: 0, heavy: 3,  medium: 3,  light: 3,  description: 'Free on any road. Steady +3 pts regardless of traffic.' },
    bike:  { id: 'bike',  name: 'Motorcycle / Bike', icon: '🏍️', cost: 2, heavy: 8,  medium: 8,  light: 10, description: 'Cost 2. Weaves through Heavy traffic (8 pts)! Keep riding on consecutive road turns.' },
    bus:   { id: 'bus',   name: 'Public Bus',        icon: '🚌', cost: 3, heavy: 6,  medium: 10, light: 13, description: 'Cost 3. Great value (6/10/13 pts), boards only at Bus Stations (🚌).' },
    car:   { id: 'car',   name: 'Car / Taxi',        icon: '🚗', cost: 6, heavy: 6,  medium: 12, light: 19, description: 'Cost 6. Fastest on Light roads (19 pts!), stuck in Heavy gridlock (6 pts). Keep riding on consecutive road turns.' },
    train: { id: 'train', name: 'Express Train',     icon: '🚂', cost: 6, heavy: 16, medium: 16, light: 16, description: 'Cost 6. Fixed 16 pts on Rail Tracks from Train Stations (🚂). Immune to traffic & roadblocks!' }
  };

  const TRAFFIC_STATUS_ROWS = [
    { roll: 1, heavy: 'blue',  medium: 'red',   light: 'green' },
    { roll: 2, heavy: 'blue',  medium: 'green', light: 'red' },
    { roll: 3, heavy: 'green', medium: 'red',   light: 'blue' },
    { roll: 4, heavy: 'green', medium: 'blue',  light: 'red' },
    { roll: 5, heavy: 'red',   medium: 'green', light: 'blue' },
    { roll: 6, heavy: 'red',   medium: 'blue',  light: 'green' }
  ];

  const PLAYER_COLORS = [
    { id: 'p_red',    name: 'Ruby Red',      hex: '#ef4444', darkHex: '#991b1b', text: '#ffffff' },
    { id: 'p_blue',   name: 'Sapphire Blue', hex: '#3b82f6', darkHex: '#1e40af', text: '#ffffff' },
    { id: 'p_green',  name: 'Emerald Green', hex: '#10b981', darkHex: '#065f46', text: '#ffffff' },
    { id: 'p_yellow', name: 'Golden Sun',    hex: '#f59e0b', darkHex: '#b45309', text: '#000000' },
    { id: 'p_purple', name: 'Royal Purple',  hex: '#8b5cf6', darkHex: '#5b21b6', text: '#ffffff' },
    { id: 'p_orange', name: 'Sunset Orange', hex: '#f97316', darkHex: '#c2410c', text: '#ffffff' },
    { id: 'p_cyan',   name: 'Teal Lagoon',   hex: '#06b6d4', darkHex: '#0e7490', text: '#ffffff' },
    { id: 'p_pink',   name: 'Hot Pink',      hex: '#ec4899', darkHex: '#9d174d', text: '#ffffff' }
  ];

  // ==========================================
  // PROCEDURAL DYNAMIC DHAKA MAP GENERATOR
  // ==========================================
  const MAP_DIFFICULTY_CONFIGS = {
    easy: {
      id: 'easy',
      name: 'Easy',
      minLevels: 3,
      maxLevels: 5,
      minNodes: 2,
      maxNodes: 4
    },
    medium: {
      id: 'medium',
      name: 'Medium',
      minLevels: 4,
      maxLevels: 7,
      minNodes: 4,
      maxNodes: 6
    },
    hard: {
      id: 'hard',
      name: 'Hard',
      minLevels: 7,
      maxLevels: 10,
      minNodes: 6,
      maxNodes: 12
    }
  };

  const DHAKA_LOCATION_POOLS = {
    start: [
      { name: 'START: Gulshan North Hub', area: 'Gulshan' },
      { name: 'START: Baridhara Diplomatic Gate', area: 'Baridhara' },
      { name: 'START: Uttara Sector 3 Terminal', area: 'Uttara' }
    ],
    level1: [
      { name: 'Uttara Sector 7 Square', area: 'Uttara' },
      { name: 'Airport Road Express Link', area: 'Uttara' },
      { name: 'Kuril Flyover Junction', area: 'Kuril' },
      { name: 'Nikunja Residential Gate', area: 'Nikunja' },
      { name: 'Khilkhet Bus Overpass', area: 'Khilkhet' },
      { name: 'Bashundhara Main Gate', area: 'Bashundhara' },
      { name: 'Dakshin Khan Crossing', area: 'Dakshin Khan' },
      { name: 'Pallabi Metro Hub', area: 'Mirpur' },
      { name: 'Mirpur 12 Bus Terminal', area: 'Mirpur' },
      { name: 'Diabari Canal Boulevard', area: 'Uttara' },
      { name: 'Cantonment North Gate', area: 'Cantonment' },
      { name: 'Baridhara DOHS Link', area: 'Baridhara' }
    ],
    level2: [
      { name: 'Mirpur 10 Circle Hub', area: 'Mirpur' },
      { name: 'Banani Commercial Plaza', area: 'Banani' },
      { name: 'Gulshan 2 Avenue', area: 'Gulshan' },
      { name: 'Niketan Lake Crossing', area: 'Niketan' },
      { name: 'Cantonment Rail Gate', area: 'Cantonment' },
      { name: 'Mohakhali North Terminal', area: 'Mohakhali' },
      { name: 'Kazipara Central Road', area: 'Mirpur' },
      { name: 'Shewrapara Metro Link', area: 'Mirpur' },
      { name: 'Gulshan 1 Circle', area: 'Gulshan' },
      { name: 'Notun Bazar Embassy Link', area: 'Badda' },
      { name: 'Kalachandpur Overpass', area: 'Baridhara' },
      { name: 'ECB Chattar Intersection', area: 'Cantonment' }
    ],
    level3: [
      { name: 'Tejgaon Industrial Corridor', area: 'Tejgaon' },
      { name: 'Gabtoli Inter-District Terminal', area: 'Gabtoli' },
      { name: 'Chandrima Udyan Square', area: 'Chandrima' },
      { name: 'Badda Link Avenue', area: 'Badda' },
      { name: 'Banasree North Entry', area: 'Banasree' },
      { name: 'Bijoy Sarani Overpass', area: 'Tejgaon' },
      { name: 'Agargaon Administrative Hub', area: 'Agargaon' },
      { name: 'Khamarbari Central Park', area: 'Farmgate' },
      { name: 'Shyamoli Cinema Square', area: 'Shyamoli' },
      { name: 'Kallyanpur Bus Depot', area: 'Kallyanpur' },
      { name: 'Nabisco Tejgaon Link', area: 'Tejgaon' },
      { name: 'Merul Badda Canal Crossing', area: 'Badda' }
    ],
    level4: [
      { name: 'Farmgate Overbridge Crossing', area: 'Farmgate' },
      { name: 'Mohammadpur Bus Depot', area: 'Mohammadpur' },
      { name: 'Moghbazar Double Flyover', area: 'Moghbazar' },
      { name: 'Malibagh Rail Crossing', area: 'Malibagh' },
      { name: 'Kawran Bazar Trade Center', area: 'Kawran Bazar' },
      { name: 'Panthapath Commercial Circle', area: 'Panthapath' },
      { name: 'Dhanmondi 27 Hub', area: 'Dhanmondi' },
      { name: 'Rampura Bridge Crossing', area: 'Rampura' },
      { name: 'Asad Gate Parliament View', area: 'Mohammadpur' },
      { name: 'College Gate Square', area: 'Mohammadpur' },
      { name: 'Hatirjheel Lakeside Viaduct', area: 'Hatirjheel' },
      { name: 'Aftabnagar East Gate', area: 'Rampura' }
    ],
    level5: [
      { name: 'Dhanmondi 15 Lake Hub', area: 'Dhanmondi' },
      { name: 'Kalabagan Field Crossing', area: 'Kalabagan' },
      { name: 'Green Road Signal Plaza', area: 'Panthapath' },
      { name: 'Bangla Motor Intersection', area: 'Bangla Motor' },
      { name: 'Eskaton Garden Circle', area: 'Eskaton' },
      { name: 'Mouchak Market Junction', area: 'Malibagh' },
      { name: 'Siddheswari Circular Road', area: 'Siddheswari' },
      { name: 'Khilgaon Flyover Loop', area: 'Khilgaon' },
      { name: 'Shankar Bus Stand', area: 'Dhanmondi' },
      { name: 'Zigatola Satmasjid Road', area: 'Dhanmondi' },
      { name: 'Banasree South Connector', area: 'Banasree' },
      { name: 'Basabo Buddho Mondir Link', area: 'Basabo' }
    ],
    level6: [
      { name: 'Shahbagh Cultural Circle', area: 'Shahbagh' },
      { name: 'Dhaka New Market Square', area: 'New Market' },
      { name: 'Boshila South Bridge Link', area: 'Boshila' },
      { name: 'Kakrail VIP Intersection', area: 'Kakrail' },
      { name: 'Elephant Road Market Link', area: 'Dhanmondi' },
      { name: 'Shantinagar Crossing', area: 'Shantinagar' },
      { name: 'Science Lab Flyover', area: 'Dhanmondi' },
      { name: 'Kataban Mosque Crossing', area: 'Shahbagh' },
      { name: 'Ramna Park South Gate', area: 'Ramna' },
      { name: 'Bailey Road Theatre Hub', area: 'Bailey Road' },
      { name: 'Rajarbagh Police Lines', area: 'Rajarbagh' },
      { name: 'Mugda Stadium Highway', area: 'Mugda' }
    ],
    level7: [
      { name: 'Paltan Central Square', area: 'Paltan' },
      { name: 'Motijheel Commercial Core', area: 'Motijheel' },
      { name: 'Nilkhet Book Market Hub', area: 'New Market' },
      { name: 'Azimpur Colony Circle', area: 'Azimpur' },
      { name: 'TSC University Square', area: 'Dhaka University' },
      { name: 'High Court Mazar Gate', area: 'Ramna' },
      { name: 'Press Club Secretariat Link', area: 'Segunbagicha' },
      { name: 'Fakirapool Water Tower', area: 'Motijheel' },
      { name: 'Arambagh Bus Terminal', area: 'Motijheel' },
      { name: 'Kamalapur Rail Plaza', area: 'Kamalapur' },
      { name: 'Hazaribagh Tannery Link', area: 'Hazaribagh' },
      { name: 'Maniknagar Highway Cross', area: 'Maniknagar' }
    ],
    level8: [
      { name: 'Dhakeshwari Temple Hub', area: 'Old Dhaka' },
      { name: 'Lalbagh Fort Heritage Gate', area: 'Lalbagh' },
      { name: 'Chankharpul Flyover Entry', area: 'Old Dhaka' },
      { name: 'Bakshibazar Medical Square', area: 'Bakshibazar' },
      { name: 'Gulistan Zero Point', area: 'Gulistan' },
      { name: 'Dilkusha Banking Avenue', area: 'Motijheel' },
      { name: 'Tikatuli Flyover Ramp', area: 'Wari' },
      { name: 'Sayedabad Inter-City Hub', area: 'Sayedabad' },
      { name: 'Jatrabari Flyover Nexus', area: 'Jatrabari' },
      { name: 'Kamrangirchar Bridge Link', area: 'Kamrangirchar' },
      { name: 'Nawabganj Park Crossing', area: 'Lalbagh' },
      { name: 'Gopibagh Rail Gate', area: 'Gopibagh' }
    ],
    level9: [
      { name: 'Chawkbazar Historical Bazaar', area: 'Old Dhaka' },
      { name: 'Armanitola Historic Plaza', area: 'Old Dhaka' },
      { name: 'Wari Heritage District', area: 'Wari' },
      { name: 'Bongshal Bicycle Market', area: 'Old Dhaka' },
      { name: 'Naya Bazar Trade Square', area: 'Old Dhaka' },
      { name: 'Tatibazar Gold Hub', area: 'Old Dhaka' },
      { name: 'Ray Saheb Bazar Circle', area: 'Old Dhaka' },
      { name: 'Dayaganj Intersection', area: 'Wari' },
      { name: 'Dholaikhal Engineering Hub', area: 'Old Dhaka' },
      { name: 'Mitford Hospital Road', area: 'Old Dhaka' },
      { name: 'Islampur Fabric Bazaar', area: 'Old Dhaka' },
      { name: 'Sutrapur Community Square', area: 'Sutrapur' }
    ],
    level10: [
      { name: 'Sadarghat River Terminal', area: 'Sadarghat' },
      { name: 'Ahsan Manzil Riverside', area: 'Old Dhaka' },
      { name: 'Postogola Bridge Highway', area: 'Postogola' },
      { name: 'Badamtoli Fruit Pier', area: 'Sadarghat' },
      { name: 'Babu Bazar Bridge Approach', area: 'Old Dhaka' },
      { name: 'Shyambazar Riverfront', area: 'Old Dhaka' },
      { name: 'Farashganj Heritage Lane', area: 'Old Dhaka' },
      { name: 'Gandaria Rail Station', area: 'Gandaria' },
      { name: 'Jurain Rail Gate', area: 'Jurain' },
      { name: 'Millennium Market Pier', area: 'Sadarghat' },
      { name: 'Wiseghat Steamer Terminal', area: 'Sadarghat' },
      { name: 'Hasnabad River Link', area: 'Postogola' }
    ],
    stop: [
      { name: 'STOP: Keraniganj South Hub', area: 'Keraniganj' },
      { name: 'STOP: Buriganga South Gateway', area: 'Keraniganj' }
    ]
  };

  class DynamicMapGenerator {
    static randInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static generateMap(difficultyOrLevels = 'medium') {
      const nodes = [];
      const edges = [];
      const colors = ['red', 'green', 'blue'];
      let edgeCounter = 1;

      // Resolve difficulty and level count
      let difficultyKey = 'medium';
      let levelCount = 5;
      let minNodesPerLevel = 4;
      let maxNodesPerLevel = 6;

      if (typeof difficultyOrLevels === 'number') {
        levelCount = Math.max(3, Math.min(10, difficultyOrLevels));
      } else {
        difficultyKey = String(difficultyOrLevels || 'medium').toLowerCase();
        const cfg = MAP_DIFFICULTY_CONFIGS[difficultyKey] || MAP_DIFFICULTY_CONFIGS.medium;
        difficultyKey = cfg.id;
        levelCount = DynamicMapGenerator.randInt(cfg.minLevels, cfg.maxLevels);
        minNodesPerLevel = cfg.minNodes;
        maxNodesPerLevel = cfg.maxNodes;
      }

      // Unbiased Fisher-Yates shuffle helper
      const shuffle = (arr) => {
        const copy = [...arr];
        for (let i = copy.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
      };
      const usedNames = new Set();

      // 1. START NODE (Level 0 - Departure Terminal: Walk, Bike, and Public Bus available; Car & Train require reaching stations or Permit card)
      const startPool = shuffle(DHAKA_LOCATION_POOLS.start);
      const startLoc = startPool[0];
      usedNames.add(startLoc.name);
      const startNode = {
        id: 'START',
        name: startLoc.name,
        area: startLoc.area,
        level: 0,
        x: 0.500,
        y: 0.055,
        isStart: true,
        isStop: false,
        hasCar: false,
        hasBike: true,
        hasBus: true,
        hasTrain: false,
        hasHospital: false,
        hasCard: false
      };
      nodes.push(startNode);

      // 2. GENERATE NODES FOR LEVELS 1 TO N (Strict Layer Partitioning)
      const levelNodesMap = new Map(); // level -> array of node objects
      let maxNodesInAnyLevel = 4;

      const levelStepY = 0.86 / (levelCount + 1);

      for (let lvl = 1; lvl <= levelCount; lvl++) {
        // Random node count for this level according to map difficulty
        const count = DynamicMapGenerator.randInt(minNodesPerLevel, maxNodesPerLevel);
        if (count > maxNodesInAnyLevel) maxNodesInAnyLevel = count;

        const rawPool = DHAKA_LOCATION_POOLS['level' + lvl] || DHAKA_LOCATION_POOLS['level' + ((lvl - 1) % 10 + 1)] || DHAKA_LOCATION_POOLS.level1;
        const pool = shuffle(rawPool);
        const currentLevelNodes = [];

        // Base Y position for this level
        const baseY = 0.055 + lvl * levelStepY;

        // Subdivide horizontal space cleanly based on node count
        const xMargins = count >= 8 ? 0.055 : (count >= 6 ? 0.075 : 0.11);
        const availableWidth = 1.0 - 2 * xMargins;
        const segWidth = availableWidth / count;

        const waveMag = Math.min(0.030, levelStepY * 0.21);
        const jitterMag = Math.min(0.032, levelStepY * 0.22);

        for (let i = 0; i < count; i++) {
          let loc = pool[i % pool.length];
          let locName = loc.name;
          if (usedNames.has(locName)) {
            locName = `${loc.name} #${i + 1}`;
          }
          usedNames.add(locName);

          const segStart = xMargins + i * segWidth;
          // Organic X with jitter inside segment
          const x = segStart + segWidth * 0.22 + Math.random() * (segWidth * 0.56);
          
          // Organic non-linear Y staggering scaled to level spacing so layers never cross
          const waveOffset = (i % 2 === 0 ? waveMag : -waveMag);
          const yJitter = (Math.random() - 0.5) * jitterMag;
          const y = Math.min(0.91, Math.max(0.10, baseY + waveOffset + yJitter));

          const node = {
            id: `L${lvl}_${i + 1}`,
            name: locName,
            area: loc.area,
            level: lvl,
            x: parseFloat(x.toFixed(3)),
            y: parseFloat(y.toFixed(3)),
            isStart: false,
            isStop: false,
            hasCar: false,
            hasBike: false,
            hasBus: false,
            hasTrain: false,
            hasHospital: false,
            hasCard: false
          };
          currentLevelNodes.push(node);
        }

        // Apply Spatial Collision Repulsion proportional to segment width
        const minNodeDist = Math.min(0.115, segWidth * 0.78);
        for (let a = 0; a < currentLevelNodes.length; a++) {
          for (let b = a + 1; b < currentLevelNodes.length; b++) {
            const nA = currentLevelNodes[a];
            const nB = currentLevelNodes[b];
            const dx = nA.x - nB.x;
            const dy = nA.y - nB.y;
            const dist = Math.hypot(dx, dy);
            if (dist < minNodeDist) {
              const push = (minNodeDist - dist) / 2;
              nA.x = Math.max(xMargins, Math.min(1 - xMargins, nA.x + (dx > 0 ? push : -push)));
              nB.x = Math.max(xMargins, Math.min(1 - xMargins, nB.x + (dx > 0 ? -push : push)));
            }
          }
        }

        // ==========================================
        // STATION & ABILITY CARD RANDOMIZATION PER LEVEL:
        // 1. Randomized Ability Card ('A') count & locations per level (1 up to ~65% of nodes)
        // 2. Independently randomized vehicle stations (Bike, Car, Bus, Train, Hospital)
        // ==========================================
        const allIndices = currentLevelNodes.map((_, idx) => idx);

        // Randomize how many nodes in this level offer an Ability Card
        const minCardNodes = 1;
        const maxCardNodes = Math.max(1, Math.min(count - 1, Math.ceil(count * 0.65)));
        const cardNodesTarget = DynamicMapGenerator.randInt(minCardNodes, maxCardNodes);
        const cardShuffled = shuffle(allIndices);
        for (let c = 0; c < cardNodesTarget && c < cardShuffled.length; c++) {
          currentLevelNodes[cardShuffled[c]].hasCard = true;
        }

        // Train Stations: 1 random node on 2-4 node levels, 2 on 5+ node levels
        const trainShuffled = shuffle(allIndices);
        const trainCount = count >= 5 ? 2 : 1;
        for (let t = 0; t < trainCount; t++) {
          currentLevelNodes[trainShuffled[t]].hasTrain = true;
        }

        // Guaranteed Bike (at least 1 random node, plus 40% chance on others)
        const bikeShuffled = shuffle(allIndices);
        currentLevelNodes[bikeShuffled[0]].hasBike = true;
        currentLevelNodes.forEach((n, idx) => {
          if (idx !== bikeShuffled[0] && Math.random() < 0.40) n.hasBike = true;
        });

        // Guaranteed Car (at least 1 random node, plus 35% chance on others)
        const carShuffled = shuffle(allIndices);
        currentLevelNodes[carShuffled[0]].hasCar = true;
        currentLevelNodes.forEach((n, idx) => {
          if (idx !== carShuffled[0] && Math.random() < 0.35) n.hasCar = true;
        });

        // Guaranteed Bus Terminal (at least 1 random node, plus 40% chance on others)
        const busShuffled = shuffle(allIndices);
        currentLevelNodes[busShuffled[0]].hasBus = true;
        currentLevelNodes.forEach((n, idx) => {
          if (idx !== busShuffled[0] && Math.random() < 0.40) n.hasBus = true;
        });

        // Hospital on periodic levels (every even level and final level, random node)
        if (lvl % 2 === 0 || lvl === levelCount) {
          const hospShuffled = shuffle(allIndices);
          currentLevelNodes[hospShuffled[0]].hasHospital = true;
        }

        levelNodesMap.set(lvl, currentLevelNodes);
        nodes.push(...currentLevelNodes);
      }

      // 3. STOP NODE (Level N+1)
      const stopPool = shuffle(DHAKA_LOCATION_POOLS.stop);
      const stopLoc = stopPool[0];
      const stopNode = {
        id: 'STOP',
        name: stopLoc.name,
        area: stopLoc.area,
        level: levelCount + 1,
        x: 0.500,
        y: 0.945,
        isStart: false,
        isStop: true,
        hasCar: false,
        hasBike: false,
        hasBus: true,
        hasTrain: true,
        hasHospital: false,
        hasCard: false
      };
      nodes.push(stopNode);

      // ==========================================
      // 4. EDGE TOPOLOGY & STRICT NO-SHORTCUT DAG
      // ==========================================

      // A. START -> Level 1 (Forward Connections)
      const level1Nodes = levelNodesMap.get(1);
      level1Nodes.forEach((n1, idx) => {
        edges.push({
          id: `E_ST_${n1.id}`,
          from: 'START',
          to: n1.id,
          type: 'road',
          color: colors[idx % colors.length]
        });
      });

      // B. Level L -> Level L+1 (Strictly Layered Forward DAG - No skips allowed)
      for (let lvl = 1; lvl < levelCount; lvl++) {
        const fromNodes = levelNodesMap.get(lvl);
        const toNodes = levelNodesMap.get(lvl + 1);

        // Sort both by X coordinate
        const sortedFrom = [...fromNodes].sort((a, b) => a.x - b.x);
        const sortedTo = [...toNodes].sort((a, b) => a.x - b.x);

        // Connect each fromNode to its 2 nearest toNodes
        sortedFrom.forEach((fn) => {
          const nearest = [...sortedTo]
            .map((tn) => ({ node: tn, dist: Math.hypot(fn.x - tn.x, fn.y - tn.y) }))
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 2);

          nearest.forEach(({ node: tn }) => {
            const edgeExists = edges.some((e) => (e.from === fn.id && e.to === tn.id) || (e.from === tn.id && e.to === fn.id));
            if (!edgeExists) {
              edges.push({
                id: `E_FWD_${edgeCounter++}`,
                from: fn.id,
                to: tn.id,
                type: 'road',
                color: colors[edgeCounter % colors.length]
              });
            }
          });
        });

        // Ensure every toNode has at least 1 incoming forward edge
        sortedTo.forEach((tn) => {
          const hasIncoming = edges.some((e) => e.to === tn.id && e.type === 'road');
          if (!hasIncoming) {
            const nearestFrom = [...sortedFrom]
              .map((fn) => ({ node: fn, dist: Math.hypot(fn.x - tn.x, fn.y - tn.y) }))
              .sort((a, b) => a.dist - b.dist)[0].node;

            edges.push({
              id: `E_FWD_${edgeCounter++}`,
              from: nearestFrom.id,
              to: tn.id,
              type: 'road',
              color: colors[edgeCounter % colors.length]
            });
          }
        });

        // C. Intra-Level Lateral Connections (L <-> L)
        for (let i = 0; i < sortedFrom.length - 1; i++) {
          if (Math.random() > 0.25) {
            edges.push({
              id: `E_LAT_${edgeCounter++}`,
              from: sortedFrom[i].id,
              to: sortedFrom[i + 1].id,
              type: 'road',
              color: colors[edgeCounter % colors.length]
            });
          }
        }
      }

      // Lateral connections for final level
      const finalLevelNodes = [...levelNodesMap.get(levelCount)].sort((a, b) => a.x - b.x);
      for (let i = 0; i < finalLevelNodes.length - 1; i++) {
        edges.push({
          id: `E_LAT_${edgeCounter++}`,
          from: finalLevelNodes[i].id,
          to: finalLevelNodes[i + 1].id,
          type: 'road',
          color: colors[edgeCounter % colors.length]
        });
      }

      // D. Final Level -> STOP (Every node in final level connects to STOP)
      finalLevelNodes.forEach((fn, idx) => {
        edges.push({
          id: `E_STOP_${edgeCounter++}`,
          from: fn.id,
          to: 'STOP',
          type: 'road',
          color: colors[idx % colors.length]
        });
      });

      // E. Curved Railway Network (Each Train Station in Level L connects to closest Train Station in Level L+1, and final level connects to STOP)
      for (let lvl = 1; lvl < levelCount; lvl++) {
        const currTrains = levelNodesMap.get(lvl).filter((n) => n.hasTrain);
        const nextTrains = levelNodesMap.get(lvl + 1).filter((n) => n.hasTrain);
        currTrains.forEach((fromStn, idx) => {
          const toStn = [...nextTrains].sort((a, b) => Math.abs(a.x - fromStn.x) - Math.abs(b.x - fromStn.x))[0];
          if (toStn) {
            const curveDir = ((lvl + idx) % 2 === 0 ? 1 : -1);
            const curveMag = 45 + Math.floor(Math.random() * 25);
            edges.push({
              id: `RAIL_${fromStn.id}_${toStn.id}`,
              from: fromStn.id,
              to: toStn.id,
              type: 'rail',
              color: 'rail',
              curveOffset: curveDir * curveMag
            });
          }
        });
      }
      const lastLevelTrains = levelNodesMap.get(levelCount).filter((n) => n.hasTrain);
      if (lastLevelTrains.length > 0) {
        const finalTrain = lastLevelTrains[0];
        edges.push({
          id: `RAIL_${finalTrain.id}_STOP`,
          from: finalTrain.id,
          to: 'STOP',
          type: 'rail',
          color: 'rail',
          curveOffset: (levelCount % 2 === 0 ? 1 : -1) * 50
        });
      }

      // Compute dynamic virtual board dimensions so dense Hard maps (up to 12 nodes wide & 10 levels deep) never crowd
      const boardWidth = Math.max(BOARD_CONFIG.width, maxNodesInAnyLevel * 225);
      const boardHeight = Math.max(BOARD_CONFIG.height, (levelCount + 2) * 245);

      return {
        nodes,
        edges,
        difficulty: difficultyKey,
        levelCount,
        boardWidth,
        boardHeight
      };
    }
  }

  const ABILITY_CARDS_TEMPLATE = [
    { id: 'c_nitro',     copies: 3, title: 'Nitro Speed Boost',        category: 'advantage', type: 'Play Once Any Time', description: 'Double your score points (2x) on your next travel move!', effectType: 'DOUBLE_POINTS' },
    { id: 'c_express',   copies: 4, title: 'Green Wave Pass',          category: 'advantage', type: 'Play Once Any Time', description: 'Treat your road on your next move as Light Traffic and bypass any Roadblock.', effectType: 'LIGHT_TRAFFIC_BUFF' },
    { id: 'c_siren',     copies: 3, title: 'VIP Free Transit Pass',    category: 'advantage', type: 'Play Once Any Time', description: 'Your next vehicle ride (even Car or Train!) costs 0 Currency, bypasses Roadblocks, and grants +3 bonus pts.', effectType: 'FREE_EXTRA_STEP' },
    { id: 'c_fuel',      copies: 4, title: 'Fuel & Transit Voucher',   category: 'advantage', type: 'Play Once Any Time', description: 'Instantly claim +6 Currency (2 coins) from the city reserve.', effectType: 'ADD_CURRENCY_6' },
    { id: 'c_upgrade',   copies: 3, title: 'Permanent Vehicle Permit', category: 'advantage', type: 'Play Once Any Time', description: 'Claim a permanent Car (🚗) or Bike (🏍️) permit to board from any node all game, plus +2 Currency rebate!', effectType: 'FREE_VEHICLE' },
    { id: 'c_roadblock', copies: 3, title: 'Set Roadblock',            category: 'attack',    type: 'Play Once Any Time', description: 'Select a road color (Red, Green, Blue) to BLOCK for all opponents this round (you pass freely).', effectType: 'BLOCK_ROAD_COLOR' },
    { id: 'c_steal',     copies: 3, title: 'Road Tax Extortion',       category: 'attack',    type: 'Play Once Any Time', description: 'Select an opponent to collect 3 Currency from (or 4 pts if they have under 3 Currency)!', effectType: 'STEAL_FROM_OPPONENT' },
    { id: 'c_grant',     copies: 2, title: 'Municipal Transit Grant',  category: 'advantage', type: 'Play Right Away',    description: 'Mandatory: Immediately receive +6 Currency and +3 bonus points from the municipal fund!', effectType: 'GRANT_CURRENCY_9' },
    { id: 'c_speedtrap', copies: 3, title: 'Traffic Police Inspection',category: 'attack',    type: 'Play Right Away',    description: 'Mandatory: Audit the leading opponent for -5 points, and receive +2 informant points!', effectType: 'PENALIZE_LEADER' },
    { id: 'c_toll',      copies: 2, title: 'Citywide Congestion Tax',  category: 'attack',    type: 'Play Right Away',    description: 'Mandatory: All opponents must pay 2 Currency (or lose 3 pts), and you collect +3 Currency!', effectType: 'TAX_ALL_PLAYERS' }
  ];

  // ==========================================
  // 2. PROCEDURAL SOUND ENGINE (Web Audio API)
  // ==========================================
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.muted = false;
    }
    ensureContext() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }
    toggleMute() {
      this.muted = !this.muted;
      return this.muted;
    }
    playTone(freq, duration = 0.15, type = 'sine', gainVal = 0.2) {
      if (this.muted) return;
      try {
        this.ensureContext();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        // Silently ignore audio block
      }
    }
    playMove(vehicleId) {
      switch (vehicleId) {
        case 'bike': this.playTone(320, 0.25, 'sawtooth', 0.15); break;
        case 'car': this.playTone(180, 0.35, 'triangle', 0.2); break;
        case 'bus': this.playTone(120, 0.45, 'square', 0.12); break;
        case 'train':
          this.playTone(440, 0.2, 'sine', 0.2);
          setTimeout(() => this.playTone(550, 0.3, 'sine', 0.2), 150);
          break;
        default: this.playTone(400, 0.12, 'sine', 0.15); break;
      }
    }
    playCardDraw() {
      this.playTone(523.25, 0.1, 'sine', 0.18);
      setTimeout(() => this.playTone(659.25, 0.15, 'sine', 0.2), 100);
    }
    playCardActivated() {
      this.playTone(600, 0.12, 'triangle', 0.25);
      setTimeout(() => this.playTone(850, 0.2, 'sine', 0.3), 100);
    }
    playDice() {
      this.playTone(250, 0.08, 'square', 0.15);
      setTimeout(() => this.playTone(350, 0.1, 'square', 0.15), 90);
    }
    playVictory() {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 0.35, 'triangle', 0.25), i * 150);
      });
    }
  }

  const audio = new SoundEngine();

  // ==========================================
  // 3. GAME ENGINE (UNIFIED SINGLE-TURN CYCLE)
  // ==========================================
  class GameEngine {
    constructor() {
      this.nodesMap = new Map();
      this.edges = [];
      this.players = [];
      this.round = 1;
      this.phase = 'PLAYING'; // 'PLAYING', 'GAME_OVER'
      this.activePlayerIndex = 0;
      this.priorityIndex = 0;
      this.turnsTakenInRound = 0;
      this.diceRoll = null;
      this.trafficStatus = { red: 'medium', green: 'medium', blue: 'medium' };
      this.blockedColors = new Set();
      this.blockedEdges = new Set();
      this.deck = [];
      this.discardPile = [];
      this.winner = null;
      this.awaitingCardSelection = false;
      this.mapDifficulty = 'medium';
      this.levelCount = 5;
      this.boardWidth = BOARD_CONFIG.width;
      this.boardHeight = BOARD_CONFIG.height;

      this.onLogCallback = null;
      this.onCardDrawPrompt = null;
      this.onGameOverCallback = null;

      this.initGraph('medium');
      this.initDeck();
    }

    initGraph(mapDifficulty = 'medium') {
      this.nodesMap.clear();
      const generated = DynamicMapGenerator.generateMap(mapDifficulty);
      this.generatedNodes = generated.nodes;
      this.generatedEdges = generated.edges;
      this.mapDifficulty = generated.difficulty;
      this.levelCount = generated.levelCount;
      this.boardWidth = generated.boardWidth;
      this.boardHeight = generated.boardHeight;
      generated.nodes.forEach((n) => this.nodesMap.set(n.id, { ...n }));
      this.edges = [...generated.edges];
      this.blockedColors = new Set();
      this.blockedEdges = new Set();
    }

    initDeck() {
      this.deck = [];
      let uid = 1;
      ABILITY_CARDS_TEMPLATE.forEach((c) => {
        const copies = c.copies || 3;
        for (let i = 0; i < copies; i++) {
          this.deck.push({ ...c, instanceId: `card_${uid++}` });
        }
      });
      this.shuffleDeck();
    }

    shuffleDeck() {
      for (let i = this.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
      }
    }

    log(msg, type = 'system') {
      if (this.onLogCallback) {
        this.onLogCallback({ text: msg, type: type, timestamp: new Date().toLocaleTimeString() });
      }
    }

    initGame(playerConfigs, customGraph = null, customPriority = null, mapDifficulty = 'medium') {
      if (customGraph && customGraph.nodes && customGraph.edges) {
        this.nodesMap.clear();
        this.generatedNodes = customGraph.nodes;
        this.generatedEdges = customGraph.edges;
        this.mapDifficulty = customGraph.difficulty || mapDifficulty || 'medium';
        this.levelCount = customGraph.levelCount || (Math.max(...customGraph.nodes.map((n) => n.level || 0)) - 1) || 5;
        this.boardWidth = customGraph.boardWidth || BOARD_CONFIG.width;
        this.boardHeight = customGraph.boardHeight || BOARD_CONFIG.height;
        customGraph.nodes.forEach((n) => this.nodesMap.set(n.id, { ...n }));
        this.edges = [...customGraph.edges];
        this.blockedColors = new Set();
        this.blockedEdges = new Set();
      } else {
        this.initGraph(mapDifficulty);
      }
      this.initDeck();
      this.players = playerConfigs.map((cfg, idx) => ({
        id: `p_${idx + 1}`,
        name: cfg.name,
        color: cfg.color,
        isAi: cfg.isAi,
        clientId: cfg.clientId || null,
        score: 0,
        money: 12, // Starting 12 Currency Units (4 coins x 3 units)
        currentNodeId: 'START',
        previousNodeId: null,
        currentVehicle: 'run', // Starts on foot ('run', 'bike', 'car', 'bus', 'train')
        vehicleTokens: new Set(), // Permanent vehicle permits from Ability Cards
        visitedCardNodes: new Set(), // Tracks 'A' nodes already claimed by this player
        visitedHospitals: new Set(), // Tracks Hospital nodes already claimed by this player
        hand: [],
        milestonesClaimed: new Set(),
        hasFinished: false,
        finishRank: null,
        lightTrafficBonus: false,
        doublePointsBonus: false,
        freeNextRideBonus: false,
        runSpeedBonus: 0,
        bypassRoadblock: false
      }));

      this.round = 1;
      this.priorityIndex = customPriority !== null ? customPriority : Math.floor(Math.random() * this.players.length);
      this.activePlayerIndex = this.priorityIndex;
      this.turnsTakenInRound = 0;
      this.trafficStatus = { red: 'medium', green: 'medium', blue: 'medium' };
      this.diceRoll = null;
      this.winner = null;
      this.awaitingCardSelection = false;
      this.phase = 'PLAYING';

      const diffName = (MAP_DIFFICULTY_CONFIGS[this.mapDifficulty]?.name || 'Medium').toUpperCase();
      this.log(`🎮 New Game started (${diffName} Map: ${this.levelCount} depth levels, ${this.nodesMap.size} total nodes) with ${this.players.length} players!`, 'system');
      this.log(`⭐ Priority Token assigned to ${this.players[this.priorityIndex].name}.`, 'bonus');
      this.log(`🚦 Round 1: All roads set to MEDIUM traffic. Starting at ${this.nodesMap.get('START')?.name || 'START'}.`, 'traffic');
    }

    getConnectedEdges(nodeId) {
      return this.edges.filter((e) => e.from === nodeId || e.to === nodeId);
    }

    getAdjacentNodeId(edge, fromNodeId) {
      return edge.from === fromNodeId ? edge.to : edge.from;
    }

    calcDistance(fromId, toId = 'STOP') {
      if (fromId === toId) return 0;
      const visited = new Set([fromId]);
      const queue = [{ id: fromId, dist: 0 }];
      while (queue.length > 0) {
        const { id, dist } = queue.shift();
        if (id === toId) return dist;
        const edges = this.getConnectedEdges(id);
        for (const e of edges) {
          const neighbor = this.getAdjacentNodeId(e, id);
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push({ id: neighbor, dist: dist + 1 });
          }
        }
      }
      return 99;
    }

    getValidMovesForPlayer(playerIndex) {
      const p = this.players[playerIndex];
      if (p.hasFinished) return [];
      const curr = this.nodesMap.get(p.currentNodeId);
      if (!curr) return [];

      const connected = this.getConnectedEdges(curr.id);
      const moves = [];

      for (const edge of connected) {
        // Enforce forward rail track rule: only forward-directed rail edges starting from curr.id
        const isForwardRail = edge.type === 'rail' && edge.from === curr.id;
        const isRoad = edge.type === 'road';
        if (!isForwardRail && !isRoad) continue;

        const neighborId = this.getAdjacentNodeId(edge, curr.id);
        const neighbor = this.nodesMap.get(neighborId);
        if (!neighbor) continue;

        // Non-backtracking rule: players can move forward (lvl + 1) or laterally on the same level (lvl),
        // but cannot move backward to an earlier level or immediately reverse to previousNodeId
        if ((neighbor.level ?? 0) < (curr.level ?? 0) || neighborId === p.previousNodeId) {
          continue;
        }

        const isEdgeBlocked = this.blockedEdges.has(edge.id);
        const isColorBlocked = edge.type === 'road' && this.blockedColors.has(edge.color);
        if ((isEdgeBlocked || isColorBlocked) && !p.bypassRoadblock) continue;

        if (edge.type === 'rail') {
          // Rail track options: Train is available if station has train OR player is already riding train
          if (curr.hasTrain || p.currentVehicle === 'train') {
            const source = p.currentVehicle === 'train' ? 'retained' : 'station';
            moves.push(this.makeMoveOption(p, neighbor, edge, 'train', source));
          }
        } else {
          // Road edge options:
          // 1. Walk / Run: Always available for free
          moves.push(this.makeMoveOption(p, neighbor, edge, 'run', 'always'));

          // 2. Bike: Available if node has bike station, player is currently riding bike, or player holds a Bike Permit card
          if (curr.hasBike || p.currentVehicle === 'bike' || p.vehicleTokens.has('bike')) {
            const source = (p.currentVehicle === 'bike' || p.vehicleTokens.has('bike')) ? 'retained' : 'station';
            moves.push(this.makeMoveOption(p, neighbor, edge, 'bike', source));
          }

          // 3. Car: Available if node has car station, player is currently riding car, or player holds a Car Permit card
          if (curr.hasCar || p.currentVehicle === 'car' || p.vehicleTokens.has('car')) {
            const source = (p.currentVehicle === 'car' || p.vehicleTokens.has('car')) ? 'retained' : 'station';
            moves.push(this.makeMoveOption(p, neighbor, edge, 'car', source));
          }

          // 4. Public Bus: Strictly requires a Bus Terminal (🚌) at the departure node
          if (curr.hasBus) {
            moves.push(this.makeMoveOption(p, neighbor, edge, 'bus', 'station'));
          }
        }
      }
      return moves;
    }

    makeMoveOption(player, targetNode, edge, vehicleId, source = 'station') {
      const v = SPEED_CHART[vehicleId];
      let traffic = edge.type === 'rail' ? 'none' : (player.lightTrafficBonus ? 'light' : (this.trafficStatus[edge.color] || 'medium'));
      let points = (vehicleId === 'run' && player.runSpeedBonus > 0) ? player.runSpeedBonus : (v[traffic] !== undefined ? v[traffic] : v.medium);
      if (player.doublePointsBonus) points *= 2;
      let cost = player.freeNextRideBonus ? 0 : v.cost;
      let canAfford = player.money >= cost;

      return {
        targetNodeId: targetNode.id,
        targetNodeName: targetNode.name,
        targetNode: targetNode,
        edgeId: edge.id,
        edgeType: edge.type,
        edgeColor: edge.color,
        edgeCurve: edge.curveOffset || 0,
        vehicleId: vehicleId,
        vehicleName: v.name,
        vehicleIcon: v.icon,
        source: source, // 'station', 'retained', 'always'
        traffic: traffic,
        pointsEarned: points,
        cost: cost,
        canAfford: canAfford
      };
    }

    executePlayerMove(playerIndex, move) {
      const p = this.players[playerIndex];
      if (!p || p.hasFinished) return false;

      const { targetNodeId, vehicleId, pointsEarned, cost, canAfford } = move;
      const target = this.nodesMap.get(targetNodeId);

      // Strict currency check
      if (!canAfford) {
        this.log(`❌ ${p.name} cannot afford ${SPEED_CHART[vehicleId].name} (${cost} currency required).`, 'alert');
        return false;
      }

      // Deduct cost and set current active transport mode
      p.money -= cost;
      p.currentVehicle = vehicleId;

      this.log(`💰 ${p.name} paid ${cost} currency to ride ${SPEED_CHART[vehicleId].name} (${move.source === 'retained' ? 'continuing vehicle/permit' : 'boarded at station'}). (Balance: ${p.money})`, 'action');

      // Add points
      p.score += pointsEarned;
      this.log(`⚡ ${p.name} earned +${pointsEarned} pts riding ${SPEED_CHART[vehicleId].name} (${move.traffic} traffic).`, 'score');

      // Clear one-time turn bonuses
      p.doublePointsBonus = false;
      p.lightTrafficBonus = false;
      p.freeNextRideBonus = false;

      // Score Milestones: Crossing 35, 70, and 105 pts grants +6 Currency (2 coins)
      [35, 70, 105].forEach((m) => {
        if (p.score >= m && !p.milestonesClaimed.has(m)) {
          p.milestonesClaimed.add(m);
          p.money += 6;
          this.log(`🌟 MILESTONE! ${p.name} crossed ${m} pts and earned +6 Currency (2 coins)!`, 'bonus');
        }
      });

      p.previousNodeId = p.currentNodeId;
      p.currentNodeId = targetNodeId;

      // Hospital / Service Station relief bonus (+3 Currency on first visit to that Hospital)
      if (target.hasHospital && !p.visitedHospitals.has(targetNodeId)) {
        p.visitedHospitals.add(targetNodeId);
        p.money += 3;
        this.log(`🏥 ${p.name} visited ${target.name} Hospital Station and received +3 Currency transit relief!`, 'bonus');
      }

      // Check STOP arrival
      if (target.isStop) {
        p.hasFinished = true;
        p.finishRank = this.players.filter((pl) => pl.hasFinished).length;
        if (!this.winner) {
          this.winner = p;
          this.log(`🏆 FASTEST FINISHER! ${p.name} reached STOP first (+12 pts bonus)! Final round in progress — remaining players complete this round!`, 'victory');
          audio.playVictory();
        } else {
          const secondBonusText = p.finishRank === 2 ? ' (+6 pts 2nd Finisher bonus!)' : '';
          this.log(`🏁 ${p.name} reached STOP as finisher #${p.finishRank}${secondBonusText}!`, 'victory');
        }
        this.checkGameCompletion();
        return true;
      }

      return true;
    }

    drawTwoCards() {
      if (this.deck.length < 2) {
        this.deck = this.deck.concat(this.discardPile);
        this.discardPile = [];
        this.shuffleDeck();
      }
      return [this.deck.pop(), this.deck.pop()].filter(Boolean);
    }

    triggerCardDraw(playerIndex, onComplete = null) {
      const cardsDrawn = this.drawTwoCards();
      const p = this.players[playerIndex];
      this.awaitingCardSelection = true;
      this.log(`🎴 ${p.name} landed on 'A' node and is drawing an Ability Card (all turns paused until chosen).`, 'card');

      if (this.onCardDrawPrompt) {
        this.onCardDrawPrompt(playerIndex, cardsDrawn, false, () => {
          this.awaitingCardSelection = false;
          if (onComplete) onComplete();
        });
      } else {
        this.awaitingCardSelection = false;
        if (onComplete) onComplete();
      }
    }

    keepCard(playerIndex, cardToKeepInstanceId, allDrawn, isOpeningDraft = false) {
      const p = this.players[playerIndex];
      const kept = allDrawn.find((c) => c.instanceId === cardToKeepInstanceId);
      const discarded = allDrawn.filter((c) => c.instanceId !== cardToKeepInstanceId);

      if (kept) {
        p.hand.push(kept);
        // Kept private: Do not leak card title or power in the log
        if (isOpeningDraft) {
          this.log(`🔒 ${p.name} drafted 1 starting Ability Card into private hand.`, 'card');
        } else {
          this.log(`🔒 ${p.name} added 1 private Ability Card to hand.`, 'card');
        }
      }
      discarded.forEach((c) => this.discardPile.push(c));
    }

    // PLAY ABILITY CARD WITH USER-CHOSEN SELECTION PARAMETER
    playCardWithSelection(playerIndex, cardInstanceId, selectionParam = null) {
      const p = this.players[playerIndex];
      if (!p) return false;
      const cIdx = p.hand.findIndex((c) => c.instanceId === cardInstanceId);
      if (cIdx === -1) return false;

      const card = p.hand.splice(cIdx, 1)[0];
      this.discardPile.push(card);
      audio.playCardActivated();

      // Card is now publicly revealed to all players
      this.log(`⚡ REVEALED! ${p.name} PLAYED "${card.title}" (${card.type}): ${card.description}`, 'alert');

      if (this.onCardPlayCallback) {
        this.onCardPlayCallback(p, card, selectionParam);
      }

      switch (card.effectType) {
        case 'DOUBLE_POINTS':
          p.doublePointsBonus = true;
          this.log(`⚡ Nitro activated! ${p.name}'s next travel move will earn 2x DOUBLE score points!`, 'bonus');
          break;
        case 'ADD_CURRENCY_6':
          p.money += 6;
          this.log(`💰 Fuel voucher redeemed! +6 Currency added to ${p.name} (Balance: ${p.money}).`, 'bonus');
          break;
        case 'LIGHT_TRAFFIC_BUFF':
          p.lightTrafficBonus = true;
          p.bypassRoadblock = true;
          this.log(`🟢 Green Wave pass active! ${p.name}'s next move enjoys Light Traffic speeds and bypasses roadblocks!`, 'bonus');
          break;
        case 'FREE_VEHICLE':
          p.money += 2;
          if (selectionParam === 'bike') {
            p.vehicleTokens.add('bike');
            this.log(`🏍️ Permanent Bike Permit + 2 Currency rebate claimed by ${p.name}!`, 'bonus');
          } else {
            p.vehicleTokens.add('car');
            this.log(`🚗 Permanent Car Permit + 2 Currency rebate claimed by ${p.name}!`, 'bonus');
          }
          break;
        case 'BLOCK_ROAD_COLOR': {
          const colToBlock = selectionParam || 'red';
          this.blockedColors.add(colToBlock);
          p.bypassRoadblock = true;
          this.log(`🛑 Roadblock placed! ${colToBlock.toUpperCase()} roads are BLOCKED for all opponents this round!`, 'alert');
          break;
        }
        case 'STEAL_FROM_OPPONENT': {
          const targetOpponent = this.players.find((pl, idx) => idx === selectionParam || pl.id === selectionParam);
          if (targetOpponent) {
            if (targetOpponent.money >= 3) {
              targetOpponent.money -= 3;
              p.money += 3;
              this.log(`💸 Road Tax Extortion! ${p.name} collected 3 Currency from ${targetOpponent.name}!`, 'bonus');
            } else {
              const ptsStolen = Math.min(4, targetOpponent.score);
              targetOpponent.score -= ptsStolen;
              p.score += ptsStolen;
              this.log(`💸 Road Tax Extortion! ${p.name} claimed ${ptsStolen} pts from ${targetOpponent.name}!`, 'bonus');
            }
          }
          break;
        }
        case 'TAX_ALL_PLAYERS':
          p.money += 3;
          this.players.forEach((other, idx) => {
            if (idx !== playerIndex && !other.hasFinished) {
              if (other.money >= 2) {
                other.money -= 2;
                this.log(`💸 ${other.name} paid 2 Currency in Citywide Congestion Tax.`, 'action');
              } else {
                other.score = Math.max(0, other.score - 3);
                this.log(`⚠️ ${other.name} had insufficient funds and lost 3 pts.`, 'alert');
              }
            }
          });
          this.log(`💰 ${p.name} collected +3 Currency from Citywide Congestion Tax!`, 'bonus');
          break;
        case 'FREE_EXTRA_STEP':
          p.freeNextRideBonus = true;
          p.bypassRoadblock = true;
          p.score += 3;
          this.log(`🏎️ VIP Free Transit Pass! ${p.name} gains +3 bonus pts, bypasses roadblocks, and rides for 0 Currency on this move!`, 'bonus');
          break;
        case 'GRANT_CURRENCY_9':
          p.money += 6;
          p.score += 3;
          this.log(`💰 Municipal Transit Grant! +6 Currency and +3 pts credited to ${p.name} (Balance: ${p.money}).`, 'bonus');
          break;
        case 'PENALIZE_LEADER': {
          // Find the non-finished player (other than current) with highest score
          const opponentsSorted = this.players.filter((other, idx) => idx !== playerIndex && !other.hasFinished).sort((a, b) => b.score - a.score);
          p.score += 2;
          if (opponentsSorted.length > 0) {
            const leader = opponentsSorted[0];
            const penalty = Math.min(5, leader.score);
            leader.score -= penalty;
            this.log(`👮 Police Inspection! Leader ${leader.name} fined ${penalty} pts, and ${p.name} earned +2 informant pts!`, 'alert');
          } else {
            this.log(`👮 Police Inspection! ${p.name} earned +2 informant pts.`, 'bonus');
          }
          break;
        }
      }
      return true;
    }

    // ADVANCE TO NEXT PLAYER OR NEXT ROUND
    advanceTurn() {
      if (this.phase === 'GAME_OVER') return;
      this.turnsTakenInRound++;

      const allFinished = this.players.every((p) => p.hasFinished);
      if (allFinished) {
        this.endGame();
        return;
      }

      if (this.turnsTakenInRound >= this.players.length) {
        // If any player reached STOP during this round, the round is now complete and the game concludes fairly!
        if (this.winner) {
          this.endGame();
          return;
        }
        // Entire round finished! Start next round
        this.startNextRound();
      } else {
        // Move to next player in clockwise order
        let nextIdx = this.activePlayerIndex;
        let attempts = 0;
        do {
          nextIdx = (nextIdx + 1) % this.players.length;
          attempts++;
        } while (this.players[nextIdx].hasFinished && attempts < this.players.length);

        if (this.players[nextIdx].hasFinished) {
          this.endGame();
          return;
        }
        this.activePlayerIndex = nextIdx;
      }
    }

    startNextRound(overridePriority = null, overrideDiceRoll = null) {
      if (this.phase === 'GAME_OVER') return;
      if (this.winner) {
        this.endGame();
        return;
      }
      this.round++;
      this.turnsTakenInRound = 0;

      // Rotate priority token
      if (overridePriority !== null) {
        this.priorityIndex = overridePriority;
      } else {
        let nextPriority = this.priorityIndex;
        let pAttempts = 0;
        do {
          nextPriority = (nextPriority + 1) % this.players.length;
          pAttempts++;
        } while (this.players[nextPriority].hasFinished && pAttempts < this.players.length);
        this.priorityIndex = nextPriority;
      }

      this.activePlayerIndex = this.priorityIndex;

      // Roll 6-sided dice for traffic
      this.diceRoll = overrideDiceRoll !== null ? overrideDiceRoll : (Math.floor(Math.random() * 6) + 1);
      const row = TRAFFIC_STATUS_ROWS.find((r) => r.roll === this.diceRoll) || TRAFFIC_STATUS_ROWS[0];
      this.trafficStatus = {
        red: row.medium === 'red' ? 'medium' : (row.heavy === 'red' ? 'heavy' : 'light'),
        green: row.medium === 'green' ? 'medium' : (row.heavy === 'green' ? 'heavy' : 'light'),
        blue: row.medium === 'blue' ? 'medium' : (row.heavy === 'blue' ? 'heavy' : 'light')
      };
      audio.playDice();

      this.log(`🎲 ROUND ${this.round} TRAFFIC ROLL: ${this.diceRoll}! (Heavy: ${row.heavy.toUpperCase()}, Med: ${row.medium.toUpperCase()}, Light: ${row.light.toUpperCase()})`, 'traffic');
      this.log(`⭐ Priority Token rotated to ${this.players[this.priorityIndex].name}.`, 'bonus');

      // Clear temporary round buffs & roadblocks
      this.players.forEach((p) => {
        p.lightTrafficBonus = false;
        p.doublePointsBonus = false;
        p.freeNextRideBonus = false;
        p.runSpeedBonus = 0;
        p.bypassRoadblock = false;
      });
      this.blockedColors.clear();
      this.blockedEdges.clear();

      if (this.onNextRoundCallback) {
        this.onNextRoundCallback(this.round, this.priorityIndex, this.diceRoll);
      }
    }

    checkGameCompletion() {
      const allFinished = this.players.every((p) => p.hasFinished);
      if (allFinished) {
        this.endGame();
      }
    }

    endGame() {
      if (this.phase === 'GAME_OVER') return;
      this.phase = 'GAME_OVER';
      this.log(`🏁 THE RACE HAS FINISHED! Calculating final scores & bonuses...`, 'victory');

      this.players.forEach((p) => {
        if (p === this.winner) {
          p.score += 12;
          p.fastestBonus = 12;
        } else if (p.hasFinished && p.finishRank === 2) {
          p.score += 6;
          p.fastestBonus = 6;
        } else {
          p.fastestBonus = 0;
        }

        p.moneyBonus = p.money;
        p.score += p.money; // 1 currency = +1 pt
        if (!p.hasFinished) {
          const dist = this.calcDistance(p.currentNodeId, 'STOP');
          const penalty = dist * 6; // 6 pts penalty per stop away
          p.distanceToStop = dist;
          p.distancePenalty = penalty;
          p.score = Math.max(0, p.score - penalty);
        } else {
          p.distanceToStop = 0;
          p.distancePenalty = 0;
        }
      });

      this.players.sort((a, b) => b.score - a.score);
      if (this.onGameOverCallback) this.onGameOverCallback(this.players);
    }
  }

  // ==========================================
  // 4. STRATEGIC AI BOT CONTROLLER (Monte-Carlo Optimized)
  // ==========================================
  class AIPlayer {
    constructor(engine) {
      this.engine = engine;
    }

    chooseAbilityAction(playerIndex) {
      const p = this.engine.players[playerIndex];
      if (!p || p.hand.length === 0) return false;

      let acted = false;

      // 1. Mandatory "Play Right Away" / "Play At Once" Cards MUST be executed first
      let mandatoryCards = p.hand.filter((c) => c.type === 'Play Right Away' || c.type === 'Play At Once');
      while (mandatoryCards.length > 0) {
        const card = mandatoryCards[0];
        let param = null;
        if (card.effectType === 'BLOCK_ROAD_COLOR') {
          param = Object.keys(this.engine.trafficStatus).find((k) => this.engine.trafficStatus[k] === 'light') || 'red';
        } else if (card.effectType === 'STEAL_FROM_OPPONENT') {
          const opps = this.engine.players
            .map((pl, idx) => ({ pl, idx }))
            .filter(({ pl, idx }) => idx !== playerIndex && !pl.hasFinished)
            .sort((a, b) => (b.pl.score + b.pl.money) - (a.pl.score + a.pl.money));
          param = opps.length > 0 ? opps[0].idx : null;
        } else if (card.effectType === 'FREE_VEHICLE') {
          param = p.vehicleTokens.has('car') ? 'bike' : 'car';
        }
        this.engine.playCardWithSelection(playerIndex, card.instanceId, param);
        acted = true;
        mandatoryCards = p.hand.filter((c) => c.type === 'Play Right Away' || c.type === 'Play At Once');
      }

      if (p.hand.length === 0) return acted;

      // 2. Strategic optional card timing
      for (const card of [...p.hand]) {
        if (card.effectType === 'FREE_VEHICLE') {
          const chosenPermit = p.vehicleTokens.has('car') ? 'bike' : 'car';
          this.engine.playCardWithSelection(playerIndex, card.instanceId, chosenPermit);
          acted = true;
        } else if (card.effectType === 'ADD_CURRENCY_6') {
          if (p.money <= 8) {
            this.engine.playCardWithSelection(playerIndex, card.instanceId);
            acted = true;
          }
        } else if (card.effectType === 'FREE_EXTRA_STEP') {
          // VIP Free Transit Pass: use when we want a free expensive ride or when low on cash
          if (p.money <= 6 || !p.freeNextRideBonus) {
            this.engine.playCardWithSelection(playerIndex, card.instanceId);
            acted = true;
          }
        } else if (card.effectType === 'STEAL_FROM_OPPONENT') {
          const opps = this.engine.players
            .map((pl, idx) => ({ pl, idx }))
            .filter(({ pl, idx }) => idx !== playerIndex && !pl.hasFinished)
            .sort((a, b) => b.pl.score - a.pl.score);
          if (opps.length > 0) {
            this.engine.playCardWithSelection(playerIndex, card.instanceId, opps[0].idx);
            acted = true;
          }
        } else if (card.effectType === 'BLOCK_ROAD_COLOR') {
          const lightCol = Object.keys(this.engine.trafficStatus).find((k) => this.engine.trafficStatus[k] === 'light') || 'green';
          this.engine.playCardWithSelection(playerIndex, card.instanceId, lightCol);
          acted = true;
        } else if (card.effectType === 'LIGHT_TRAFFIC_BUFF') {
          if (p.money >= 2 || p.freeNextRideBonus) {
            this.engine.playCardWithSelection(playerIndex, card.instanceId);
            acted = true;
          }
        } else if (card.effectType === 'DOUBLE_POINTS') {
          if (p.money >= 3 || p.freeNextRideBonus) {
            this.engine.playCardWithSelection(playerIndex, card.instanceId);
            acted = true;
          }
        }
      }
      return acted;
    }

    chooseTravelMove(playerIndex) {
      const p = this.engine.players[playerIndex];
      const valid = this.engine.getValidMovesForPlayer(playerIndex);
      if (valid.length === 0) return null;

      // Filter to affordable moves only
      const affordable = valid.filter((m) => m.canAfford);
      const candidates = affordable.length > 0 ? affordable : valid.filter((m) => m.cost === 0);

      const currDist = this.engine.calcDistance(p.currentNodeId, 'STOP');
      const milestones = [35, 70, 105];

      const scored = candidates.map((m) => {
        const nextDist = this.engine.calcDistance(m.targetNodeId, 'STOP');
        const distProgress = currDist - nextDist;
        const netPoints = m.pointsEarned - m.cost;

        // Check if this move crosses a 35/70/105 milestone (+6 Currency)
        let milestoneBonus = 0;
        for (const ms of milestones) {
          if (!p.milestonesClaimed.has(ms) && p.score < ms && p.score + m.pointsEarned >= ms) {
            milestoneBonus += 7.5;
          }
        }

        const moneyAfter = p.money + milestoneBonus - m.cost;
        const budgetPenalty = (nextDist > 1 && moneyAfter < 2) ? -4.5 : 0;

        // 2-step lookahead on destination node's stations, unvisited cards, hospitals, and outgoing road diversity
        let lookahead = 0;
        if (m.targetNode.isStop) lookahead += 500;
        if (m.targetNode.hasCard && (!p.visitedCardNodes || !p.visitedCardNodes.has(m.targetNodeId)) && nextDist >= 1) {
          lookahead += 6.5;
        }
        if (m.targetNode.hasHospital && (!p.visitedHospitals || !p.visitedHospitals.has(m.targetNodeId))) {
          lookahead += 3.5;
        }
        if (m.targetNode.hasTrain && moneyAfter >= SPEED_CHART.train.cost) {
          lookahead += 4.0;
        }
        if (m.targetNode.hasCar && moneyAfter >= SPEED_CHART.car.cost && p.currentVehicle !== 'car') {
          lookahead += 3.0;
        }
        if (m.targetNode.hasBus && moneyAfter >= SPEED_CHART.bus.cost) {
          lookahead += 2.0;
        }
        if (m.vehicleId === 'car' && nextDist >= 2) lookahead += 2.5;
        if (m.vehicleId === 'bike' && nextDist >= 2) lookahead += 1.5;

        const outEdges = this.engine.getConnectedEdges(m.targetNodeId).filter((e) => {
          const nbId = this.engine.getAdjacentNodeId(e, m.targetNodeId);
          const nb = this.engine.nodesMap.get(nbId);
          return nb && (nb.level ?? 0) > (m.targetNode.level ?? 0);
        });
        const distinctColors = new Set(outEdges.map((e) => e.color)).size;
        lookahead += distinctColors * 1.2;

        const score = distProgress * 26 + netPoints * 1.35 + milestoneBonus + lookahead + budgetPenalty;
        return { m, score };
      });

      scored.sort((a, b) => b.score - a.score);
      return scored[0]?.m || candidates[0];
    }

    chooseCardToKeep(playerIndex, cards) {
      if (!cards || cards.length === 0) return null;
      const p = this.engine.players[playerIndex];
      const rankCard = (c) => {
        switch (c.effectType) {
          case 'DOUBLE_POINTS': return 95;
          case 'GRANT_CURRENCY_9': return 88;
          case 'FREE_VEHICLE': return (p && p.vehicleTokens.has('car')) ? 45 : 85;
          case 'FREE_EXTRA_STEP': return 84;
          case 'LIGHT_TRAFFIC_BUFF': return 80;
          case 'ADD_CURRENCY_6': return 76;
          case 'STEAL_FROM_OPPONENT': return 72;
          case 'BLOCK_ROAD_COLOR': return 68;
          case 'PENALIZE_LEADER': return 64;
          case 'TAX_ALL_PLAYERS': return 62;
          default: return 50;
        }
      };
      const sorted = [...cards].sort((a, b) => rankCard(b) - rankCard(a));
      return sorted[0]?.instanceId;
    }
  }

  // ==========================================
  // 5. CANVAS BOARD RENDERER WITH CURVED RAILWAYS & PERIMETER BADGES
  // ==========================================
  class BoardRenderer {
    constructor(canvas, engine) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.engine = engine;
      this.boardWidth = BOARD_CONFIG.width;
      this.boardHeight = BOARD_CONFIG.height;
      this.scale = 1.0;
      this.panX = 0;
      this.panY = 0;
      this.isDragging = false;
      this.dragStartX = 0;
      this.dragStartY = 0;
      this.highlightedMoves = [];
      this.showVectorOverlay = true;
      this.focusedPlayerIndex = null;
      this.focusAnimationTimer = 0;

      this.initEvents();
      this.startLoop();
    }

    initEvents() {
      window.addEventListener('resize', () => this.resize());
      this.resize();

      this.canvas.addEventListener('mousedown', (e) => {
        const pos = this.screenToWorld(e.clientX, e.clientY);
        const clicked = this.findNodeAt(pos.x, pos.y);
        if (clicked && this.onNodeClick) {
          this.onNodeClick(clicked);
          return;
        }
        this.isDragging = true;
        this.dragStartX = e.clientX - this.panX;
        this.dragStartY = e.clientY - this.panY;
      });

      window.addEventListener('mousemove', (e) => {
        if (this.isDragging) {
          this.panX = e.clientX - this.dragStartX;
          this.panY = e.clientY - this.dragStartY;
          this.render();
          return;
        }
        const pos = this.screenToWorld(e.clientX, e.clientY);
        const node = this.findNodeAt(pos.x, pos.y);
        this.canvas.style.cursor = node ? 'pointer' : 'grab';
        if (this.onNodeHover) this.onNodeHover(node);
      });

      window.addEventListener('mouseup', () => { this.isDragging = false; });

      this.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.15 : 0.87;
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const newScale = Math.max(0.15, Math.min(4.5, this.scale * factor));
        this.panX = mx - (mx - this.panX) * (newScale / this.scale);
        this.panY = my - (my - this.panY) * (newScale / this.scale);
        this.scale = newScale;
        this.render();
      }, { passive: false });
    }

    syncBoardDimensions() {
      this.boardWidth = this.engine.boardWidth || BOARD_CONFIG.width;
      this.boardHeight = this.engine.boardHeight || BOARD_CONFIG.height;
    }

    resize() {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
      this.fitBoardToView();
    }

    fitBoardToView() {
      this.syncBoardDimensions();
      const s = Math.min(this.canvas.width / this.boardWidth, this.canvas.height / this.boardHeight) * 0.95;
      this.scale = s;
      this.panX = (this.canvas.width - this.boardWidth * s) / 2;
      this.panY = (this.canvas.height - this.boardHeight * s) / 2;
      this.render();
    }

    centerOnNode(nodeId, playerIdx = null) {
      this.syncBoardDimensions();
      const node = this.engine.nodesMap.get(nodeId);
      if (!node) return;
      const px = node.x * this.boardWidth;
      const py = node.y * this.boardHeight;
      this.scale = Math.max(this.scale, 0.95);
      this.panX = this.canvas.width / 2 - px * this.scale;
      this.panY = this.canvas.height / 2 - py * this.scale;
      if (playerIdx !== null) {
        this.focusedPlayerIndex = playerIdx;
        this.focusAnimationTimer = Date.now() + 4000;
      }
      this.render();
    }

    centerOnActivePlayer() {
      this.centerOnNode(this.engine.players[this.engine.activePlayerIndex]?.currentNodeId, this.engine.activePlayerIndex);
    }

    screenToWorld(sx, sy) {
      const rect = this.canvas.getBoundingClientRect();
      return { x: (sx - rect.left - this.panX) / this.scale, y: (sy - rect.top - this.panY) / this.scale };
    }

    getNodePixel(node) {
      return { x: node.x * this.boardWidth, y: node.y * this.boardHeight };
    }

    findNodeAt(wx, wy, radius = 42) {
      for (const node of this.engine.nodesMap.values()) {
        const p = this.getNodePixel(node);
        if (Math.hypot(p.x - wx, p.y - wy) <= radius) return node;
      }
      return null;
    }

    startLoop() {
      const loop = () => {
        this.render();
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }

    render() {
      this.syncBoardDimensions();
      const { ctx, canvas } = this;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(this.panX, this.panY);
      ctx.scale(this.scale, this.scale);

      // Clean Modern Vector Board Base
      const grad = ctx.createLinearGradient(0, 0, 0, this.boardHeight);
      grad.addColorStop(0, '#0c1322');
      grad.addColorStop(0.5, '#080d19');
      grad.addColorStop(1, '#050912');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.boardWidth, this.boardHeight);

      // Outer Board Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, this.boardWidth - 20, this.boardHeight - 20);

      // Subtle Background Grid Dots
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
      for (let gx = 60; gx < this.boardWidth; gx += 80) {
        for (let gy = 60; gy < this.boardHeight; gy += 80) {
          ctx.fillRect(gx, gy, 2, 2);
        }
      }
      ctx.restore();

      // ==========================================
      // EDGES: ROADS & BEAUTIFUL CURVED RAILROADS
      // ==========================================
      if (this.showVectorOverlay) {
        for (const edge of this.engine.edges) {
          const f = this.engine.nodesMap.get(edge.from);
          const t = this.engine.nodesMap.get(edge.to);
          if (!f || !t) continue;
          const p1 = this.getNodePixel(f);
          const p2 = this.getNodePixel(t);

          ctx.save();
          if (edge.type === 'rail') {
            // CURVED RAILWAY TRACK (Quadratic Bézier Curve)
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            const perpAngle = angle + Math.PI / 2;
            const curveOffset = edge.curveOffset || 45;
            const mx = (p1.x + p2.x) / 2;
            const my = (p1.y + p2.y) / 2;
            const cpx = mx + Math.cos(perpAngle) * curveOffset;
            const cpy = my + Math.sin(perpAngle) * curveOffset;

            // 1. Purple Glow & Track Bed
            ctx.strokeStyle = '#c084fc';
            ctx.lineWidth = 14;
            ctx.lineCap = 'round';
            ctx.shadowColor = '#c084fc';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.quadraticCurveTo(cpx, cpy, p2.x, p2.y);
            ctx.stroke();

            // 2. Railway Ties perpendicular along the curve
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#2e0854';
            ctx.lineWidth = 4.5;
            const steps = 14;
            for (let i = 1; i < steps; i++) {
              const tVal = i / steps;
              // Point on quadratic curve
              const bx = (1 - tVal) * (1 - tVal) * p1.x + 2 * (1 - tVal) * tVal * cpx + tVal * tVal * p2.x;
              const by = (1 - tVal) * (1 - tVal) * p1.y + 2 * (1 - tVal) * tVal * cpy + tVal * tVal * p2.y;
              // Tangent derivative
              const dx = 2 * (1 - tVal) * (cpx - p1.x) + 2 * tVal * (p2.x - cpx);
              const dy = 2 * (1 - tVal) * (cpy - p1.y) + 2 * tVal * (p2.y - cpy);
              const len = Math.hypot(dx, dy);
              if (len > 0) {
                const nx = -dy / len;
                const ny = dx / len;
                ctx.beginPath();
                ctx.moveTo(bx - nx * 7, by - ny * 7);
                ctx.lineTo(bx + nx * 7, by + ny * 7);
                ctx.stroke();
              }
            }
          } else {
            // Road Edges: Red, Green, Blue with glow
            let col = edge.color === 'red' ? '#ef4444' : (edge.color === 'green' ? '#10b981' : '#3b82f6');
            ctx.strokeStyle = col;
            ctx.lineWidth = 10;
            ctx.lineCap = 'round';
            ctx.globalAlpha = 0.85;
            ctx.shadowColor = col;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      // Valid Move Paths Highlight (Animated Dashed Path)
      if (this.highlightedMoves.length > 0) {
        const active = this.engine.players[this.engine.activePlayerIndex];
        if (active) {
          const curP = this.getNodePixel(this.engine.nodesMap.get(active.currentNodeId));
          ctx.save();
          const targetIdsSeen = new Set();
          for (const m of this.highlightedMoves) {
            if (targetIdsSeen.has(m.targetNodeId)) continue;
            targetIdsSeen.add(m.targetNodeId);
            const tgtP = this.getNodePixel(m.targetNode);
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 8;
            ctx.setLineDash([14, 10]);
            ctx.lineDashOffset = -Date.now() / 35;

            ctx.beginPath();
            if (m.edgeType === 'rail') {
              const angle = Math.atan2(tgtP.y - curP.y, tgtP.x - curP.x);
              const perpAngle = angle + Math.PI / 2;
              const curveOffset = m.edgeCurve || 45;
              const mx = (curP.x + tgtP.x) / 2;
              const my = (curP.y + tgtP.y) / 2;
              const cpx = mx + Math.cos(perpAngle) * curveOffset;
              const cpy = my + Math.sin(perpAngle) * curveOffset;
              ctx.moveTo(curP.x, curP.y);
              ctx.quadraticCurveTo(cpx, cpy, tgtP.x, tgtP.y);
            } else {
              ctx.moveTo(curP.x, curP.y);
              ctx.lineTo(tgtP.x, tgtP.y);
            }
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      // ==========================================
      // NODES RENDERING WITH SIDE PERIMETER BADGES
      // ==========================================
      const validTargetIds = new Set(this.highlightedMoves.map((m) => m.targetNodeId));
      for (const node of this.engine.nodesMap.values()) {
        const p = this.getNodePixel(node);
        const isValid = validTargetIds.has(node.id);
        const radius = node.isStart || node.isStop ? 36 : 28;

        ctx.save();
        // Valid Target Pulsing Ring
        if (isValid) {
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 38 + Math.sin(Date.now() / 220) * 5, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Base Center Circle (Clean interior so player tokens sit without covering station icons!)
        ctx.fillStyle = node.isStart ? '#f59e0b' : (node.isStop ? '#10b981' : '#1e293b');
        ctx.strokeStyle = isValid ? '#fbbf24' : (node.hasTrain ? '#c084fc' : '#64748b');
        ctx.lineWidth = isValid ? 4 : (node.hasTrain ? 3.5 : 2);
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (node.isStart) {
          ctx.fillStyle = '#000'; ctx.font = 'bold 15px sans-serif'; ctx.fillText('START', p.x, p.y);
        } else if (node.isStop) {
          ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.fillText('STOP', p.x, p.y);
        } else {
          // Subtle ID watermark inside
          ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText(node.id, p.x, p.y);
        }

        // 1. TOP SIDE BADGE: Vehicle Station Symbols (🏍️ 🚗 🚌 🚂)
        if (!node.isStart && !node.isStop) {
          const badges = [];
          if (node.hasBike) badges.push('🏍️');
          if (node.hasCar) badges.push('🚗');
          if (node.hasBus) badges.push('🚌');
          if (node.hasTrain) badges.push('🚂');

          if (badges.length > 0) {
            ctx.font = '12px sans-serif';
            const badgeStr = badges.join('');
            const textWidth = ctx.measureText(badgeStr).width;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            ctx.beginPath();
            ctx.roundRect(p.x - textWidth / 2 - 6, p.y - radius - 18, textWidth + 12, 16, 4);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.fillText(badgeStr, p.x, p.y - radius - 9);
          }
        }

        // 2. LEFT SIDE BADGE: Hospital Station (✚)
        if (node.hasHospital) {
          const hx = p.x - radius - 16;
          const hy = p.y;
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.arc(hx, hy, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 15px sans-serif';
          ctx.fillText('✚', hx, hy + 1);
        }

        // 3. RIGHT SIDE BADGE: Ability Card Station (🎴 A)
        if (node.hasCard) {
          const cx = p.x + radius + 16;
          const cy = p.y;
          ctx.fillStyle = '#7c3aed';
          ctx.beginPath();
          ctx.arc(cx, cy, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText('🎴A', cx, cy);
        }

        // 4. BOTTOM SIDE LABEL: Node Name Label Pill
        const shortName = node.name.split('(')[0].replace('START: ', '').replace('STOP: ', '');
        ctx.font = 'bold 11px sans-serif';
        const nameWidth = ctx.measureText(shortName).width;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.beginPath();
        ctx.roundRect(p.x - nameWidth / 2 - 6, p.y + radius + 5, nameWidth + 12, 16, 4);
        ctx.fill();
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(shortName, p.x, p.y + radius + 13);

        ctx.restore();
      }

      // ==========================================
      // PLAYER TOKENS & FULL ROSTER LOCATOR
      // ==========================================
      const nodeGroups = new Map();
      this.engine.players.forEach((p, idx) => {
        const l = nodeGroups.get(p.currentNodeId) || [];
        l.push({ p, idx });
        nodeGroups.set(p.currentNodeId, l);
      });

      nodeGroups.forEach((playersAtNode, nId) => {
        const node = this.engine.nodesMap.get(nId);
        if (!node) return;
        const p = this.getNodePixel(node);
        const count = playersAtNode.length;

        playersAtNode.forEach(({ p: player, idx }, rank) => {
          let tx = p.x;
          let ty = p.y;
          if (count > 1) {
            const angle = (rank * Math.PI * 2) / count;
            tx += Math.cos(angle) * 20;
            ty += Math.sin(angle) * 20;
          }
          const isActive = idx === this.engine.activePlayerIndex;
          const isFocused = this.focusedPlayerIndex === idx && Date.now() < this.focusAnimationTimer;

          ctx.save();
          // Targeted Focus Pulsing Reticle
          if (isFocused) {
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 3;
            ctx.setLineDash([6, 4]);
            ctx.lineDashOffset = -Date.now() / 30;
            ctx.beginPath();
            ctx.arc(tx, ty, 28, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Player Disc Body
          ctx.fillStyle = player.color.hex;
          ctx.strokeStyle = isActive ? '#fbbf24' : '#ffffff';
          ctx.lineWidth = isActive ? 4 : 2.5;
          ctx.beginPath();
          ctx.arc(tx, ty, isActive ? 18 : 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Player Avatar Initial
          ctx.fillStyle = player.color.text;
          ctx.font = `bold ${isActive ? '14px' : '12px'} sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(player.name.charAt(0).toUpperCase(), tx, ty);

          // Current Vehicle Badge on Token
          if (player.currentVehicle && player.currentVehicle !== 'run') {
            const vIcon = SPEED_CHART[player.currentVehicle]?.icon || '🚗';
            ctx.font = '12px sans-serif';
            ctx.fillText(vIcon, tx + 14, ty - 12);
          }

          // Name Tag Pill for ALL Players so opponents and their card counts are instantly locatable
          ctx.font = 'bold 10px sans-serif';
          const cardCountTag = player.hand.length > 0 ? ` • 🎴${player.hand.length}` : '';
          const pNameStr = `${player.name} (${player.score}pts${cardCountTag})`;
          const pNameWidth = ctx.measureText(pNameStr).width;
          ctx.fillStyle = isActive ? 'rgba(245, 158, 11, 0.95)' : 'rgba(15, 23, 42, 0.85)';
          ctx.beginPath();
          ctx.roundRect(tx - pNameWidth / 2 - 5, ty - (isActive ? 38 : 28), pNameWidth + 10, 14, 3);
          ctx.fill();
          ctx.fillStyle = isActive ? '#000000' : '#ffffff';
          ctx.fillText(pNameStr, tx, ty - (isActive ? 30 : 20));

          // Active Crown / Priority Star
          if (isActive) {
            ctx.font = '16px sans-serif';
            ctx.fillText('👑', tx, ty - 46);
          } else if (idx === this.engine.priorityIndex) {
            ctx.font = '13px sans-serif';
            ctx.fillText('⭐', tx, ty - 34);
          }
          ctx.restore();
        });
      });

      // Active Player Beacon Pulse Wave
      const activePlayer = this.engine.players[this.engine.activePlayerIndex];
      if (activePlayer && !activePlayer.hasFinished) {
        const activeNode = this.engine.nodesMap.get(activePlayer.currentNodeId);
        if (activeNode) {
          const ap = this.getNodePixel(activeNode);
          ctx.save();
          const pulseProgress = (Date.now() % 1600) / 1600;
          const pulseRadius = 30 + pulseProgress * 45;
          const pulseAlpha = (1 - pulseProgress) * 0.8;
          ctx.strokeStyle = activePlayer.color.hex;
          ctx.lineWidth = 3.5;
          ctx.globalAlpha = pulseAlpha;
          ctx.beginPath();
          ctx.arc(ap.x, ap.y, pulseRadius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      ctx.restore();
    }
  }

  // ==========================================
  // 6. APPLICATION CONTROLLER & MODAL DISPATCHER
  // ==========================================
  class AppController {
    constructor() {
      this.engine = new GameEngine();
      this.ai = new AIPlayer(this.engine);
      this.canvas = document.getElementById('boardCanvas');
      this.renderer = new BoardRenderer(this.canvas, this.engine);

      this.isOnlineGame = false;
      this.isHost = false;
      this.localClientId = (window.K2GMultiplayer && window.K2GMultiplayer.clientId) || ('p_' + Math.random().toString(36).substr(2, 6));
      this.localPlayerIndex = 0;
      this.gameInProgress = false;
      this.selectedHostColor = PLAYER_COLORS[0];
      this.selectedJoinColor = PLAYER_COLORS[1];

      // Turn synchronization & 5-minute countdown timer state
      this.gameSessionId = 0;
      this.pendingTimeouts = new Set();
      this.isOpeningDraftActive = false;
      this.turnTimeLimitSec = 300; // 5 minutes (300 seconds) per human turn / card selection
      this.turnTimerInterval = null;
      this.turnTimerRemainingSec = 300;
      this.turnTimerMode = null; // 'MOVE' | 'CARD_DRAW' | null
      this.turnTimerPlayerIndex = null;
      this.remotePendingCardDrawDone = null;

      this.initCallbacks();
      this.bindDOM();
      this.initHomeScreen();
      this.initMultiplayer();
      this.showHomeScreen(true);
    }

    registerTimeout(fn, delayMs) {
      const id = setTimeout(() => {
        this.pendingTimeouts.delete(id);
        fn();
      }, delayMs);
      this.pendingTimeouts.add(id);
      return id;
    }

    clearPendingTimeouts() {
      this.pendingTimeouts.forEach((id) => clearTimeout(id));
      this.pendingTimeouts.clear();
      this.stopTurnTimer();
    }

    formatTimerMMSS(totalSeconds) {
      const clamped = Math.max(0, Math.floor(totalSeconds));
      const mins = Math.floor(clamped / 60);
      const secs = clamped % 60;
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    updateTimerBadges() {
      const formatted = `⏱️ ${this.formatTimerMMSS(this.turnTimerRemainingSec)}`;
      const isWarning = this.turnTimerRemainingSec <= 60 && this.turnTimerRemainingSec > 15;
      const isDanger = this.turnTimerRemainingSec <= 15;

      const badgeIds = [
        'turnTimerBadge',
        'hudTurnTimerBadge',
        'cardDrawTimerBadge',
        'vehicleModalTimerBadge',
        'cardActionModalTimerBadge'
      ];

      badgeIds.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerText = formatted;
        el.classList.remove('hidden', 'warning', 'danger');
        if (isWarning) el.classList.add('warning');
        if (isDanger) el.classList.add('danger');
      });
    }

    startTurnTimer(mode, playerIndex, onExpire) {
      if (this.turnTimerInterval) {
        clearInterval(this.turnTimerInterval);
        this.turnTimerInterval = null;
      }

      this.turnTimerMode = mode;
      this.turnTimerPlayerIndex = playerIndex;
      this.turnTimerRemainingSec = this.turnTimeLimitSec;
      this.updateTimerBadges();

      const sessionAtStart = this.gameSessionId;
      this.turnTimerInterval = setInterval(() => {
        if (this.gameSessionId !== sessionAtStart || !this.gameInProgress || this.engine.phase === 'GAME_OVER') {
          this.stopTurnTimer();
          return;
        }

        this.turnTimerRemainingSec--;
        this.updateTimerBadges();

        if (this.turnTimerRemainingSec > 0 && this.turnTimerRemainingSec <= 10) {
          audio.playTone(660, 0.06, 'sine', 0.08);
        }

        if (this.turnTimerRemainingSec <= 0) {
          this.stopTurnTimer();
          audio.playTone(280, 0.25, 'triangle', 0.2);
          if (onExpire) onExpire();
        }
      }, 1000);
    }

    stopTurnTimer() {
      if (this.turnTimerInterval) {
        clearInterval(this.turnTimerInterval);
        this.turnTimerInterval = null;
      }
      this.turnTimerMode = null;
      this.turnTimerPlayerIndex = null;

      const badgeIds = [
        'turnTimerBadge',
        'hudTurnTimerBadge',
        'vehicleModalTimerBadge',
        'cardActionModalTimerBadge'
      ];
      badgeIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
      });
    }

    showHomeScreen(show) {
      const homeEl = document.getElementById('homeScreen');
      const turnBar = document.getElementById('turnOrderBar');
      const appContainer = document.querySelector('.app-container');
      const resumeBtn = document.getElementById('homeResumeGameBtn');

      if (show) {
        if (homeEl) homeEl.classList.remove('hidden');
        if (turnBar) turnBar.style.display = 'none';
        if (appContainer) appContainer.style.display = 'none';
        if (resumeBtn) resumeBtn.style.display = this.gameInProgress ? 'inline-block' : 'none';
      } else {
        if (homeEl) homeEl.classList.add('hidden');
        if (turnBar) turnBar.style.display = 'flex';
        if (appContainer) appContainer.style.display = 'flex';
        setTimeout(() => {
          this.renderer.resize();
          this.renderer.fitBoardToView();
        }, 50);
      }
    }

    initHomeScreen() {
      // Home Screen Nav & Modal Triggers
      const homeNavBtn = document.getElementById('homeNavBtn');
      if (homeNavBtn) homeNavBtn.addEventListener('click', () => this.showHomeScreen(true));

      const homeRulesBtn = document.getElementById('homeRulesBtn');
      if (homeRulesBtn) homeRulesBtn.addEventListener('click', () => this.toggleModal('rulesModal', true));

      const homeSpeedChartBtn = document.getElementById('homeSpeedChartBtn');
      if (homeSpeedChartBtn) {
        homeSpeedChartBtn.addEventListener('click', () => {
          this.showHomeScreen(false);
          const speedPanel = document.getElementById('speedChartPanel');
          if (speedPanel) speedPanel.classList.remove('collapsed');
        });
      }

      const homeGithubGuideBtn = document.getElementById('homeGithubGuideBtn');
      if (homeGithubGuideBtn) homeGithubGuideBtn.addEventListener('click', () => this.toggleModal('githubPagesModal', true));

      const closeGithubGuideBtn = document.getElementById('closeGithubGuideBtn');
      if (closeGithubGuideBtn) closeGithubGuideBtn.addEventListener('click', () => this.toggleModal('githubPagesModal', false));

      const resumeBtn = document.getElementById('homeResumeGameBtn');
      if (resumeBtn) resumeBtn.addEventListener('click', () => this.showHomeScreen(false));

      const startLocalBtn = document.getElementById('homeStartLocalBtn');
      if (startLocalBtn) {
        startLocalBtn.addEventListener('click', () => {
          this.showHomeScreen(false);
          this.showSetupModal();
        });
      }

      // Online Host/Join Tabs
      const tabHost = document.getElementById('tabHostRoom');
      const tabJoin = document.getElementById('tabJoinRoom');
      const paneHost = document.getElementById('paneHostRoom');
      const paneJoin = document.getElementById('paneJoinRoom');

      if (tabHost && tabJoin && paneHost && paneJoin) {
        tabHost.addEventListener('click', () => {
          tabHost.classList.add('active');
          tabJoin.classList.remove('active');
          paneHost.classList.add('active');
          paneJoin.classList.remove('active');
        });
        tabJoin.addEventListener('click', () => {
          tabJoin.classList.add('active');
          tabHost.classList.remove('active');
          paneJoin.classList.add('active');
          paneHost.classList.remove('active');
        });
      }

      // Color pickers setup
      this.setupColorPicker('hostColorPicker', (col) => { this.selectedHostColor = col; }, 0);
      this.setupColorPicker('joinColorPicker', (col) => { this.selectedJoinColor = col; }, 1);

      // Create Room Button
      const createRoomBtn = document.getElementById('hostCreateRoomBtn');
      if (createRoomBtn) {
        createRoomBtn.addEventListener('click', () => {
          audio.ensureContext();
          const hostName = (document.getElementById('hostPlayerNameInput')?.value || '').trim() || 'Host';
          const maxPlayers = parseInt(document.getElementById('hostMaxPlayersSelect')?.value || '4', 10);
          this.isOnlineGame = true;
          this.isHost = true;
          if (window.K2GMultiplayer) {
            window.K2GMultiplayer.createRoom(hostName, this.selectedHostColor.hex, maxPlayers);
          }
          this.toggleModal('onlineLobbyModal', true);
        });
      }

      // Join Room Button
      const joinRoomBtn = document.getElementById('joinRoomSubmitBtn');
      if (joinRoomBtn) {
        joinRoomBtn.addEventListener('click', () => {
          audio.ensureContext();
          const pName = (document.getElementById('joinPlayerNameInput')?.value || '').trim() || 'Guest';
          const code = (document.getElementById('joinGameIdInput')?.value || '').trim().toUpperCase();
          if (!code) {
            alert('Please enter a valid Game ID to join!');
            return;
          }
          this.isOnlineGame = true;
          this.isHost = false;
          if (window.K2GMultiplayer) {
            window.K2GMultiplayer.joinRoom(code, pName, this.selectedJoinColor.hex);
          }
          this.toggleModal('onlineLobbyModal', true);
        });
      }

      // Refresh Lobby Button
      const refreshBtn = document.getElementById('refreshLobbyBtn');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
          if (window.K2GMultiplayer) {
            window.K2GMultiplayer.publishLobbyPing();
          }
        });
      }

      // URL Query auto-detect (?room=K2G-XXXX)
      const urlParams = new URLSearchParams(window.location.search);
      const roomParam = urlParams.get('room') || urlParams.get('game');
      if (roomParam) {
        const joinInput = document.getElementById('joinGameIdInput');
        if (joinInput) joinInput.value = roomParam.trim().toUpperCase();
        if (tabJoin) tabJoin.click();
      }

      // Lobby Modal Controls
      const copyIdBtn = document.getElementById('copyGameIdBtn');
      if (copyIdBtn) {
        copyIdBtn.addEventListener('click', () => {
          const roomId = window.K2GMultiplayer ? window.K2GMultiplayer.currentRoomId : null;
          if (!roomId) return;
          const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
          const copyText = `Join my Which Way to Go! game: Game ID: ${roomId} | Link: ${shareUrl}`;
          if (navigator.clipboard) {
            navigator.clipboard.writeText(copyText).then(() => {
              copyIdBtn.innerText = '✓ Copied Link & ID!';
              setTimeout(() => { copyIdBtn.innerText = '📋 Copy Game ID & Link'; }, 2000);
            });
          } else {
            prompt('Copy this room link to share with friends:', copyText);
          }
        });
      }

      const leaveLobbyBtn = document.getElementById('leaveLobbyBtn');
      if (leaveLobbyBtn) leaveLobbyBtn.addEventListener('click', () => this.leaveOnlineLobby());
      const lobbyBackBtn = document.getElementById('lobbyBackBtn');
      if (lobbyBackBtn) lobbyBackBtn.addEventListener('click', () => this.leaveOnlineLobby());

      const addBotBtn = document.getElementById('lobbyAddBotBtn');
      if (addBotBtn) {
        addBotBtn.addEventListener('click', () => {
          if (!window.K2GMultiplayer) return;
          const botCount = (window.K2GMultiplayer.roomState?.players?.length || 0) + 1;
          const botColor = PLAYER_COLORS[botCount % PLAYER_COLORS.length].hex;
          window.K2GMultiplayer.addAiBotToRoom(`Smart Bot ${botCount}`, botColor);
        });
      }

      const startOnlineGameBtn = document.getElementById('lobbyStartGameBtn');
      if (startOnlineGameBtn) {
        startOnlineGameBtn.addEventListener('click', () => {
          if (this.isHost) {
            this.launchOnlineGameFromHost();
          }
        });
      }

      const chatInput = document.getElementById('lobbyChatInput');
      const chatSendBtn = document.getElementById('lobbySendChatBtn');
      if (chatInput && chatSendBtn) {
        const doSend = () => {
          const text = chatInput.value.trim();
          if (text && window.K2GMultiplayer) {
            window.K2GMultiplayer.sendChatMessage(text);
            chatInput.value = '';
          }
        };
        chatSendBtn.addEventListener('click', doSend);
        chatInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') doSend();
        });
      }
    }

    setupColorPicker(containerId, onSelect, defaultIdx = 0) {
      const container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = '';
      PLAYER_COLORS.forEach((col, idx) => {
        const dot = document.createElement('div');
        dot.className = `color-option-dot ${idx === defaultIdx ? 'selected' : ''}`;
        dot.style.backgroundColor = col.hex;
        dot.title = col.name;
        dot.addEventListener('click', () => {
          container.querySelectorAll('.color-option-dot').forEach(d => d.classList.remove('selected'));
          dot.classList.add('selected');
          onSelect(col);
        });
        container.appendChild(dot);
      });
    }

    leaveOnlineLobby() {
      if (window.K2GMultiplayer) {
        window.K2GMultiplayer.leaveRoom();
      }
      this.toggleModal('onlineLobbyModal', false);
      this.isOnlineGame = false;
      this.showHomeScreen(true);
    }

    initMultiplayer() {
      if (!window.K2GMultiplayer) return;

      window.K2GMultiplayer.onOpenRoomsChanged = (rooms) => this.renderOpenRoomsList(rooms);
      window.K2GMultiplayer.onRoomStateChanged = (roomState) => this.renderLobbyState(roomState);
      window.K2GMultiplayer.onChatMessageReceived = (chat) => this.appendLobbyChat(chat);
      window.K2GMultiplayer.onConnectionStatusChanged = (status) => this.updateNetworkStatusPill(status);
      window.K2GMultiplayer.onGameActionReceived = (actionType, actionData) => this.handleRemoteGameAction(actionType, actionData);
    }

    updateNetworkStatusPill(status) {
      const pill = document.getElementById('networkStatusPill');
      if (!pill) return;
      if (status === 'online') {
        pill.innerText = '🟢 WebSocket Online';
        pill.style.borderColor = 'rgba(16, 185, 129, 0.5)';
        pill.style.color = '#34d399';
      } else if (status === 'connecting') {
        pill.innerText = '🟡 Connecting...';
        pill.style.borderColor = 'rgba(245, 158, 11, 0.5)';
        pill.style.color = '#fbbf24';
      } else if (status === 'local-only') {
        pill.innerText = '🔵 Local Channel';
        pill.style.borderColor = 'rgba(59, 130, 246, 0.5)';
        pill.style.color = '#60a5fa';
      } else {
        pill.innerText = '🔴 Reconnecting...';
        pill.style.borderColor = 'rgba(239, 68, 68, 0.5)';
        pill.style.color = '#f87171';
      }
    }

    renderOpenRoomsList(rooms) {
      const container = document.getElementById('openRoomsContainer');
      if (!container) return;

      if (!rooms || rooms.length === 0) {
        container.innerHTML = `
          <div class="lobby-empty-hint">
            <span>📡 Scanning network for open rooms...</span>
            <p>No active public rooms waiting. Host a room to start!</p>
          </div>
        `;
        return;
      }

      container.innerHTML = '';
      rooms.forEach((r) => {
        const card = document.createElement('div');
        card.className = 'open-room-card';
        card.innerHTML = `
          <div class="room-card-info">
            <div class="room-card-header-row">
              <span class="room-id-tag">${r.roomId}</span>
              <span class="room-status-badge">${r.status === 'PLAYING' ? 'In Race' : 'Waiting in Lobby'}</span>
            </div>
            <div class="room-card-host">
              Host: <strong>${r.hostName}</strong> • Players: <strong>${r.playerCount}/${r.maxPlayers}</strong>
            </div>
          </div>
          <button class="btn-join-room-action" ${r.playerCount >= r.maxPlayers ? 'disabled' : ''}>
            ${r.playerCount >= r.maxPlayers ? 'Full' : 'Join Room ➔'}
          </button>
        `;

        if (r.playerCount < r.maxPlayers) {
          card.querySelector('.btn-join-room-action').addEventListener('click', () => {
            const joinInput = document.getElementById('joinGameIdInput');
            if (joinInput) joinInput.value = r.roomId;
            const tabJoin = document.getElementById('tabJoinRoom');
            if (tabJoin) tabJoin.click();
            const joinBtn = document.getElementById('joinRoomSubmitBtn');
            if (joinBtn) joinBtn.click();
          });
        }

        container.appendChild(card);
      });
    }

    renderLobbyState(roomState) {
      if (!roomState) return;

      const gameIdDisplay = document.getElementById('lobbyGameIdDisplay');
      if (gameIdDisplay) gameIdDisplay.innerText = roomState.roomId;

      const countEl = document.getElementById('lobbyPlayerCountDisplay');
      if (countEl) countEl.innerText = roomState.players.length;

      const maxEl = document.getElementById('lobbyMaxPlayersDisplay');
      if (maxEl) maxEl.innerText = roomState.maxPlayers;

      const hostControls = document.getElementById('hostLobbyControls');
      if (hostControls) {
        hostControls.style.display = this.isHost ? 'flex' : 'none';
      }

      const startBtn = document.getElementById('lobbyStartGameBtn');
      if (startBtn) {
        if (this.isHost) {
          if (roomState.players.length >= 2) {
            startBtn.disabled = false;
            startBtn.innerText = '🏁 Start Online Game!';
          } else {
            startBtn.disabled = true;
            startBtn.innerText = '⏳ Waiting for at least 2 players...';
          }
        } else {
          startBtn.disabled = true;
          startBtn.innerText = '⏳ Waiting for Host to Start Game...';
        }
      }

      // Render player slots
      const slotsContainer = document.getElementById('lobbySlotsContainer');
      if (slotsContainer) {
        slotsContainer.innerHTML = '';
        for (let i = 0; i < roomState.maxPlayers; i++) {
          const slot = document.createElement('div');
          const p = roomState.players[i];
          if (p) {
            slot.className = 'lobby-player-slot';
            slot.innerHTML = `
              <div class="slot-dot" style="background-color: ${p.color}"></div>
              <div class="slot-info">
                <span class="slot-name">${p.name} ${window.K2GMultiplayer && p.clientId === window.K2GMultiplayer.clientId ? '(You)' : ''}</span>
                <span class="slot-badge ${p.isHost ? 'host-badge' : ''}">${p.isHost ? '👑 Host' : (p.isAi ? '🤖 Smart Bot' : '👤 Player')}</span>
              </div>
              ${this.isHost && window.K2GMultiplayer && p.clientId !== window.K2GMultiplayer.clientId ? `<button class="slot-remove-btn" title="Remove">✕</button>` : ''}
            `;
            if (this.isHost && window.K2GMultiplayer && p.clientId !== window.K2GMultiplayer.clientId) {
              const remBtn = slot.querySelector('.slot-remove-btn');
              if (remBtn) {
                remBtn.addEventListener('click', () => {
                  window.K2GMultiplayer.removePlayerFromRoom(p.clientId);
                });
              }
            }
          } else {
            slot.className = 'lobby-player-slot empty-slot';
            slot.innerHTML = `
              <div class="slot-dot" style="background-color: #64748b"></div>
              <div class="slot-info">
                <span class="slot-name" style="color: #64748b">Empty Slot #${i + 1}</span>
                <span class="slot-badge">Waiting for player...</span>
              </div>
            `;
          }
          slotsContainer.appendChild(slot);
        }
      }
    }

    appendLobbyChat(chat) {
      const box = document.getElementById('lobbyChatBox');
      if (!box) return;
      const row = document.createElement('div');
      row.className = 'chat-msg-row';
      row.innerHTML = `
        <span class="chat-sender" style="color: ${chat.senderColor || '#38bdf8'}">${chat.senderName}:</span>
        <span class="chat-text">${chat.text}</span>
      `;
      box.appendChild(row);
      box.scrollTop = box.scrollHeight;
    }

    launchOnlineGameFromHost() {
      if (!window.K2GMultiplayer) return;
      const roomState = window.K2GMultiplayer.roomState;
      if (!roomState || roomState.players.length < 2) return;

      const mapDiffSelect = document.getElementById('hostMapDifficultySelect');
      const mapDifficulty = mapDiffSelect ? mapDiffSelect.value : 'medium';
      const generatedMap = DynamicMapGenerator.generateMap(mapDifficulty);
      const configs = roomState.players.map((p, idx) => ({
        name: p.name,
        color: PLAYER_COLORS.find(c => c.hex.toLowerCase() === p.color.toLowerCase()) || PLAYER_COLORS[idx % PLAYER_COLORS.length],
        isAi: p.isAi,
        clientId: p.clientId
      }));

      const priorityIndex = Math.floor(Math.random() * configs.length);

      // Broadcast start to room
      window.K2GMultiplayer.sendGameAction('START_GAME', {
        players: configs,
        nodes: generatedMap.nodes,
        edges: generatedMap.edges,
        difficulty: generatedMap.difficulty,
        levelCount: generatedMap.levelCount,
        boardWidth: generatedMap.boardWidth,
        boardHeight: generatedMap.boardHeight,
        priorityIndex: priorityIndex
      });

      roomState.status = 'PLAYING';
      window.K2GMultiplayer.broadcastRoomSync();
      window.K2GMultiplayer.broadcastRoomHeartbeat();

      this.startOnlineGameSession(configs, generatedMap, priorityIndex);
    }

    startOnlineGameSession(configs, graphData, priorityIndex) {
      this.gameSessionId++;
      this.clearPendingTimeouts();
      this.isOnlineGame = true;
      this.gameInProgress = true;
      this.localClientId = window.K2GMultiplayer ? window.K2GMultiplayer.clientId : null;
      const myIdx = configs.findIndex(p => p.clientId === this.localClientId);
      this.localPlayerIndex = myIdx !== -1 ? myIdx : 0;

      this.toggleModal('onlineLobbyModal', false);
      this.showHomeScreen(false);

      this.engine.initGame(configs, graphData, priorityIndex, graphData?.difficulty || 'medium');
      this.renderer.fitBoardToView();
      this.updateHUD();

      this.runOpeningCardDraft(() => {
        this.updateHUD();
        this.startTurnCycle();
      });
    }

    handleRemoteGameAction(actionType, actionData) {
      if (!actionData) return;

      switch (actionType) {
        case 'START_GAME': {
          this.isHost = false;
          this.startOnlineGameSession(
            actionData.players,
            {
              nodes: actionData.nodes,
              edges: actionData.edges,
              difficulty: actionData.difficulty,
              levelCount: actionData.levelCount,
              boardWidth: actionData.boardWidth,
              boardHeight: actionData.boardHeight
            },
            actionData.priorityIndex
          );
          break;
        }

        case 'EXECUTE_MOVE': {
          if (actionData.move) {
            this.executeMove(actionData.move, false);
          }
          break;
        }

        case 'PLAY_CARD': {
          this.engine.playCardWithSelection(actionData.playerIndex, actionData.cardInstanceId, actionData.param);
          this.updateHUD();
          break;
        }

        case 'DRAFT_CARD': {
          const p = this.engine.players[actionData.playerIndex];
          if (p) {
            this.engine.keepCard(actionData.playerIndex, actionData.cardId, p.hand.concat(this.engine.deck), Boolean(actionData.isOpeningDraft));
            this.updateHUD();
          }
          if (this.remotePendingCardDrawDone) {
            const doneFn = this.remotePendingCardDrawDone;
            this.remotePendingCardDrawDone = null;
            doneFn();
          }
          break;
        }

        case 'NEXT_ROUND': {
          this.engine.startNextRound(actionData.priorityIndex, actionData.diceRoll);
          this.updateHUD();
          this.startTurnCycle();
          break;
        }
      }
    }

    initCallbacks() {
      this.renderer.onNodeClick = (node) => this.handleNodeClick(node);
      this.renderer.onNodeHover = (node) => this.handleNodeHover(node);
      this.engine.onLogCallback = (entry) => this.appendLog(entry);
      this.engine.onCardDrawPrompt = (pIdx, cards, isOpeningDraft, onDone) => this.showCardDraw(pIdx, cards, isOpeningDraft, onDone);
      this.engine.onCardPlayCallback = (player, card, param) => this.showCardRevealBanner(player, card, param);
      this.engine.onGameOverCallback = (standings) => this.showGameOver(standings);
    }

    bindDOM() {
      const select = document.getElementById('playerCountSelect');
      select.addEventListener('change', () => this.generateInputs());

      document.getElementById('startGameBtn').addEventListener('click', () => this.startNewGame());
      document.getElementById('newGameNavBtn').addEventListener('click', () => this.showSetupModal());
      document.getElementById('rulesNavBtn').addEventListener('click', () => this.toggleModal('rulesModal', true));
      document.getElementById('closeRulesBtn').addEventListener('click', () => this.toggleModal('rulesModal', false));

      // Vehicle Choice Cancel & Close Handlers
      const closeVehBtn = document.getElementById('closeVehicleChoiceBtn');
      if (closeVehBtn) {
        closeVehBtn.addEventListener('click', () => this.toggleModal('vehicleChoiceModal', false));
      }
      const cancelVehBtn = document.getElementById('cancelVehicleChoiceBtn');
      if (cancelVehBtn) {
        cancelVehBtn.addEventListener('click', () => this.toggleModal('vehicleChoiceModal', false));
      }
      const vehicleModal = document.getElementById('vehicleChoiceModal');
      if (vehicleModal) {
        vehicleModal.addEventListener('click', (e) => {
          if (e.target === vehicleModal) {
            this.toggleModal('vehicleChoiceModal', false);
          }
        });
      }

      const closeCardActionBtn = document.getElementById('closeCardActionBtn');
      if (closeCardActionBtn) {
        closeCardActionBtn.addEventListener('click', () => this.toggleModal('cardActionModal', false));
      }

      const closeRevealBtn = document.getElementById('closeRevealBtn');
      if (closeRevealBtn) {
        closeRevealBtn.addEventListener('click', () => {
          const banner = document.getElementById('cardRevealBanner');
          if (banner) banner.classList.remove('show');
        });
      }

      document.getElementById('soundToggleBtn').addEventListener('click', () => {
        const muted = audio.toggleMute();
        document.getElementById('soundToggleBtn').innerText = muted ? '🔇 Sound: Off' : '🔊 Sound: On';
      });

      document.getElementById('resetZoomBtn').addEventListener('click', () => this.renderer.fitBoardToView());
      const findBtn = document.getElementById('findActivePlayerBtn');
      if (findBtn) {
        findBtn.addEventListener('click', () => this.renderer.centerOnActivePlayer());
      }

      // Legend Toggle Button (Closed by default)
      const legendPanel = document.getElementById('mapLegendPanel');
      const legendToggleBtn = document.getElementById('toggleLegendBtn');
      if (legendToggleBtn && legendPanel) {
        legendToggleBtn.addEventListener('click', () => {
          legendPanel.classList.toggle('collapsed');
          // Close speed chart if opening legend
          if (!legendPanel.classList.contains('collapsed')) {
            const speedPanel = document.getElementById('speedChartPanel');
            if (speedPanel) speedPanel.classList.add('collapsed');
          }
        });
      }
      const closeLegendBtn = document.getElementById('closeLegendBtn');
      if (closeLegendBtn && legendPanel) {
        closeLegendBtn.addEventListener('click', () => {
          legendPanel.classList.add('collapsed');
        });
      }

      // Speed & Cost Chart Toggle Button
      const speedPanel = document.getElementById('speedChartPanel');
      const speedToggleBtn = document.getElementById('toggleSpeedChartBtn');
      if (speedToggleBtn && speedPanel) {
        speedToggleBtn.addEventListener('click', () => {
          speedPanel.classList.toggle('collapsed');
          // Close legend if opening speed chart
          if (!speedPanel.classList.contains('collapsed')) {
            if (legendPanel) legendPanel.classList.add('collapsed');
          }
        });
      }
      const closeSpeedBtn = document.getElementById('closeSpeedChartBtn');
      if (closeSpeedBtn && speedPanel) {
        closeSpeedBtn.addEventListener('click', () => {
          speedPanel.classList.add('collapsed');
        });
      }
    }

    showSetupModal() {
      this.generateInputs();
      this.toggleModal('setupModal', true);
    }

    generateInputs() {
      const container = document.getElementById('playerInputsContainer');
      const count = parseInt(document.getElementById('playerCountSelect').value, 10);
      container.innerHTML = '';
      for (let i = 0; i < count; i++) {
        const col = PLAYER_COLORS[i % PLAYER_COLORS.length];
        const div = document.createElement('div');
        div.className = 'player-config-row';
        div.innerHTML = `
          <div class="color-badge" style="background-color: ${col.hex}"></div>
          <input type="text" class="player-name-input" value="Player ${i + 1}" />
          <select class="player-type-select">
            <option value="human" ${i === 0 ? 'selected' : ''}>Human</option>
            <option value="ai" ${i > 0 ? 'selected' : ''}>AI Bot</option>
          </select>
        `;
        container.appendChild(div);
      }
    }

    startNewGame() {
      audio.ensureContext();
      this.gameSessionId++;
      this.clearPendingTimeouts();
      this.isOnlineGame = false;
      this.gameInProgress = true;
      this.showHomeScreen(false);

      const rows = document.querySelectorAll('.player-config-row');
      const configs = [];
      rows.forEach((row, idx) => {
        const name = row.querySelector('.player-name-input').value.trim() || `Player ${idx + 1}`;
        const isAi = row.querySelector('.player-type-select').value === 'ai';
        const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];
        configs.push({ name, color, isAi });
      });

      this.toggleModal('setupModal', false);
      
      // Ensure legend and speed chart panels are collapsed by default when starting a game
      const legendPanel = document.getElementById('mapLegendPanel');
      if (legendPanel) legendPanel.classList.add('collapsed');
      const speedPanel = document.getElementById('speedChartPanel');
      if (speedPanel) speedPanel.classList.add('collapsed');

      const mapDiffSelect = document.getElementById('mapDifficultySelect');
      const mapDifficulty = mapDiffSelect ? mapDiffSelect.value : 'medium';

      this.engine.initGame(configs, null, null, mapDifficulty);
      this.renderer.fitBoardToView();
      this.updateHUD();

      // Run Opening Ability Card Draft (Each user picks 1 of 2 random ability cards before traveling)
      this.runOpeningCardDraft(() => {
        this.updateHUD();
        this.startTurnCycle();
      });
    }

    runOpeningCardDraft(onComplete) {
      let pIdx = 0;
      this.isOpeningDraftActive = true;

      const draftForNextPlayer = () => {
        if (pIdx >= this.engine.players.length) {
          this.isOpeningDraftActive = false;
          this.stopTurnTimer();
          this.engine.log(`✨ Opening card draft complete! All players hold 1 starting ability card. Round 1 begins!`, 'system');
          this.updateHUD();
          if (onComplete) onComplete();
          return;
        }

        const currentIndex = pIdx;
        const player = this.engine.players[currentIndex];
        pIdx++;

        // Draw 2 random ability cards from the deck
        const cardsDrawn = this.engine.drawTwoCards();

        if (player.isAi) {
          const keptId = this.ai.chooseCardToKeep(currentIndex, cardsDrawn);
          this.engine.keepCard(currentIndex, keptId, cardsDrawn, true);
          draftForNextPlayer();
        } else {
          this.showCardDraw(currentIndex, cardsDrawn, true, () => {
            draftForNextPlayer();
          });
        }
      };

      this.engine.log(`🎴 OPENING ABILITY CARD DRAFT: Each player picks 1 card from 2 random draws!`, 'card');
      draftForNextPlayer();
    }

    startTurnCycle() {
      if (this.engine.phase === 'GAME_OVER' || this.isOpeningDraftActive || this.engine.awaitingCardSelection) {
        return;
      }

      const activeIdx = this.engine.activePlayerIndex;
      const active = this.engine.players[activeIdx];
      if (!active || active.hasFinished) return;

      if (active.isAi) {
        this.stopTurnTimer();
        this.checkAITurn();
      } else {
        // Human player's turn: everything pauses waiting for human input, with a 5-minute countdown timer
        this.startTurnTimer('MOVE', activeIdx, () => {
          this.executeRandomTimeoutTurn(activeIdx);
        });
      }
    }

    getRandomCardParam(playerIndex, card) {
      if (!card) return null;
      if (card.effectType === 'BLOCK_ROAD_COLOR') {
        const colors = ['red', 'green', 'blue'];
        return colors[Math.floor(Math.random() * colors.length)];
      }
      if (card.effectType === 'FREE_VEHICLE') {
        return Math.random() < 0.5 ? 'car' : 'bike';
      }
      if (card.effectType === 'STEAL_FROM_OPPONENT') {
        const validOpponents = this.engine.players
          .map((p, idx) => ({ p, idx }))
          .filter(({ p, idx }) => idx !== playerIndex && !p.hasFinished);
        if (validOpponents.length > 0) {
          return validOpponents[Math.floor(Math.random() * validOpponents.length)].idx;
        }
      }
      return null;
    }

    executeRandomTimeoutTurn(playerIndex) {
      if (this.engine.phase === 'GAME_OVER') return;
      if (this.engine.activePlayerIndex !== playerIndex) return;
      if (this.isOnlineGame && playerIndex !== this.localPlayerIndex && !this.isHost) return;

      const active = this.engine.players[playerIndex];
      if (!active || active.hasFinished) return;

      // Close any open choice modals for this turn
      this.toggleModal('vehicleChoiceModal', false);
      this.toggleModal('cardActionModal', false);

      // 1. If the player holds any mandatory "Play Right Away" / "Play At Once" cards, play them first
      let mandatoryCards = active.hand.filter((c) => c.type === 'Play Right Away' || c.type === 'Play At Once');
      while (mandatoryCards.length > 0) {
        const card = mandatoryCards[0];
        const randomParam = this.getRandomCardParam(playerIndex, card);
        this.engine.log(`⏰ 5:00 timer expired: Auto-playing mandatory card "${card.title}" for ${active.name}.`, 'alert');
        this.activateCard(card.instanceId, randomParam);
        mandatoryCards = active.hand.filter((c) => c.type === 'Play Right Away' || c.type === 'Play At Once');
      }

      // 2. Pick a random valid affordable travel move so the game continues
      const validMoves = this.engine.getValidMovesForPlayer(playerIndex);
      const affordableMoves = validMoves.filter((m) => m.canAfford);
      const candidates = affordableMoves.length > 0 ? affordableMoves : validMoves.filter((m) => m.cost === 0);

      if (candidates.length > 0) {
        const randomMove = candidates[Math.floor(Math.random() * candidates.length)];
        this.engine.log(
          `⏰ 5:00 turn timer expired for ${active.name}! Executing a random move (${randomMove.vehicleName} ➔ ${randomMove.targetNodeName}) so the game goes on.`,
          'alert'
        );
        this.executeMove(randomMove, false, null, true);
      } else {
        this.engine.log(`⏰ 5:00 turn timer expired for ${active.name} (no valid moves available). Advancing turn.`, 'alert');
        this.finishTurnAndAdvance(false);
      }
    }

    finishTurnAndAdvance(isAiMove = false, onDone = null) {
      if (this.engine.phase === 'GAME_OVER') {
        this.stopTurnTimer();
        return;
      }

      const sessionAtSchedule = this.gameSessionId;
      const advanceDelay = isAiMove ? 800 : 250;
      this.registerTimeout(() => {
        if (this.gameSessionId !== sessionAtSchedule || this.engine.phase === 'GAME_OVER') return;
        if (this.isOpeningDraftActive || this.engine.awaitingCardSelection) return;

        this.engine.advanceTurn();
        this.updateHUD();
        this.startTurnCycle();
        if (onDone) onDone();
      }, advanceDelay);
    }

    updateHUD() {
      const active = this.engine.players[this.engine.activePlayerIndex];
      if (!active) return;

      // Update Map Difficulty Badge in Turn Order Bar
      const mapDiffLabel = document.getElementById('mapDifficultyLabel');
      if (mapDiffLabel) {
        const diffMeta = MAP_DIFFICULTY_CONFIGS[this.engine.mapDifficulty] || MAP_DIFFICULTY_CONFIGS.medium;
        mapDiffLabel.innerText = `Map: ${diffMeta.name} (${this.engine.levelCount || 5} Lvls)`;
      }

      // 1. Update Round & Turn Order Sequence (e.g., Round 1: P1 ➔ P2 ➔ P3 with active indicator)
      document.getElementById('roundNumber').innerText = `Round ${this.engine.round}:`;
      const flowContainer = document.getElementById('turnOrderFlow');
      if (flowContainer) {
        flowContainer.innerHTML = '';
        const N = this.engine.players.length;
        for (let i = 0; i < N; i++) {
          const pIdx = (this.engine.priorityIndex + i) % N;
          const player = this.engine.players[pIdx];
          const isActive = pIdx === this.engine.activePlayerIndex;
          const isCompleted = i < this.engine.turnsTakenInRound && !isActive;

          const pill = document.createElement('div');
          let stateClass = isActive ? 'active' : (isCompleted ? 'completed' : (player.hasFinished ? 'finished' : 'upcoming'));
          pill.className = `turn-pill ${stateClass}`;

          let shortName = player.name;
          if (shortName.length > 9) shortName = shortName.slice(0, 8) + '…';

          let statusIcon = '';
          if (player.hasFinished) statusIcon = '🏁 ';
          else if (isActive) statusIcon = '▶ ';
          else if (isCompleted) statusIcon = '✓ ';
          else if (i === 0) statusIcon = '⭐ ';

          pill.innerHTML = `
            <span class="turn-pill-dot" style="background-color: ${player.color.hex}"></span>
            <span>${statusIcon}${shortName}${player.isAi ? ' 🤖' : ''}</span>
          `;
          pill.title = `${player.name} (${player.score} pts) - ${isActive ? 'Current Player' : (isCompleted ? 'Turn Completed' : 'Upcoming')}`;
          flowContainer.appendChild(pill);

          if (i < N - 1) {
            const arrow = document.createElement('span');
            arrow.className = 'turn-arrow';
            arrow.innerText = '➔';
            flowContainer.appendChild(arrow);
          }
        }
      }

      const badge = document.getElementById('phaseBadge');

      if (this.engine.phase === 'GAME_OVER') {
        badge.innerText = '🏁 GAME OVER';
        badge.className = 'phase-tag game-over-phase';
      } else if (this.isOpeningDraftActive) {
        badge.innerText = '🎁 OPENING CARD DRAFT (PAUSED FOR CHOICE)';
        badge.className = 'phase-tag ability-phase';
      } else if (this.engine.awaitingCardSelection) {
        badge.innerText = `🎴 ${active.name} Choosing Ability Card... (Paused)`;
        badge.className = 'phase-tag ability-phase';
      } else {
        let buffTags = [];
        if (active.doublePointsBonus) buffTags.push('⚡ 2x Nitro');
        if (active.lightTrafficBonus) buffTags.push('🟢 Light Traffic');
        if (active.freeNextRideBonus) buffTags.push('🆓 Free Ride');
        const buffStr = buffTags.length > 0 ? ` [${buffTags.join(', ')}]` : '';

        const isMyTurn = !this.isOnlineGame || (this.engine.activePlayerIndex === this.localPlayerIndex);
        if (this.isOnlineGame) {
          badge.innerText = isMyTurn ? `🚗 YOUR TURN!${buffStr}` : `⏳ ${active.name}'s Turn...`;
          badge.className = isMyTurn ? 'phase-tag travel-phase' : 'phase-tag ability-phase';
        } else {
          badge.innerText = `🚗 ${active.name}'s Turn${buffStr}`;
          badge.className = 'phase-tag travel-phase';
        }
      }

      document.getElementById('activePlayerName').innerText = active.name + (active.isAi ? ' 🤖' : '');
      document.getElementById('activePlayerColorDot').style.backgroundColor = active.color.hex;
      document.getElementById('activePlayerScore').innerText = `${active.score} pts`;
      document.getElementById('activePlayerMoney').innerText = `${active.money} units (🪙 ${Math.floor(active.money / 3)})`;
      document.getElementById('priorityHolderName').innerText = this.engine.players[this.engine.priorityIndex].name;

      // Location & Current Vehicle Mode
      const locEl = document.getElementById('activePlayerLocation');
      if (locEl) {
        const currNode = this.engine.nodesMap.get(active.currentNodeId);
        locEl.innerText = currNode ? currNode.name : active.currentNodeId;
      }
      const vTag = document.getElementById('activePlayerVehicleTag');
      if (vTag) {
        const vInfo = SPEED_CHART[active.currentVehicle] || SPEED_CHART.run;
        vTag.innerHTML = `<span>Mode: ${vInfo.icon} ${vInfo.name}</span>`;
      }

      // Held Vehicle Badges
      const tokensEl = document.getElementById('activeVehicleTokens');
      tokensEl.innerHTML = '';
      if (active.vehicleTokens.size === 0) {
        tokensEl.innerHTML = '<span class="empty-hint">None</span>';
      } else {
        active.vehicleTokens.forEach((t) => {
          const s = document.createElement('span');
          s.className = 'vehicle-badge';
          s.innerText = t === 'bike' ? '🏍️ Bike' : '🚗 Car';
          tokensEl.appendChild(s);
        });
      }

      // HELD ABILITY CARDS WITH PLAY BUTTONS (Private Hand System)
      const cardsCountEl = document.getElementById('handCardsCount');
      if (cardsCountEl) cardsCountEl.innerText = active.hand.length;

      const mandatoryCards = active.hand.filter((c) => c.type === 'Play Right Away' || c.type === 'Play At Once');
      const hasMandatory = mandatoryCards.length > 0;

      const handHeaderEl = document.querySelector('.hand-header');
      if (handHeaderEl) {
        if (active.isAi) {
          handHeaderEl.innerHTML = `<span>🎴 Ability Cards (<strong id="handCardsCount">${active.hand.length}</strong>):</span> <span class="privacy-pill">🔒 Private Hand</span>`;
        } else if (hasMandatory) {
          handHeaderEl.innerHTML = `<span>🎴 Your Ability Cards (<strong id="handCardsCount">${active.hand.length}</strong>):</span> <span class="mandatory-pill pulse-glow">⚠️ Play Right Away Required</span>`;
        } else {
          handHeaderEl.innerHTML = `<span>🎴 Your Ability Cards (<strong id="handCardsCount">${active.hand.length}</strong>):</span> <span class="privacy-pill">🔒 Private to you</span>`;
        }
      }

      const handListEl = document.getElementById('activePlayerCardsList');
      if (handListEl) {
        handListEl.innerHTML = '';
        if (active.hand.length === 0) {
          handListEl.innerHTML = '<span class="empty-hint">No ability cards held</span>';
        } else if (active.isAi) {
          // AI cards are kept private from opponents - only show card count placeholders
          for (let k = 0; k < active.hand.length; k++) {
            const chip = document.createElement('div');
            chip.className = 'secret-card-chip';
            chip.innerHTML = `<span>🎴 Secret Ability Card #${k + 1}</span><span style="margin-left:auto; font-size:10px; color:#64748b;">Hidden until played</span>`;
            handListEl.appendChild(chip);
          }
        } else {
          if (hasMandatory) {
            const notice = document.createElement('div');
            notice.className = 'mandatory-card-alert';
            notice.innerHTML = `⚡ <strong>Mandatory Immediate Action:</strong> You hold an immediate <em>"Play Right Away"</em> card. You must play it now before traveling!`;
            handListEl.appendChild(notice);
          }

          active.hand.forEach((card) => {
            const isMandatory = card.type === 'Play Right Away' || card.type === 'Play At Once';
            const chip = document.createElement('div');
            chip.className = `hand-card-chip category-${card.category} ${isMandatory ? 'mandatory-card-chip' : ''}`;
            chip.innerHTML = `
              <div class="hand-card-top">
                <span class="hand-card-title">${card.title}</span>
                <span class="hand-card-type ${isMandatory ? 'mandatory-tag' : ''}">${isMandatory ? '⚡ PLAY RIGHT AWAY' : card.type}</span>
              </div>
              <div class="hand-card-desc">${card.description}</div>
              <button class="play-card-btn ${isMandatory ? 'btn-mandatory' : ''}">${isMandatory ? '⚡ Play Now (Required)' : '⚡ Play Card'}</button>
            `;
            const playBtn = chip.querySelector('.play-card-btn');
            if (playBtn) {
              playBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.isOpeningDraftActive || this.engine.awaitingCardSelection) return;
                this.promptCardPlayOptions(card);
              });
            }
            handListEl.appendChild(chip);
          });
        }
      }

      // Traffic Rows (Matrix with column headers, clean color swatches)
      document.getElementById('trafficDiceDisplay').innerText = this.engine.diceRoll ? `🎲 Roll ${this.engine.diceRoll}` : '⚪ Round 1 (All Med)';
      const tRows = document.getElementById('trafficCardRows');
      tRows.innerHTML = '';
      TRAFFIC_STATUS_ROWS.forEach((r) => {
        const isCur = this.engine.diceRoll === r.roll;
        const div = document.createElement('div');
        div.className = `traffic-row ${isCur ? 'active-traffic-row' : ''}`;
        div.innerHTML = `
          <span class="row-num">${r.roll}</span>
          <div class="traffic-box swatch-${r.heavy}" title="Heavy: ${r.heavy.toUpperCase()}"></div>
          <div class="traffic-box swatch-${r.medium}" title="Medium: ${r.medium.toUpperCase()}"></div>
          <div class="traffic-box swatch-${r.light}" title="Light: ${r.light.toUpperCase()}"></div>
        `;
        tRows.appendChild(div);
      });

      // All Players Mini Status List (With visible card counts and Click-to-Locate)
      const pList = document.getElementById('allPlayersList');
      pList.innerHTML = '';
      this.engine.players.forEach((p, idx) => {
        const isCur = idx === this.engine.activePlayerIndex;
        const currNode = this.engine.nodesMap.get(p.currentNodeId);
        const cardCount = p.hand.length;
        const cardBadgeClass = cardCount > 0 ? 'cards-count-badge' : 'cards-count-badge zero';

        const item = document.createElement('div');
        item.className = `player-mini-card ${isCur ? 'current' : ''}`;
        item.style.borderLeftColor = p.color.hex;
        item.style.cursor = 'pointer';
        item.title = `Click to zoom into ${p.name}'s location`;
        item.innerHTML = `
          <div class="player-mini-header">
            <strong style="color:${p.color.hex}">${p.name} ${p.isAi ? '🤖' : ''}</strong>
            <div style="display: flex; gap: 4px; align-items: center;">
              ${idx === this.engine.priorityIndex ? '<span>⭐</span>' : ''}
              <button class="control-btn" style="padding: 2px 6px; font-size: 10px;">🎯 Locate</button>
            </div>
          </div>
          <div class="player-mini-stats">
            <span>🏆 ${p.score} pts</span>
            <span>💰 ${p.money}</span>
            <span class="${cardBadgeClass}">🎴 ${cardCount} card${cardCount === 1 ? '' : 's'}</span>
            <span>📍 ${currNode?.name.split('(')[0] || p.currentNodeId}</span>
          </div>
        `;
        item.addEventListener('click', () => {
          this.renderer.centerOnNode(p.currentNodeId, idx);
        });
        pList.appendChild(item);
      });

      if (
        this.engine.phase !== 'GAME_OVER' &&
        !active.isAi &&
        !this.isOpeningDraftActive &&
        !this.engine.awaitingCardSelection
      ) {
        this.renderer.highlightedMoves = this.engine.getValidMovesForPlayer(this.engine.activePlayerIndex);
      } else {
        this.renderer.highlightedMoves = [];
      }
      this.renderer.render();
    }

    // SHOW CARD REVEAL FLOATING BANNER WHEN A CARD IS ACTIVATED
    showCardRevealBanner(player, card, selectionParam = null) {
      const banner = document.getElementById('cardRevealBanner');
      const pTag = document.getElementById('revealPlayerName');
      const titleTag = document.getElementById('revealCardTitle');
      const descTag = document.getElementById('revealCardDesc');
      if (!banner || !pTag || !titleTag || !descTag) return;

      pTag.innerText = player.name + (player.isAi ? ' 🤖' : '');
      pTag.style.color = player.color.hex;
      titleTag.innerText = `"${card.title}" (${card.type})`;
      descTag.innerText = card.description;

      banner.className = `card-reveal-banner show category-${card.category || 'advantage'}`;

      if (this.revealBannerTimeout) clearTimeout(this.revealBannerTimeout);
      this.revealBannerTimeout = setTimeout(() => {
        banner.classList.remove('show');
      }, 4500);
    }

    activateCard(cardInstanceId, param = null) {
      if (this.isOnlineGame && window.K2GMultiplayer) {
        window.K2GMultiplayer.sendGameAction('PLAY_CARD', {
          playerIndex: this.engine.activePlayerIndex,
          cardInstanceId: cardInstanceId,
          param: param
        });
      }
      this.engine.playCardWithSelection(this.engine.activePlayerIndex, cardInstanceId, param);
      this.updateHUD();
    }

    // PROMPT CARD ACTION SELECTION MODAL
    promptCardPlayOptions(card) {
      const active = this.engine.players[this.engine.activePlayerIndex];
      const titleEl = document.getElementById('cardActionModalTitle');
      const descEl = document.getElementById('cardActionModalDesc');
      const container = document.getElementById('cardActionOptionsContainer');

      titleEl.innerText = `🎴 Play: ${card.title}`;
      descEl.innerText = card.description;
      container.innerHTML = '';

      switch (card.effectType) {
        case 'BLOCK_ROAD_COLOR': {
          const colors = [
            { id: 'red', label: '🔴 Block Red Roads', desc: 'All opponents cannot travel on Red roads.' },
            { id: 'green', label: '🟢 Block Green Roads', desc: 'All opponents cannot travel on Green roads.' },
            { id: 'blue', label: '🔵 Block Blue Roads', desc: 'All opponents cannot travel on Blue roads.' }
          ];
          colors.forEach((col) => {
            const btn = document.createElement('button');
            btn.className = 'vehicle-option-card';
            btn.innerHTML = `
              <div style="font-size: 24px;">🛑</div>
              <div class="vehicle-info">
                <h4>${col.label}</h4>
                <p>${col.desc}</p>
              </div>
            `;
            btn.addEventListener('click', () => {
              this.toggleModal('cardActionModal', false);
              this.activateCard(card.instanceId, col.id);
            });
            container.appendChild(btn);
          });
          break;
        }

        case 'FREE_VEHICLE': {
          const options = [
            { id: 'car', icon: '🚗', title: 'Claim Free Car Permit', desc: 'Keep Car token permanently in hand.' },
            { id: 'bike', icon: '🏍️', title: 'Claim Free Bike Permit', desc: 'Keep Bike token permanently in hand.' }
          ];
          options.forEach((opt) => {
            const btn = document.createElement('button');
            btn.className = 'vehicle-option-card';
            btn.innerHTML = `
              <div style="font-size: 28px;">${opt.icon}</div>
              <div class="vehicle-info">
                <h4>${opt.title}</h4>
                <p>${opt.desc}</p>
              </div>
            `;
            btn.addEventListener('click', () => {
              this.toggleModal('cardActionModal', false);
              this.activateCard(card.instanceId, opt.id);
            });
            container.appendChild(btn);
          });
          break;
        }

        case 'STEAL_FROM_OPPONENT': {
          const opponents = this.engine.players.filter((p, idx) => idx !== this.engine.activePlayerIndex && !p.hasFinished);
          if (opponents.length === 0) {
            container.innerHTML = '<p class="empty-hint">No valid opponents to target.</p>';
          } else {
            opponents.forEach((opp) => {
              const oppIdx = this.engine.players.indexOf(opp);
              const btn = document.createElement('button');
              btn.className = 'vehicle-option-card';
              btn.innerHTML = `
                <div class="color-badge" style="background-color: ${opp.color.hex}; width: 28px; height: 28px;"></div>
                <div class="vehicle-info">
                  <h4>Target: ${opp.name}</h4>
                  <p>Current Money: ${opp.money} units • Score: ${opp.score} pts</p>
                </div>
              `;
              btn.addEventListener('click', () => {
                this.toggleModal('cardActionModal', false);
                this.activateCard(card.instanceId, oppIdx);
              });
              container.appendChild(btn);
            });
          }
          break;
        }

        default: {
          // Direct execution confirmation
          const btn = document.createElement('button');
          btn.className = 'btn-primary';
          btn.style.padding = '14px';
          btn.style.borderRadius = '10px';
          btn.style.cursor = 'pointer';
          btn.style.fontSize = '14px';
          btn.innerText = `CONFIRM & ACTIVATE: ${card.title.toUpperCase()} ⚡`;
          btn.addEventListener('click', () => {
            this.toggleModal('cardActionModal', false);
            this.activateCard(card.instanceId);
          });
          container.appendChild(btn);
          break;
        }
      }

      this.toggleModal('cardActionModal', true);
    }

    handleNodeClick(node) {
      if (this.engine.phase === 'GAME_OVER' || this.isOpeningDraftActive || this.engine.awaitingCardSelection) return;
      const active = this.engine.players[this.engine.activePlayerIndex];
      if (!active || active.isAi) return;

      if (this.isOnlineGame && this.engine.activePlayerIndex !== this.localPlayerIndex) {
        this.appendLog({
          timestamp: new Date().toLocaleTimeString(),
          text: `⏳ Please wait: It is ${active.name}'s turn to move!`,
          type: 'alert'
        });
        return;
      }

      // Check if player holds mandatory "Play Right Away" / "Play At Once" cards
      const mandatoryCards = active.hand.filter((c) => c.type === 'Play Right Away' || c.type === 'Play At Once');
      if (mandatoryCards.length > 0) {
        this.appendLog({
          timestamp: new Date().toLocaleTimeString(),
          text: `⚠️ MANDATORY ACTION! ${active.name} holds "${mandatoryCards[0].title}" (Play Right Away) and MUST play it before traveling!`,
          type: 'alert'
        });
        audio.playTone(200, 0.25, 'sawtooth', 0.25);
        this.promptCardPlayOptions(mandatoryCards[0]);
        return;
      }

      const moves = this.renderer.highlightedMoves.filter((m) => m.targetNodeId === node.id);
      if (moves.length === 0) return;

      // Always present the Vehicle Choice Selection Modal explicitly
      this.showVehicleSelectionModal(node, moves, active);
    }

    showVehicleSelectionModal(targetNode, moves, activePlayer) {
      const c = document.getElementById('vehicleOptionsContainer');
      c.innerHTML = '';
      document.getElementById('vehicleChoiceNodeName').innerText = `${targetNode.name} (${targetNode.area})`;

      moves.forEach((m) => {
        const div = document.createElement('div');
        const canAfford = m.canAfford;
        let sourceClass = m.source === 'retained' ? 'retained-vehicle' : (m.vehicleId === 'run' ? 'walk-vehicle' : 'station-vehicle');
        let sourceLabel = m.source === 'retained' ? '🔄 Retained Vehicle' : (m.vehicleId === 'run' ? '🚶 Free Travel' : '🚉 Station Vehicle');

        div.className = `vehicle-option-card ${sourceClass} ${canAfford ? '' : 'unaffordable-disabled'}`;
        div.innerHTML = `
          <div class="vehicle-icon">${m.vehicleIcon}</div>
          <div class="vehicle-info">
            <div class="vehicle-title-row">
              <h4>${m.vehicleName}</h4>
              <span class="vehicle-source-tag">${sourceLabel}</span>
            </div>
            <div class="vehicle-details-grid">
              <span class="vehicle-speed-line">⚡ Speed: <strong>+${m.pointsEarned} pts</strong> (${m.traffic})</span>
              <span class="vehicle-cost-line">💰 Cost: <strong>${m.cost} currency</strong></span>
            </div>
            ${!canAfford ? `<span class="unaffordable-tag">❌ Insufficient currency (Requires ${m.cost}, you have ${activePlayer.money})</span>` : ''}
          </div>
        `;

        if (canAfford) {
          div.addEventListener('click', () => {
            this.toggleModal('vehicleChoiceModal', false);
            this.executeMove(m);
          });
        }
        c.appendChild(div);
      });

      this.toggleModal('vehicleChoiceModal', true);
    }

    executeMove(move, isAiMove = false, onDone = null, isTimeoutAutoMove = false) {
      const playerIndex = this.engine.activePlayerIndex;
      const activePlayer = this.engine.players[playerIndex];

      // Stop the move countdown timer now that a move is being executed
      this.stopTurnTimer();

      if (this.isOnlineGame && !isAiMove && playerIndex === this.localPlayerIndex) {
        if (window.K2GMultiplayer) {
          window.K2GMultiplayer.sendGameAction('EXECUTE_MOVE', {
            playerIndex: playerIndex,
            move: move
          });
        }
      }

      audio.playMove(move.vehicleId);
      const success = this.engine.executePlayerMove(playerIndex, move);
      if (!success) {
        // Restore timer if human move failed validation
        if (activePlayer && !activePlayer.isAi && this.engine.phase !== 'GAME_OVER') {
          this.startTurnTimer('MOVE', playerIndex, () => {
            this.executeRandomTimeoutTurn(playerIndex);
          });
        }
        return;
      }

      this.updateHUD();
      if (this.engine.phase === 'GAME_OVER') {
        this.stopTurnTimer();
        if (onDone) onDone();
        return;
      }

      const targetNode = this.engine.nodesMap.get(move.targetNodeId);

      // If the player landed on an unvisited Ability Card ('A') node, PAUSE all subsequent turns until they pick their card!
      const alreadyClaimedCardHere = activePlayer.visitedCardNodes && activePlayer.visitedCardNodes.has(move.targetNodeId);
      if (targetNode && targetNode.hasCard && !targetNode.isStop && !alreadyClaimedCardHere) {
        if (activePlayer.visitedCardNodes) {
          activePlayer.visitedCardNodes.add(move.targetNodeId);
        }
        audio.playCardDraw();
        this.engine.awaitingCardSelection = true;
        this.updateHUD();

        if (isTimeoutAutoMove) {
          // Player already timed out on their move; auto-pick 1 of 2 drawn cards so the game continues immediately
          const cardsDrawn = this.engine.drawTwoCards();
          if (cardsDrawn.length > 0) {
            const randomCard = cardsDrawn[Math.floor(Math.random() * cardsDrawn.length)];
            this.engine.log(`⏰ Auto-selected 1 random Ability Card for ${activePlayer.name}.`, 'alert');
            this.engine.keepCard(playerIndex, randomCard.instanceId, cardsDrawn, false);
            if (this.isOnlineGame && window.K2GMultiplayer) {
              window.K2GMultiplayer.sendGameAction('DRAFT_CARD', {
                playerIndex: playerIndex,
                cardId: randomCard.instanceId,
                isOpeningDraft: false
              });
            }
          }
          this.engine.awaitingCardSelection = false;
          this.updateHUD();
          this.finishTurnAndAdvance(isAiMove, onDone);
          return;
        }

        if (this.isOnlineGame && activePlayer && !activePlayer.isAi && playerIndex !== this.localPlayerIndex) {
          // Remote human player is choosing an Ability Card; pause until DRAFT_CARD arrives
          this.engine.log(`⏳ Waiting for ${activePlayer.name} to choose an Ability Card...`, 'card');
          this.remotePendingCardDrawDone = () => {
            this.engine.awaitingCardSelection = false;
            this.updateHUD();
            this.finishTurnAndAdvance(false, onDone);
          };
          return;
        }

        this.engine.triggerCardDraw(playerIndex, () => {
          this.engine.awaitingCardSelection = false;
          this.updateHUD();
          this.finishTurnAndAdvance(isAiMove, onDone);
        });
        return;
      }

      // Standard node arrival: advance turn
      this.finishTurnAndAdvance(isAiMove, onDone);
    }

    showCardDraw(playerIndex, cards, isOpeningDraft = false, onDone = null) {
      const p = this.engine.players[playerIndex];
      this.engine.awaitingCardSelection = true;

      if (p.isAi) {
        const keptId = this.ai.chooseCardToKeep(playerIndex, cards);
        this.engine.keepCard(playerIndex, keptId, cards, isOpeningDraft);
        this.engine.awaitingCardSelection = false;
        this.updateHUD();
        if (onDone) onDone();
        return;
      }

      const titleEl = document.getElementById('cardDrawModalTitle');
      const descEl = document.getElementById('cardDrawModalDesc');
      const nameEl = document.getElementById('cardDrawPlayerName');

      if (nameEl) nameEl.innerText = p.name;
      if (titleEl) {
        titleEl.innerText = isOpeningDraft ? '🎁 Opening Ability Card Draft (Pick 1 of 2)' : '🔒 Secret Ability Card Draw';
      }
      if (descEl) {
        descEl.innerHTML = isOpeningDraft
          ? `<strong style="color: ${p.color.hex}; font-size: 14px;">${p.name}</strong>, choose <strong>1 starting Ability Card</strong> to keep in your secret hand before Round 1 begins:`
          : `<strong style="color: ${p.color.hex}; font-size: 14px;">${p.name}</strong> landed on an Ability Card node. Pick one card to <strong>KEEP secretly in your hand</strong>; the other will be discarded:`;
      }

      const c = document.getElementById('drawCardsContainer');
      c.innerHTML = '';

      let resolved = false;
      const completeCardChoice = (chosenCard, wasTimeout = false) => {
        if (resolved) return;
        resolved = true;
        this.stopTurnTimer();
        this.engine.awaitingCardSelection = false;

        if (wasTimeout) {
          this.engine.log(
            `⏰ 5:00 timer expired! Randomly selected 1 Ability Card for ${p.name} so the game goes on.`,
            'alert'
          );
        }

        this.engine.keepCard(playerIndex, chosenCard.instanceId, cards, isOpeningDraft);
        if (this.isOnlineGame && window.K2GMultiplayer) {
          window.K2GMultiplayer.sendGameAction('DRAFT_CARD', {
            playerIndex: playerIndex,
            cardId: chosenCard.instanceId,
            isOpeningDraft: isOpeningDraft
          });
        }
        this.toggleModal('cardDrawModal', false);
        this.updateHUD();
        if (onDone) {
          onDone();
        }
      };

      cards.forEach((card) => {
        const div = document.createElement('div');
        div.className = `ability-card-view category-${card.category}`;
        div.innerHTML = `
          <div class="card-header">${card.category.toUpperCase()}</div>
          <div class="card-title">${card.title}</div>
          <span class="card-type">${card.type}</span>
          <p class="card-desc">${card.description}</p>
          <button class="keep-card-btn">KEEP THIS CARD 🎴</button>
        `;
        div.querySelector('.keep-card-btn').addEventListener('click', () => {
          completeCardChoice(card, false);
        });
        c.appendChild(div);
      });

      this.toggleModal('cardDrawModal', true);
      this.updateHUD();

      // Start 5-minute countdown timer for human player's card choice
      this.startTurnTimer('CARD_DRAW', playerIndex, () => {
        const randomCard = cards[Math.floor(Math.random() * cards.length)] || cards[0];
        if (randomCard) {
          completeCardChoice(randomCard, true);
        }
      });
    }

    showGameOver(standings) {
      this.stopTurnTimer();
      const tbody = document.getElementById('leaderboardBody');
      tbody.innerHTML = '';
      standings.forEach((p, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>#${idx + 1}</strong></td>
          <td style="color: ${p.color.hex}; font-weight: 700;">${p.name} ${p.isAi ? '🤖' : ''}</td>
          <td><strong style="color: #fbbf24; font-size: 15px;">${p.score} pts</strong></td>
          <td>${p.fastestBonus ? `+${p.fastestBonus} pts` : '-'}</td>
          <td>+${p.moneyBonus} pts</td>
          <td>${p.distancePenalty > 0 ? `-${p.distancePenalty} pts` : '0 (Reached STOP)'}</td>
        `;
        tbody.appendChild(tr);
      });
      this.toggleModal('gameOverModal', true);
    }

    checkAITurn() {
      if (this.engine.phase === 'GAME_OVER' || this.isOpeningDraftActive || this.engine.awaitingCardSelection) return;
      if (this.isOnlineGame && !this.isHost) return;
      const activeIdx = this.engine.activePlayerIndex;
      const active = this.engine.players[activeIdx];
      if (!active || !active.isAi || active.hasFinished) return;

      const sessionAtStart = this.gameSessionId;

      // 1. Bot Turn Start: Center camera on active bot & show thinking state
      const badge = document.getElementById('phaseBadge');
      if (badge) {
        badge.innerText = `🤖 ${active.name} is planning turn...`;
        badge.className = 'phase-tag ability-phase';
      }
      this.renderer.centerOnNode(active.currentNodeId, activeIdx);
      this.renderer.highlightedMoves = this.engine.getValidMovesForPlayer(activeIdx);
      this.renderer.render();

      // Delay 1: Bot "thinks" and evaluates card play (950ms)
      this.registerTimeout(() => {
        if (
          this.gameSessionId !== sessionAtStart ||
          this.engine.phase === 'GAME_OVER' ||
          this.isOpeningDraftActive ||
          this.engine.awaitingCardSelection ||
          this.engine.activePlayerIndex !== activeIdx
        ) {
          return;
        }

        // Check if bot wants to play an ability card
        const playedCard = this.ai.chooseAbilityAction(activeIdx);
        this.updateHUD();

        // If a card was played, give the human time to see the reveal banner and log (1300ms)
        const postCardDelay = playedCard ? 1300 : 400;

        this.registerTimeout(() => {
          if (
            this.gameSessionId !== sessionAtStart ||
            this.engine.phase === 'GAME_OVER' ||
            this.isOpeningDraftActive ||
            this.engine.awaitingCardSelection ||
            this.engine.activePlayerIndex !== activeIdx
          ) {
            return;
          }

          // 2. Bot selects travel move
          const move = this.ai.chooseTravelMove(activeIdx);
          if (move) {
            // Highlight target destination node and update status
            if (badge) {
              badge.innerText = `🚗 ${active.name} travelling to ${move.targetNode.name}...`;
              badge.className = 'phase-tag travel-phase';
            }
            this.renderer.highlightedMoves = [move];
            this.renderer.render();

            // Delay 2: Pause to let human player see destination highlight (800ms)
            this.registerTimeout(() => {
              if (
                this.gameSessionId !== sessionAtStart ||
                this.engine.phase === 'GAME_OVER' ||
                this.isOpeningDraftActive ||
                this.engine.awaitingCardSelection ||
                this.engine.activePlayerIndex !== activeIdx
              ) {
                return;
              }
              this.executeMove(move, true);
            }, 800);
          } else {
            // No valid move, advance turn
            this.finishTurnAndAdvance(true);
          }
        }, postCardDelay);
      }, 950);
    }

    handleNodeHover(node) {
      const box = document.getElementById('nodeTooltip');
      const levelPill = document.getElementById('nodeInfoLevelPill');
      const bodyEl = document.getElementById('nodeInfoBody');
      if (!box || !bodyEl) return;

      if (!node) {
        box.classList.remove('active-hover');
        if (levelPill) levelPill.innerText = 'Hover over a node';
        bodyEl.innerHTML = `<div class="node-info-placeholder">Move your cursor over any map node to inspect its stations, level, and facilities here.</div>`;
        return;
      }

      box.classList.add('active-hover');
      if (levelPill) {
        if (node.isStart) levelPill.innerText = 'START (Lvl 0)';
        else if (node.isStop) levelPill.innerText = `STOP (Lvl ${node.level ?? '-'})`;
        else levelPill.innerText = `Level ${node.level ?? '-'} • ${node.id}`;
      }

      const vehicleIcons = [];
      if (node.hasBike) vehicleIcons.push('🏍️ Bike');
      if (node.hasCar) vehicleIcons.push('🚗 Car');
      if (node.hasBus) vehicleIcons.push('🚌 Bus');
      if (node.hasTrain) vehicleIcons.push('🚂 Train');
      if (node.hasHospital) vehicleIcons.push('✚ Hospital');
      if (node.hasCard) vehicleIcons.push('🎴 Ability Card');

      const playersHere = this.engine.players.filter((p) => p.currentNodeId === node.id);
      const playersLine = playersHere.length > 0
        ? `<div style="margin-top: 5px; font-size: 11px; color: #38bdf8;"><strong>Players Here:</strong> ${playersHere.map((p) => `<span style="color:${p.color.hex}; font-weight:700;">${p.name}</span>`).join(', ')}</div>`
        : '';

      bodyEl.innerHTML = `
        <div style="font-weight: 800; color: #fbbf24; font-size: 13px; margin-bottom: 2px;">${node.name}</div>
        <div style="color: #94a3b8; font-size: 11px;">Area: <strong style="color: #e2e8f0;">${node.area}</strong> (Depth Level ${node.level ?? '-'})</div>
        <div style="margin-top: 5px; font-size: 11px; color: #34d399; line-height: 1.4;">
          <strong>Stations:</strong> ${vehicleIcons.length > 0 ? vehicleIcons.join(' • ') : '🏃 Walk Only'}
        </div>
        ${playersLine}
      `;
    }

    appendLog(entry) {
      const box = document.getElementById('gameLogBox');
      const div = document.createElement('div');
      div.className = `log-entry log-${entry.type}`;
      div.innerText = `[${entry.timestamp}] ${entry.text}`;
      box.prepend(div);
    }

    toggleModal(modalId, show) {
      const el = document.getElementById(modalId);
      if (el) el.className = `modal-backdrop ${show ? 'active' : ''}`;
    }
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================
  window.addEventListener('DOMContentLoaded', () => {
    window.gameApp = new AppController();
  });

})();
