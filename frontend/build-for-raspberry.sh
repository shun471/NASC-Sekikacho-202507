#!/bin/bash

# ラズパイ用フロントエンドビルドスクリプト

echo "🚀 ラズパイ用フロントエンドビルドを開始します..."

# ラズパイのIPアドレスを取得
echo "📱 ラズパイのIPアドレスを入力してください（例: 192.168.1.100）:"
read RASPBERRY_IP

if [ -z "$RASPBERRY_IP" ]; then
    echo "❌ IPアドレスが入力されていません"
    exit 1
fi

echo "🔧 環境変数を設定中..."
export NEXT_PUBLIC_API_URL="http://$RASPBERRY_IP:3000"
export NEXT_PUBLIC_WS_URL="ws://$RASPBERRY_IP:3000"

echo "📦 依存関係をインストール中..."
pnpm install

echo "🔨 フロントエンドをビルド中..."
pnpm run build

echo "📁 ビルドファイルをバックエンドのpublicディレクトリにコピー中..."
if [ -d "../backend/public" ]; then
    rm -rf ../backend/public/*
    cp -r out/* ../backend/public/
    echo "✅ ビルドファイルを ../backend/public/ にコピーしました"
else
    echo "⚠️  ../backend/public/ ディレクトリが見つかりません"
    echo "📁 手動で out/ ディレクトリの内容を backend/public/ にコピーしてください"
fi

echo ""
echo "✅ ビルドが完了しました！"
echo "📋 次のステップ："
echo "1. ラズパイでバックエンドサーバーを起動"
echo "2. ブラウザで http://$RASPBERRY_IP:3000 にアクセス"
echo ""
echo "🔧 トラブルシューティング："
echo "- 接続できない場合: ファイアウォールの設定を確認"
echo "- 静的ファイルが表示されない場合: backend/public/ の内容を確認" 