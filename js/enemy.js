// --- 敵クラス ---
class Enemy {
  constructor(x, y, word, speed, type = "normal") {
    this.x = x;
    this.y = y;
    this.word = word;
    this.typed = "";
    this.speed = speed;
    this.type = type;
    this.dead = false;
    this.counted = false;
    this.color = ENEMY_COLORS[Math.floor(Math.random() * ENEMY_COLORS.length)];
    this.radius = 28;
    this.state = "move";
    this.laserActive = false;
    this.laserTimer = 0;
    this.laserDuration = 0;
    this.laserWord = null;
  }
  update() {
    if (this.dead) return;
    if (this.type === "normal") {
      const dx = PLAYER_X - this.x;
      const dy = PLAYER_Y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 1) {
        this.x += (dx / dist) * this.speed * frameDelta;
        this.y += (dy / dist) * this.speed * frameDelta;
      }
    } else if (this.type === "laser") {
      if (this.state === "move") {
        const dx = PLAYER_X - this.x;
        const dy = PLAYER_Y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 1) {
          this.x += (dx / dist) * this.speed * frameDelta;
          this.y += (dy / dist) * this.speed * frameDelta;
        }
      }
    }
  }
  draw() {
    if (this.dead) return;
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.type === "laser" ? LASER_ENEMY_COLOR : this.color;
    ctx.globalAlpha = this.type === "laser" ? 0.92 : 0.82;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 3;
    ctx.strokeStyle = this.type === "laser" ? "#90d7f1" : "#cab88a";
    ctx.stroke();
    ctx.font = "bold 22px 'Fira Mono', Consolas, monospace";
    ctx.fillStyle = "#3e2c16";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.word, this.x, this.y);
    ctx.font = "bold 18px 'Fira Mono', Consolas, monospace";
    ctx.fillStyle = "#b08a4c";
    ctx.fillText(this.typed, this.x, this.y + 28);
    ctx.restore();
  }
  isAtPlayer() {
    const dx = PLAYER_X - this.x;
    const dy = PLAYER_Y - this.y;
    return Math.sqrt(dx * dx + dy * dy) < this.radius + 18;
  }
}

class LaserChargerEnemy {
  constructor(x, y, word, speed) {
    this.x = x;
    this.y = y;
    this.word = word;
    this.typed = "";
    this.speed = speed;
    this.type = "laser";
    this.dead = false;
    this.counted = false;
    this.color = LASER_ENEMY_COLOR;
    this.radius = 32;
    this.state = "move";
    this.laserActive = false;
    this.laserTimer = 0;
    this.laserDuration = 0;
    this.laserWord = getLaserWord();
  }
  update() {
    if (this.dead) return;
    if (this.state === "move") {
      const dx = PLAYER_X - this.x;
      const dy = PLAYER_Y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 1) {
        this.x += (dx / dist) * this.speed * frameDelta;
        this.y += (dy / dist) * this.speed * frameDelta;
      }
      // プレイヤーに近づいたらチャージ開始
      if (Math.sqrt((PLAYER_X - this.x) ** 2 + (PLAYER_Y - this.y) ** 2) < 120) {
        this.state = "charge";
        this.laserTimer = 0;
        this.laserDuration = 60 + Math.random() * 40;
      }
    } else if (this.state === "charge") {
      this.laserTimer += frameDelta;
      if (this.laserTimer > this.laserDuration) {
        this.state = "fire";
        this.laserActive = true;
        this.laserTimer = 0;
      }
    } else if (this.state === "fire") {
      this.laserTimer += frameDelta;
      if (this.laserTimer > 40) {
        this.laserActive = false;
        this.dead = true;
      }
    }
  }
  draw() {
    if (this.dead) return;
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = LASER_ENEMY_COLOR;
    ctx.globalAlpha = 0.92;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#90d7f1";
    ctx.stroke();
    ctx.font = "bold 22px 'Fira Mono', Consolas, monospace";
    ctx.fillStyle = "#3e2c16";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.word, this.x, this.y);
    ctx.font = "bold 18px 'Fira Mono', Consolas, monospace";
    ctx.fillStyle = "#b08a4c";
    ctx.fillText(this.typed, this.x, this.y + 28);
    // チャージ中エフェクト
    if (this.state === "charge") {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 10, 0, Math.PI * 2);
      ctx.strokeStyle = "#90d7f1";
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(this.laserTimer / 6);
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.restore();
    }
    // レーザー発射中
    if (this.state === "fire" && this.laserActive) {
      ctx.save();
      ctx.strokeStyle = "#90d7f1";
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(PLAYER_X, PLAYER_Y);
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.font = "bold 22px 'Fira Mono', Consolas, monospace";
      ctx.fillStyle = "#90d7f1";
      ctx.textAlign = "center";
      ctx.fillText(this.laserWord, (this.x + PLAYER_X) / 2, (this.y + PLAYER_Y) / 2 - 18);
      ctx.restore();
    }
    ctx.restore();
  }
}
