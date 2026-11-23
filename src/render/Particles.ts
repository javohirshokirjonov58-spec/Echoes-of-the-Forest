export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  maxLife: number;
  life: number;
}

export interface GhostTrail {
  x: number;
  y: number;
  width: number;
  height: number;
  facingRight: boolean;
  color: string;
  alpha: number;
  maxLife: number;
  life: number;
}

export interface FloatingText {
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  vy: number;
}

export class ParticleSystem {
  public particles: Particle[] = [];
  public ghostTrails: GhostTrail[] = [];
  public floatingTexts: FloatingText[] = [];

  public emitSparks(x: number, y: number, count: number = 12, color: string = '#fef08a'): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 320;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color,
        alpha: 1,
        life: 0.2 + Math.random() * 0.25,
        maxLife: 0.2 + Math.random() * 0.25
      });
    }
  }

  public emitDust(x: number, y: number, count: number = 6, color: string = '#94a3b8'): void {
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
      const speed = 40 + Math.random() * 80;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color,
        alpha: 0.7,
        life: 0.3 + Math.random() * 0.2,
        maxLife: 0.3 + Math.random() * 0.2
      });
    }
  }

  public emitBlood(x: number, y: number, count: number = 10, color: string = '#ef4444'): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 220;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        size: 2 + Math.random() * 3,
        color,
        alpha: 1,
        life: 0.25 + Math.random() * 0.3,
        maxLife: 0.25 + Math.random() * 0.3
      });
    }
  }

  public addGhostTrail(
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    facingRight: boolean, 
    color: string = 'rgba(56, 189, 248, 0.7)'
  ): void {
    this.ghostTrails.push({
      x,
      y,
      width,
      height,
      facingRight,
      color,
      alpha: 0.7,
      life: 0.2,
      maxLife: 0.2
    });
  }

  public addDamageText(text: string, x: number, y: number, color: string = '#f87171', isCrit: boolean = false): void {
    this.floatingTexts.push({
      text,
      x: x + (Math.random() - 0.5) * 20,
      y: y - 10,
      color,
      size: isCrit ? 26 : 20,
      alpha: 1,
      life: 0.8,
      maxLife: 0.8,
      vy: -90
    });
  }

  public update(dt: number): void {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 400 * dt; // gravity for sparks/dust
      p.alpha = p.life / p.maxLife;
    }

    // Update ghost trails
    for (let i = this.ghostTrails.length - 1; i >= 0; i--) {
      const g = this.ghostTrails[i];
      g.life -= dt;
      if (g.life <= 0) {
        this.ghostTrails.splice(i, 1);
        continue;
      }
      g.alpha = (g.life / g.maxLife) * 0.7;
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ft.y += ft.vy * dt;
      ft.alpha = ft.life / ft.maxLife;
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    // Render ghost trails
    for (const g of this.ghostTrails) {
      ctx.save();
      ctx.globalAlpha = g.alpha;
      ctx.fillStyle = g.color;
      ctx.shadowColor = g.color;
      ctx.shadowBlur = 12;
      ctx.fillRect(g.x, g.y, g.width, g.height);
      ctx.restore();
    }

    // Render particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render floating texts
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${ft.size}px 'Cinzel', sans-serif`;
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }
}

export const Particles = new ParticleSystem();
