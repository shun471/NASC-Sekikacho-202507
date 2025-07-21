# ラズパイ Pi セットアップガイド

このガイドでは、爆弾解除ゲームをラズパイ Pi で実行する方法を説明します。

## 前提条件

- ラズパイ Pi (3B+ 以上推奨)
- Raspberry Pi OS (Bullseye 以上)
- インターネット接続
- GPIO17に接続された導通検知回路

## セットアップ手順

### 1. ラズパイ Pi の準備

```bash
# システムを更新
sudo apt update && sudo apt upgrade -y

# GPIOグループにユーザーを追加（重要！）
sudo usermod -a -G gpio $USER

# 再ログインまたは再起動
sudo reboot
```

### 2. プロジェクトのクローンとセットアップ

```bash
# プロジェクトをクローン
git clone <your-repository-url>
cd NASC-Sekikacho-202507/backend

# セットアップスクリプトを実行
chmod +x setup-raspberry.sh
./setup-raspberry.sh
```

### 3. フロントエンドのビルド（PC側で実行）

```bash
# PC側でフロントエンドディレクトリに移動
cd frontend

# ビルドスクリプトを実行
chmod +x build-for-raspberry.sh
./build-for-raspberry.sh
```

### 4. サーバーの起動

```bash
# ラズパイ側で実行
cd backend
pnpm run start
```

### 5. アクセス

ブラウザで `http://[ラズパイのIP]:3000` にアクセス

## GPIO接続

### 回路図
```
3.3V ----[抵抗]---- GPIO17
                    |
                    [導通検知回路]
                    |
                   GND
```

### 接続詳細
- **GPIO17**: 導通検知入力
- **3.3V**: 電源
- **GND**: グランド
- **プルダウン抵抗**: 10kΩ（GPIO17とGNDの間）

## 環境設定

`.env` ファイルで以下の設定が可能：

```env
# サーバー設定
PORT=3000

# GPIO設定
USE_MOCK_GPIO=false  # 本番環境では必ず false

# 解除コード設定
UNLOCK_CODE=1234     # 4桁の解除コード

# ログレベル
LOG_LEVEL=info
```

## トラブルシューティング

### GPIOエラーが発生する場合
```bash
# GPIOグループにユーザーを追加
sudo usermod -a -G gpio $USER

# 再ログイン
newgrp gpio
```

### ポートが使用中の場合
```bash
# 使用中のポートを確認
sudo netstat -tlnp | grep :3000

# プロセスを終了
sudo kill -9 <PID>
```

### 静的ファイルが表示されない場合
```bash
# publicディレクトリの内容を確認
ls -la public/

# フロントエンドを再ビルド
cd ../frontend
./build-for-raspberry.sh
```

### ネットワーク接続ができない場合
```bash
# ファイアウォールの設定
sudo ufw allow 3000

# ラズパイのIPアドレスを確認
hostname -I
```

## 開発モード

開発時は `USE_MOCK_GPIO=true` に設定することで、実際のGPIOを使用せずにテストできます。

```bash
# 開発モードで起動
USE_MOCK_GPIO=true pnpm run dev
```

## 自動起動設定（オプション）

システム起動時に自動でサーバーを起動する場合：

```bash
# systemdサービスファイルを作成
sudo nano /etc/systemd/system/bomb-game.service
```

```ini
[Unit]
Description=Bomb Defusal Game
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/NASC-Sekikacho-202507/backend
ExecStart=/usr/bin/node dist/index.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# サービスを有効化
sudo systemctl enable bomb-game.service
sudo systemctl start bomb-game.service
``` 