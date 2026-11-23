import { AttackHitbox, Player } from './Player';
import { Platform } from './Types';
import { EnemyEntity } from './CombatSystem';
import { Projectile } from './Enemies';
import { Particles } from '../render/Particles';
import { Sound } from '../engine/AudioManager';
import { Camera } from '../engine/Camera';

export type BossType = 'BOSS_TREANT' | 'BOSS_BEHEMOTH' | 'BOSS_SENTINEL' | 'BOSS_SOVEREIGN';

export class Boss implements EnemyEntity {
  public id: string;
  public name: string;
  public type: BossType;
  public x: number;
  public y: number;
  public width: number = 100;
  public height: number = 130;
  public vx: number = 0;
  public vy: number = 0;

  public hp: number = 300;
  public maxHp: number = 300;
  public isDead: boolean = false;
  public phase: number = 1;
  public facingRight: boolean = false;

  public activeAttackHitbox: AttackHitbox | null = null;
  public hitstopTimer: number = 0;
  public isVulnerableWindow: boolean = false; // Damage window multiplier

  public state: 'IDLE' | 'TELEGRAPH' | 'ATTACK' | 'RECOVERY' | 'PHASE_TRANSITION' = 'IDLE';
  public stateTimer: number = 0;
  public attackCooldown: number = 1.0;
  public chosenAttackIndex: number = 0;

  public rewardAbility?: 'doubleJump' | 'dash' | 'wallClimb' | 'specialAttack';
  public onSpawnProjectile?: (proj: Projectile) => void;

  constructor(
    id: string, 
    name: string, 
    type: BossType, 
    x: number, 
    y: number,
    rewardAbility?: 'doubleJump' | 'dash' | 'wallClimb' | 'specialAttack'
  ) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.x = x;
    this.y = y;
    this.rewardAbility = rewardAbility;

    this.configureBoss();
  }

  private configureBoss(): void {
    switch (this.type) {
      case 'BOSS_TREANT':
        this.width = 110;
        this.height = 140;
        this.hp = 300;
        this.maxHp = 300;
        break;
      case 'BOSS_BEHEMOTH':
        this.width = 130;
        this.height = 120;
        this.hp = 450;
        this.maxHp = 450;
        break;
      case 'BOSS_SENTINEL':
        this.width = 95;
        this.height = 150;
        this.hp = 600;
        this.maxHp = 600;
        break;
      case 'BOSS_SOVEREIGN':
        this.width = 100;
        this.height = 150;
        this.hp = 850;
        this.maxHp = 850;
        break;
    }
  }

  public update(dt: number, player: Player, camera: Camera): void {
    if (this.isDead) return;

    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    this.stateTimer += dt;
    this.attackCooldown -= dt;

    // Check Phase transitions (HP thresholds: 65% and 30%)
    const hpRatio = this.hp / this.maxHp;
    if (hpRatio <= 0.30 && this.phase < 3) {
      this.phase = 3;
      this.triggerPhaseShift(camera);
    } else if (hpRatio <= 0.65 && this.phase < 2) {
      this.phase = 2;
      this.triggerPhaseShift(camera);
    }

    const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
    this.facingRight = dx > 0;

    switch (this.type) {
      case 'BOSS_TREANT':
        this.updateTreant(dt, player, dx, camera);
        break;
      case 'BOSS_BEHEMOTH':
        this.updateBehemoth(dt, player, dx, camera);
        break;
      case 'BOSS_SENTINEL':
        this.updateSentinel(dt, player, dx, camera);
        break;
      case 'BOSS_SOVEREIGN':
        this.updateSovereign(dt, player, dx, camera);
        break;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  private triggerPhaseShift(camera: Camera): void {
    this.state = 'PHASE_TRANSITION';
    this.stateTimer = 0;
    this.vx = 0;
    this.vy = 0;
    this.activeAttackHitbox = null;
    Sound.playBossRoar();
    camera.triggerShake(20, 0.5);
    Particles.emitSparks(this.x + this.width / 2, this.y + this.height / 2, 30, '#ef4444');
    Particles.addDamageText(`FAZA ${this.phase}!`, this.x + this.width / 2, this.y - 40, '#f87171', true);
  }

  // ===================== BOSS 1: ANCIENT TREANT =====================
  private updateTreant(dt: number, player: Player, dx: number, camera: Camera): void {
    if (this.state === 'PHASE_TRANSITION') {
      if (this.stateTimer > 0.8) {
        this.state = 'IDLE';
        this.attackCooldown = 0.5;
      }
      return;
    }

    if (this.state === 'IDLE') {
      this.vx = (dx > 0 ? 1 : -1) * (this.phase === 2 ? 110 : 70);
      this.isVulnerableWindow = false;

      if (this.attackCooldown <= 0) {
        this.state = 'TELEGRAPH';
        this.stateTimer = 0;
        this.vx = 0;
        this.chosenAttackIndex = Math.random() < (this.phase === 2 ? 0.5 : 0.8) ? 1 : 2;
        Sound.playBossTelegraph();
        Particles.emitSparks(this.x + this.width / 2, this.y + 20, 15, '#22c55e');
      }
    } else if (this.state === 'TELEGRAPH') {
      // 0.5s Telegraph visual warning!
      if (this.stateTimer > 0.5) {
        this.state = 'ATTACK';
        this.stateTimer = 0;

        if (this.chosenAttackIndex === 1) {
          // Stomp slam attack!
          camera.triggerShake(18, 0.3);
          Sound.playBossRoar();
          this.activeAttackHitbox = {
            x: this.facingRight ? this.x : this.x - 120,
            y: this.y + 40,
            width: this.width + 120,
            height: this.height - 40,
            damage: 26,
            knockbackX: this.facingRight ? 500 : -500,
            knockbackY: -250
          };
        } else {
          // Root spikes from ground!
          camera.triggerShake(22, 0.4);
          Sound.playBossRoar();
          if (this.onSpawnProjectile) {
            for (let i = -2; i <= 2; i++) {
              this.onSpawnProjectile({
                x: player.x + i * 80,
                y: player.y + 40,
                vx: 0,
                vy: -350,
                radius: 14,
                damage: 24,
                color: '#15803d',
                isHostile: true,
                life: 1.2
              });
            }
          }
        }
      }
    } else if (this.state === 'ATTACK') {
      if (this.stateTimer > 0.35) {
        this.activeAttackHitbox = null;
        this.state = 'RECOVERY';
        this.stateTimer = 0;
        this.isVulnerableWindow = true; // GUARANTEED DAMAGE WINDOW FOR PLAYER!
        Particles.addDamageText('DAMAGE WINDOW!', this.x + this.width / 2, this.y - 20, '#fbbf24');
      }
    } else if (this.state === 'RECOVERY') {
      // Vulnerable for 0.8s
      if (this.stateTimer > 0.8) {
        this.isVulnerableWindow = false;
        this.state = 'IDLE';
        this.attackCooldown = this.phase === 2 ? 1.0 : 1.6;
      }
    }
  }

  // ===================== BOSS 2: ROOT BEHEMOTH =====================
  private updateBehemoth(dt: number, player: Player, dx: number, camera: Camera): void {
    if (this.state === 'PHASE_TRANSITION') {
      if (this.stateTimer > 0.8) {
        this.state = 'IDLE';
        this.attackCooldown = 0.5;
      }
      return;
    }

    if (this.state === 'IDLE') {
      this.vx = (dx > 0 ? 1 : -1) * (this.phase === 3 ? 160 : 100);
      this.isVulnerableWindow = false;

      if (this.attackCooldown <= 0) {
        this.state = 'TELEGRAPH';
        this.stateTimer = 0;
        this.vx = 0;
        this.chosenAttackIndex = Math.random() < 0.5 ? 1 : 2;
        Sound.playBossTelegraph();
        Particles.emitSparks(this.x + this.width / 2, this.y + 20, 16, '#f97316');
      }
    } else if (this.state === 'TELEGRAPH') {
      if (this.stateTimer > 0.6) {
        this.state = 'ATTACK';
        this.stateTimer = 0;

        if (this.chosenAttackIndex === 1) {
          // Charge slam across arena!
          this.vx = (this.facingRight ? 1 : -1) * 650;
          this.activeAttackHitbox = {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            damage: 32,
            knockbackX: this.facingRight ? 600 : -600,
            knockbackY: -280
          };
        } else {
          // Acid barrage
          if (this.onSpawnProjectile) {
            for (let i = 0; i < (this.phase === 3 ? 5 : 3); i++) {
              const angle = -Math.PI / 2 + (i - 1.5) * 0.4;
              this.onSpawnProjectile({
                x: this.x + this.width / 2,
                y: this.y + 30,
                vx: Math.cos(angle) * 320,
                vy: Math.sin(angle) * 320,
                radius: 12,
                damage: 22,
                color: '#84cc16',
                isHostile: true,
                life: 3.5
              });
            }
          }
        }
      }
    } else if (this.state === 'ATTACK') {
      if (this.stateTimer > 0.5) {
        this.activeAttackHitbox = null;
        this.vx = 0;
        this.state = 'RECOVERY';
        this.stateTimer = 0;
        this.isVulnerableWindow = true; // Damage Window
        camera.triggerShake(14, 0.2);
        Particles.addDamageText('DAMAGE WINDOW!', this.x + this.width / 2, this.y - 20, '#fbbf24');
      }
    } else if (this.state === 'RECOVERY') {
      if (this.stateTimer > 0.75) {
        this.isVulnerableWindow = false;
        this.state = 'IDLE';
        this.attackCooldown = this.phase === 3 ? 0.8 : 1.4;
      }
    }
  }

  // ===================== BOSS 3: ARCH-AUTOMATON SENTINEL =====================
  private updateSentinel(dt: number, player: Player, dx: number, camera: Camera): void {
    if (this.state === 'PHASE_TRANSITION') {
      if (this.stateTimer > 0.8) {
        this.state = 'IDLE';
        this.attackCooldown = 0.5;
      }
      return;
    }

    if (this.state === 'IDLE') {
      this.vx = (dx > 0 ? 1 : -1) * (this.phase === 3 ? 180 : 120);
      this.isVulnerableWindow = false;

      if (this.attackCooldown <= 0) {
        this.state = 'TELEGRAPH';
        this.stateTimer = 0;
        this.vx = 0;
        this.chosenAttackIndex = Math.random() < 0.5 ? 1 : 2;
        Sound.playBossTelegraph();
        Particles.emitSparks(this.x + this.width / 2, this.y + 20, 20, '#38bdf8');
      }
    } else if (this.state === 'TELEGRAPH') {
      if (this.stateTimer > 0.5) {
        this.state = 'ATTACK';
        this.stateTimer = 0;

        if (this.chosenAttackIndex === 1) {
          // Swift thrust
          this.vx = (this.facingRight ? 1 : -1) * 550;
          this.activeAttackHitbox = {
            x: this.facingRight ? this.x + this.width : this.x - 120,
            y: this.y + 20,
            width: 120,
            height: 60,
            damage: 35,
            knockbackX: this.facingRight ? 550 : -550,
            knockbackY: -200
          };
        } else {
          // Aerial dive and laser burst
          this.vy = -400;
          camera.triggerShake(16, 0.25);
          if (this.onSpawnProjectile) {
            for (let i = 0; i < 6; i++) {
              const angle = (i / 6) * Math.PI * 2;
              this.onSpawnProjectile({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: Math.cos(angle) * 360,
                vy: Math.sin(angle) * 360,
                radius: 10,
                damage: 25,
                color: '#38bdf8',
                isHostile: true,
                life: 3.0
              });
            }
          }
        }
      }
    } else if (this.state === 'ATTACK') {
      if (this.stateTimer > 0.4) {
        this.activeAttackHitbox = null;
        this.vx = 0;
        this.vy = 0;
        this.state = 'RECOVERY';
        this.stateTimer = 0;
        this.isVulnerableWindow = true; // Damage Window
        Particles.addDamageText('DAMAGE WINDOW!', this.x + this.width / 2, this.y - 20, '#fbbf24');
      }
    } else if (this.state === 'RECOVERY') {
      if (this.stateTimer > 0.7) {
        this.isVulnerableWindow = false;
        this.state = 'IDLE';
        this.attackCooldown = this.phase === 3 ? 0.7 : 1.3;
      }
    }
  }

  // ===================== BOSS 4: CORRUPTED SOVEREIGN (FINAL BOSS) =====================
  private updateSovereign(dt: number, player: Player, dx: number, camera: Camera): void {
    if (this.state === 'PHASE_TRANSITION') {
      if (this.stateTimer > 1.0) {
        this.state = 'IDLE';
        this.attackCooldown = 0.4;
      }
      return;
    }

    if (this.state === 'IDLE') {
      this.vx = (dx > 0 ? 1 : -1) * (this.phase === 3 ? 220 : 140);
      this.isVulnerableWindow = false;

      if (this.attackCooldown <= 0) {
        this.state = 'TELEGRAPH';
        this.stateTimer = 0;
        this.vx = 0;
        this.chosenAttackIndex = Math.floor(Math.random() * 3) + 1;
        Sound.playBossTelegraph();
        Particles.emitSparks(this.x + this.width / 2, this.y + 20, 25, '#c084fc');
      }
    } else if (this.state === 'TELEGRAPH') {
      if (this.stateTimer > 0.5) {
        this.state = 'ATTACK';
        this.stateTimer = 0;

        if (this.chosenAttackIndex === 1) {
          // Abyssal 3-Blade Combo
          this.vx = (this.facingRight ? 1 : -1) * 500;
          camera.triggerShake(20, 0.3);
          this.activeAttackHitbox = {
            x: this.facingRight ? this.x + this.width : this.x - 140,
            y: this.y,
            width: 140,
            height: this.height,
            damage: 42,
            knockbackX: this.facingRight ? 650 : -650,
            knockbackY: -300
          };
        } else if (this.chosenAttackIndex === 2) {
          // Void Ring Barrage
          camera.triggerShake(18, 0.4);
          if (this.onSpawnProjectile) {
            for (let i = 0; i < 8; i++) {
              const angle = (i / 8) * Math.PI * 2;
              this.onSpawnProjectile({
                x: this.x + this.width / 2,
                y: this.y + 50,
                vx: Math.cos(angle) * 340,
                vy: Math.sin(angle) * 340,
                radius: 12,
                damage: 28,
                color: '#a855f7',
                isHostile: true,
                life: 3.5
              });
            }
          }
        } else {
          // Chaos Nova
          camera.triggerShake(26, 0.5);
          Sound.playBossRoar();
          this.activeAttackHitbox = {
            x: this.x - 100,
            y: this.y - 40,
            width: this.width + 200,
            height: this.height + 80,
            damage: 48,
            knockbackX: dx > 0 ? 600 : -600,
            knockbackY: -350
          };
        }
      }
    } else if (this.state === 'ATTACK') {
      if (this.stateTimer > 0.45) {
        this.activeAttackHitbox = null;
        this.vx = 0;
        this.state = 'RECOVERY';
        this.stateTimer = 0;
        this.isVulnerableWindow = true; // Damage window
        Particles.addDamageText('DAMAGE WINDOW!', this.x + this.width / 2, this.y - 20, '#fbbf24');
      }
    } else if (this.state === 'RECOVERY') {
      if (this.stateTimer > 0.75) {
        this.isVulnerableWindow = false;
        this.state = 'IDLE';
        this.attackCooldown = this.phase === 3 ? 0.7 : 1.2;
      }
    }
  }

  public takeDamage(dmg: number, kx: number, ky: number, isSpecial: boolean = false): void {
    if (this.isDead) return;

    // In Damage Window, boss takes 1.5x damage!
    const multiplier = this.isVulnerableWindow ? 1.5 : 1.0;
    const finalDamage = Math.round(dmg * multiplier);

    this.hp -= finalDamage;

    Particles.addDamageText(
      `-${finalDamage}${this.isVulnerableWindow ? ' CRIT!' : ''}`, 
      this.x + this.width / 2, 
      this.y - 20, 
      this.isVulnerableWindow ? '#facc15' : '#f87171',
      this.isVulnerableWindow || isSpecial
    );
    Particles.emitBlood(this.x + this.width / 2, this.y + this.height / 2, 12);

    if (this.hp <= 0) {
      this.isDead = true;
      this.activeAttackHitbox = null;
      Particles.emitSparks(this.x + this.width / 2, this.y + this.height / 2, 50, '#f59e0b');
      Particles.emitDust(this.x + this.width / 2, this.y + this.height, 40, '#f59e0b');
      Sound.playBossRoar();
    }
  }

  public triggerHitstop(duration: number): void {
    this.hitstopTimer = duration;
  }

  public getFacingRight(): boolean {
    return this.facingRight;
  }
}
