import { Player, AttackHitbox } from './Player';
import { Platform } from './Types';
import { Physics } from './Physics';
import { Sound } from '../engine/AudioManager';
import { Particles } from '../render/Particles';
import { Camera } from '../engine/Camera';

export interface EnemyEntity {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  isDead: boolean;
  activeAttackHitbox: AttackHitbox | null;
  takeDamage(dmg: number, kx: number, ky: number, isSpecial?: boolean): void;
  triggerHitstop(duration: number): void;
  getFacingRight(): boolean;
}

export class CombatSystem {
  public static checkCombatInteractions(
    player: Player,
    enemies: EnemyEntity[],
    platforms: Platform[],
    brokenWalls: Set<string>,
    camera: Camera,
    onWallBroken?: (wallId: string) => void
  ): {
    weaponClashed: boolean;
    perfectDodged: boolean;
  } {
    let weaponClashed = false;
    let perfectDodged = false;

    // 1. Check Player's Active Attack against Enemies
    if (player.activeAttackHitbox) {
      const pHit = player.activeAttackHitbox;

      for (const enemy of enemies) {
        if (enemy.isDead) continue;

        const enemyHurtbox = {
          x: enemy.x,
          y: enemy.y,
          width: enemy.width,
          height: enemy.height
        };

        // Check for WEAPON CLASH first:
        // If enemy also has an active attack hitbox and both hitboxes overlap
        if (enemy.activeAttackHitbox && Physics.checkAABB(pHit, enemy.activeAttackHitbox)) {
          // WEAPON CLASH OCCURRED!
          weaponClashed = true;
          player.triggerHitstop(0.065); // 65ms hitstop
          enemy.triggerHitstop(0.065);
          camera.triggerShake(14, 0.15);

          // Sparks at intersection
          const midX = (pHit.x + enemy.activeAttackHitbox.x) / 2;
          const midY = (pHit.y + enemy.activeAttackHitbox.y) / 2;
          Particles.emitSparks(midX, midY, 20, '#fbbf24');
          Sound.playWeaponClash();

          // Push both back
          player.vx = player.facingRight ? -300 : 300;
          if ('vx' in (enemy as any)) {
            (enemy as any).vx = enemy.getFacingRight() ? -300 : 300;
          }

          // Consume player attack so damage does not also register
          player.activeAttackHitbox = null;
          break;
        }

        // Normal Hit
        if (Physics.checkAABB(pHit, enemyHurtbox)) {
          const isSpecial = pHit.isSpecial ?? false;
          enemy.takeDamage(pHit.damage, pHit.knockbackX, pHit.knockbackY, isSpecial);
          player.triggerHitstop(isSpecial ? 0.08 : 0.04);
          camera.triggerShake(isSpecial ? 16 : 8, 0.15);
          Sound.playHit();
          Particles.emitSparks(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 8, isSpecial ? '#38bdf8' : '#fef08a');
          
          if (!isSpecial) {
            // For normal combo attacks, consume active attack so it doesn't multi-hit
            player.activeAttackHitbox = null;
            break;
          }
        }
      }

      // Check if Player Special Attack (Q) hits Cracked Walls!
      if (player.activeAttackHitbox && player.activeAttackHitbox.isSpecial) {
        for (const plat of platforms) {
          if (plat.isCrackedWall && plat.wallId && !brokenWalls.has(plat.wallId)) {
            if (Physics.checkAABB(player.activeAttackHitbox, plat)) {
              brokenWalls.add(plat.wallId);
              if (onWallBroken) onWallBroken(plat.wallId);
              camera.triggerShake(22, 0.3);
              Sound.playSpecialAttack();
              Particles.emitDust(plat.x + plat.width / 2, plat.y + plat.height / 2, 25, '#78716c');
              Particles.emitSparks(plat.x + plat.width / 2, plat.y + plat.height / 2, 20, '#38bdf8');
            }
          }
        }
      }
    }

    // 2. Check Enemy Attacks against Player
    for (const enemy of enemies) {
      if (enemy.isDead || !enemy.activeAttackHitbox) continue;

      const eHit = enemy.activeAttackHitbox;
      const playerHurtbox = {
        x: player.x,
        y: player.y,
        width: player.width,
        height: player.height
      };

      // Check for PERFECT DODGE:
      // Player is in Dash state and dashed just as hitbox approaches or overlaps
      if (player.state === 'DASH' && Physics.checkAABB(eHit, playerHurtbox)) {
        if (player.stateTimer < 0.12) {
          // PERFECT DODGE TRIGGERED!
          perfectDodged = true;
          Sound.playPerfectDodge();
          camera.triggerShake(8, 0.1);
          Particles.addGhostTrail(player.x, player.y, player.width, player.height, player.facingRight, 'rgba(56, 189, 248, 0.9)');
          Particles.addDamageText('PERFECT DODGE!', player.x + player.width / 2, player.y - 20, '#38bdf8', true);
          // Grant brief counter energy
          player.heal(5);
        }
        continue;
      }

      // Player takes damage if not invincible
      if (!player.isInvincible && Physics.checkAABB(eHit, playerHurtbox)) {
        player.takeDamage(eHit.damage, eHit.knockbackX, eHit.knockbackY);
        camera.triggerShake(12, 0.2);
      }
    }

    return { weaponClashed, perfectDodged };
  }
}
