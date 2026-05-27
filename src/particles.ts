// ============================================================
// Простая партикл-система для эффектов merge.
// Чисто математика, рисуется в том же canvas.
// ============================================================

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;     // 0..1, убывает к 0
  size: number;
  color: string;
  rotation: number;
  rotSpeed: number;
}

export class ParticleSystem {
  particles: Particle[] = [];

  /** Взрыв партиклов: золотые искры разлетаются от точки */
  burst(x: number, y: number, color: string, count: number, speed: number = 4) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speedVar = speed * (0.5 + Math.random() * 0.8);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speedVar,
        vy: Math.sin(angle) * speedVar - 1, // лёгкий импульс вверх
        life: 1,
        size: 2 + Math.random() * 3,
        color,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
      });
    }
  }

  /** Кольцо взрывной волны — расширяющийся круг */
  ringBurst(x: number, y: number, color: string, count: number = 16) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 3 + Math.random() * 1;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        size: 3,
        color,
        rotation: 0,
        rotSpeed: 0,
      });
    }
  }

  update(dt: number) {
    const dtSec = dt / 1000;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // лёгкая гравитация
      p.vx *= 0.96;
      p.vy *= 0.98;
      p.rotation += p.rotSpeed;
      p.life -= dtSec * 1.6; // живёт ~0.6 сек
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const alpha = Math.max(0, Math.min(1, p.life));
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = alpha;

      // Рисуем 4-конечную звезду (как искра)
      ctx.fillStyle = p.color;
      const s = p.size * alpha;
      ctx.beginPath();
      ctx.moveTo(0, -s * 2);
      ctx.lineTo(s * 0.5, -s * 0.5);
      ctx.lineTo(s * 2, 0);
      ctx.lineTo(s * 0.5, s * 0.5);
      ctx.lineTo(0, s * 2);
      ctx.lineTo(-s * 0.5, s * 0.5);
      ctx.lineTo(-s * 2, 0);
      ctx.lineTo(-s * 0.5, -s * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  clear() {
    this.particles.length = 0;
  }
}
