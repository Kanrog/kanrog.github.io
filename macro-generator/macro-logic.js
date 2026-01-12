/**
 * KLIPPER MACRO GENERATOR - LOGIC ENGINE
 * VERSION: REPAIRED VISUALIZER 2026.01.12
 */

let canvas, ctx;

function initCanvas() {
    canvas = document.getElementById('previewCanvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
    }
}

function updateUI() {
    if (!ctx) initCanvas();
    if (!ctx) return;

    const kin = document.getElementById('kin').value;
    const x = parseFloat(document.getElementById('maxX').value) || 235;
    const y = parseFloat(document.getElementById('maxY').value) || 235;
    const pTemp = parseFloat(document.getElementById('printTemp').value) || 0;

    // Safety validation
    const pInput = document.getElementById('printTemp');
    const pErr = document.getElementById('err-printTemp');
    if (pTemp < 170 || pTemp > 300) {
        pInput.style.borderColor = "#e74c3c";
        pErr.classList.remove('hidden');
    } else {
        pInput.style.borderColor = "";
        pErr.classList.add('hidden');
    }

    // --- DRAWING ---
    // 1. Reset
    ctx.fillStyle = "#111111"; // Internal canvas bg
    ctx.fillRect(0, 0, 300, 200);

    const scale = 120 / Math.max(x, y);
    const cx = 150, cy = 100;

    // 2. Draw Bed (Kanrog Purple)
    ctx.strokeStyle = "#9b59b6"; 
    ctx.fillStyle = "rgba(155, 89, 182, 0.2)";
    ctx.lineWidth = 2;

    if (kin === 'delta') {
        ctx.beginPath();
        ctx.arc(cx, cy, (x / 2) * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    } else {
        ctx.fillRect(cx - (x / 2) * scale, cy - (y / 2) * scale, x * scale, y * scale);
        ctx.strokeRect(cx - (x / 2) * scale, cy - (y / 2) * scale, x * scale, y * scale);
    }

    // 3. Draw Home (Bright Red)
    ctx.fillStyle = "#ff4d4d";
    ctx.beginPath();
    if (kin === 'delta') {
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    } else {
        ctx.arc(cx - (x / 2) * scale, cy + (y / 2) * scale, 6, 0, Math.PI * 2);
    }
    ctx.fill();
}

function generateMacros() {
    const kin = document.getElementById('kin').value;
    const x = document.getElementById('maxX').value;
    const y = document.getElementById('maxY').value;
    const pTemp = document.getElementById('printTemp').value;
    const zTilt = document.getElementById('useZTilt').value === 'true';

    // Mock Template Call
    let output = GCODE_TEMPLATES.header(kin, x, y, 250, 20);
    output += GCODE_TEMPLATES.user_vars(x/2, y/2, 240, 450, 20, pTemp, 60, "Custom", 2000, 255);
    output += GCODE_TEMPLATES.diagnostics(kin, "none", zTilt);
    output += GCODE_TEMPLATES.core_ops(kin, true, "X20 Y20", "X60 Y20", "parallel", "Custom", "none", zTilt);

    document.getElementById('gcodeOutput').innerText = output;
    document.getElementById('outputCard').classList.remove('hidden');
}

window.onload = function() {
    initCanvas();
    updateUI();
};
