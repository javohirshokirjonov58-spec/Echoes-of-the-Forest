import { Player } from '../game/Player';
import { Boss } from '../game/Bosses';
import { DialogueSystem } from '../game/DialogueSystem';
import { QuestSystem } from '../game/QuestSystem';
import { AchievementSystem } from '../game/Achievements';
import { InputManager } from '../engine/InputManager';
import { AudioManager } from '../engine/AudioManager';
import { SaveManager } from '../engine/SaveManager';

export class UIRenderer {
  public static renderGameplayHUD(
    ctx: CanvasRenderingContext2D,
    player: Player,
    quests: QuestSystem,
    achievements: AchievementSystem,
    input: InputManager,
    saveConfirmTimer: number
  ): void {
    ctx.save();

    // 1. Player Health Bar
    const hpX = 40;
    const hpY = 40;
    const barWidth = 260;
    const barHeight = 22;

    // Background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.fillRect(hpX, hpY, barWidth, barHeight);
    ctx.strokeRect(hpX, hpY, barWidth, barHeight);

    // HP Fill
    const hpRatio = Math.max(0, player.hp / player.maxHp);
    const fillW = Math.round(barWidth * hpRatio);
    const hpGradient = ctx.createLinearGradient(hpX, 0, hpX + barWidth, 0);
    hpGradient.addColorStop(0, '#ef4444');
    hpGradient.addColorStop(1, '#f87171');
    ctx.fillStyle = hpGradient;
    ctx.fillRect(hpX, hpY, fillW, barHeight);

    // HP Text
    ctx.font = "bold 13px 'Rajdhani', sans-serif";
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.textAlign = 'center';
    ctx.fillText(`HP: ${Math.round(player.hp)} / ${player.maxHp}`, hpX + barWidth / 2, hpY + 16);

    // 2. Player Energy Bar
    const enY = hpY + barHeight + 8;
    const enHeight = 12;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeRect(hpX, enY, barWidth, enHeight);
    ctx.fillRect(hpX, enY, barWidth, enHeight);

    const enRatio = Math.max(0, player.energy / player.maxEnergy);
    const enGradient = ctx.createLinearGradient(hpX, 0, hpX + barWidth, 0);
    enGradient.addColorStop(0, '#0284c7');
    enGradient.addColorStop(1, '#38bdf8');
    ctx.fillStyle = enGradient;
    ctx.fillRect(hpX, enY, Math.round(barWidth * enRatio), enHeight);

    // 3. Timeless Ability Icons (0s Cooldown - Always active, no grey-out!)
    const abY = enY + enHeight + 16;
    const abilities = [
      { 
        name: '2x Jump', 
        key: 'Space', 
        has: player.hasDoubleJump, 
        active: player.state === 'JUMP' 
      },
      { 
        name: 'Dash', 
        key: 'K', 
        has: player.hasDash, 
        active: player.state === 'DASH' 
      },
      { 
        name: 'Wall Climb', 
        key: 'W/S', 
        has: player.hasWallClimb, 
        active: player.state === 'WALL_SLIDE' 
      },
      { 
        name: 'Special Q', 
        key: 'Q', 
        has: player.hasSpecialAttack, 
        active: player.state === 'SPECIAL_ATTACK' 
      }
    ];

    abilities.forEach((ab, i) => {
      const ax = hpX + i * 68;
      ctx.save();
      ctx.fillStyle = ab.has 
        ? (ab.active ? 'rgba(56, 189, 248, 0.4)' : 'rgba(30, 41, 59, 0.8)') 
        : 'rgba(15, 23, 42, 0.4)';
      ctx.strokeStyle = ab.has ? (ab.active ? '#ffffff' : '#38bdf8') : '#475569';
      ctx.lineWidth = ab.active ? 2.5 : 1.5;
      if (ab.active) {
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
      }
      ctx.fillRect(ax, abY, 56, 48);
      ctx.strokeRect(ax, abY, 56, 48);

      // Key hint
      ctx.font = "bold 11px 'Rajdhani', sans-serif";
      ctx.fillStyle = ab.has ? '#f8fafc' : '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText(ab.key, ax + 28, abY + 18);

      // Ability name
      ctx.font = "10px 'Rajdhani', sans-serif";
      ctx.fillStyle = ab.has ? '#94a3b8' : '#475569';
      ctx.fillText(ab.name, ax + 28, abY + 38);
      ctx.restore();
    });

    // 4. Save Confirmed visual feedback
    if (saveConfirmTimer > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(34, 197, 94, 0.9)';
      ctx.font = "bold 18px 'Rajdhani', sans-serif";
      ctx.textAlign = 'left';
      ctx.fillText("✓ O'YIN SAQLANDI (GAME SAVED)", hpX, abY + 75);
      ctx.restore();
    }

    // 5. Toast Notifications (Quest & Achievement)
    if (quests.currentToast) {
      this.renderToast(ctx, quests.currentToast, '#38bdf8');
    } else if (achievements.currentToast) {
      this.renderToast(ctx, `🏆 Yutuq: ${achievements.currentToast.title}`, '#fbbf24');
    }

    ctx.restore();
  }

  private static renderToast(ctx: CanvasRenderingContext2D, text: string, color: string): void {
    ctx.save();
    const tw = 380;
    const th = 48;
    const tx = 960 - tw / 2;
    const ty = 40;

    ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fillRect(tx, ty, tw, th);
    ctx.strokeRect(tx, ty, tw, th);

    ctx.font = "bold 16px 'Rajdhani', sans-serif";
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.shadowBlur = 0;
    ctx.fillText(text, 960, ty + 30);
    ctx.restore();
  }

  public static renderBossHUD(ctx: CanvasRenderingContext2D, boss: Boss): void {
    ctx.save();
    const bx = 960 - 300;
    const by = 40;
    const bw = 600;
    const bh = 24;

    // Boss Name & Phase
    ctx.font = "bold 22px 'Cinzel', serif";
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#dc2626';
    ctx.shadowBlur = 10;
    ctx.textAlign = 'center';
    ctx.fillText(`${boss.name} [Faza ${boss.phase}]`, 960, by - 10);

    // Frame
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeRect(bx, by, bw, bh);

    // HP Fill
    const ratio = Math.max(0, boss.hp / boss.maxHp);
    const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    grad.addColorStop(0, '#991b1b');
    grad.addColorStop(1, '#ef4444');
    ctx.fillStyle = grad;
    ctx.fillRect(bx, by, Math.round(bw * ratio), bh);

    // Phase threshold notches at 65% and 30%
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2;
    [0.65, 0.30].forEach(p => {
      const nx = bx + bw * p;
      ctx.beginPath();
      ctx.moveTo(nx, by - 4);
      ctx.lineTo(nx, by + bh + 4);
      ctx.stroke();
    });

    // Damage Window text indicator
    if (boss.isVulnerableWindow) {
      ctx.font = "bold 16px 'Rajdhani', sans-serif";
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#ca8a04';
      ctx.shadowBlur = 8;
      ctx.fillText("⚡ ZARBA OYNASI (HURT/DAMAGE WINDOW) - 1.5x ZARAR!", 960, by + bh + 25);
    }

    ctx.restore();
  }

  public static renderDialogue(ctx: CanvasRenderingContext2D, dialogue: DialogueSystem): void {
    if (!dialogue.isActive || !dialogue.currentNode) return;
    const node = dialogue.currentNode;

    ctx.save();
    const boxX = 320;
    const boxY = 740;
    const boxW = 1280;
    const boxH = 260;

    // Dark backdrop
    ctx.fillStyle = 'rgba(2, 6, 23, 0.95)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 18;
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Speaker Name & Title
    ctx.font = "bold 24px 'Cinzel', serif";
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'left';
    ctx.fillText(node.speakerName, boxX + 40, boxY + 45);

    ctx.font = "16px 'Rajdhani', sans-serif";
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`— ${node.speakerTitle}`, boxX + 50 + ctx.measureText(node.speakerName).width, boxY + 45);

    // Typewriter Text
    ctx.font = "20px 'Rajdhani', sans-serif";
    ctx.fillStyle = '#f1f5f9';
    this.renderWrappedText(ctx, dialogue.displayedText, boxX + 40, boxY + 90, boxW - 80, 28);

    // Branching Choices (if present)
    if (node.choices && node.choices.length > 0) {
      const choiceStartY = boxY + 160;
      node.choices.forEach((c, idx) => {
        const isSelected = idx === dialogue.selectedChoiceIndex;
        ctx.fillStyle = isSelected ? '#38bdf8' : '#64748b';
        ctx.font = isSelected ? "bold 20px 'Rajdhani', sans-serif" : "18px 'Rajdhani', sans-serif";
        ctx.fillText(`${isSelected ? '▶ ' : '   '}${c.text}`, boxX + 60, choiceStartY + idx * 32);
      });
    }

    // Skip / Advance hint in bottom right
    ctx.font = "14px 'Rajdhani', sans-serif";
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';
    ctx.fillText("[E] yoki [Space] — Davom etish / Tanlash", boxX + boxW - 40, boxY + boxH - 20);

    ctx.restore();
  }

  private static renderWrappedText(
    ctx: CanvasRenderingContext2D, 
    text: string, 
    x: number, 
    y: number, 
    maxWidth: number, 
    lineHeight: number
  ): void {
    const words = text.split(' ');
    let line = '';
    let currY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, currY);
        line = words[n] + ' ';
        currY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currY);
  }

  public static renderQuestLog(ctx: CanvasRenderingContext2D, quests: QuestSystem): void {
    ctx.save();
    ctx.fillStyle = 'rgba(2, 6, 23, 0.94)';
    ctx.fillRect(0, 0, 1920, 1080);

    ctx.font = "bold 34px 'Cinzel', serif";
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText("VAZIFALAR RO'YXATI (QUEST LOG)", 960, 90);

    let mainY = 170;
    ctx.font = "bold 24px 'Rajdhani', sans-serif";
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'left';
    ctx.fillText("ASOSIY HIKOYA TOPSHIRIQLARI (MAIN QUESTS):", 200, mainY);

    let sideY = 560;
    ctx.fillText("QO'SHIMCHA TOPSHIRIQLAR (SIDE QUESTS):", 200, sideY);

    quests.quests.forEach((q) => {
      const isMain = q.category === 'MAIN';
      const qy = isMain ? mainY + 45 : sideY + 45;
      if (isMain) mainY += 70; else sideY += 70;

      // Status badge
      let badgeColor = '#64748b';
      let statusText = '[QULFLANGAN]';
      if (q.status === 'ACTIVE') {
        badgeColor = '#38bdf8';
        statusText = '[FAOL]';
      } else if (q.status === 'COMPLETED') {
        badgeColor = '#22c55e';
        statusText = '[BAJARILDI]';
      }

      ctx.fillStyle = badgeColor;
      ctx.font = "bold 16px 'Rajdhani', sans-serif";
      ctx.fillText(statusText, 220, qy);

      // Title & Area
      ctx.fillStyle = q.status === 'ACTIVE' ? '#ffffff' : '#94a3b8';
      ctx.font = "bold 18px 'Rajdhani', sans-serif";
      ctx.fillText(`${q.title} (${q.area})`, 340, qy);

      // Description
      ctx.fillStyle = '#64748b';
      ctx.font = "15px 'Rajdhani', sans-serif";
      ctx.fillText(q.description, 340, qy + 20);
    });

    ctx.font = "16px 'Rajdhani', sans-serif";
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText("[M] yoki [Tab] — Chiqish", 960, 1020);

    ctx.restore();
  }

  public static renderInventoryAndLore(
    ctx: CanvasRenderingContext2D,
    player: Player,
    collectedItems: Set<string>
  ): void {
    ctx.save();
    ctx.fillStyle = 'rgba(2, 6, 23, 0.94)';
    ctx.fillRect(0, 0, 1920, 1080);

    ctx.font = "bold 34px 'Cinzel', serif";
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText("INVENTAR VA QADIMIY LORE (INVENTORY & LORE)", 960, 90);

    // Left Column: Abilities
    ctx.font = "bold 24px 'Rajdhani', sans-serif";
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'left';
    ctx.fillText("QOBILIYATLAR (ABILITIES):", 200, 170);

    const abils = [
      { name: "Double Jump (Ikki marta sakrash)", has: player.hasDoubleJump, desc: "Havoda qo'shimcha sakrash imkoniyati. Baland platformalarni ochadi." },
      { name: "Dash (Shamol siljishi)", has: player.hasDash, desc: "Gorizontal tezkor harakat va daxlsizlik (i-frame). Jarliklardan o'tish uchun." },
      { name: "Wall Climb (Devorga tirmashish)", has: player.hasWallClimb, desc: "Tik devorlarda sirpanish va sakrash. Baland minoralarga ko'taradi." },
      { name: "Special Attack Q (Spektral zarba)", has: player.hasSpecialAttack, desc: "Kuchli yoruvchi to'lqin: yoriqli tosh devorlarni parchalaydi va qalqonni teshib o'tadi." }
    ];

    abils.forEach((a, i) => {
      const ay = 220 + i * 80;
      ctx.fillStyle = a.has ? '#38bdf8' : '#475569';
      ctx.font = "bold 18px 'Rajdhani', sans-serif";
      ctx.fillText(`${a.has ? '✓ ' : '✗ '}${a.name}`, 220, ay);

      ctx.fillStyle = a.has ? '#94a3b8' : '#334155';
      ctx.font = "15px 'Rajdhani', sans-serif";
      ctx.fillText(a.desc, 240, ay + 22);
    });

    // Right Column: Lore Fragments
    ctx.font = "bold 24px 'Rajdhani', sans-serif";
    ctx.fillStyle = '#f8fafc';
    ctx.fillText("QADIMIY SOLNOMALAR (LORE TABLETS):", 1000, 170);

    const lores = [
      { id: 'item_lore_tablet_1', title: "Qadimiy O'rmon Solnomasi (I)", text: "Buyuk daraxt ildizlari qachonlardir butun olamni birlashtirib turgan..." },
      { id: 'item_lore_tablet_2', title: "Ildizlar Qasamyodi (II)", text: "Zulmat pastdan boshlandi, chuqur ildizlar birinchi bo'lib chiridi..." },
      { id: 'item_lore_tablet_3', title: "Yorug'lik Muhrlari (III)", text: "To'rtta qadimiy ashyo birlashgandagina Qorong'i Yurakni tozalash mumkin..." },
      { id: 'item_lore_tablet_4', title: "So'nggi Haqiqat (IV)", text: "Hukmdor yovuz emas edi; u shunchaki unutilgan alam va kibr qurboni bo'ldi..." }
    ];

    lores.forEach((l, i) => {
      const ly = 220 + i * 80;
      const hasLore = collectedItems.has(l.id);
      ctx.fillStyle = hasLore ? '#fbbf24' : '#475569';
      ctx.font = "bold 18px 'Rajdhani', sans-serif";
      ctx.fillText(`${hasLore ? '📜 ' : '🔒 '}${l.title}`, 1020, ly);

      ctx.fillStyle = hasLore ? '#cbd5e1' : '#334155';
      ctx.font = "15px 'Rajdhani', sans-serif";
      ctx.fillText(hasLore ? l.text : "[Hali topilmagan]", 1050, ly + 22);
    });

    ctx.font = "16px 'Rajdhani', sans-serif";
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText("[Tab] — Chiqish", 960, 1020);

    ctx.restore();
  }

  public static renderEndingScreen(
    ctx: CanvasRenderingContext2D,
    isTrueEnding: boolean,
    playTimeSeconds: number,
    roomsDiscoveredCount: number,
    totalRooms: number,
    bossesDefeatedCount: number,
    onMenuReturn: () => void
  ): void {
    ctx.save();
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, 1920, 1080);

    const title = isTrueEnding ? "HAQIQIY YAKUN: O'RMON NAJOTI" : "ASOSIY YAKUN: ZULMATNING QULASHI";
    const sub = isTrueEnding 
      ? "Siz to'rtta solnoma va Poklash Yodgorligi yordamida Qorong'i Yurakni davoladingiz. O'rmon yana gulladi!"
      : "Qoraygan Yurak Hukmdori mag'lub etildi. Qorong'ulik chekindi, ammo o'rmon chandiqlari butunlay bitmadi.";

    ctx.font = "bold 44px 'Cinzel', serif";
    ctx.fillStyle = isTrueEnding ? '#38bdf8' : '#f87171';
    ctx.shadowColor = isTrueEnding ? '#0284c7' : '#dc2626';
    ctx.shadowBlur = 20;
    ctx.textAlign = 'center';
    ctx.fillText(title, 960, 240);

    ctx.font = "22px 'Rajdhani', sans-serif";
    ctx.fillStyle = '#e2e8f0';
    ctx.shadowBlur = 0;
    ctx.fillText(sub, 960, 310);

    // Game Statistics Table
    const sy = 420;
    ctx.font = "bold 26px 'Rajdhani', sans-serif";
    ctx.fillStyle = '#fbbf24';
    ctx.fillText("O'YIN STATISTIKASI (GAME RECAP)", 960, sy);

    const minutes = Math.floor(playTimeSeconds / 60);
    const seconds = Math.floor(playTimeSeconds % 60);
    const mapPercent = Math.round((roomsDiscoveredCount / totalRooms) * 100);

    const stats = [
      `Umumiy o'yin vaqti: ${minutes} daqiqa ${seconds} soniya`,
      `Dunyo xaritasi o'rganilishi: ${roomsDiscoveredCount}/${totalRooms} (${mapPercent}%)`,
      `Yengilgan Bosslar: ${bossesDefeatedCount}/4`,
      `Yakun turi: ${isTrueEnding ? 'Haqiqiy Yakun (True Ending ★★★)' : 'Oddiy Yakun (Normal Ending)'}`
    ];

    stats.forEach((st, idx) => {
      ctx.font = "20px 'Rajdhani', sans-serif";
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(st, 960, sy + 50 + idx * 36);
    });

    // Return to title prompt
    ctx.font = "bold 22px 'Rajdhani', sans-serif";
    ctx.fillStyle = '#38bdf8';
    ctx.fillText("[Enter] yoki [Space] — Asosiy Menyuga qaytish", 960, 800);

    ctx.restore();
  }
}
