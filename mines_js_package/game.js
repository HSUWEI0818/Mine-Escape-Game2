// game.js - 踩地雷遊戲的主要程式 (外部 JS)
// 將此檔與 index.html 放在同一目錄即可運行
(() => {
  // Game state
  let level = 1; // 1..3
  const maxLevel = 3;
  let n = 5; // current n
  const requiredPressesPerLevel = 3;
  let successPresses = 0;
  let bombs = new Set(); // indices with bombs
  let revealed = new Set();
  let gridSize = 0;

  const gridEl = document.getElementById('grid');
  const levelPill = document.getElementById('levelPill');
  const nPill = document.getElementById('nPill');
  const remainPill = document.getElementById('remainPill');
  const status = document.getElementById('status');
  const message = document.getElementById('message');
  const log = document.getElementById('log');
  const restartBtn = document.getElementById('restartBtn');
  const hintBtn = document.getElementById('hintBtn');

  function logSet(text) {
    log.textContent = text;
  }

  function startNewGame() {
    level = 1;
    n = 5;
    startLevel();
    logSet('遊戲開始，關卡 1');
  }

  function startLevel() {
    successPresses = 0;
    revealed.clear();
    bombs.clear();
    gridSize = n * n;
    placeBombs(n);
    renderGrid();
    updateMeta();
    status.textContent = `第 ${level} 關，${n}×${n}，地雷 ${n} 顆`;
    message.innerHTML = `第 ${level} 關開始：請按 <strong>${requiredPressesPerLevel}</strong> 個安全格以過關。`;
  }

  function placeBombs(count) {
    bombs.clear();
    // choose unique indices 0..gridSize-1
    while (bombs.size < count) {
      const idx = Math.floor(Math.random() * gridSize);
      bombs.add(idx);
    }
  }

  function renderGrid() {
    gridEl.innerHTML = '';
    const size = n;
    gridEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    for (let i = 0; i < gridSize; i++) {
      const btn = document.createElement('button');
      btn.className = 'cell';
      btn.dataset.index = i;
      btn.setAttribute('aria-label', `格子 ${i+1}`);
      btn.addEventListener('click', onCellClick);
      gridEl.appendChild(btn);
    }
  }

  function revealAllBombs() {
    document.querySelectorAll('.cell').forEach(cell => {
      const idx = Number(cell.dataset.index);
      if (bombs.has(idx)) {
        cell.classList.add('bomb','revealed');
        cell.textContent = '💣';
      }
    });
  }

  function onCellClick(e) {
    const btn = e.currentTarget;
    const idx = Number(btn.dataset.index);

    // already revealed?
    if (revealed.has(idx)) return;

    revealed.add(idx);

    if (bombs.has(idx)) {
      // bomb hit -> lose
      btn.classList.add('bomb','revealed');
      btn.textContent = '💥';
      gameOver(false, idx);
      return;
    } else {
      // safe
      btn.classList.add('revealed','safe');
      btn.textContent = '✔';
      successPresses++;
      const remaining = Math.max(0, requiredPressesPerLevel - successPresses);
      remainPill.textContent = `剩餘安全按壓: ${remaining}`;
      message.innerHTML = `很好！已按 ${successPresses} / ${requiredPressesPerLevel} 個安全格。`;
      logSet(`第 ${level} 關：按下格子 ${idx+1}（安全）`);
      // win condition for level
      if (successPresses >= requiredPressesPerLevel) {
        // advance or win game
        if (level >= maxLevel) {
          gameOver(true);
        } else {
          // reveal bombs briefly, then next level
          revealBombsTemporary(() => {
            level++;
            n = Math.max(2, n - 1);
            startLevel();
            logSet(`進入第 ${level} 關`);
          });
        }
      }
    }
  }

  function revealBombsTemporary(cb) {
    // show bombs for 800ms
    revealAllBombs();
    status.textContent = '已揭示地雷（短暫），準備進入下一關…';
    setTimeout(() => {
      cb();
    }, 900);
  }

  function gameOver(win, bombIndex=null) {
    if (win) {
      status.textContent = '恭喜！完成全部三關，你贏了 🎉';
      message.innerHTML = `<strong>你贏了！</strong> 按「重新開始」再挑戰一次或分享給朋友。`;
      logSet('玩家通過全部三關（勝利）');
      revealAllBombs();
    } else {
      status.textContent = '爆炸了！你踩到地雷 💥';
      message.innerHTML = `踩到地雷—遊戲失敗。按「重新開始」重試，或「重置本關」重新配置本關地雷。`;
      if (bombIndex !== null) {
        logSet(`踩到地雷（格 ${bombIndex+1}）。遊戲失敗。`);
      } else {
        logSet('遊戲失敗。');
      }
      revealAllBombs();
    }
    remainPill.textContent = `剩餘安全按壓: -`;
  }

  restartBtn.addEventListener('click', () => {
    startNewGame();
  });

  hintBtn.addEventListener('click', () => {
    // reset current level only
    startLevel();
    logSet(`第 ${level} 關已重置`);
  });

  // helper to update UI metadata
  function updateMeta(){
    levelPill.textContent = `關卡: ${level} / ${maxLevel}`;
    nPill.textContent = `n = ${n}`;
    remainPill.textContent = `剩餘安全按壓: ${requiredPressesPerLevel}`;
  }

  // Initialize
  startNewGame();

  // Expose for debugging (devtools)
  window._minesGame = {
    startNewGame, startLevel, placeBombs, bombs, revealed
  };
})();