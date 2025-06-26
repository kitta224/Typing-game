// --- プレイヤー・タレット関連 変数 ---
let PLAYER_X = 0, PLAYER_Y = 0, CANVAS_W = 0, CANVAS_H = 0;
let playerHp = PLAYER_MAX_HP;
let comboLevel = 0;
let comboCount = 0;
let maxComboLevel = 0;
let turretHeat = 0;
let turretHeatMax = 1.0;
let turretHeatPerBurst = 0.13;
let turretCoolingPerFrame = 0.015;
let turretOverheated = false;
let playerTurretAngle = -Math.PI / 2;
let playerTurretTargetAngle = playerTurretAngle;
let playerTurretTurning = false;
let playerTurretTurnSpeed = 0.13;
let playerBurstQueue = [];
let playerBurstTimer = 0;
let playerBurstStep = 0;

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
  ctx.fillText(`HP: ${Math.round(playerHp / 100)} / ${PLAYER_MAX_HP/100}`, PLAYER_X, PLAYER_Y + 48);
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
