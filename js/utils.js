// --- 汎用関数・定数 ---
const ENEMY_COLORS = [
  "#cab88a", "#d2c295", "#b08a4c", "#c2a974", "#dfc99c", "#a88d58"
];
const LASER_ENEMY_COLOR = "#90d7f1";
const PLAYER_COLOR = "#b08a4c";
const PLAYER_MAX_HP = 500;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  CANVAS_W = canvas.width;
  CANVAS_H = canvas.height;
  PLAYER_X = CANVAS_W / 2;
  PLAYER_Y = CANVAS_H / 2;
}
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
