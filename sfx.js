// 効果音管理（ローカルファイル使用）
// sounds/type1.mp3, sounds/type2.mp3, sounds/kill.mp3 などを利用
const SFX = {
  type1: new Audio('sounds/type1.mp3'), // タイプ音1
  type2: new Audio('sounds/type2.mp3'), // タイプ音2
  kill: new Audio('sounds/kill.mp3'),   // 撃破音
  play(name) {
    if (this[name]) {
      try {
        this[name].currentTime = 0;
        this[name].play();
      } catch (e) {}
    }
  }
};
