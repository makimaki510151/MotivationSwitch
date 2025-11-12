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
    let animationFrameId; // パーティクルアニメーションフレームID
    let throwIntervalId; // 継続的な文字・パーティクル生成用インターバルID

    // --- パーティクル関連の処理 ---

    // Particleクラスの定義 (前回と同じ)
    class Particle {
        constructor(x, y, color, size, vx, vy) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.size = size;
            this.vx = vx; 
            this.vy = vy; 
            this.alpha = 1; 
            this.gravity = 0.2; 
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
            this.vy += this.gravity; 
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= 0.02; 
            if (this.size > 0.5) this.size *= 0.97; 
        }
    }

    // パーティクルを生成する関数 (今回は方向から投げ込まれる)
    function createThrowingParticles(count, originX, originY, angle) {
        for (let i = 0; i < count; i++) {
            const colors = ['#FFD700', '#FF4500', '#ADFF2F', '#87CEEB', '#FF69B4'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 5 + 2;

            // 投げ込みの方向を決定（角度±20度の範囲でランダム）
            const randomAngle = angle + (Math.random() * 40 - 20) * (Math.PI / 180); 
            const speed = Math.random() * 8 + 5; // 速度を調整
            const vx = speed * Math.cos(randomAngle);
            const vy = speed * Math.sin(randomAngle);

            particles.push(new Particle(originX, originY, color, size, vx, vy));
        }
    }

    // パーティクルアニメーションループ
    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); 
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].draw();

            if (particles[i].alpha <= 0 || particles[i].size <= 0.5) {
                particles.splice(i, 1);
            }
        }
        animationFrameId = requestAnimationFrame(animateParticles);
    }

    // ウィンドウリサイズ時にキャンバスサイズを調整
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    // --- 大量の文字アニメーション関連の処理 ---

    const motivationWords = [
        "やる気", "覚醒", "爆発", "限界突破", "進化", "最強", "無限", "挑戦",
        "勝利", "成功", "未来", "希望", "輝け", "進め", "GO!", "YES!", "DREAM", "POWER"
    ];

    // 文字を画面外から投げ込む関数
    function createThrowingText(count = 5) {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        for (let i = 0; i < count; i++) {
            const char = document.createElement('span');
            char.classList.add('blast-char');
            char.textContent = motivationWords[Math.floor(Math.random() * motivationWords.length)];

            let fromX, fromY; // 投げ込み開始位置
            let toX, toY;     // 到達目標位置 (画面中央付近)
            const side = Math.floor(Math.random() * 4); // 0:上, 1:右, 2:下, 3:左

            // 画面外のランダムな位置を開始点に設定
            if (side === 0) { // 上から
                fromX = Math.random() * viewportWidth;
                fromY = -50;
                toX = Math.random() * viewportWidth * 0.4 + viewportWidth * 0.3 - fromX; // 中央30%付近へ
                toY = Math.random() * viewportHeight * 0.4 + viewportHeight * 0.2 - fromY;
            } else if (side === 1) { // 右から
                fromX = viewportWidth + 50;
                fromY = Math.random() * viewportHeight;
                toX = Math.random() * viewportWidth * 0.4 + viewportWidth * 0.3 - fromX;
                toY = Math.random() * viewportHeight * 0.4 + viewportHeight * 0.3 - fromY;
            } else if (side === 2) { // 下から
                fromX = Math.random() * viewportWidth;
                fromY = viewportHeight + 50;
                toX = Math.random() * viewportWidth * 0.4 + viewportWidth * 0.3 - fromX;
                toY = Math.random() * viewportHeight * 0.4 + viewportHeight * 0.3 - fromY;
            } else { // 左から
                fromX = -50;
                fromY = Math.random() * viewportHeight;
                toX = Math.random() * viewportWidth * 0.4 + viewportWidth * 0.3 - fromX;
                toY = Math.random() * viewportHeight * 0.4 + viewportHeight * 0.3 - fromY;
            }
            
            // 文字要素の位置を初期化
            char.style.left = `${fromX}px`;
            char.style.top = `${fromY}px`;

            // CSS変数としてアニメーションに渡す
            char.style.setProperty('--from-x', '0px');
            char.style.setProperty('--from-y', '0px');
            char.style.setProperty('--to-x', `${toX}px`);
            char.style.setProperty('--to-y', `${toY}px`);
            char.style.setProperty('--rot', `${Math.random() * 720 - 360}deg`);

            // アニメーション適用
            const duration = Math.random() * 2 + 1.5; // 1.5秒から3.5秒
            char.style.animation = `continuousThrow ${duration}s ease-out forwards`;

            textBlastContainer.appendChild(char);

            // アニメーション終了後に要素を削除
            char.addEventListener('animationend', () => {
                char.remove();
            });
        }
    }


    // 継続的な文字・パーティクル生成ロジック
    function startContinuousThrowing() {
        if (throwIntervalId) return; // すでに動いている場合は何もしない

        // 0.3秒ごとに新しい文字とパーティクルを生成
        throwIntervalId = setInterval(() => {
            if (!isMotivationActive) {
                stopContinuousThrowing();
                return;
            }

            // 文字を生成
            createThrowingText(3); // 毎度3個の文字を生成

            // パーティクルを画面四隅から投げ込む
            const w = window.innerWidth;
            const h = window.innerHeight;

            // 画面四隅と方向 (0度:右, 90度:下, 180度:左, 270度:上)
            const throwPoints = [
                { x: 0, y: 0, angle: 45 },      // 左上 (右下へ)
                { x: w, y: 0, angle: 135 },     // 右上 (左下へ)
                { x: w, y: h, angle: 225 },     // 右下 (左上へ)
                { x: 0, y: h, angle: 315 }      // 左下 (右上へ)
            ];

            const point = throwPoints[Math.floor(Math.random() * 4)];
            createThrowingParticles(20, point.x, point.y, point.angle * (Math.PI / 180));

        }, 300); // 300ミリ秒間隔で実行
    }

    function stopContinuousThrowing() {
        clearInterval(throwIntervalId);
        throwIntervalId = null;
    }


    // --- スイッチのロジック ---

    function toggleMotivation() {
        isMotivationActive = !isMotivationActive; 

        if (isMotivationActive) {
            // === やる気 ON の演出 ===
            switchButton.classList.remove('off');
            switchButton.classList.add('on');
            switchIndicator.textContent = 'やる気 ON!! 🚀🔥'; 

            onSound.currentTime = 0; 
            onSound.play();

            body.classList.add('motivation-active');
            motivationDisplay.classList.add('active'); 
            motivationDisplay.textContent = '🔥🔥 やる気、超爆発！！ 全てをやり遂げろ！ 🔥🔥';

            // 継続的な投げ込みアニメーションを開始
            if (!animationFrameId) {
                animateParticles();
            }
            startContinuousThrowing();

        } else {
            // === やる気 OFF の演出 ===
            switchButton.classList.remove('on');
            switchButton.classList.add('off');
            switchIndicator.textContent = 'やる気 OFF'; 

            offSound.currentTime = 0;
            offSound.play();

            body.classList.remove('motivation-active');
            motivationDisplay.classList.remove('active'); 
            motivationDisplay.textContent = '押して、やる気を爆発させろ！';

            // 継続的な投げ込みアニメーションを停止
            stopContinuousThrowing();
        }
    }

    // スイッチボタンにクリックイベントを追加
    switchButton.addEventListener('click', toggleMotivation);
});