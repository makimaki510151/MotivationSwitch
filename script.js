document.addEventListener('DOMContentLoaded', () => {
    // 必要なDOM要素を取得
    const switchButton = document.getElementById('motivationSwitch');
    const switchIndicator = switchButton.querySelector('.indicator');
    const motivationDisplay = document.getElementById('motivationDisplay');
    const body = document.body;
    const textBlastContainer = document.getElementById('textBlastContainer');

    // サウンド要素
    const onSound = document.getElementById('onSound');
    const offSound = document.getElementById('offSound');

    // キャンバスとコンテキスト（パーティクル用）
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let isMotivationActive = false; // 現在のスイッチの状態 (やる気OFF/ON)
    let particles = []; // パーティクルの配列
    let animationFrameId; // アニメーションフレームID

    // --- パーティクル関連の処理 ---

    // Particleクラスの定義
    class Particle {
        constructor(x, y, color, size) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.size = size;
            this.vx = (Math.random() - 0.5) * 10; // X方向の速度
            this.vy = (Math.random() - 0.5) * 10; // Y方向の速度
            this.alpha = 1; // 透明度
            this.gravity = 0.2; // 重力
        }

        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.restore();
        }

        update() {
            this.vy += this.gravity; // 重力でY速度を増やす
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= 0.02; // 徐々に透明になる
            if (this.size > 0.5) this.size *= 0.97; // 徐々に小さくなる
        }
    }

    // パーティクルを生成する関数
    function createParticles(count, x, y) {
        for (let i = 0; i < count; i++) {
            const colors = ['#FFD700', '#FF4500', '#ADFF2F', '#87CEEB', '#FF69B4']; // キラキラした色
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 5 + 2;
            particles.push(new Particle(x, y, color, size));
        }
    }

    // パーティクルアニメーションループ
    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // キャンバスをクリア
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].draw();

            // 透明度が0以下になったらパーティクルを削除
            if (particles[i].alpha <= 0 || particles[i].size <= 0.5) {
                particles.splice(i, 1);
            }
        }
        if (particles.length > 0) {
            animationFrameId = requestAnimationFrame(animateParticles);
        } else {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    // ウィンドウリサイズ時にキャンバスサイズを調整
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    // --- 大量の文字アニメーション関連の処理 ---

    // やる気が出る言葉の配列
    const motivationWords = [
        "やる気", "覚醒", "爆発", "限界突破", "進化", "最強", "無限", "挑戦",
        "勝利", "成功", "未来", "希望", "輝け", "進め", "GO!", "YES!", "DREAM", "POWER"
    ];

    function createTextBlast(count = 50) {
        textBlastContainer.innerHTML = ''; // 古い文字をクリア
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        for (let i = 0; i < count; i++) {
            const char = document.createElement('span');
            char.classList.add('blast-char');
            char.textContent = motivationWords[Math.floor(Math.random() * motivationWords.length)];

            // 画面中心からのランダムな拡散位置
            const spreadRadius = Math.random() * 400 + 100; // 100pxから500pxの範囲
            const angle = Math.random() * Math.PI * 2; // 0から360度
            const targetX = spreadRadius * Math.cos(angle);
            const targetY = spreadRadius * Math.sin(angle);

            // CSS変数としてアニメーションに渡す
            char.style.setProperty('--x', `${targetX}px`);
            char.style.setProperty('--y', `${targetY}px`);
            char.style.setProperty('--rot', `${Math.random() * 720 - 360}deg`); // -360degから360degのランダムな回転
            char.style.animation = `textBlast 2s ease-out ${Math.random() * 0.5}s forwards`; // ランダムな遅延

            textBlastContainer.appendChild(char);
        }
    }

    // --- スイッチのロジック ---

    // スイッチの状態を切り替える関数
    function toggleMotivation() {
        isMotivationActive = !isMotivationActive; // 状態を反転

        if (isMotivationActive) {
            // === やる気 ON の演出 ===
            switchButton.classList.remove('off');
            switchButton.classList.add('on');
            switchIndicator.textContent = 'やる気 ON!! 🚀🔥'; // スイッチ表示変更

            // サウンド再生
            onSound.currentTime = 0; // 再生位置を最初に戻す
            onSound.play();

            // とんでもない演出をONにする
            body.classList.add('motivation-active'); // 背景グラデーションアニメーション
            motivationDisplay.classList.add('active'); // テキストの震え・ネオンアニメーション
            motivationDisplay.textContent = '🔥🔥 やる気、超爆発！！ 全てをやり遂げろ！ 🔥🔥';

            // パーティクルを生成してアニメーション開始
            const switchRect = switchButton.getBoundingClientRect();
            createParticles(200, switchRect.left + switchRect.width / 2, switchRect.top + switchRect.height / 2);
            if (!animationFrameId) {
                animateParticles();
            }

            // 大量の文字を生成してアニメーション開始
            createTextBlast(80); // 80個の文字を生成

        } else {
            // === やる気 OFF の演出 ===
            switchButton.classList.remove('on');
            switchButton.classList.add('off');
            switchIndicator.textContent = 'やる気 OFF'; // スイッチ表示変更

            // サウンド再生
            offSound.currentTime = 0;
            offSound.play();

            // 演出をOFFにする
            body.classList.remove('motivation-active'); // 背景アニメーション停止
            motivationDisplay.classList.remove('active'); // テキストアニメーション停止
            motivationDisplay.textContent = '押して、やる気を爆発させろ！';

            // パーティクルをクリア (または自然消滅を待つ)
            // particles = []; // 強制クリアする場合はこれを有効にする

            // 大量の文字をクリア
            textBlastContainer.innerHTML = '';
        }
    }

    // スイッチボタンにクリックイベントを追加
    switchButton.addEventListener('click', toggleMotivation);
});