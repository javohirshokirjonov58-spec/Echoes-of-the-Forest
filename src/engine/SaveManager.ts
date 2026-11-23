export interface PlayerStatsData {
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
}

export interface PlayerAbilitiesData {
  doubleJump: boolean;
  dash: boolean;
  wallClimb: boolean;
  specialAttack: boolean;
}

export interface SaveData {
  save_version: number;
  slot_id: number;
  timestamp: number;
  play_time: number; // total seconds played
  room_id: string;
  respawn_x: number;
  respawn_y: number;
  stats: PlayerStatsData;
  abilities: PlayerAbilitiesData;
  defeated_bosses: string[];
  defeated_echo_rivals: string[];
  opened_gates: string[];
  broken_walls: string[];
  pulled_levers: string[];
  discovered_rooms: string[];
  collected_items: string[];
  quests: Record<string, 'LOCKED' | 'ACTIVE' | 'COMPLETED' | 'FAILED'>;
  dialogue_flags: Record<string, boolean>;
  achievements: string[];
}

export const CURRENT_SAVE_VERSION = 2;

export class SaveManager {
  private static readonly KEY_PREFIX = 'echoes_save_slot_';

  public static createDefaultSave(slotId: number = 1): SaveData {
    return {
      save_version: CURRENT_SAVE_VERSION,
      slot_id: slotId,
      timestamp: Date.now(),
      play_time: 0,
      room_id: 'room_grove_entrance',
      respawn_x: 200,
      respawn_y: 800,
      stats: {
        hp: 100,
        maxHp: 100,
        energy: 100,
        maxEnergy: 100
      },
      abilities: {
        doubleJump: false,
        dash: false,
        wallClimb: false,
        specialAttack: false
      },
      defeated_bosses: [],
      defeated_echo_rivals: [],
      opened_gates: [],
      broken_walls: [],
      pulled_levers: [],
      discovered_rooms: ['room_grove_entrance'],
      collected_items: [],
      quests: {
        quest_forest_call: 'ACTIVE'
      },
      dialogue_flags: {},
      achievements: []
    };
  }

  // Atomic write with backup
  public static saveGame(data: SaveData): boolean {
    try {
      data.save_version = CURRENT_SAVE_VERSION;
      data.timestamp = Date.now();
      const serialized = JSON.stringify(data);
      const slotKey = `${this.KEY_PREFIX}${data.slot_id}`;
      const tempKey = `${slotKey}_temp`;
      const bakKey = `${slotKey}_bak`;

      // 1. Write to temp key
      localStorage.setItem(tempKey, serialized);

      // 2. Backup existing
      const existing = localStorage.getItem(slotKey);
      if (existing) {
        localStorage.setItem(bakKey, existing);
      }

      // 3. Commit
      localStorage.setItem(slotKey, serialized);
      localStorage.removeItem(tempKey);

      return true;
    } catch (e) {
      console.error('Failed to save game atomically', e);
      return false;
    }
  }

  public static loadGame(slotId: number): SaveData | null {
    const slotKey = `${this.KEY_PREFIX}${slotId}`;
    const bakKey = `${slotKey}_bak`;

    let raw = localStorage.getItem(slotKey);
    if (!raw) {
      raw = localStorage.getItem(bakKey);
    }
    if (!raw) return null;

    try {
      const data = JSON.parse(raw);
      return this.migrateSaveData(data, slotId);
    } catch (e) {
      console.error(`Corrupt save file in slot ${slotId}, trying backup`, e);
      try {
        const bakRaw = localStorage.getItem(bakKey);
        if (bakRaw) {
          const bakData = JSON.parse(bakRaw);
          return this.migrateSaveData(bakData, slotId);
        }
      } catch (err) {}
      return null;
    }
  }

  public static hasSave(slotId: number): boolean {
    return localStorage.getItem(`${this.KEY_PREFIX}${slotId}`) !== null;
  }

  public static deleteSave(slotId: number): void {
    localStorage.removeItem(`${this.KEY_PREFIX}${slotId}`);
    localStorage.removeItem(`${this.KEY_PREFIX}${slotId}_bak`);
  }

  // Save migration pipeline
  private static migrateSaveData(data: any, slotId: number): SaveData {
    const def = this.createDefaultSave(slotId);
    const ver = data.save_version ?? 1;

    if (ver < 2) {
      // Migration from v1 to v2: ensure achievements and dialogue flags
      data.achievements = data.achievements ?? [];
      data.dialogue_flags = data.dialogue_flags ?? {};
      data.broken_walls = data.broken_walls ?? [];
      data.pulled_levers = data.pulled_levers ?? [];
      data.save_version = 2;
    }

    // Merge missing fields with default
    return {
      save_version: CURRENT_SAVE_VERSION,
      slot_id: data.slot_id ?? slotId,
      timestamp: data.timestamp ?? Date.now(),
      play_time: data.play_time ?? 0,
      room_id: data.room_id ?? def.room_id,
      respawn_x: data.respawn_x ?? def.respawn_x,
      respawn_y: data.respawn_y ?? def.respawn_y,
      stats: {
        hp: data.stats?.hp ?? def.stats.hp,
        maxHp: data.stats?.maxHp ?? def.stats.maxHp,
        energy: data.stats?.energy ?? def.stats.energy,
        maxEnergy: data.stats?.maxEnergy ?? def.stats.maxEnergy
      },
      abilities: {
        doubleJump: data.abilities?.doubleJump ?? false,
        dash: data.abilities?.dash ?? false,
        wallClimb: data.abilities?.wallClimb ?? false,
        specialAttack: data.abilities?.specialAttack ?? false
      },
      defeated_bosses: data.defeated_bosses ?? [],
      defeated_echo_rivals: data.defeated_echo_rivals ?? [],
      opened_gates: data.opened_gates ?? [],
      broken_walls: data.broken_walls ?? [],
      pulled_levers: data.pulled_levers ?? [],
      discovered_rooms: data.discovered_rooms ?? def.discovered_rooms,
      collected_items: data.collected_items ?? [],
      quests: data.quests ?? def.quests,
      dialogue_flags: data.dialogue_flags ?? {},
      achievements: data.achievements ?? []
    };
  }
}
