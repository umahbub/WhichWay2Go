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
    run: { id: 'run', name: 'Walk / Run', icon: '🏃', cost: 0, heavy: 3, medium: 3, light: 3, description: 'Free to use. Consistent 3 mph speed.' },
    bike: { id: 'bike', name: 'Motorcycle / Bike', icon: '🏍️', cost: 3, heavy: 3, medium: 6, light: 9, description: 'Nimble and affordable. Moderate in traffic.' },
    car: { id: 'car', name: 'Car / Taxi', icon: '🚗', cost: 6, heavy: 9, medium: 12, light: 18, description: 'Fastest on light roads, expensive and traffic-prone.' },
    bus: { id: 'bus', name: 'Public Bus', icon: '🚌', cost: 3, heavy: 6, medium: 9, light: 12, description: 'Requires bus station. Fixed affordable transit.' },
    train: { id: 'train', name: 'Train / Railway', icon: '🚂', cost: 9, heavy: 15, medium: 15, light: 15, description: 'Fixed 15 mph, completely bypasses road traffic! Only boards/exits at stations.' }
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

  // ORGANIC STAGGERED GRAPH DEFINITION (Varied Coordinates & Distances)
  const BOARD_NODES = [
    // Level 0: START Departure Hub
    { id: 'START', name: 'START: Gulshan North Hub', area: 'Gulshan', level: 0, x: 0.500, y: 0.070, isStart: true, isStop: false, hasCar: true, hasBike: true, hasBus: true, hasTrain: false, hasHospital: false, hasCard: false },

    // Level 1: North Dhaka Transit Hubs (Staggered y: 0.160 - 0.235)
    { id: 'L1_MIR', name: 'Mirpur Cantonment Rail Station', area: 'Mirpur', level: 1, x: 0.140, y: 0.220, isStart: false, isStop: false, hasCar: true, hasBike: true, hasBus: false, hasTrain: true, hasHospital: false, hasCard: false },
    { id: 'L1_BAN', name: 'Banani Commercial Junction', area: 'Banani', level: 1, x: 0.360, y: 0.160, isStart: false, isStop: false, hasCar: false, hasBike: true, hasBus: true, hasTrain: false, hasHospital: false, hasCard: true },
    { id: 'L1_GUL', name: 'Gulshan 1 Circle', area: 'Gulshan', level: 1, x: 0.650, y: 0.235, isStart: false, isStop: false, hasCar: true, hasBike: true, hasBus: false, hasTrain: false, hasHospital: false, hasCard: false },
    { id: 'L1_NIK', name: 'Niketan Lake Avenue', area: 'Niketan', level: 1, x: 0.860, y: 0.180, isStart: false, isStop: false, hasCar: true, hasBike: false, hasBus: true, hasTrain: false, hasHospital: false, hasCard: true },

    // Level 2: North-Central Hubs (Staggered y: 0.315 - 0.410)
    { id: 'L2_GAB', name: 'Gabtoli Rail & River Terminal', area: 'Gabtoli', level: 2, x: 0.110, y: 0.370, isStart: false, isStop: false, hasCar: false, hasBike: true, hasBus: true, hasTrain: true, hasHospital: true, hasCard: false },
    { id: 'L2_CHN', name: 'Chandrima Udyan Park', area: 'Chandrima', level: 2, x: 0.330, y: 0.315, isStart: false, isStop: false, hasCar: false, hasBike: true, hasBus: false, hasTrain: false, hasHospital: false, hasCard: true },
    { id: 'L2_TEJ', name: 'Tejgaon Rail & Industrial Hub', area: 'Tejgaon', level: 2, x: 0.550, y: 0.400, isStart: false, isStop: false, hasCar: true, hasBike: false, hasBus: true, hasTrain: true, hasHospital: false, hasCard: false },
    { id: 'L2_BAD', name: 'Badda Link Crossing', area: 'Badda', level: 2, x: 0.770, y: 0.335, isStart: false, isStop: false, hasCar: true, hasBike: true, hasBus: false, hasTrain: false, hasHospital: false, hasCard: false },
    { id: 'L2_BNE', name: 'Banasree North Gate', area: 'Banasree', level: 2, x: 0.900, y: 0.410, isStart: false, isStop: false, hasCar: false, hasBike: true, hasBus: true, hasTrain: false, hasHospital: false, hasCard: true },

    // Level 3: Central Dhaka Hubs (Staggered y: 0.470 - 0.555)
    { id: 'L3_MOH', name: 'Mohammadpur Bus Depot', area: 'Mohammadpur', level: 3, x: 0.130, y: 0.535, isStart: false, isStop: false, hasCar: true, hasBike: false, hasBus: true, hasTrain: false, hasHospital: false, hasCard: false },
    { id: 'L3_FAR', name: 'Farmgate Central Hospital & Rail', area: 'Farmgate', level: 3, x: 0.380, y: 0.470, isStart: false, isStop: false, hasCar: false, hasBike: true, hasBus: true, hasTrain: true, hasHospital: true, hasCard: false },
    { id: 'L3_MOG', name: 'Moghbazar Flyover Crossing', area: 'Moghbazar', level: 3, x: 0.590, y: 0.555, isStart: false, isStop: false, hasCar: true, hasBike: true, hasBus: false, hasTrain: false, hasHospital: false, hasCard: true },
    { id: 'L3_MAL', name: 'Malibagh Central Rail Junction', area: 'Malibagh', level: 3, x: 0.760, y: 0.485, isStart: false, isStop: false, hasCar: false, hasBike: false, hasBus: true, hasTrain: true, hasHospital: false, hasCard: false },
    { id: 'L3_BSE', name: 'Banasree East Canal', area: 'Banasree', level: 3, x: 0.890, y: 0.550, isStart: false, isStop: false, hasCar: true, hasBike: true, hasBus: false, hasTrain: false, hasHospital: false, hasCard: false },

    // Level 4: South-Central Hubs (Staggered y: 0.630 - 0.715)
    { id: 'L4_BOS', name: 'Boshila South Bridge Link', area: 'Boshila', level: 4, x: 0.100, y: 0.695, isStart: false, isStop: false, hasCar: false, hasBike: true, hasBus: true, hasTrain: false, hasHospital: false, hasCard: true },
    { id: 'L4_NEW', name: 'Dhaka New Market Square', area: 'Dhanmondi', level: 4, x: 0.300, y: 0.630, isStart: false, isStop: false, hasCar: true, hasBike: true, hasBus: false, hasTrain: false, hasHospital: true, hasCard: false },
    { id: 'L4_SHA', name: 'Shahbagh Cultural Circle', area: 'Shahbagh', level: 4, x: 0.490, y: 0.710, isStart: false, isStop: false, hasCar: false, hasBike: true, hasBus: true, hasTrain: false, hasHospital: false, hasCard: false },
    { id: 'L4_MOT', name: 'Motijheel Central Rail Terminal', area: 'Motijheel', level: 4, x: 0.710, y: 0.640, isStart: false, isStop: false, hasCar: true, hasBike: false, hasBus: true, hasTrain: true, hasHospital: false, hasCard: false },
    { id: 'L4_BSS', name: 'South Banasree Avenue', area: 'Banasree', level: 4, x: 0.880, y: 0.715, isStart: false, isStop: false, hasCar: true, hasBike: false, hasBus: true, hasTrain: false, hasHospital: false, hasCard: true },

    // Level 5: Old Dhaka South Hubs (Staggered y: 0.785 - 0.855)
    { id: 'L5_LAL', name: 'Lalbagh Fort Gate & Clinic', area: 'Lalbagh', level: 5, x: 0.180, y: 0.825, isStart: false, isStop: false, hasCar: false, hasBike: true, hasBus: false, hasTrain: false, hasHospital: true, hasCard: true },
    { id: 'L5_CHK', name: 'Chawkbazar Heritage Square', area: 'Old Dhaka', level: 5, x: 0.380, y: 0.785, isStart: false, isStop: false, hasCar: false, hasBike: true, hasBus: true, hasTrain: false, hasHospital: false, hasCard: false },
    { id: 'L5_SAD', name: 'Sadarghat River & Rail Terminal', area: 'Sadarghat', level: 5, x: 0.560, y: 0.855, isStart: false, isStop: false, hasCar: true, hasBike: false, hasBus: true, hasTrain: true, hasHospital: false, hasCard: false },
    { id: 'L5_AHS', name: 'Ahsan Manzil Riverside', area: 'Old Dhaka', level: 5, x: 0.750, y: 0.795, isStart: false, isStop: false, hasCar: true, hasBike: true, hasBus: false, hasTrain: false, hasHospital: false, hasCard: true },
    { id: 'L5_POS', name: 'Postogola Highway Approach', area: 'Postogola', level: 5, x: 0.890, y: 0.840, isStart: false, isStop: false, hasCar: true, hasBike: false, hasBus: true, hasTrain: false, hasHospital: false, hasCard: false },

    // Level 6: STOP Destination Hub
    { id: 'STOP', name: 'STOP: Keraniganj South Hub', area: 'Keraniganj', level: 6, x: 0.500, y: 0.940, isStart: false, isStop: true, hasCar: false, hasBike: false, hasBus: false, hasTrain: false, hasHospital: false, hasCard: false }
  ];

  const BOARD_EDGES = [
    // Roads
    { id: 'E_ST_L1A', from: 'START', to: 'L1_MIR', type: 'road', color: 'red' },
    { id: 'E_ST_L1B', from: 'START', to: 'L1_BAN', type: 'road', color: 'green' },
    { id: 'E_ST_L1C', from: 'START', to: 'L1_GUL', type: 'road', color: 'blue' },
    { id: 'E_ST_L1D', from: 'START', to: 'L1_NIK', type: 'road', color: 'red' },
    { id: 'E_L1_12', from: 'L1_MIR', to: 'L1_BAN', type: 'road', color: 'green' },
    { id: 'E_L1_23', from: 'L1_BAN', to: 'L1_GUL', type: 'road', color: 'red' },
    { id: 'E_L1_34', from: 'L1_GUL', to: 'L1_NIK', type: 'road', color: 'blue' },
    { id: 'E_L12_1', from: 'L1_MIR', to: 'L2_GAB', type: 'road', color: 'green' },
    { id: 'E_L12_2', from: 'L1_MIR', to: 'L2_CHN', type: 'road', color: 'red' },
    { id: 'E_L12_3', from: 'L1_BAN', to: 'L2_CHN', type: 'road', color: 'blue' },
    { id: 'E_L12_4', from: 'L1_BAN', to: 'L2_TEJ', type: 'road', color: 'green' },
    { id: 'E_L12_5', from: 'L1_GUL', to: 'L2_TEJ', type: 'road', color: 'red' },
    { id: 'E_L12_6', from: 'L1_GUL', to: 'L2_BAD', type: 'road', color: 'green' },
    { id: 'E_L12_7', from: 'L1_NIK', to: 'L2_BAD', type: 'road', color: 'blue' },
    { id: 'E_L12_8', from: 'L1_NIK', to: 'L2_BNE', type: 'road', color: 'red' },
    { id: 'E_L2_12', from: 'L2_GAB', to: 'L2_CHN', type: 'road', color: 'blue' },
    { id: 'E_L2_23', from: 'L2_CHN', to: 'L2_TEJ', type: 'road', color: 'green' },
    { id: 'E_L2_34', from: 'L2_TEJ', to: 'L2_BAD', type: 'road', color: 'red' },
    { id: 'E_L2_45', from: 'L2_BAD', to: 'L2_BNE', type: 'road', color: 'green' },
    { id: 'E_L23_1', from: 'L2_GAB', to: 'L3_MOH', type: 'road', color: 'red' },
    { id: 'E_L23_2', from: 'L2_GAB', to: 'L3_FAR', type: 'road', color: 'green' },
    { id: 'E_L23_3', from: 'L2_CHN', to: 'L3_FAR', type: 'road', color: 'red' },
    { id: 'E_L23_4', from: 'L2_TEJ', to: 'L3_FAR', type: 'road', color: 'blue' },
    { id: 'E_L23_5', from: 'L2_TEJ', to: 'L3_MOG', type: 'road', color: 'green' },
    { id: 'E_L23_6', from: 'L2_TEJ', to: 'L3_MAL', type: 'road', color: 'red' },
    { id: 'E_L23_7', from: 'L2_BAD', to: 'L3_MOG', type: 'road', color: 'blue' },
    { id: 'E_L23_8', from: 'L2_BAD', to: 'L3_MAL', type: 'road', color: 'green' },
    { id: 'E_L23_9', from: 'L2_BNE', to: 'L3_MAL', type: 'road', color: 'blue' },
    { id: 'E_L23_10', from: 'L2_BNE', to: 'L3_BSE', type: 'road', color: 'red' },
    { id: 'E_L3_12', from: 'L3_MOH', to: 'L3_FAR', type: 'road', color: 'blue' },
    { id: 'E_L3_23', from: 'L3_FAR', to: 'L3_MOG', type: 'road', color: 'red' },
    { id: 'E_L3_34', from: 'L3_MOG', to: 'L3_MAL', type: 'road', color: 'green' },
    { id: 'E_L3_45', from: 'L3_MAL', to: 'L3_BSE', type: 'road', color: 'blue' },
    { id: 'E_L34_1', from: 'L3_MOH', to: 'L4_BOS', type: 'road', color: 'green' },
    { id: 'E_L34_2', from: 'L3_MOH', to: 'L4_NEW', type: 'road', color: 'blue' },
    { id: 'E_L34_3', from: 'L3_FAR', to: 'L4_NEW', type: 'road', color: 'green' },
    { id: 'E_L34_4', from: 'L3_FAR', to: 'L4_SHA', type: 'road', color: 'red' },
    { id: 'E_L34_5', from: 'L3_MOG', to: 'L4_SHA', type: 'road', color: 'green' },
    { id: 'E_L34_6', from: 'L3_MOG', to: 'L4_MOT', type: 'road', color: 'blue' },
    { id: 'E_L34_7', from: 'L3_MAL', to: 'L4_MOT', type: 'road', color: 'green' },
    { id: 'E_L34_8', from: 'L3_MAL', to: 'L4_BSS', type: 'road', color: 'red' },
    { id: 'E_L34_9', from: 'L3_BSE', to: 'L4_BSS', type: 'road', color: 'green' },
    { id: 'E_L4_12', from: 'L4_BOS', to: 'L4_NEW', type: 'road', color: 'red' },
    { id: 'E_L4_23', from: 'L4_NEW', to: 'L4_SHA', type: 'road', color: 'blue' },
    { id: 'E_L4_34', from: 'L4_SHA', to: 'L4_MOT', type: 'road', color: 'red' },
    { id: 'E_L4_45', from: 'L4_MOT', to: 'L4_BSS', type: 'road', color: 'blue' },
    { id: 'E_L45_1', from: 'L4_BOS', to: 'L5_LAL', type: 'road', color: 'blue' },
    { id: 'E_L45_2', from: 'L4_NEW', to: 'L5_LAL', type: 'road', color: 'green' },
    { id: 'E_L45_3', from: 'L4_NEW', to: 'L5_CHK', type: 'road', color: 'red' },
    { id: 'E_L45_4', from: 'L4_SHA', to: 'L5_CHK', type: 'road', color: 'green' },
    { id: 'E_L45_5', from: 'L4_SHA', to: 'L5_SAD', type: 'road', color: 'blue' },
    { id: 'E_L45_6', from: 'L4_MOT', to: 'L5_SAD', type: 'road', color: 'red' },
    { id: 'E_L45_7', from: 'L4_MOT', to: 'L5_AHS', type: 'road', color: 'green' },
    { id: 'E_L45_8', from: 'L4_BSS', to: 'L5_AHS', type: 'road', color: 'blue' },
    { id: 'E_L45_9', from: 'L4_BSS', to: 'L5_POS', type: 'road', color: 'red' },
    { id: 'E_L5_12', from: 'L5_LAL', to: 'L5_CHK', type: 'road', color: 'blue' },
    { id: 'E_L5_23', from: 'L5_CHK', to: 'L5_SAD', type: 'road', color: 'green' },
    { id: 'E_L5_34', from: 'L5_SAD', to: 'L5_AHS', type: 'road', color: 'red' },
    { id: 'E_L5_45', from: 'L5_AHS', to: 'L5_POS', type: 'road', color: 'green' },
    { id: 'E_L5_STOP1', from: 'L5_LAL', to: 'STOP', type: 'road', color: 'red' },
    { id: 'E_L5_STOP2', from: 'L5_CHK', to: 'STOP', type: 'road', color: 'green' },
    { id: 'E_L5_STOP3', from: 'L5_SAD', to: 'STOP', type: 'road', color: 'blue' },
    { id: 'E_L5_STOP4', from: 'L5_AHS', to: 'STOP', type: 'road', color: 'green' },
    { id: 'E_L5_STOP5', from: 'L5_POS', to: 'STOP', type: 'road', color: 'red' },

    // Directed Curved Train Tracks (Max 1 outgoing train line per node)
    { id: 'RAIL_L1_L2', from: 'L1_MIR', to: 'L2_TEJ', type: 'rail', color: 'rail', curveOffset: -55 },
    { id: 'RAIL_L2_L3', from: 'L2_TEJ', to: 'L3_MAL', type: 'rail', color: 'rail', curveOffset: 50 },
    { id: 'RAIL_L2GAB_L3', from: 'L2_GAB', to: 'L3_MAL', type: 'rail', color: 'rail', curveOffset: -65 },
    { id: 'RAIL_L3_L4', from: 'L3_MAL', to: 'L4_MOT', type: 'rail', color: 'rail', curveOffset: 45 },
    { id: 'RAIL_L3FAR_L4', from: 'L3_FAR', to: 'L4_MOT', type: 'rail', color: 'rail', curveOffset: -55 },
    { id: 'RAIL_L4_L5', from: 'L4_MOT', to: 'L5_SAD', type: 'rail', color: 'rail', curveOffset: -45 }
  ];

  const ABILITY_CARDS_TEMPLATE = [
    { id: 'c_nitro', title: 'Nitros Speed Boost', category: 'advantage', type: 'Play Once Any Time', description: 'Double your score points on your next travel move (+100% pts).', effectType: 'DOUBLE_POINTS' },
    { id: 'c_fuel', title: 'Free Fuel Voucher', category: 'advantage', type: 'Play Once Any Time', description: 'Instantly claim +6 currency units from city reserve.', effectType: 'ADD_CURRENCY_6' },
    { id: 'c_express', title: 'Green Wave Pass', category: 'advantage', type: 'Play Once Any Time', description: 'Treat your road as Light Traffic regardless of the dice roll.', effectType: 'LIGHT_TRAFFIC_BUFF' },
    { id: 'c_upgrade', title: 'Vehicle Permit Upgrade', category: 'advantage', type: 'Play Once Any Time', description: 'Choose a free Car or Bike permit to keep permanently in hand.', effectType: 'FREE_VEHICLE' },
    { id: 'c_roadblock', title: 'Set Roadblock', category: 'attack', type: 'Play Once Any Time', description: 'Select a road color (Red, Green, Blue) to BLOCK for all opponents until next round.', effectType: 'BLOCK_ROAD_COLOR' },
    { id: 'c_steal', title: 'Road Tax Extortion', category: 'attack', type: 'Play Once Any Time', description: 'Select an opponent to steal 3 currency (or 3 pts) from!', effectType: 'STEAL_FROM_OPPONENT' },
    { id: 'c_toll', title: 'Citywide Toll Audit', category: 'attack', type: 'Play Right Away', description: 'Mandatory: All opponents must immediately pay 2 currency or lose 3 pts.', effectType: 'TAX_ALL_PLAYERS' },
    { id: 'c_grant', title: 'Municipal Transit Grant', category: 'advantage', type: 'Play Right Away', description: 'Mandatory: Immediately receive +9 currency from the municipal transit fund.', effectType: 'GRANT_CURRENCY_9' },
    { id: 'c_speedtrap', title: 'Traffic Police Inspection', category: 'attack', type: 'Play Right Away', description: 'Mandatory: Audit the leading player and fine them 4 points!', effectType: 'PENALIZE_LEADER' },
    { id: 'c_siren', title: 'VIP Motorcade Pass', category: 'advantage', type: 'Play Once Any Time', description: 'Instantly receive +6 bonus points and free road clearance.', effectType: 'FREE_EXTRA_STEP' }
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

      this.onLogCallback = null;
      this.onCardDrawPrompt = null;
      this.onGameOverCallback = null;

      this.initGraph();
      this.initDeck();
    }

    initGraph() {
      this.nodesMap.clear();
      BOARD_NODES.forEach((n) => this.nodesMap.set(n.id, { ...n }));
      this.edges = [...BOARD_EDGES];
    }

    initDeck() {
      this.deck = [];
      let uid = 1;
      for (let i = 0; i < 4; i++) {
        ABILITY_CARDS_TEMPLATE.forEach((c) => {
          this.deck.push({ ...c, instanceId: `card_${uid++}` });
        });
      }
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

    initGame(playerConfigs) {
      this.initGraph();
      this.initDeck();
      this.players = playerConfigs.map((cfg, idx) => ({
        id: `p_${idx + 1}`,
        name: cfg.name,
        color: cfg.color,
        isAi: cfg.isAi,
        score: 0,
        money: 12, // Starting 12 Currency Units
        currentNodeId: 'START',
        previousNodeId: null,
        currentVehicle: 'run', // Starts on foot ('run', 'bike', 'car', 'bus', 'train')
        vehicleTokens: new Set(),
        hand: [],
        milestonesClaimed: new Set(),
        hasFinished: false,
        finishRank: null,
        lightTrafficBonus: false,
        doublePointsBonus: false,
        runSpeedBonus: 0,
        bypassRoadblock: false
      }));

      this.round = 1;
      this.priorityIndex = Math.floor(Math.random() * this.players.length);
      this.activePlayerIndex = this.priorityIndex;
      this.turnsTakenInRound = 0;
      this.trafficStatus = { red: 'medium', green: 'medium', blue: 'medium' };
      this.diceRoll = null;
      this.winner = null;
      this.phase = 'PLAYING';

      this.log(`🎮 New Game started with ${this.players.length} players!`, 'system');
      this.log(`⭐ Priority Token assigned to ${this.players[this.priorityIndex].name}.`, 'bonus');
      this.log(`🚦 Round 1: All roads set to MEDIUM traffic. Starting at Gulshan Hub.`, 'traffic');
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
        // Enforce max 1 outgoing train line rule: only forward-directed rail edges starting from curr.id
        const isForwardRail = edge.type === 'rail' && edge.from === curr.id;
        const isRoad = edge.type === 'road';
        if (!isForwardRail && !isRoad) continue;

        const neighborId = this.getAdjacentNodeId(edge, curr.id);
        const neighbor = this.nodesMap.get(neighborId);
        if (!neighbor) continue;

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

          // 2. Bike: Available if node has bike OR player retains a bike
          if (curr.hasBike || p.currentVehicle === 'bike' || p.vehicleTokens.has('bike')) {
            const source = (p.currentVehicle === 'bike' || p.vehicleTokens.has('bike')) ? 'retained' : 'station';
            moves.push(this.makeMoveOption(p, neighbor, edge, 'bike', source));
          }

          // 3. Car: Available if node has car OR player retains a car
          if (curr.hasCar || p.currentVehicle === 'car' || p.vehicleTokens.has('car')) {
            const source = (p.currentVehicle === 'car' || p.vehicleTokens.has('car')) ? 'retained' : 'station';
            moves.push(this.makeMoveOption(p, neighbor, edge, 'car', source));
          }

          // 4. Bus: Available if node has bus terminal OR player is currently riding bus
          if (curr.hasBus || p.currentVehicle === 'bus') {
            const source = (p.currentVehicle === 'bus') ? 'retained' : 'station';
            moves.push(this.makeMoveOption(p, neighbor, edge, 'bus', source));
          }
        }
      }
      return moves;
    }

    makeMoveOption(player, targetNode, edge, vehicleId, source = 'station') {
      const v = SPEED_CHART[vehicleId];
      let traffic = edge.type === 'rail' ? 'none' : (player.lightTrafficBonus ? 'light' : (this.trafficStatus[edge.color] || 'medium'));
      let points = (vehicleId === 'run' && player.runSpeedBonus > 0) ? player.runSpeedBonus : (v[traffic] || v.medium);
      if (player.doublePointsBonus) points *= 2;
      let cost = v.cost;
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

      // Deduct cost and set transport mode
      p.money -= cost;
      p.currentVehicle = vehicleId;
      if (vehicleId === 'bike' || vehicleId === 'car') {
        p.vehicleTokens.add(vehicleId);
      }

      this.log(`💰 ${p.name} paid ${cost} currency to ride ${SPEED_CHART[vehicleId].name} (${move.source === 'retained' ? 'retained vehicle' : 'boarded at station'}). (Balance: ${p.money})`, 'action');

      // Add points
      p.score += pointsEarned;
      this.log(`⚡ ${p.name} earned +${pointsEarned} pts riding ${SPEED_CHART[vehicleId].name} (${move.traffic} traffic).`, 'score');

      // Clear one-time bonuses
      p.doublePointsBonus = false;
      p.lightTrafficBonus = false;

      // Milestone check: 33, 66, 100
      [33, 66, 100].forEach((m) => {
        if (p.score >= m && !p.milestonesClaimed.has(m)) {
          p.milestonesClaimed.add(m);
          p.money += 9;
          this.log(`🌟 MILESTONE! ${p.name} reached ${m} pts and earned +9 Currency!`, 'bonus');
        }
      });

      p.previousNodeId = p.currentNodeId;
      p.currentNodeId = targetNodeId;

      // Hospital node clearance
      if (target.hasHospital) {
        this.log(`🏥 ${p.name} visited ${target.name} hospital station.`, 'system');
      }

      // Check STOP arrival
      if (target.isStop) {
        p.hasFinished = true;
        p.finishRank = this.players.filter((pl) => pl.hasFinished).length;
        if (!this.winner) {
          this.winner = p;
          this.log(`🏆 FASTEST FINISHER! ${p.name} reached STOP first! (+15 pts bonus)`, 'victory');
          audio.playVictory();
        } else {
          this.log(`🏁 ${p.name} reached STOP as finisher #${p.finishRank}!`, 'victory');
        }
        this.checkGameCompletion();
        return true;
      }

      // Check Ability Card Draw (A node)
      if (target.hasCard) {
        audio.playCardDraw();
        this.triggerCardDraw(playerIndex);
      }

      return true;
    }

    triggerCardDraw(playerIndex) {
      if (this.deck.length < 2) {
        this.deck = this.deck.concat(this.discardPile);
        this.discardPile = [];
        this.shuffleDeck();
      }
      const cardsDrawn = [this.deck.pop(), this.deck.pop()].filter(Boolean);
      const p = this.players[playerIndex];
      this.log(`🎴 ${p.name} landed on 'A' node and is drawing an Ability Card.`, 'card');

      if (this.onCardDrawPrompt) {
        this.onCardDrawPrompt(playerIndex, cardsDrawn);
      }
    }

    keepCard(playerIndex, cardToKeepInstanceId, allDrawn) {
      const p = this.players[playerIndex];
      const kept = allDrawn.find((c) => c.instanceId === cardToKeepInstanceId);
      const discarded = allDrawn.filter((c) => c.instanceId !== cardToKeepInstanceId);

      if (kept) {
        p.hand.push(kept);
        // Kept private: Do not leak card title or power in the log
        this.log(`🔒 ${p.name} added 1 private Ability Card to hand.`, 'card');
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
          this.log(`⚡ Nitro activated! ${p.name}'s upcoming move will earn 2x DOUBLE score points!`, 'bonus');
          break;
        case 'ADD_CURRENCY_6':
          p.money += 6;
          this.log(`💰 Fuel voucher redeemed! +6 currency added to ${p.name} (Balance: ${p.money}).`, 'bonus');
          break;
        case 'LIGHT_TRAFFIC_BUFF':
          p.lightTrafficBonus = true;
          this.log(`🟢 Green Wave pass active! ${p.name}'s upcoming move enjoys Light Traffic speeds!`, 'bonus');
          break;
        case 'FREE_VEHICLE':
          if (selectionParam === 'bike') {
            p.vehicleTokens.add('bike');
            this.log(`🏍️ Free Bike Permit claimed by ${p.name}!`, 'bonus');
          } else {
            p.vehicleTokens.add('car');
            this.log(`🚗 Free Car Permit claimed by ${p.name}!`, 'bonus');
          }
          break;
        case 'BLOCK_ROAD_COLOR':
          const colToBlock = selectionParam || 'red';
          this.blockedColors.add(colToBlock);
          this.log(`🛑 Roadblock placed! ${colToBlock.toUpperCase()} roads are BLOCKED for all opponents until next round!`, 'alert');
          break;
        case 'STEAL_FROM_OPPONENT':
          const targetOpponent = this.players.find((pl, idx) => idx === selectionParam || pl.id === selectionParam);
          if (targetOpponent) {
            if (targetOpponent.money >= 3) {
              targetOpponent.money -= 3;
              p.money += 3;
              this.log(`💸 Extortion! ${p.name} took 3 currency from ${targetOpponent.name}!`, 'bonus');
            } else {
              targetOpponent.score = Math.max(0, targetOpponent.score - 3);
              p.score += 3;
              this.log(`💸 Extortion! ${p.name} took 3 pts from ${targetOpponent.name}!`, 'bonus');
            }
          }
          break;
        case 'TAX_ALL_PLAYERS':
          this.players.forEach((other, idx) => {
            if (idx !== playerIndex && !other.hasFinished) {
              if (other.money >= 2) {
                other.money -= 2;
                this.log(`💸 ${other.name} paid 2 currency in toll audit.`, 'action');
              } else {
                other.score = Math.max(0, other.score - 3);
                this.log(`⚠️ ${other.name} had insufficient funds and lost 3 pts.`, 'alert');
              }
            }
          });
          break;
        case 'FREE_EXTRA_STEP':
          p.score += 6;
          this.log(`🏎️ VIP Motorcade pass! +6 bonus points granted to ${p.name}.`, 'bonus');
          break;
        case 'GRANT_CURRENCY_9':
          p.money += 9;
          this.log(`💰 Municipal grant credited! +9 currency added to ${p.name} (Balance: ${p.money}).`, 'bonus');
          break;
        case 'PENALIZE_LEADER':
          // Find the non-finished player (other than current) with highest score
          const opponentsSorted = this.players.filter((other, idx) => idx !== playerIndex && !other.hasFinished).sort((a, b) => b.score - a.score);
          if (opponentsSorted.length > 0) {
            const leader = opponentsSorted[0];
            const penalty = Math.min(4, leader.score);
            leader.score -= penalty;
            this.log(`👮 Police Inspection! Leader ${leader.name} fined ${penalty} points (New score: ${leader.score} pts).`, 'alert');
          } else {
            this.log(`👮 Police Inspection concluded with no valid targets.`, 'action');
          }
          break;
      }
      return true;
    }

    // ADVANCE TO NEXT PLAYER OR NEXT ROUND
    advanceTurn() {
      if (this.phase === 'GAME_OVER') return;
      this.turnsTakenInRound++;

      const activePlayers = this.players.filter((p) => !p.hasFinished);
      if (this.turnsTakenInRound >= this.players.length || activePlayers.length <= 1) {
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

        this.activePlayerIndex = nextIdx;
      }
    }

    startNextRound() {
      if (this.phase === 'GAME_OVER') return;
      this.round++;
      this.turnsTakenInRound = 0;

      // Rotate priority token
      let nextPriority = this.priorityIndex;
      let pAttempts = 0;
      do {
        nextPriority = (nextPriority + 1) % this.players.length;
        pAttempts++;
      } while (this.players[nextPriority].hasFinished && pAttempts < this.players.length);

      this.priorityIndex = nextPriority;
      this.activePlayerIndex = this.priorityIndex;

      // Roll 6-sided dice for traffic
      this.diceRoll = Math.floor(Math.random() * 6) + 1;
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
        p.runSpeedBonus = 0;
        p.bypassRoadblock = false;
      });
      this.blockedColors.clear();
      this.blockedEdges.clear();
    }

    checkGameCompletion() {
      const allFinished = this.players.every((p) => p.hasFinished);
      if (allFinished || (this.winner && this.players.filter((p) => !p.hasFinished).length <= 1)) {
        this.endGame();
      }
    }

    endGame() {
      this.phase = 'GAME_OVER';
      this.log(`🏁 THE RACE HAS FINISHED! Calculating final scores & bonuses...`, 'victory');

      if (this.winner) {
        this.winner.score += 15;
        this.winner.fastestBonus = 15;
      }
      this.players.forEach((p) => {
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
  // 4. AI BOT CONTROLLER
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
        if (card.effectType === 'BLOCK_ROAD_COLOR') param = 'red';
        else if (card.effectType === 'STEAL_FROM_OPPONENT') {
          const targetIdx = this.engine.players.findIndex((pl, idx) => idx !== playerIndex && !pl.hasFinished);
          param = targetIdx !== -1 ? targetIdx : null;
        } else if (card.effectType === 'FREE_VEHICLE') {
          param = 'car';
        }
        this.engine.playCardWithSelection(playerIndex, card.instanceId, param);
        acted = true;
        mandatoryCards = p.hand.filter((c) => c.type === 'Play Right Away' || c.type === 'Play At Once');
      }

      // 2. Optional "Play Once Any Time" beneficial cards
      const fuelCard = p.hand.find((c) => c.effectType === 'ADD_CURRENCY_6');
      if (fuelCard) {
        this.engine.playCardWithSelection(playerIndex, fuelCard.instanceId);
        acted = true;
      }

      const nitroCard = p.hand.find((c) => c.effectType === 'DOUBLE_POINTS');
      if (nitroCard) {
        this.engine.playCardWithSelection(playerIndex, nitroCard.instanceId);
        acted = true;
      }

      const roadBlockCard = p.hand.find((c) => c.effectType === 'BLOCK_ROAD_COLOR');
      if (roadBlockCard) {
        this.engine.playCardWithSelection(playerIndex, roadBlockCard.instanceId, 'red');
        acted = true;
      }

      const stealCard = p.hand.find((c) => c.effectType === 'STEAL_FROM_OPPONENT');
      if (stealCard) {
        const targetIdx = this.engine.players.findIndex((pl, idx) => idx !== playerIndex && !pl.hasFinished);
        if (targetIdx !== -1) {
          this.engine.playCardWithSelection(playerIndex, stealCard.instanceId, targetIdx);
          acted = true;
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

      const scored = candidates.map((m) => {
        const currDist = this.engine.calcDistance(p.currentNodeId, 'STOP');
        const nextDist = this.engine.calcDistance(m.targetNodeId, 'STOP');
        let score = (currDist - nextDist) * 35 + m.pointsEarned * 2.5 - m.cost * 1.5;
        if (m.targetNode.isStop) score += 5000;
        if (m.targetNode.hasCard) score += 15;
        if (m.source === 'retained') score += 8; // Prefer keeping rented car/bike
        return { m, score };
      });

      scored.sort((a, b) => b.score - a.score);
      return scored[0]?.m || candidates[0];
    }

    chooseCardToKeep(playerIndex, cards) {
      return cards[0]?.instanceId;
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
        const newScale = Math.max(0.25, Math.min(4.5, this.scale * factor));
        this.panX = mx - (mx - this.panX) * (newScale / this.scale);
        this.panY = my - (my - this.panY) * (newScale / this.scale);
        this.scale = newScale;
        this.render();
      }, { passive: false });
    }

    resize() {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
      this.fitBoardToView();
    }

    fitBoardToView() {
      const s = Math.min(this.canvas.width / this.boardWidth, this.canvas.height / this.boardHeight) * 0.95;
      this.scale = s;
      this.panX = (this.canvas.width - this.boardWidth * s) / 2;
      this.panY = (this.canvas.height - this.boardHeight * s) / 2;
      this.render();
    }

    centerOnNode(nodeId, playerIdx = null) {
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

      this.initCallbacks();
      this.bindDOM();
      this.showSetupModal();
    }

    initCallbacks() {
      this.renderer.onNodeClick = (node) => this.handleNodeClick(node);
      this.renderer.onNodeHover = (node) => this.handleNodeHover(node);
      this.engine.onLogCallback = (entry) => this.appendLog(entry);
      this.engine.onCardDrawPrompt = (pIdx, cards) => this.showCardDraw(pIdx, cards);
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

      // Legend Toggle Button
      const legendPanel = document.getElementById('mapLegendPanel');
      const legendToggleBtn = document.getElementById('toggleLegendBtn');
      if (legendToggleBtn && legendPanel) {
        legendToggleBtn.addEventListener('click', () => {
          legendPanel.classList.toggle('collapsed');
        });
      }
      const closeLegendBtn = document.getElementById('closeLegendBtn');
      if (closeLegendBtn && legendPanel) {
        closeLegendBtn.addEventListener('click', () => {
          legendPanel.classList.add('collapsed');
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
      const rows = document.querySelectorAll('.player-config-row');
      const configs = [];
      rows.forEach((row, idx) => {
        const name = row.querySelector('.player-name-input').value.trim() || `Player ${idx + 1}`;
        const isAi = row.querySelector('.player-type-select').value === 'ai';
        const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];
        configs.push({ name, color, isAi });
      });

      this.toggleModal('setupModal', false);
      this.engine.initGame(configs);
      this.renderer.fitBoardToView();
      this.updateHUD();
      this.checkAITurn();
    }

    updateHUD() {
      const active = this.engine.players[this.engine.activePlayerIndex];
      if (!active) return;

      document.getElementById('roundNumber').innerText = `Round ${this.engine.round}`;
      const badge = document.getElementById('phaseBadge');

      if (this.engine.phase === 'GAME_OVER') {
        badge.innerText = '🏁 GAME OVER';
        badge.className = 'phase-tag game-over-phase';
      } else {
        let buffTags = [];
        if (active.doublePointsBonus) buffTags.push('⚡ 2x Nitro');
        if (active.lightTrafficBonus) buffTags.push('🟢 Light Traffic');
        const buffStr = buffTags.length > 0 ? ` [${buffTags.join(', ')}]` : '';

        badge.innerText = `🚗 ${active.name}'s Turn${buffStr}`;
        badge.className = 'phase-tag travel-phase';
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
                this.promptCardPlayOptions(card);
              });
            }
            handListEl.appendChild(chip);
          });
        }
      }

      // Traffic Rows
      document.getElementById('trafficDiceDisplay').innerText = this.engine.diceRoll ? `🎲 Roll ${this.engine.diceRoll}` : '⚪ Round 1 (All Med)';
      const tRows = document.getElementById('trafficCardRows');
      tRows.innerHTML = '';
      TRAFFIC_STATUS_ROWS.forEach((r) => {
        const isCur = this.engine.diceRoll === r.roll;
        const div = document.createElement('div');
        div.className = `traffic-row ${isCur ? 'active-traffic-row' : ''}`;
        div.innerHTML = `
          <span class="row-num">${r.roll}</span>
          <span class="color-pill ${r.heavy}">Heavy: ${r.heavy}</span>
          <span class="color-pill ${r.medium}">Med: ${r.medium}</span>
          <span class="color-pill ${r.light}">Light: ${r.light}</span>
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

      if (this.engine.phase !== 'GAME_OVER' && !active.isAi) {
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
              this.engine.playCardWithSelection(this.engine.activePlayerIndex, card.instanceId, col.id);
              this.updateHUD();
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
              this.engine.playCardWithSelection(this.engine.activePlayerIndex, card.instanceId, opt.id);
              this.updateHUD();
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
                this.engine.playCardWithSelection(this.engine.activePlayerIndex, card.instanceId, oppIdx);
                this.updateHUD();
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
            this.engine.playCardWithSelection(this.engine.activePlayerIndex, card.instanceId);
            this.updateHUD();
          });
          container.appendChild(btn);
          break;
        }
      }

      this.toggleModal('cardActionModal', true);
    }

    handleNodeClick(node) {
      if (this.engine.phase === 'GAME_OVER') return;
      const active = this.engine.players[this.engine.activePlayerIndex];
      if (!active || active.isAi) return;

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

    executeMove(move) {
      audio.playMove(move.vehicleId);
      const success = this.engine.executePlayerMove(this.engine.activePlayerIndex, move);
      if (!success) return;

      this.updateHUD();
      if (this.engine.phase !== 'GAME_OVER') {
        this.engine.advanceTurn();
        this.updateHUD();
        this.checkAITurn();
      }
    }

    showCardDraw(playerIndex, cards) {
      const p = this.engine.players[playerIndex];
      if (p.isAi) {
        const keptId = this.ai.chooseCardToKeep(playerIndex, cards);
        this.engine.keepCard(playerIndex, keptId, cards);
        this.updateHUD();
        return;
      }

      document.getElementById('cardDrawPlayerName').innerText = p.name;
      const c = document.getElementById('drawCardsContainer');
      c.innerHTML = '';

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
          this.engine.keepCard(playerIndex, card.instanceId, cards);
          this.toggleModal('cardDrawModal', false);
          this.updateHUD();
        });
        c.appendChild(div);
      });

      this.toggleModal('cardDrawModal', true);
    }

    showGameOver(standings) {
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
      if (this.engine.phase === 'GAME_OVER') return;
      const active = this.engine.players[this.engine.activePlayerIndex];
      if (!active || !active.isAi || active.hasFinished) return;

      setTimeout(() => {
        // 1. AI plays any beneficial ability cards first
        this.ai.chooseAbilityAction(this.engine.activePlayerIndex);
        this.updateHUD();

        // 2. AI chooses its travel move and executes it
        const move = this.ai.chooseTravelMove(this.engine.activePlayerIndex);
        if (move) {
          this.executeMove(move);
        } else {
          this.engine.advanceTurn();
          this.updateHUD();
          this.checkAITurn();
        }
      }, 750);
    }

    handleNodeHover(node) {
      const tt = document.getElementById('nodeTooltip');
      if (!node) {
        tt.style.display = 'none';
        return;
      }

      const rect = this.canvas.getBoundingClientRect();
      const p = this.renderer.getNodePixel(node);
      const sx = p.x * this.renderer.scale + this.renderer.panX + rect.left;
      const sy = p.y * this.renderer.scale + this.renderer.panY + rect.top;

      let vehicleIcons = [];
      if (node.hasBike) vehicleIcons.push('🏍️ Bike');
      if (node.hasCar) vehicleIcons.push('🚗 Car');
      if (node.hasBus) vehicleIcons.push('🚌 Bus');
      if (node.hasTrain) vehicleIcons.push('🚂 Train');
      if (node.hasHospital) vehicleIcons.push('✚ Hospital');
      if (node.hasCard) vehicleIcons.push('🎴 Ability Card');

      tt.innerHTML = `
        <div style="font-weight: 700; color: #fbbf24; font-size: 13px; margin-bottom: 3px;">${node.name}</div>
        <div style="color: #94a3b8; font-size: 11px;">Area: ${node.area} (Level ${node.level ?? '-'})</div>
        <div style="margin-top: 6px; font-size: 11px; color: #34d399;">
          <strong>Stations:</strong> ${vehicleIcons.length > 0 ? vehicleIcons.join(' • ') : '🏃 Walk Only'}
        </div>
      `;
      tt.style.left = `${sx + 15}px`;
      tt.style.top = `${sy - 30}px`;
      tt.style.display = 'block';
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
