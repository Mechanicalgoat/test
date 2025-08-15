// メインゲームロジック

// イベントシステム
class GameEventEmitter {
    constructor() {
        this.events = {};
    }
    
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }
    
    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }
    
    off(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    }
}

// ゲーム状態管理
class GameStateManager {
    constructor() {
        this.state = {
            isPlaying: false,
            isPaused: false,
            isGameClear: false,
            isGameOver: false
        };
        this.eventEmitter = new GameEventEmitter();
    }
    
    setState(newState) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...newState };
        this.eventEmitter.emit('stateChange', { oldState, newState: this.state });
    }
    
    getState() {
        return { ...this.state };
    }
    
    on(event, callback) {
        this.eventEmitter.on(event, callback);
    }
    
    off(event, callback) {
        this.eventEmitter.off(event, callback);
    }
}

// ボード操作ユーティリティ
class BoardUtils {
    static createEmptyBoard(width, height) {
        return Array(height).fill().map(() => Array(width).fill(0));
    }
    
    static findCompletedLines(board) {
        const completedLines = [];
        for (let y = 0; y < board.length; y++) {
            if (board[y].every(cell => cell !== 0)) {
                completedLines.push(y);
            }
        }
        return completedLines;
    }
    
    static removeLines(board, lines) {
        if (lines.length === 0) return 0;
        
        // 下から上に向かって削除（インデックスのズレを防ぐため）
        lines.sort((a, b) => b - a);
        
        for (const lineIndex of lines) {
            board.splice(lineIndex, 1);
            board.unshift(Array(board[0].length).fill(0));
        }
        
        return lines.length;
    }
    
    static getMaxHeight(board) {
        for (let y = 0; y < board.length; y++) {
            if (board[y].some(cell => cell !== 0)) {
                return board.length - y;
            }
        }
        return 0;
    }
    
    static hasBlocksInTopRows(board, rowCount = 3) {
        for (let y = 0; y < Math.min(rowCount, board.length); y++) {
            if (board[y].some(cell => cell !== 0)) {
                return true;
            }
        }
        return false;
    }
}

const TETROMINOS = {
    I: { shape: [[1,1,1,1]], color: '#60a5fa' },
    O: { shape: [[1,1],[1,1]], color: '#fbbf24' },
    T: { shape: [[0,1,0],[1,1,1]], color: '#c084fc' },
    S: { shape: [[0,1,1],[1,1,0]], color: '#34d399' },
    Z: { shape: [[1,1,0],[0,1,1]], color: '#f87171' },
    J: { shape: [[1,0,0],[1,1,1]], color: '#38bdf8' },
    L: { shape: [[0,0,1],[1,1,1]], color: '#fb923c' }
};

class ReverseTetris {
    constructor() {
        this.canvas = document.getElementById('game-board');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('next-piece');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        this.gridWidth = 10;
        this.gridHeight = 20;
        this.cellSize = 30;
        
        // モバイル対応：画面サイズに応じてゲームボードサイズを調整
        this.adjustGameBoardSize();
        
        this.board = {
            width: this.gridWidth,
            height: this.gridHeight,
            grid: BoardUtils.createEmptyBoard(this.gridWidth, this.gridHeight)
        };
        
        this.ai = new TetrisAI('normal');
        this.selectedPiece = null;
        
        // ゲーム状態管理を改善
        this.gameStateManager = new GameStateManager();
        this.setupGameStateListeners();
        
        this.initializeScore('normal');
        this.piecesSent = 0;
        this.linesCleared = 0;
        
        this.animationFrame = null;
        this.dropSpeed = 1000; // ミリ秒
        this.lastDropTime = 0;
        this.currentPiece = null;
        this.currentPosition = null;
        
        // 連続送信用の改善
        this.pieceQueue = [];
        this.isProcessingPiece = false;
        this.canSendPiece = true;
        this.sendCooldown = 50; // 最小クールダウン（ミリ秒）
        
        // 難易度別スコアシステム
        this.currentDifficulty = 'normal';
        
        this.init();
    }
    
    init() {
        this.setupPieceSelector();
        this.setupControls();
        this.updateDisplay();
    }
    
    setupGameStateListeners() {
        this.gameStateManager.on('stateChange', ({ oldState, newState }) => {
            console.log('Game state changed:', oldState, '->', newState);
            this.onGameStateChange(oldState, newState);
        });
    }
    
    onGameStateChange(oldState, newState) {
        // ゲーム状態変更時の処理
        if (newState.isGameClear && !oldState.isGameClear) {
            console.log('Game cleared!');
        }
        
        if (newState.isGameOver && !oldState.isGameOver) {
            console.log('Game over!');
        }
        
        // UI更新
        this.updateUIFromState(newState);
    }
    
    updateUIFromState(state) {
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const t = window.currentTranslations || translations.en;
        
        startBtn.disabled = state.isPlaying;
        pauseBtn.disabled = !state.isPlaying;
        
        if (state.isPaused) {
            pauseBtn.textContent = t.resumeGame || 'Resume';
        } else {
            pauseBtn.textContent = t.pauseGame || 'Pause';
        }
    }
    
    setupPieceSelector() {
        const selector = document.getElementById('piece-selector');
        selector.innerHTML = '';
        
        Object.entries(TETROMINOS).forEach(([type, tetromino]) => {
            const btn = document.createElement('button');
            btn.className = 'piece-btn';
            btn.dataset.type = type;
            
            const canvas = document.createElement('canvas');
            canvas.width = 60;
            canvas.height = 60;
            const ctx = canvas.getContext('2d');
            
            // ミノを描画
            this.drawMiniPiece(ctx, tetromino.shape, tetromino.color, 60, 60);
            
            btn.appendChild(canvas);
            btn.addEventListener('click', () => this.selectPiece(type));
            selector.appendChild(btn);
        });
    }
    
    drawMiniPiece(ctx, shape, color, width, height) {
        ctx.clearRect(0, 0, width, height);
        const pieceWidth = shape[0].length;
        const pieceHeight = shape.length;
        const cellSize = Math.min(width / (pieceWidth + 1), height / (pieceHeight + 1));
        const offsetX = (width - pieceWidth * cellSize) / 2;
        const offsetY = (height - pieceHeight * cellSize) / 2;
        
        ctx.fillStyle = color;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    ctx.fillRect(
                        offsetX + x * cellSize,
                        offsetY + y * cellSize,
                        cellSize - 1,
                        cellSize - 1
                    );
                    ctx.strokeRect(
                        offsetX + x * cellSize,
                        offsetY + y * cellSize,
                        cellSize - 1,
                        cellSize - 1
                    );
                }
            }
        }
    }
    
    selectPiece(type) {
        const state = this.gameStateManager.getState();
        if (!state.isPlaying || state.isPaused) return;
        
        // 連続送信対応：キューに追加
        if (this.isProcessingPiece) {
            this.pieceQueue.push(type);
            this.updateQueueDisplay();
            return;
        }
        
        this.processPieceSelection(type);
    }
    
    processPieceSelection(type) {
        if (!this.canSendPiece) return;
        
        this.isProcessingPiece = true;
        this.canSendPiece = false;
        
        // 前の選択をクリア
        document.querySelectorAll('.piece-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // 新しい選択
        const btn = document.querySelector(`[data-type="${type}"]`);
        if (btn) btn.classList.add('selected');
        
        this.selectedPiece = type;
        
        // 次のピースを表示
        const tetromino = TETROMINOS[type];
        this.drawMiniPiece(this.nextCtx, tetromino.shape, tetromino.color, 120, 80);
        
        // 即座にピースを送る
        setTimeout(() => this.sendPiece(), 50);
    }
    
    updateQueueDisplay() {
        // キューの可視化（オプション）
        const queueElement = document.getElementById('piece-queue-indicator');
        if (queueElement) {
            if (this.pieceQueue.length > 0) {
                const t = window.currentTranslations || translations.en;
                queueElement.textContent = `Queue: ${this.pieceQueue.length}`;
                queueElement.classList.add('show');
            } else {
                queueElement.textContent = '';
                queueElement.classList.remove('show');
            }
        }
    }
    
    processNextInQueue() {
        const state = this.gameStateManager.getState();
        if (this.pieceQueue.length > 0 && !this.isProcessingPiece && this.canSendPiece && state.isPlaying) {
            const nextPiece = this.pieceQueue.shift();
            this.updateQueueDisplay();
            this.processPieceSelection(nextPiece);
        }
    }
    
    sendPiece() {
        const state = this.gameStateManager.getState();
        if (!this.selectedPiece || !state.isPlaying || this.currentPiece) return;
        
        const tetromino = TETROMINOS[this.selectedPiece];
        const piece = tetromino.shape.map(row => row.map(cell => cell ? this.selectedPiece : 0));
        
        // AIに最適な配置を計算させる
        const bestMove = this.ai.findBestMove(this.board, piece);
        
        if (bestMove) {
            this.currentPiece = {
                type: this.selectedPiece,
                shape: piece,
                color: tetromino.color,
                targetX: bestMove.x,
                targetRotation: bestMove.rotation,
                targetY: bestMove.y,
                currentX: bestMove.x,
                currentY: 0,
                rotation: 0
            };
            
            this.piecesSent++;
            this.updateScore();
            
            // アニメーション開始
            this.animatePieceDrop();
        }
        
        // 選択をクリア
        this.selectedPiece = null;
        document.querySelectorAll('.piece-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        this.nextCtx.clearRect(0, 0, 120, 80);
        
        // クールダウン設定
        setTimeout(() => {
            this.canSendPiece = true;
            this.processNextInQueue();
        }, this.sendCooldown);
    }
    
    animatePieceDrop() {
        if (!this.currentPiece) return;
        
        const piece = this.currentPiece;
        
        // 回転アニメーション
        if (piece.rotation < piece.targetRotation) {
            piece.shape = this.ai.rotatePiece(TETROMINOS[piece.type].shape.map(row => 
                row.map(cell => cell ? piece.type : 0)), piece.rotation + 1);
            piece.rotation++;
        }
        
        // 落下アニメーション（高速化）
        if (piece.currentY < piece.targetY) {
            // より高速な落下のため、複数ステップ進む
            const remainingSteps = piece.targetY - piece.currentY;
            const dropSpeed = Math.min(remainingSteps, 2); // 最大2ステップずつ
            piece.currentY += dropSpeed;
        } else {
            // 配置完了
            this.placePieceOnBoard();
            return;
        }
        
        // 描画更新
        this.draw();
        
        // 次のフレーム（高速化）
        setTimeout(() => this.animatePieceDrop(), 15);
    }
    
    placePieceOnBoard() {
        if (!this.currentPiece) return;
        
        const piece = this.currentPiece;
        
        // ボードに配置
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const boardY = piece.targetY + y;
                    const boardX = piece.targetX + x;
                    if (boardY >= 0 && boardY < this.gridHeight && 
                        boardX >= 0 && boardX < this.gridWidth) {
                        this.board.grid[boardY][boardX] = piece.type;
                    }
                }
            }
        }
        
        this.currentPiece = null;
        this.isProcessingPiece = false;
        
        // まずミノが配置された状態を描画して表示
        this.updateDisplay();
        this.draw();
        
        // ライン消去を実行
        setTimeout(() => {
            this.clearLinesWithAnimation();
        }, 50);
    }
    
    clearLinesWithAnimation() {
        // 全ての完成ラインを検出
        const completedLines = [];
        for (let y = 0; y < this.gridHeight; y++) {
            let isComplete = true;
            for (let x = 0; x < this.gridWidth; x++) {
                if (this.board.grid[y][x] === 0) {
                    isComplete = false;
                    break;
                }
            }
            if (isComplete) {
                completedLines.push(y);
            }
        }
        
        if (completedLines.length > 0) {
            console.log('Complete lines found at rows:', completedLines);
            // ハイライト表示
            this.highlightCompletedLines(completedLines);
            
            // 少し遅延してから削除
            setTimeout(() => {
                this.removeCompletedLines(completedLines);
                this.updateDisplay();
                this.draw();
                // 次の状態確認
                setTimeout(() => {
                    this.checkGameStateAfterClear();
                }, 50);
            }, 300);
        } else {
            // ライン消去がない場合はすぐに次の処理へ
            this.checkGameStateAfterClear();
        }
    }
    
    findCompletedLines() {
        const completedLines = [];
        for (let y = 0; y < this.gridHeight; y++) {
            let isComplete = true;
            for (let x = 0; x < this.gridWidth; x++) {
                if (this.board.grid[y][x] === 0) {
                    isComplete = false;
                    break;
                }
            }
            if (isComplete) {
                completedLines.push(y);
            }
        }
        console.log('Found completed lines at rows:', completedLines);
        return completedLines;
    }
    
    highlightCompletedLines(lines) {
        // 消えるラインを一時的に白くハイライト
        this.highlightedLines = lines;
        this.draw(); // ハイライトされた状態で描画
        console.log('Highlighting lines:', lines);
    }
    
    removeCompletedLines(lines) {
        if (lines.length === 0) return;
        
        console.log('Removing lines at rows:', lines);
        
        // 下から上に向かって削除（インデックスのズレを防ぐため）
        lines.sort((a, b) => b - a);
        
        for (const lineIndex of lines) {
            // 指定行を削除
            this.board.grid.splice(lineIndex, 1);
            // 上部に新しい空行を追加
            this.board.grid.unshift(Array(this.gridWidth).fill(0));
        }
        
        this.linesCleared += lines.length;
        // ラインクリアによるボーナス
        this.score += lines.length * 10;
        
        console.log('Lines removed successfully. Total lines cleared:', this.linesCleared);
        
        // ハイライトをクリア
        this.highlightedLines = null;
    }
    
    checkGameStateAfterClear() {
        // ゲームクリア判定（リバーステトリスの勝利条件）
        // 上部3行のいずれかにブロックがあるかチェック
        let hasBlocksInTopRows = false;
        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (this.board.grid[y][x] !== 0) {
                    hasBlocksInTopRows = true;
                    break;
                }
            }
            if (hasBlocksInTopRows) break;
        }
        
        if (hasBlocksInTopRows) {
            console.log('Game Clear! Blocks reached top 3 rows');
            this.handleGameClear();
            return;
        }
        
        this.updateDisplay();
        this.draw();
        
        // 次のピースをキューから処理
        setTimeout(() => this.processNextInQueue(), 100);
    }
    
    // 旧いclearLinesメソッドは削除し、新しいアニメーション付きメソッドを使用
    
    checkGameClear() {
        // リバーステトリスの勝利条件：上部3行のいずれかにブロックがある
        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (this.board.grid[y][x] !== 0) {
                    return true;
                }
            }
        }
        return false;
    }
    
    checkGameOver() {
        // 通常のテトリスのゲームオーバー条件（このゲームでは使用しない）
        return false;
    }
    
    handleGameClear() {
        this.gameStateManager.setState({
            isPlaying: false,
            isGameClear: true
        });
        
        // ボーナススコア計算
        const difficultyBonus = {
            'easy': 50,
            'normal': 100,
            'hard': 200
        };
        this.score += difficultyBonus[this.currentDifficulty] || 100;
        
        this.showGameEndMessage(true);
    }
    
    handleGameOver() {
        this.gameStateManager.setState({
            isPlaying: false,
            isGameOver: true
        });
        this.showGameEndMessage(false);
    }
    
    showGameEndMessage(isGameClear) {
        const status = document.getElementById('game-status');
        const t = window.currentTranslations || translations.en;
        
        if (isGameClear) {
            status.innerHTML = `
                <h2>${t.gameOver}</h2>
                <p>${t.gameOverMessage}</p>
                <p>${t.finalScore} ${this.score}</p>
                <p>${t.finalPieces} ${this.piecesSent}</p>
                <p style="margin-top: 10px; color: #60a5fa;">Difficulty: ${this.currentDifficulty.toUpperCase()}</p>
            `;
        } else {
            status.innerHTML = `
                <h2>Game Over</h2>
                <p>Something went wrong...</p>
                <p>${t.finalScore} ${this.score}</p>
                <p>${t.finalPieces} ${this.piecesSent}</p>
            `;
        }
        
        status.classList.add('show');
    }
    
    draw() {
        // キャンバスクリア
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // グリッド線
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 0.5;
        for (let x = 0; x <= this.gridWidth; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.cellSize, 0);
            this.ctx.lineTo(x * this.cellSize, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.gridHeight; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.cellSize);
            this.ctx.lineTo(this.canvas.width, y * this.cellSize);
            this.ctx.stroke();
        }
        
        // ボードのブロック（改良されたビジュアル）
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const cell = this.board.grid[y][x];
                if (cell) {
                    const color = TETROMINOS[cell].color;
                    
                    // グラデーション効果
                    const gradient = this.ctx.createLinearGradient(
                        x * this.cellSize,
                        y * this.cellSize,
                        (x + 1) * this.cellSize,
                        (y + 1) * this.cellSize
                    );
                    gradient.addColorStop(0, color);
                    gradient.addColorStop(1, this.adjustColor(color, -30));
                    
                    this.ctx.fillStyle = gradient;
                    this.ctx.fillRect(
                        x * this.cellSize + 1,
                        y * this.cellSize + 1,
                        this.cellSize - 2,
                        this.cellSize - 2
                    );
                    
                    // ハイライト効果
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    this.ctx.fillRect(
                        x * this.cellSize + 2,
                        y * this.cellSize + 2,
                        this.cellSize - 4,
                        3
                    );
                    
                    // 境界線
                    this.ctx.strokeStyle = this.adjustColor(color, -40);
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(
                        x * this.cellSize + 1,
                        y * this.cellSize + 1,
                        this.cellSize - 2,
                        this.cellSize - 2
                    );
                }
            }
        }
        
        // ハイライトされたラインを描画（消去アニメーション用）
        if (this.highlightedLines && this.highlightedLines.length > 0) {
            for (const lineY of this.highlightedLines) {
                // 白く光るエフェクト
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                this.ctx.fillRect(
                    0,
                    lineY * this.cellSize,
                    this.canvas.width,
                    this.cellSize
                );
                
                // ラインを再描画（半透明）
                for (let x = 0; x < this.gridWidth; x++) {
                    const cell = this.board.grid[lineY][x];
                    if (cell) {
                        const color = TETROMINOS[cell].color;
                        this.ctx.fillStyle = color + '80'; // 半透明
                        this.ctx.fillRect(
                            x * this.cellSize + 1,
                            lineY * this.cellSize + 1,
                            this.cellSize - 2,
                            this.cellSize - 2
                        );
                    }
                }
            }
        }
        
        // 落下中のピース（改良されたビジュアル）
        if (this.currentPiece) {
            const piece = this.currentPiece;
            this.ctx.globalAlpha = 0.9;
            
            for (let y = 0; y < piece.shape.length; y++) {
                for (let x = 0; x < piece.shape[y].length; x++) {
                    if (piece.shape[y][x]) {
                        // グラデーション効果を追加
                        const gradient = this.ctx.createLinearGradient(
                            (piece.currentX + x) * this.cellSize,
                            (piece.currentY + y) * this.cellSize,
                            (piece.currentX + x + 1) * this.cellSize,
                            (piece.currentY + y + 1) * this.cellSize
                        );
                        gradient.addColorStop(0, piece.color);
                        gradient.addColorStop(1, this.adjustColor(piece.color, -20));
                        
                        this.ctx.fillStyle = gradient;
                        this.ctx.fillRect(
                            (piece.currentX + x) * this.cellSize + 1,
                            (piece.currentY + y) * this.cellSize + 1,
                            this.cellSize - 2,
                            this.cellSize - 2
                        );
                        
                        // ハイライト効果
                        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                        this.ctx.fillRect(
                            (piece.currentX + x) * this.cellSize + 2,
                            (piece.currentY + y) * this.cellSize + 2,
                            this.cellSize - 4,
                            4
                        );
                        
                        // 境界線
                        this.ctx.strokeStyle = this.adjustColor(piece.color, -30);
                        this.ctx.lineWidth = 1;
                        this.ctx.strokeRect(
                            (piece.currentX + x) * this.cellSize + 1,
                            (piece.currentY + y) * this.cellSize + 1,
                            this.cellSize - 2,
                            this.cellSize - 2
                        );
                    }
                }
            }
            
            this.ctx.globalAlpha = 1;
        }
    }
    
    updateDisplay() {
        // スコア表示（プラス/マイナス記号付き）
        const scoreText = this.score >= 0 ? `+${this.score}` : `${this.score}`;
        document.getElementById('score').textContent = scoreText;
        
        document.getElementById('pieces-sent').textContent = this.piecesSent;
        document.getElementById('lines-cleared').textContent = this.linesCleared;
        
        // 最大高さを計算
        const maxHeight = this.getMaxHeight();
        document.getElementById('max-height').textContent = maxHeight;
    }
    
    // 色を明度調整するユーティリティ関数
    adjustColor(color, percent) {
        const num = parseInt(color.replace("#",""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255))
            .toString(16).slice(1);
    }
    
    setupControls() {
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const resetBtn = document.getElementById('reset-btn');
        const difficultySelect = document.getElementById('difficulty');
        
        startBtn.addEventListener('click', () => this.start());
        pauseBtn.addEventListener('click', () => this.togglePause());
        resetBtn.addEventListener('click', () => this.reset());
        
        difficultySelect.addEventListener('change', (e) => {
            this.ai = new TetrisAI(e.target.value);
            this.currentDifficulty = e.target.value;
            const state = this.gameStateManager.getState();
            if (!state.isPlaying) {
                this.initializeScore(e.target.value);
                this.updateDisplay();
            }
        });
    }
    
    start() {
        const state = this.gameStateManager.getState();
        if (state.isPlaying) return;
        
        this.gameStateManager.setState({
            isPlaying: true,
            isPaused: false,
            isGameClear: false,
            isGameOver: false
        });
        
        document.getElementById('game-status').classList.remove('show');
        
        this.draw();
    }
    
    togglePause() {
        const state = this.gameStateManager.getState();
        if (!state.isPlaying) return;
        
        this.gameStateManager.setState({
            isPaused: !state.isPaused
        });
    }
    
    reset() {
        this.gameStateManager.setState({
            isPlaying: false,
            isPaused: false,
            isGameClear: false,
            isGameOver: false
        });
        
        this.initializeScore(this.currentDifficulty);
        this.piecesSent = 0;
        this.linesCleared = 0;
        this.currentPiece = null;
        this.selectedPiece = null;
        
        // キューもリセット
        this.pieceQueue = [];
        this.isProcessingPiece = false;
        this.canSendPiece = true;
        this.updateQueueDisplay();
        
        // ボードをクリア
        this.board.grid = BoardUtils.createEmptyBoard(this.gridWidth, this.gridHeight);
        
        document.getElementById('game-status').classList.remove('show');
        
        document.querySelectorAll('.piece-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        this.nextCtx.clearRect(0, 0, 120, 80);
        
        this.updateDisplay();
        this.draw();
    }
    
    // 難易度別スコアシステムの初期化
    initializeScore(difficulty) {
        // 各難易度の理論最短ゲームオーバーピース数（推定）
        const theoreticalMinPieces = {
            'easy': 30,    // 弱いAIなので早く積める
            'normal': 40,  // 普通のAI
            'hard': 50     // 強いAIなので時間がかかる
        };
        
        // 理論最短スコアを設定（1ピース10点として逆算）
        this.score = theoreticalMinPieces[difficulty] * 10;
        this.theoreticalMax = this.score;
    }
    
    // スコア更新（ピース送信時）
    updateScore() {
        // 基本的に10点ずつ減少
        this.score -= 10;
        
        // ボーナス要素（後で調整可能）
        const heightBonus = Math.max(0, this.getMaxHeight() - 10) * 2; // 高さボーナス
        this.score += heightBonus;
    }
    
    getMaxHeight() {
        return BoardUtils.getMaxHeight(this.board.grid);
    }
    
    // モバイル対応のゲームボードサイズ調整
    adjustGameBoardSize() {
        const isMobile = window.innerWidth <= 768;
        const isSmallMobile = window.innerWidth <= 480;
        
        if (isSmallMobile) {
            this.canvas.width = 250;
            this.canvas.height = 500;
            this.cellSize = 25;
        } else if (isMobile) {
            this.canvas.width = 280;
            this.canvas.height = 560;
            this.cellSize = 28;
        } else {
            this.canvas.width = 300;
            this.canvas.height = 600;
            this.cellSize = 30;
        }
    }
}

// ゲーム開始
document.addEventListener('DOMContentLoaded', () => {
    // 言語管理システムを先に初期化
    setTimeout(() => {
        const game = new ReverseTetris();
        window.gameInstance = game; // グローバルアクセス用
        
        // 画面サイズ変更時の対応
        window.addEventListener('resize', () => {
            game.adjustGameBoardSize();
            game.draw();
        });
        
        // 画面の向き変更時の対応
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                game.adjustGameBoardSize();
                game.draw();
            }, 100);
        });
    }, 100);
});