export type ActionType = 
  | 'LEFT' 
  | 'RIGHT' 
  | 'UP' 
  | 'DOWN' 
  | 'JUMP' 
  | 'ATTACK' 
  | 'DASH' 
  | 'INTERACT' 
  | 'SPECIAL' 
  | 'MAP' 
  | 'MENU';

export interface KeyBindings {
  LEFT: string[];
  RIGHT: string[];
  UP: string[];
  DOWN: string[];
  JUMP: string[];
  ATTACK: string[];
  DASH: string[];
  INTERACT: string[];
  SPECIAL: string[];
  MAP: string[];
  MENU: string[];
}

export const DEFAULT_BINDINGS: KeyBindings = {
  LEFT: ['KeyA', 'ArrowLeft'],
  RIGHT: ['KeyD', 'ArrowRight'],
  UP: ['KeyW', 'ArrowUp'],
  DOWN: ['KeyS', 'ArrowDown'],
  JUMP: ['Space'],
  ATTACK: ['KeyJ'],
  DASH: ['KeyK'],
  INTERACT: ['KeyE'],
  SPECIAL: ['KeyQ'],
  MAP: ['KeyM', 'Tab'],
  MENU: ['Escape']
};

export class InputManager {
  private keysDown: Set<string> = new Set();
  private keysJustPressed: Set<string> = new Set();
  private keysJustReleased: Set<string> = new Set();

  private bindings: KeyBindings = { ...DEFAULT_BINDINGS };
  public isGamepadActive: boolean = false;
  private gamepadIndex: number | null = null;

  // Jump Buffering and Coyote Time timers
  private jumpBufferTimer: number = 0; // seconds remaining
  public readonly JUMP_BUFFER_DURATION = 0.10; // 0.10s
  public readonly COYOTE_DURATION = 0.12; // 0.12s

  constructor() {
    this.loadBindings();
    this.setupListeners();
  }

  private setupListeners(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      this.isGamepadActive = false;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) {
        e.preventDefault();
      }
      if (!this.keysDown.has(e.code)) {
        this.keysJustPressed.add(e.code);
        this.keysDown.add(e.code);

        // Check if jump was pressed for buffering
        if (this.bindings.JUMP.includes(e.code)) {
          this.jumpBufferTimer = this.JUMP_BUFFER_DURATION;
        }
      }
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      this.keysDown.delete(e.code);
      this.keysJustReleased.add(e.code);
    });

    window.addEventListener('gamepadconnected', (e: GamepadEvent) => {
      this.gamepadIndex = e.gamepad.index;
      this.isGamepadActive = true;
    });

    window.addEventListener('gamepaddisconnected', (e: GamepadEvent) => {
      if (this.gamepadIndex === e.gamepad.index) {
        this.gamepadIndex = null;
        this.isGamepadActive = false;
      }
    });
  }

  public update(dt: number): void {
    // Decrement jump buffer timer
    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    }

    // Poll Gamepad
    this.pollGamepad();

    // Clear frame-specific press/release after update consumption is completed
    // (Handled at end of frame via endFrame())
  }

  public endFrame(): void {
    this.keysJustPressed.clear();
    this.keysJustReleased.clear();
  }

  private pollGamepad(): void {
    if (this.gamepadIndex === null) return;
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[this.gamepadIndex];
    if (!gp) return;

    // Detect if gamepad used
    const threshold = 0.25;
    const leftStickX = gp.axes[0] || 0;
    const leftStickY = gp.axes[1] || 0;

    const anyButton = gp.buttons.some(b => b.pressed) || Math.abs(leftStickX) > threshold || Math.abs(leftStickY) > threshold;
    if (anyButton) {
      this.isGamepadActive = true;
    }

    // Mapping gamepad buttons to virtual keys
    // A: 0 (Jump), X: 2 (Attack), B: 1 (Dash), Y: 3 (Special), LB/RB: 4/5, Select: 8 (Map), Start: 9 (Menu), Dpad: 12, 13, 14, 15
    this.mapGamepadAction('JUMP', gp.buttons[0]?.pressed);
    this.mapGamepadAction('ATTACK', gp.buttons[2]?.pressed);
    this.mapGamepadAction('DASH', gp.buttons[1]?.pressed || gp.buttons[5]?.pressed);
    this.mapGamepadAction('INTERACT', gp.buttons[3]?.pressed);
    this.mapGamepadAction('SPECIAL', gp.buttons[4]?.pressed || gp.buttons[7]?.pressed);
    this.mapGamepadAction('MAP', gp.buttons[8]?.pressed);
    this.mapGamepadAction('MENU', gp.buttons[9]?.pressed);

    const dpadUp = gp.buttons[12]?.pressed || leftStickY < -threshold;
    const dpadDown = gp.buttons[13]?.pressed || leftStickY > threshold;
    const dpadLeft = gp.buttons[14]?.pressed || leftStickX < -threshold;
    const dpadRight = gp.buttons[15]?.pressed || leftStickX > threshold;

    this.mapGamepadAction('UP', dpadUp);
    this.mapGamepadAction('DOWN', dpadDown);
    this.mapGamepadAction('LEFT', dpadLeft);
    this.mapGamepadAction('RIGHT', dpadRight);
  }

  private mapGamepadAction(action: ActionType, isPressed: boolean): void {
    const virtualCode = `Gamepad_${action}`;
    if (isPressed) {
      if (!this.keysDown.has(virtualCode)) {
        this.keysJustPressed.add(virtualCode);
        this.keysDown.add(virtualCode);
        if (action === 'JUMP') {
          this.jumpBufferTimer = this.JUMP_BUFFER_DURATION;
        }
      }
    } else {
      if (this.keysDown.has(virtualCode)) {
        this.keysDown.delete(virtualCode);
        this.keysJustReleased.add(virtualCode);
      }
    }
  }

  public isActionDown(action: ActionType): boolean {
    const codes = this.bindings[action] || [];
    const virtualCode = `Gamepad_${action}`;
    return codes.some(c => this.keysDown.has(c)) || this.keysDown.has(virtualCode);
  }

  public isActionJustPressed(action: ActionType): boolean {
    const codes = this.bindings[action] || [];
    const virtualCode = `Gamepad_${action}`;
    return codes.some(c => this.keysJustPressed.has(c)) || this.keysJustPressed.has(virtualCode);
  }

  public isActionJustReleased(action: ActionType): boolean {
    const codes = this.bindings[action] || [];
    const virtualCode = `Gamepad_${action}`;
    return codes.some(c => this.keysJustReleased.has(c)) || this.keysJustReleased.has(virtualCode);
  }

  // Jump buffer queries
  public hasBufferedJump(): boolean {
    return this.jumpBufferTimer > 0;
  }

  public consumeBufferedJump(): void {
    this.jumpBufferTimer = 0;
  }

  // Key rebinding
  public rebind(action: ActionType, keyCodes: string[]): void {
    this.bindings[action] = keyCodes;
    this.saveBindings();
  }

  public getBindings(): KeyBindings {
    return { ...this.bindings };
  }

  public resetBindings(): void {
    this.bindings = JSON.parse(JSON.stringify(DEFAULT_BINDINGS));
    this.saveBindings();
  }

  private saveBindings(): void {
    try {
      localStorage.setItem('echoes_key_bindings', JSON.stringify(this.bindings));
    } catch (e) {
      console.warn('Could not save key bindings to localStorage', e);
    }
  }

  private loadBindings(): void {
    try {
      const data = localStorage.getItem('echoes_key_bindings');
      if (data) {
        const parsed = JSON.parse(data);
        this.bindings = { ...DEFAULT_BINDINGS, ...parsed };
      }
    } catch (e) {
      this.bindings = { ...DEFAULT_BINDINGS };
    }
  }

  public getGlyphForAction(action: ActionType): string {
    if (this.isGamepadActive) {
      switch (action) {
        case 'JUMP': return 'A (Button 0)';
        case 'ATTACK': return 'X (Button 2)';
        case 'DASH': return 'B / RB';
        case 'INTERACT': return 'Y (Button 3)';
        case 'SPECIAL': return 'LB / RT';
        case 'MAP': return 'Back / View';
        case 'MENU': return 'Start / Menu';
        case 'LEFT': return 'D-Pad Left / L-Stick';
        case 'RIGHT': return 'D-Pad Right / L-Stick';
        case 'UP': return 'D-Pad Up / L-Stick';
        case 'DOWN': return 'D-Pad Down / L-Stick';
      }
    }
    const keys = this.bindings[action];
    if (!keys || keys.length === 0) return '?';
    return keys[0].replace('Key', '').replace('Arrow', '');
  }
}
