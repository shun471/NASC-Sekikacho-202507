import React, { useState } from 'react';

interface Props {
  disabled?: boolean;
  onUnlock?: () => void;
}

export default function CodeInput({ disabled = true, onUnlock }: Props) {
  const [code, setCode] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  
  const submit = async () => {
    if (disabled || isUnlocked || code.length !== 4) return;
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const { result } = await res.json();
    
    if (result === 'success') {
      setIsUnlocked(true);
      if (onUnlock) {
        onUnlock();
      }
    } else {
      alert('❌ コードが違います！もう一度試してください！ ❌');
      setCode(''); // コードをリセット
    }
  };

  const addDigit = (digit: string) => {
    if (disabled || isUnlocked || code.length >= 4) return;
    setCode(prev => prev + digit);
  };

  const clearCode = () => {
    if (disabled || isUnlocked) return;
    setCode('');
  };

  const deleteLastDigit = () => {
    if (disabled || isUnlocked) return;
    setCode(prev => prev.slice(0, -1));
  };

  if (isUnlocked) {
    return (
      <div className="text-center">
        <div className="p-4 bg-gradient-to-r from-green-500 to-green-600 border-3 border-green-400 text-white rounded-xl font-bold text-lg animate-pulse shadow-xl">
          <div className="text-3xl mb-2">🎉</div>
          <h2 className="text-xl mb-2">✅ 解除完了！</h2>
          <p className="text-base">爆弾が正常に解除されました！</p>
          <p className="text-sm mt-2">おめでとうございます！</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h2 className="text-xl font-bold text-white mb-3 drop-shadow-lg">
        🔐 解除コードを入力 🔐
      </h2>
      
      <div className="space-y-4">
        {/* コード表示エリア */}
        <div className="bg-gray-800 p-3 rounded-lg border-2 border-gray-600">
          <div className="text-2xl font-mono text-white mb-2">
            {code.padEnd(4, '•').split('').map((char, index) => (
              <span 
                key={index} 
                className={`inline-block w-10 h-10 mx-1 border-2 rounded-lg flex items-center justify-center ${
                  char === '•' ? 'border-gray-600 text-gray-600' : 'border-green-500 text-green-400'
                }`}
              >
                {char}
              </span>
            ))}
          </div>
          <div className="text-xs text-gray-400">
            {code.length}/4 文字入力済み
          </div>
        </div>
        
        {/* 10テンキー */}
        <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
          {/* 数字ボタン 1-9 */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => addDigit(num.toString())}
              disabled={disabled || isUnlocked || code.length >= 4}
              className={`w-12 h-12 text-lg font-bold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg border-2 ${
                disabled || isUnlocked || code.length >= 4
                  ? 'bg-gray-600 text-gray-400 border-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-500 hover:from-blue-700 hover:to-blue-800'
              }`}
            >
              {num}
            </button>
          ))}
          
          {/* クリアボタン */}
          <button
            onClick={clearCode}
            disabled={disabled || isUnlocked}
            className={`w-12 h-12 text-sm font-bold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg border-2 ${
              disabled || isUnlocked
                ? 'bg-gray-600 text-gray-400 border-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-600 to-red-700 text-white border-red-500 hover:from-red-700 hover:to-red-800'
            }`}
          >
            C
          </button>
          
          {/* 0ボタン */}
          <button
            onClick={() => addDigit('0')}
            disabled={disabled || isUnlocked || code.length >= 4}
            className={`w-12 h-12 text-lg font-bold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg border-2 ${
              disabled || isUnlocked || code.length >= 4
                ? 'bg-gray-600 text-gray-400 border-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-500 hover:from-blue-700 hover:to-blue-800'
            }`}
          >
            0
          </button>
          
          {/* 削除ボタン */}
          <button
            onClick={deleteLastDigit}
            disabled={disabled || isUnlocked || code.length === 0}
            className={`w-12 h-12 text-sm font-bold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg border-2 ${
              disabled || isUnlocked || code.length === 0
                ? 'bg-gray-600 text-gray-400 border-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white border-yellow-500 hover:from-yellow-700 hover:to-yellow-800'
            }`}
          >
            ←
          </button>
        </div>
        
        {/* 送信ボタン */}
        <button 
          onClick={submit}
          disabled={disabled || isUnlocked || code.length !== 4}
          className={`w-full py-3 px-4 rounded-lg text-base font-bold transition-all duration-200 transform hover:scale-105 shadow-lg border-2 ${
            disabled || isUnlocked || code.length !== 4
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed border-2 border-gray-500' 
              : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 border-2 border-green-500'
          }`}
        >
          {disabled ? '🔒 入力できません' : code.length !== 4 ? '4桁入力してください' : '🚀 コード送信 🚀'}
        </button>
      </div>
      
      {disabled && (
        <div className="mt-3 p-2 bg-gradient-to-r from-yellow-600 to-yellow-700 border-2 border-yellow-400 text-white rounded-lg font-bold text-sm">
          ⚠️ 導通を検知するまでコード入力は無効です ⚠️
        </div>
      )}
      
      {!disabled && (
        <div className="mt-3 p-2 bg-gradient-to-r from-blue-600 to-blue-700 border-2 border-blue-400 text-white rounded-lg font-bold text-sm">
          ✅ コード入力が有効です！4桁の数字を入力してください ✅
        </div>
      )}
    </div>
  );
}
