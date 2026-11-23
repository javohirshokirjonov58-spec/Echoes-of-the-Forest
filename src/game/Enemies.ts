import { AttackHitbox, Player } from './Player';
import { Platform } from './Types';
import { Physics } from './Physics';
import { EnemyEntity } from './CombatSystem';
import { Particles } from '../render/Particles';
import { Sound } from '../engine/AudioManager';

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  isHostile: boolean;
  life: number;
}

export class Enemy implements EnemyEntity {
  public id: string;
  public name: string;
  public type: string;
  public x: number;
  public y: number;
  public width: number = 48;
  public height: number = 64;
  public vx: number = 0;
  public vy: number = 0;

  public hp: number = 50;
  public maxHp: number = 50;
  public isDead: boolean = false;
  public facingRight: boolean = false;

  public activeAttackHitbox: AttackHitbox | null = null;
  public hitstopTimer: number = 0;
  public invincibilityTimer: number = 0;

  // AI & state
  public state: 'IDLE' | 'PATROL' | 'CHASE' | 'TELEGRAPH' | 'ATTACK' | 'RECOVERY' | 'AMBUSH_HIDDEN' | 'HURT' = 'PATROL';
  public stateTimer: number = 0;
  public patrolMinX: number = 0;
  public patrolMaxX: number = 1920;

  // Projectile spawning callback
  public onSpawnProjectile?: (proj: Projectile) => void;

  constructor(
    id: string, 
    type: string, 
    x: number, 
    y: number, 
    patrolMinX?: number, 
    patrolMaxX?: number
  ) {
    this.id = id;
    this.type = type;
    this.x = x;
    this.y = y;
    this.patrolMinX = patrolMinX ?? x - 200;
    this.patrolMaxX = patrolMaxX ?? x + 200;

    this.configureArchetype();
  }

  private configureArchetype(): void {
    switch (this.type) {
      case 'MELEE_WALKER':
        this.name = 'O‘rmon Qo‘riqchisi';
        this.width = 44;
        this.height = 68;
        this.hp = 45;
        this.maxHp = 45;
        break;
      case 'FLYER':
        this.name = 'Qorong‘u Qush';
        this.width = 38;
        this.height = 38;
        this.hp = 30;
        this.maxHp = 30;
        break;
      case 'RANGED_SPITTER':
        this.name = 'Zahar Otuvchi';
        this.width = 44;
        this.height = 60;
        this.hp = 35;
        this.maxHp = 35;
        break;
      case 'CHARGER':
        this.name = 'Yovvoyi Yuguruvchi';
        this.width = 54;
        this.height = 54;
        this.hp = 65;
        this.maxHp = 65;
        break;
      case 'SHIELDED':
        this.name = 'Qalqonli Sarboz';
        this.width = 48;
        this.height = 72;
        this.hp = 70;
        this.maxHp = 70;
        break;
      case 'AMBUSHER':
        this.name = 'Pistirmachi Ildiz';
        this.width = 46;
        this.height = 60;
        this.hp = 40;
        this.maxHp = 40;
        this.state = 'AMBUSH_HIDDEN';
        break;
      case 'SPAWNER_HAZARD':
        this.name = 'Zaharli In / Spawner';
        this.width = 64;
        this.height = 70;
        this.hp = 90;
        this.maxHp = 90;
        break;
      case 'ELITE_BRUISER':
        this.name = 'Elita Qora Bahodir';
        this.width = 60;
        this.height = 86;
        this.hp = 130;
        this.maxHp = 130;
        break;
      default:
        this.name = 'Dushman';
        break;
    }
  }

  public update(dt: number, player: Player, platforms: Platform[], brokenWalls: Set<string>): void {
    if (this.isDead) return;

    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    if (this.invincibilityTimer > 0) {
      this.invincibilityTimer -= dt;
    }

    this.stateTimer += dt;

    const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
    const dy = (player.y + player.height / 2) - (this.y + this.height / 2);
    const dist = Math.hypot(dx, dy);

    this.facingRight = dx > 0;

    switch (this.type) {
      case 'MELEE_WALKER':
        this.updateMeleeWalker(dt, dist, dx);
        break;
      case 'FLYER':
        this.updateFlyer(dt, dist, dx, dy);
        break;
      case 'RANGED_SPITTER':
        this.updateSpitter(dt, dist, dx, dy);
        break;
      case 'CHARGER':
        this.updateCharger(dt, dist, dx);
        break;
      case 'SHIELDED':
        this.updateShielded(dt, dist, dx);
        break;
      case 'AMBUSHER':
        this.updateAmbusher(dt, dist);
        break;
      case 'SPAWNER_HAZARD':
        this.updateSpawner(dt, dist);
        break;
      case 'ELITE_BRUISER':
        this.updateBruiser(dt, dist, dx);
        break;
    }

    // Apply gravity for ground units
    if (this.type !== 'FLYER') {
      this.vy += Physics.GRAVITY * dt;
      Physics.resolveEntityMovement(this, dt, platforms, brokenWalls);
    } else {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }
  }

  private updateMeleeWalker(dt: number, dist: number, dx: number): void {
    if (this.state === 'PATROL') {
      this.vx = (this.facingRight ? 1 : -1) * 90;
      if (this.x <= this.patrolMinX) this.facingRight = true;
      if (this.x >= this.patrolMaxX) this.facingRight = false;

      if (dist < 260) {
        this.state = 'CHASE';
        this.stateTimer = 0;
      }
    } else if (this.state === 'CHASE') {
      this.vx = (dx > 0 ? 1 : -1) * 160;
      if (dist < 75) {
        this.state = 'ATTACK';
        this.stateTimer = 0;
        this.vx = 0;
        this.activeAttackHitbox = {
          x: this.facingRight ? this.x + this.width : this.x - 60,
          y: this.y + 10,
          width: 60,
          height: this.height - 20,
          damage: 14,
          knockbackX: this.facingRight ? 350 : -350,
          knockbackY: -150
        };
      } else if (dist > 380) {
        this.state = 'PATROL';
        this.stateTimer = 0;
      }
    } else if (this.state === 'ATTACK') {
      if (this.stateTimer > 0.3) {
        this.activeAttackHitbox = null;
        this.state = 'RECOVERY';
        this.stateTimer = 0;
      }
    } else if (this.state === 'RECOVERY') {
      this.vx = 0;
      if (this.stateTimer > 0.4) {
        this.state = 'CHASE';
        this.stateTimer = 0;
      }
    }
  }

  private updateFlyer(dt: number, dist: number, dx: number, dy: number): void {
    if (this.state === 'PATROL') {
      this.vx = Math.sin(this.stateTimer * 2) * 100;
      this.vy = Math.cos(this.stateTimer * 3) * 50;

      if (dist < 320) {
        this.state = 'TELEGRAPH';
        this.stateTimer = 0;
        this.vx = 0;
        this.vy = 0;
        Particles.emitSparks(this.x + this.width / 2, this.y, 4, '#ef4444');
      }
    } else if (this.state === 'TELEGRAPH') {
      if (this.stateTimer > 0.45) {
        this.state = 'ATTACK';
        this.stateTimer = 0;
        // Swoop down at player
        const speed = 400;
        this.vx = (dx / dist) * speed;
        this.vy = (dy / dist) * speed;
        this.activeAttackHitbox = {
          x: this.x,
          y: this.y,
          width: this.width,
          height: this.height,
          damage: 18,
          knockbackX: dx > 0 ? 300 : -300,
          knockbackY: -150
        };
      }
    } else if (this.state === 'ATTACK') {
      if (this.stateTimer > 0.5) {
        this.activeAttackHitbox = null;
        this.state = 'RECOVERY';
        this.stateTimer = 0;
        this.vy = -200; // Fly back up
      }
    } else if (this.state === 'RECOVERY') {
      if (this.stateTimer > 0.6) {
        this.state = 'PATROL';
        this.stateTimer = 0;
      }
    }
  }

  private updateSpitter(dt: number, dist: number, dx: number, dy: number): void {
    if (dist < 450) {
      this.vx = 0;
      if (this.state !== 'TELEGRAPH' && this.state !== 'ATTACK' && this.state !== 'RECOVERY') {
        this.state = 'TELEGRAPH';
        this.stateTimer = 0;
        Particles.emitSparks(this.x + this.width / 2, this.y + 10, 6, '#22c55e');
      }
    }

    if (this.state === 'TELEGRAPH' && this.stateTimer > 0.5) {
      this.state = 'ATTACK';
      this.stateTimer = 0;
      if (this.onSpawnProjectile) {
        const speed = 320;
        const mag = Math.max(1, dist);
        this.onSpawnProjectile({
          x: this.x + this.width / 2,
          y: this.y + 20,
          vx: (dx / mag) * speed,
          vy: (dy / mag) * speed - 50,
          radius: 8,
          damage: 16,
          color: '#22c55e',
          isHostile: true,
          life: 3.5
        });
      }
    } else if (this.state === 'ATTACK' && this.stateTimer > 0.2) {
      this.state = 'RECOVERY';
      this.stateTimer = 0;
    } else if (this.state === 'RECOVERY' && this.stateTimer > 1.2) {
      this.state = 'PATROL';
    }
  }

  private updateCharger(dt: number, dist: number, dx: number): void {
    if (this.state === 'PATROL') {
      this.vx = (this.facingRight ? 1 : -1) * 80;
      if (this.x <= this.patrolMinX) this.facingRight = true;
      if (this.x >= this.patrolMaxX) this.facingRight = false;

      if (dist < 320) {
        this.state = 'TELEGRAPH';
        this.stateTimer = 0;
        this.vx = 0;
        Particles.emitSparks(this.x + this.width / 2, this.y, 8, '#f97316');
      }
    } else if (this.state === 'TELEGRAPH') {
      if (this.stateTimer > 0.5) {
        this.state = 'ATTACK';
        this.stateTimer = 0;
        this.vx = (dx > 0 ? 1 : -1) * 550;
        this.activeAttackHitbox = {
          x: this.x,
          y: this.y,
          width: this.width,
          height: this.height,
          damage: 25,
          knockbackX: dx > 0 ? 450 : -450,
          knockbackY: -220
        };
      }
    } else if (this.state === 'ATTACK') {
      Particles.emitDust(this.x + this.width / 2, this.y + this.height, 2);
      if (this.stateTimer > 0.6) {
        this.activeAttackHitbox = null;
        this.state = 'RECOVERY';
        this.stateTimer = 0;
        this.vx = 0;
      }
    } else if (this.state === 'RECOVERY') {
      if (this.stateTimer > 0.8) {
        this.state = 'PATROL';
      }
    }
  }

  private updateShielded(dt: number, dist: number, dx: number): void {
    // Blocks frontal attacks unless hit by Special Attack Q or hit from behind!
    if (dist < 300) {
      this.vx = (dx > 0 ? 1 : -1) * 90;
      if (dist < 80) {
        this.state = 'ATTACK';
        this.stateTimer = 0;
        this.activeAttackHitbox = {
          x: this.facingRight ? this.x + this.width : this.x - 55,
          y: this.y + 15,
          width: 55,
          height: this.height - 25,
          damage: 20,
          knockbackX: this.facingRight ? 350 : -350,
          knockbackY: -150
        };
      }
    } else {
      this.vx = 0;
    }

    if (this.state === 'ATTACK' && this.stateTimer > 0.3) {
      this.activeAttackHitbox = null;
      this.state = 'PATROL';
    }
  }

  private updateAmbusher(dt: number, dist: number): void {
    if (this.state === 'AMBUSH_HIDDEN') {
      this.vx = 0;
      if (dist < 140) {
        // Erupt from ground!
        this.state = 'ATTACK';
        this.stateTimer = 0;
        this.vy = -450;
        Sound.playWeaponClash();
        Particles.emitDust(this.x + this.width / 2, this.y + this.height, 16);
        this.activeAttackHitbox = {
          x: this.x - 10,
          y: this.y - 10,
          width: this.width + 20,
          height: this.height + 20,
          damage: 24,
          knockbackX: this.facingRight ? 300 : -300,
          knockbackY: -250
        };
      }
    } else if (this.state === 'ATTACK') {
      if (this.stateTimer > 0.4) {
        this.activeAttackHitbox = null;
        this.state = 'CHASE';
      }
    } else if (this.state === 'CHASE') {
      this.vx = (this.facingRight ? 1 : -1) * 140;
    }
  }

  private updateSpawner(dt: number, dist: number): void {
    this.vx = 0;
    if (dist < 500 && this.stateTimer > 4.0) {
      this.stateTimer = 0;
      Particles.emitSparks(this.x + this.width / 2, this.y + 20, 12, '#a855f7');
      if (this.onSpawnProjectile) {
        for (let i = 0; i < 3; i++) {
          const angle = -Math.PI / 2 + (i - 1) * 0.6;
          this.onSpawnProjectile({
            x: this.x + this.width / 2,
            y: this.y + 20,
            vx: Math.cos(angle) * 200,
            vy: Math.sin(angle) * 200,
            radius: 9,
            damage: 15,
            color: '#a855f7',
            isHostile: true,
            life: 3.0
          });
        }
      }
    }
  }

  private updateBruiser(dt: number, dist: number, dx: number): void {
    if (this.state === 'PATROL') {
      this.vx = (dx > 0 ? 1 : -1) * 80;
      if (dist < 100) {
        this.state = 'TELEGRAPH';
        this.stateTimer = 0;
        this.vx = 0;
        Particles.emitSparks(this.x + this.width / 2, this.y, 10, '#dc2626');
      }
    } else if (this.state === 'TELEGRAPH') {
      if (this.stateTimer > 0.6) {
        this.state = 'ATTACK';
        this.stateTimer = 0;
        this.activeAttackHitbox = {
          x: this.facingRight ? this.x + this.width : this.x - 90,
          y: this.y,
          width: 90,
          height: this.height,
          damage: 35,
          knockbackX: this.facingRight ? 550 : -550,
          knockbackY: -300
        };
      }
    } else if (this.state === 'ATTACK') {
      if (this.stateTimer > 0.4) {
        this.activeAttackHitbox = null;
        this.state = 'RECOVERY';
        this.stateTimer = 0;
      }
    } else if (this.state === 'RECOVERY') {
      if (this.stateTimer > 0.8) {
        this.state = 'PATROL';
      }
    }
  }

  public takeDamage(dmg: number, kx: number, ky: number, isSpecial: boolean = false): void {
    if (this.isDead) return;

    // Shielded enemy logic: frontal attacks do 0 damage unless Special Attack Q!
    if (this.type === 'SHIELDED' && !isSpecial) {
      // Check if attack is hitting the shield (front)
      Particles.emitSparks(this.x + (this.facingRight ? this.width : 0), this.y + 30, 8, '#38bdf8');
      Particles.addDamageText('BLOCKED', this.x + this.width / 2, this.y - 15, '#38bdf8');
      Sound.playWeaponClash();
      return;
    }

    this.hp -= dmg;
    this.vx = kx * 0.6;
    this.vy = ky * 0.6;

    Particles.addDamageText(`-${dmg}`, this.x + this.width / 2, this.y - 10, '#f87171', isSpecial);
    Particles.emitBlood(this.x + this.width / 2, this.y + this.height / 2, 8);

    if (this.hp <= 0) {
      this.isDead = true;
      this.activeAttackHitbox = null;
      Particles.emitDust(this.x + this.width / 2, this.y + this.height / 2, 18);
    }
  }

  public triggerHitstop(duration: number): void {
    this.hitstopTimer = duration;
  }

  public getFacingRight(): boolean {
    return this.facingRight;
  }
}
