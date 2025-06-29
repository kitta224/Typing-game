// --- バースト発射用Bulletクラス ---
class Bullet {
  constructor(x, y, angle, speed) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = speed;
    this.radius = 8;
    this.hit = false;
    this.active = true;
    this.life = 0;
  }
  update() {
    if (!this.active) return;
    this.x += Math.cos(this.angle) * this.speed * window.frameDelta;
    this.y += Math.sin(this.angle) * this.speed * window.frameDelta;
    this.life += window.frameDelta;
    if (this.x < 0 || this.x > window.CANVAS_W || this.y < 0 || this.y > window.CANVAS_H || this.life > 90) {
      this.active = false;
    }
  }
  draw() {
    if (!this.active) return;
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#cab88a";
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#b08a4c";
    ctx.stroke();
    ctx.restore();
  }
  isActive() {
    return this.active;
  }
}

// --- Bulletクラス ---
window.Bullet = Bullet;
window.bullets = window.bullets || [];
