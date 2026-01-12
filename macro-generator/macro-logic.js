/**
 * KLIPPER MACRO GENERATOR - LOGIC ENGINE
 * VERSION: FINAL THEME-FIXED 2026.01.12
 */

const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');

/**
 * Updates temperature inputs based on material selection
 */
function updateMaterialPresets() {
    const mat = document.getElementById('material').value;
    const pInput = document.getElementById('printTemp');
    const bInput = document.getElementById('bedTemp');
    
    if (mat === "PLA") { pInput.value = 210; bInput.value = 60; }
    else if (mat === "PETG") { pInput.value = 240; bInput.value = 80; }
    else if (mat === "ABS") { pInput.value = 250; bInput.value = 100; }
    else if (mat === "TPU") { pInput.value = 230; bInput.value = 50; }
}

/**
 * Handles UI updates, validation, and canvas drawing
 */
function updateUI() {
    // 1. GATHER INPUTS
    const kin = document.getElementById('kin').value;
    const x = parseFloat(document.getElementById('maxX').value) || 235;
    const y = parseFloat(document.getElementById('maxY').value) || 235;
    const m = parseFloat(document.getElementById('margin').value) || 20;
    const pTemp = parseFloat(document.getElementById('printTemp').value) || 0;
    const bTemp = parseFloat(document.getElementById('bedTemp').value) || 0;

    let blockGeneration = false;
    
    // UI Elements for validation feedback
    const mInput = document.getElementById('margin'), mErr = document.getElementById('err-margin');
    const pInput = document.getElementById('printTemp'), pErr = document.getElementById('err-printTemp');
    const bInput = document.getElementById('bedTemp'), bErr = document.getElementById('err-bedTemp');

    // 2. SAFETY VALIDATION
    // Margin Check
    let mBad = (kin === 'delta') ? (m >= (x/2 - 10)) : ((x - m*2) <= 10 || (y - m*2) <= 10);
    if (mBad) { 
        blockGeneration = true; 
        mInput.classList.add('input-error'); 
        mErr.classList.remove('hidden'); 
    } else { 
        mInput.classList.remove('input-error'); 
        mErr.classList.add('hidden'); 
    }

    // Nozzle Temp Check (PTFE vs All-Metal)
    pInput.classList.remove('input-error', 'input-warning');
    pErr.classList.add('hidden');
    if (pTemp < 170 || pTemp > 300) { 
        blockGeneration = true; 
        pInput.classList.add('input-error'); 
        pErr.innerHTML = "Invalid Extrusion Temp";
        pErr.classList.remove('hidden'); 
    } else if (pTemp > 260) {
        pInput.classList.add('input-warning');
        pErr.className = "warning-text";
        pErr.innerHTML = pTemp > 290 ? "Specialized Nozzle Required" : "PTFE Liner Risk";
        pErr.classList.remove('hidden');
    }

    // Bed Temp Check (Magnet Safety)
    bInput.classList.remove('input-error', 'input-warning');
    bErr.classList.add('hidden');
    if (bTemp > 120) { 
        blockGeneration = true; 
        bInput.classList.add('input-error'); 
        bErr.innerHTML = "Unsafe Bed Temp";
        bErr.classList.remove('hidden'); 
    } else if (bTemp > 85) {
        bInput.classList.add('input-warning');
        bErr.className = "warning-text";
        bErr.innerHTML = "Magnet Demagnetization Risk";
        bErr.classList.remove('hidden');
    }

    document.getElementById('generateBtn').disabled = blockGeneration;

    // 3. CANVAS VISUALIZER (HIGH CONTRAST)
    // Fill background with dark gray to ensure visibility
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scale = 120 / Math.max(x, y);
    const cx = 150, cy = 100;

    // Draw Bed
    ctx.fillStyle = "#2a2a2a";
    ctx.strokeStyle = "#9b59b6"; // Primary Purple
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

    // Draw Margin / Safe Zone
    ctx.strokeStyle = "#bb8fce"; // Light Purple
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    if (kin === 'delta') {
        ctx.arc(cx, cy, (x / 2 - m) * scale, 0, Math.PI * 2);
    } else {
        ctx.rect(cx - (x / 2 - m) * scale, cy - (y / 2 - m) * scale, (x - m * 2) * scale, (y - m * 2) * scale);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Home Position
    ctx.fillStyle = "#ff4d4d";
    ctx.beginPath();
    if (kin === 'delta') {
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    } else {
        ctx.arc(cx - (x / 2) * scale, cy + (y / 2) * scale, 5, 0, Math.PI * 2);
    }
    ctx.fill();
}

/**
 * Generates the G-Code blocks
 */
function generateMacros() {
    const kin = document.getElementById('kin').value;
    const x = document.getElementById('maxX').value;
    const y = document.getElementById('maxY').value;
    const m = document.getElementById('margin').value;
    const pTemp = document.getElementById('printTemp').value;
    const bTemp = document.getElementById('bedTemp').value;
    const probe = document.getElementById('probeType').value;
    const zTilt = document.getElementById('useZTilt').value === 'true';

    // Construct the configuration string
    let output = GCODE_TEMPLATES.header(kin, x, y, 250, m);
    output += GCODE_TEMPLATES.user_vars(x/2, y/2, 240, 450, m, pTemp, bTemp, "Custom", 2000, 255);
    output += GCODE_TEMPLATES.diagnostics(kin, probe, zTilt);
    output += GCODE_TEMPLATES.core_ops(kin, true, "X20 Y20", "X60 Y20", "parallel", "Custom", probe, zTilt);
    output += GCODE_TEMPLATES.utility(false, probe, bTemp);

    document.getElementById('gcodeOutput').innerText = output;
    document.getElementById('outputCard').classList.remove('hidden');
    document.getElementById('outputCard').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Utility functions
 */
function copyToClipboard() {
    const code = document.getElementById('gcodeOutput').innerText;
    navigator.clipboard.writeText(code).then(() => {
        alert("Macro configuration copied!");
    });
}

function setCustomMaterial() {
    document.getElementById('material').value = "Custom";
}

// Start visualizer on load
window.onload = function() {
    updateMaterialPresets();
    updateUI();
};
