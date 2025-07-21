import dotenv from 'dotenv';
dotenv.config();

// 本番環境では false に設定
const useMock = process.env.USE_MOCK_GPIO === 'true';

export interface IGpio {
  readCircuit(): Promise<boolean>;
  cleanup(): void;
}

class MockGpio implements IGpio {
  private mockState = false;
  private interval: NodeJS.Timeout | null = null;

  constructor() {
    // 初期状態は導通なし
    this.mockState = false;
    console.log('[MOCK] Initial circuit state: DEAD');
    console.log('[MOCK] To simulate circuit live, set USE_MOCK_GPIO=true and manually trigger');
  }

  async readCircuit() {
    return this.mockState;
  }

  // 開発用: 手動で導通状態を切り替えるメソッド
  setCircuitState(live: boolean) {
    this.mockState = live;
    console.log(`[MOCK] Circuit state manually set to: ${live ? 'LIVE' : 'DEAD'}`);
  }

  cleanup() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

class RealGpio implements IGpio {
  private client: any;
  private sensor: any;
  private pinNumber: number;
  private isInitialized = false;

  constructor(pin = 17) {
    this.pinNumber = pin;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // 正しいインポート方法
      const pigpio = require('pigpio-client');
      this.client = new pigpio({host: 'localhost', port: 8888});
      await this.client.connect();
      
      this.sensor = await this.client.gpio(this.pinNumber);
      await this.sensor.mode('input');
      await this.sensor.pullUpDown('down');
      
      this.isInitialized = true;
      console.log(`[GPIO] Initialized GPIO${this.pinNumber} using pigpio-client`);
    } catch (error) {
      console.error('[GPIO] Failed to initialize GPIO with pigpio-client:', error);
      throw error;
    }
  }

  async readCircuit(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      const value = await this.sensor.digitalRead();
      const isLive = value === 1;
      
      console.log(`[GPIO] GPIO${this.pinNumber} read: ${value} (${isLive ? 'LIVE' : 'DEAD'})`);
      
      return isLive;
    } catch (error) {
      console.error(`[GPIO] Error reading GPIO${this.pinNumber}:`, error);
      return false; // エラー時は安全のため導通なしを返す
    }
  }

  cleanup() {
    try {
      if (this.client && this.isInitialized) {
        this.client.disconnect();
        this.isInitialized = false;
        console.log(`[GPIO] Cleaned up GPIO${this.pinNumber}`);
      }
    } catch (error) {
      console.error(`[GPIO] Error cleaning up GPIO${this.pinNumber}:`, error);
    }
  }
}

export function getGPIO(): IGpio {
  if (useMock) {
    console.log('[GPIO] Using MOCK GPIO for development');
    return new MockGpio();
  } else {
    console.log('[GPIO] Using REAL GPIO with pigpio-client for production');
    return new RealGpio(17); // GPIO17を使用
  }
} 