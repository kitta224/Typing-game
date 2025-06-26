// --- 定数・グローバル変数・UI初期化・ゲームループ・startGame・draw・update ---
window.canvas = document.getElementById("game");
window.ctx = window.canvas.getContext("2d");
window.scoreElem = document.getElementById("score");
window.restartBtn = document.getElementById("restart-btn");
window.startBtn = document.getElementById("start-btn");
window.titleScreen = document.getElementById("title-screen");
window.infoElem = document.getElementById("info");
window.wordsetSelect = document.getElementById("wordset-select");
window.ENEMY_COLORS = ["#cab88a", "#d2c295", "#b08a4c", "#c2a974", "#dfc99c", "#a88d58"];
window.LASER_ENEMY_COLOR = "#90d7f1";
window.PLAYER_COLOR = "#b08a4c";
window.PLAYER_MAX_HP = 500;
window.PLAYER_X = 0;
window.PLAYER_Y = 0;
window.CANVAS_W = 0;
window.CANVAS_H = 0;
window.enemies = [];
window.bullets = [];
window.score = 0;
window.gameOver = false;
window.spawnTimer = 0;
window.spawnInterval = 75;
window.playing = false;
window.selectedWordSet = "en";
window.phase = 1;
window.words = [];

// --- 汎用関数・定数 ---
const ENEMY_COLORS = [
  "#cab88a", "#d2c295", "#b08a4c", "#c2a974", "#dfc99c", "#a88d58"
];
const LASER_ENEMY_COLOR = "#90d7f1";
const PLAYER_COLOR = "#b08a4c";
const PLAYER_MAX_HP = 500;

// --- グローバル変数の初期化 ---
window.selectedWordSet = window.selectedWordSet || "en";
window.words = window.words || [];
window.LASER_WORDS = window.LASER_WORDS || [];
window.WORDS_EN = window.WORDS_EN || [];
window.WORDS_CODE = window.WORDS_CODE || [];
window.canvas = window.canvas || document.getElementById("game");
window.ctx = window.ctx || (window.canvas ? window.canvas.getContext("2d") : undefined);
window.titleScreen = window.titleScreen || document.getElementById("title-screen");
window.scoreElem = window.scoreElem || document.getElementById("score");
window.restartBtn = window.restartBtn || document.getElementById("restart-btn");
window.startBtn = window.startBtn || document.getElementById("start-btn");
window.infoElem = window.infoElem || document.getElementById("info");
window.enemies = window.enemies || [];
window.bullets = window.bullets || [];
window.score = window.score || 0;
window.gameOver = window.gameOver || false;
window.spawnTimer = window.spawnTimer || 0;
window.playing = window.playing || false;
window.selectedWordSet = window.selectedWordSet || "en";
window.phase = window.phase || 1;
window.words = window.words || [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  CANVAS_W = canvas.width;
  CANVAS_H = canvas.height;
  PLAYER_X = CANVAS_W / 2;
  PLAYER_Y = CANVAS_H / 2;
}
function setWordsBySelected() {
  if (window.selectedWordSet === "en") {
    window.words = window.WORDS_EN;
  } else if (window.selectedWordSet === "code") {
    window.words = window.WORDS_CODE;
  } else {
    window.words = window.WORDS_EN;
  }
}
window.setWordsBySelected = setWordsBySelected;
function getLaserWord() {
  return window.LASER_WORDS[Math.floor(Math.random() * window.LASER_WORDS.length)];
}
function startGame() {
  if (typeof window.setWordsBySelected === 'function') window.setWordsBySelected();
  if (window.titleScreen) window.titleScreen.style.display = "none";
  if (window.scoreElem) window.scoreElem.style.display = "none";
  if (window.infoElem) window.infoElem.style.display = "none";
  if (typeof window.resizeCanvas === 'function') window.resizeCanvas();
  if (window.enemies) window.enemies = [];
  if (window.bullets) window.bullets = [];
  window.score = 0;
  window.phase = 1;
  window.gameOver = false;
  window.spawnTimer = 0;
  window.playing = true;
  if (window.restartBtn) window.restartBtn.style.display = "none";
  window.playerHp = window.PLAYER_MAX_HP || 500;
  window.comboLevel = 0;
  window.comboCount = 0;
  window.turretHeat = 0;
  window.turretOverheated = false;
  window.turretKillCounter = 0;
  window.turretKillCounterMax = 30;
  window.passivePoints = 0;
  window.turretUpgrades = { overclock: 0, cooling: 0, capacity: 0, response: 0 };
  window.showPassiveUpgradeUI = false;
  window.playerTurretAngle = -Math.PI / 2;
  window.playerTurretTargetAngle = window.playerTurretAngle;
  window.playerTurretTurning = false;
  window.playerBurstQueue = [];
  window.playerBurstTimer = 0;
  window.playerBurstStep = 0;
}
window.startGame = startGame;

function update() {
  if (window.gameOver || !window.playing) return;
  // クールダウンやプレイヤーの状態更新など（必要に応じて追加）
  if (typeof window.coolTurret === 'function') window.coolTurret();
  if (typeof window.updatePlayerTurretAndBurst === 'function') window.updatePlayerTurretAndBurst();
  if (window.enemies) window.enemies.forEach(e => e.update && e.update());
  if (window.bullets) window.bullets.forEach(b => b.update && b.update());
  if (window.bullets) window.bullets = window.bullets.filter(b => b.isActive && b.isActive() && !b.hit);
}

function draw() {
  if (!window.ctx) return;
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  // UI
  ctx.save();
  ctx.font = "bold 26px 'Fira Mono', Consolas, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#b08a4c";
  ctx.fillText(`SCORE: ${window.score || 0}`, 32, 24);
  ctx.font = "20px 'Fira Mono', Consolas, monospace";
  ctx.textAlign = "right";
  ctx.fillStyle = "#938066";
  ctx.fillText(`PHASE: ${window.phase || 1}`, CANVAS_W - 32, 26);
  ctx.restore();
  // プレイヤー・敵・弾
  if (typeof window.drawPlayer === 'function') window.drawPlayer();
  if (window.enemies) window.enemies.forEach(e => e.draw && e.draw());
  if (window.bullets) window.bullets.forEach(b => b.draw && b.draw());
  if (typeof window.drawPassiveUpgradeMsg === 'function') window.drawPassiveUpgradeMsg();
  if (window.showPassiveUpgradeUI && typeof window.drawPassiveUpgradeUI === 'function') window.drawPassiveUpgradeUI();
  // ゲームオーバー
  if (window.gameOver) {
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

let lastFrameTime = performance.now();
let frameDelta = 1;
const BASE_FPS = 60;
function gameLoop() {
  const now = performance.now();
  frameDelta = (now - lastFrameTime) / (1000 / BASE_FPS);
  lastFrameTime = now;
  if (window.playing && !window.gameOver && !window.showPassiveUpgradeUI) {
    if (!window.spawnTimer) window.spawnTimer = 0;
    window.spawnTimer += frameDelta;
    // 敵のスポーン処理（必要ならwindow.spawnEnemyを用意）
    if (typeof window.spawnEnemy === 'function' && window.spawnInterval && window.spawnTimer > Math.round(window.spawnInterval / 0.66)) {
      window.spawnEnemy();
      window.spawnTimer = 0;
    }
    update();
  }
  draw();
  requestAnimationFrame(gameLoop);
}
window.gameLoop = gameLoop;
window.update = update;
window.draw = draw;
window.frameDelta = frameDelta;
window.onload = function() {
  // DOM要素取得
  window.canvas = document.getElementById("game");
  window.ctx = window.canvas.getContext("2d");
  window.scoreElem = document.getElementById("score");
  window.restartBtn = document.getElementById("restart-btn");
  window.startBtn = document.getElementById("start-btn");
  window.titleScreen = document.getElementById("title-screen");
  window.infoElem = document.getElementById("info");
  window.wordsetSelect = document.getElementById("wordset-select");

  // 依存順でwindow変数を初期化
  window.PLAYER_X = 0;
  window.PLAYER_Y = 0;
  window.CANVAS_W = 0;
  window.CANVAS_H = 0;
  window.playerHp = window.PLAYER_MAX_HP;
  window.enemies = [];
  window.bullets = [];
  window.score = 0;
  window.gameOver = false;
  window.spawnTimer = 0;
  window.playing = false;
  window.words = [];
  window.selectedWordSet = "en";
  window.phase = 1;
  window.comboLevel = 0;
  window.comboCount = 0;
  window.maxComboLevel = 0;
  window.turretHeat = 0;
  window.turretOverheated = false;
  window.turretKillCounter = 0;
  window.turretKillCounterMax = 30;
  window.passivePoints = 0;
  window.showPassiveUpgradeUI = false;
  window.passiveUpgradeSelectIdx = 0;
  window.showPassiveUpgradeMsg = false;
  window.passiveMsgTimer = 0;
  window.playerTurretAngle = -Math.PI / 2;
  window.playerTurretTargetAngle = window.playerTurretAngle;
  window.playerTurretTurning = false;
  window.playerTurretTurnSpeed = 0.13;
  window.playerBurstQueue = [];
  window.playerBurstTimer = 0;
  window.playerBurstStep = 0;
  window.passiveUpgradeParts = [];

  // 必要な初期化関数をここで呼ぶ
  if (typeof window.initGame === "function") window.initGame();
};
