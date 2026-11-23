import { Platform } from './Types';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Physics {
  public static readonly GRAVITY = 1800; // px/s^2
  public static readonly MAX_FALL_SPEED = 1200;

  public static checkAABB(a: BoundingBox, b: BoundingBox): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  // Resolves horizontal and vertical collisions against solid platforms
  public static resolveEntityMovement(
    entity: {
      x: number;
      y: number;
      width: number;
      height: number;
      vx: number;
      vy: number;
    },
    dt: number,
    platforms: Platform[],
    brokenWalls: Set<string>
  ): {
    onGround: boolean;
    hitCeiling: boolean;
    onWallLeft: boolean;
    onWallRight: boolean;
    hitHazard: boolean;
  } {
    let onGround = false;
    let hitCeiling = false;
    let onWallLeft = false;
    let onWallRight = false;
    let hitHazard = false;

    // Filter out destroyed cracked walls
    const activePlatforms = platforms.filter(p => {
      if (p.isCrackedWall && p.wallId && brokenWalls.has(p.wallId)) {
        return false;
      }
      return true;
    });

    // 1. Move Horizontally
    entity.x += entity.vx * dt;

    const entityBox: BoundingBox = {
      x: entity.x,
      y: entity.y,
      width: entity.width,
      height: entity.height
    };

    for (const plat of activePlatforms) {
      if (plat.isOneWay) continue; // ignore on horizontal

      if (Physics.checkAABB(entityBox, plat)) {
        if (plat.isHazard) {
          hitHazard = true;
          continue;
        }

        if (entity.vx > 0) {
          // Moving right, hit left side of platform
          entity.x = plat.x - entity.width;
          entity.vx = 0;
          onWallRight = true;
        } else if (entity.vx < 0) {
          // Moving left, hit right side of platform
          entity.x = plat.x + plat.width;
          entity.vx = 0;
          onWallLeft = true;
        }
        entityBox.x = entity.x;
      }
    }

    // 2. Move Vertically
    const prevY = entity.y;
    entity.y += entity.vy * dt;
    entityBox.y = entity.y;

    for (const plat of activePlatforms) {
      if (Physics.checkAABB(entityBox, plat)) {
        if (plat.isHazard) {
          hitHazard = true;
          continue;
        }

        if (plat.isOneWay) {
          // One-way: only collide if we were falling and previously above the top edge
          if (entity.vy > 0 && prevY + entity.height <= plat.y + 12) {
            entity.y = plat.y - entity.height;
            entity.vy = 0;
            onGround = true;
            entityBox.y = entity.y;
          }
          continue;
        }

        if (entity.vy > 0) {
          // Moving down, hit floor
          entity.y = plat.y - entity.height;
          entity.vy = 0;
          onGround = true;
        } else if (entity.vy < 0) {
          // Moving up, hit ceiling
          entity.y = plat.y + plat.height;
          entity.vy = 0;
          hitCeiling = true;
        }
        entityBox.y = entity.y;
      }
    }

    return { onGround, hitCeiling, onWallLeft, onWallRight, hitHazard };
  }
}
