import { InputManager } from './engine/InputManager';
import { Sound } from './engine/AudioManager';
import { Camera } from './engine/Camera';
import { SaveManager, SaveData } from './engine/SaveManager';
import { WORLD_ROOMS } from './game/WorldData';
import { RoomDefinition, RoomDoor } from './game/Types';
import { Player } from './game/Player';
import { CombatSystem } from './game/CombatSystem';
import { DuelBot, BotDifficulty } from './game/DuelBot';
import { Enemy, Projectile } from './game/Enemies';
import { Boss } from './game/Bosses';
import { QuestSystem } from './game/QuestSystem';
import { DialogueSystem } from './game/DialogueSystem';
import { Achievements } from './game/Achievements';
import { Particles } from './render/Particles';
import { WorldRenderer } from './render/WorldRenderer';
import { UIRenderer } from './render/UIRenderer';
import { WorldMap } from './render/MapRenderer';
import { Physics } from './game/Physics';

export type GameState = 
  | 'TITLE_MENU' 
  | 'SLOT_SELECT' 
  | 'DUEL_ARENA_SELECT' 
  | 'SETTINGS' 
  | 'ACHIEVEMENTS_VIEW' 
  | 'PLAYING' 
  | 'PAUSED' 
  | 'MAP_VIEW' 
  | 'QUEST_LOG_VIEW' 
  | 'INVENTORY_VIEW' 
  | 'ENDING';

class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private input: InputManager;
  private camera: Camera;
  private quests: QuestSystem;
  private dialogue: DialogueSystem;

  public state: GameState = 'TITLE_MENU';
  public currentSlot: number = 1;

  // Active World State
  public currentRoomId: string = 'room_grove_entrance';
  public currentRoom: RoomDefinition = WORLD_ROOMS['room_grove_entrance'];
  public player: Player;
  public enemies: Enemy[] = [];
  public bosses: Boss[] = [];
  public duelBot: DuelBot | null = null;
  public projectiles: Projectile[] = [];

  // Persistence tracking
  public discoveredRooms: Set<string> = new Set(['room_grove_entrance']);
  public brokenWalls: Set<string> = new Set();
  public defeatedBosses: Set<string> = new Set();
  public defeatedEchoRivals: Set<string> = new Set();
  public collectedItems: Set<string> = new Set();

  public lastSavePointX: number = 200;
  public lastSavePointY: number = 800;
  public lastSaveRoomId: string = 'room_grove_entrance';
  public saveConfirmTimer: number = 0;

  // Title / Menu selection indices
  public titleMenuIndex: number = 0;
  public settingsMenuIndex: number = 0;
  public duelDifficultyIndex: number = 1; // 0: apprentice, 1: master, 2: expert
  public isTrueEndingAchieved: boolean = false;

  // Timers
  private lastTime: number = 0;
  public gamePlayTimeSeconds: number = 0;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.canvas.width = 1920;
    this.canvas.height = 1080;
    this.ctx = this.canvas.getContext('2d', { alpha: false })!;
    this.ctx.imageSmoothingEnabled = false;

    this.input = new InputManager();
    this.camera = new Camera(1920, 1080);
    this.quests = new QuestSystem();
    this.dialogue = new DialogueSystem();
    this.player = new Player(200, 800);

    this.setupWindowEvents();
    this.setupDialogueCallbacks();

    // Remove loading overlay
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 500);
    }

    // Start loop
    this.lastTime = performance.now();
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  private setupWindowEvents(): void {
    window.addEventListener('click', () => {
      Sound.unlockAudio();
    });

    window.addEventListener('keydown', () => {
      Sound.unlockAudio();
    });
  }

  private setupDialogueCallbacks(): void {
    this.dialogue.onDialogueComplete = (nodeId: string) => {
      if (nodeId === 'dlg_elder_farewell') {
        this.quests.setQuestStatus('quest_forest_call', 'ACTIVE');
      } else if (nodeId === 'dlg_herbalist_accept') {
        this.quests.setQuestStatus('quest_lost_herbs', 'ACTIVE');
      } else if (nodeId === 'dlg_monk_farewell') {
        this.quests.setQuestStatus('quest_sanctuary_secrets', 'ACTIVE');
      } else if (nodeId === 'dlg_smith_upgrade') {
        this.quests.setQuestStatus('quest_starfall_ore', 'COMPLETED');
        this.player.maxHp += 20;
        this.player.hp += 20;
        Sound.playItemFanfare();
      } else if (nodeId === 'dlg_ending_normal') {
        this.triggerGameEnding(false);
      } else if (nodeId === 'dlg_ending_true') {
        this.triggerGameEnding(true);
      }
    };
  }

  // ===================== ROOM TRANSITIONS =====================
  public changeRoom(roomId: string, targetX: number, targetY: number): void {
    const nextRoom = WORLD_ROOMS[roomId];
    if (!nextRoom) return;

    this.currentRoomId = roomId;
    this.currentRoom = nextRoom;
    this.discoveredRooms.add(roomId);

    if (this.discoveredRooms.size === Object.keys(WORLD_ROOMS).length) {
      Achievements.unlock('ach_cartographer');
    }

    // Set player position
    this.player.x = targetX;
    this.player.y = targetY;
    this.player.vx = 0;
    this.player.vy = 0;

    // Set camera bounds & snap
    this.camera.setBounds({
      x: 0,
      y: 0,
      width: nextRoom.width,
      height: nextRoom.height
    });
    this.camera.snapTo(targetX, targetY);

    // Switch music according to biome
    if (nextRoom.boss && nextRoom.boss.length > 0 && !this.defeatedBosses.has(nextRoom.boss[0].id)) {
      Sound.playBGM('boss');
    } else {
      Sound.playBGM(nextRoom.biome);
    }

    // Spawn Room Entities
    this.spawnRoomEntities();
  }

  private spawnRoomEntities(): void {
    this.enemies = [];
    this.bosses = [];
    this.duelBot = null;
    this.projectiles = [];

    // Spawn standard enemies
    if (this.currentRoom.enemies) {
      for (const e of this.currentRoom.enemies) {
        if (e.type === 'ECHO_RIVAL') {
          if (!this.defeatedEchoRivals.has(e.id)) {
            // Spawn Echo Rival!
            this.duelBot = new DuelBot(e.x, e.y, 'master');
          }
        } else {
          const enemy = new Enemy(e.id, e.type, e.x, e.y, e.patrolMinX, e.patrolMaxX);
          enemy.onSpawnProjectile = (p: Projectile) => this.projectiles.push(p);
          this.enemies.push(enemy);
        }
      }
    }

    // Spawn Boss (if not already defeated)
    if (this.currentRoom.boss && this.currentRoom.boss.length > 0) {
      const bData = this.currentRoom.boss[0];
      if (!this.defeatedBosses.has(bData.id)) {
        const boss = new Boss(bData.id, bData.name, bData.type, bData.x, bData.y, bData.rewardAbility);
        boss.onSpawnProjectile = (p: Projectile) => this.projectiles.push(p);
        this.bosses.push(boss);
      }
    }
  }

  // ===================== SAVE / LOAD =====================
  public saveCurrentGame(): void {
    this.lastSavePointX = this.player.x;
    this.lastSavePointY = this.player.y;
    this.lastSaveRoomId = this.currentRoomId;

    const data: SaveData = {
      save_version: 2,
      slot_id: this.currentSlot,
      timestamp: Date.now(),
      play_time: this.gamePlayTimeSeconds,
      room_id: this.currentRoomId,
      respawn_x: this.player.x,
      respawn_y: this.player.y,
      stats: {
        hp: this.player.hp,
        maxHp: this.player.maxHp,
        energy: this.player.energy,
        maxEnergy: this.player.maxEnergy
      },
      abilities: {
        doubleJump: this.player.hasDoubleJump,
        dash: this.player.hasDash,
        wallClimb: this.player.hasWallClimb,
        specialAttack: this.player.hasSpecialAttack
      },
      defeated_bosses: Array.from(this.defeatedBosses),
      defeated_echo_rivals: Array.from(this.defeatedEchoRivals),
      opened_gates: [],
      broken_walls: Array.from(this.brokenWalls),
      pulled_levers: [],
      discovered_rooms: Array.from(this.discoveredRooms),
      collected_items: Array.from(this.collectedItems),
      quests: this.quests.getExportData(),
      dialogue_flags: {},
      achievements: Achievements.getUnlockedList()
    };

    SaveManager.saveGame(data);
    this.saveConfirmTimer = 2.5;
    Sound.playSaveChime();
  }

  public loadGameSlot(slotId: number): void {
    const data = SaveManager.loadGame(slotId);
    if (!data) return;

    this.currentSlot = slotId;
    this.gamePlayTimeSeconds = data.play_time;
    this.player.hp = data.stats.hp;
    this.player.maxHp = data.stats.maxHp;
    this.player.energy = data.stats.energy;
    this.player.maxEnergy = data.stats.maxEnergy;

    this.player.hasDoubleJump = data.abilities.doubleJump;
    this.player.hasDash = data.abilities.dash;
    this.player.hasWallClimb = data.abilities.wallClimb;
    this.player.hasSpecialAttack = data.abilities.specialAttack;

    this.defeatedBosses = new Set(data.defeated_bosses);
    this.defeatedEchoRivals = new Set(data.defeated_echo_rivals);
    this.brokenWalls = new Set(data.broken_walls);
    this.discoveredRooms = new Set(data.discovered_rooms);
    this.collectedItems = new Set(data.collected_items);

    this.quests.loadFromData(data.quests);
    Achievements.loadUnlockedList(data.achievements);

    this.changeRoom(data.room_id, data.respawn_x, data.respawn_y);
    this.state = 'PLAYING';
  }

  public startNewGame(slotId: number = 1): void {
    this.currentSlot = slotId;
    this.gamePlayTimeSeconds = 0;
    this.player = new Player(200, 800);
    this.discoveredRooms = new Set(['room_grove_entrance']);
    this.brokenWalls.clear();
    this.defeatedBosses.clear();
    this.defeatedEchoRivals.clear();
    this.collectedItems.clear();

    this.changeRoom('room_grove_entrance', 200, 800);
    this.state = 'PLAYING';
    Sound.playBGM('forest');
  }

  public startDuelArena(difficulty: BotDifficulty): void {
    this.currentRoomId = 'room_training_shrine';
    this.currentRoom = WORLD_ROOMS['room_training_shrine'];
    this.player = new Player(300, 800);
    this.player.hasDoubleJump = true;
    this.player.hasDash = true;
    this.player.hasWallClimb = true;
    this.player.hasSpecialAttack = true;

    this.duelBot = new DuelBot(1400, 800, difficulty);
    this.enemies = [];
    this.bosses = [];
    this.projectiles = [];

    this.camera.setBounds({ x: 0, y: 0, width: 1920, height: 1080 });
    this.camera.snapTo(960, 540);

    this.state = 'PLAYING';
    Sound.playBGM('duel');
  }

  public triggerGameEnding(isTrueEnding: boolean): void {
    this.isTrueEndingAchieved = isTrueEnding;
    this.state = 'ENDING';
    if (isTrueEnding) {
      Achievements.unlock('ach_true_savior');
    } else {
      Achievements.unlock('ach_boss_slayer');
    }
  }

  // ===================== MAIN GAME LOOP =====================
  private gameLoop(time: number): void {
    const dt = Math.min(0.1, (time - this.lastTime) / 1000);
    this.lastTime = time;

    this.input.update(dt);
    this.quests.update(dt);
    Achievements.update(dt);
    Particles.update(dt);

    if (this.saveConfirmTimer > 0) {
      this.saveConfirmTimer -= dt;
    }

    // Route updates by game state
    switch (this.state) {
      case 'TITLE_MENU':
        this.updateTitleMenu();
        this.renderTitleMenu();
        break;
      case 'SLOT_SELECT':
        this.updateSlotSelectMenu();
        this.renderSlotSelectMenu();
        break;
      case 'DUEL_ARENA_SELECT':
        this.updateDuelArenaMenu();
        this.renderDuelArenaMenu();
        break;
      case 'SETTINGS':
        this.updateSettingsMenu();
        this.renderSettingsMenu();
        break;
      case 'ACHIEVEMENTS_VIEW':
        this.updateAchievementsView();
        this.renderAchievementsView();
        break;
      case 'PLAYING':
        this.updatePlaying(dt);
        this.renderPlaying();
        break;
      case 'PAUSED':
        this.updatePaused();
        this.renderPaused();
        break;
      case 'MAP_VIEW':
        this.updateMapView();
        this.renderMapView();
        break;
      case 'QUEST_LOG_VIEW':
        this.updateQuestLogView();
        UIRenderer.renderQuestLog(this.ctx, this.quests);
        break;
      case 'INVENTORY_VIEW':
        this.updateInventoryView();
        UIRenderer.renderInventoryAndLore(this.ctx, this.player, this.collectedItems);
        break;
      case 'ENDING':
        this.updateEndingView();
        UIRenderer.renderEndingScreen(
          this.ctx,
          this.isTrueEndingAchieved,
          this.gamePlayTimeSeconds,
          this.discoveredRooms.size,
          Object.keys(WORLD_ROOMS).length,
          this.defeatedBosses.size,
          () => { this.state = 'TITLE_MENU'; }
        );
        break;
    }

    this.input.endFrame();
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  // ===================== PLAYING STATE =====================
  private updatePlaying(dt: number): void {
    this.gamePlayTimeSeconds += dt;

    // Check Pause / Map / Inventory toggles
    if (this.input.isActionJustPressed('MENU')) {
      this.state = 'PAUSED';
      Sound.playUIClick();
      return;
    }

    if (this.input.isActionJustPressed('MAP')) {
      this.state = 'MAP_VIEW';
      Sound.playUIClick();
      return;
    }

    // If dialogue is active, handle dialogue inputs
    if (this.dialogue.isActive) {
      this.dialogue.update(dt);
      if (this.input.isActionJustPressed('INTERACT') || this.input.isActionJustPressed('JUMP')) {
        this.dialogue.skipOrAdvance();
        Sound.playUIClick();
      } else if (this.input.isActionJustPressed('UP')) {
        this.dialogue.selectPrevChoice();
        Sound.playUIClick();
      } else if (this.input.isActionJustPressed('DOWN')) {
        this.dialogue.selectNextChoice();
        Sound.playUIClick();
      }
      return; // Freeze game action while dialogue is up
    }

    // Update Player
    this.player.update(dt, this.input, this.currentRoom.platforms, this.brokenWalls, this.camera);

    // Player Checkpoint Fall Recovery:
    // If player falls below room bounds, respawn at last safe room location!
    if (this.player.y > this.currentRoom.height + 100) {
      this.player.takeDamage(20, 0, -200);
      this.player.x = 200;
      this.player.y = 800;
      this.player.vx = 0;
      this.player.vy = 0;
    }

    // Update Enemies
    for (const enemy of this.enemies) {
      enemy.update(dt, this.player, this.currentRoom.platforms, this.brokenWalls);
    }

    // Update Bosses
    for (const boss of this.bosses) {
      boss.update(dt, this.player, this.camera);

      // Check Boss Defeat
      if (boss.isDead && !this.defeatedBosses.has(boss.id)) {
        this.defeatedBosses.add(boss.id);
        Sound.playItemFanfare();

        // Unlock boss ability rewards!
        if (boss.rewardAbility === 'doubleJump') {
          this.player.hasDoubleJump = true;
          this.quests.showToast("YANGI QOBILIYAT: Double Jump (Ikki marta sakrash)!");
          Achievements.unlock('ach_double_jump');
        } else if (boss.rewardAbility === 'dash') {
          this.player.hasDash = true;
          this.quests.showToast("YANGI QOBILIYAT: Dash (Shamol siljishi)!");
          Achievements.unlock('ach_dash');
        } else if (boss.rewardAbility === 'wallClimb') {
          this.player.hasWallClimb = true;
          this.quests.showToast("YANGI QOBILIYAT: Wall Climb (Devorga tirmashish)!");
          Achievements.unlock('ach_wall_climb');
        }

        // Final boss defeat trigger
        if (boss.type === 'BOSS_SOVEREIGN') {
          // Open final dialogue
          this.dialogue.startDialogue('dlg_final_choice');
        }
      }
    }

    // Update Duel Bot
    if (this.duelBot) {
      this.duelBot.update(dt, this.player, this.currentRoom.platforms, this.brokenWalls, this.camera);

      // Check Duel Bot defeat
      if (this.duelBot.playerBody.hp <= 0) {
        if (this.duelBot.difficulty === 'expert') {
          Achievements.unlock('ach_flawless_duelist');
        }
      }
    }

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Check hit against player
      if (p.isHostile && !this.player.isInvincible) {
        const dx = p.x - (this.player.x + this.player.width / 2);
        const dy = p.y - (this.player.y + this.player.height / 2);
        if (Math.hypot(dx, dy) < p.radius + 20) {
          this.player.takeDamage(p.damage, p.vx * 0.5, -150);
          this.projectiles.splice(i, 1);
          continue;
        }
      }
    }

    // Combat System Interactions (Hitboxes, Clash, Perfect Dodge, Wall breaking)
    const combatTargets = [...this.enemies, ...this.bosses];
    if (this.duelBot) {
      combatTargets.push(this.duelBot as any);
    }

    CombatSystem.checkCombatInteractions(
      this.player,
      combatTargets,
      this.currentRoom.platforms,
      this.brokenWalls,
      this.camera,
      (wallId: string) => {
        Achievements.unlock('ach_special_attack');
      }
    );

    // Collectibles & Interaction checks
    this.checkInteractions();

    // Check Doors
    this.checkDoors();

    // Update Camera
    this.camera.update(
      dt, 
      this.player.x + this.player.width / 2, 
      this.player.y + this.player.height / 2, 
      this.player.facingRight, 
      this.player.vx
    );
  }

  private checkInteractions(): void {
    // 1. Save Point check
    if (this.currentRoom.savePoint) {
      const sp = this.currentRoom.savePoint;
      const dist = Math.hypot(this.player.x + this.player.width / 2 - sp.x, this.player.y + this.player.height / 2 - sp.y);
      if (dist < 100 && this.input.isActionJustPressed('INTERACT')) {
        // Full heal & save
        this.player.hp = this.player.maxHp;
        this.player.energy = this.player.maxEnergy;
        this.saveCurrentGame();
      }
    }

    // 2. NPC Dialogue check
    if (this.currentRoom.npcs) {
      for (const npc of this.currentRoom.npcs) {
        const dist = Math.hypot(this.player.x + this.player.width / 2 - npc.x, this.player.y + this.player.height / 2 - npc.y);
        if (dist < 110 && this.input.isActionJustPressed('INTERACT')) {
          this.dialogue.startDialogue(npc.dialogueId);
          Sound.playUIClick();
          break;
        }
      }
    }

    // 3. Collectibles check
    if (this.currentRoom.collectibles) {
      for (const c of this.currentRoom.collectibles) {
        if (this.collectedItems.has(c.id)) continue;
        const dist = Math.hypot(this.player.x + this.player.width / 2 - c.x, this.player.y + this.player.height / 2 - c.y);
        if (dist < 60) {
          this.collectedItems.add(c.id);
          Sound.playItemFanfare();
          this.quests.showToast(`TOPILDI: ${c.name}!`);

          if (c.type === 'HP_UPGRADE') {
            this.player.maxHp += 20;
            this.player.hp += 20;
          } else if (c.type === 'ENERGY_UPGRADE') {
            this.player.maxEnergy += 20;
            this.player.energy += 20;
          } else if (c.type === 'LORE_FRAGMENT') {
            this.quests.incrementLoreProgress();
            if (this.quests.getQuest('quest_ancient_inscriptions')?.status === 'COMPLETED') {
              Achievements.unlock('ach_lorekeeper');
            }
          } else if (c.id === 'item_special_attack_altar') {
            this.player.hasSpecialAttack = true;
            Achievements.unlock('ach_special_attack');
            this.quests.showToast("YANGI QOBILIYAT: Special Attack (Q)!");
          }
        }
      }
    }
  }

  private checkDoors(): void {
    const pBox = {
      x: this.player.x,
      y: this.player.y,
      width: this.player.width,
      height: this.player.height
    };

    for (const d of this.currentRoom.doors) {
      if (Physics.checkAABB(pBox, d)) {
        // Ability Gate checks on doors
        if (d.requiredGate === 'DOUBLE_JUMP' && !this.player.hasDoubleJump) continue;
        if (d.requiredGate === 'DASH' && !this.player.hasDash) continue;
        if (d.requiredGate === 'WALL_CLIMB' && !this.player.hasWallClimb) continue;
        if (d.requiredGate === 'SPECIAL_ATTACK' && !this.player.hasSpecialAttack) continue;

        // Perform Room Transition!
        this.changeRoom(d.targetRoomId, d.targetX, d.targetY);
        break;
      }
    }
  }

  private renderPlaying(): void {
    // 1. Render World & Entities
    WorldRenderer.renderWorld(
      this.ctx,
      this.currentRoom,
      this.camera,
      this.player,
      this.enemies,
      this.bosses,
      this.duelBot,
      this.projectiles,
      this.brokenWalls,
      this.collectedItems,
      this.gamePlayTimeSeconds
    );

    // 2. Render Particles
    this.ctx.save();
    this.ctx.translate(-this.camera.x + this.camera.shakeOffsetX, -this.camera.y + this.camera.shakeOffsetY);
    Particles.render(this.ctx);
    this.ctx.restore();

    // 3. Render HUD
    UIRenderer.renderGameplayHUD(
      this.ctx,
      this.player,
      this.quests,
      Achievements,
      this.input,
      this.saveConfirmTimer
    );

    // 4. Render Boss HUD (if active)
    for (const b of this.bosses) {
      if (!b.isDead) {
        UIRenderer.renderBossHUD(this.ctx, b);
        break;
      }
    }

    // 5. Render Minimap in top right corner
    WorldMap.renderMinimap(
      this.ctx,
      1920 - 180,
      40,
      this.currentRoomId,
      this.discoveredRooms
    );

    // 6. Render Dialogue Overlay (if active)
    if (this.dialogue.isActive) {
      UIRenderer.renderDialogue(this.ctx, this.dialogue);
    }
  }

  // ===================== TITLE & SUB-MENUS =====================
  private updateTitleMenu(): void {
    const hasAnySave = SaveManager.hasSave(1) || SaveManager.hasSave(2) || SaveManager.hasSave(3);
    const optionsCount = 6;

    if (this.input.isActionJustPressed('UP')) {
      this.titleMenuIndex = (this.titleMenuIndex - 1 + optionsCount) % optionsCount;
      Sound.playUIClick();
    } else if (this.input.isActionJustPressed('DOWN')) {
      this.titleMenuIndex = (this.titleMenuIndex + 1) % optionsCount;
      Sound.playUIClick();
    }

    if (this.input.isActionJustPressed('JUMP') || this.input.isActionJustPressed('INTERACT')) {
      Sound.playUIClick();
      switch (this.titleMenuIndex) {
        case 0: // Continue
          if (hasAnySave) {
            this.loadGameSlot(1);
          } else {
            this.startNewGame(1);
          }
          break;
        case 1: // New Game
          this.startNewGame(1);
          break;
        case 2: // Load Slot
          this.state = 'SLOT_SELECT';
          break;
        case 3: // Duel Arena (1v1 AI Bot)
          this.state = 'DUEL_ARENA_SELECT';
          break;
        case 4: // Settings
          this.state = 'SETTINGS';
          break;
        case 5: // Achievements
          this.state = 'ACHIEVEMENTS_VIEW';
          break;
      }
    }
  }

  private renderTitleMenu(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, 1920, 1080);

    // Title Logo
    ctx.font = "900 68px 'Cinzel', serif";
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 30;
    ctx.textAlign = 'center';
    ctx.fillText("ECHOES OF THE FOREST", 960, 320);

    ctx.font = "bold 24px 'Rajdhani', sans-serif";
    ctx.fillStyle = '#94a3b8';
    ctx.shadowBlur = 0;
    ctx.fillText("2D Metroidvania / Action-Adventure", 960, 375);

    // Menu options
    const items = [
      "DAVOM ETTIRISH (CONTINUE)",
      "YANGI O'YIN (NEW GAME)",
      "SAQLANGANLAR (LOAD SLOT)",
      "1v1 JANGCHI BOT ARENASI (DUEL ARENA)",
      "SOZLAMALAR (SETTINGS)",
      "YUTUQLAR (ACHIEVEMENTS)"
    ];

    const startY = 480;
    items.forEach((item, idx) => {
      const isSelected = idx === this.titleMenuIndex;
      ctx.fillStyle = isSelected ? '#38bdf8' : '#64748b';
      ctx.font = isSelected ? "bold 26px 'Rajdhani', sans-serif" : "22px 'Rajdhani', sans-serif";
      if (isSelected) {
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 14;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.fillText(`${isSelected ? '▶ ' : '  '}${item}`, 960, startY + idx * 56);
    });

    ctx.font = "16px 'Rajdhani', sans-serif";
    ctx.fillStyle = '#475569';
    ctx.shadowBlur = 0;
    ctx.fillText("Boshqaruv: [W/S] Tanlash, [Space/Enter] Kirish", 960, 960);

    ctx.restore();
  }

  private updateSlotSelectMenu(): void {
    if (this.input.isActionJustPressed('UP') || this.input.isActionJustPressed('DOWN')) {
      this.currentSlot = this.currentSlot === 1 ? 2 : this.currentSlot === 2 ? 3 : 1;
      Sound.playUIClick();
    }
    if (this.input.isActionJustPressed('JUMP') || this.input.isActionJustPressed('INTERACT')) {
      Sound.playUIClick();
      if (SaveManager.hasSave(this.currentSlot)) {
        this.loadGameSlot(this.currentSlot);
      } else {
        this.startNewGame(this.currentSlot);
      }
    }
    if (this.input.isActionJustPressed('MENU')) {
      this.state = 'TITLE_MENU';
      Sound.playUIClick();
    }
  }

  private renderSlotSelectMenu(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, 1920, 1080);

    ctx.font = "bold 44px 'Cinzel', serif";
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText("SAQLASH SLOTINI TANLASH (LOAD SLOT)", 960, 180);

    [1, 2, 3].forEach((slotId) => {
      const isCur = slotId === this.currentSlot;
      const sy = 320 + (slotId - 1) * 160;
      const save = SaveManager.loadGame(slotId);

      ctx.fillStyle = isCur ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.7)';
      ctx.strokeStyle = isCur ? '#38bdf8' : '#334155';
      ctx.lineWidth = isCur ? 3 : 1.5;
      ctx.fillRect(560, sy, 800, 120);
      ctx.strokeRect(560, sy, 800, 120);

      ctx.font = "bold 24px 'Rajdhani', sans-serif";
      ctx.fillStyle = isCur ? '#38bdf8' : '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(`Slot #${slotId}`, 600, sy + 45);

      if (save) {
        const mins = Math.floor(save.play_time / 60);
        ctx.font = "18px 'Rajdhani', sans-serif";
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`Xona: ${save.room_id} | Vaqt: ${mins} daqiqa | Xaritalar: ${save.discovered_rooms.length}`, 600, sy + 80);
      } else {
        ctx.font = "18px 'Rajdhani', sans-serif";
        ctx.fillStyle = '#64748b';
        ctx.fillText("[BO'SH SLOT - YANGI O'YIN BOSHLASH]", 600, sy + 80);
      }
    });

    ctx.font = "16px 'Rajdhani', sans-serif";
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText("[Esc] — Ortga qaytish", 960, 960);
    ctx.restore();
  }

  private updateDuelArenaMenu(): void {
    if (this.input.isActionJustPressed('LEFT')) {
      this.duelDifficultyIndex = (this.duelDifficultyIndex - 1 + 3) % 3;
      Sound.playUIClick();
    } else if (this.input.isActionJustPressed('RIGHT')) {
      this.duelDifficultyIndex = (this.duelDifficultyIndex + 1) % 3;
      Sound.playUIClick();
    }

    if (this.input.isActionJustPressed('JUMP') || this.input.isActionJustPressed('INTERACT')) {
      Sound.playUIClick();
      const diff: BotDifficulty = this.duelDifficultyIndex === 0 ? 'apprentice' :
                                  this.duelDifficultyIndex === 1 ? 'master' : 'expert';
      this.startDuelArena(diff);
    }

    if (this.input.isActionJustPressed('MENU')) {
      this.state = 'TITLE_MENU';
      Sound.playUIClick();
    }
  }

  private renderDuelArenaMenu(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, 1920, 1080);

    ctx.font = "bold 44px 'Cinzel', serif";
    ctx.fillStyle = '#c084fc';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 18;
    ctx.textAlign = 'center';
    ctx.fillText("1v1 REALISTIK JANGCHI BOT ARENASI", 960, 200);

    ctx.font = "20px 'Rajdhani', sans-serif";
    ctx.fillStyle = '#cbd5e1';
    ctx.shadowBlur = 0;
    ctx.fillText("Bot xuddi tirik o'yinchi kabi yagona fizika, navgraph va utility AI bilan harakatlanadi.", 960, 250);

    const diffs = [
      { name: "1. O'QUVCHI (APPRENTICE)", hp: "120 HP", react: "280–340 ms", desc: "Mashq uchun: adaptiv xotira o'chirilgan, 25% tabiiy xato." },
      { name: "2. USTA (MASTER - STANDART)", hp: "180 HP", react: "200–250 ms", desc: "Asosiy daraja: masofa saqlash, Whiff Punish va 4 takrordan so'ng o'rganish." },
      { name: "3. EKSPERT (EXPERT)", hp: "240 HP", react: "150–190 ms", desc: "Haqiqiy duel: tezkor Dash-Cancel, havo jangi va 2 takrordan so'ng qarshi taktika!" }
    ];

    diffs.forEach((d, idx) => {
      const isSel = idx === this.duelDifficultyIndex;
      const dy = 350 + idx * 160;

      ctx.fillStyle = isSel ? 'rgba(168, 85, 247, 0.25)' : 'rgba(15, 23, 42, 0.7)';
      ctx.strokeStyle = isSel ? '#c084fc' : '#334155';
      ctx.lineWidth = isSel ? 3 : 1.5;
      ctx.fillRect(460, dy, 1000, 130);
      ctx.strokeRect(460, dy, 1000, 130);

      ctx.font = "bold 24px 'Rajdhani', sans-serif";
      ctx.fillStyle = isSel ? '#c084fc' : '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(d.name, 500, dy + 40);

      ctx.font = "17px 'Rajdhani', sans-serif";
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`Parametrlar: ${d.hp} | Reaksiya oynasi: ${d.react}`, 500, dy + 70);
      ctx.fillText(d.desc, 500, dy + 95);
    });

    ctx.font = "bold 20px 'Rajdhani', sans-serif";
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText("[A/D yoki Chap/O'ng] — Qiyinchilikni o'zgartirish | [Space/Enter] — Jangni Boshlash | [Esc] — Ortga", 960, 960);

    ctx.restore();
  }

  private updateSettingsMenu(): void {
    if (this.input.isActionJustPressed('UP')) {
      this.settingsMenuIndex = (this.settingsMenuIndex - 1 + 3) % 3;
      Sound.playUIClick();
    } else if (this.input.isActionJustPressed('DOWN')) {
      this.settingsMenuIndex = (this.settingsMenuIndex + 1) % 3;
      Sound.playUIClick();
    }

    if (this.input.isActionJustPressed('LEFT')) {
      if (this.settingsMenuIndex === 0) Sound.setMasterVolume(Sound.masterVolume - 0.1);
      if (this.settingsMenuIndex === 1) Sound.setSfxVolume(Sound.sfxVolume - 0.1);
      if (this.settingsMenuIndex === 2) Sound.setMusicVolume(Sound.musicVolume - 0.1);
      Sound.playUIClick();
    } else if (this.input.isActionJustPressed('RIGHT')) {
      if (this.settingsMenuIndex === 0) Sound.setMasterVolume(Sound.masterVolume + 0.1);
      if (this.settingsMenuIndex === 1) Sound.setSfxVolume(Sound.sfxVolume + 0.1);
      if (this.settingsMenuIndex === 2) Sound.setMusicVolume(Sound.musicVolume + 0.1);
      Sound.playUIClick();
    }

    if (this.input.isActionJustPressed('MENU')) {
      this.state = 'TITLE_MENU';
      Sound.playUIClick();
    }
  }

  private renderSettingsMenu(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, 1920, 1080);

    ctx.font = "bold 44px 'Cinzel', serif";
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText("SOZLAMALAR (AUDIO & BOSHQARUV)", 960, 180);

    const settings = [
      { name: "Asosiy Ovoz (Master Volume)", val: Math.round(Sound.masterVolume * 100) },
      { name: "Effektlar Ovozi (SFX Volume)", val: Math.round(Sound.sfxVolume * 100) },
      { name: "Musiqa Ovozi (Music Volume)", val: Math.round(Sound.musicVolume * 100) }
    ];

    settings.forEach((s, idx) => {
      const isSel = idx === this.settingsMenuIndex;
      const sy = 340 + idx * 90;

      ctx.fillStyle = isSel ? '#38bdf8' : '#94a3b8';
      ctx.font = isSel ? "bold 24px 'Rajdhani', sans-serif" : "20px 'Rajdhani', sans-serif";
      ctx.textAlign = 'left';
      ctx.fillText(`${isSel ? '▶ ' : '  '}${s.name}: ${s.val}%`, 600, sy);
    });

    // Control schema reference
    ctx.font = "bold 22px 'Rajdhani', sans-serif";
    ctx.fillStyle = '#ffffff';
    ctx.fillText("BOSHQARUV TUGMALARI:", 600, 650);

    ctx.font = "18px 'Rajdhani', sans-serif";
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText("A / D: Chapga / O'ngga yurish", 600, 690);
    ctx.fillText("Space: Sakrash / Double Jump / Wall Jump", 600, 720);
    ctx.fillText("J: Qilich zarbasi (3-Hit Combo)", 600, 750);
    ctx.fillText("K: Dash (0s Cooldown, i-frame)", 600, 780);
    ctx.fillText("Q: Maxsus hujum (Tosh devorlarni yoradi)", 600, 810);
    ctx.fillText("E: O'zaro ta'sir (NPC, Save Point)", 600, 840);
    ctx.fillText("M / Tab: Dunyo xaritasi va inventar", 600, 870);

    ctx.font = "16px 'Rajdhani', sans-serif";
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText("[Esc] — Ortga qaytish", 960, 960);

    ctx.restore();
  }

  private updateAchievementsView(): void {
    if (this.input.isActionJustPressed('MENU')) {
      this.state = 'TITLE_MENU';
      Sound.playUIClick();
    }
  }

  private renderAchievementsView(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, 1920, 1080);

    ctx.font = "bold 44px 'Cinzel', serif";
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'center';
    ctx.fillText("YUTUQLAR (ACHIEVEMENTS)", 960, 140);

    let idx = 0;
    Achievements.achievements.forEach((ach) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const ax = col === 0 ? 300 : 1000;
      const ay = 230 + row * 120;

      ctx.fillStyle = ach.unlocked ? 'rgba(30, 41, 59, 0.85)' : 'rgba(15, 23, 42, 0.5)';
      ctx.strokeStyle = ach.unlocked ? '#fbbf24' : '#334155';
      ctx.lineWidth = 1.5;
      ctx.fillRect(ax, ay, 620, 95);
      ctx.strokeRect(ax, ay, 620, 95);

      ctx.font = "bold 22px 'Rajdhani', sans-serif";
      ctx.fillStyle = ach.unlocked ? '#fbbf24' : '#64748b';
      ctx.textAlign = 'left';
      ctx.fillText(`${ach.icon} ${ach.title} ${ach.unlocked ? '✓' : '🔒'}`, ax + 25, ay + 38);

      ctx.font = "15px 'Rajdhani', sans-serif";
      ctx.fillStyle = ach.unlocked ? '#cbd5e1' : '#475569';
      ctx.fillText(ach.description, ax + 25, ay + 68);

      idx++;
    });

    ctx.font = "16px 'Rajdhani', sans-serif";
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText("[Esc] — Ortga qaytish", 960, 980);

    ctx.restore();
  }

  private updatePaused(): void {
    if (this.input.isActionJustPressed('MENU')) {
      this.state = 'PLAYING';
      Sound.playUIClick();
    }
  }

  private renderPaused(): void {
    this.renderPlaying();
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
    ctx.fillRect(0, 0, 1920, 1080);

    ctx.font = "bold 44px 'Cinzel', serif";
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText("PAUZA (GAME PAUSED)", 960, 360);

    ctx.font = "bold 22px 'Rajdhani', sans-serif";
    ctx.fillStyle = '#f1f5f9';
    ctx.fillText("[Esc] — Davom ettirish", 960, 440);
    ctx.fillText("[M] — Dunyo Xaritasi", 960, 480);
    ctx.fillText("[Tab] — Vazifalar & Inventar", 960, 520);

    ctx.restore();
  }

  private updateMapView(): void {
    if (this.input.isActionJustPressed('MAP') || this.input.isActionJustPressed('MENU')) {
      this.state = 'PLAYING';
      Sound.playUIClick();
    }
  }

  private renderMapView(): void {
    WorldMap.renderWorldMap(
      this.ctx,
      1920,
      1080,
      this.currentRoomId,
      this.discoveredRooms,
      this.player
    );
  }

  private updateQuestLogView(): void {
    if (this.input.isActionJustPressed('MAP') || this.input.isActionJustPressed('MENU')) {
      this.state = 'PLAYING';
      Sound.playUIClick();
    }
  }

  private updateInventoryView(): void {
    if (this.input.isActionJustPressed('MAP') || this.input.isActionJustPressed('MENU')) {
      this.state = 'PLAYING';
      Sound.playUIClick();
    }
  }

  private updateEndingView(): void {
    if (this.input.isActionJustPressed('JUMP') || this.input.isActionJustPressed('MENU')) {
      this.state = 'TITLE_MENU';
      Sound.playUIClick();
    }
  }
}

// Instantiate and launch game
window.addEventListener('DOMContentLoaded', () => {
  new GameEngine();
});
