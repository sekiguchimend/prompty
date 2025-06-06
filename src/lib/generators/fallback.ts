import { UIGenerationResponse } from '../utils/types';
import { generateBasicInteractions } from './interactions';

export function generateFallbackUI(prompt: string): UIGenerationResponse {
  return {
    html: `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated UI</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen flex items-center justify-center p-4">
    <div class="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full transform transition-all duration-300 hover:scale-105">
        <div class="text-center mb-6">
            <div class="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span class="text-2xl text-white">🚀</span>
            </div>
            <h1 class="text-2xl font-bold text-gray-800 mb-2">Claude UI</h1>
            <p class="text-gray-600 text-sm">プロンプト: ${prompt.substring(0, 80)}...</p>
        </div>
        
        <div class="space-y-4">
            <button id="primaryBtn" class="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]">
                🎉 インタラクティブボタン
            </button>
            
            <div class="flex space-x-2">
                <button id="colorBtn" class="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors">
                    🎨 色変更
                </button>
                <button id="animateBtn" class="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg transition-colors">
                    ✨ アニメーション
                </button>
            </div>
            
            <div class="text-center">
                <div id="counter" class="text-3xl font-bold text-gray-800 mb-2">0</div>
                <button id="counterBtn" class="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors">
                    🔢 カウンター
                </button>
            </div>
            
            <div id="result" class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-center hidden">
                <span id="resultText">Claude で生成完了！</span>
            </div>
        </div>
        
        <div class="mt-6 text-center">
            <div id="timestamp" class="text-xs text-gray-500"></div>
        </div>
    </div>
</body>
</html>`,
    css: `/* Tailwind CSS + Custom Animations */
.pulse-animation {
    animation: pulse 2s infinite;
}

.bounce-animation {
    animation: bounce 1s infinite;
}

.rotate-animation {
    animation: spin 2s linear infinite;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.fade-in {
    animation: fadeIn 0.5s ease-out;
}

.gradient-bg {
    background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
}

.hover-shadow:hover {
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}`,
    js: `document.addEventListener('DOMContentLoaded', function() {
    const primaryBtn = document.getElementById('primaryBtn');
    const colorBtn = document.getElementById('colorBtn');
    const animateBtn = document.getElementById('animateBtn');
    const counterBtn = document.getElementById('counterBtn');
    const counter = document.getElementById('counter');
    const result = document.getElementById('result');
    const resultText = document.getElementById('resultText');
    const timestamp = document.getElementById('timestamp');
    
    let clickCount = 0;
    let counterValue = 0;
    
    // 時刻表示の更新
    function updateTimestamp() {
        const now = new Date();
        timestamp.textContent = '最終更新: ' + now.toLocaleTimeString('ja-JP');
    }
    
    // 初期時刻設定
    updateTimestamp();
    setInterval(updateTimestamp, 1000);
    
    // メインボタンのクリックイベント
    primaryBtn.addEventListener('click', function() {
        clickCount++;
        result.classList.remove('hidden');
        result.classList.add('fade-in');
        
        const messages = [
            'Claude で生成完了！',
            '素晴らしいUIが生成されました！🎉',
            'インタラクティブな機能が動作中！✨',
            'あなたのクリック数: ' + clickCount + '回'
        ];
        
        resultText.textContent = messages[Math.min(clickCount - 1, messages.length - 1)];
        
        // ボタンテキストの更新
        if (clickCount === 1) {
            primaryBtn.textContent = '🎯 再度クリック';
        } else if (clickCount >= 3) {
            primaryBtn.textContent = '🚀 Claude マスター';
            primaryBtn.classList.add('gradient-bg');
        }
    });
    
    // 色変更ボタン
    colorBtn.addEventListener('click', function() {
        const colors = ['bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500'];
        const currentColor = colors[Math.floor(Math.random() * colors.length)];
        
        // 既存の色クラスを削除
        colorBtn.className = colorBtn.className.replace(/bg-\\w+-\\d+/g, '');
        colorBtn.classList.add(currentColor);
        
        // フィードバック
        colorBtn.textContent = '🎨 色変更済み';
        setTimeout(() => {
            colorBtn.textContent = '🎨 色変更';
        }, 1500);
    });
    
    // アニメーションボタン
    animateBtn.addEventListener('click', function() {
        const animations = ['pulse-animation', 'bounce-animation', 'rotate-animation'];
        const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
        
        // アニメーション適用
        animateBtn.classList.add(randomAnimation);
        
        // 2秒後にアニメーション削除
        setTimeout(() => {
            animateBtn.classList.remove(...animations);
        }, 1000);
    });
    
    // カウンターボタン
    counterBtn.addEventListener('click', function() {
        counterValue++;
        counter.textContent = counterValue;
        
        // カウンター表示のアニメーション
        counter.classList.add('bounce-animation');
        setTimeout(() => {
            counter.classList.remove('bounce-animation');
        }, 1000);
        
        // 10の倍数で特別なメッセージ
        if (counterValue % 10 === 0 && counterValue > 0) {
            resultText.textContent = '🎉 ' + counterValue + '回達成！すごいですね！';
            result.classList.remove('hidden');
            result.classList.add('fade-in');
        }
    });
    
    console.log('🚀 Claude - Interactive UI loaded successfully!');
    console.log('✨ Features: Button interactions, color changes, animations, counter, real-time clock');
});`,
    description: `Claude インタラクティブサンプルUI - "${prompt}"に基づいて生成。クリックボタン、色変更、アニメーション、カウンター、リアルタイム時計など豊富な機能を搭載したデモインターフェース。`
  };
} 