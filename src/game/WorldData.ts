import { RoomDefinition } from './Types';

export const WORLD_ROOMS: Record<string, RoomDefinition> = {
  // ==========================================
  // BIOME 1: SOKIN O'RMON (TRANQUIL GROVE)
  // ==========================================
  'room_grove_entrance': {
    id: 'room_grove_entrance',
    name: "Sokin O'rmon - Boshlang'ich",
    biome: 'forest',
    gridX: 0,
    gridY: 3,
    width: 1920,
    height: 1080,
    platforms: [
      { x: 0, y: 960, width: 1920, height: 120 }, // Floor
      { x: 0, y: 0, width: 60, height: 1080 }, // Left Wall
      { x: 0, y: 0, width: 1920, height: 60 }, // Ceiling
      { x: 1860, y: 0, width: 60, height: 750 }, // Right Wall Upper
      { x: 300, y: 800, width: 250, height: 30 },
      { x: 650, y: 680, width: 250, height: 30 },
      { x: 1050, y: 560, width: 250, height: 30 },
      { x: 1450, y: 720, width: 300, height: 30 }
    ],
    doors: [
      {
        id: 'door_entrance_to_canopy',
        x: 1840,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_grove_canopy',
        targetX: 120,
        targetY: 880,
        direction: 'right'
      }
    ],
    collectibles: [
      {
        id: 'item_lore_tablet_1',
        type: 'LORE_FRAGMENT',
        name: "Qadimiy O'rmon Solnomasi (I)",
        description: "Buyuk daraxt ildizlari qachonlardir butun olamni birlashtirib turgan...",
        x: 1100,
        y: 510
      }
    ],
    enemies: [
      { id: 'en_g_walk_1', type: 'MELEE_WALKER', x: 750, y: 900, patrolMinX: 600, patrolMaxX: 1300 }
    ]
  },

  'room_grove_canopy': {
    id: 'room_grove_canopy',
    name: "Sokin O'rmon - Shoxlar soyasi",
    biome: 'forest',
    gridX: 1,
    gridY: 3,
    width: 1920,
    height: 1080,
    platforms: [
      { x: 0, y: 960, width: 1920, height: 120 }, // Floor
      { x: 0, y: 0, width: 60, height: 750 }, // Left Wall Upper
      { x: 0, y: 0, width: 1920, height: 60 }, // Ceiling
      { x: 1860, y: 0, width: 60, height: 750 }, // Right Wall Upper
      { x: 400, y: 760, width: 320, height: 30 },
      { x: 850, y: 600, width: 300, height: 30 },
      { x: 1300, y: 440, width: 350, height: 30 },
      { x: 800, y: 280, width: 300, height: 30 } // High path to shrine
    ],
    doors: [
      {
        id: 'door_canopy_to_entrance',
        x: 0,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_grove_entrance',
        targetX: 1780,
        targetY: 880,
        direction: 'left'
      },
      {
        id: 'door_canopy_to_shrine',
        x: 900,
        y: 0,
        width: 160,
        height: 80,
        targetRoomId: 'room_grove_shrine',
        targetX: 960,
        targetY: 880,
        direction: 'up'
      },
      {
        id: 'door_canopy_to_training',
        x: 900,
        y: 960,
        width: 160,
        height: 80,
        targetRoomId: 'room_training_shrine',
        targetX: 960,
        targetY: 200,
        direction: 'down'
      },
      {
        id: 'door_canopy_to_hollow',
        x: 1840,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_grove_hollow',
        targetX: 120,
        targetY: 880,
        direction: 'right'
      }
    ],
    npcs: [
      {
        id: 'npc_elder_alim',
        name: "Oqsoqol Alim",
        title: "O'rmon Qo'riqchisi",
        x: 480,
        y: 880,
        portrait: 'elder',
        dialogueId: 'dlg_elder_intro'
      }
    ],
    enemies: [
      { id: 'en_g_fly_1', type: 'FLYER', x: 1200, y: 350 },
      { id: 'en_g_walk_2', type: 'MELEE_WALKER', x: 1100, y: 900, patrolMinX: 900, patrolMaxX: 1600 }
    ]
  },

  'room_grove_shrine': {
    id: 'room_grove_shrine',
    name: "Sokin O'rmon - Ziyoratgoh",
    biome: 'forest',
    gridX: 1,
    gridY: 2,
    width: 1920,
    height: 1080,
    platforms: [
      { x: 0, y: 960, width: 1920, height: 120 },
      { x: 0, y: 0, width: 60, height: 1080 },
      { x: 1860, y: 0, width: 60, height: 1080 },
      { x: 0, y: 0, width: 1920, height: 60 },
      { x: 500, y: 780, width: 300, height: 30 },
      { x: 1120, y: 780, width: 300, height: 30 }
    ],
    doors: [
      {
        id: 'door_shrine_to_canopy',
        x: 900,
        y: 960,
        width: 160,
        height: 80,
        targetRoomId: 'room_grove_canopy',
        targetX: 950,
        targetY: 340,
        direction: 'down'
      }
    ],
    savePoint: {
      id: 'save_grove_shrine',
      x: 960,
      y: 900,
      name: "Sokin O'rmon - Qadimgi Chashma"
    },
    collectibles: [
      {
        id: 'item_hp_upgrade_1',
        type: 'HP_UPGRADE',
        name: "Yashil Hayot Tomchisi",
        description: "Maksimal HP ni 20 ga oshiradi.",
        x: 960,
        y: 650
      }
    ]
  },

  'room_training_shrine': {
    id: 'room_training_shrine',
    name: "Mashg'ulot Ziyoratgohi (Duel Arenasi)",
    biome: 'forest',
    gridX: 1,
    gridY: 4,
    width: 1920,
    height: 1080,
    platforms: [
      { x: 0, y: 960, width: 1920, height: 120 },
      { x: 0, y: 0, width: 60, height: 1080 },
      { x: 1860, y: 0, width: 60, height: 1080 },
      { x: 0, y: 0, width: 1920, height: 60 },
      { x: 300, y: 750, width: 300, height: 30 },
      { x: 1320, y: 750, width: 300, height: 30 },
      { x: 810, y: 550, width: 300, height: 30 }
    ],
    doors: [
      {
        id: 'door_training_to_canopy',
        x: 900,
        y: 0,
        width: 160,
        height: 80,
        targetRoomId: 'room_grove_canopy',
        targetX: 960,
        targetY: 880,
        direction: 'up'
      }
    ],
    savePoint: {
      id: 'save_training',
      x: 350,
      y: 900,
      name: "Duel Arenasi - Tinchlik Markazi"
    },
    npcs: [
      {
        id: 'npc_swordmaster',
        name: "Qilich Ustasi Kamol",
        title: "Duel va Taktika Murabbiyi",
        x: 1400,
        y: 880,
        portrait: 'master',
        dialogueId: 'dlg_swordmaster_intro'
      }
    ]
  },

  'room_grove_hollow': {
    id: 'room_grove_hollow',
    name: "Sokin O'rmon - Qo'riqxona",
    biome: 'forest',
    gridX: 2,
    gridY: 3,
    width: 1920,
    height: 1080,
    platforms: [
      { x: 0, y: 960, width: 1920, height: 120 },
      { x: 0, y: 0, width: 60, height: 750 },
      { x: 1860, y: 0, width: 60, height: 750 },
      { x: 0, y: 0, width: 1920, height: 60 },
      { x: 350, y: 800, width: 280, height: 30 },
      { x: 750, y: 660, width: 350, height: 30 },
      { x: 1250, y: 780, width: 250, height: 30 }
    ],
    doors: [
      {
        id: 'door_hollow_to_canopy',
        x: 0,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_grove_canopy',
        targetX: 1780,
        targetY: 880,
        direction: 'left'
      },
      {
        id: 'door_hollow_to_cliffs',
        x: 1840,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_grove_cliffs',
        targetX: 120,
        targetY: 880,
        direction: 'right'
      }
    ],
    enemies: [
      { id: 'en_hollow_spitter', type: 'RANGED_SPITTER', x: 850, y: 600 },
      { id: 'en_hollow_walker', type: 'MELEE_WALKER', x: 1300, y: 900, patrolMinX: 1000, patrolMaxX: 1700 }
    ]
  },

  'room_grove_cliffs': {
    id: 'room_grove_cliffs',
    name: "Sokin O'rmon - Baland Qoyalar",
    biome: 'forest',
    gridX: 3,
    gridY: 3,
    width: 1920,
    height: 1080,
    platforms: [
      { x: 0, y: 960, width: 1920, height: 120 },
      { x: 0, y: 0, width: 60, height: 750 },
      { x: 1860, y: 0, width: 60, height: 750 },
      { x: 0, y: 0, width: 1920, height: 60 },
      // High cliff ledge: requires Double Jump or returning from above
      { x: 450, y: 760, width: 250, height: 30 },
      { x: 800, y: 520, width: 300, height: 30, gateType: 'DOUBLE_JUMP' },
      { x: 1250, y: 400, width: 350, height: 30 }
    ],
    doors: [
      {
        id: 'door_cliffs_to_hollow',
        x: 0,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_grove_hollow',
        targetX: 1780,
        targetY: 880,
        direction: 'left'
      },
      {
        id: 'door_cliffs_to_gate',
        x: 1840,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_grove_gate',
        targetX: 120,
        targetY: 880,
        direction: 'right'
      },
      {
        id: 'door_cliffs_to_root_descent',
        x: 950,
        y: 960,
        width: 160,
        height: 80,
        targetRoomId: 'room_root_descent',
        targetX: 960,
        targetY: 150,
        direction: 'down'
      }
    ],
    enemies: [
      { id: 'en_cliff_flyer', type: 'FLYER', x: 900, y: 300 },
      { id: 'en_cliff_charger', type: 'CHARGER', x: 1400, y: 900, patrolMinX: 1200, patrolMaxX: 1750 }
    ],
    collectibles: [
      {
        id: 'item_energy_upgrade_1',
        type: 'ENERGY_UPGRADE',
        name: "Yulduz Nuri Kristall",
        description: "Maksimal Energiyani 20 ga oshiradi.",
        x: 1350,
        y: 340
      }
    ]
  },

  'room_grove_gate': {
    id: 'room_grove_gate',
    name: "Sokin O'rmon - Darvoza",
    biome: 'forest',
    gridX: 4,
    gridY: 3,
    width: 1920,
    height: 1080,
    platforms: [
      { x: 0, y: 960, width: 1920, height: 120 },
      { x: 0, y: 0, width: 60, height: 750 },
      { x: 1860, y: 0, width: 60, height: 750 },
      { x: 0, y: 0, width: 1920, height: 60 },
      { x: 300, y: 800, width: 300, height: 30 },
      { x: 800, y: 700, width: 300, height: 30 },
      { x: 1300, y: 600, width: 300, height: 30 }
    ],
    doors: [
      {
        id: 'door_gate_to_cliffs',
        x: 0,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_grove_cliffs',
        targetX: 1780,
        targetY: 880,
        direction: 'left'
      },
      {
        id: 'door_gate_to_boss',
        x: 1840,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_grove_boss',
        targetX: 120,
        targetY: 880,
        direction: 'right'
      }
    ],
    enemies: [
      { id: 'en_gate_shielded', type: 'SHIELDED', x: 950, y: 900 }
    ]
  },

  'room_grove_boss': {
    id: 'room_grove_boss',
    name: "Qadimgi Qo'riqchi Maydoni (Boss 1)",
    biome: 'forest',
    gridX: 5,
    gridY: 3,
    width: 2200,
    height: 1080,
    platforms: [
      { x: 0, y: 960, width: 2200, height: 120 },
      { x: 0, y: 0, width: 60, height: 750 },
      { x: 2140, y: 0, width: 60, height: 1080 },
      { x: 0, y: 0, width: 2200, height: 60 },
      { x: 450, y: 780, width: 280, height: 30 },
      { x: 1450, y: 780, width: 280, height: 30 }
    ],
    doors: [
      {
        id: 'door_boss1_to_gate',
        x: 0,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_grove_gate',
        targetX: 1780,
        targetY: 880,
        direction: 'left'
      }
    ],
    boss: [
      {
        id: 'boss_treant',
        name: "Qadimgi Daraxt Qo'riqchisi",
        type: 'BOSS_TREANT',
        x: 1600,
        y: 780,
        rewardAbility: 'doubleJump'
      }
    ]
  },

  // ==========================================
  // BIOME 2: ILDIZ G'ORLARI (ROOT CAVERNS)
  // ==========================================
  'room_root_descent': {
    id: 'room_root_descent',
    name: "Ildiz G'orlari - Chuqurlikka tushish",
    biome: 'caverns',
    gridX: 3,
    gridY: 4,
    width: 1920,
    height: 1080,
    platforms: [
      { x: 0, y: 960, width: 1920, height: 120 },
      { x: 0, y: 0, width: 60, height: 1080 },
      { x: 1860, y: 0, width: 60, height: 1080 },
      { x: 0, y: 0, width: 1920, height: 60 },
      { x: 300, y: 350, width: 350, height: 30 },
      { x: 1250, y: 550, width: 350, height: 30 },
      { x: 600, y: 750, width: 450, height: 30 },
      { x: 800, y: 930, width: 300, height: 30, isHazard: true } // Thorn hazard
    ],
    doors: [
      {
        id: 'door_descent_to_cliffs',
        x: 900,
        y: 0,
        width: 160,
        height: 80,
        targetRoomId: 'room_grove_cliffs',
        targetX: 960,
        targetY: 880,
        direction: 'up'
      },
      {
        id: 'door_descent_to_burrow',
        x: 900,
        y: 960,
        width: 160,
        height: 80,
        targetRoomId: 'room_root_burrow',
        targetX: 960,
        targetY: 150,
        direction: 'down'
      }
    ],
    enemies: [
      { id: 'en_root_ambusher', type: 'AMBUSHER', x: 1300, y: 900 }
    ]
  },

  'room_root_burrow': {
    id: 'room_root_burrow',
    name: "Ildiz G'orlari - Qo'ziqorinli Ildizlar",
    biome: 'caverns',
    gridX: 3,
    gridY: 5,
    width: 1920,
    height: 1080,
    platforms: [
      { x: 0, y: 960, width: 1920, height: 120 },
      { x: 0, y: 0, width: 60, height: 750 },
      { x: 1860, y: 0, width: 60, height: 750 },
      { x: 0, y: 0, width: 1920, height: 60 },
      { x: 400, y: 800, width: 300, height: 30 },
      { x: 900, y: 650, width: 350, height: 30 },
      { x: 1400, y: 800, width: 250, height: 30 }
    ],
    doors: [
      {
        id: 'door_burrow_to_descent',
        x: 900,
        y: 0,
        width: 160,
        height: 80,
        targetRoomId: 'room_root_descent',
        targetX: 960,
        targetY: 880,
        direction: 'up'
      },
      {
        id: 'door_burrow_to_shrine',
        x: 0,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_root_shrine',
        targetX: 1780,
        targetY: 880,
        direction: 'left'
      },
      {
        id: 'door_burrow_to_chasm',
        x: 1840,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_root_chasm',
        targetX: 120,
        targetY: 880,
        direction: 'right'
      }
    ],
    enemies: [
      { id: 'en_burrow_charger', type: 'CHARGER', x: 1100, y: 900, patrolMinX: 800, patrolMaxX: 1700 },
      { id: 'en_burrow_spitter', type: 'RANGED_SPITTER', x: 950, y: 590 }
    ]
  },

  'room_root_shrine': {
    id: 'room_root_shrine',
    name: "Ildiz G'orlari - Nur Chashmasi",
    biome: 'caverns',
    gridX: 2,
    gridY: 5,
    width: 1920,
    height: 1080,
    platforms: [
      { x: 0, y: 960, width: 1920, height: 120 },
      { x: 0, y: 0, width: 60, height: 1080 },
      { x: 1860, y: 0, width: 60, height: 750 },
      { x: 0, y: 0, width: 1920, height: 60 },
      { x: 600, y: 780, width: 300, height: 30 }
    ],
    doors: [
      {
        id: 'door_root_shrine_to_burrow',
        x: 1840,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_root_burrow',
        targetX: 120,
        targetY: 880,
        direction: 'right'
      }
    ],
    savePoint: {
      id: 'save_root_shrine',
      x: 960,
      y: 900,
      name: "Ildiz G'orlari - Ziyoratgoh"
    },
    npcs: [
      {
        id: 'npc_herbalist_leyla',
        name: "O'tchi Leyla",
        title: "Ildiz Tabibi",
        x: 450,
        y: 880,
        portrait: 'herbalist',
        dialogueId: 'dlg_herbalist_intro'
      }
    ],
    collectibles: [
      {
        id: 'item_lore_tablet_2',
        type: 'LORE_FRAGMENT',
        name: "Ildizlar Qasamyodi (II)",
        description: "Zulmat pastdan boshlandi, chuqur ildizlar birinchi bo'lib chiridi...",
        x: 1400,
        y: 900
      }
    ]
  },

  'room_root_chasm': {
    id: 'room_root_chasm',
    name: "Ildiz G'orlari - Tikanli Jarlik",
    biome: 'caverns',
    gridX: 4,
    gridY: 5,
    width: 2200,
    height: 1080,
    platforms: [
      // Floor on left
      { x: 0, y: 960, width: 600, height: 120 },
      // Wide hazard pit: requires Dash (gate) to safely clear!
      { x: 600, y: 990, width: 1000, height: 90, isHazard: true, gateType: 'DASH' },
      // Floor on right
      { x: 1600, y: 960, width: 600, height: 120 },
      { x: 0, y: 0, width: 60, height: 750 },
      { x: 2140, y: 0, width: 60, height: 750 },
      { x: 0, y: 0, width: 2200, height: 60 },
      { x: 800, y: 650, width: 200, height: 30 },
      { x: 1200, y: 650, width: 200, height: 30 }
    ],
    doors: [
      {
        id: 'door_chasm_to_burrow',
        x: 0,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_root_burrow',
        targetX: 1780,
        targetY: 880,
        direction: 'left'
      },
      {
        id: 'door_chasm_to_nest',
        x: 2120,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_root_nest',
        targetX: 120,
        targetY: 880,
        direction: 'right'
      }
    ],
    enemies: [
      { id: 'en_chasm_flyer', type: 'FLYER', x: 1000, y: 400 },
      { id: 'en_chasm_spawner', type: 'SPAWNER_HAZARD', x: 1100, y: 880 }
    ]
  },

  'room_root_nest': {
    id: 'room_root_nest',
    name: "Ildiz G'orlari - In Uyasi",
    biome: 'caverns',
    gridX: 5,
    gridY: 5,
    width: 1920,
    height: 1080,
    platforms: [
      { x: 0, y: 960, width: 1920, height: 120 },
      { x: 0, y: 0, width: 60, height: 750 },
      { x: 1860, y: 0, width: 60, height: 750 },
      { x: 0, y: 0, width: 1920, height: 60 },
      { x: 300, y: 750, width: 250, height: 30 },
      { x: 750, y: 600, width: 350, height: 30 },
      { x: 1300, y: 720, width: 300, height: 30 }
    ],
    doors: [
      {
        id: 'door_nest_to_chasm',
        x: 0,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_root_chasm',
        targetX: 2060,
        targetY: 880,
        direction: 'left'
      },
      {
        id: 'door_nest_to_crossroads',
        x: 1840,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_root_crossroads',
        targetX: 120,
        targetY: 880,
        direction: 'right'
      }
    ],
    enemies: [
      { id: 'en_nest_spawner', type: 'SPAWNER_HAZARD', x: 900, y: 900 },
      { id: 'en_nest_ambusher', type: 'AMBUSHER', x: 1400, y: 900 }
    ],
    collectibles: [
      {
        id: 'item_glowing_herbs',
        type: 'QUEST_ITEM',
        name: "Noyob Nurli O'tlar",
        description: "Leylaning shifo malhami uchun zarur o'simlik.",
        x: 850,
        y: 540
      }
    ]
  },

  'room_root_crossroads': {
    id: 'room_root_crossroads',
    name: "Ildiz G'orlari - Chorraha (Echo Rival)",
    biome: 'caverns',
    gridX: 6,
    gridY: 5,
    width: 2000,
    height: 1080,
    platforms: [
      { x: 0, y: 960, width: 2000, height: 120 },
      { x: 0, y: 0, width: 60, height: 750 },
      { x: 1940, y: 0, width: 60, height: 750 },
      { x: 0, y: 0, width: 2000, height: 60 },
      { x: 500, y: 780, width: 300, height: 30 },
      { x: 1200, y: 780, width: 300, height: 30 }
    ],
    doors: [
      {
        id: 'door_crossroads_to_nest',
        x: 0,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_root_nest',
        targetX: 1780,
        targetY: 880,
        direction: 'left'
      },
      {
        id: 'door_crossroads_to_boss',
        x: 1920,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_root_boss',
        targetX: 120,
        targetY: 880,
        direction: 'right'
      }
    ],
    enemies: [
      // Echo Rival Encounter 1
      { id: 'rival_encounter_1', type: 'ECHO_RIVAL', x: 1100, y: 880 }
    ]
  },

  'room_root_boss': {
    id: 'room_root_boss',
    name: "Ildiz Yuragi Maydoni (Boss 2)",
    biome: 'caverns',
    gridX: 7,
    gridY: 5,
    width: 2200,
    height: 1080,
    platforms: [
      { x: 0, y: 960, width: 2200, height: 120 },
      { x: 0, y: 0, width: 60, height: 750 },
      { x: 2140, y: 0, width: 60, height: 750 },
      { x: 0, y: 0, width: 2200, height: 60 },
      { x: 400, y: 760, width: 250, height: 30 },
      { x: 1550, y: 760, width: 250, height: 30 }
    ],
    doors: [
      {
        id: 'door_boss2_to_crossroads',
        x: 0,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_root_crossroads',
        targetX: 1860,
        targetY: 880,
        direction: 'left'
      },
      {
        id: 'door_boss2_to_temple',
        x: 2120,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_temple_courtyard',
        targetX: 120,
        targetY: 880,
        direction: 'right'
      }
    ],
    boss: [
      {
        id: 'boss_behemoth',
        name: "Ildizlar Maxluqi (Root Behemoth)",
        type: 'BOSS_BEHEMOTH',
        x: 1600,
        y: 760,
        rewardAbility: 'dash'
      }
    ]
  },

  // ==========================================
  // BIOME 3: UNUTILGAN MA'BAD (FORGOTTEN SANCTUARY)
  // ==========================================
  'room_temple_courtyard': {
    id: 'room_temple_courtyard',
    name: "Unutilgan Ma'bad - Hovli",
    biome: 'sanctuary',
    gridX: 7,
    gridY: 4,
    width: 1920,
    height: 1080,
    platforms: [
      { x: 0, y: 960, width: 1920, height: 120 },
      { x: 0, y: 0, width: 60, height: 750 },
      { x: 1860, y: 0, width: 60, height: 750 },
      { x: 0, y: 0, width: 1920, height: 60 },
      { x: 400, y: 800, width: 300, height: 30 },
      { x: 900, y: 650, width: 350, height: 30 },
      { x: 1400, y: 500, width: 300, height: 30 }
    ],
    doors: [
      {
        id: 'door_courtyard_to_boss2',
        x: 0,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_root_boss',
        targetX: 2060,
        targetY: 880,
        direction: 'left'
      },
      {
        id: 'door_courtyard_to_grand_hall',
        x: 900,
        y: 0,
        width: 160,
        height: 80,
        targetRoomId: 'room_temple_grand_hall',
        targetX: 960,
        targetY: 880,
        direction: 'up'
      }
    ],
    enemies: [
      { id: 'en_court_shield', type: 'SHIELDED', x: 800, y: 900 },
      { id: 'en_court_walker', type: 'MELEE_WALKER', x: 1200, y: 900, patrolMinX: 900, patrolMaxX: 1600 }
    ]
  },

  'room_temple_grand_hall': {
    id: 'room_temple_grand_hall',
    name: "Unutilgan Ma'bad - Katta Minora (Wall Climb Gate)",
    biome: 'sanctuary',
    gridX: 7,
    gridY: 3,
    width: 1920,
    height: 1400, // Tall room!
    platforms: [
      { x: 0, y: 1280, width: 1920, height: 120 },
      { x: 0, y: 0, width: 80, height: 1400 }, // Vertical shaft wall left
      { x: 1840, y: 0, width: 80, height: 1400 }, // Vertical shaft wall right
      { x: 0, y: 0, width: 1920, height: 60 },
      // High platforms requiring Wall Climb
      { x: 300, y: 1100, width: 300, height: 30 },
      { x: 1300, y: 920, width: 300, height: 30 },
      { x: 300, y: 720, width: 300, height: 30, gateType: 'WALL_CLIMB' },
      { x: 1300, y: 520, width: 300, height: 30 },
      { x: 800, y: 320, width: 320, height: 30 }
    ],
    doors: [
      {
        id: 'door_hall_to_courtyard',
        x: 900,
        y: 1300,
        width: 160,
        height: 100,
        targetRoomId: 'room_temple_courtyard',
        targetX: 960,
        targetY: 150,
        direction: 'down'
      },
      {
        id: 'door_hall_to_shrine',
        x: 1840,
        y: 400,
        width: 80,
        height: 200,
        targetRoomId: 'room_temple_shrine',
        targetX: 120,
        targetY: 880,
        direction: 'right'
      },
      {
        id: 'door_hall_to_ascent',
        x: 900,
        y: 0,
        width: 160,
        height: 80,
        targetRoomId: 'room_temple_ascent',
        targetX: 960,
        targetY: 880,
        direction: 'up'
      }
    ],
    enemies: [
      { id: 'en_hall_flyer_1', type: 'FLYER', x: 960, y: 800 },
      { id: 'en_hall_flyer_2', type: 'FLYER', x: 960, y: 450 }
    ]
  },

  'room_temple_shrine': {
    id: 'room_temple_shrine',
    name: "Unutilgan Ma'bad - Ziyoratgoh",
    biome: 'sanctuary',
    gridX: 8,
    gridY: 3,
    width: 1920,
    height: 1080,
    platforms: [
      { x: 0, y: 960, width: 1920, height: 120 },
      { x: 0, y: 0, width: 60, height: 1080 },
      { x: 1860, y: 0, width: 60, height: 750 },
      { x: 0, y: 0, width: 1920, height: 60 },
      { x: 500, y: 800, width: 300, height: 30 }
    ],
    doors: [
      {
        id: 'door_temple_shrine_to_hall',
        x: 0,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_temple_grand_hall',
        targetX: 1750,
        targetY: 520,
        direction: 'left'
      },
      {
        id: 'door_temple_shrine_to_archives',
        x: 900,
        y: 0,
        width: 160,
        height: 80,
        targetRoomId: 'room_temple_archives',
        targetX: 960,
        targetY: 880,
        direction: 'up'
      }
    ],
    savePoint: {
      id: 'save_temple_shrine',
      x: 960,
      y: 900,
      name: "Unutilgan Ma'bad - Oltin Mehrob"
    },
    npcs: [
      {
        id: 'npc_monk_tariq',
        name: "Rohib Toriq",
        title: "Ma'bad Ruhoniysi",
        x: 500,
        y: 880,
        portrait: 'monk',
        dialogueId: 'dlg_monk_intro'
      }
    ]
  },

  'room_temple_archives': {
    id: 'room_temple_archives',
    name: "Unutilgan Ma'bad - Arxivlar",
    biome: 'sanctuary',
    gridX: 8,
    gridY: 2,
    width: 1920,
    height: 1080,
    platforms: [
      { x: 0, y: 960, width: 1920, height: 120 },
      { x: 0, y: 0, width: 60, height: 1080 },
      { x: 1860, y: 0, width: 60, height: 1080 },
      { x: 0, y: 0, width: 1920, height: 60 },
      { x: 300, y: 780, width: 350, height: 30 },
      { x: 800, y: 620, width: 350, height: 30 },
      { x: 1300, y: 460, width: 350, height: 30 }
    ],
    doors: [
      {
        id: 'door_archives_to_temple_shrine',
        x: 900,
        y: 960,
        width: 160,
        height: 80,
        targetRoomId: 'room_temple_shrine',
        targetX: 960,
        targetY: 150,
        direction: 'down'
      }
    ],
    collectibles: [
      {
        id: 'item_starfall_ore',
        type: 'QUEST_ITEM',
        name: "Yulduz Qotishmasi Rudasi",
        description: "Temirchi uchun kerakli samoviy metall parchasi.",
        x: 1400,
        y: 400
      },
      {
        id: 'item_lore_tablet_3',
        type: 'LORE_FRAGMENT',
        name: "Yorug'lik Muhrlari (III)",
        description: "To'rtta qadimiy ashyo birlashgandagina Qorong'i Yurakni tozalash mumkin...",
        x: 400,
        y: 720
      }
    ],
    enemies: [
      { id: 'en_arch_shield', type: 'SHIELDED', x: 950, y: 900 }
    ]
  },

  'room_temple_ascent': {
    id: 'room_temple_ascent',
    name: "Unutilgan Ma'bad - Cho'qqiga ko'tarilish",
    biome: 'sanctuary',
    gridX: 7,
    gridY: 2,
    width: 1920,
    height: 1080,
    platforms: [
      { x: 0, y: 960, width: 1920, height: 120 },
      { x: 0, y: 0, width: 60, height: 750 },
      { x: 1860, y: 0, width: 60, height: 750 },
      { x: 0, y: 0, width: 1920, height: 60 },
      { x: 400, y: 780, width: 280, height: 30 },
      { x: 800, y: 620, width: 280, height: 30 },
      { x: 1250, y: 460, width: 350, height: 30 },
      { x: 600, y: 930, width: 400, height: 30, isHazard: true }
    ],
    doors: [
      {
        id: 'door_ascent_to_hall',
        x: 900,
        y: 960,
        width: 160,
        height: 80,
        targetRoomId: 'room_temple_grand_hall',
        targetX: 960,
        targetY: 340,
        direction: 'down'
      },
      {
        id: 'door_ascent_to_boss',
        x: 0,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_temple_boss',
        targetX: 1960,
        targetY: 880,
        direction: 'left'
      }
    ],
    enemies: [
      { id: 'en_ascent_bruiser', type: 'ELITE_BRUISER', x: 1350, y: 900 }
    ]
  },

  'room_temple_boss': {
    id: 'room_temple_boss',
    name: "Ma'bad Posboni Maydoni (Boss 3)",
    biome: 'sanctuary',
    gridX: 6,
    gridY: 2,
    width: 2200,
    height: 1080,
    platforms: [
      { x: 0, y: 960, width: 2200, height: 120 },
      { x: 0, y: 0, width: 60, height: 750 },
      { x: 2140, y: 0, width: 60, height: 750 },
      { x: 0, y: 0, width: 2200, height: 60 },
      { x: 450, y: 750, width: 300, height: 30 },
      { x: 1450, y: 750, width: 300, height: 30 }
    ],
    doors: [
      {
        id: 'door_boss3_to_ascent',
        x: 2120,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_temple_ascent',
        targetX: 120,
        targetY: 880,
        direction: 'right'
      },
      {
        id: 'door_boss3_to_threshold',
        x: 0,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_dark_threshold',
        targetX: 1780,
        targetY: 880,
        direction: 'left'
      }
    ],
    boss: [
      {
        id: 'boss_sentinel',
        name: "Qadimiy Avtomat Posbon",
        type: 'BOSS_SENTINEL',
        x: 1600,
        y: 750,
        rewardAbility: 'wallClimb'
      }
    ]
  },

  // ==========================================
  // BIOME 4: QORONG'I YURAK (HEART OF DARKNESS)
  // ==========================================
  'room_dark_threshold': {
    id: 'room_dark_threshold',
    name: "Qorong'i Yurak - Ostonadagi Altar (Maxsus Qobilayat Q)",
    biome: 'dark_heart',
    gridX: 6,
    gridY: 1,
    width: 1920,
    height: 1080,
    platforms: [
      { x: 0, y: 960, width: 1920, height: 120 },
      { x: 0, y: 0, width: 60, height: 750 },
      { x: 1860, y: 0, width: 60, height: 750 },
      { x: 0, y: 0, width: 1920, height: 60 },
      { x: 500, y: 780, width: 300, height: 30 },
      { x: 1100, y: 780, width: 300, height: 30 }
    ],
    doors: [
      {
        id: 'door_thresh_to_boss3',
        x: 1840,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_temple_boss',
        targetX: 120,
        targetY: 880,
        direction: 'right'
      },
      {
        id: 'door_thresh_to_cracked_hall',
        x: 0,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_dark_cracked_hall',
        targetX: 1780,
        targetY: 880,
        direction: 'left'
      }
    ],
    collectibles: [
      {
        id: 'item_special_attack_altar',
        type: 'QUEST_ITEM',
        name: "Maxsus Hujum (Q) Altari",
        description: "Qadimiy spektral kuch: tosh devorlarni yoradi va og'ir zirhlarni teshib o'tadi!",
        x: 960,
        y: 880
      }
    ]
  },

  'room_dark_cracked_hall': {
    id: 'room_dark_cracked_hall',
    name: "Qorong'i Yurak - Yoriqli Tosh Devorlar",
    biome: 'dark_heart',
    gridX: 5,
    gridY: 1,
    width: 1920,
    height: 1080,
    platforms: [
      { x: 0, y: 960, width: 1920, height: 120 },
      { x: 0, y: 0, width: 60, height: 750 },
      { x: 1860, y: 0, width: 60, height: 750 },
      { x: 0, y: 0, width: 1920, height: 60 },
      // Cracked wall requiring Special Attack Q to break!
      {
        x: 900,
        y: 600,
        width: 80,
        height: 360,
        isCrackedWall: true,
        wallId: 'cracked_wall_dark_hall',
        gateType: 'SPECIAL_ATTACK'
      },
      { x: 400, y: 780, width: 250, height: 30 },
      { x: 1250, y: 780, width: 250, height: 30 }
    ],
    doors: [
      {
        id: 'door_cracked_to_thresh',
        x: 1840,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_dark_threshold',
        targetX: 120,
        targetY: 880,
        direction: 'right'
      },
      {
        id: 'door_cracked_to_shrine',
        x: 0,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_dark_shrine',
        targetX: 1780,
        targetY: 880,
        direction: 'left'
      }
    ],
    enemies: [
      { id: 'en_cracked_shield', type: 'SHIELDED', x: 600, y: 900 },
      { id: 'en_cracked_spitter', type: 'RANGED_SPITTER', x: 1350, y: 720 }
    ]
  },

  'room_dark_shrine': {
    id: 'room_dark_shrine',
    name: "Qorong'i Yurak - Oxirgi Oromgoh",
    biome: 'dark_heart',
    gridX: 4,
    gridY: 1,
    width: 1920,
    height: 1080,
    platforms: [
      { x: 0, y: 960, width: 1920, height: 120 },
      { x: 0, y: 0, width: 60, height: 750 },
      { x: 1860, y: 0, width: 60, height: 750 },
      { x: 0, y: 0, width: 1920, height: 60 },
      { x: 500, y: 780, width: 300, height: 30 }
    ],
    doors: [
      {
        id: 'door_dark_shrine_to_cracked',
        x: 1840,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_dark_cracked_hall',
        targetX: 120,
        targetY: 880,
        direction: 'right'
      },
      {
        id: 'door_dark_shrine_to_depths',
        x: 0,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_dark_depths',
        targetX: 1780,
        targetY: 880,
        direction: 'left'
      }
    ],
    savePoint: {
      id: 'save_dark_shrine',
      x: 960,
      y: 900,
      name: "Qorong'i Yurak - So'nggi Mehrob"
    },
    npcs: [
      {
        id: 'npc_blacksmith_goran',
        name: "Temirchi Go'ran",
        title: "Qadimiy Qurolsoz",
        x: 450,
        y: 880,
        portrait: 'smith',
        dialogueId: 'dlg_smith_intro'
      }
    ]
  },

  'room_dark_depths': {
    id: 'room_dark_depths',
    name: "Qorong'i Yurak - Tublik (Rival 2)",
    biome: 'dark_heart',
    gridX: 3,
    gridY: 1,
    width: 2200,
    height: 1080,
    platforms: [
      { x: 0, y: 960, width: 2200, height: 120 },
      { x: 0, y: 0, width: 60, height: 750 },
      { x: 2140, y: 0, width: 60, height: 750 },
      { x: 0, y: 0, width: 2200, height: 60 },
      { x: 450, y: 780, width: 300, height: 30 },
      { x: 1000, y: 620, width: 300, height: 30 },
      { x: 1550, y: 780, width: 300, height: 30 }
    ],
    doors: [
      {
        id: 'door_depths_to_shrine',
        x: 2120,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_dark_shrine',
        targetX: 120,
        targetY: 880,
        direction: 'right'
      },
      {
        id: 'door_depths_to_sanctum',
        x: 0,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_dark_sanctum',
        targetX: 1780,
        targetY: 880,
        direction: 'left'
      }
    ],
    enemies: [
      { id: 'rival_encounter_2', type: 'ECHO_RIVAL', x: 1100, y: 880 },
      { id: 'en_depths_bruiser', type: 'ELITE_BRUISER', x: 1600, y: 900 }
    ]
  },

  'room_dark_sanctum': {
    id: 'room_dark_sanctum',
    name: "Qorong'i Yurak - Maxfiy Yodgorlik",
    biome: 'dark_heart',
    gridX: 2,
    gridY: 1,
    width: 1920,
    height: 1080,
    platforms: [
      { x: 0, y: 960, width: 1920, height: 120 },
      { x: 0, y: 0, width: 60, height: 750 },
      { x: 1860, y: 0, width: 60, height: 750 },
      { x: 0, y: 0, width: 1920, height: 60 },
      { x: 400, y: 780, width: 300, height: 30 },
      { x: 800, y: 600, width: 320, height: 30 },
      { x: 1250, y: 440, width: 350, height: 30 }
    ],
    doors: [
      {
        id: 'door_sanctum_to_depths',
        x: 1840,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_dark_depths',
        targetX: 120,
        targetY: 880,
        direction: 'right'
      },
      {
        id: 'door_sanctum_to_approach',
        x: 0,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_dark_arena_approach',
        targetX: 1780,
        targetY: 880,
        direction: 'left'
      }
    ],
    collectibles: [
      {
        id: 'item_purification_relic',
        type: 'QUEST_ITEM',
        name: "Muqaddas Poklash Yodgorligi (True Ending)",
        description: "Zulmatni yo'q qilmay, balki o'rmon bilan birlashtirib qayta tiklaydigan qadimiy relikviya.",
        x: 1400,
        y: 380
      },
      {
        id: 'item_lore_tablet_4',
        type: 'LORE_FRAGMENT',
        name: "So'nggi Haqiqat (IV)",
        description: "Hukmdor yovuz emas edi; u shunchaki unutilgan alam va kibr qurboni bo'ldi...",
        x: 500,
        y: 720
      }
    ]
  },

  'room_dark_arena_approach': {
    id: 'room_dark_arena_approach',
    name: "Qorong'i Yurak - So'nggi Yo'lak",
    biome: 'dark_heart',
    gridX: 1,
    gridY: 1,
    width: 1920,
    height: 1080,
    platforms: [
      { x: 0, y: 960, width: 1920, height: 120 },
      { x: 0, y: 0, width: 60, height: 750 },
      { x: 1860, y: 0, width: 60, height: 750 },
      { x: 0, y: 0, width: 1920, height: 60 },
      { x: 450, y: 800, width: 300, height: 30 },
      { x: 1100, y: 800, width: 300, height: 30 }
    ],
    doors: [
      {
        id: 'door_approach_to_sanctum',
        x: 1840,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_dark_sanctum',
        targetX: 120,
        targetY: 880,
        direction: 'right'
      },
      {
        id: 'door_approach_to_boss',
        x: 0,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_dark_boss',
        targetX: 2060,
        targetY: 880,
        direction: 'left'
      }
    ],
    enemies: [
      { id: 'en_appr_bruiser', type: 'ELITE_BRUISER', x: 800, y: 900 }
    ]
  },

  'room_dark_boss': {
    id: 'room_dark_boss',
    name: "Qorong'u Hukmdor Taxti (Final Boss)",
    biome: 'dark_heart',
    gridX: 0,
    gridY: 1,
    width: 2400,
    height: 1080,
    platforms: [
      { x: 0, y: 960, width: 2400, height: 120 },
      { x: 0, y: 0, width: 60, height: 1080 },
      { x: 2340, y: 0, width: 60, height: 750 },
      { x: 0, y: 0, width: 2400, height: 60 },
      { x: 400, y: 780, width: 300, height: 30 },
      { x: 1050, y: 620, width: 300, height: 30 },
      { x: 1700, y: 780, width: 300, height: 30 }
    ],
    doors: [
      {
        id: 'door_boss4_to_approach',
        x: 2320,
        y: 750,
        width: 80,
        height: 210,
        targetRoomId: 'room_dark_arena_approach',
        targetX: 120,
        targetY: 880,
        direction: 'right'
      }
    ],
    boss: [
      {
        id: 'boss_sovereign',
        name: "Qoraygan Yurak Hukmdori (Corrupted Sovereign)",
        type: 'BOSS_SOVEREIGN',
        x: 1200,
        y: 720
      }
    ]
  }
};
