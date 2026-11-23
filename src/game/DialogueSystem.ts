export interface DialogueChoice {
  text: string;
  nextDialogueId?: string;
  action?: () => void;
  requiredCondition?: () => boolean;
}

export interface DialogueNode {
  id: string;
  speakerName: string;
  speakerTitle: string;
  portrait: string;
  text: string;
  choices?: DialogueChoice[];
  nextId?: string;
  onEnter?: () => void;
}

export class DialogueSystem {
  public nodes: Map<string, DialogueNode> = new Map();
  public currentNode: DialogueNode | null = null;
  public isActive: boolean = false;

  // Typewriter effect
  public displayedText: string = '';
  public charIndex: number = 0;
  public typewriterSpeed: number = 0.02; // seconds per char
  public charTimer: number = 0;
  public isTextComplete: boolean = false;

  public selectedChoiceIndex: number = 0;
  public onDialogueComplete?: (nodeId: string) => void;

  constructor() {
    this.initDialogues();
  }

  private initDialogues(): void {
    const list: DialogueNode[] = [
      // Elder Alim
      {
        id: 'dlg_elder_intro',
        speakerName: "Oqsoqol Alim",
        speakerTitle: "O'rmon Qo'riqchisi",
        portrait: 'elder',
        text: "Hush kelibsan, yosh sayohatchi! O'rmonimiz qalbini azobli qorong'ulik qamrab oldi. Qadimiy daraxt ildizlari chuqurlikdagi yovuzlik tufayli so'lmoqda. Birinchi navbatda, baland qoyalardagi Qo'riqchini tinchlantirishing kerak.",
        choices: [
          { text: "Qanday qilib balandga chiqaman?", nextDialogueId: 'dlg_elder_advice' },
          { text: "Men tayyorman, o'rmonni qutqaraman!", nextDialogueId: 'dlg_elder_farewell' }
        ]
      },
      {
        id: 'dlg_elder_advice',
        speakerName: "Oqsoqol Alim",
        speakerTitle: "O'rmon Qo'riqchisi",
        portrait: 'elder',
        text: "Qadimgi Qo'riqchi o'z vujudida Havoda Ikki marta Sakrash (Double Jump) siri saqlaydi. Uni yengsang, daraxtlarning eng baland shoxlariga yetib borasan.",
        nextId: 'dlg_elder_farewell'
      },
      {
        id: 'dlg_elder_farewell',
        speakerName: "Oqsoqol Alim",
        speakerTitle: "O'rmon Qo'riqchisi",
        portrait: 'elder',
        text: "Yo'ling ravon bo'lsin. O'rmon sening qadamingni eshitib turibdi."
      },

      // Herbalist Leyla
      {
        id: 'dlg_herbalist_intro',
        speakerName: "O'tchi Leyla",
        speakerTitle: "Ildiz Tabibi",
        portrait: 'herbalist',
        text: "Salom! Bu g'orlardagi zaharli havoni sezdingizmi? Men shifobaxsh malham tayyorlayapman, lekin Ildiz Inida o'sadigan 'Noyob Nurli O'tlar' kerak. Agar ularni keltirsangiz, sizga qadimiy shifo eliksirini beraman.",
        choices: [
          { text: "Albatta, ularni topib beraman.", nextDialogueId: 'dlg_herbalist_accept' },
          { text: "Hozir vaqtim yo'q.", nextDialogueId: 'dlg_herbalist_later' }
        ]
      },
      {
        id: 'dlg_herbalist_accept',
        speakerName: "O'tchi Leyla",
        speakerTitle: "Ildiz Tabibi",
        portrait: 'herbalist',
        text: "Rahmat! Ehtiyot bo'ling, in yaqinida uchar hasharotlar juda ko'p."
      },
      {
        id: 'dlg_herbalist_complete',
        speakerName: "O'tchi Leyla",
        speakerTitle: "Ildiz Tabibi",
        portrait: 'herbalist',
        text: "Ajoyib! O'tlar keltirildi. Mana, shifobaxsh tomchi — maksimal sog'ligingiz oshdi!"
      },
      {
        id: 'dlg_herbalist_later',
        speakerName: "O'tchi Leyla",
        speakerTitle: "Ildiz Tabibi",
        portrait: 'herbalist',
        text: "Kutaman, o'zingizni ehtiyot qiling."
      },

      // Monk Tariq
      {
        id: 'dlg_monk_intro',
        speakerName: "Rohib Toriq",
        speakerTitle: "Ma'bad Ruhoniysi",
        portrait: 'monk',
        text: "Bu muqaddas arkada bir paytlar nurning markazi edi. Endi esa temir qo'riqchilar aqlini yo'qotib, har qanday tirik jonga tashlanmoqda. Yuqori minoralarga chiqish uchun devorlarga tirmashish (Wall Climb) san'atini egallashing kerak.",
        choices: [
          { text: "Qanday qilib devorga chiqaman?", nextDialogueId: 'dlg_monk_climb' },
          { text: "Ma'bad sirlarini ochaman.", nextDialogueId: 'dlg_monk_farewell' }
        ]
      },
      {
        id: 'dlg_monk_climb',
        speakerName: "Rohib Toriq",
        speakerTitle: "Ma'bad Ruhoniysi",
        portrait: 'monk',
        text: "Ma'bad cho'qqisidagi Avtomat Posbonni mag'lub etsang, uning yadrosidagi qadimiy kuch tik devorlarni oddiy yo'lakka aylantiradi.",
        nextId: 'dlg_monk_farewell'
      },
      {
        id: 'dlg_monk_farewell',
        speakerName: "Rohib Toriq",
        speakerTitle: "Ma'bad Ruhoniysi",
        portrait: 'monk',
        text: "Nurlar sening yo'lingni yoritsin."
      },

      // Blacksmith Goran
      {
        id: 'dlg_smith_intro',
        speakerName: "Temirchi Go'ran",
        speakerTitle: "Qadimiy Qurolsoz",
        portrait: 'smith',
        text: "Qiliching o'tkir, ammo Qorong'i Yurakdagi devorlar oddiy temirni sindiradi. Arxivlarda 'Yulduz Qotishmasi Rudasi' bor. Uni topsang, qilichingga toshlarni parchalovchi kuch beraman!",
        choices: [
          { text: "Ruda izlab ko'raman.", nextDialogueId: 'dlg_smith_farewell' },
          { text: "Menda rudaning o'zi bor!", nextDialogueId: 'dlg_smith_upgrade' }
        ]
      },
      {
        id: 'dlg_smith_upgrade',
        speakerName: "Temirchi Go'ran",
        speakerTitle: "Qadimiy Qurolsoz",
        portrait: 'smith',
        text: "Daho ish! Yulduz metalli qiliching bilan uyg'unlashdi. Endi zarbalaring ikki karra shiddatli!"
      },
      {
        id: 'dlg_smith_farewell',
        speakerName: "Temirchi Go'ran",
        speakerTitle: "Qadimiy Qurolsoz",
        portrait: 'smith',
        text: "Olov so'nmasin, bolg'a to'xtamasin!"
      },

      // Swordmaster Kamol (Duel Arena)
      {
        id: 'dlg_swordmaster_intro',
        speakerName: "Qilich Ustasi Kamol",
        speakerTitle: "Duel va Taktika Murabbiyi",
        portrait: 'master',
        text: "Haqiqiy jangda raqib tugma bosishingni kutib turmaydi. Jangchi Bot bilan duelga kirishganingda masofa saqla, uni bo'sh zarba berishga unda (Baiting) va darhol Dash bilan jazolashni o'rgan!",
        choices: [
          { text: "Qilichlar to'qnashuvi qanday ishlaydi?", nextDialogueId: 'dlg_master_clash' },
          { text: "Mashg'ulotga tayyorman!", nextDialogueId: 'dlg_master_ready' }
        ]
      },
      {
        id: 'dlg_master_clash',
        speakerName: "Qilich Ustasi Kamol",
        speakerTitle: "Duel va Taktika Murabbiyi",
        portrait: 'master',
        text: "Agar sen va raqib bir vaqtda zarba bersangiz, qurollar to'qnashib uchqun sochadi (Weapon Clash) va ikkovingiz orqaga surilasiz. Bu lahzada tezkor kim javob qaytarsa, o'sha yutadi!",
        nextId: 'dlg_master_ready'
      },
      {
        id: 'dlg_master_ready',
        speakerName: "Qilich Ustasi Kamol",
        speakerTitle: "Duel va Taktika Murabbiyi",
        portrait: 'master',
        text: "Arenaga qadam qo'y va o'z kuchingni sinovdan o'tkaz!"
      },

      // Final Choice Dialogue
      {
        id: 'dlg_final_choice',
        speakerName: "Qoraygan Yurak Hukmdori",
        speakerTitle: "Zulmat Qurboni",
        portrait: 'sovereign',
        text: "Demak, sen yetib kelding... Asrlar davomida bu o'rmon bizni unutti. Men zulmat emasman, men unutilgan orzular aksiman. Sen bu yerga nima maqsadda kelding?",
        choices: [
          { 
            text: "Zulmatni yo'q qilish va hukmronlikka chek qo'yish! (1-Yakun: Asosiy)", 
            nextDialogueId: 'dlg_ending_normal' 
          },
          { 
            text: "Poklash Yodgorligi bilan qalbingni davolash va birlashish! (2-Yakun: Haqiqiy)", 
            nextDialogueId: 'dlg_ending_true' 
          }
        ]
      },
      {
        id: 'dlg_ending_normal',
        speakerName: "Qoraygan Yurak Hukmdori",
        speakerTitle: "Zulmat Qurboni",
        portrait: 'sovereign',
        text: "Unday bo'lsa, qilichlarimiz gaplashsin! Bu dunyodan faqat bittamiz tirik chiqamiz!"
      },
      {
        id: 'dlg_ending_true',
        speakerName: "Qoraygan Yurak Hukmdori",
        speakerTitle: "Zulmat Qurboni",
        portrait: 'sovereign',
        text: "To'rtta solnoma va Poklash Yodgorligi... Nahotki meni hali ham eslaydiganlar bor bo'lsa? Nur... nur qaytmoqda!"
      }
    ];

    list.forEach(n => this.nodes.set(n.id, n));
  }

  public startDialogue(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;
    this.currentNode = node;
    this.isActive = true;
    this.displayedText = '';
    this.charIndex = 0;
    this.charTimer = 0;
    this.isTextComplete = false;
    this.selectedChoiceIndex = 0;

    if (node.onEnter) node.onEnter();
  }

  public update(dt: number): void {
    if (!this.isActive || !this.currentNode) return;

    if (!this.isTextComplete) {
      this.charTimer += dt;
      if (this.charTimer >= this.typewriterSpeed) {
        this.charTimer = 0;
        if (this.charIndex < this.currentNode.text.length) {
          this.displayedText += this.currentNode.text[this.charIndex];
          this.charIndex++;
        } else {
          this.isTextComplete = true;
        }
      }
    }
  }

  public skipOrAdvance(): void {
    if (!this.isActive || !this.currentNode) return;

    // If typewriter is still typing, finish instantly!
    if (!this.isTextComplete) {
      this.displayedText = this.currentNode.text;
      this.charIndex = this.currentNode.text.length;
      this.isTextComplete = true;
      return;
    }

    // If choices are present, choice must be selected via selectChoice()
    if (this.currentNode.choices && this.currentNode.choices.length > 0) {
      this.confirmCurrentChoice();
      return;
    }

    // If there is nextId, transition to it
    if (this.currentNode.nextId) {
      this.startDialogue(this.currentNode.nextId);
      return;
    }

    // Otherwise close dialogue
    this.closeDialogue();
  }

  public selectNextChoice(): void {
    if (!this.currentNode?.choices) return;
    this.selectedChoiceIndex = (this.selectedChoiceIndex + 1) % this.currentNode.choices.length;
  }

  public selectPrevChoice(): void {
    if (!this.currentNode?.choices) return;
    this.selectedChoiceIndex = (this.selectedChoiceIndex - 1 + this.currentNode.choices.length) % this.currentNode.choices.length;
  }

  public confirmCurrentChoice(): void {
    if (!this.currentNode?.choices) return;
    const choice = this.currentNode.choices[this.selectedChoiceIndex];
    if (choice) {
      if (choice.action) choice.action();
      if (choice.nextDialogueId) {
        this.startDialogue(choice.nextDialogueId);
      } else {
        this.closeDialogue();
      }
    }
  }

  public closeDialogue(): void {
    const finishedId = this.currentNode?.id;
    this.isActive = false;
    this.currentNode = null;
    if (finishedId && this.onDialogueComplete) {
      this.onDialogueComplete(finishedId);
    }
  }
}
