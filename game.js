// ===== Typing Survival Neo 完全版 =====

// --- 定数・UI関連 ---
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreElem = document.getElementById("score");
const restartBtn = document.getElementById("restart-btn");
const startBtn = document.getElementById("start-btn");
const titleScreen = document.getElementById("title-screen");
const infoElem = document.getElementById("info");
const wordsetSelect = document.getElementById("wordset-select");

const ENEMY_COLORS = [
  "#cab88a", "#d2c295", "#b08a4c", "#c2a974", "#dfc99c", "#a88d58"
];
const LASER_ENEMY_COLOR = "#90d7f1";
const PLAYER_COLOR = "#b08a4c";
const PLAYER_MAX_HP = 500; // 100倍化

let PLAYER_X = 0, PLAYER_Y = 0, CANVAS_W = 0, CANVAS_H = 0;
let playerHp = PLAYER_MAX_HP;
let enemies = [];
let bullets = [];
let score = 0;
let gameOver = false;
let spawnTimer = 0;
let spawnInterval = 75;
let playing = false;
let words = [];
let selectedWordSet = "en";
let phase = 1;

// --- コンボシステム ---
let comboLevel = 0;
let comboCount = 0;
let maxComboLevel = 0;

// --- タレットオーバーヒート ---
let turretHeat = 0;
let turretHeatMax = 1.0;
let turretHeatPerBurst = 0.13;
let turretCoolingPerFrame = 0.015;
let turretOverheated = false;

// --- キルカウンター・パッシブ改造 ---
let turretKillCounter = 0;
let turretKillCounterMax = 30;
let turretKillCounterNextMul = 1.75;
let passivePoints = 0;
let showPassiveUpgradeUI = false;
let passiveUpgradeSelectIdx = 0;
const passiveUpgradeList = [
  { key: "overclock", title: "回路", subtitle: "オーバークロック", desc: "ダメージ+2%・加熱+1%" },
  { key: "cooling", title: "銃身", subtitle: "冷却強化", desc: "冷却速度+2%" },
  { key: "capacity", title: "供給", subtitle: "キャパシティ増加", desc: "キャパシティ+2.5%(4Lv毎にバースト+1)" },
  { key: "response", title: "コア", subtitle: "反応速度", desc: "連射速度+2%" }
];
let turretUpgrades = {
  overclock: 0,
  cooling: 0,
  capacity: 0,
  response: 0
};
let showPassiveUpgradeMsg = false;
let passiveMsgTimer = 0;

// --- 一時停止フラグ ---
let isPaused = false;

// --- タレット外周点 ---
let playerTurretAngle = -Math.PI / 2;
let playerTurretTargetAngle = playerTurretAngle;
let playerTurretTurning = false;
let playerTurretTurnSpeed = 0.13;
let playerBurstQueue = [];
let playerBurstTimer = 0;
let playerBurstStep = 0;

// --- パッシブ強化UI 部位判定用グローバルデータ ---
let passiveUpgradeParts = [];

// --- レスポンシブ ---
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  CANVAS_W = canvas.width;
  CANVAS_H = canvas.height;
  PLAYER_X = CANVAS_W / 2;
  PLAYER_Y = CANVAS_H / 2;
}

// --- 単語セット選択 ---
wordsetSelect.onchange = function() {
  selectedWordSet = wordsetSelect.value;
};
function setWordsBySelected() {
  if (selectedWordSet === "en") {
    words = window.WORDS_EN;
  } else if (selectedWordSet === "code") {
    words = window.WORDS_CODE;
  } else {
    words = window.WORDS_EN;
  }
}
function getLaserWord() {
  return window.LASER_WORDS[Math.floor(Math.random() * window.LASER_WORDS.length)];
}

// --- フェーズ管理 ---
function updatePhase() {
  if (score >= 80) phase = 5;
  else if (score >= 60) phase = 4;
  else if (score >= 40) phase = 3;
  else if (score >= 20) phase = 2;
  else phase = 1;
}

// --- オーバーヒート・冷却 ---
function updateTurretHeat(deltaBurst) {
  if (turretOverheated) return;
  let baseHeat = turretHeatPerBurst * deltaBurst;
  baseHeat *= 1 + 0.01 * turretUpgrades.overclock;
  turretHeat += baseHeat;
  if (turretHeat >= turretHeatMax) {
    turretHeat = turretHeatMax;
    turretOverheated = true;
  }
}
function coolTurret() {
  let cooling = turretCoolingPerFrame * (1 + 0.02 * turretUpgrades.cooling);
  turretHeat -= cooling;
  if (turretHeat < 0) turretHeat = 0;
  if (turretOverheated && turretHeat <= 0) {
    turretOverheated = false;
  }
}

// --- プレイヤー描画 ---
function drawPlayer() {
  ctx.save();
  ctx.beginPath();
  ctx.arc(PLAYER_X, PLAYER_Y, 26, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = PLAYER_COLOR;
  ctx.lineWidth = 3;
  ctx.fill();
  ctx.stroke();

  // 外周点
  const r = 26;
  const px = PLAYER_X + Math.cos(playerTurretAngle) * r;
  const py = PLAYER_Y + Math.sin(playerTurretAngle) * r;
  ctx.beginPath();
  ctx.arc(px, py, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#b08a4c";
  ctx.globalAlpha = 0.75;
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.beginPath();
  ctx.arc(PLAYER_X, PLAYER_Y, 9, 0, Math.PI * 2);
  ctx.fillStyle = "#cab88a";
  ctx.globalAlpha = 0.7;
  ctx.fill();
  ctx.restore();

  // HPバー
  const hpBarW = 160, hpBarH = 16;
  ctx.save();
  ctx.globalAlpha = 0.93;
  ctx.fillStyle = "#f2e5c3";
  ctx.fillRect(PLAYER_X - hpBarW / 2, PLAYER_Y + 40, hpBarW, hpBarH);
  ctx.fillStyle = "#b08a4c";
  ctx.fillRect(PLAYER_X - hpBarW / 2, PLAYER_Y + 40, hpBarW * (playerHp / PLAYER_MAX_HP), hpBarH);
  ctx.strokeStyle = "#cab88a";
  ctx.lineWidth = 2;
  ctx.strokeRect(PLAYER_X - hpBarW / 2, PLAYER_Y + 40, hpBarW, hpBarH);
  ctx.font = "bold 15px 'Fira Mono', Consolas, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#3e2c16";
  ctx.fillText(`HP: ${playerHp} / ${PLAYER_MAX_HP}`, PLAYER_X, PLAYER_Y + 48);
  ctx.restore();

  drawComboGauge();
  drawTurretHeatGauge();
  drawKillCounter();
}

// --- コンボゲージ ---
function drawComboGauge() {
  const gaugeWidth = 90;
  const gaugeHeight = 14;
  const x = PLAYER_X - gaugeWidth / 2;
  const y = PLAYER_Y + 70;
  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.strokeStyle = "#b08a4c";
  ctx.lineWidth = 2;
  ctx.fillStyle = "#f2e5c3";
  ctx.fillRect(x, y, gaugeWidth, gaugeHeight);
  ctx.strokeRect(x, y, gaugeWidth, gaugeHeight);
  const progress = comboCount / 10;
  ctx.fillStyle = "#eeb800";
  ctx.fillRect(x, y, gaugeWidth * Math.min(1, progress), gaugeHeight);
  ctx.font = "bold 12px 'Fira Mono', Consolas, monospace";
  ctx.fillStyle = "#8c6600";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`COMBO Lv.${comboLevel}`, PLAYER_X, y + gaugeHeight / 2);
  ctx.restore();
}

// --- オーバーヒートゲージ ---
function drawTurretHeatGauge() {
  const x = PLAYER_X - 54;
  const y = PLAYER_Y + 90;
  const w = 108;
  const h = 8;
  ctx.save();
  ctx.globalAlpha = 0.87;
  ctx.strokeStyle = "#b08a4c";
  ctx.lineWidth = 2;
  ctx.fillStyle = "#f2e5c3";
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = turretOverheated ? "#ff2e2e" : "#f7a046";
  ctx.fillRect(x, y, w * turretHeat / turretHeatMax, h);
  ctx.restore();

  ctx.save();
  ctx.font = "bold 11px 'Fira Mono', Consolas, monospace";
  ctx.fillStyle = turretOverheated ? "#ff2e2e" : "#8c6600";
  ctx.textAlign = "center";
  ctx.fillText(turretOverheated ? "OVERHEAT!" : "HEAT", PLAYER_X, y + h + 11);
  ctx.restore();
}

// --- キルカウンターゲージ ---
function drawKillCounter() {
  const x = PLAYER_X - 54;
  const y = PLAYER_Y + 115;
  const w = 108;
  const h = 8;
  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.strokeStyle = "#b08a4c";
  ctx.lineWidth = 2;
  ctx.fillStyle = "#cce0a4";
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = "#5ea12c";
  ctx.fillRect(x, y, w * (turretKillCounter / turretKillCounterMax), h);

  ctx.font = "bold 11px 'Fira Mono', Consolas, monospace";
  ctx.fillStyle = "#365a18";
  ctx.textAlign = "center";
  ctx.fillText(`KILL ${turretKillCounter}/${turretKillCounterMax}`, PLAYER_X, y + h + 11);
  ctx.restore();
}

// --- パッシブ強化UI ---
function drawPassiveUpgradeUI() {
  ctx.save();
  ctx.globalAlpha = 0.96;

  // 背景
  const bgW = Math.min(CANVAS_W * 0.88, 680);
  const bgH = Math.min(CANVAS_H * 0.82, 400);
  const bgX = (CANVAS_W - bgW) / 2;
  const bgY = (CANVAS_H - bgH) / 2;
  ctx.fillStyle = "#f9f8ec";
  ctx.fillRect(bgX, bgY, bgW, bgH);

  // タイトル等
  ctx.font = "bold 32px 'Fira Mono', Consolas, monospace";
  ctx.fillStyle = "#b08a4c";
  ctx.textAlign = "center";
  ctx.fillText("パッシブ強化（タレット横2Dビュー）", CANVAS_W/2, bgY + 48);

  ctx.font = "17px 'Fira Mono', Consolas, monospace";
  ctx.fillStyle = "#444";
  ctx.fillText("矢印キー/マウスで部位選択、スペースで強化、Escで閉じる", CANVAS_W/2, bgY + 82);

  ctx.font = "bold 16px 'Fira Mono', Consolas, monospace";
  ctx.fillStyle = "#888";
  ctx.fillText(`パッシブポイント: ${passivePoints}`, CANVAS_W/2, bgY + 112);

  // タレット横から見た2D図
  const baseX = CANVAS_W/2, baseY = bgY + bgH/2 + 10;

  // 部位リストを都度初期化
  passiveUpgradeParts = [
    { // 回路: コアにくっついた縦長長方形（右側）
      key: "overclock",
      type: "rect",
      x: baseX + 28, y: baseY - 23, w: 22, h: 46,
      contains(mx, my) {
        return mx >= this.x && mx <= this.x+this.w && my >= this.y && my <= this.y+this.h;
      },
      draw: function(highlight) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.w, this.h);
        ctx.fillStyle = highlight ? "#aef" : "#e7f7ff";
        ctx.shadowColor = highlight ? "#3cf" : "#fff";
        ctx.shadowBlur = highlight ? 17 : 0;
        ctx.fill();
        ctx.lineWidth = highlight ? 4 : 2;
        ctx.strokeStyle = highlight ? "#3caaff" : "#b08a4c";
        ctx.stroke();
        ctx.restore();
        // ラベル
        ctx.save();
        ctx.font = "bold 12px 'Fira Mono', Consolas, monospace";
        ctx.fillStyle = "#2b8cae";
        ctx.textAlign = "center";
        ctx.fillText("回路", this.x+this.w/2, this.y - 8);
        ctx.restore();
      }
    },
    { // 銃身
      key: "cooling",
      type: "rect",
      x: baseX + 58, y: baseY - 16, w: 60, h: 14,
      contains(mx, my) {
        return mx >= this.x && mx <= this.x+this.w && my >= this.y && my <= this.y+this.h;
      },
      draw: function(highlight) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.w, this.h);
        ctx.fillStyle = highlight ? "#ffd686" : "#fff3c9";
        ctx.shadowColor = highlight ? "#ffe082" : "#fff";
        ctx.shadowBlur = highlight ? 15 : 0;
        ctx.fill();
        ctx.lineWidth = highlight ? 4 : 2;
        ctx.strokeStyle = highlight ? "#ff8a2f" : "#b08a4c";
        ctx.stroke();
        ctx.restore();
        // ラベル
        ctx.save();
        ctx.font = "bold 12px 'Fira Mono', Consolas, monospace";
        ctx.fillStyle = "#b08a4c";
        ctx.textAlign = "center";
        ctx.fillText("銃身", this.x + this.w/2, this.y - 8);
        ctx.restore();
      }
    },
    { // 供給
      key: "capacity",
      type: "rect",
      x: baseX - 16, y: baseY + 24, w: 32, h: 16,
      contains(mx, my) {
        return mx >= this.x && mx <= this.x+this.w && my >= this.y && my <= this.y+this.h;
      },
      draw: function(highlight) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.w, this.h);
        ctx.fillStyle = highlight ? "#caffb0" : "#f2ffe0";
        ctx.shadowColor = highlight ? "#85e63b" : "#fff";
        ctx.shadowBlur = highlight ? 13 : 0;
        ctx.fill();
        ctx.lineWidth = highlight ? 4 : 2;
        ctx.strokeStyle = highlight ? "#5ea12c" : "#b08a4c";
        ctx.stroke();
        ctx.restore();
        // ラベル
        ctx.save();
        ctx.font = "bold 12px 'Fira Mono', Consolas, monospace";
        ctx.fillStyle = "#5ea12c";
        ctx.textAlign = "center";
        ctx.fillText("供給", this.x + this.w/2, this.y + this.h + 15);
        ctx.restore();
      }
    },
    { // コア
      key: "response",
      type: "circle",
      x: baseX, y: baseY, r: 28,
      contains(mx, my) {
        const dx = mx - this.x, dy = my - this.y;
        return dx*dx + dy*dy <= this.r*this.r;
      },
      draw: function(highlight) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
        ctx.fillStyle = highlight ? "#ffeacc" : "#fffbe7";
        ctx.shadowColor = highlight ? "#ff8a2f" : "#cab88a";
        ctx.shadowBlur = highlight ? 14 : 0;
        ctx.fill();
        ctx.lineWidth = highlight ? 5 : 2;
        ctx.strokeStyle = highlight ? "#ff8a2f" : "#b08a4c";
        ctx.stroke();
        ctx.restore();
        // ラベル
        ctx.save();
        ctx.font = "bold 13px 'Fira Mono', Consolas, monospace";
        ctx.fillStyle = "#b08a4c";
        ctx.textAlign = "center";
        ctx.fillText("コア", this.x, this.y + 4);
        ctx.restore();
      }
    }
  ];

  // 本体描画（順序：補助パーツ→本体）
  // タレット足
  ctx.save();
  ctx.beginPath();
  ctx.rect(baseX - 9, baseY + 34, 18, 16);
  ctx.fillStyle = "#b0b0b0";
  ctx.globalAlpha = 0.22;
  ctx.fill();
  ctx.restore();

  // 供給（下部）→回路（右）→本体→砲身
  passiveUpgradeParts[2].draw(passiveUpgradeSelectIdx === 2);
  passiveUpgradeParts[0].draw(passiveUpgradeSelectIdx === 0);
  passiveUpgradeParts[3].draw(passiveUpgradeSelectIdx === 3);
  passiveUpgradeParts[1].draw(passiveUpgradeSelectIdx === 1);

  // 選択中チップ説明
  const sel = passiveUpgradeList[passiveUpgradeSelectIdx];
  ctx.save();
  ctx.font = "bold 20px 'Fira Mono', Consolas, monospace";
  ctx.fillStyle = "#ff8a2f";
  ctx.textAlign = "center";
  ctx.fillText(sel.title, CANVAS_W/2, bgY + bgH - 74);

  ctx.font = "italic 15px 'Fira Mono', Consolas, monospace";
  ctx.fillStyle = "#b08a4c";
  ctx.fillText(sel.subtitle, CANVAS_W/2, bgY + bgH - 48);

  ctx.font = "14px 'Fira Mono', Consolas, monospace";
  ctx.fillStyle = "#4c3b18";
  ctx.fillText(sel.desc, CANVAS_W/2, bgY + bgH - 24);
  ctx.restore();

  ctx.restore();
}

// --- マウス操作によるパッシブ強化部位選択 ---
canvas.addEventListener("mousedown", function(e) {
  if (!showPassiveUpgradeUI) return;
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const my = (e.clientY - rect.top) * (canvas.height / rect.height);

  for (let i = 0; i < passiveUpgradeParts.length; i++) {
    if (passiveUpgradeParts[i].contains(mx, my)) {
      passiveUpgradeSelectIdx = i;
      // クリックで即強化したい場合は下記コメントアウトを外す
      // if (passivePoints > 0) {
      //   const key = passiveUpgradeList[passiveUpgradeSelectIdx].key;
      //   turretUpgrades[key]++;
      //   passivePoints--;
      // }
      break;
    }
  }
});

// --- パッシブレベルアップ告知 ---
function drawPassiveUpgradeMsg() {
  if (!showPassiveUpgradeMsg) return;
  ctx.save();
  ctx.font = "bold 36px 'Fira Mono', Consolas, monospace";
  ctx.fillStyle = "#ff8a2f";
  ctx.textAlign = "center";
  ctx.globalAlpha = 1 - 0.01 * passiveMsgTimer;
  ctx.fillText("メインタレット:パッシブ レベルアップ", CANVAS_W/2, CANVAS_H/2);
  ctx.font = "20px 'Fira Mono', Consolas, monospace";
  ctx.fillStyle = "#b08a4c";
  ctx.fillText("スペースキーで選択画面へ", CANVAS_W/2, CANVAS_H/2+44);
  ctx.restore();
  passiveMsgTimer++;
  if (passiveMsgTimer > 160) showPassiveUpgradeMsg = false;
}
function showPassiveUpgradeLevelUpMessage() {
  showPassiveUpgradeMsg = true;
  passiveMsgTimer = 0;
}

// --- ENEMYクラス: レベルで変化/多角形回転 ---
class Enemy {
  constructor(word, sx, sy, level = 0) {
    this.type = "normal";
    this.level = level;
    this.word = word;
    this.progress = 0;
    this.x = sx;
    this.y = sy;
    this.radius = 13 + Math.random() * 2 + (level > 0 ? 3 : 0);
    // HP倍率計算
    let hpMul = 1;
    if (level >= 1) hpMul *= 2.5;
    if (level >= 2) hpMul *= 1.5;
    if (level >= 3) hpMul *= 1.5;
    if (level >= 4) hpMul *= 1.5;
    hpMul *= Math.pow(1.1, phase - 1);
    this.maxHp = Math.max(1, Math.round(hpMul * 100)); // 100倍
    this.hp = this.maxHp;
    // 移動速度
    if (level <= 1) {
      this.speed = 0.18 + Math.random() * 0.09;
    } else {
      this.speed = (0.18 + Math.random() * 0.09) * 0.33;
    }
    this.color = ENEMY_COLORS[Math.floor(Math.random() * ENEMY_COLORS.length)];
    this.dead = false;
    this.recentMiss = false;
    const dx = PLAYER_X - this.x;
    const dy = PLAYER_Y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    this.vx = (dx / dist) * this.speed;
    this.vy = (dy / dist) * this.speed;
    this.angle = Math.random() * Math.PI * 2;
    this.angleSpeed = 0.03 + Math.random() * 0.02;
  }
  get remainingWord() {
    return this.word.slice(this.progress);
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.recentMiss) this.recentMiss = false;
    if (this.level >= 1) {
      this.angle += this.angleSpeed;
    }
  }
  draw() {
    // 外周多角形
    if (this.level >= 1) {
      let n = this.level + 2;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.beginPath();
      let polySize = this.radius + 24; // 外周多角形だけ大きく
      for (let i = 0; i < n; i++) {
        let a = (2 * Math.PI / n) * i;
        let px = Math.cos(a) * polySize;
        let py = Math.sin(a) * polySize;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = "#d08040";
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.restore();
    }
    // 丸本体
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); // 通常サイズ
    ctx.fillStyle = this.recentMiss ? "#ffe0a6" : "#fff9e0";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = this.color;
    ctx.stroke();
    ctx.restore();

    // HPバー
    if (this.hp < this.maxHp) {
      ctx.save();
      ctx.fillStyle = "#f2e5c3";
      ctx.fillRect(this.x - 14, this.y + this.radius + 2, 28, 5);
      ctx.fillStyle = "#b08a4c";
      ctx.fillRect(this.x - 14, this.y + this.radius + 2, 28 * (this.hp / this.maxHp), 5);
      ctx.restore();
    }

    // シャドウ
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y - this.radius - 12, 22, Math.PI, 2 * Math.PI);
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = "#cab88a";
    ctx.fill();
    ctx.restore();

    // 単語
    ctx.font = "bold 15px 'Fira Mono', Consolas, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#d2c295";
    ctx.fillText(this.word.slice(0, this.progress), this.x - ctx.measureText(this.remainingWord).width / 2, this.y - this.radius - 12);
    ctx.fillStyle = "#3e2c16";
    ctx.fillText(this.remainingWord, this.x + ctx.measureText(this.word.slice(0, this.progress)).width / 2, this.y - this.radius - 12);
  }
  isComplete() {
    return this.progress >= this.word.length;
  }
  isAtPlayer() {
    return Math.hypot(this.x - PLAYER_X, this.y - PLAYER_Y) < (this.radius + 24);
  }
}

// --- レーザー発射型敵 ---
class LaserChargerEnemy {
  constructor(word, sx, sy) {
    this.type = "laser";
    this.word = word;
    this.progress = 0;
    this.x = sx;
    this.y = sy;
    this.radius = 26;
    this.color = LASER_ENEMY_COLOR;
    this.hp = Math.round(3 * Math.pow(1.1, phase - 1) * 100);
    this.maxHp = this.hp;
    const dx = PLAYER_X - this.x;
    const dy = PLAYER_Y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    this.vx = (dx / dist) * 0.13;
    this.vy = (dy / dist) * 0.13;
    this.state = "move";
    this.chargeTime = (60 + Math.floor(Math.random() * 15)) * 3; // チャージ時間3倍
    this.chargeCounter = 0;
    this.chargeStages = 2;
    this.chargeStage = 0;
    this.angle = Math.random() * Math.PI * 2;
    this.angleSpeed = 0; // 回転しない
    this.dead = false;
    this.laserActive = false;
    this.laserWord = getLaserWord();
    this.laserProgress = 0;
    this.laserX = this.x;
    this.laserY = this.y;
    this.laserVx = 0;
    this.laserVy = 0;
    this.laserSpeed = 0;
    this.laserArrived = false;
    this.laserParticleTimer = 0;
    this.laserParticles = [];
  }
  get remainingWord() {
    return this.word?.slice(this.progress) ?? "";
  }
  isComplete() {
    return this.progress >= (this.word?.length ?? 0);
  }
  update() {
    if (this.state === "move") {
      this.x += this.vx;
      this.y += this.vy;
      // チャージ開始範囲を5倍に
      if (Math.hypot(this.x - PLAYER_X, this.y - PLAYER_Y) < 60 * 5) {
        this.state = "charge";
        this.chargeCounter = 0;
        this.chargeStage = 0;
      }
    } else if (this.state === "charge") {
      this.chargeCounter++;
      if (this.chargeCounter > this.chargeTime * (this.chargeStage + 1) / this.chargeStages && this.chargeStage < this.chargeStages - 1) {
        this.chargeStage++;
      }
      if (this.chargeCounter >= this.chargeTime) {
        this.state = "fire";
        const dx = PLAYER_X - this.x;
        const dy = PLAYER_Y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        this.laserVx = (dx / dist) * 0.72;
        this.laserVy = (dy / dist) * 0.72;
        this.laserX = this.x;
        this.laserY = this.y;
        this.laserSpeed = 0.72;
        this.laserActive = true;
        this.laserArrived = false;
        this.laserAngle = Math.atan2(dy, dx);
      }
    } else if (this.state === "fire" && this.laserActive) {
      this.laserX += this.laserVx;
      this.laserY += this.laserVy;
      this.laserParticleTimer++;
      if (this.laserParticleTimer % 2 === 0) {
        this.laserParticles.push({
          x: this.laserX,
          y: this.laserY,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2,
          life: 16 + Math.random() * 10
        });
      }
      this.laserParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
      });
      this.laserParticles = this.laserParticles.filter(p => p.life > 0);
      if (Math.hypot(this.laserX - PLAYER_X, this.laserY - PLAYER_Y) < 28) {
        this.laserArrived = true;
        this.laserActive = false;
        this.dead = true;
        playerHp -= 100;
        if (playerHp <= 0 && !gameOver) {
          gameOver = true;
          restartBtn.style.display = "block";
        }
      }
    }
    // this.angle += this.angleSpeed; // 回転しない
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    // プレイヤー方向を向く角度を計算
    let dx = PLAYER_X - this.x;
    let dy = PLAYER_Y - this.y;
    let playerAngle = Math.atan2(dy, dx);
    ctx.rotate(playerAngle);
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      let a = Math.PI / 2 * i;
      let px = Math.cos(a) * this.radius;
      let py = Math.sin(a) * this.radius * 1.2;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = "#e6f7ff";
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3.2;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = "#f2e5c3";
    ctx.fillRect(this.x - 19, this.y + this.radius + 2, 38, 6);
    ctx.fillStyle = "#3a6a87";
    ctx.fillRect(this.x - 19, this.y + this.radius + 2, 38 * (this.hp / this.maxHp), 6);
    ctx.restore();

    if (this.state === "charge") {
      let width = 38, height = 5;
      let stageRatio = (this.chargeCounter - Math.floor(this.chargeTime / this.chargeStages) * this.chargeStage) / (this.chargeTime / this.chargeStages);
      let y = this.y + this.radius + 11;
      ctx.save();
      ctx.fillStyle = "#d4f1fe";
      ctx.fillRect(this.x - width / 2, y, width, height);
      for (let st = 0; st <= this.chargeStage; st++) {
        let segW = (st === this.chargeStage) ? width * stageRatio / this.chargeStages : width / this.chargeStages;
        ctx.fillStyle = st === 0 ? "#6edefa" : "#16d1fa";
        ctx.fillRect(this.x - width / 2 + (width / this.chargeStages) * st, y, segW, height);
      }
      ctx.strokeStyle = "#3a6a87";
      ctx.strokeRect(this.x - width / 2, y, width, height);
      ctx.restore();
    }

    if (this.state === "fire" && this.laserActive) {
      ctx.save();
      ctx.translate(this.laserX, this.laserY);
      ctx.rotate(this.laserAngle);
      let len = 58, width = 13;
      let grad = ctx.createLinearGradient(-len / 2, 0, len / 2, 0);
      grad.addColorStop(0, "#e6f7ff");
      grad.addColorStop(0.5, "#39b7ff");
      grad.addColorStop(1, "#e6f7ff");
      ctx.beginPath();
      ctx.rect(-len / 2, -width / 2, len, width);
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#39b7ff";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(this.laserX, this.laserY, 18, 0, Math.PI * 2);
      ctx.fillStyle = "#e6f7ff";
      ctx.shadowColor = "#66e0ff";
      ctx.shadowBlur = 18;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#39b7ff";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();

      for (let p of this.laserParticles) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life / 24);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#9cf0ff";
        ctx.shadowColor = "#55eaff";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      ctx.save();
      ctx.font = "bold 20px 'Fira Mono', Consolas, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#006d93";
      ctx.fillText(
        this.laserWord.slice(0, this.laserProgress),
        this.laserX - ctx.measureText(this.laserWord.slice(this.laserProgress)).width / 2,
        this.laserY
      );
      ctx.fillStyle = "#1b3c47";
      ctx.fillText(
        this.laserWord.slice(this.laserProgress),
        this.laserX + ctx.measureText(this.laserWord.slice(0, this.laserProgress)).width / 2,
        this.laserY
      );
      ctx.restore();
    }
  }
  isAtPlayer() {
    return Math.hypot(this.x - PLAYER_X, this.y - PLAYER_Y) < (this.radius + 24);
  }
}

// --- バースト発射用Bulletクラス拡張 ---
// --- バースト発射用Bulletクラス（敵に当たった瞬間だけヒットして消える） ---
class Bullet {
  constructor(targetEnemy, sx = PLAYER_X, sy = PLAYER_Y, damage = 34) { // ★デフォルト攻撃力34に変更
    this.x = sx;
    this.y = sy;
    // ターゲットの位置に向けて発射
    const dx = targetEnemy.x - this.x;
    const dy = targetEnemy.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    this.vx = (dx / dist) * 9;
    this.vy = (dy / dist) * 9;
    this.damage = damage;
    this.hit = false; // 当たったかどうか
  }

  update() {
    if (this.hit) return; // もう当たってる場合は何もしない
    this.x += this.vx;
    this.y += this.vy;

    for (let enemy of enemies) {
      if (enemy.dead) continue;
      const dist = Math.hypot(this.x - enemy.x, this.y - enemy.y);
      const r = enemy.radius + 6;
      if (dist < r) {
        enemy.hp -= this.damage;
        this.hit = true; // 当たったら消える
        if (enemy.hp <= 0) {
          enemy.dead = true;
          onEnemyKilled();
        }
        break; // どれか1体に当たったら以降は処理しない
      }
    }
  }

  draw() {
    if (this.hit) return; // 当たった弾は描画しない
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#b08a4c";
    ctx.strokeStyle = "#fffbe7";
    ctx.lineWidth = 2.5;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  isActive() {
    // 画面外 or 当たったら消える
    return !this.hit &&
      this.x > -50 && this.x < CANVAS_W + 50 &&
      this.y > -50 && this.y < CANVAS_H + 50;
  }
}


// --- update内の弾の扱い ---
function update() {
  if (gameOver || !playing) return;
  coolTurret();
  updatePlayerTurretAndBurst();
  enemies.forEach(e => e.update());
  bullets.forEach(b => b.update());
  // 弾は当たるか画面外に出るまで残す
  bullets = bullets.filter(b => b.isActive());
  for (let e of enemies) {
    if (e.dead && !e.counted) {
      score++;
      e.counted = true;
      scoreElem.textContent = "SCORE: " + score;
    }
  }
  enemies = enemies.filter(e => !e.dead || (e.type === "laser" && e.state === "fire" && e.laserActive));
  for (let e of enemies) {
    if (e.type === "normal" && e.isAtPlayer() && !e.dead) {
      playerHp -= 100;
      e.dead = true;
      if (playerHp <= 0 && !gameOver) {
        gameOver = true;
        restartBtn.style.display = "block";
      }
    }
  }
  if (playerHp <= 0 && !gameOver) {
    gameOver = true;
    restartBtn.style.display = "block";
  }
}

// --- プレイヤーバーストロジック ---
function updatePlayerTurretAndBurst() {
  if (playerTurretTurning) {
    let diff = playerTurretTargetAngle - playerTurretAngle;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    if (Math.abs(diff) < 0.08) {
      playerTurretAngle = playerTurretTargetAngle;
      playerTurretTurning = false;
      playerBurstTimer = 0;
      playerBurstStep = 0;
    } else {
      playerTurretAngle += Math.sign(diff) * Math.min(playerTurretTurnSpeed, Math.abs(diff));
    }
  }
  if (!playerTurretTurning && playerBurstQueue.length > 0) {
    // 強化値反映
    let burstNum = 3 + Math.min(3, Math.floor(turretUpgrades.capacity * 0.4));
    let baseInterval = 4;
    let rapidFactor = Math.min(1.5, 1 + 0.02 * turretUpgrades.response);
    let interval = Math.max(1, Math.round(baseInterval / rapidFactor));
    // コンボ強化合成
    burstNum += Math.min(3, Math.floor(comboLevel / 7));
    interval = Math.max(interval, Math.round(baseInterval * Math.pow(0.8, Math.floor(comboLevel / 2))));
    interval = Math.max(1, Math.round(interval));
    // オーバーヒートチェック
    if (turretOverheated) return;
    playerBurstTimer++;
    if (playerBurstStep < burstNum && playerBurstTimer >= playerBurstStep * interval) {
      const { enemy } = playerBurstQueue[0];
      const px = PLAYER_X + Math.cos(playerTurretAngle) * 26;
      const py = PLAYER_Y + Math.sin(playerTurretAngle) * 26;
      let baseDmg = 34 * (1 + 0.02 * turretUpgrades.overclock); // ★攻撃力34に修正
      bullets.push(new Bullet(enemy, px, py, baseDmg));
      playerBurstStep++;
      if (playerBurstStep === 1) updateTurretHeat(burstNum);
    }
    if (playerBurstStep >= burstNum) {
      playerBurstQueue.shift();
      playerBurstTimer = 0;
      playerBurstStep = 0;
    }
  }
}

// --- パッシブ強化UI 入力 ---
document.addEventListener("keydown", e => {
  // --- 一時停止ON/OFF ---
  if (e.key === "Escape" && !showPassiveUpgradeUI && !showPassiveUpgradeMsg && playing && !gameOver) {
    isPaused = !isPaused;
    return;
  }
  if (showPassiveUpgradeUI) {
    if (e.key === "ArrowLeft" || e.key === "a") passiveUpgradeSelectIdx = (passiveUpgradeSelectIdx+3)%4;
    if (e.key === "ArrowRight" || e.key === "d") passiveUpgradeSelectIdx = (passiveUpgradeSelectIdx+1)%4;
    if (e.key === "ArrowUp" || e.key === "w") passiveUpgradeSelectIdx = (passiveUpgradeSelectIdx+2)%4;
    if (e.key === "ArrowDown" || e.key === "s") passiveUpgradeSelectIdx = (passiveUpgradeSelectIdx+2)%4;
    if (e.key === " " && passivePoints > 0) {
      const key = passiveUpgradeList[passiveUpgradeSelectIdx].key;
      turretUpgrades[key]++;
      passivePoints--;
    }
    if (e.key === "Escape" || e.key === "Enter") {
      showPassiveUpgradeUI = false;
      playing = true;
    }
    return;
  }
  if (showPassiveUpgradeMsg && e.key === " ") {
    showPassiveUpgradeMsg = false;
    showPassiveUpgradeUI = true;
    playing = false;
    return;
  }
  if (!playing || gameOver || isPaused) return;
  const key = e.key;

  // --- レーザー迎撃や本体攻撃など省略 ---

  // --- 通常敵のタイピング判定（全敵のprogressをチェックし完了時は単語入替） ---
  if (key.length === 1 && key.match(/[a-zA-Z]/i)) {
    let matchedAny = false;
    for (let enemy of enemies) {
      if (enemy.type === "normal" && !enemy.isComplete() && !enemy.dead) {
        const expected = enemy.word[enemy.progress]?.toLowerCase();
        if (key.toLowerCase() === expected) {
          enemy.progress++;
          enemy.recentMiss = false;
          matchedAny = true;
          if (!enemy.dead && enemy.isComplete()) {
            const dx = enemy.x - PLAYER_X;
            const dy = enemy.y - PLAYER_Y;
            let angle = Math.atan2(dy, dx);
            playerTurretTargetAngle = angle;
            playerTurretTurning = true;
            playerBurstQueue.push({ enemy });
            // 新しい単語に入替
            const newWord = words[Math.floor(Math.random() * words.length)];
            enemy.word = newWord;
            enemy.progress = 0;
          }
        } else if (enemy.progress > 0) {
          enemy.progress = 0;
          enemy.recentMiss = true;
        }
      }
    }
    if (!matchedAny) {
      comboLevel = 0;
      comboCount = 0;
      for (let enemy of enemies) {
        if (enemy.type === "normal" && !enemy.isComplete() && !enemy.dead) {
          enemy.progress = 0;
          enemy.recentMiss = true;
        }
      }
    } else {
      comboCount++;
      if (comboCount >= 10) {
        comboLevel++;
        maxComboLevel = Math.max(comboLevel, maxComboLevel);
        comboCount = 0;
      }
    }
  }
});

// --- 敵撃破時 ---
function onEnemyKilled() {
  turretKillCounter++;
  if (turretKillCounter >= turretKillCounterMax) {
    turretKillCounter = 0;
    turretKillCounterMax = Math.ceil(turretKillCounterMax * turretKillCounterNextMul);
    passivePoints += 2;
    showPassiveUpgradeLevelUpMessage();
  }
}

// --- スポーン ---
function spawnEnemy() {
  updatePhase();
  let r = Math.random();
  let sx, sy;
  let edge = Math.floor(Math.random() * 4);
  if (edge === 0) {
    sx = Math.random() * CANVAS_W;
    sy = -40;
  } else if (edge === 1) {
    sx = CANVAS_W + 40;
    sy = Math.random() * CANVAS_H;
  } else if (edge === 2) {
    sx = Math.random() * CANVAS_W;
    sy = CANVAS_H + 40;
  } else {
    sx = -40;
    sy = Math.random() * CANVAS_H;
  }
  if (phase === 1) {
    const word = words[Math.floor(Math.random() * words.length)];
    enemies.push(new Enemy(word, sx, sy, 0));
  } else if (phase === 2) {
    if (r < 0.8) {
      const word = words[Math.floor(Math.random() * words.length)];
      enemies.push(new Enemy(word, sx, sy, 0));
    } else if (r < 0.95) {
      const word = words[Math.floor(Math.random() * words.length)];
      enemies.push(new Enemy(word, sx, sy, 1));
    } else {
      enemies.push(new LaserChargerEnemy(words[Math.floor(Math.random() * words.length)], sx, sy));
    }
  } else if (phase === 3) {
    if (r < 0.6) {
      enemies.push(new Enemy(words[Math.floor(Math.random() * words.length)], sx, sy, 0));
    } else if (r < 0.8) {
      enemies.push(new Enemy(words[Math.floor(Math.random() * words.length)], sx, sy, 1));
    } else if (r < 0.9) {
      enemies.push(new Enemy(words[Math.floor(Math.random() * words.length)], sx, sy, 2));
    } else {
      enemies.push(new LaserChargerEnemy(words[Math.floor(Math.random() * words.length)], sx, sy));
    }
  } else if (phase === 4) {
    if (r < 0.5) {
      enemies.push(new Enemy(words[Math.floor(Math.random() * words.length)], sx, sy, 0));
    } else if (r < 0.7) {
      enemies.push(new Enemy(words[Math.floor(Math.random() * words.length)], sx, sy, 1));
    } else if (r < 0.8) {
      enemies.push(new Enemy(words[Math.floor(Math.random() * words.length)], sx, sy, 2));
    } else if (r < 0.9) {
      enemies.push(new Enemy(words[Math.floor(Math.random() * words.length)], sx, sy, 3));
    } else {
      enemies.push(new LaserChargerEnemy(words[Math.floor(Math.random() * words.length)], sx, sy));
    }
  } else {
    if (r < 0.4) {
      enemies.push(new Enemy(words[Math.floor(Math.random() * words.length)], sx, sy, 0));
    } else if (r < 0.6) {
      enemies.push(new Enemy(words[Math.floor(Math.random() * words.length)], sx, sy, 1));
    } else if (r < 0.7) {
      enemies.push(new Enemy(words[Math.floor(Math.random() * words.length)], sx, sy, 2));
    } else if (r < 0.8) {
      enemies.push(new Enemy(words[Math.floor(Math.random() * words.length)], sx, sy, 3));
    } else if (r < 0.9) {
      enemies.push(new Enemy(words[Math.floor(Math.random() * words.length)], sx, sy, 4));
    } else {
      enemies.push(new LaserChargerEnemy(words[Math.floor(Math.random() * words.length)], sx, sy));
    }
  }
}

// --- UPDATE/DRAW/LOOP ---
let lastUpdateTime = 0;
const updateInterval = 1000 / 60; // 16.666ms

function gameLoop(timestamp) {
  if (!lastUpdateTime) lastUpdateTime = timestamp;
  const elapsed = timestamp - lastUpdateTime;
  if (elapsed >= updateInterval) {
    if (playing && !gameOver && !showPassiveUpgradeUI && !isPaused) {
      spawnTimer++;
      if (spawnTimer > Math.round(spawnInterval / 0.66)) {
        spawnEnemy();
        spawnTimer = 0;
      }
      update();
    }
    lastUpdateTime = timestamp;
  }
  draw();
  requestAnimationFrame(gameLoop);
}

function update() {
  if (gameOver || !playing) return;
  coolTurret();
  updatePlayerTurretAndBurst();
  enemies.forEach(e => e.update());
  bullets.forEach(b => b.update());
  // 弾は当たるか画面外に出るまで残す
  bullets = bullets.filter(b => b.isActive());
  for (let e of enemies) {
    if (e.dead && !e.counted) {
      score++;
      e.counted = true;
      scoreElem.textContent = "SCORE: " + score;
    }
  }
  enemies = enemies.filter(e => !e.dead || (e.type === "laser" && e.state === "fire" && e.laserActive));
  for (let e of enemies) {
    if (e.type === "normal" && e.isAtPlayer() && !e.dead) {
      playerHp -= 100;
      e.dead = true;
      if (playerHp <= 0 && !gameOver) {
        gameOver = true;
        restartBtn.style.display = "block";
      }
    }
  }
  if (playerHp <= 0 && !gameOver) {
    gameOver = true;
    restartBtn.style.display = "block";
  }
}

function draw() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // 通常UI（スコア・フェーズ）描画
  ctx.save();
  ctx.font = "bold 26px 'Fira Mono', Consolas, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#b08a4c";
  ctx.fillText(`SCORE: ${score}`, 32, 24);

  ctx.font = "20px 'Fira Mono', Consolas, monospace";
  ctx.textAlign = "right";
  ctx.fillStyle = "#938066";
  ctx.fillText(`PHASE: ${phase}`, CANVAS_W - 32, 26);
  ctx.restore();

  // プレイヤー・敵・弾を常に描画する
  drawPlayer();
  enemies.forEach(e => e.draw());
  bullets.forEach(b => b.draw());
  drawPassiveUpgradeMsg();

  // パッシブ強化UIがある場合は優先的に最前面に描画
  if (showPassiveUpgradeUI) {
    drawPassiveUpgradeUI();
  }

  // 一時停止画面
  if (isPaused) {
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = "#f9f8ec";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.globalAlpha = 1;
    ctx.font = "bold 60px 'Fira Mono', Consolas, monospace";
    ctx.fillStyle = "#b08a4c";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("PAUSED", CANVAS_W / 2, CANVAS_H / 2 - 30);
    ctx.font = "bold 28px 'Fira Mono', Consolas, monospace";
    ctx.fillStyle = "#938066";
    ctx.fillText("ESCキーで再開", CANVAS_W / 2, CANVAS_H / 2 + 32);
    ctx.restore();
    return;
  }

  // ゲームオーバー
  if (gameOver) {
    ctx.save();
    ctx.font = "bold 58px 'Fira Mono', Consolas, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#b08a4c";
    ctx.fillText("GAME OVER", CANVAS_W / 2, CANVAS_H / 2 - 40);
    ctx.font = "bold 28px 'Fira Mono', Consolas, monospace";
    ctx.fillStyle = "#938066";
    ctx.fillText("リスタートで再挑戦", CANVAS_W / 2, CANVAS_H / 2 + 32);
    ctx.restore();
  }
}

function gameLoop(timestamp) {
  if (!lastUpdateTime) lastUpdateTime = timestamp;
  const elapsed = timestamp - lastUpdateTime;
  if (elapsed >= updateInterval) {
    if (playing && !gameOver && !showPassiveUpgradeUI) {
      spawnTimer++;
      if (spawnTimer > Math.round(spawnInterval / 0.66)) {
        spawnEnemy();
        spawnTimer = 0;
      }
      update();
    }
    lastUpdateTime = timestamp;
  }
  draw();
  requestAnimationFrame(gameLoop);
}
// --- その他UI・開始・リスタート ---
restartBtn.onclick = function() { startGame(); };
startBtn.onclick = function() { startGame(); };
window.addEventListener("resize", () => { if (playing) resizeCanvas(); });

function startGame() {
  setWordsBySelected();
  titleScreen.style.display = "none";
  scoreElem.style.display = "none";
  infoElem.style.display = "none";
  resizeCanvas();
  enemies = [];
  bullets = [];
  score = 0;
  phase = 1;
  gameOver = false;
  spawnTimer = 0;
  playing = true;
  restartBtn.style.display = "none";
  playerHp = PLAYER_MAX_HP;
  comboLevel = 0;
  comboCount = 0;
  turretHeat = 0;
  turretOverheated = false;
  turretKillCounter = 0;
  turretKillCounterMax = 30;
  passivePoints = 0;
  turretUpgrades = { overclock: 0, cooling: 0, capacity: 0, response: 0 };
  showPassiveUpgradeUI = false;
  playerTurretAngle = -Math.PI / 2;
  playerTurretTargetAngle = playerTurretAngle;
  playerTurretTurning = false;
  playerBurstQueue = [];
  playerBurstTimer = 0;
  playerBurstStep = 0;
}

window.onload = () => {
  setWordsBySelected();
  startBtn.style.display = "inline-block";
  draw();
};
gameLoop();