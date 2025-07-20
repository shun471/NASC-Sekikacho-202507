import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { Timer } from './timer';
import { getGPIO } from './gpio';
import { logger } from './logger';

dotenv.config();

const app = express();
// CORS 許可設定: フロント (localhost:3001) からのリクエストを受け付ける
app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());

// グローバルなタイマーとGPIO管理
let globalTimer: Timer | null = null;
let globalGpio: any = null;
let gpioInterval: NodeJS.Timeout | null = null;
let isGameActive = false;
let isCircuitLive = false; // 導通状態

// ゲーム状態管理
function startGame() {
  if (isGameActive) return;
  
  isGameActive = true;
  isCircuitLive = false; // ゲーム開始時は導通していない
  globalTimer = new Timer(60*90); // 3分タイマー
  globalGpio = getGPIO();

  // 全クライアントにタイマー開始を通知
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify({ event: 'game_started' }));
    }
  });
  
  // タイマーイベントを全クライアントにブロードキャスト
  globalTimer.on('tick', (sec: number) => {
    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({ remaining: sec }));
      }
    });
  });
  
  globalTimer.on('end', () => {
    isGameActive = false;
    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({ event: 'timeout' }));
      }
    });
    stopGpioMonitoring();
  });
  
  // GPIO監視開始
  startGpioMonitoring();
  
  // タイマー開始
  globalTimer.start();
  
  logger.info('Game started - Timer: 180 seconds');
}

function stopGame() {
  if (!isGameActive) return;
  
  isGameActive = false;
  isCircuitLive = false;
  if (globalTimer) {
    globalTimer.stop();
    globalTimer = null;
  }
  stopGpioMonitoring();
  
  logger.info('Game stopped');
}

function startGpioMonitoring() {
  if (gpioInterval) return;
  
  gpioInterval = setInterval(async () => {
    if (!globalGpio || !isGameActive) return;
    
    try {
      const live = await globalGpio.readCircuit();
      if (live && !isCircuitLive) {
        // 導通が検知された（初回）
        isCircuitLive = true;
        wss.clients.forEach(client => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({ event: 'circuit_live' }));
          }
        });
        logger.info('Circuit is now live - Code input enabled');
      } else if (!live && isCircuitLive) {
        // 導通が切れた
        isCircuitLive = false;
        wss.clients.forEach(client => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({ event: 'circuit_dead' }));
          }
        });
        logger.info('Circuit is dead - Code input disabled');
      }
    } catch (error) {
      logger.error(`Error reading GPIO circuit: ${error}`);
    }
  }, 500);
}

function stopGpioMonitoring() {
  if (gpioInterval) {
    clearInterval(gpioInterval);
    gpioInterval = null;
  }
}

// クリーンアップ関数
function cleanup() {
  logger.info('Cleaning up resources...');
  
  // ゲーム停止
  stopGame();
  
  // GPIOクリーンアップ
  if (globalGpio) {
    try {
      globalGpio.cleanup();
      globalGpio = null;
    } catch (error) {
      logger.error(`Error cleaning up GPIO: ${error}`);
    }
  }
  
  // WebSocketサーバーを閉じる
  wss.close();
  
  // HTTPサーバーを閉じる
  server.close(() => {
    logger.info('Server shutdown complete');
    process.exit(0);
  });
}

// REST: 解除コード判定
const CORRECT_CODE = process.env.UNLOCK_CODE || '0000';
app.post('/api/unlock', (req, res) => {
  const { code } = req.body;
  
  // 導通していない場合は解除できない
  if (!isCircuitLive) {
    logger.info(`Code attempt rejected - circuit not live: ${code}`);
    res.json({ result: 'failure', reason: 'circuit_not_live' });
    return;
  }
  
  console.log(code);
  console.log(CORRECT_CODE);
  const ok = code === CORRECT_CODE;
  logger.info(`Code attempt: ${code} → ${ok ? 'OK' : 'NG'}`);
  
  if (ok) {
    // 正解の場合、タイマーを停止して固定
    if (globalTimer) {
      globalTimer.stop();
      // タイマーは停止するが、ゲーム状態は維持
    }
    
    // 全クライアントに解除成功を通知
    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({ event: 'unlocked' }));
      }
    });
    
    logger.info('Bomb defused with correct code!');
  }
  
  res.json({ result: ok ? 'success' : 'failure' });
});

// REST: ゲーム開始エンドポイント
app.post('/api/start-game', (req, res) => {
  startGame();
  res.json({ status: 'started' });
});

// REST: ゲーム停止エンドポイント
app.post('/api/stop-game', (req, res) => {
  stopGame();
  res.json({ status: 'stopped' });
});

// REST: 現在の残り時間取得
app.get('/api/remaining', (req, res) => {
  if (globalTimer) {
    res.json({ 
      remaining: globalTimer.getRemaining(),
      isGameActive,
      isCircuitLive
    });
  } else {
    res.json({ 
      remaining: null,
      isGameActive: false,
      isCircuitLive: false
    });
  }
});

// 開発用: 導通状態を手動で制御（USE_MOCK_GPIO=true時のみ有効）
app.post('/api/dev/circuit', (req: any, res: any) => {
  if (process.env.USE_MOCK_GPIO !== 'true') {
    return res.status(403).json({ error: 'Mock GPIO not enabled' });
  }
  
  const { live } = req.body;
  if (typeof live !== 'boolean') {
    return res.status(400).json({ error: 'live parameter must be boolean' });
  }
  
  if (globalGpio && 'setCircuitState' in globalGpio) {
    (globalGpio as any).setCircuitState(live);
    res.json({ 
      success: true, 
      circuitLive: live,
      message: `Circuit manually set to ${live ? 'LIVE' : 'DEAD'}`
    });
  } else {
    res.status(500).json({ error: 'Mock GPIO not available' });
  }
});

// 開発用: 現在の導通状態を取得
app.get('/api/dev/circuit', (req: any, res: any) => {
  if (process.env.USE_MOCK_GPIO !== 'true') {
    return res.status(403).json({ error: 'Mock GPIO not enabled' });
  }
  
  res.json({ 
    circuitLive: isCircuitLive,
    isMockMode: true
  });
});

// WebSocket: タイマーと導通検知のプッシュ
wss.on('connection', ws => {
  logger.info('WebSocket client connected');
  
  // 接続時に現在のゲーム状態を送信
  if (isGameActive && globalTimer) {
    ws.send(JSON.stringify({ 
      event: 'game_state', 
      remaining: globalTimer.getRemaining(),
      isActive: true,
      isCircuitLive
    }));
  } else {
    ws.send(JSON.stringify({ 
      event: 'game_state', 
      remaining: null,
      isActive: false,
      isCircuitLive: false
    }));
  }

  // クライアントから制御コマンド
  ws.on('message', (msg: string) => {
    const { cmd } = JSON.parse(msg);
    if (cmd === 'start') startGame();
    if (cmd === 'stop') stopGame();
    if (cmd === 'reset') {
      stopGame();
      startGame();
    }
  });

  ws.on('close', () => {
    logger.info('WebSocket client disconnected');
  });
});

const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
  
  // サーバー起動時に自動的にゲームを開始
  setTimeout(() => {
    logger.info('Auto-starting game...');
    startGame();
  }, 1000); // 1秒後にゲーム開始
});

// プロセス終了時のクリーンアップ
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error}`);
  cleanup();
});
