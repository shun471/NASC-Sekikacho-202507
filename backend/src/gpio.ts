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
    // 開発用: 自動切り替えを無効化（手動制御用）
    // 必要に応じて以下のコメントアウトを解除して自動切り替えを有効化
    /*
    this.interval = setInterval(() => {
      this.mockState = !this.mockState;
      console.log(`[MOCK] Circuit state changed to: ${this.mockState ? 'LIVE' : 'DEAD'}`);
    }, 5000);
    */
    
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
  private GpioLib: any;
  private circuitPin: any;
  private pinNumber: number;

  constructor(pin = 17) {
    this.pinNumber = pin;
    
    try {
      this.GpioLib = require('onoff').Gpio;
      
      // GPIO17を入力モードで設定
      // 'in': 入力モード
      // 'both': 立ち上がり・立ち下がり両方のエッジでイベント
      // 'down': プルダウン抵抗を有効化（デフォルトで10kΩ）
      this.circuitPin = new this.GpioLib(pin, 'in', 'both', {
        debounceTimeout: 100 // デバウンス時間100ms
      });
      
      console.log(`[GPIO] Initialized GPIO${pin} for circuit detection`);
    } catch (error) {
      console.error('[GPIO] Failed to initialize GPIO:', error);
      throw error;
    }
  }

  async readCircuit(): Promise<boolean> {
    try {
      // GPIO17の状態を読み取り
      // 0: LOW (GNDレベル) = 導通なし
      // 1: HIGH (3.3Vレベル) = 導通あり
      const value = this.circuitPin.readSync();
      const isLive = value === 1;
      
      // デバッグ用ログ（本番環境では削除可能）
      console.log(`[GPIO] GPIO${this.pinNumber} read: ${value} (${isLive ? 'LIVE' : 'DEAD'})`);
      
      return isLive;
    } catch (error) {
      console.error(`[GPIO] Error reading GPIO${this.pinNumber}:`, error);
      return false; // エラー時は安全のため導通なしを返す
    }
  }

  cleanup() {
    try {
      if (this.circuitPin) {
        this.circuitPin.unexport();
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
    console.log('[GPIO] Using REAL GPIO for production');
    return new RealGpio(17); // GPIO17を使用
  }
}
