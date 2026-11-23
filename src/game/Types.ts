export type BiomeType = 'forest' | 'caverns' | 'sanctuary' | 'dark_heart';

export type GateType = 'DOUBLE_JUMP' | 'DASH' | 'WALL_CLIMB' | 'SPECIAL_ATTACK';

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  isOneWay?: boolean;
  isHazard?: boolean;
  isCrackedWall?: boolean;
  wallId?: string;
  gateType?: GateType;
}

export interface RoomDoor {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  targetRoomId: string;
  targetX: number;
  targetY: number;
  direction: 'left' | 'right' | 'up' | 'down';
  requiredGate?: GateType;
}

export interface SavePointData {
  id: string;
  x: number;
  y: number;
  name: string;
}

export interface CollectibleData {
  id: string;
  type: 'HP_UPGRADE' | 'ENERGY_UPGRADE' | 'LORE_FRAGMENT' | 'QUEST_ITEM';
  name: string;
  description: string;
  x: number;
  y: number;
  collected?: boolean;
}

export interface NPCData {
  id: string;
  name: string;
  title: string;
  x: number;
  y: number;
  portrait: string;
  dialogueId: string;
}

export interface EnemySpawnData {
  id: string;
  type: 
    | 'MELEE_WALKER' 
    | 'FLYER' 
    | 'RANGED_SPITTER' 
    | 'CHARGER' 
    | 'SHIELDED' 
    | 'AMBUSHER' 
    | 'SPAWNER_HAZARD' 
    | 'ELITE_BRUISER'
    | 'ECHO_RIVAL';
  x: number;
  y: number;
  patrolMinX?: number;
  patrolMaxX?: number;
}

export interface BossSpawnData {
  id: string;
  name: string;
  type: 'BOSS_TREANT' | 'BOSS_BEHEMOTH' | 'BOSS_SENTINEL' | 'BOSS_SOVEREIGN';
  x: number;
  y: number;
  rewardAbility?: 'doubleJump' | 'dash' | 'wallClimb' | 'specialAttack';
}

export interface RoomDefinition {
  id: string;
  name: string;
  biome: BiomeType;
  gridX: number; // For World Map display (0-10)
  gridY: number; // For World Map display (0-10)
  width: number;
  height: number;
  platforms: Platform[];
  doors: RoomDoor[];
  savePoint?: SavePointData;
  collectibles?: CollectibleData[];
  npcs?: NPCData[];
  enemies?: EnemySpawnData[];
  boss?: BossSpawnData[];
}
