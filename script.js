document.addEventListener('DOMContentLoaded', () => {
    // 必要なDOM要素を取得
    const switchButton = document.getElementById('motivationSwitch');
    const switchIndicator = switchButton.querySelector('.indicator');
    const motivationDisplay = document.getElementById('motivationDisplay');
    const body = document.body;
    const textBlastContainer = document.getElementById('textBlastContainer');

    // Web Audio APIのコンテキストを初期化 (ユーザーアクション後に作成する必要があるため、遅延して初期化)
    let audioContext = null; 
    let noiseSource = null; // 継続的なノイズ音源用

    // --- Web Audio APIによる音の生成 ---

    function initAudioContext() {
        if (!audioContext) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContext = new AudioContext();
        }
    }

    // スイッチON時の「ドッカーン！」音を生成 (音量を小さく調整)
    function playExplosionSound() {
        initAudioContext();
        if (!audioContext) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        // 強いノイズ音 (周波数スイープ)
        oscillator.type = 'sawtooth'; 
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.05);
        oscillator.frequency.exponentialRampToValueAtTime(1, audioContext.currentTime + 0.3); 

        // 音量 (前回1.0から0.3に下げ、急激な減衰)
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime); 
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);

        // 接続
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // 再生開始と停止
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
    }

    // スイッチOFF時の「カチッ」音を生成 (音量を小さく調整)
    function playClickSound() {
        initAudioContext();
        if (!audioContext) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        // 短い矩形波
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);

        // 音量 (前回0.5から0.2に下げ)
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime); 
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);

        // 接続
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // 再生開始と停止
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.05);
    }
    
    // 継続的なホワイトノイズを再生する関数
    function startContinuousNoise() {
        initAudioContext();
        if (!audioContext || noiseSource) return;

        // 1. ノイズバッファの生成 (ホワイトノイズ)
        const bufferSize = audioContext.sampleRate * 2; // 2秒
        const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1; // -1.0から1.0のランダムな値
        }

        // 2. 音源の作成
        noiseSource = audioContext.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        noiseSource.loop = true; // ループ再生

        // 3. 音量制御ノード
        const noiseGain = audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.03, audioContext.currentTime); // 非常に小さな音量に設定

        // 4. 接続と再生
        noiseSource.connect(noiseGain);
        noiseGain.connect(audioContext.destination);
        noiseSource.start();
    }

    // 継続的なノイズを停止する関数
    function stopContinuousNoise() {
        if (noiseSource) {
            // フェードアウトさせてから停止
            noiseSource.stop(audioContext.currentTime + 0.1); 
            noiseSource = null;
        }
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

    // Particleクラスの定義 (省略 - 変更なし)
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

    // --- 大量の文字アニメーション関連の処理 ---

    const motivationWords = [
        "やる気", "覚醒", "爆発", "限界突破", "進化", "最強", "無限", "挑戦",
        "勝利", "成功", "未来", "希望", "輝け", "進め", "GO!", "YES!", "DREAM", "POWER"
    ];

    // 文字を画面外から投げ込む関数 (前回と同じ)
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

            playExplosionSound(); // ドッカーン音を生成
            startContinuousNoise(); // ★ 継続的なノイズを開始 ★

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
            stopContinuousNoise(); // ★ 継続的なノイズを停止 ★

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