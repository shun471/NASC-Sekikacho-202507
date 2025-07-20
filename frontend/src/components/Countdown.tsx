import React from 'react';

type Props = { remaining: number };

export default function Countdown({ remaining }: Props) {
  const min = Math.floor(remaining / 60);
  const sec = remaining % 60;
  
  // 残り時間が少なくなった時の警告色
  const getTimeColor = () => {
    if (remaining <= 600) return 'text-red-500 animate-pulse';
    if (remaining <= 1800) return 'text-yellow-500';
    return 'text-green-400';
  };

  const getBackgroundColor = () => {
    if (remaining <= 600) return 'bg-red-900/50 border-red-500';
    if (remaining <= 1800) return 'bg-yellow-900/50 border-yellow-500';
    return 'bg-green-900/50 border-green-500';
  };

  return (
    <div className="text-center">
      <h2 className="text-xl font-bold text-white mb-3 drop-shadow-lg">
        ⏰ システム残り時間 ⏰
      </h2>
      <div className={`inline-block p-4 rounded-xl border-3 ${getBackgroundColor()} shadow-xl`}>
        <div className={`text-4xl font-mono font-bold ${getTimeColor()} drop-shadow-lg`}>
          {`${min}:${sec.toString().padStart(2, '0')}`}
        </div>
      </div>
      
      {/* 残り時間に応じたメッセージ */}
      {remaining <= 600 && (
        <div className="mt-3 p-2 bg-red-600 text-white rounded-lg font-bold animate-pulse text-sm">
          ⚠️ 危険！！ 時間がなくなりそう！！⚠️
        </div>
      )}
      {remaining <= 1800 && remaining > 600 && (
        <div className="mt-3 p-2 bg-yellow-600 text-white rounded-lg font-bold text-sm">
          ⚡ すこし残り時間が少なくなってきた！ ⚡
        </div>
      )}
      {remaining > 1800 && (
        <div className="mt-3 p-2 bg-green-600 text-white rounded-lg font-bold text-sm">
          🎯 まだ時間があります！落ち着いて行動しよう！ 🎯
        </div>
      )}
    </div>
  );
}
