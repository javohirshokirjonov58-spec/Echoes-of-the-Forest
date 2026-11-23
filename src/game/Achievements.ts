import { Sound } from '../engine/AudioManager';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export class AchievementSystem {
  public achievements: Map<string, Achievement> = new Map();
  public toastQueue: Achievement[] = [];
  public currentToast: Achievement | null = null;
  public toastTimer: number = 0;

  constructor() {
    this.initAchievements();
  }

  private initAchievements(): void {
    const list: Achievement[] = [
      {
        id: 'ach_first_blood',
        title: "Birinchi Qon",
        description: "Dunyodagi birinchi dushmanni mag'lub eting.",
        icon: '⚔️',
        unlocked: false
      },
      {
        id: 'ach_double_jump',
        title: "Qanotli Sakrash",
        description: "Double Jump qobiliyatini qo'lga kiriting.",
        icon: '🪶',
        unlocked: false
      },
      {
        id: 'ach_dash',
        title: "Shamol Tezligi",
        description: "Dash qobiliyatini egallang.",
        icon: '💨',
        unlocked: false
      },
      {
        id: 'ach_wall_climb',
        title: "Tik Qoyalar",
        description: "Wall Climb san'atini o'rganing.",
        icon: '🧗',
        unlocked: false
      },
      {
        id: 'ach_special_attack',
        title: "Parchalovchi Kuch",
        description: "Maxsus Hujum (Q) qobiliyatini uyg'oting.",
        icon: '⚡',
        unlocked: false
      },
      {
        id: 'ach_flawless_duelist',
        title: "Qadimiy Qilichboz",
        description: "Jangchi Botni Ekspert darajasida yengib chiqing.",
        icon: '👑',
        unlocked: false
      },
      {
        id: 'ach_cartographer',
        title: "Buyuk Xaritashunos",
        description: "Dunyoning barcha xonalarini (100%) oching.",
        icon: '🗺️',
        unlocked: false
      },
      {
        id: 'ach_lorekeeper',
        title: "Donishmand Solnomachi",
        description: "Barcha 4 ta qadimiy solnomani to'plang.",
        icon: '📜',
        unlocked: false
      },
      {
        id: 'ach_boss_slayer',
        title: "Qorong'ulik Qulashi",
        description: "Qoraygan Yurak Hukmdorini mag'lub qiling (1-Yakun).",
        icon: '💀',
        unlocked: false
      },
      {
        id: 'ach_true_savior',
        title: "O'rmon Najotkori",
        description: "Qorong'i Yurakni poklab, Haqiqiy Yakunga erishing (2-Yakun).",
        icon: '🌟',
        unlocked: false
      }
    ];

    list.forEach(a => this.achievements.set(a.id, a));
  }

  public unlock(id: string): void {
    const ach = this.achievements.get(id);
    if (ach && !ach.unlocked) {
      ach.unlocked = true;
      ach.unlockedAt = Date.now();
      this.toastQueue.push(ach);
      Sound.playItemFanfare();
    }
  }

  public update(dt: number): void {
    if (this.currentToast) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) {
        this.currentToast = null;
      }
    } else if (this.toastQueue.length > 0) {
      this.currentToast = this.toastQueue.shift()!;
      this.toastTimer = 4.0;
    }
  }

  public getUnlockedList(): string[] {
    const res: string[] = [];
    this.achievements.forEach(a => {
      if (a.unlocked) res.push(a.id);
    });
    return res;
  }

  public loadUnlockedList(list: string[]): void {
    list.forEach(id => {
      const ach = this.achievements.get(id);
      if (ach) ach.unlocked = true;
    });
  }
}

export const Achievements = new AchievementSystem();
