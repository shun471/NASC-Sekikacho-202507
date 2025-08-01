#!/bin/bash

# ラズパイ用セットアップスクリプト

echo "🚀 ラズパイ用セットアップを開始します..."

# 必要なパッケージをインストール
echo "📦 システムパッケージを更新中..."
sudo apt update
sudo apt upgrade -y

# Node.jsとnpmをインストール（まだインストールされていない場合）
if ! command -v node &> /dev/null; then
    echo "📦 Node.jsをインストール中..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# pnpmをインストール
if ! command -v pnpm &> /dev/null; then
    echo "📦 pnpmをインストール中..."
    npm install -g pnpm
fi

# プロジェクトの依存関係をインストール
echo "📦 プロジェクトの依存関係をインストール中..."
pnpm install

# TypeScriptをビルド
echo "🔨 TypeScriptをビルド中..."
pnpm run build

# 環境設定ファイルを作成
echo "⚙️ 環境設定ファイルを作成中..."
cat > .env << EOF
# ラズパイ用環境設定
PORT=3000

# GPIO設定（本番環境）
USE_MOCK_GPIO=false

# 解除コード設定
UNLOCK_CODE=1234

# ログレベル
LOG_LEVEL=info

# サーバー設定
NODE_ENV=production
EOF

echo "✅ セットアップが完了しました！"
echo ""
echo "📋 次のステップ："
echo "1. フロントエンドをビルドして public/ に配置"
echo "2. 'pnpm run start' でサーバーを起動"
echo "3. ブラウザで http://[ラズパイのIP]:3000 にアクセス"
echo ""
echo "🔧 トラブルシューティング："
echo "- GPIOエラーが出る場合: sudo usermod -a -G gpio \$USER"
echo "- ポートが使用中の場合: .env で PORT を変更" 