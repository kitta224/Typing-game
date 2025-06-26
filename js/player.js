// --- プレイヤー・タレット関連 変数 ---
window.PLAYER_X = window.PLAYER_X || 0;
window.PLAYER_Y = window.PLAYER_Y || 0;
window.CANVAS_W = window.CANVAS_W || 0;
window.CANVAS_H = window.CANVAS_H || 0;
window.playerHp = window.playerHp || window.PLAYER_MAX_HP;
window.comboLevel = window.comboLevel || 0;
window.comboCount = window.comboCount || 0;
window.maxComboLevel = window.maxComboLevel || 0;
window.turretHeat = window.turretHeat || 0;
window.turretHeatMax = window.turretHeatMax || 1.0;
window.turretHeatPerBurst = window.turretHeatPerBurst || 0.13;
window.turretCoolingPerFrame = window.turretCoolingPerFrame || 0.015;
window.turretOverheated = window.turretOverheated || false;
window.playerTurretAngle = window.playerTurretAngle || -Math.PI / 2;
window.playerTurretTargetAngle = window.playerTurretTargetAngle || window.playerTurretAngle;
window.playerTurretTurning = window.playerTurretTurning || false;
window.playerTurretTurnSpeed = window.playerTurretTurnSpeed || 0.13;
window.playerBurstQueue = window.playerBurstQueue || [];
window.playerBurstTimer = window.playerBurstTimer || 0;
window.playerBurstStep = window.playerBurstStep || 0;
window.turretKillCounter = window.turretKillCounter || 0;
window.turretKillCounterMax = window.turretKillCounterMax || 30;
window.turretKillCounterNextMul = window.turretKillCounterNextMul || 1.75;
window.turretUpgrades = window.turretUpgrades || { overclock: 0, cooling: 0, capacity: 0, response: 0 };
window.passivePoints = window.passivePoints || 0;
window.showPassiveUpgradeUI = window.showPassiveUpgradeUI || false;
window.passiveUpgradeSelectIdx = window.passiveUpgradeSelectIdx || 0;
window.passiveUpgradeList = window.passiveUpgradeList || [
  { key: "overclock", title: "回路", subtitle: "オーバークロック", desc: "ダメージ+2%・加熱+1%" },
  { key: "cooling", title: "銃身", subtitle: "冷却強化", desc: "冷却速度+2%" },
  { key: "capacity", title: "供給", subtitle: "キャパシティ増加", desc: "キャパシティ+2.5%(4Lv毎にバースト+1)" },
  { key: "response", title: "コア", subtitle: "反応速度", desc: "連射速度+2%" }
];
window.passiveUpgradeParts = window.passiveUpgradeParts || [];
window.showPassiveUpgradeMsg = window.showPassiveUpgradeMsg || false;
window.passiveMsgTimer = window.passiveMsgTimer || 0;

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
  ctx.fillRect(PLAYER_X - hpBarW / 2, PLAYER_Y + 40, hpBarW * (window.playerHp / PLAYER_MAX_HP), hpBarH);
  ctx.strokeStyle = "#cab88a";
  ctx.lineWidth = 2;
  ctx.strokeRect(PLAYER_X - hpBarW / 2, PLAYER_Y + 40, hpBarW, hpBarH);
  ctx.font = "bold 15px 'Fira Mono', Consolas, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#3e2c16";
  ctx.fillText(`HP: ${Math.round(window.playerHp / 100)} / ${PLAYER_MAX_HP/100}`, PLAYER_X, PLAYER_Y + 48);
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

// --- プレイヤー描画・タレット・バースト・HP・コンボ・タレットUI・入力処理 ---
// 必要な変数・関数をwindowにアタッチ
window.drawPlayer = drawPlayer;
function updatePlayerTurretAndBurst() {
  // ...バースト処理本体...
}
window.updatePlayerTurretAndBurst = updatePlayerTurretAndBurst;
window.comboLevel = comboLevel;
window.comboCount = comboCount;
window.maxComboLevel = maxComboLevel;
window.playerHp = playerHp;
window.PLAYER_MAX_HP = PLAYER_MAX_HP;
window.playerTurretAngle = playerTurretAngle;
window.playerTurretTargetAngle = playerTurretTargetAngle;
window.playerTurretTurning = playerTurretTurning;
window.playerTurretTurnSpeed = playerTurretTurnSpeed;
window.playerBurstQueue = playerBurstQueue;
window.playerBurstTimer = playerBurstTimer;
window.playerBurstStep = playerBurstStep;
function coolTurret() {
  // ...本体...
}
window.coolTurret = coolTurret;
function updateTurretHeat(deltaBurst) {
  // ...本体...
}
window.updateTurretHeat = updateTurretHeat;
window.turretHeat = turretHeat;
window.turretHeatMax = turretHeatMax;
window.turretHeatPerBurst = turretHeatPerBurst;
window.turretCoolingPerFrame = turretCoolingPerFrame;
window.turretOverheated = turretOverheated;
window.drawComboGauge = drawComboGauge;
window.drawTurretHeatGauge = drawTurretHeatGauge;
window.drawKillCounter = drawKillCounter;
window.turretKillCounter = turretKillCounter;
window.turretKillCounterMax = turretKillCounterMax;
window.turretKillCounterNextMul = turretKillCounterNextMul;
window.turretUpgrades = turretUpgrades;
window.passivePoints = passivePoints;
window.showPassiveUpgradeUI = showPassiveUpgradeUI;
window.passiveUpgradeSelectIdx = passiveUpgradeSelectIdx;
window.passiveUpgradeList = passiveUpgradeList;
window.passiveUpgradeParts = passiveUpgradeParts;
window.showPassiveUpgradeMsg = showPassiveUpgradeMsg;
window.passiveMsgTimer = passiveMsgTimer;
window.drawPassiveUpgradeMsg = drawPassiveUpgradeMsg;
window.showPassiveUpgradeLevelUpMessage = showPassiveUpgradeLevelUpMessage;

// すべての変数・関数はwindow.で参照・代入
// 例: window.playerHp, window.PLAYER_MAX_HP, window.comboLevel など
