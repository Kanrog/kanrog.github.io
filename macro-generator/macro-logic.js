/**
 * KLIPPER MACRO GENERATOR - LOGIC ENGINE
 * VERSION: THEME-COMPATIBLE VISUALIZER 2026.01.12
 */

const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');

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
    const kin = document.getElementById('kin').value;
    const x = parseFloat(document.getElementById('maxX').value) || 235;
    const y = parseFloat(document.getElementById('maxY').value) || 235;
    const m = parseFloat(document.getElementById('margin').value) || 20;
    const pTemp = parseFloat(document.getElementById('printTemp').value) || 0;
    const bTemp = parseFloat(document.getElementById('bedTemp').value) || 0;

    // Safety Logic
    let blockGeneration = false;
    const mInput = document.getElementById('margin'), mErr = document.getElementById('err-margin');
    const pInput = document.getElementById('printTemp'), pErr = document.getElementById('err-printTemp');
    const bInput = document.getElementById('bedTemp'), bErr = document.getElementById('err-bedTemp');

    let mBad = (kin === 'delta') ? (m >= (x/2 - 10)) : ((x - m*2) <= 10 || (y - m*2) <= 10);
    if (mBad) { blockGeneration = true; mInput.classList.add('input-error'); mErr.classList.remove('hidden'); }
    else { mInput.classList.remove('input-error'); mErr.classList.add('hidden'); }

    pInput.classList.remove('input-error', 'input-warning'); pErr.classList.add('hidden');
    if (pTemp < 170 || pTemp > 300) { blockGeneration = true; pInput.classList.add('input-error'); pErr.classList.remove('hidden'); }
    
    bInput.classList.remove('input-error', 'input-warning'); bErr.classList.add('hidden');
    if (bTemp > 120) { blockGeneration = true; bInput.classList.add('input-error'); bErr.classList.remove('hidden'); }

    document.getElementById('generateBtn').disabled = blockGeneration;

    // --- VISUALIZER DRAWING ---
    ctx.clearRect(0, 0, 300, 200);
    const scale = 120 / Math.max(x, y);
    const cx = 150, cy = 100;

    // 1. Draw Bed (Light Gray for contrast)
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    if (kin === 'delta') {
        ctx.beginPath();
        ctx.arc(cx, cy, (x / 2) * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    } else {
        ctx.fillRect(cx - (x / 2) * scale, cy - (y / 2) * scale, x * scale, y * scale);
        ctx.strokeRect(cx - (x / 2) * scale, cy - (y / 2) * scale, x * scale, y * scale);
    }

    // 2. Draw Safe Zone (Purple to match your site)
    ctx.strokeStyle = "#9b59b6";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    if (kin === 'delta') {
        ctx.arc(cx, cy, (x / 2 - m) * scale, 0, Math.PI * 2);
    } else {
        ctx.rect(cx - (x / 2 - m) * scale, cy - (y / 2 - m) * scale, (x - m * 2) * scale, (y - m * 2) * scale);
    }
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // 3. Draw Home Point (Bright Red)
    ctx.fillStyle = "#ff4d4d";
    ctx.beginPath();
    if (kin === 'delta') {
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    } else {
        // Home is bottom-left (front-left) for bedslingers/CoreXY
        ctx.arc(cx - (x / 2) * scale, cy + (y / 2) * scale, 4, 0, Math.PI * 2);
    }
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

    // Call Template Engine
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
    navigator.clipboard.writeText(code).then(() => {
        alert("Configuration copied to clipboard!");
    });
}

// Initial Run
window.onload = function() {
    updateMaterialPresets();
    updateUI();
};
