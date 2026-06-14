"use strict";

// ── STATE ──
let gameBoard    = Array(9).fill('');
let turn         = 0;
let winner       = false;
let gameActive   = false;
let aiMode       = false;
let aiDifficulty = 'easy';
let playerX      = { name: 'Player 1' };
let playerO      = { name: 'Player 2' };
let scores       = { X: 0, O: 0, tie: 0 };

const WINNING = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

// ── DOM REFS ──
const setupScreen = document.getElementById('setupScreen');
const gameScreen  = document.getElementById('gameScreen');
const diffRow     = document.getElementById('diffRow');
const p1Input     = document.getElementById('p1name');
const p2Input     = document.getElementById('p2name');
const p2field     = document.getElementById('p2field');
const startBtn    = document.getElementById('startBtn');
const boardGrid   = document.getElementById('boardGrid');
const statusTurn  = document.getElementById('statusTurn');
const aiThinking  = document.getElementById('aiThinking');
const nameX       = document.getElementById('nameX');
const nameO       = document.getElementById('nameO');
const numX        = document.getElementById('numX');
const numO        = document.getElementById('numO');
const numTie      = document.getElementById('numTie');
const scoreX      = document.getElementById('scoreX');
const scoreO      = document.getElementById('scoreO');
const resetBtn    = document.getElementById('resetBtn');
const menuBtn     = document.getElementById('menuBtn');

// ── INIT ──
window.addEventListener('load', () => {
  p1Input.focus();

  // Mode toggle (2P / AI)
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      aiMode = btn.dataset.mode === 'ai';
      diffRow.classList.toggle('visible', aiMode);
      p2field.style.display = aiMode ? 'none' : '';
    });
  });

  // Difficulty buttons
  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      aiDifficulty = btn.dataset.diff;
    });
  });

  startBtn.addEventListener('click', startGame);
  resetBtn.addEventListener('click', resetRound);
  menuBtn.addEventListener('click', goToMenu);
});

// ──────────────────────────────────────────────
//  GAME FLOW
// ──────────────────────────────────────────────

function startGame() {
  const n1 = p1Input.value.trim();
  const n2 = p2Input.value.trim();

  if (!n1) {
    p1Input.focus();
    p1Input.style.borderColor = '#ff4081';
    return;
  }
  p1Input.style.borderColor = '';

  if (!aiMode && !n2) {
    p2Input.focus();
    p2Input.style.borderColor = '#ff4081';
    return;
  }
  p2Input.style.borderColor = '';

  playerX.name = n1 || 'Player 1';
  playerO.name = aiMode ? 'AI' : (n2 || 'Player 2');

  scores = { X: 0, O: 0, tie: 0 };
  nameX.textContent = playerX.name;
  nameO.textContent = playerO.name;
  updateScoreDisplay();

  setupScreen.classList.add('hide');
  gameScreen.classList.remove('hide');

  buildBoard();
}

function buildBoard() {
  gameBoard  = Array(9).fill('');
  turn       = 0;
  winner     = false;
  gameActive = true;

  boardGrid.innerHTML = '';

  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.className    = 'board__cell';
    cell.dataset.id   = i;

    // Ghost preview symbol
    const ghost = document.createElement('span');
    ghost.className   = 'ghost ghost-x';
    ghost.textContent = 'X';
    cell.appendChild(ghost);

    // Active symbol
    const sym = document.createElement('span');
    sym.className = 'cell-symbol';
    cell.appendChild(sym);

    cell.addEventListener('click', onCellClick);
    boardGrid.appendChild(cell);
  }

  updateStatus();
  updateActiveScore();
}

function resetRound() {
  buildBoard();
}

function goToMenu() {
  gameScreen.classList.add('hide');
  setupScreen.classList.remove('hide');
}

// ──────────────────────────────────────────────
//  MOVE HANDLING
// ──────────────────────────────────────────────

function onCellClick(e) {
  if (!gameActive) return;
  if (aiMode && turn % 2 === 1) return; // block human clicks during AI turn
  const idx = parseInt(e.currentTarget.dataset.id);
  makeMove(idx);
}

function makeMove(idx) {
  if (gameBoard[idx] !== '' || !gameActive) return;

  const mark = turn % 2 === 0 ? 'X' : 'O';
  gameBoard[idx] = mark;

  // Render symbol
  const cell = boardGrid.children[idx];
  const sym  = cell.querySelector('.cell-symbol');
  sym.textContent = mark;
  sym.className   = `cell-symbol sym-${mark.toLowerCase()} animate`;
  cell.classList.add('taken');

  // Update ghost for next player
  const nextMark = mark === 'X' ? 'O' : 'X';
  updateGhosts(nextMark);

  // Check win
  const winResult = checkWinner();
  if (winResult) {
    endGame(winResult);
    return;
  }

  turn++;

  // Check tie
  if (turn === 9) {
    endGame('tie');
    return;
  }

  updateStatus();
  updateActiveScore();

  // Trigger AI if needed
  if (aiMode && turn % 2 === 1) {
    gameActive = false;
    aiThinking.classList.add('visible');

    const delay = aiDifficulty === 'easy' ? 400 : aiDifficulty === 'hard' ? 600 : 500;
    setTimeout(() => {
      aiThinking.classList.remove('visible');
      const aiIdx = getAIMove();
      gameActive  = true;
      makeMove(aiIdx);
    }, delay);
  }
}

function updateGhosts(nextMark) {
  document.querySelectorAll('.board__cell:not(.taken) .ghost').forEach(g => {
    g.className   = `ghost ghost-${nextMark.toLowerCase()}`;
    g.textContent = nextMark;
  });
}

// ──────────────────────────────────────────────
//  WIN / END LOGIC
// ──────────────────────────────────────────────

function checkWinner() {
  for (const [a, b, c] of WINNING) {
    if (gameBoard[a] && gameBoard[a] === gameBoard[b] && gameBoard[a] === gameBoard[c]) {
      return { mark: gameBoard[a], combo: [a, b, c] };
    }
  }
  return null;
}

function endGame(result) {
  gameActive = false;

  if (result === 'tie') {
    scores.tie++;
    statusTurn.innerHTML = `<span class="status-win tie">⚡ DRAW!</span>`;
  } else {
    const { mark, combo } = result;
    scores[mark]++;
    combo.forEach(i => boardGrid.children[i].classList.add('board__cell--winner'));
    const winnerName = mark === 'X' ? playerX.name : playerO.name;
    statusTurn.innerHTML = `<span class="status-win win-${mark.toLowerCase()}">🏆 ${winnerName} wins!</span>`;
  }

  updateScoreDisplay();
}

// ──────────────────────────────────────────────
//  UI HELPERS
// ──────────────────────────────────────────────

function updateStatus() {
  const mark = turn % 2 === 0 ? 'X' : 'O';
  const name = mark === 'X' ? playerX.name : playerO.name;
  statusTurn.innerHTML = `<span class="hl-${mark.toLowerCase()}">${name}</span>'s turn`;
}

function updateActiveScore() {
  const mark = turn % 2 === 0 ? 'X' : 'O';
  scoreX.classList.toggle('active-x', mark === 'X');
  scoreO.classList.toggle('active-o', mark === 'O');
}

function updateScoreDisplay() {
  numX.textContent   = scores.X;
  numO.textContent   = scores.O;
  numTie.textContent = scores.tie;
}

// ──────────────────────────────────────────────
//  AI ENGINE
// ──────────────────────────────────────────────

function getAIMove() {
  const empty = gameBoard.map((v, i) => v === '' ? i : -1).filter(i => i >= 0);

  if (aiDifficulty === 'easy')        return easyMove(empty);
  if (aiDifficulty === 'hard')        return hardMove(empty);
  /* unbeatable */                    return minimax(gameBoard, 'O').index;
}

/* EASY — mostly random, 25% chance to block */
function easyMove(empty) {
  if (Math.random() < 0.25) {
    const block = findThreat('X');
    if (block !== -1) return block;
  }
  return empty[Math.floor(Math.random() * empty.length)];
}

/* HARD — wins/blocks if possible, then strategic */
function hardMove(empty) {
  const win   = findThreat('O');
  if (win   !== -1) return win;
  const block = findThreat('X');
  if (block !== -1) return block;
  if (gameBoard[4] === '') return 4;
  const corners = [0, 2, 6, 8].filter(i => gameBoard[i] === '');
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  return empty[Math.floor(Math.random() * empty.length)];
}

/* Finds an immediate win or block opportunity for `mark` */
function findThreat(mark) {
  for (const [a, b, c] of WINNING) {
    const line  = [gameBoard[a], gameBoard[b], gameBoard[c]];
    const cells = [a, b, c];
    if (line.filter(v => v === mark).length === 2 && line.includes('')) {
      return cells[line.indexOf('')];
    }
  }
  return -1;
}

/* UNBEATABLE — Minimax algorithm */
function minimax(board, currentMark) {
  const empty = board.map((v, i) => v === '' ? i : -1).filter(i => i >= 0);

  // Terminal: check for winner
  for (const [a, b, c] of WINNING) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { score: board[a] === 'O' ? 10 : -10 };
    }
  }
  // Terminal: draw
  if (empty.length === 0) return { score: 0 };

  const moves = [];
  for (const idx of empty) {
    const newBoard  = [...board];
    newBoard[idx]   = currentMark;
    const result    = minimax(newBoard, currentMark === 'O' ? 'X' : 'O');
    moves.push({ index: idx, score: result.score });
  }

  // AI maximises, human minimises
  if (currentMark === 'O') {
    return moves.reduce((best, m) => m.score > best.score ? m : best);
  } else {
    return moves.reduce((best, m) => m.score < best.score ? m : best);
  }
}
