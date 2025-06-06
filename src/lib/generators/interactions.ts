export function generateBasicInteractions(): string {
  return `document.addEventListener('DOMContentLoaded', function() {
    console.log('✨ Basic interactions loaded');
    
    // すべてのボタンにクリックインタラクションを追加
    const buttons = document.querySelectorAll('button');
    buttons.forEach((button, index) => {
      button.addEventListener('click', function() {
        // ボタンクリック時のビジュアルフィードバック
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
          button.style.transform = 'scale(1)';
        }, 150);
        
        // ボタンテキストに基づいた基本的な機能
        const text = button.textContent?.toLowerCase() || '';
        
        if (text.includes('送信') || text.includes('submit')) {
          alert('フォームが送信されました！');
        } else if (text.includes('検索') || text.includes('search')) {
          alert('検索機能が実行されました！');
        } else if (text.includes('保存') || text.includes('save')) {
          alert('データが保存されました！');
        } else if (text.includes('削除') || text.includes('delete')) {
          if (confirm('本当に削除しますか？')) {
            alert('削除されました！');
          }
        } else {
          // 汎用的なフィードバック
          const feedbacks = [
            '✨ ボタンがクリックされました！',
            '🎉 機能が実行されました！',
            '⚡ アクションが完了しました！',
            '🚀 処理が開始されました！'
          ];
          alert(feedbacks[Math.floor(Math.random() * feedbacks.length)]);
        }
      });
    });
    
    // フォーム要素にインタラクションを追加
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('フォームが送信されました！（デモ用）');
      });
    });
    
    // 入力フィールドにフォーカスエフェクトを追加
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('focus', function() {
        input.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.5)';
      });
      
      input.addEventListener('blur', function() {
        input.style.boxShadow = '';
      });
    });
    
    // リンクにスムーズなスクロール効果を追加
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = link.getAttribute('href')?.substring(1);
        const targetElement = targetId ? document.getElementById(targetId) : null;
        
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
    
    // カードやホバー要素にエフェクトを追加
    const cards = document.querySelectorAll('.card, [class*="card"], [class*="hover"]');
    cards.forEach(card => {
      card.addEventListener('mouseenter', function() {
        card.style.transform = 'translateY(-2px)';
        card.style.transition = 'transform 0.2s ease';
      });
      
      card.addEventListener('mouseleave', function() {
        card.style.transform = 'translateY(0)';
      });
    });
  });`;
} 