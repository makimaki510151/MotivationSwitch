document.addEventListener('DOMContentLoaded', () => {
    // 必要なDOM要素を取得
    const switchButton = document.getElementById('motivationSwitch');
    const switchIndicator = switchButton.querySelector('.indicator');
    const motivationDisplay = document.getElementById('motivationDisplay');
    const body = document.body;
    const textBlastContainer = document.getElementById('textBlastContainer');

    // ★ BGM要素を取得し、音量を設定 ★
    const bgmSound = document.getElementById('bgmSound');
    // BGMの音量を小さく設定
    bgmSound.volume = 0.1; 

    // --- サウンド制御関数 (シンプル化) ---

    function startBGM() {
        // 再生が開始されるかを確認し、途中で止まっていたら最初から再生し、ループさせる
        if (bgmSound.paused) {
            bgmSound.currentTime = 0;
            // loop属性がHTML側で設定されているため、ここでは単に再生する
            bgmSound.play().catch(error => {
                console.log("BGMの再生に失敗しました (ユーザー操作が必要です):", error);
            });
        }
    }

    function stopBGM() {
        bgmSound.pause();
        bgmSound.currentTime = 0; // 停止したら最初に戻す
    }


    // --- パーティクル関連の処理 ---

    // キャンバスとコンテキスト（パーティクル用）
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let isMotivationActive = false; 
    let particles = []; 
    let animationFrameId; 
    let throwIntervalId; 

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

    // パーティクルを生成する関数 (前回と同じ)
    function createThrowingParticles(count, originX, originY, angle) {
        for (let i = 0; i < count; i++) {
            const colors = ['#FFD700', '#FF4500', '#ADFF2F', '#87CEEB', '#FF69B4', '#FFFFFF'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 8 + 3; 
            
            const randomAngle = angle + (Math.random() * 80 - 40) * (Math.PI / 180); 
            const speed = Math.random() * 15 + 10; 
            const vx = speed * Math.cos(randomAngle);
            const vy = speed * Math.sin(randomAngle);

            particles.push(new Particle(originX, originY, color, size, vx, vy));
        }
    }

    // パーティクルアニメーションループ (前回と同じ)
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

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    // --- 大量の文字アニメーション関連の処理 (前回と同じ) ---

    const motivationWords = [
        "やる気", "覚醒", "爆発", "限界突破", "進化", "最強", "無限", "挑戦",
        "勝利", "成功", "未来", "希望", "輝け", "進め", "GO!", "YES!", "DREAM", "POWER"
    ];

    function createThrowingText(count = 5) {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        for (let i = 0; i < count; i++) {
            const char = document.createElement('span');
            char.classList.add('blast-char');
            char.textContent = motivationWords[Math.floor(Math.random() * motivationWords.length)];

            let fromX, fromY; 
            let toX, toY;     
            const side = Math.floor(Math.random() * 4); 

            if (side === 0) { // 上から
                fromX = Math.random() * viewportWidth;
                fromY = -50;
                toX = Math.random() * viewportWidth * 0.9 - viewportWidth * 0.05 - fromX; 
                toY = Math.random() * viewportHeight * 0.9 - viewportHeight * 0.05 - fromY;
            } else if (side === 1) { // 右から
                fromX = viewportWidth + 50;
                fromY = Math.random() * viewportHeight;
                toX = Math.random() * viewportWidth * 0.9 - viewportWidth * 0.05 - fromX;
                toY = Math.random() * viewportHeight * 0.9 - viewportHeight * 0.05 - fromY;
            } else if (side === 2) { // 下から
                fromX = Math.random() * viewportWidth;
                fromY = viewportHeight + 50;
                toX = Math.random() * viewportWidth * 0.9 - viewportWidth * 0.05 - fromX;
                toY = Math.random() * viewportHeight * 0.9 - viewportHeight * 0.05 - fromY;
            } else { // 左から
                fromX = -50;
                fromY = Math.random() * viewportHeight;
                toX = Math.random() * viewportWidth * 0.9 - viewportWidth * 0.05 - fromX;
                toY = Math.random() * viewportHeight * 0.9 - viewportHeight * 0.05 - fromY;
            }
            
            char.style.left = `${fromX}px`;
            char.style.top = `${fromY}px`;

            char.style.setProperty('--from-x', '0px');
            char.style.setProperty('--from-y', '0px');
            char.style.setProperty('--to-x', `${toX}px`);
            char.style.setProperty('--to-y', `${toY}px`);
            char.style.setProperty('--rot', `${Math.random() * 720 - 360}deg`);

            const duration = Math.random() * 2 + 1.5; 
            char.style.animation = `continuousThrow ${duration}s ease-out forwards`;

            textBlastContainer.appendChild(char);

            char.addEventListener('animationend', () => {
                char.remove();
            });
        }
    }


    // 継続的な文字・パーティクル生成ロジック (前回と同じ)
    function startContinuousThrowing() {
        if (throwIntervalId) return; 

        throwIntervalId = setInterval(() => {
            if (!isMotivationActive) {
                stopContinuousThrowing();
                return;
            }

            createThrowingText(5); 

            const w = window.innerWidth;
            const h = window.innerHeight;

            const throwPoints = [
                { x: 0, y: 0, angle: 45 },      
                { x: w, y: 0, angle: 135 },     
                { x: w, y: h, angle: 225 },     
                { x: 0, y: h, angle: 315 }      
            ];

            const point = throwPoints[Math.floor(Math.random() * 4)];
            createThrowingParticles(50, point.x, point.y, point.angle * (Math.PI / 180));

        }, 200); 
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

            startBGM(); // ★ BGMを開始 ★

            body.classList.add('motivation-active');
            motivationDisplay.classList.add('active'); 
            motivationDisplay.textContent = '🔥🔥 やる気、超爆発！！ 全てをやり遂げろ！ 🔥🔥';

            if (!animationFrameId) {
                animateParticles();
            }
            startContinuousThrowing();

        } else {
            // === やる気 OFF の演出 ===
            switchButton.classList.remove('on');
            switchButton.classList.add('off');
            switchIndicator.textContent = 'やる気 OFF'; 

            stopBGM(); // ★ BGMを停止 ★

            body.classList.remove('motivation-active');
            motivationDisplay.classList.remove('active'); 
            motivationDisplay.textContent = '押して、やる気を爆発させろ！';

            stopContinuousThrowing();
        }
    }

    // スイッチボタンにクリックイベントを追加
    switchButton.addEventListener('click', toggleMotivation);
});