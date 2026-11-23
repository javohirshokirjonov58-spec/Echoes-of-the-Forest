import { WORLD_ROOMS } from '../game/WorldData';
import { Player } from './Player';

export class MapRenderer {
  public zoom: number = 1.0;
  public panX: number = 0;
  public panY: number = 0;

  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;

  constructor() {
    this.setupMouseEvents();
  }

  private setupMouseEvents(): void {
    window.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.dragStartX = e.clientX - this.panX;
      this.dragStartY = e.clientY - this.panY;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this.panX = e.clientX - this.dragStartX;
        this.panY = e.clientY - this.dragStartY;
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    window.addEventListener('wheel', (e) => {
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      this.zoom = Math.max(0.6, Math.min(2.2, this.zoom * zoomFactor));
    });
  }

  public renderWorldMap(
    ctx: CanvasRenderingContext2D,
    screenWidth: number,
    screenHeight: number,
    currentRoomId: string,
    discoveredRooms: Set<string>,
    player: Player
  ): void {
    // Dim background overlay
    ctx.save();
    ctx.fillStyle = 'rgba(2, 6, 23, 0.92)';
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    // Header and Title
    ctx.font = "bold 32px 'Cinzel', serif";
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 15;
    ctx.textAlign = 'center';
    ctx.fillText("DUNYO XARITASI (WORLD MAP)", screenWidth / 2, 65);

    // Exploration Percentage
    const totalRooms = Object.keys(WORLD_ROOMS).length;
    const discoveredCount = discoveredRooms.size;
    const percent = Math.round((discoveredCount / totalRooms) * 100);

    ctx.font = "bold 20px 'Rajdhani', sans-serif";
    ctx.fillStyle = '#94a3b8';
    ctx.shadowBlur = 0;
    ctx.fillText(`Ochilgan xududlar: ${discoveredCount}/${totalRooms} (${percent}%)`, screenWidth / 2, 100);

    // Legend & Controls info
    ctx.font = "16px 'Rajdhani', sans-serif";
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';
    ctx.fillText("Surish: Sichqoncha bilan tortish | Kattalashtirish: Sichqoncha g'ildiragi | Chiqish: [M] yoki [Tab]", 50, screenHeight - 35);

    // Biome Legend in top left
    this.renderLegend(ctx, 50, 60);

    // Map Center Offset
    ctx.translate(screenWidth / 2 + this.panX, screenHeight / 2 + 30 + this.panY);
    ctx.scale(this.zoom, this.zoom);

    const cellW = 120;
    const cellH = 80;
    const gridOffsetX = -4 * cellW;
    const gridOffsetY = -2.8 * cellH;

    // Render Room Boxes
    for (const [roomId, room] of Object.entries(WORLD_ROOMS)) {
      const isDiscovered = discoveredRooms.has(roomId);
      const isCurrent = roomId === currentRoomId;

      const rx = gridOffsetX + room.gridX * (cellW + 16);
      const ry = gridOffsetY + room.gridY * (cellH + 16);

      ctx.save();
      if (!isDiscovered) {
        // Fog of War: Unexplored room silhouette
        ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(rx, ry, cellW, cellH);
        ctx.fillRect(rx, ry, cellW, cellH);
      } else {
        // Discovered Room: Biome Color
        let biomeColor = '#10b981'; // Forest
        if (room.biome === 'caverns') biomeColor = '#f59e0b';
        if (room.biome === 'sanctuary') biomeColor = '#06b6d4';
        if (room.biome === 'dark_heart') biomeColor = '#a855f7';

        ctx.fillStyle = isCurrent ? 'rgba(56, 189, 248, 0.35)' : 'rgba(30, 41, 59, 0.85)';
        ctx.strokeStyle = isCurrent ? '#38bdf8' : biomeColor;
        ctx.lineWidth = isCurrent ? 3 : 2;

        if (isCurrent) {
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 12;
        }

        ctx.fillRect(rx, ry, cellW, cellH);
        ctx.strokeRect(rx, ry, cellW, cellH);

        // Room name label
        ctx.font = "bold 11px 'Rajdhani', sans-serif";
        ctx.fillStyle = '#f1f5f9';
        ctx.shadowBlur = 0;
        ctx.textAlign = 'center';
        const shortName = room.name.split('-')[1]?.trim() || room.name;
        ctx.fillText(shortName.substring(0, 14), rx + cellW / 2, ry + cellH / 2 - 8);

        // Icons inside room
        let iconOffset = 0;
        if (room.savePoint) {
          ctx.fillStyle = '#4ade80';
          ctx.font = "bold 14px 'Rajdhani', sans-serif";
          ctx.fillText("🪔 Save", rx + 30, ry + cellH - 12);
          iconOffset += 35;
        }
        if (room.boss && room.boss.length > 0) {
          ctx.fillStyle = '#ef4444';
          ctx.font = "bold 14px 'Rajdhani', sans-serif";
          ctx.fillText("💀 Boss", rx + cellW - 32, ry + cellH - 12);
        }

        // Ability gate markers
        for (const p of room.platforms) {
          if (p.gateType) {
            ctx.fillStyle = '#f97316';
            ctx.font = "bold 10px 'Rajdhani', sans-serif";
            const gateName = p.gateType === 'DOUBLE_JUMP' ? '2x Sakrash' :
                             p.gateType === 'DASH' ? 'Dash' :
                             p.gateType === 'WALL_CLIMB' ? 'Devor' : 'Maxsus Q';
            ctx.fillText(`🔒 ${gateName}`, rx + cellW / 2, ry + cellH / 2 + 10);
            break;
          }
        }

        // Player marker
        if (isCurrent) {
          const normX = Math.max(0, Math.min(1, player.x / room.width));
          const normY = Math.max(0, Math.min(1, player.y / room.height));
          const px = rx + normX * cellW;
          const py = ry + normY * cellH;

          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.arc(px, py, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    ctx.restore();
  }

  private renderLegend(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const biomes = [
      { name: "Sokin O'rmon", color: '#10b981' },
      { name: "Ildiz G'orlari", color: '#f59e0b' },
      { name: "Unutilgan Ma'bad", color: '#06b6d4' },
      { name: "Qorong'i Yurak", color: '#a855f7' }
    ];

    ctx.save();
    ctx.font = "14px 'Rajdhani', sans-serif";
    ctx.textAlign = 'left';

    biomes.forEach((b, i) => {
      ctx.fillStyle = b.color;
      ctx.fillRect(x, y + i * 22, 14, 14);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(b.name, x + 24, y + i * 22 + 12);
    });
    ctx.restore();
  }

  public renderMinimap(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    currentRoomId: string,
    discoveredRooms: Set<string>
  ): void {
    const currentRoom = WORLD_ROOMS[currentRoomId];
    if (!currentRoom) return;

    ctx.save();
    // Minimap border container
    ctx.fillStyle = 'rgba(2, 6, 23, 0.75)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, 160, 110);
    ctx.strokeRect(x, y, 160, 110);

    const miniW = 34;
    const miniH = 22;
    const centerX = x + 80;
    const centerY = y + 55;

    // Render adjacent rooms
    for (const [rId, room] of Object.entries(WORLD_ROOMS)) {
      if (!discoveredRooms.has(rId)) continue;

      const diffGridX = room.gridX - currentRoom.gridX;
      const diffGridY = room.gridY - currentRoom.gridY;

      if (Math.abs(diffGridX) <= 1 && Math.abs(diffGridY) <= 1) {
        const mrx = centerX + diffGridX * (miniW + 4) - miniW / 2;
        const mry = centerY + diffGridY * (miniH + 4) - miniH / 2;

        const isCur = rId === currentRoomId;
        ctx.fillStyle = isCur ? '#38bdf8' : 'rgba(71, 85, 105, 0.8)';
        ctx.strokeStyle = isCur ? '#ffffff' : 'rgba(148, 163, 184, 0.4)';
        ctx.lineWidth = 1;
        ctx.fillRect(mrx, mry, miniW, miniH);
        ctx.strokeRect(mrx, mry, miniW, miniH);
      }
    }

    ctx.restore();
  }
}

export const WorldMap = new MapRenderer();
