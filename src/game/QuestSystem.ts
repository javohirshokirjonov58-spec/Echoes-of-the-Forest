export type QuestStatus = 'LOCKED' | 'ACTIVE' | 'COMPLETED' | 'FAILED';

export interface Quest {
  id: string;
  title: string;
  category: 'MAIN' | 'SIDE';
  description: string;
  area: string;
  targetCount?: number;
  currentCount?: number;
  status: QuestStatus;
}

export class QuestSystem {
  public quests: Map<string, Quest> = new Map();
  public toastQueue: string[] = [];
  public toastTimer: number = 0;
  public currentToast: string | null = null;

  constructor() {
    this.initQuests();
  }

  private initQuests(): void {
    const defaultQuests: Quest[] = [
      // 5 Main Quests
      {
        id: 'quest_forest_call',
        title: "O'rmon chaqirig'i",
        category: 'MAIN',
        description: "Oqsoqol Alim bilan uchrashib, Sokin O'rmon ziyoratgohini faollashtiring.",
        area: "Sokin O'rmon",
        status: 'ACTIVE'
      },
      {
        id: 'quest_root_darkness',
        title: "Ildizlar tubidagi zulmat",
        category: 'MAIN',
        description: "Ildiz G'orlaridagi chirish manbasini toping va Ildiz Maxluqini yengib Dash qobiliyatini oling.",
        area: "Ildiz G'orlari",
        status: 'LOCKED'
      },
      {
        id: 'quest_sanctuary_secrets',
        title: "Ma'bad sirlari",
        category: 'MAIN',
        description: "Unutilgan Ma'baddagi minoralarga chiqib, Avtomat Posbonni mag'lub qiling.",
        area: "Unutilgan Ma'bad",
        status: 'LOCKED'
      },
      {
        id: 'quest_path_to_core',
        title: "Yurak sari yo'l",
        category: 'MAIN',
        description: "Qorong'i Yurak ostonasidagi altardan Maxsus Hujum (Q) qobiliyatini uyg'oting.",
        area: "Qorong'i Yurak",
        status: 'LOCKED'
      },
      {
        id: 'quest_restore_balance',
        title: "Muvozanatni tiklash",
        category: 'MAIN',
        description: "Qoraygan Yurak Hukmdori bilan so'nggi jangga kiring va o'rmon taqdirini hal qiling.",
        area: "Qorong'i Taxt",
        status: 'LOCKED'
      },

      // 5 Side Quests
      {
        id: 'quest_lost_herbs',
        title: "Yo'qolgan o'tlar",
        category: 'SIDE',
        description: "O'tchi Leyla uchun Ildiz G'orlari inidan Noyob Nurli O'tlarni yig'ib bering.",
        area: "Ildiz G'orlari",
        status: 'LOCKED'
      },
      {
        id: 'quest_soldier_crest',
        title: "Unutilgan askar nishoni",
        category: 'SIDE',
        description: "Baland qoyalardagi yiqilgan askarning oilaviy nishonini toping.",
        area: "Sokin O'rmon",
        status: 'LOCKED'
      },
      {
        id: 'quest_forest_hatchling',
        title: "O'rmon jo'jasi siri",
        category: 'SIDE',
        description: "Tikanli jarlikda qamalib qolgan yosh o'rmon jonzotiga yo'l oching.",
        area: "Ildiz G'orlari",
        status: 'LOCKED'
      },
      {
        id: 'quest_ancient_inscriptions',
        title: "Xarobalar yozuvi (4/4)",
        category: 'SIDE',
        description: "Dunyodagi barcha 4 ta qadimiy solnomani topib, dunyoning asl tarixini o'rganing.",
        area: "Butun Dunyo",
        targetCount: 4,
        currentCount: 0,
        status: 'ACTIVE'
      },
      {
        id: 'quest_starfall_ore',
        title: "Qadimiy temirchi siri",
        category: 'SIDE',
        description: "Ma'bad arxivlaridagi Yulduz Qotishmasi Rudasini Temirchi Go'ranga yetkazing.",
        area: "Unutilgan Ma'bad",
        status: 'LOCKED'
      }
    ];

    defaultQuests.forEach(q => this.quests.set(q.id, q));
  }

  public update(dt: number): void {
    if (this.currentToast) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) {
        this.currentToast = null;
      }
    } else if (this.toastQueue.length > 0) {
      this.currentToast = this.toastQueue.shift()!;
      this.toastTimer = 3.5;
    }
  }

  public showToast(msg: string): void {
    this.toastQueue.push(msg);
  }

  public setQuestStatus(questId: string, status: QuestStatus): void {
    const q = this.quests.get(questId);
    if (!q) return;
    if (q.status !== status) {
      q.status = status;
      if (status === 'ACTIVE') {
        this.showToast(`Yangi Vazifa: "${q.title}"`);
      } else if (status === 'COMPLETED') {
        this.showToast(`Bajarildi: "${q.title}"!`);
      }
    }
  }

  public getQuest(id: string): Quest | undefined {
    return this.quests.get(id);
  }

  public incrementLoreProgress(): void {
    const q = this.quests.get('quest_ancient_inscriptions');
    if (q) {
      q.currentCount = Math.min(4, (q.currentCount || 0) + 1);
      this.showToast(`Solnoma topildi (${q.currentCount}/4)`);
      if (q.currentCount >= 4) {
        this.setQuestStatus('quest_ancient_inscriptions', 'COMPLETED');
      }
    }
  }

  public getExportData(): Record<string, QuestStatus> {
    const res: Record<string, QuestStatus> = {};
    this.quests.forEach((val, key) => {
      res[key] = val.status;
    });
    return res;
  }

  public loadFromData(data: Record<string, QuestStatus>): void {
    for (const [key, status] of Object.entries(data)) {
      const q = this.quests.get(key);
      if (q) q.status = status;
    }
  }
}
