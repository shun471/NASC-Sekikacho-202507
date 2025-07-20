# 爆弾解除ゲーム バックエンド

## 概要
ラズパイを使用した爆弾解除ゲームのバックエンドサーバーです。GPIO17を使用して導通検知を行い、WebSocketでフロントエンドとリアルタイム通信します。

## 必要なハードウェア
- Raspberry Pi (推奨: Pi 4)
- 10kΩ抵抗 × 2個
- 電極（銅板など）
- ジャンパーワイヤー

## 回路図
```
   3.3V ── R1 (10 kΩ) ── Electrode B
                             │
                         (溶液)
                             │
        GPIO17 ◀──────── Electrode A
             │
     (プルダウン 10 kΩ) ←─┘
             │
            GND
```

### 回路の説明
- **3.3V**: ラズパイの3.3V電源
- **R1 (10kΩ)**: 電流制限抵抗
- **Electrode A/B**: 溶液に浸す電極
- **GPIO17**: 導通検知用のGPIOピン
- **プルダウン抵抗**: 内蔵の10kΩプルダウン抵抗を使用

## セットアップ手順

### 1. 依存関係のインストール
```bash
# システムパッケージ
sudo apt update
sudo apt install nodejs npm

# Node.jsパッケージ
npm install
```

### 2. GPIOライブラリのインストール
```bash
# onoffライブラリ（GPIO制御用）
npm install onoff
```

### 3. 環境変数の設定
```bash
# .envファイルを作成
cp env.example .env

# .envファイルを編集
nano .env
```

### 4. 本番環境設定
`.env`ファイルで以下を設定：
```
USE_MOCK_GPIO=false
UNLOCK_CODE=1234  # 希望の4桁コード
```

### 5. サーバー起動
```bash
# 開発モード
npm run dev

# 本番モード
npm start
```

## 動作原理

### 導通検知
1. **通常時**: GPIO17はプルダウン抵抗によりLOW（0V）
2. **導通時**: 電極間が溶液で導通すると、3.3VがGPIO17に入力されHIGH（3.3V）
3. **検知**: 500ms間隔でGPIO17の状態を監視

### ゲームフロー
1. サーバー起動時に自動的にゲーム開始
2. タイマー開始（デフォルト: 3分）
3. 導通が検知されるまでコード入力無効
4. 導通検知後、コード入力有効
5. 正しいコード入力で解除成功

## 開発モード
開発時は`USE_MOCK_GPIO=true`に設定すると、実際のGPIOを使用せずにテストできます。

## トラブルシューティング

### GPIOエラー
- ラズパイで実行しているか確認
- GPIO17が他の用途で使用されていないか確認
- 回路の配線を確認

### 導通が検知されない
- 電極が溶液に正しく浸っているか確認
- 抵抗値が適切か確認（10kΩ推奨）
- 電極間の距離を調整

### サーバーが起動しない
- ポート3000が使用されていないか確認
- 環境変数が正しく設定されているか確認

## API仕様

### WebSocket イベント
- `game_started`: ゲーム開始
- `circuit_live`: 導通検知
- `circuit_dead`: 導通切断
- `timeout`: 時間切れ
- `unlocked`: 解除成功

### REST API
- `POST /api/unlock`: コード入力
- `GET /api/remaining`: 残り時間取得
- `POST /api/start-game`: ゲーム開始
- `POST /api/stop-game`: ゲーム停止

## ライセンス
MIT License 