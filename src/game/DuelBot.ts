import { IInputSource } from './InputSource';
import { ActionType } from '../engine/InputManager';
import { Player } from './Player';
import { Platform } from './Types';
import { Camera } from '../engine/Camera';

export type BotDifficulty = 'apprentice' | 'master' | 'expert';

export class BotAIInput implements IInputSource {
  private activeDown: Set<ActionType> = new Set();
  private justPressed: Set<ActionType> = new Set();
  private justReleased: Set<ActionType> = new Set();
  private bufferedJump: boolean = false;

  public isActionDown(action: ActionType): boolean {
    return this.activeDown.has(action);
  }

  public isActionJustPressed(action: ActionType): boolean {
    return this.justPressed.has(action);
  }

  public isActionJustReleased(action: ActionType): boolean {
    return this.justReleased.has(action);
  }

  public hasBufferedJump(): boolean {
    return this.bufferedJump;
  }

  public consumeBufferedJump(): void {
    this.bufferedJump = false;
  }

  public press(action: ActionType): void {
    if (!this.activeDown.has(action)) {
      this.justPressed.add(action);
      this.activeDown.add(action);
      if (action === 'JUMP') this.bufferedJump = true;
    }
  }

  public release(action: ActionType): void {
    if (this.activeDown.has(action)) {
      this.activeDown.delete(action);
      this.justReleased.add(action);
    }
  }

  public clearFrame(): void {
    this.justPressed.clear();
    this.justReleased.clear();
  }

  public resetAll(): void {
    this.activeDown.clear();
    this.justPressed.clear();
    this.justReleased.clear();
    this.bufferedJump = false;
  }
}

export class DuelBot {
  public playerBody: Player;
  public botInput: BotAIInput;
  public difficulty: BotDifficulty;

  // AI Evaluation timers
  private evalTimer: number = 0;
  private readonly EVAL_INTERVAL = 0.12; // Evaluate every 0.12s
  private reactionDelayTimer: number = 0;
  private targetAction: ActionType | null = null;

  // Short term memory of player moves
  private playerRecentMoves: string[] = [];
  private lastRecordedPlayerState: string = 'IDLE';

  // Spacing & baiting state
  private isBaiting: boolean = false;
  private baitTimer: number = 0;

  constructor(x: number, y: number, difficulty: BotDifficulty = 'master') {
    this.playerBody = new Player(x, y);
    this.botInput = new BotAIInput();
    this.difficulty = difficulty;

    // Set stats based on difficulty table
    if (difficulty === 'apprentice') {
      this.playerBody.hp = 120;
      this.playerBody.maxHp = 120;
    } else if (difficulty === 'master') {
      this.playerBody.hp = 180;
      this.playerBody.maxHp = 180;
    } else {
      this.playerBody.hp = 240;
      this.playerBody.maxHp = 240;
    }

    // Bot has full abilities available in duel
    this.playerBody.hasDoubleJump = true;
    this.playerBody.hasDash = true;
    this.playerBody.hasWallClimb = true;
    this.playerBody.hasSpecialAttack = true;
  }

  public update(
    dt: number, 
    opponent: Player, 
    platforms: Platform[], 
    brokenWalls: Set<string>,
    camera?: Camera
  ): void {
    // Clear bot input per-frame flags
    this.botInput.clearFrame();

    // Track opponent's actions for short-term memory
    if (opponent.state !== this.lastRecordedPlayerState) {
      if (['ATTACK_1', 'DASH', 'SPECIAL_ATTACK', 'JUMP'].includes(opponent.state)) {
        this.playerRecentMoves.push(opponent.state);
        if (this.playerRecentMoves.length > 6) {
          this.playerRecentMoves.shift();
        }
      }
      this.lastRecordedPlayerState = opponent.state;
    }

    // Reaction delay buffer handling
    if (this.reactionDelayTimer > 0) {
      this.reactionDelayTimer -= dt;
      if (this.reactionDelayTimer <= 0 && this.targetAction) {
        this.botInput.press(this.targetAction);
        this.targetAction = null;
      }
    }

    // AI Evaluation cycle (every 0.12s)
    this.evalTimer += dt;
    if (this.evalTimer >= this.EVAL_INTERVAL) {
      this.evalTimer = 0;
      this.evaluateUtilityBrain(opponent);
    }

    // Handle active bait timer
    if (this.isBaiting) {
      this.baitTimer -= dt;
      if (this.baitTimer <= 0) {
        this.isBaiting = false;
      }
    }

    // Update shared Player physics FSM
    this.playerBody.update(dt, this.botInput, platforms, brokenWalls, camera);
  }

  private evaluateUtilityBrain(opponent: Player): void {
    const dx = (opponent.x + opponent.width / 2) - (this.playerBody.x + this.playerBody.width / 2);
    const dy = (opponent.y + opponent.height / 2) - (this.playerBody.y + this.playerBody.height / 2);
    const dist = Math.hypot(dx, dy);

    // Natural error probability check
    let errorChance = 0.12;
    if (this.difficulty === 'apprentice') errorChance = 0.25;
    if (this.difficulty === 'expert') errorChance = 0.05;

    if (Math.random() < errorChance) {
      // Small hesitation / imperfect response
      return;
    }

    // Reaction window based on difficulty
    let reactionTime = 0.22;
    if (this.difficulty === 'apprentice') reactionTime = 0.31;
    if (this.difficulty === 'expert') reactionTime = 0.17;

    // Detect Spamming from player memory
    const countQ = this.playerRecentMoves.filter(m => m === 'SPECIAL_ATTACK').length;
    const countDash = this.playerRecentMoves.filter(m => m === 'DASH').length;

    // Reaction 1: Whiff Punish or Dodge incoming attacks
    if (opponent.activeAttackHitbox && dist < 180) {
      // Opponent is attacking within danger range!
      if (countQ >= 2 || Math.random() < 0.6) {
        // Counter with Dash away or Jump over
        this.queueReaction(dx > 0 ? 'LEFT' : 'RIGHT', 0);
        this.queueReaction('DASH', reactionTime);
        return;
      } else if (Math.random() < 0.5) {
        // Weapon Clash attempt! Swing sword right back
        this.queueReaction('ATTACK', reactionTime * 0.5);
        return;
      }
    }

    // Reaction 2: Opponent is in recovery state (Whiff punish!)
    if (opponent.state === 'SPECIAL_ATTACK' && opponent.stateTimer > 0.25) {
      // Opponent is vulnerable, close distance with Dash + Attack!
      this.queueReaction(dx > 0 ? 'RIGHT' : 'LEFT', 0);
      this.queueReaction('DASH', 0.05);
      this.queueReaction('ATTACK', 0.12);
      return;
    }

    // Reaction 3: Aerial opponent
    if (!opponent.isGrounded && Math.abs(dx) < 140 && dy < -50) {
      // Jump up to contest in air
      this.queueReaction('JUMP', 0.05);
      if (Math.random() < 0.7) {
        this.queueReaction('ATTACK', 0.15);
      }
      return;
    }

    // Reaction 4: Spacing & Baiting
    if (this.difficulty !== 'apprentice' && dist > 150 && dist < 320 && Math.random() < 0.4) {
      this.isBaiting = true;
      this.baitTimer = 0.35;
      // Step back to bait a whiff
      this.botInput.release('LEFT');
      this.botInput.release('RIGHT');
      this.botInput.press(dx > 0 ? 'LEFT' : 'RIGHT');
      return;
    }

    // Reaction 5: Offensive engagement
    if (dist > 120) {
      // Approach opponent
      if (dx > 0) {
        this.botInput.release('LEFT');
        this.botInput.press('RIGHT');
      } else {
        this.botInput.release('RIGHT');
        this.botInput.press('LEFT');
      }

      // If opponent is high above, use Double Jump or Wall Climb
      if (dy < -120 && this.playerBody.isGrounded) {
        this.botInput.press('JUMP');
      } else if (dy < -200 && !this.playerBody.isGrounded && this.playerBody.canDoubleJump) {
        this.botInput.press('JUMP');
      }

      // If far away and expert, Dash forward
      if (dist > 350 && Math.random() < 0.3) {
        this.botInput.press('DASH');
      }
    } else {
      // In close melee range: Combo Attack!
      this.botInput.release('LEFT');
      this.botInput.release('RIGHT');

      // Use Special Attack Q if energy available and player spams Dash
      if (countDash >= 3 && this.playerBody.energy >= 30 && Math.random() < 0.5) {
        this.botInput.press('SPECIAL');
      } else {
        this.botInput.press('ATTACK');
      }
    }
  }

  private queueReaction(action: ActionType, delay: number): void {
    if (delay <= 0) {
      this.botInput.press(action);
    } else {
      this.targetAction = action;
      this.reactionDelayTimer = delay;
    }
  }

  public takeDamage(dmg: number, kx: number, ky: number, isSpecial?: boolean): void {
    this.playerBody.takeDamage(dmg, kx, ky);
  }

  public triggerHitstop(duration: number): void {
    this.playerBody.triggerHitstop(duration);
  }

  public getFacingRight(): boolean {
    return this.playerBody.facingRight;
  }
}
