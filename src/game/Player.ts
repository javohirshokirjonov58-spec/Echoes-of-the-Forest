import { IInputSource } from './InputSource';
import { Physics } from './Physics';
import { Platform } from './Types';
import { Sound } from '../engine/AudioManager';
import { Particles } from '../render/Particles';
import { Camera } from '../engine/Camera';

export type PlayerState = 
  | 'IDLE' 
  | 'RUN' 
  | 'JUMP' 
  | 'FALL' 
  | 'WALL_SLIDE' 
  | 'WALL_JUMP' 
  | 'DASH' 
  | 'ATTACK_1' 
  | 'ATTACK_2' 
  | 'ATTACK_3' 
  | 'SPECIAL_ATTACK' 
  | 'HURT' 
  | 'DEAD';

export interface AttackHitbox {
  x: number;
  y: number;
  width: number;
  height: number;
  damage: number;
  knockbackX: number;
  knockbackY: number;
  isSpecial?: boolean;
}

export class Player {
  // Dimensions & Coordinates
  public x: number = 200;
  public y: number = 800;
  public width: number = 44;
  public height: number = 74;
  public vx: number = 0;
  public vy: number = 0;

  // Stats
  public hp: number = 100;
  public maxHp: number = 100;
  public energy: number = 100;
  public maxEnergy: number = 100;

  // Unlocked Abilities
  public hasDoubleJump: boolean = false;
  public hasDash: boolean = false;
  public hasWallClimb: boolean = false;
  public hasSpecialAttack: boolean = false;

  // State Machine
  public state: PlayerState = 'IDLE';
  public facingRight: boolean = true;
  public stateTimer: number = 0;

  // Physics tuning
  public readonly RUN_SPEED = 420;
  public readonly JUMP_FORCE = -750;
  public readonly DOUBLE_JUMP_FORCE = -700;
  public readonly WALL_JUMP_FORCE_X = 480;
  public readonly WALL_JUMP_FORCE_Y = -680;
  public readonly WALL_SLIDE_SPEED = 180;
  public readonly DASH_SPEED = 950;
  public readonly DASH_DURATION = 0.16;

  // Timeless Ability & Combat tracking
  public canDoubleJump: boolean = false;
  public isInvincible: boolean = false;
  public invincibilityTimer: number = 0;

  // Diminishing i-frames on Dash spam
  public consecutiveDashCount: number = 0;
  public timeSinceLastDash: number = 999;

  // Coyote time & Jump cut
  public coyoteTimer: number = 0;
  public isGrounded: boolean = false;
  public isTouchingWallLeft: boolean = false;
  public isTouchingWallRight: boolean = false;

  // Attack combos
  public activeAttackHitbox: AttackHitbox | null = null;
  public comboQueued: boolean = false;
  public isWallSliding: boolean = false;

  // Hitstop & Slowmo
  public hitstopTimer: number = 0;

  constructor(x: number = 200, y: number = 800) {
    this.x = x;
    this.y = y;
  }

  public update(
    dt: number, 
    input: IInputSource, 
    platforms: Platform[], 
    brokenWalls: Set<string>,
    camera?: Camera
  ): void {
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return; // Freeze movement during hitstop
    }

    this.stateTimer += dt;
    this.timeSinceLastDash += dt;

    if (this.timeSinceLastDash > 0.45) {
      this.consecutiveDashCount = 0;
    }

    if (this.invincibilityTimer > 0) {
      this.invincibilityTimer -= dt;
      if (this.invincibilityTimer <= 0) {
        this.isInvincible = false;
      }
    }

    // Energy passive regeneration
    if (this.energy < this.maxEnergy) {
      this.energy = Math.min(this.maxEnergy, this.energy + 15 * dt);
    }

    // Main FSM update
    switch (this.state) {
      case 'IDLE':
      case 'RUN':
      case 'FALL':
      case 'JUMP':
        this.handleStandardMovement(dt, input);
        break;
      case 'WALL_SLIDE':
        this.handleWallSlideMovement(dt, input);
        break;
      case 'WALL_JUMP':
        this.handleWallJumpMovement(dt, input);
        break;
      case 'DASH':
        this.handleDashMovement(dt, input);
        break;
      case 'ATTACK_1':
      case 'ATTACK_2':
      case 'ATTACK_3':
        this.handleAttackMovement(dt, input);
        break;
      case 'SPECIAL_ATTACK':
        this.handleSpecialAttackMovement(dt, input, camera);
        break;
      case 'HURT':
        this.handleHurtMovement(dt);
        break;
      case 'DEAD':
        this.vy += Physics.GRAVITY * dt;
        break;
    }

    // Apply movement physics and resolve collisions
    if (this.state !== 'DASH') {
      // Clamp falling speed
      this.vy = Math.min(this.vy, Physics.MAX_FALL_SPEED);
    }

    const collision = Physics.resolveEntityMovement(
      this, 
      dt, 
      platforms, 
      brokenWalls
    );

    const wasGrounded = this.isGrounded;
    this.isGrounded = collision.onGround;
    this.isTouchingWallLeft = collision.onWallLeft;
    this.isTouchingWallRight = collision.onWallRight;

    if (this.isGrounded) {
      this.canDoubleJump = this.hasDoubleJump;
      this.coyoteTimer = 0.12;
      if (!wasGrounded) {
        Particles.emitDust(this.x + this.width / 2, this.y + this.height, 5);
        // Execute buffered jump if present
        if (input.hasBufferedJump()) {
          input.consumeBufferedJump();
          this.executeJump();
        }
      }
    } else {
      if (wasGrounded) {
        this.coyoteTimer = 0.12;
      } else {
        this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
      }
    }

    // Check Wall Slide trigger
    if (
      this.hasWallClimb &&
      !this.isGrounded &&
      this.vy > 0 &&
      (this.isTouchingWallLeft || this.isTouchingWallRight) &&
      this.state !== 'DASH' &&
      this.state !== 'SPECIAL_ATTACK' &&
      this.state !== 'HURT' &&
      this.state !== 'DEAD'
    ) {
      if (this.state !== 'WALL_SLIDE') {
        this.state = 'WALL_SLIDE';
        this.stateTimer = 0;
      }
    }

    // Hazard collision check
    if (collision.hitHazard && !this.isInvincible && this.state !== 'DEAD') {
      this.takeDamage(20, 0, -300);
      Sound.playHurt();
    }
  }

  private handleStandardMovement(dt: number, input: IInputSource): void {
    // Left/Right input
    let moveDir = 0;
    if (input.isActionDown('LEFT')) moveDir -= 1;
    if (input.isActionDown('RIGHT')) moveDir += 1;

    if (moveDir !== 0) {
      this.facingRight = moveDir > 0;
      this.vx = moveDir * this.RUN_SPEED;
      if (this.isGrounded && this.state !== 'RUN') {
        this.state = 'RUN';
        this.stateTimer = 0;
      }
    } else {
      this.vx = 0;
      if (this.isGrounded && this.state !== 'IDLE') {
        this.state = 'IDLE';
        this.stateTimer = 0;
      }
    }

    // Apply gravity
    this.vy += Physics.GRAVITY * dt;

    if (!this.isGrounded) {
      if (this.vy < 0 && this.state !== 'JUMP') {
        this.state = 'JUMP';
      } else if (this.vy > 0 && this.state !== 'FALL') {
        this.state = 'FALL';
      }
    }

    // Variable jump height: release Space early to cut jump short
    if (input.isActionJustReleased('JUMP') && this.vy < -200) {
      this.vy *= 0.5;
    }

    // Jump Initiation (with Coyote time & Buffer)
    if (input.isActionJustPressed('JUMP') || input.hasBufferedJump()) {
      if (this.isGrounded || this.coyoteTimer > 0) {
        input.consumeBufferedJump();
        this.executeJump();
        return;
      } else if (this.canDoubleJump) {
        // Double jump in air!
        input.consumeBufferedJump();
        this.executeDoubleJump();
        return;
      }
    }

    // Dash (Timeless, 0s cooldown!)
    if (this.hasDash && input.isActionJustPressed('DASH')) {
      this.executeDash();
      return;
    }

    // Attack (J)
    if (input.isActionJustPressed('ATTACK')) {
      this.executeAttack(1);
      return;
    }

    // Special Attack (Q) - Timeless
    if (this.hasSpecialAttack && input.isActionJustPressed('SPECIAL')) {
      this.executeSpecialAttack();
      return;
    }
  }

  private handleWallSlideMovement(dt: number, input: IInputSource): void {
    this.vy = this.WALL_SLIDE_SPEED;
    this.vx = 0;

    if (Math.random() < 0.2) {
      Sound.playWallSlide();
      const wallX = this.isTouchingWallLeft ? this.x : this.x + this.width;
      Particles.emitDust(wallX, this.y + this.height * 0.7, 2);
    }

    // Wall Jump
    if (input.isActionJustPressed('JUMP') || input.hasBufferedJump()) {
      input.consumeBufferedJump();
      this.state = 'WALL_JUMP';
      this.stateTimer = 0;
      const jumpDir = this.isTouchingWallLeft ? 1 : -1;
      this.vx = jumpDir * this.WALL_JUMP_FORCE_X;
      this.vy = this.WALL_JUMP_FORCE_Y;
      this.facingRight = jumpDir > 0;
      this.canDoubleJump = this.hasDoubleJump;
      Sound.playJump();
      Particles.emitDust(this.x + this.width / 2, this.y + this.height, 6);
      return;
    }

    // Dash off wall
    if (this.hasDash && input.isActionJustPressed('DASH')) {
      this.executeDash();
      return;
    }

    // Detach if wall is lost or landed on ground
    if (this.isGrounded || (!this.isTouchingWallLeft && !this.isTouchingWallRight)) {
      this.state = this.isGrounded ? 'IDLE' : 'FALL';
    }
  }

  private handleWallJumpMovement(dt: number, input: IInputSource): void {
    this.vy += Physics.GRAVITY * dt;

    if (this.stateTimer > 0.18) {
      // Regain full aerial control
      this.state = this.vy < 0 ? 'JUMP' : 'FALL';
    }

    if (this.hasDash && input.isActionJustPressed('DASH')) {
      this.executeDash();
    }
  }

  private handleDashMovement(dt: number, input: IInputSource): void {
    this.vy = 0;
    this.vx = (this.facingRight ? 1 : -1) * this.DASH_SPEED;

    // Afterimage ghost trail
    Particles.addGhostTrail(
      this.x, 
      this.y, 
      this.width, 
      this.height, 
      this.facingRight, 
      this.isInvincible ? 'rgba(56, 189, 248, 0.7)' : 'rgba(148, 163, 184, 0.5)'
    );

    if (this.stateTimer >= this.DASH_DURATION) {
      // Dash finished! Timeless: can immediately chain into run, jump, or another dash!
      this.state = this.isGrounded ? 'IDLE' : 'FALL';
      this.vx = (this.facingRight ? 1 : -1) * this.RUN_SPEED;
    }
  }

  private handleAttackMovement(dt: number, input: IInputSource): void {
    // DASH-CANCEL: Main attack recovery can be cancelled INSTANTLY with Dash!
    if (this.hasDash && input.isActionJustPressed('DASH')) {
      this.activeAttackHitbox = null;
      this.executeDash();
      return;
    }

    // Decelerate during attack
    this.vx *= 0.85;
    this.vy += Physics.GRAVITY * dt;

    // Queue next combo step if Attack pressed
    if (input.isActionJustPressed('ATTACK')) {
      this.comboQueued = true;
    }

    const currentStep = this.state === 'ATTACK_1' ? 1 : this.state === 'ATTACK_2' ? 2 : 3;
    const duration = currentStep === 3 ? 0.28 : 0.22;

    if (this.stateTimer >= duration) {
      this.activeAttackHitbox = null;
      if (this.comboQueued && currentStep < 3) {
        this.comboQueued = false;
        this.executeAttack(currentStep + 1);
      } else {
        this.comboQueued = false;
        this.state = this.isGrounded ? 'IDLE' : 'FALL';
      }
    }
  }

  private handleSpecialAttackMovement(dt: number, input: IInputSource, camera?: Camera): void {
    this.vx = 0;
    this.vy = 0; // Hover briefly during startup

    // Startup phase (0.25s)
    if (this.stateTimer < 0.25) {
      if (Math.random() < 0.3) {
        Particles.emitSparks(this.x + this.width / 2, this.y + this.height / 2, 3, '#38bdf8');
      }
    } 
    // Release phase
    else if (this.stateTimer >= 0.25 && !this.activeAttackHitbox) {
      // Spawn massive piercing hitbox
      const hitX = this.facingRight ? this.x + this.width : this.x - 140;
      this.activeAttackHitbox = {
        x: hitX,
        y: this.y - 30,
        width: 140,
        height: this.height + 60,
        damage: 65,
        knockbackX: this.facingRight ? 600 : -600,
        knockbackY: -350,
        isSpecial: true
      };

      if (camera) {
        camera.triggerShake(18, 0.25);
      }
      Particles.emitSparks(this.x + this.width / 2, this.y + this.height / 2, 25, '#38bdf8');
      Particles.emitDust(this.x + this.width / 2, this.y + this.height, 12, '#38bdf8');
    }

    // Recovery phase (0.25s + 0.22s = 0.47s)
    if (this.stateTimer >= 0.47) {
      this.activeAttackHitbox = null;
      this.state = this.isGrounded ? 'IDLE' : 'FALL';
    }
  }

  private handleHurtMovement(dt: number): void {
    this.vy += Physics.GRAVITY * dt;
    this.vx *= 0.92;

    if (this.stateTimer >= 0.35) {
      this.state = this.isGrounded ? 'IDLE' : 'FALL';
    }
  }

  // ===================== ACTION EXECUTIONS =====================

  public executeJump(): void {
    this.vy = this.JUMP_FORCE;
    this.coyoteTimer = 0;
    this.state = 'JUMP';
    this.stateTimer = 0;
    Sound.playJump();
    Particles.emitDust(this.x + this.width / 2, this.y + this.height, 6);
  }

  public executeDoubleJump(): void {
    this.canDoubleJump = false;
    this.vy = this.DOUBLE_JUMP_FORCE;
    this.state = 'JUMP';
    this.stateTimer = 0;
    Sound.playDoubleJump();
    Particles.emitSparks(this.x + this.width / 2, this.y + this.height, 8, '#7dd3fc');
  }

  public executeDash(): void {
    this.state = 'DASH';
    this.stateTimer = 0;
    this.consecutiveDashCount++;
    this.timeSinceLastDash = 0;

    // Diminishing i-frames:
    // 1st dash = 0.16s full i-frames
    // 2nd dash = 0.08s
    // 3+ consecutive dash = 0s
    let iFrameDuration = 0;
    if (this.consecutiveDashCount === 1) {
      iFrameDuration = 0.16;
    } else if (this.consecutiveDashCount === 2) {
      iFrameDuration = 0.08;
    } else {
      iFrameDuration = 0;
    }

    if (iFrameDuration > 0) {
      this.isInvincible = true;
      this.invincibilityTimer = iFrameDuration;
    }

    Sound.playDash();
    Particles.emitDust(this.x + (this.facingRight ? 0 : this.width), this.y + this.height, 8);
  }

  public executeAttack(comboStep: number): void {
    this.state = comboStep === 1 ? 'ATTACK_1' : comboStep === 2 ? 'ATTACK_2' : 'ATTACK_3';
    this.stateTimer = 0;
    this.comboQueued = false;

    // Calculate attack hitbox based on facing direction
    const range = comboStep === 3 ? 95 : 80;
    const hitX = this.facingRight ? this.x + this.width : this.x - range;
    const damage = comboStep === 1 ? 18 : comboStep === 2 ? 24 : 35;

    this.activeAttackHitbox = {
      x: hitX,
      y: this.y + 10,
      width: range,
      height: this.height - 15,
      damage,
      knockbackX: (this.facingRight ? 1 : -1) * (comboStep === 3 ? 450 : 250),
      knockbackY: comboStep === 3 ? -250 : -150
    };

    Sound.playAttack(comboStep);
  }

  public executeSpecialAttack(): void {
    if (this.energy < 25) return;
    this.energy -= 25;
    this.state = 'SPECIAL_ATTACK';
    this.stateTimer = 0;
    this.activeAttackHitbox = null;
    Sound.playSpecialAttack();
  }

  public takeDamage(damage: number, knockX: number = 0, knockY: number = -200): boolean {
    if (this.isInvincible || this.state === 'DEAD') return false;

    this.hp = Math.max(0, this.hp - damage);
    this.isInvincible = true;
    this.invincibilityTimer = 0.7; // i-frames after taking damage
    this.state = this.hp <= 0 ? 'DEAD' : 'HURT';
    this.stateTimer = 0;
    this.vx = knockX;
    this.vy = knockY;
    this.activeAttackHitbox = null;

    Particles.addDamageText(`-${damage}`, this.x + this.width / 2, this.y, '#f87171');
    Particles.emitBlood(this.x + this.width / 2, this.y + this.height / 2, 12);
    Sound.playHurt();

    return true;
  }

  public heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    Particles.addDamageText(`+${amount}`, this.x + this.width / 2, this.y, '#4ade80');
    Particles.emitSparks(this.x + this.width / 2, this.y + this.height / 2, 8, '#4ade80');
  }

  public triggerHitstop(duration: number = 0.05): void {
    this.hitstopTimer = duration;
  }
}
