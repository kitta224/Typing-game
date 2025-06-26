// --- パッシブ強化UI・関連 ---
function drawPassiveUpgradeUI() {
  ctx.save();
  ctx.globalAlpha = 0.98;
  ctx.fillStyle = "rgba(40, 32, 16, 0.72)";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(50, 50, CANVAS_W - 100, CANVAS_H - 100);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 28px 'Fira Mono', Consolas, monospace";
  ctx.textAlign = "left";
  ctx.fillText("パッシブ強化", 70, 90);
  ctx.font = "20px 'Fira Mono', Consolas, monospace";
  ctx.fillStyle = "#ddd";
  ctx.fillText("選択中: " + passiveUpgradeList[passiveUpgradeSelectIdx].title, 70, 130);
  ctx.fillText("説明: " + passiveUpgradeList[passiveUpgradeSelectIdx].desc, 70, 160);
  ctx.fillText("パッシブポイント: " + passivePoints, 70, CANVAS_H - 70);
  ctx.fillText("スペースキーで選択", 70, CANVAS_H - 40);
  ctx.restore();
}
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
let showPassiveUpgradeUI = false;
let showPassiveUpgradeMsg = false;
let passiveMsgTimer = 0;
let passivePoints = 0;
let passiveUpgradeSelectIdx = 0;
let passiveUpgradeParts = [];
const passiveUpgradeList = [
  { key: "overclock", title: "回路", subtitle: "オーバークロック", desc: "ダメージ+2%・加熱+1%" },
  { key: "cooling", title: "銃身", subtitle: "冷却強化", desc: "冷却速度+2%" },
  { key: "capacity", title: "供給", subtitle: "キャパシティ増加", desc: "キャパシティ+2.5%(4Lv毎にバースト+1)" },
  { key: "response", title: "コア", subtitle: "反応速度", desc: "連射速度+2%" }
];