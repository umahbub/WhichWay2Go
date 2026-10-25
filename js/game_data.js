/**
 * Which Way to Go! (K2G Online) - Board Game Data
 * Complete 5-level node network with organic staggered coordinates and curved train lines.
 */

export const BOARD_CONFIG = {
  width: 1728,
  height: 1728,
  imageSrc: 'board_game_assets/K2G-WhichWayToGo-Borad-v2.jpg'
};

export const SPEED_CHART = {
  run:   { id: 'run',   name: 'Walk / Run',        icon: '🏃', cost: 0, heavy: 3,  medium: 3,  light: 3,  description: 'Free on any road. Steady +3 pts regardless of traffic.' },
  bike:  { id: 'bike',  name: 'Motorcycle / Bike', icon: '🏍️', cost: 2, heavy: 8,  medium: 8,  light: 10, description: 'Cost 2. Weaves through Heavy traffic (8 pts)! Keep riding on consecutive road turns.' },
  bus:   { id: 'bus',   name: 'Public Bus',        icon: '🚌', cost: 3, heavy: 6,  medium: 10, light: 13, description: 'Cost 3. Great value (6/10/13 pts), boards only at Bus Stations (🚌).' },
  car:   { id: 'car',   name: 'Car / Taxi',        icon: '🚗', cost: 6, heavy: 6,  medium: 12, light: 19, description: 'Cost 6. Fastest on Light roads (19 pts!), stuck in Heavy gridlock (6 pts). Keep riding on consecutive road turns.' },
  train: { id: 'train', name: 'Express Train',     icon: '🚂', cost: 6, heavy: 16, medium: 16, light: 16, description: 'Cost 6. Fixed 16 pts on Rail Tracks from Train Stations (🚂). Immune to traffic & roadblocks!' }
};

export const TRAFFIC_STATUS_ROWS = [
  { roll: 1, heavy: 'blue',  medium: 'red',   light: 'green' },
  { roll: 2, heavy: 'blue',  medium: 'green', light: 'red' },
  { roll: 3, heavy: 'green', medium: 'red',   light: 'blue' },
  { roll: 4, heavy: 'green', medium: 'blue',  light: 'red' },
  { roll: 5, heavy: 'red',   medium: 'green', light: 'blue' },
  { roll: 6, heavy: 'red',   medium: 'blue',  light: 'green' }
];

export const PLAYER_COLORS = [
  { id: 'p_red',    name: 'Ruby Red',      hex: '#ef4444', darkHex: '#991b1b', text: '#ffffff' },
  { id: 'p_blue',   name: 'Sapphire Blue', hex: '#3b82f6', darkHex: '#1e40af', text: '#ffffff' },
  { id: 'p_green',  name: 'Emerald Green', hex: '#10b981', darkHex: '#065f46', text: '#ffffff' },
  { id: 'p_yellow', name: 'Golden Sun',    hex: '#f59e0b', darkHex: '#b45309', text: '#000000' },
  { id: 'p_purple', name: 'Royal Purple',  hex: '#8b5cf6', darkHex: '#5b21b6', text: '#ffffff' },
  { id: 'p_orange', name: 'Sunset Orange', hex: '#f97316', darkHex: '#c2410c', text: '#ffffff' },
  { id: 'p_cyan',   name: 'Teal Lagoon',   hex: '#06b6d4', darkHex: '#0e7490', text: '#ffffff' },
  { id: 'p_pink',   name: 'Hot Pink',      hex: '#ec4899', darkHex: '#9d174d', text: '#ffffff' }
];

export const BOARD_NODES = [
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

export const BOARD_EDGES = [
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

export const ABILITY_CARDS_TEMPLATE = [
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
