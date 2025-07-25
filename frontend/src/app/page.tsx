"use client";

import { useEffect, useState, useRef } from 'react';
import Countdown from '../components/Countdown';
import CodeInput from '../components/CodeInput';
import { createSocket } from '../lib/socket';

export default function Home() {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [isGameActive, setIsGameActive] = useState(false);
  const [isCircuitLive, setIsCircuitLive] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // WebSocket接続を作成
    const ws = createSocket();
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket接続が確立されました');
    };

    ws.onmessage = event => {
      const data = JSON.parse(event.data);
      console.log('受信データ:', data);
      
      if (data.event === 'game_state') {
        setRemaining(data.remaining);
        setIsGameActive(data.isActive);
        setIsCircuitLive(data.isCircuitLive);
      }
      
      // 解除されていない場合のみタイマーを更新
      if (data.remaining !== undefined && data.event !== 'game_state' && !isUnlocked) {
        setRemaining(data.remaining);
      }
      
      if (data.event === 'game_started') {
        setIsGameActive(true);
        setIsCircuitLive(false);
        setIsUnlocked(false); // ゲーム開始時は解除状態をリセット
        setIsGameOver(false); // ゲームオーバー状態もリセット
        console.log('ゲームが開始されました');
      }
      
      if (data.event === 'circuit_live') {
        setIsCircuitLive(true);
        console.log('導通が検知されました - コード入力が有効になりました');
      }
      
      if (data.event === 'circuit_dead') {
        setIsCircuitLive(false);
        console.log('導通が切れました - コード入力が無効になりました');
      }
      
      if (data.event === 'timeout') {
        console.log('タイマーが終了しました');
        setRemaining(0);
        setIsGameActive(false);
        setIsCircuitLive(false);
        setIsUnlocked(false);
        setIsGameOver(true);
        alert('💥 時間切れです！爆弾が爆発しました！💥');
      }
      
      if (data.event === 'unlocked') {
        console.log('解除されました！');
        setIsUnlocked(true);
        // タイマーは現在の値で固定（更新しない）
        alert('🎉 爆弾が解除されました！おめでとうございます！🎉');
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocketエラー:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket接続が閉じられました');
    };

    // クリーンアップ関数
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isUnlocked]); // isUnlockedを依存配列に追加

  const stopGame = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ cmd: 'stop' }));
    }
  };

  // GAME OVER画面
  if (isGameOver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-black flex items-center justify-center p-4">
        <div className="text-center">
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-12 shadow-2xl border-4 border-red-600 max-w-2xl">
            <div className="text-8xl mb-6 animate-pulse">💥</div>
            <h1 className="text-5xl font-bold text-red-500 mb-4 drop-shadow-lg">
              GAME OVER
            </h1>
            <p className="text-2xl text-white mb-8">
              時間切れです！爆弾が爆発しました！
            </p>
            <div className="text-gray-300 text-lg mb-8">
              <p>残り時間: 0:00</p>
              <p>システムが停止しました</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-full text-xl font-bold hover:from-red-700 hover:to-red-800 transform hover:scale-105 transition-all duration-200 shadow-lg border-2 border-red-500"
            >
              🔄 リトライ 🔄
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* コントロールパネルのメインコンテナ */}
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-8 shadow-2xl border-4 border-red-600 relative overflow-hidden">
          {/* パネルの上部装飾 */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-8 bg-red-600 rounded-b-full"></div>
          
          {/* タイトル */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-red-500 mb-2 drop-shadow-lg">
              💣爆弾コントロールパネル💣
            </h1>
          </div>

          {/* メインコンテンツ - 左右分割レイアウト */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 左側: カウントダウンとメッセージ */}
            <div className="space-y-6">
              {/* ゲーム停止ボタン */}
              {isGameActive && (
                <div className="text-center">
                  <button 
                    onClick={stopGame}
                    className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-full text-lg font-bold hover:from-gray-700 hover:to-gray-800 transform hover:scale-105 transition-all duration-200 shadow-lg border-2 border-gray-500"
                  >
                    ⏹️ システム停止 ⏹️
                  </button>
                </div>
              )}

              {/* タイマー表示 */}
              {remaining !== null && (
                <div>
                  <Countdown remaining={remaining} />
                  {isUnlocked && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-green-500 to-green-600 border-2 border-green-400 text-white rounded-xl font-bold text-lg animate-pulse">
                      ✅ 解除成功！残り時間で固定されています
                    </div>
                  )}
                </div>
              )}

              {/* 導通状態表示 */}
              {isCircuitLive && !isUnlocked && (
                <div className="p-4 bg-gradient-to-r from-green-500 to-green-600 border-2 border-green-400 text-white rounded-xl font-bold text-lg animate-pulse">
                  ⚡ 導通が検知されました！コード入力が有効です ⚡
                </div>
              )}

              {/* システム説明 */}
              <div className="text-center text-gray-400 text-sm">
                <p>💡 ヒント: 導通が検知されるまでコード入力はできません</p>
              </div>
            </div>

            {/* 右側: コード入力 */}
            <div className="bg-gray-700 rounded-2xl p-6 border-2 border-gray-600">
              <CodeInput disabled={!isCircuitLive || isUnlocked} onUnlock={() => setIsUnlocked(true)} />
            </div>
          </div>

          {/* 装飾的な要素 */}
          <div className="absolute top-4 right-4 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
          <div className="absolute bottom-4 left-4 w-3 h-3 bg-yellow-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute top-1/2 right-6 w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
      </div>
    </div>
  );
}
