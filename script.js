document.addEventListener('DOMContentLoaded', () => {
    // 必要なDOM要素を取得
    const switchButton = document.getElementById('motivationSwitch');
    const switchIndicator = switchButton.querySelector('.indicator');
    const motivationDisplay = document.getElementById('motivationDisplay');
    const body = document.body;
    const textBlastContainer = document.getElementById('textBlastContainer');

    // Web Audio APIのコンテキストを初期化 (ユーザーアクション後に作成する必要があるため、遅延して初期化)
    let audioContext = null; 

    // --- Web Audio APIによる音の生成 ---

    function initAudioContext() {
        if (!audioContext) {
             // 互換性のためのプレフィックス対応
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContext = new AudioContext();
        }
    }

    // スイッチON時の「ドッカーン！」音を生成
    function playExplosionSound() {
        initAudioContext();
        if (!audioContext) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        // 強いノイズ音 (周波数スイープ)
        oscillator.type = 'sawtooth'; // ノコギリ波
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.05);
        oscillator.frequency.exponentialRampToValueAtTime(1, audioContext.currentTime + 0.3); // 急激に周波数を下げてノイズ感を出す

        // 音量 (急激な減衰)
        gainNode.gain.setValueAtTime(1.0, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);

        // 接続
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // 再生開始と停止
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
    }

    // スイッチOFF時の「カチッ」音を生成
    function playClickSound() {
        initAudioContext();
        if (!audioContext) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        // 短い矩形波
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);

        // 音量
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);

        // 接続
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // 再生開始と停止
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.05);
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

    // パーティクルを生成する関数 (爆発力強化！)
    function createThrowingParticles(count, originX, originY, angle) {
        for (let i = 0; i < count; i++) {
            const colors = ['#FFD700', '#FF4500', '#ADFF2F', '#87CEEB', '#FF69B4', '#FFFFFF'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 8 + 3; // サイズを大きく
            
            // 投げ込みの方向を決定（角度±40度の範囲に拡大）
            const randomAngle = angle + (Math.random() * 80 - 40) * (Math.PI / 180); 
            const speed = Math.random() * 15 + 10; // 速度を大幅にアップ！
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

    // --- 大量の文字アニメーション関連の処理 ---

    const motivationWords = [
        "やる気", "覚醒", "爆発", "限界突破", "進化", "最強", "無限", "挑戦",
        "勝利", "成功", "未来", "希望", "輝け", "進め", "GO!", "YES!", "DREAM", "POWER"
    ];

    // 文字を画面外から投げ込む関数 (到達範囲拡大)
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

            // 画面外のランダムな位置を開始点に設定
            if (side === 0) { // 上から
                fromX = Math.random() * viewportWidth;
                fromY = -50;
                // 到達目標を画面全体（90%）に設定
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

            // CSS変数としてアニメーションに渡す
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


    // 継続的な文字・パーティクル生成ロジック
    function startContinuousThrowing() {
        if (throwIntervalId) return; 

        // 0.2秒に短縮し、より頻繁に生成
        throwIntervalId = setInterval(() => {
            if (!isMotivationActive) {
                stopContinuousThrowing();
                return;
            }

            createThrowingText(5); // 毎度5個の文字を生成に増加

            const w = window.innerWidth;
            const h = window.innerHeight;

            // 画面四隅と方向 (0度:右, 90度:下, 180度:左, 270度:上)
            const throwPoints = [
                { x: 0, y: 0, angle: 45 },      
                { x: w, y: 0, angle: 135 },     
                { x: w, y: h, angle: 225 },     
                { x: 0, y: h, angle: 315 }      
            ];

            const point = throwPoints[Math.floor(Math.random() * 4)];
            createThrowingParticles(50, point.x, point.y, point.angle * (Math.PI / 180)); // 毎度50個に増加

        }, 200); // 200ミリ秒間隔で実行に短縮
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

            playExplosionSound(); // ドッカーン音を生成

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

            playClickSound(); // カチッ音を生成

            body.classList.remove('motivation-active');
            motivationDisplay.classList.remove('active'); 
            motivationDisplay.textContent = '押して、やる気を爆発させろ！';

            stopContinuousThrowing();
        }
    }

    // スイッチボタンにクリックイベントを追加
    switchButton.addEventListener('click', toggleMotivation);
    
    // 初回クリック時にWeb Audio Contextを初期化 (iOSなどの制約対応)
    switchButton.addEventListener('touchstart', initAudioContext, {once: true});
    switchButton.addEventListener('mousedown', initAudioContext, {once: true});
});