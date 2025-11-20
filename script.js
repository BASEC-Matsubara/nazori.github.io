document.addEventListener('DOMContentLoaded', () => {
    const canvasContainer = document.getElementById('canvas-container');
    const switchBtn = document.getElementById('switch-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const clearBtn = document.getElementById('clear-btn');
    const speakBtn = document.getElementById('speak-btn');
    const charInfo = document.getElementById('char-info');

    const ROW_NAMES = ['あ行', 'か行', 'さ行', 'た行', 'な行', 'は行', 'ま行', 'や行', 'ら行', 'わ行'];
    const ROW_NAMES_SPOKEN = ['あぎょう', 'かぎょう', 'さぎょう', 'たぎょう', 'なぎょう', 'はぎょう', 'まぎょう', 'やぎょう', 'らぎょう', 'わぎょう'];

    const HIRAGANA_ROWS = [
        ['あ', 'い', 'う', 'え', 'お'], ['か', 'き', 'く', 'け', 'こ'], ['さ', 'し', 'す', 'せ', 'そ'],
        ['た', 'ち', 'つ', 'て', 'と'], ['な', 'に', 'ぬ', 'ね', 'の'], ['は', 'ひ', 'ふ', 'へ', 'ほ'],
        ['ま', 'み', 'む', 'め', 'も'], ['や', 'ゆ', 'よ'], ['ら', 'り', 'る', 'れ', 'ろ'], ['わ', 'を', 'ん']
    ];
    const KATAKANA_ROWS = [
        ['ア', 'イ', 'ウ', 'エ', 'オ'], ['カ', 'キ', 'ク', 'ケ', 'コ'], ['サ', 'シ', 'ス', 'セ', 'ソ'],
        ['タ', 'チ', 'ツ', 'テ', 'ト'], ['ナ', 'ニ', 'ヌ', 'ネ', 'ノ'], ['ハ', 'ヒ', 'フ', 'ヘ', 'ホ'],
        ['マ', 'ミ', 'ム', 'メ', 'モ'], ['ヤ', 'ユ', 'ヨ'], ['ラ', 'リ', 'ル', 'レ', 'ロ'], ['ワ', 'ヲ', 'ン']
    ];
    
    const rowSets = [HIRAGANA_ROWS, KATAKANA_ROWS];
    let currentSetIndex = 0;
    let rowIndex = 0;

    // Manages state for the currently active canvas
    let activeDrawingState = null;

    function speak(text) {
        if (!('speechSynthesis' in window)) {
            alert('お使いのブラウザは音声読み上げに対応していません。');
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ja-JP';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    }

    function displayRow() {
        // Clear previous canvases
        canvasContainer.innerHTML = '';
        const currentRows = rowSets[currentSetIndex];
        const row = currentRows[rowIndex];
        
        // Calculate canvas size
        const containerWidth = document.getElementById('drill-container').clientWidth;
        const gap = 10;
        const minCanvasWidth = 190; // Enforce minimum size
        const maxCanvasWidth = 200;
        
        // Calculate ideal size and then clamp it between min and max
        let canvasSize = (containerWidth - (row.length - 1) * gap) / row.length;
        canvasSize = Math.max(minCanvasWidth, Math.min(canvasSize, maxCanvasWidth));

        // Create a canvas for each character
        row.forEach(char => {
            const canvas = document.createElement('canvas');
            canvas.className = 'trace-canvas';
            canvas.width = canvasSize;
            canvas.height = canvasSize;
            canvas.dataset.char = char; // Store character in data attribute
            canvasContainer.appendChild(canvas);

            const ctx = canvas.getContext('2d');
            drawGuideCharacter(ctx, char, canvas.width, canvas.height);
            
            // Attach event listeners to each canvas
            canvas.addEventListener('mousedown', startDrawing);
            canvas.addEventListener('touchstart', startDrawing);
        });

        charInfo.textContent = `${currentSetIndex === 0 ? 'ひらがな' : 'カタカナ'} - ${ROW_NAMES[rowIndex]}`;
    }
    
    function drawGuideCharacter(ctx, char, width, height) {
        const guideColor = getComputedStyle(document.documentElement).getPropertyValue('--guide-char-color').trim();
        ctx.fillStyle = guideColor || '#e0e0e0';
        ctx.font = `${width * 0.8}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(char, width / 2, height / 2);
    }

    function getCoords(e, canvas) {
        const rect = canvas.getBoundingClientRect();
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
        }
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function startDrawing(e) {
        e.preventDefault();
        const canvas = e.target;
        const coords = getCoords(e, canvas);
        activeDrawingState = {
            isDrawing: true,
            hasDragged: false,
            canvas: canvas,
            ctx: canvas.getContext('2d'),
            lastX: coords.x,
            lastY: coords.y
        };
    }

    function draw(e) {
        if (!activeDrawingState || !activeDrawingState.isDrawing) return;
        e.preventDefault();
        activeDrawingState.hasDragged = true;
        
        const { canvas, ctx } = activeDrawingState;
        const coords = getCoords(e, canvas);
        
        const drawColor = getComputedStyle(document.documentElement).getPropertyValue('--draw-color').trim();
        ctx.strokeStyle = drawColor || '#000000';
        ctx.lineWidth = Math.max(canvas.width / 25, 4);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(activeDrawingState.lastX, activeDrawingState.lastY);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        
        activeDrawingState.lastX = coords.x;
        activeDrawingState.lastY = coords.y;
    }

    function stopDrawing(e) {
        if (!activeDrawingState) return;

        if (!activeDrawingState.hasDragged) {
            const char = activeDrawingState.canvas.dataset.char;
            if (char) {
                speak(char);
            }
        }
        activeDrawingState = null; // End drawing session
    }

    function handleSwitch() {
        currentSetIndex = (currentSetIndex + 1) % rowSets.length;
        rowIndex = 0;
        switchBtn.textContent = currentSetIndex === 0 ? 'カタカナにする' : 'ひらがなにする';
        displayRow();
        speak(ROW_NAMES_SPOKEN[rowIndex]);
    }

    function handlePrev() {
        const currentRows = rowSets[currentSetIndex];
        rowIndex = (rowIndex - 1 + currentRows.length) % currentRows.length;
        displayRow();
        speak(ROW_NAMES_SPOKEN[rowIndex]);
    }

    function handleNext() {
        const currentRows = rowSets[currentSetIndex];
        rowIndex = (rowIndex + 1) % currentRows.length;
        displayRow();
        speak(ROW_NAMES_SPOKEN[rowIndex]);
    }

    // Global listeners for mouse move/up to handle drawing outside canvas
    window.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDrawing);
    window.addEventListener('touchmove', draw, { passive: false });
    window.addEventListener('touchend', stopDrawing);

    switchBtn.addEventListener('click', handleSwitch);
    prevBtn.addEventListener('click', handlePrev);
    nextBtn.addEventListener('click', handleNext);
    clearBtn.addEventListener('click', displayRow); // Re-creates the canvases, effectively clearing them

    speakBtn.addEventListener('click', () => {
        speak(ROW_NAMES_SPOKEN[rowIndex]);
    });

    window.addEventListener('resize', displayRow);

    // Initial setup
    displayRow();
});
