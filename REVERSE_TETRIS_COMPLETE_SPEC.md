# リバーステトリス - 完全実装仕様書

## 目次
1. [ゲーム概要](#1-ゲーム概要)
2. [開発環境セットアップ](#2-開発環境セットアップ)
3. [HTML構造設計](#3-html構造設計)
4. [CSS設計仕様](#4-css設計仕様)
5. [JavaScript実装手順](#5-javascript実装手順)
6. [完全なコード実装](#6-完全なコード実装)
7. [テスト・デバッグ手順](#7-テストデバッグ手順)
8. [デプロイメント](#8-デプロイメント)

---

## 1. ゲーム概要

### 1.1 コンセプト
リバーステトリスは、従来のテトリスを逆転させた革新的なパズルゲームです。プレイヤーはテトリミノ（ミノ）を操作するのではなく、AIプレイヤーに送り込むミノを選択し、AIを困らせて画面上部まで積み上げさせることが目的です。

### 1.2 基本ルール
- プレイヤーは7種類のテトリミノから選んでAIに送信
- AIは受け取ったミノを最適に配置しようとする
- 完成したラインは即座に消去される
- ミノが画面上部3行以内に到達したらプレイヤーの勝利

### 1.3 ゲーム要素
- **ボード**: 10×20のグリッド
- **テトリミノ**: 7種類（I、O、T、S、Z、J、L）
- **AI**: 3つの難易度レベル
- **スコアシステム**: ピース送信とライン消去によるポイント制
- **アニメーション**: 落下、ライン消去、ゲームクリア

---

## 2. 開発環境セットアップ

### 2.1 必要な技術
- **HTML5**: 構造とCanvasAPI
- **CSS3**: スタイリングとアニメーション
- **JavaScript (ES6+)**: ゲームロジックと制御
- **Canvas API**: ゲーム描画

### 2.2 ファイル構成
```
reverse-tetris/
├── index.html          # メインHTMLファイル
├── styles.css          # CSSスタイル
├── game-engine.js      # ゲーム制御エンジン
├── ai-engine.js        # AI制御エンジン
├── main.js            # アプリケーション初期化
└── README.md          # プロジェクト説明
```

### 2.3 開発ツール
- **エディタ**: VS Code推奨
- **ブラウザ**: Chrome/Firefox（開発者ツール使用）
- **ローカルサーバー**: Python HTTP Server / Live Server
- **バージョン管理**: Git

---

## 3. HTML構造設計

### 3.1 基本構造
```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reverse Tetris - 完全版</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>🎮 Reverse Tetris</h1>
            <p class="subtitle">AIを積み上げろ！</p>
        </header>

        <div class="game-layout">
            <!-- 左パネル: スコアと統計 -->
            <aside class="left-panel">
                <div class="score-board">
                    <h2>スコア</h2>
                    <div class="score" id="score">0</div>
                </div>
                
                <div class="stats">
                    <div class="stat-item">
                        <span class="stat-label">送ったミノ:</span>
                        <span class="stat-value" id="pieces-sent">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">消去ライン:</span>
                        <span class="stat-value" id="lines-cleared">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">最大高さ:</span>
                        <span class="stat-value" id="max-height">0</span>
                    </div>
                </div>

                <div class="difficulty-selector">
                    <h3>難易度</h3>
                    <select id="difficulty">
                        <option value="easy">かんたん</option>
                        <option value="normal" selected>ふつう</option>
                        <option value="hard">むずかしい</option>
                    </select>
                </div>
            </aside>

            <!-- 中央: ゲームボード -->
            <main class="center-panel">
                <canvas id="game-board" width="300" height="600"></canvas>
                <div id="game-message" class="game-message hidden"></div>
            </main>

            <!-- 右パネル: ミノ選択 -->
            <aside class="right-panel">
                <div class="piece-selector-container">
                    <h3>ミノを選択</h3>
                    <div class="piece-selector" id="piece-selector"></div>
                </div>

                <div class="next-piece-display">
                    <h3>次のミノ</h3>
                    <canvas id="next-piece" width="120" height="80"></canvas>
                </div>

                <div class="controls">
                    <button id="start-btn" class="btn btn-primary">ゲーム開始</button>
                    <button id="pause-btn" class="btn btn-secondary" disabled>一時停止</button>
                    <button id="reset-btn" class="btn btn-danger">リセット</button>
                </div>

                <div class="queue-indicator" id="queue-indicator">
                    キュー: <span id="queue-count">0</span>
                </div>
            </aside>
        </div>
    </div>

    <script src="game-engine.js"></script>
    <script src="ai-engine.js"></script>
    <script src="main.js"></script>
</body>
</html>
```

### 3.2 HTML要素の役割

#### 3.2.1 コンテナ構造
- `container`: 全体をラップする最上位要素
- `game-layout`: 3パネルレイアウトのフレックスコンテナ
- `left-panel`, `center-panel`, `right-panel`: 機能別パネル

#### 3.2.2 ゲーム表示要素
- `game-board`: メインゲーム描画用Canvas（300×600px）
- `next-piece`: 次のピース表示用Canvas（120×80px）
- `game-message`: ゲーム状態メッセージ表示エリア

#### 3.2.3 UI制御要素
- `piece-selector`: ピース選択ボタンの動的生成エリア
- `difficulty`: AI難易度選択セレクトボックス
- `start-btn`, `pause-btn`, `reset-btn`: ゲーム制御ボタン

#### 3.2.4 情報表示要素
- `score`: 現在のスコア表示
- `pieces-sent`: 送信したピース数
- `lines-cleared`: 消去したライン数
- `max-height`: 現在の最大高さ
- `queue-count`: 待機中のピース数

---

## 4. CSS設計仕様

### 4.1 基本スタイル設計

```css
/* 基本設定とリセット */
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: 'Arial', sans-serif;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    color: #ffffff;
    min-height: 100vh;
    overflow-x: auto;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

/* ヘッダー */
header {
    text-align: center;
    margin-bottom: 30px;
}

header h1 {
    font-size: 2.5rem;
    margin-bottom: 10px;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.subtitle {
    font-size: 1.2rem;
    color: #b0b0b0;
}
```

### 4.2 レイアウト設計

```css
/* メインレイアウト */
.game-layout {
    display: flex;
    gap: 30px;
    justify-content: center;
    align-items: flex-start;
    flex-wrap: wrap;
}

.left-panel,
.right-panel {
    width: 250px;
    min-width: 200px;
}

.center-panel {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
    .game-layout {
        flex-direction: column;
        align-items: center;
    }
    
    .left-panel,
    .right-panel {
        width: 100%;
        max-width: 400px;
    }
}
```

### 4.3 ゲームボード

```css
/* ゲームボード */
#game-board {
    border: 3px solid #4a90e2;
    border-radius: 8px;
    background: #000;
    box-shadow: 0 0 20px rgba(74, 144, 226, 0.3);
}

.game-message {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9);
    padding: 30px;
    border-radius: 15px;
    text-align: center;
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.8);
    z-index: 10;
}

.game-message.hidden {
    display: none;
}

.game-message h2 {
    font-size: 2rem;
    margin-bottom: 15px;
    color: #4a90e2;
}
```

### 4.4 UI要素

```css
/* スコアボード */
.score-board {
    background: rgba(255, 255, 255, 0.1);
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 20px;
    backdrop-filter: blur(10px);
}

.score-board h2 {
    text-align: center;
    margin-bottom: 10px;
    color: #4a90e2;
}

.score {
    font-size: 2rem;
    font-weight: bold;
    text-align: center;
    color: #ffeb3b;
}

/* 統計情報 */
.stats {
    background: rgba(255, 255, 255, 0.1);
    padding: 15px;
    border-radius: 10px;
    margin-bottom: 20px;
}

.stat-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
}

.stat-label {
    color: #b0b0b0;
}

.stat-value {
    font-weight: bold;
    color: #ffffff;
}

/* ピース選択 */
.piece-selector-container {
    background: rgba(255, 255, 255, 0.1);
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 20px;
}

.piece-selector {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-top: 15px;
}

.piece-btn {
    width: 50px;
    height: 50px;
    border: 2px solid #4a90e2;
    background: rgba(74, 144, 226, 0.2);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.piece-btn:hover {
    background: rgba(74, 144, 226, 0.4);
    transform: scale(1.05);
}

.piece-btn.selected {
    background: rgba(255, 235, 59, 0.6);
    border-color: #ffeb3b;
    transform: scale(1.1);
}

/* ボタン */
.btn {
    padding: 12px 24px;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
    margin: 5px;
}

.btn-primary {
    background: #4a90e2;
    color: white;
}

.btn-primary:hover:not(:disabled) {
    background: #357abd;
}

.btn-secondary {
    background: #6c757d;
    color: white;
}

.btn-secondary:hover:not(:disabled) {
    background: #545b62;
}

.btn-danger {
    background: #dc3545;
    color: white;
}

.btn-danger:hover:not(:disabled) {
    background: #c82333;
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* 次のピース表示 */
.next-piece-display {
    background: rgba(255, 255, 255, 0.1);
    padding: 15px;
    border-radius: 10px;
    margin-bottom: 20px;
    text-align: center;
}

#next-piece {
    border: 1px solid #4a90e2;
    border-radius: 4px;
    background: #000;
    margin-top: 10px;
}

/* 難易度選択 */
.difficulty-selector {
    background: rgba(255, 255, 255, 0.1);
    padding: 15px;
    border-radius: 10px;
    margin-bottom: 20px;
}

.difficulty-selector h3 {
    margin-bottom: 10px;
    color: #4a90e2;
}

.difficulty-selector select {
    width: 100%;
    padding: 8px;
    border: 1px solid #4a90e2;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.5);
    color: white;
    font-size: 1rem;
}

/* キューインジケーター */
.queue-indicator {
    background: rgba(255, 255, 255, 0.1);
    padding: 10px;
    border-radius: 10px;
    text-align: center;
    font-size: 0.9rem;
}

#queue-count {
    font-weight: bold;
    color: #ffeb3b;
}
```

### 4.5 アニメーション

```css
/* アニメーション */
@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
}

.pulse {
    animation: pulse 0.3s ease-in-out;
}

.fade-in {
    animation: fadeIn 0.5s ease-out;
}

.slide-in {
    animation: slideIn 0.3s ease-out;
}
```

---

## 5. JavaScript実装手順

### 5.1 段階的実装プラン

#### フェーズ1: 基本構造とデータ設計
1. テトリミノ定義とゲーム定数
2. ゲーム状態管理クラス
3. ボード管理システム

#### フェーズ2: 描画エンジン
1. Canvas初期化と基本描画
2. グリッド描画
3. テトリミノ描画

#### フェーズ3: ゲームロジック
1. ピース配置システム
2. ライン消去処理
3. ゲーム状態チェック

#### フェーズ4: AIエンジン
1. AI評価関数
2. 配置アルゴリズム
3. 難易度調整

#### フェーズ5: UI統合
1. イベントハンドリング
2. アニメーション
3. ユーザーインターフェース

### 5.2 実装手順詳細

#### ステップ1: 基本定数とテトリミノ定義

```javascript
// テトリミノ定義
const TETROMINOS = {
    I: { 
        shape: [[1,1,1,1]], 
        color: '#60a5fa',
        name: 'I'
    },
    O: { 
        shape: [[1,1],[1,1]], 
        color: '#fbbf24',
        name: 'O'
    },
    T: { 
        shape: [[0,1,0],[1,1,1]], 
        color: '#c084fc',
        name: 'T'
    },
    S: { 
        shape: [[0,1,1],[1,1,0]], 
        color: '#34d399',
        name: 'S'
    },
    Z: { 
        shape: [[1,1,0],[0,1,1]], 
        color: '#f87171',
        name: 'Z'
    },
    J: { 
        shape: [[1,0,0],[1,1,1]], 
        color: '#38bdf8',
        name: 'J'
    },
    L: { 
        shape: [[0,0,1],[1,1,1]], 
        color: '#fb923c',
        name: 'L'
    }
};

// ゲーム定数
const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const CELL_SIZE = 30;
const DROP_SPEED = 20;
const LINE_CLEAR_DELAY = 400;
const HIGHLIGHT_DURATION = 300;
```

#### ステップ2: ゲームエンジンクラスの骨格

```javascript
class GameEngine {
    constructor() {
        // Canvas要素の取得
        this.canvas = document.getElementById('game-board');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('next-piece');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        // ゲーム状態
        this.state = {
            isPlaying: false,
            isPaused: false,
            isGameClear: false,
            isProcessing: false
        };
        
        // ゲームデータ
        this.grid = this.createEmptyGrid();
        this.score = 400;
        this.piecesSent = 0;
        this.linesCleared = 0;
        this.currentPiece = null;
        this.selectedPiece = null;
        this.highlightedLines = [];
        
        // キュー管理
        this.pieceQueue = [];
        this.maxQueueSize = 5;
        
        // 難易度
        this.difficulty = 'normal';
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.draw();
        console.log('GameEngine initialized');
    }
    
    // 以下、各メソッドを段階的に実装
}
```

#### ステップ3: Canvas描画システム

```javascript
// Canvas設定メソッド
setupCanvas() {
    this.canvas.width = GRID_WIDTH * CELL_SIZE;
    this.canvas.height = GRID_HEIGHT * CELL_SIZE;
    this.ctx.imageSmoothingEnabled = false;
}

// メイン描画メソッド
draw() {
    // 背景クリア
    this.ctx.fillStyle = '#111';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // グリッド線描画
    this.drawGrid();
    
    // ボード上のブロック描画
    this.drawBlocks();
    
    // ハイライトされたライン描画
    this.drawHighlightedLines();
    
    // 落下中のピース描画
    this.drawCurrentPiece();
}

// グリッド線描画
drawGrid() {
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 0.5;
    
    // 縦線
    for (let x = 0; x <= GRID_WIDTH; x++) {
        this.ctx.beginPath();
        this.ctx.moveTo(x * CELL_SIZE, 0);
        this.ctx.lineTo(x * CELL_SIZE, this.canvas.height);
        this.ctx.stroke();
    }
    
    // 横線
    for (let y = 0; y <= GRID_HEIGHT; y++) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y * CELL_SIZE);
        this.ctx.lineTo(this.canvas.width, y * CELL_SIZE);
        this.ctx.stroke();
    }
}
```

---

## 6. 完全なコード実装

この章では、各ファイルの完全なコードを提供します。

### 6.1 game-engine.js（完全版）

[前回修正済みのコードをベースに、コメントと詳細説明を追加した完全版を記載]

### 6.2 ai-engine.js（完全版）

```javascript
/**
 * AIエンジン - リバーステトリス
 * テトリミノの最適配置を計算するAIシステム
 */

class AIEngine {
    constructor() {
        // AI評価パラメータ（難易度別）
        this.parameters = {
            easy: {
                heightWeight: -0.3,
                linesWeight: 0.5,
                holesWeight: -0.5,
                bumpinessWeight: -0.2,
                randomness: 0.3
            },
            normal: {
                heightWeight: -0.5,
                linesWeight: 1.0,
                holesWeight: -1.0,
                bumpinessWeight: -0.3,
                randomness: 0.1
            },
            hard: {
                heightWeight: -0.8,
                linesWeight: 1.5,
                holesWeight: -2.0,
                bumpinessWeight: -0.5,
                randomness: 0.0
            }
        };
    }
    
    /**
     * 最適な配置を見つける
     * @param {Array} grid - 現在のゲームボード
     * @param {Array} shape - テトリミノの形状
     * @param {string} difficulty - 難易度
     * @returns {Object} 最適配置情報
     */
    findBestPlacement(grid, shape, difficulty = 'normal') {
        const params = this.parameters[difficulty];
        let bestPlacement = null;
        let bestScore = -Infinity;
        
        // 全ての可能な配置を評価
        const rotations = this.getAllRotations(shape);
        
        for (let rotation = 0; rotation < rotations.length; rotation++) {
            const rotatedShape = rotations[rotation];
            
            for (let x = 0; x <= GRID_WIDTH - rotatedShape[0].length; x++) {
                const y = this.findDropPosition(grid, rotatedShape, x);
                
                if (y >= 0) {
                    // 仮配置してボードを評価
                    const testGrid = this.simulatePlacement(grid, rotatedShape, x, y);
                    const score = this.evaluateBoard(testGrid, params);
                    
                    if (score > bestScore) {
                        bestScore = score;
                        bestPlacement = {
                            x: x,
                            y: y,
                            rotation: rotation,
                            shape: rotatedShape,
                            score: score
                        };
                    }
                }
            }
        }
        
        // ランダム性を追加（難易度による調整）
        if (params.randomness > 0 && Math.random() < params.randomness) {
            return this.getRandomPlacement(grid, shape);
        }
        
        return bestPlacement;
    }
    
    /**
     * テトリミノの全回転状態を取得
     * @param {Array} shape - 基本形状
     * @returns {Array} 回転状態の配列
     */
    getAllRotations(shape) {
        const rotations = [shape];
        let current = shape;
        
        for (let i = 0; i < 3; i++) {
            current = this.rotateShape(current);
            // 重複チェック
            if (!this.shapeEquals(current, rotations[0])) {
                rotations.push(current);
            } else {
                break;
            }
        }
        
        return rotations;
    }
    
    /**
     * 形状を90度回転
     * @param {Array} shape - 回転する形状
     * @returns {Array} 回転後の形状
     */
    rotateShape(shape) {
        const rows = shape.length;
        const cols = shape[0].length;
        const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                rotated[j][rows - 1 - i] = shape[i][j];
            }
        }
        
        return rotated;
    }
    
    /**
     * 形状の等価性チェック
     * @param {Array} shape1 - 形状1
     * @param {Array} shape2 - 形状2
     * @returns {boolean} 等しいかどうか
     */
    shapeEquals(shape1, shape2) {
        if (shape1.length !== shape2.length) return false;
        
        for (let i = 0; i < shape1.length; i++) {
            if (shape1[i].length !== shape2[i].length) return false;
            for (let j = 0; j < shape1[i].length; j++) {
                if (shape1[i][j] !== shape2[i][j]) return false;
            }
        }
        
        return true;
    }
    
    /**
     * 落下位置を計算
     * @param {Array} grid - ゲームボード
     * @param {Array} shape - テトリミノ形状
     * @param {number} x - X座標
     * @returns {number} Y座標
     */
    findDropPosition(grid, shape, x) {
        for (let y = 0; y <= GRID_HEIGHT - shape.length; y++) {
            if (!this.canPlacePiece(grid, shape, x, y)) {
                return Math.max(0, y - 1);
            }
        }
        return GRID_HEIGHT - shape.length;
    }
    
    /**
     * ピース配置可能性チェック
     * @param {Array} grid - ゲームボード
     * @param {Array} shape - テトリミノ形状
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @returns {boolean} 配置可能かどうか
     */
    canPlacePiece(grid, shape, x, y) {
        for (let dy = 0; dy < shape.length; dy++) {
            for (let dx = 0; dx < shape[dy].length; dx++) {
                if (shape[dy][dx]) {
                    const boardX = x + dx;
                    const boardY = y + dy;
                    
                    if (boardX < 0 || boardX >= GRID_WIDTH || boardY >= GRID_HEIGHT) {
                        return false;
                    }
                    
                    if (boardY >= 0 && grid[boardY][boardX]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    /**
     * 配置シミュレーション
     * @param {Array} grid - 元のグリッド
     * @param {Array} shape - テトリミノ形状
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @returns {Array} シミュレーション後のグリッド
     */
    simulatePlacement(grid, shape, x, y) {
        // グリッドのディープコピー
        const testGrid = grid.map(row => [...row]);
        
        // ピースを配置
        for (let dy = 0; dy < shape.length; dy++) {
            for (let dx = 0; dx < shape[dy].length; dx++) {
                if (shape[dy][dx]) {
                    const boardX = x + dx;
                    const boardY = y + dy;
                    
                    if (boardY >= 0 && boardY < GRID_HEIGHT && 
                        boardX >= 0 && boardX < GRID_WIDTH) {
                        testGrid[boardY][boardX] = 1; // 1で占有を表現
                    }
                }
            }
        }
        
        // 完成ラインを消去
        return this.clearCompletedLines(testGrid);
    }
    
    /**
     * 完成ラインを消去
     * @param {Array} grid - グリッド
     * @returns {Array} 消去後のグリッド
     */
    clearCompletedLines(grid) {
        const newGrid = [];
        let linesCleared = 0;
        
        for (let y = 0; y < GRID_HEIGHT; y++) {
            let isComplete = true;
            for (let x = 0; x < GRID_WIDTH; x++) {
                if (grid[y][x] === 0) {
                    isComplete = false;
                    break;
                }
            }
            
            if (!isComplete) {
                newGrid.push([...grid[y]]);
            } else {
                linesCleared++;
            }
        }
        
        // 上部に空行を追加
        while (newGrid.length < GRID_HEIGHT) {
            newGrid.unshift(Array(GRID_WIDTH).fill(0));
        }
        
        return newGrid;
    }
    
    /**
     * ボード評価関数
     * @param {Array} grid - 評価するグリッド
     * @param {Object} params - 評価パラメータ
     * @returns {number} 評価スコア
     */
    evaluateBoard(grid, params) {
        const height = this.calculateHeight(grid);
        const lines = this.countCompletedLines(grid);
        const holes = this.countHoles(grid);
        const bumpiness = this.calculateBumpiness(grid);
        
        return (
            height * params.heightWeight +
            lines * params.linesWeight +
            holes * params.holesWeight +
            bumpiness * params.bumpinessWeight
        );
    }
    
    /**
     * 最大高さを計算
     * @param {Array} grid - グリッド
     * @returns {number} 最大高さ
     */
    calculateHeight(grid) {
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                if (grid[y][x] !== 0) {
                    return GRID_HEIGHT - y;
                }
            }
        }
        return 0;
    }
    
    /**
     * 完成ライン数をカウント
     * @param {Array} grid - グリッド
     * @returns {number} 完成ライン数
     */
    countCompletedLines(grid) {
        let count = 0;
        for (let y = 0; y < GRID_HEIGHT; y++) {
            let isComplete = true;
            for (let x = 0; x < GRID_WIDTH; x++) {
                if (grid[y][x] === 0) {
                    isComplete = false;
                    break;
                }
            }
            if (isComplete) count++;
        }
        return count;
    }
    
    /**
     * 穴の数をカウント
     * @param {Array} grid - グリッド
     * @returns {number} 穴の数
     */
    countHoles(grid) {
        let holes = 0;
        
        for (let x = 0; x < GRID_WIDTH; x++) {
            let blockFound = false;
            for (let y = 0; y < GRID_HEIGHT; y++) {
                if (grid[y][x] !== 0) {
                    blockFound = true;
                } else if (blockFound) {
                    holes++;
                }
            }
        }
        
        return holes;
    }
    
    /**
     * 表面の凹凸度を計算
     * @param {Array} grid - グリッド
     * @returns {number} 凹凸度
     */
    calculateBumpiness(grid) {
        const heights = [];
        
        // 各列の高さを計算
        for (let x = 0; x < GRID_WIDTH; x++) {
            let height = 0;
            for (let y = 0; y < GRID_HEIGHT; y++) {
                if (grid[y][x] !== 0) {
                    height = GRID_HEIGHT - y;
                    break;
                }
            }
            heights.push(height);
        }
        
        // 隣接する列の高さ差の合計
        let bumpiness = 0;
        for (let i = 0; i < heights.length - 1; i++) {
            bumpiness += Math.abs(heights[i] - heights[i + 1]);
        }
        
        return bumpiness;
    }
    
    /**
     * ランダム配置取得（フォールバック用）
     * @param {Array} grid - グリッド
     * @param {Array} shape - テトリミノ形状
     * @returns {Object} ランダム配置
     */
    getRandomPlacement(grid, shape) {
        const possiblePlacements = [];
        
        for (let x = 0; x <= GRID_WIDTH - shape[0].length; x++) {
            const y = this.findDropPosition(grid, shape, x);
            if (y >= 0) {
                possiblePlacements.push({
                    x: x,
                    y: y,
                    rotation: 0,
                    shape: shape
                });
            }
        }
        
        if (possiblePlacements.length === 0) {
            return null;
        }
        
        const randomIndex = Math.floor(Math.random() * possiblePlacements.length);
        return possiblePlacements[randomIndex];
    }
}

// グローバルにAIエンジンを公開
window.aiEngine = new AIEngine();
```

### 6.3 main.js（完全版）

```javascript
/**
 * メインアプリケーション - リバーステトリス
 * UIとゲームエンジンの統合
 */

class ReverseTetricsApp {
    constructor() {
        this.gameEngine = null;
        this.isInitialized = false;
        
        this.init();
    }
    
    /**
     * アプリケーション初期化
     */
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    /**
     * セットアップ
     */
    setup() {
        try {
            // ゲームエンジン初期化
            this.gameEngine = new GameEngine();
            
            // UI要素の設定
            this.setupPieceSelector();
            this.setupControls();
            this.setupDifficulty();
            this.setupKeyboardEvents();
            
            // 初期UI更新
            this.gameEngine.updateUI();
            
            this.isInitialized = true;
            console.log('Reverse Tetris initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showError('ゲームの初期化に失敗しました。ページを再読み込みしてください。');
        }
    }
    
    /**
     * ピースセレクターの設定
     */
    setupPieceSelector() {
        const selector = document.getElementById('piece-selector');
        if (!selector) return;
        
        selector.innerHTML = '';
        
        Object.entries(TETROMINOS).forEach(([type, tetromino]) => {
            const btn = document.createElement('button');
            btn.className = 'piece-btn';
            btn.dataset.type = type;
            btn.title = `${type}ピース`;
            
            // ミニキャンバス作成
            const canvas = document.createElement('canvas');
            canvas.width = 50;
            canvas.height = 50;
            const ctx = canvas.getContext('2d');
            
            // ピース描画
            this.drawMiniPiece(ctx, tetromino.shape, tetromino.color, 50, 50);
            
            btn.appendChild(canvas);
            
            // クリックイベント
            btn.addEventListener('click', () => {
                if (!this.isInitialized) return;
                
                // ビジュアルフィードバック
                this.showPieceSelection(btn);
                
                // ピース選択
                this.gameEngine.selectPiece(type);
            });
            
            // キーボードアクセシビリティ
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    btn.click();
                }
            });
            
            selector.appendChild(btn);
        });
    }
    
    /**
     * ピース選択時のビジュアルフィードバック
     */
    showPieceSelection(btn) {
        btn.classList.add('selected');
        btn.classList.add('pulse');
        
        setTimeout(() => {
            btn.classList.remove('selected');
            btn.classList.remove('pulse');
        }, 200);
    }
    
    /**
     * ミニピース描画
     */
    drawMiniPiece(ctx, shape, color, width, height) {
        ctx.clearRect(0, 0, width, height);
        
        const cellSize = Math.min(
            (width - 10) / shape[0].length,
            (height - 10) / shape.length
        );
        const offsetX = (width - shape[0].length * cellSize) / 2;
        const offsetY = (height - shape.length * cellSize) / 2;
        
        ctx.fillStyle = color;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    // メインブロック
                    ctx.fillRect(
                        offsetX + x * cellSize,
                        offsetY + y * cellSize,
                        cellSize - 1,
                        cellSize - 1
                    );
                    
                    // ハイライト効果
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.fillRect(
                        offsetX + x * cellSize + 1,
                        offsetY + y * cellSize + 1,
                        cellSize - 3,
                        2
                    );
                    ctx.fillStyle = color;
                }
            }
        }
    }
    
    /**
     * コントロールボタンの設定
     */
    setupControls() {
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const resetBtn = document.getElementById('reset-btn');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                if (!this.isInitialized) return;
                this.gameEngine.start();
                this.hideGameMessage();
                this.showTemporaryMessage('ゲーム開始！');
            });
        }
        
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                if (!this.isInitialized) return;
                this.gameEngine.togglePause();
                
                const isPaused = this.gameEngine.state.isPaused;
                this.showTemporaryMessage(isPaused ? '一時停止中' : 'ゲーム再開！');
            });
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (!this.isInitialized) return;
                
                if (confirm('ゲームをリセットしますか？')) {
                    this.gameEngine.reset();
                    this.hideGameMessage();
                    this.showTemporaryMessage('ゲームをリセットしました');
                }
            });
        }
    }
    
    /**
     * 難易度設定
     */
    setupDifficulty() {
        const difficultySelect = document.getElementById('difficulty');
        if (!difficultySelect) return;
        
        difficultySelect.addEventListener('change', (e) => {
            if (!this.isInitialized) return;
            
            const difficulty = e.target.value;
            this.gameEngine.setDifficulty(difficulty);
            
            // ゲーム中の場合は警告
            if (this.gameEngine.state.isPlaying) {
                this.showTemporaryMessage('難易度変更は次のゲームから反映されます');
            } else {
                this.showTemporaryMessage(`難易度を「${this.getDifficultyName(difficulty)}」に変更しました`);
            }
        });
    }
    
    /**
     * 難易度名取得
     */
    getDifficultyName(difficulty) {
        const names = {
            easy: 'かんたん',
            normal: 'ふつう',
            hard: 'むずかしい'
        };
        return names[difficulty] || difficulty;
    }
    
    /**
     * キーボードイベント設定
     */
    setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            if (!this.isInitialized) return;
            
            // 数字キーでピース選択
            const pieceKeys = {
                '1': 'I', '2': 'O', '3': 'T', '4': 'S',
                '5': 'Z', '6': 'J', '7': 'L'
            };
            
            if (pieceKeys[e.key]) {
                e.preventDefault();
                this.gameEngine.selectPiece(pieceKeys[e.key]);
                
                // 対応するボタンをハイライト
                const btn = document.querySelector(`[data-type="${pieceKeys[e.key]}"]`);
                if (btn) this.showPieceSelection(btn);
            }
            
            // 制御キー
            switch (e.key) {
                case ' ': // スペースキーで一時停止
                    e.preventDefault();
                    if (this.gameEngine.state.isPlaying) {
                        this.gameEngine.togglePause();
                    }
                    break;
                    
                case 'r': // Rキーでリセット
                case 'R':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        document.getElementById('reset-btn')?.click();
                    }
                    break;
                    
                case 'Enter': // Enterキーでゲーム開始
                    if (!this.gameEngine.state.isPlaying) {
                        e.preventDefault();
                        document.getElementById('start-btn')?.click();
                    }
                    break;
            }
        });
    }
    
    /**
     * ゲームメッセージを非表示
     */
    hideGameMessage() {
        const messageEl = document.getElementById('game-message');
        if (messageEl) {
            messageEl.classList.add('hidden');
        }
    }
    
    /**
     * 一時的なメッセージ表示
     */
    showTemporaryMessage(message, duration = 2000) {
        const messageEl = document.getElementById('game-message');
        if (!messageEl) return;
        
        messageEl.innerHTML = `<p class="fade-in">${message}</p>`;
        messageEl.classList.remove('hidden');
        
        setTimeout(() => {
            messageEl.classList.add('hidden');
        }, duration);
    }
    
    /**
     * エラー表示
     */
    showError(message) {
        const messageEl = document.getElementById('game-message');
        if (messageEl) {
            messageEl.innerHTML = `
                <h2 style="color: #dc3545;">エラー</h2>
                <p>${message}</p>
            `;
            messageEl.classList.remove('hidden');
        } else {
            alert(message);
        }
    }
}

// アプリケーション開始
const app = new ReverseTetricsApp();

// グローバルアクセス用
window.reverseTetricsApp = app;

// デバッグ用ヘルパー
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugGame = () => {
        console.log('=== Debug Information ===');
        console.log('Game State:', app.gameEngine?.state);
        console.log('Grid:', app.gameEngine?.grid);
        console.log('Score:', app.gameEngine?.score);
        console.log('AI Engine:', window.aiEngine);
        console.log('Current Piece:', app.gameEngine?.currentPiece);
        console.log('Queue:', app.gameEngine?.pieceQueue);
    };
    
    window.simulateGame = (steps = 10) => {
        console.log(`Simulating ${steps} moves...`);
        if (!app.gameEngine?.state.isPlaying) {
            app.gameEngine?.start();
        }
        
        const pieces = Object.keys(TETROMINOS);
        let count = 0;
        
        const interval = setInterval(() => {
            if (count >= steps || app.gameEngine?.state.isGameClear) {
                clearInterval(interval);
                console.log('Simulation completed');
                return;
            }
            
            const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
            app.gameEngine?.selectPiece(randomPiece);
            count++;
        }, 1000);
    };
    
    console.log('Debug mode enabled. Use debugGame() to inspect or simulateGame(10) to test.');
}
```

---

## 7. テスト・デバッグ手順

### 7.1 段階的テスト手順

#### フェーズ1: 基本動作テスト
1. **HTML構造確認**
   ```bash
   # ローカルサーバー起動
   python -m http.server 8000
   # または
   npx serve .
   ```

2. **Canvas描画テスト**
   - グリッド線が正しく表示されるか
   - ボードサイズが300×600pxか
   - 背景色が正しく設定されているか

3. **UI要素テスト**
   - 全てのボタンが表示されるか
   - ピース選択ボタンが7つ表示されるか
   - スコア表示エリアが機能するか

#### フェーズ2: ゲーム機能テスト
1. **ゲーム開始/停止**
   ```javascript
   // デバッグコンソールで実行
   debugGame(); // 状態確認
   ```

2. **ピース選択・配置**
   - 各ピースボタンのクリック動作
   - キーボード操作（1-7キー）
   - AI配置アルゴリズムの動作

3. **ライン消去テスト**
   - 完成ライン検出
   - ハイライト表示
   - 削除アニメーション

#### フェーズ3: ゲームクリア・AI動作テスト
1. **ゲームクリア判定**
   ```javascript
   // 強制的にゲームクリア状態をテスト
   simulateGame(20);
   ```

2. **AI難易度テスト**
   - Easy: ランダム性の確認
   - Normal: バランスの確認
   - Hard: 最適化の確認

### 7.2 デバッグツール

#### 開発者ツール使用方法
```javascript
// コンソールでのデバッグコマンド
debugGame();                    // 現在の状態確認
simulateGame(10);              // 自動テストプレイ
window.reverseTetricsApp.gameEngine.grid; // グリッド状態確認
```

#### よくある問題と解決法

1. **ピースが表示されない**
   ```javascript
   // Canvas要素の確認
   console.log(document.getElementById('game-board'));
   // 描画コンテキストの確認
   console.log(app.gameEngine.ctx);
   ```

2. **ライン消去が動作しない**
   ```javascript
   // ライン検出の確認
   app.gameEngine.checkAndClearLines();
   ```

3. **AI配置が機能しない**
   ```javascript
   // AIエンジンの確認
   console.log(window.aiEngine);
   ```

### 7.3 パフォーマンステスト

#### フレームレート監視
```javascript
let frameCount = 0;
let lastTime = performance.now();

function measureFPS() {
    frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - lastTime >= 1000) {
        console.log(`FPS: ${frameCount}`);
        frameCount = 0;
        lastTime = currentTime;
    }
    
    requestAnimationFrame(measureFPS);
}

measureFPS();
```

#### メモリ使用量監視
```javascript
// メモリ使用量チェック（Chrome）
if (performance.memory) {
    setInterval(() => {
        const memory = performance.memory;
        console.log(`Used: ${(memory.usedJSHeapSize / 1048576).toFixed(2)}MB`);
        console.log(`Total: ${(memory.totalJSHeapSize / 1048576).toFixed(2)}MB`);
    }, 5000);
}
```

---

## 8. デプロイメント

### 8.1 GitHub Pages設定

#### 手順
1. **リポジトリ準備**
   ```bash
   git add .
   git commit -m "Complete Reverse Tetris implementation"
   git push origin main
   ```

2. **GitHub Pages有効化**
   - リポジトリ設定画面
   - Pages セクション
   - Source: Deploy from a branch
   - Branch: main / (root)

3. **カスタムドメイン設定（オプション）**
   ```
   # CNAME ファイル作成
   echo "your-domain.com" > CNAME
   ```

### 8.2 その他のデプロイオプション

#### Netlify
```bash
# netlify-cli使用
npm install -g netlify-cli
netlify deploy --prod --dir .
```

#### Vercel
```bash
# vercel-cli使用
npm install -g vercel
vercel --prod
```

### 8.3 パフォーマンス最適化

#### 画像最適化
- ピースアイコンをSVGに変換
- Canvas描画の最適化

#### コード最適化
```javascript
// 本番用の最小化設定
// 不要なconsole.logの削除
// デバッグ機能の無効化
```

---

## 9. 実装チェックリスト

### 9.1 必須機能チェックリスト

- [ ] **HTML構造**
  - [ ] 正しいセマンティックHTML
  - [ ] レスポンシブ対応のメタタグ
  - [ ] 必要な全UI要素

- [ ] **CSS設計**
  - [ ] フレックスボックスレイアウト
  - [ ] レスポンシブデザイン
  - [ ] アニメーション効果

- [ ] **JavaScript基本機能**
  - [ ] ゲームエンジンクラス
  - [ ] AIエンジンクラス
  - [ ] メインアプリケーションクラス

- [ ] **ゲーム機能**
  - [ ] ピース選択システム
  - [ ] AI配置アルゴリズム
  - [ ] ライン消去処理
  - [ ] ゲームクリア判定

- [ ] **UI/UX**
  - [ ] ビジュアルフィードバック
  - [ ] キーボード操作
  - [ ] アクセシビリティ

### 9.2 品質チェックリスト

- [ ] **コード品質**
  - [ ] ESLint適合
  - [ ] 適切なコメント
  - [ ] エラーハンドリング

- [ ] **パフォーマンス**
  - [ ] 60FPS維持
  - [ ] メモリリーク無し
  - [ ] レスポンス時間 < 16ms

- [ ] **互換性**
  - [ ] モダンブラウザ対応
  - [ ] モバイル対応
  - [ ] アクセシビリティ対応

### 9.3 最終確認項目

- [ ] **機能テスト**
  - [ ] 全難易度でのプレイテスト
  - [ ] 各ピースタイプでのテスト
  - [ ] エッジケースのテスト

- [ ] **デプロイメント**
  - [ ] 本番環境での動作確認
  - [ ] HTTPS対応
  - [ ] パフォーマンス計測

---

## 10. トラブルシューティング

### 10.1 よくある問題と解決法

#### 問題1: Canvasが表示されない
**原因**: HTML要素の取得に失敗
**解決法**:
```javascript
// DOM読み込み完了確認
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}
```

#### 問題2: ピースが正しく描画されない
**原因**: 座標計算エラー
**解決法**:
```javascript
// 境界チェック強化
if (boardX >= 0 && boardX < GRID_WIDTH && 
    boardY >= 0 && boardY < GRID_HEIGHT) {
    // 描画処理
}
```

#### 問題3: ライン消去が動作しない
**原因**: 配列操作の問題
**解決法**:
```javascript
// 下から上に向かって削除
const sortedLines = lines.sort((a, b) => b - a);
for (const line of sortedLines) {
    grid.splice(line, 1);
    grid.unshift(Array(GRID_WIDTH).fill(0));
}
```

### 10.2 デバッグ方法

#### ステップバイステップデバッグ
```javascript
// 1. 状態確認
console.log('Game State:', gameEngine.state);

// 2. グリッド状態確認
console.log('Grid:', gameEngine.grid);

// 3. イベント確認
element.addEventListener('click', (e) => {
    console.log('Click event:', e);
});
```

---

## 11. まとめ

この完全実装仕様書により、リバーステトリスを0から実装することが可能です。

### 実装のポイント
1. **段階的開発**: 基本機能から順次実装
2. **テスト駆動**: 各段階での動作確認
3. **コード品質**: 可読性と保守性を重視
4. **ユーザー体験**: 直感的で楽しい操作感

### 次のステップ
1. 基本実装の完成
2. 追加機能の検討
3. パフォーマンス最適化
4. コミュニティフィードバック

この仕様書に従って実装することで、完全に動作するリバーステトリスゲームが完成します。

---

**バージョン**: 3.0.0  
**更新日**: 2024-08-15  
**作成者**: Claude Code Assistant