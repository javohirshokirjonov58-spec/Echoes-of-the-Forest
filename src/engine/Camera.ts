export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Camera {
  public x: number = 0;
  public y: number = 0;
  public targetX: number = 0;
  public targetY: number = 0;

  public viewportWidth: number = 1920;
  public viewportHeight: number = 1080;

  // Smoothing & lookahead
  public smoothness: number = 0.08;
  public lookAheadDistance: number = 120;
  private currentLookAheadX: number = 0;

  // Screen shake
  public shakeDuration: number = 0;
  public shakeIntensity: number = 0;
  public shakeOffsetX: number = 0;
  public shakeOffsetY: number = 0;

  // Bounding box for current room
  public bounds: Rect = { x: 0, y: 0, width: 1920, height: 1080 };

  constructor(viewportWidth: number = 1920, viewportHeight: number = 1080) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
  }

  public setBounds(bounds: Rect): void {
    this.bounds = { ...bounds };
  }

  public triggerShake(intensity: number, duration: number): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = Math.max(this.shakeDuration, duration);
  }

  public update(
    dt: number, 
    playerCenterX: number, 
    playerCenterY: number, 
    facingRight: boolean, 
    playerSpeedX: number
  ): void {
    // Look ahead in direction of movement / facing
    const targetLookAhead = facingRight ? this.lookAheadDistance : -this.lookAheadDistance;
    this.currentLookAheadX += (targetLookAhead - this.currentLookAheadX) * 0.05;

    // Desired camera center
    this.targetX = playerCenterX + this.currentLookAheadX - this.viewportWidth / 2;
    this.targetY = playerCenterY - this.viewportHeight / 2 - 50;

    // Clamp target within room bounds
    if (this.bounds.width >= this.viewportWidth) {
      this.targetX = Math.max(this.bounds.x, Math.min(this.targetX, this.bounds.x + this.bounds.width - this.viewportWidth));
    } else {
      // Room smaller than viewport, center it
      this.targetX = this.bounds.x + (this.bounds.width - this.viewportWidth) / 2;
    }

    if (this.bounds.height >= this.viewportHeight) {
      this.targetY = Math.max(this.bounds.y, Math.min(this.targetY, this.bounds.y + this.bounds.height - this.viewportHeight));
    } else {
      this.targetY = this.bounds.y + (this.bounds.height - this.viewportHeight) / 2;
    }

    // Smooth lerp to target
    this.x += (this.targetX - this.x) * (1 - Math.pow(1 - this.smoothness, dt * 60));
    this.y += (this.targetY - this.y) * (1 - Math.pow(1 - this.smoothness, dt * 60));

    // Handle screen shake
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * this.shakeIntensity;
      this.shakeOffsetX = Math.cos(angle) * dist;
      this.shakeOffsetY = Math.sin(angle) * dist;

      // Damp intensity
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 25);
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
  }

  public snapTo(x: number, y: number): void {
    this.targetX = x - this.viewportWidth / 2;
    this.targetY = y - this.viewportHeight / 2;

    if (this.bounds.width >= this.viewportWidth) {
      this.targetX = Math.max(this.bounds.x, Math.min(this.targetX, this.bounds.x + this.bounds.width - this.viewportWidth));
    } else {
      this.targetX = this.bounds.x + (this.bounds.width - this.viewportWidth) / 2;
    }

    if (this.bounds.height >= this.viewportHeight) {
      this.targetY = Math.max(this.bounds.y, Math.min(this.targetY, this.bounds.y + this.bounds.height - this.viewportHeight));
    } else {
      this.targetY = this.bounds.y + (this.bounds.height - this.viewportHeight) / 2;
    }

    this.x = this.targetX;
    this.y = this.targetY;
  }
}
