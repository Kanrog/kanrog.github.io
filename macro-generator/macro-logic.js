/**
 * KLIPPER MACRO GENERATOR - LOGIC ENGINE
 * VERSION: BULLETPROOF VISUALIZER 2026.01.12
 */

// Global access to canvas elements
let canvas, ctx;

function initCanvas() {
    canvas = document.getElementById('previewCanvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
        // Force internal dimensions to match display dimensions
        canvas.width = 300;
        canvas.height = 200;
    }
}

function updateMaterialPresets() {
    const mat = document.getElementById('material').value;
    const pInput = document.getElementById('printTemp');
    const bInput = document.getElementById('bedTemp');
    if (mat === "PLA") { pInput.value = 210; bInput.value = 60; }
    else if (mat === "PETG") { pInput.value = 240; bInput.value = 80; }
    else if (mat === "ABS") { pInput.value = 250; bInput.value = 100; }
    else if (mat === "TPU") { pInput.value = 230; bInput.value = 50; }
}

function updateUI() {
    if (!ctx) initCanvas();
    if (!ctx) return; // Exit if canvas still isn't found

    const kin = document.getElementById('kin').value;
    const x = parseFloat(document.getElementById('maxX').value) || 235;
    const y = parseFloat(document.getElementById('maxY').value) || 235;
    const m = parseFloat(document.getElementById('margin').value) || 20;

    // Validation styling logic
    const mInput = document.getElementById('margin'), mErr = document.getElementById('err-margin');
    let mBad = (kin === 'delta') ? (m >= (x/2 - 10)) : ((x - m*2) <= 10 || (y - m*2) <= 10);
    
    if (mBad) { mInput.classList.add('input-error'); mErr.classList.remove('hidden'); }
    else { mInput.classList.remove('input-error'); mErr.classList.add('hidden'); }

    // --- DRAWING ROUTINE ---
    // Fill background with a very obvious color to prove it's working
    ctx.fillStyle = "#111111"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scale = 120 / Math.max(x, y);
    const cx = 150, cy = 100;

    // Bed Surface
    ctx.fillStyle = "#2a2a2a";
    ctx.strokeStyle = "#9b59b6"; 
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

    // Safety Margin
    ctx.strokeStyle = "#ffffff";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    if (kin === 'delta') {
        ctx.arc(cx, cy, (x / 2 - m) * scale, 0, Math.PI * 2);
    } else {
        ctx.rect(cx - (x / 2 - m) * scale, cy - (y / 2 - m) * scale, (x - m * 2) * scale, (y - m * 2) * scale);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Home Point
    ctx.fillStyle = "#ff4d4d";
    ctx.beginPath();
    if (kin === 'delta') { ctx.arc(cx, cy, 6, 0, Math.PI * 2); }
    else { ctx.arc(cx - (x / 2) * scale, cy + (y / 2) * scale, 6, 0, Math.PI * 2); }
    ctx.fill();
}

function generateMacros() {
    const kin = document.getElementById('kin').value;
    const x = document.getElementById('maxX').value;
    const y = document.getElementById('maxY').value;
    const m = document.getElementById('margin').value;
    const pTemp = document.getElementById('printTemp').value;
    const bTemp = document.getElementById('bedTemp').value;
    const probe = document.getElementById('probeType').value;
    const zTilt = document.getElementById('useZTilt').value === 'true';

    let output = GCODE_TEMPLATES.header(kin, x, y, 250, m);
    output += GCODE_TEMPLATES.user_vars(x/2, y/2, 240, 450, m, pTemp, bTemp, "Custom", 2000, 255);
    output += GCODE_TEMPLATES.diagnostics(kin, probe, zTilt);
    output += GCODE_TEMPLATES.core_ops(kin, true, "X20 Y20", "X60 Y20", "parallel", "Custom", probe, zTilt);
    output += GCODE_TEMPLATES.utility(false, probe, bTemp);

    document.getElementById('gcodeOutput').innerText = output;
    document.getElementById('outputCard').classList.remove('hidden');
}

function copyToClipboard() {
    const code = document.getElementById('gcodeOutput').innerText;
    navigator.clipboard.writeText(code).then(() => alert("Copied!"));
}

window.onload = function() {
    initCanvas();
    updateMaterialPresets();
    updateUI();
};
