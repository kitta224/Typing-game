// --- パッシブ強化UI・部位選択・強化処理 ---
window.drawPassiveUpgradeUI = drawPassiveUpgradeUI;
// --- パッシブ強化UI・関連 ---
function drawPassiveUpgradeUI() {
  ctx.save();
  ctx.globalAlpha = 0.98;
  // クールなグラデーション背景
  let grad = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H);
  grad.addColorStop(0, '#232946');
  grad.addColorStop(1, '#121629');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // UI本体
  const bgW = Math.min(CANVAS_W * 0.98, 900);
  const bgH = Math.min(CANVAS_H * 0.96, 600);
  const bgX = (CANVAS_W - bgW) / 2;
  const bgY = (CANVAS_H - bgH) / 2;
  ctx.save();
  ctx.globalAlpha = 0.97;
  ctx.fillStyle = '#181c2b';
  ctx.shadowColor = '#00cfff';
  ctx.shadowBlur = 32;
  ctx.fillRect(bgX, bgY, bgW, bgH);
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = '#00cfff';
  ctx.lineWidth = 4;
  ctx.strokeRect(bgX, bgY, bgW, bgH);
  ctx.restore();

  // タイトル
  ctx.font = "bold 44px 'Fira Mono', Consolas, monospace";
  ctx.fillStyle = '#00cfff';
  ctx.textAlign = 'center';
  ctx.fillText('PASSIVE UPGRADE', CANVAS_W/2, bgY + 70);

  // サブタイトル
  ctx.font = "22px 'Fira Mono', Consolas, monospace";
  ctx.fillStyle = '#eeb800';
  ctx.fillText('矢印キー/マウスで部位選択、スペースで強化、Escで閉じる', CANVAS_W/2, bgY + 120);

  // パッシブポイント
  ctx.font = "bold 28px 'Fira Mono', Consolas, monospace";
  ctx.fillStyle = '#fff';
  ctx.fillText('パッシブポイント: ' + window.passivePoints, CANVAS_W/2, bgY + 170);

  // 各部位のUI（サイバー風）
  const baseX = CANVAS_W/2, baseY = bgY + bgH/2 + 30;
  const partColors = ['#00cfff', '#eeb800', '#ff2e2e', '#00ffae'];
  for (let i = 0; i < passiveUpgradeList.length; i++) {
    let part = passiveUpgradeList[i];
    let highlight = (window.passiveUpgradeSelectIdx === i);
    ctx.save();
    ctx.beginPath();
    let px = baseX + Math.cos(i * Math.PI/2) * 180;
    let py = baseY + Math.sin(i * Math.PI/2) * 120;
    ctx.arc(px, py, highlight ? 62 : 48, 0, Math.PI*2);
    ctx.fillStyle = highlight ? partColors[i] : '#232946';
    ctx.globalAlpha = highlight ? 0.85 : 0.65;
    ctx.shadowColor = highlight ? partColors[i] : '#232946';
    ctx.shadowBlur = highlight ? 24 : 0;
    ctx.fill();
    ctx.lineWidth = highlight ? 7 : 3;
    ctx.strokeStyle = partColors[i];
    ctx.stroke();
    ctx.restore();
    // ラベル
    ctx.save();
    ctx.font = highlight ? "bold 22px 'Fira Mono', Consolas, monospace" : "16px 'Fira Mono', Consolas, monospace";
    ctx.fillStyle = highlight ? '#fff' : partColors[i];
    ctx.textAlign = 'center';
    ctx.fillText(part.title, px, py - 8);
    ctx.font = "italic 15px 'Fira Mono', Consolas, monospace";
    ctx.fillStyle = '#eeb800';
    ctx.fillText(part.subtitle, px, py + 16);
    ctx.restore();
    // 選択中なら説明
    if (highlight) {
      ctx.save();
      ctx.font = "20px 'Fira Mono', Consolas, monospace";
      ctx.fillStyle = '#fff';
      ctx.fillText(part.desc, CANVAS_W/2, bgY + bgH - 60);
      ctx.restore();
    }
  }
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
window.showPassiveUpgradeUI = window.showPassiveUpgradeUI || false;
window.passivePoints = window.passivePoints || 0;
window.passiveUpgradeSelectIdx = window.passiveUpgradeSelectIdx || 0;
window.passiveUpgradeParts = window.passiveUpgradeParts || [];
const passiveUpgradeList = [
  { key: "overclock", title: "回路", subtitle: "オーバークロック", desc: "ダメージ+2%・加熱+1%" },
  { key: "cooling", title: "銃身", subtitle: "冷却強化", desc: "冷却速度+2%" },
  { key: "capacity", title: "供給", subtitle: "キャパシティ増加", desc: "キャパシティ+2.5%(4Lv毎にバースト+1)" },
  { key: "response", title: "コア", subtitle: "反応速度", desc: "連射速度+2%" }
];