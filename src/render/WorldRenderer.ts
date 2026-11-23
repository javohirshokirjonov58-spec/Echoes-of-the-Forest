import { RoomDefinition, Platform, CollectibleData, NPCData } from '../game/Types';
import { Player } from '../game/Player';
import { Enemy, Projectile } from '../game/Enemies';
import { Boss } from '../game/Bosses';
import { DuelBot } from '../game/DuelBot';
import { Camera } from '../engine/Camera';

export class WorldRenderer {
  public static renderWorld(
    ctx: CanvasRenderingContext2D,
    room: RoomDefinition,
    camera: Camera,
    player: Player,
    enemies: Enemy[],
    bosses: Boss[],
    duelBot: DuelBot | null,
    projectiles: Projectile[],
    brokenWalls: Set<string>,
    collectedItems: Set<string>,
    gameTime: number
  ): void {
    // 1. Multi-Layer Parallax Background
    this.renderParallaxBackground(ctx, room.biome, camera, gameTime);

    // 2. Room Platforms, Hazards, Cracked Walls, Doors, Save Points
    ctx.save();
    ctx.translate(-camera.x + camera.shakeOffsetX, -camera.y + camera.shakeOffsetY);

    this.renderPlatforms(ctx, room.platforms, brokenWalls, room.biome);
    this.renderSavePoint(ctx, room, gameTime);
    this.renderCollectibles(ctx, room.collectibles, collectedItems, gameTime);
    this.renderNPCs(ctx, room.npcs, gameTime);

    // 3. Projectiles
    this.renderProjectiles(ctx, projectiles);

    // 4. Enemies & Bosses
    this.renderEnemies(ctx, enemies, gameTime);
    this.renderBosses(ctx, bosses, gameTime);

    // 5. Duel Bot (if present)
    if (duelBot && !duelBot.playerBody.state.includes('DEAD')) {
      this.renderDuelistBot(ctx, duelBot, gameTime);
    }

    // 6. Player
    this.renderPlayer(ctx, player, gameTime);

    ctx.restore();
  }

  private static renderParallaxBackground(
    ctx: CanvasRenderingContext2D,
    biome: string,
    camera: Camera,
    gameTime: number
  ): void {
    const w = 1920;
    const h = 1080;

    let skyTop = '#06101e';
    let skyBottom = '#0b233a';
    let mountainColor = '#0f314d';
    let treeMidColor = '#0e4143';

    if (biome === 'caverns') {
      skyTop = '#140c06';
      skyBottom = '#2d180a';
      mountainColor = '#3a200e';
      treeMidColor = '#4a2b13';
    } else if (biome === 'sanctuary') {
      skyTop = '#05131f';
      skyBottom = '#0c2e47';
      mountainColor = '#104666';
      treeMidColor = '#176082';
    } else if (biome === 'dark_heart') {
      skyTop = '#12051c';
      skyBottom = '#260a38';
      mountainColor = '#380f52';
      treeMidColor = '#4c146e';
    }

    // Base sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, skyTop);
    skyGrad.addColorStop(1, skyBottom);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Layer 1: Far silhouettes (0.1x parallax)
    ctx.save();
    ctx.fillStyle = mountainColor;
    const farOffsetX = (-camera.x * 0.1) % w;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = -w; x <= w * 2; x += 160) {
      const peakY = 550 + Math.sin((x + gameTime * 15) * 0.005) * 80;
      ctx.lineTo(x + farOffsetX, peakY);
    }
    ctx.lineTo(w * 2, h);
    ctx.fill();
    ctx.restore();

    // Layer 2: Mid layer ruins / trees (0.28x parallax)
    ctx.save();
    ctx.fillStyle = treeMidColor;
    const midOffsetX = (-camera.x * 0.28) % w;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = -w; x <= w * 2; x += 90) {
      const treeY = 680 + Math.cos((x + 120) * 0.01) * 60;
      ctx.lineTo(x + midOffsetX, treeY);
    }
    ctx.lineTo(w * 2, h);
    ctx.fill();
    ctx.restore();

    // Layer 3: Floating ambient spores / glowing particles
    ctx.save();
    for (let i = 0; i < 20; i++) {
      const px = ((i * 123 + gameTime * 25) % w);
      const py = ((i * 87 + Math.sin(gameTime + i) * 60) % h);
      ctx.fillStyle = biome === 'dark_heart' ? 'rgba(192, 132, 252, 0.4)' :
                      biome === 'caverns' ? 'rgba(251, 191, 36, 0.4)' :
                      biome === 'sanctuary' ? 'rgba(56, 189, 248, 0.4)' : 'rgba(74, 222, 128, 0.4)';
      ctx.beginPath();
      ctx.arc(px, py, 2.5 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private static renderPlatforms(
    ctx: CanvasRenderingContext2D,
    platforms: Platform[],
    brokenWalls: Set<string>,
    biome: string
  ): void {
    let platColor = '#1e293b';
    let borderColor = '#38bdf8';
    let topColor = '#10b981';

    if (biome === 'caverns') {
      platColor = '#382215';
      borderColor = '#f59e0b';
      topColor = '#d97706';
    } else if (biome === 'sanctuary') {
      platColor = '#13283b';
      borderColor = '#06b6d4';
      topColor = '#38bdf8';
    } else if (biome === 'dark_heart') {
      platColor = '#241033';
      borderColor = '#a855f7';
      topColor = '#9333ea';
    }

    for (const p of platforms) {
      if (p.isCrackedWall && p.wallId && brokenWalls.has(p.wallId)) {
        continue; // broken wall
      }

      ctx.save();

      if (p.isHazard) {
        // Red / green spikes
        ctx.fillStyle = '#dc2626';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.fillRect(p.x, p.y, p.width, p.height);

        // Draw spike triangles
        const spikeCount = Math.floor(p.width / 20);
        ctx.fillStyle = '#f87171';
        for (let s = 0; s < spikeCount; s++) {
          ctx.beginPath();
          ctx.moveTo(p.x + s * 20, p.y);
          ctx.lineTo(p.x + s * 20 + 10, p.y - 12);
          ctx.lineTo(p.x + s * 20 + 20, p.y);
          ctx.fill();
        }
      } else if (p.isCrackedWall) {
        // Cracked stone wall (Special Attack Q gate)
        ctx.fillStyle = '#44403c';
        ctx.strokeStyle = '#78716c';
        ctx.lineWidth = 3;
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.strokeRect(p.x, p.y, p.width, p.height);

        // Cracks & rune glowing lines
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x + 20, p.y);
        ctx.lineTo(p.x + 40, p.y + p.height * 0.4);
        ctx.lineTo(p.x + 20, p.y + p.height * 0.8);
        ctx.lineTo(p.x + 50, p.y + p.height);
        ctx.stroke();

        ctx.font = "bold 13px 'Rajdhani', sans-serif";
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'center';
        ctx.fillText("[Q] ZARBA", p.x + p.width / 2, p.y + p.height / 2);
      } else {
        // Solid platform
        ctx.fillStyle = platColor;
        ctx.fillRect(p.x, p.y, p.width, p.height);

        // Top grass/ruin edge
        ctx.fillStyle = topColor;
        ctx.fillRect(p.x, p.y, p.width, 6);

        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(p.x, p.y, p.width, p.height);
      }

      ctx.restore();
    }
  }

  private static renderSavePoint(
    ctx: CanvasRenderingContext2D,
    room: RoomDefinition,
    gameTime: number
  ): void {
    if (!room.savePoint) return;
    const sp = room.savePoint;

    ctx.save();
    // Glowing altar
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 18;
    ctx.fillRect(sp.x - 30, sp.y, 60, 45);
    ctx.strokeRect(sp.x - 30, sp.y, 60, 45);

    // Hovering flame/orb
    const hoverY = sp.y - 25 + Math.sin(gameTime * 4) * 6;
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.arc(sp.x, hoverY, 12, 0, Math.PI * 2);
    ctx.fill();

    // Interaction hint
    ctx.font = "bold 14px 'Rajdhani', sans-serif";
    ctx.fillStyle = '#86efac';
    ctx.textAlign = 'center';
    ctx.fillText("[E] SAQLASH", sp.x, sp.y - 45);

    ctx.restore();
  }

  private static renderCollectibles(
    ctx: CanvasRenderingContext2D,
    collectibles: CollectibleData[] | undefined,
    collectedItems: Set<string>,
    gameTime: number
  ): void {
    if (!collectibles) return;

    for (const c of collectibles) {
      if (collectedItems.has(c.id)) continue;

      ctx.save();
      const hoverY = c.y + Math.sin(gameTime * 3) * 6;
      let color = '#38bdf8';
      let icon = '💎';

      if (c.type === 'HP_UPGRADE') {
        color = '#ef4444';
        icon = '❤️';
      } else if (c.type === 'ENERGY_UPGRADE') {
        color = '#0284c7';
        icon = '⚡';
      } else if (c.type === 'LORE_FRAGMENT') {
        color = '#fbbf24';
        icon = '📜';
      }

      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(c.x, hoverY, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = "bold 14px 'Rajdhani', sans-serif";
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(c.name, c.x, hoverY - 20);

      ctx.restore();
    }
  }

  private static renderNPCs(
    ctx: CanvasRenderingContext2D,
    npcs: NPCData[] | undefined,
    gameTime: number
  ): void {
    if (!npcs) return;

    for (const npc of npcs) {
      ctx.save();
      // Robed figure
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.fillRect(npc.x - 20, npc.y - 70, 40, 70);
      ctx.strokeRect(npc.x - 20, npc.y - 70, 40, 70);

      // Name & Title
      ctx.font = "bold 15px 'Cinzel', serif";
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText(npc.name, npc.x, npc.y - 95);

      ctx.font = "12px 'Rajdhani', sans-serif";
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(npc.title, npc.x, npc.y - 80);

      // Talk prompt
      ctx.font = "bold 13px 'Rajdhani', sans-serif";
      ctx.fillStyle = '#f8fafc';
      ctx.fillText("[E] Gaplashish", npc.x, npc.y - 110);

      ctx.restore();
    }
  }

  private static renderProjectiles(ctx: CanvasRenderingContext2D, projectiles: Projectile[]): void {
    for (const p of projectiles) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private static renderEnemies(ctx: CanvasRenderingContext2D, enemies: Enemy[], gameTime: number): void {
    for (const e of enemies) {
      if (e.isDead) continue;

      ctx.save();
      let color = '#ef4444';
      if (e.type === 'SHIELDED') color = '#0284c7';
      if (e.type === 'RANGED_SPITTER') color = '#22c55e';
      if (e.type === 'CHARGER') color = '#f97316';
      if (e.type === 'ELITE_BRUISER') color = '#991b1b';

      ctx.fillStyle = color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.fillRect(e.x, e.y, e.width, e.height);
      ctx.strokeRect(e.x, e.y, e.width, e.height);

      // Facing eye indicator
      ctx.fillStyle = '#ffffff';
      const eyeX = e.facingRight ? e.x + e.width - 12 : e.x + 4;
      ctx.fillRect(eyeX, e.y + 12, 8, 8);

      // Attack hitbox telegraph visual flash
      if (e.activeAttackHitbox) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.fillRect(e.activeAttackHitbox.x, e.activeAttackHitbox.y, e.activeAttackHitbox.width, e.activeAttackHitbox.height);
      }

      ctx.restore();
    }
  }

  private static renderBosses(ctx: CanvasRenderingContext2D, bosses: Boss[], gameTime: number): void {
    for (const b of bosses) {
      if (b.isDead) continue;

      ctx.save();
      let bossColor = '#b91c1c';
      if (b.type === 'BOSS_TREANT') bossColor = '#15803d';
      if (b.type === 'BOSS_BEHEMOTH') bossColor = '#c2410c';
      if (b.type === 'BOSS_SENTINEL') bossColor = '#0369a1';
      if (b.type === 'BOSS_SOVEREIGN') bossColor = '#6b21a8';

      // Boss Body
      ctx.fillStyle = bossColor;
      ctx.strokeStyle = b.isVulnerableWindow ? '#facc15' : '#ffffff';
      ctx.lineWidth = b.isVulnerableWindow ? 4 : 2;
      if (b.isVulnerableWindow) {
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 18;
      }
      ctx.fillRect(b.x, b.y, b.width, b.height);
      ctx.strokeRect(b.x, b.y, b.width, b.height);

      // Glowing Eyes
      ctx.fillStyle = b.phase === 3 ? '#ef4444' : '#fef08a';
      const eyeX = b.facingRight ? b.x + b.width - 24 : b.x + 8;
      ctx.fillRect(eyeX, b.y + 20, 16, 12);

      // Attack hitbox
      if (b.activeAttackHitbox) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
        ctx.fillRect(b.activeAttackHitbox.x, b.activeAttackHitbox.y, b.activeAttackHitbox.width, b.activeAttackHitbox.height);
      }

      ctx.restore();
    }
  }

  private static renderDuelistBot(ctx: CanvasRenderingContext2D, bot: DuelBot, gameTime: number): void {
    const p = bot.playerBody;
    ctx.save();

    // Dark spectral duelist style
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 12;

    ctx.fillRect(p.x, p.y, p.width, p.height);
    ctx.strokeRect(p.x, p.y, p.width, p.height);

    // Flowing dark cloak
    ctx.fillStyle = '#6b21a8';
    const cloakX = p.facingRight ? p.x - 8 : p.x + p.width - 4;
    ctx.fillRect(cloakX, p.y + 16, 12, p.height - 18);

    // Glowing visor
    ctx.fillStyle = '#c084fc';
    const eyeX = p.facingRight ? p.x + p.width - 14 : p.x + 4;
    ctx.fillRect(eyeX, p.y + 14, 10, 6);

    // Active Attack Weapon Trail
    if (p.activeAttackHitbox) {
      ctx.fillStyle = 'rgba(192, 132, 252, 0.5)';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 15;
      ctx.fillRect(p.activeAttackHitbox.x, p.activeAttackHitbox.y, p.activeAttackHitbox.width, p.activeAttackHitbox.height);
    }

    // Name overhead
    ctx.font = "bold 14px 'Cinzel', serif";
    ctx.fillStyle = '#c084fc';
    ctx.textAlign = 'center';
    ctx.fillText(`Jangchi Bot [${bot.difficulty.toUpperCase()}]`, p.x + p.width / 2, p.y - 12);

    ctx.restore();
  }

  private static renderPlayer(ctx: CanvasRenderingContext2D, player: Player, gameTime: number): void {
    ctx.save();

    // Hurt flash
    if (player.isInvincible && Math.floor(gameTime * 30) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // Hero Body
    ctx.fillStyle = '#0284c7';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;

    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.strokeRect(player.x, player.y, player.width, player.height);

    // Cloak
    ctx.fillStyle = '#0369a1';
    const cloakX = player.facingRight ? player.x - 6 : player.x + player.width - 4;
    ctx.fillRect(cloakX, player.y + 14, 10, player.height - 18);

    // Eyes / Visor
    ctx.fillStyle = '#ffffff';
    const eyeX = player.facingRight ? player.x + player.width - 12 : player.x + 4;
    ctx.fillRect(eyeX, player.y + 12, 8, 6);

    // Attack Swing Slash Trail
    if (player.activeAttackHitbox) {
      ctx.fillStyle = player.activeAttackHitbox.isSpecial ? 'rgba(56, 189, 248, 0.65)' : 'rgba(254, 240, 138, 0.55)';
      ctx.shadowColor = player.activeAttackHitbox.isSpecial ? '#38bdf8' : '#fde047';
      ctx.shadowBlur = 16;
      ctx.fillRect(
        player.activeAttackHitbox.x, 
        player.activeAttackHitbox.y, 
        player.activeAttackHitbox.width, 
        player.activeAttackHitbox.height
      );
    }

    ctx.restore();
  }
}
