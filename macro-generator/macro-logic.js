/**
 * KLIPPER MACRO GENERATOR - LOGIC ENGINE
 * VERSION: FINAL 2026.01.12
 */

let canvas, ctx;

function initCanvas() {
    canvas = document.getElementById('previewCanvas');
    if (canvas) { 
        ctx = canvas.getContext('2d'); 
        canvas.width = 300; 
        canvas.height = 200; 
    }
}

function resetDefaults() {
    document.getElementById('kin').value = "bedslinger";
    document.getElementById('maxX').value = 235;
    document.getElementById('maxY').value = 235;
    document.getElementById('margin').value = 20;
    document.getElementById('material').value = "PLA";
    document.getElementById('ledName').value = "status_leds";
    document.getElementById('useLED').value = "true";
    document.getElementById('tortureLevel').value = "standard";
    document.getElementById('probeType').value = "none";
    document.getElementById('useZTilt').value = "false";
    updateMaterialPresets();
    updateUI();
    document.getElementById('outputCard').classList.add('hidden');
}

function updateMaterialPresets() {
    const mat = document.getElementById('material').value;
    const pInput = document.getElementById('printTemp'), bInput = document.getElementById('bedTemp');
    if (mat === "PLA") { pInput.value = 210; bInput.value = 60; }
    else if (mat === "PETG") { pInput.value = 240; bInput.value = 80; }
    else if (mat === "ABS") { pInput.value = 250; bInput.value = 100; }
    else if (mat === "TPU") { pInput.value = 230; bInput.value = 50; }
}

function setCustomMaterial() { document.getElementById('material').value = "Custom"; }

function updateUI() {
    if (!ctx) initCanvas();
    const kin = document.getElementById('kin').value;
    const x = parseFloat(document.getElementById('maxX').value) || 235;
    const y = parseFloat(document.getElementById('maxY').value) || 235;
    const m = parseFloat(document.getElementById('margin').value) || 20;
    const pT = parseFloat(document.getElementById('printTemp').value) || 0;
    const bT = parseFloat(document.getElementById('bedTemp').value) || 0;

    let block = false;
    const mErr = document.getElementById('err-margin');
    const pInput = document.getElementById('printTemp'), pErr = document.getElementById('err-printTemp');
    const bInput = document.getElementById('bedTemp'), bErr = document.getElementById('err-bedTemp');

    // Reset Safety States
    pInput.classList.remove('input-error', 'input-warning');
    bInput.classList.remove('input-error', 'input-warning');
    pErr.classList.add('hidden'); bErr.classList.add('hidden');
    pErr.className = "error-text"; bErr.className = "error-text";
    pErr.innerHTML = ""; bErr.innerHTML = "";

    // Validation logic
    let mBad = (kin === 'delta') ? (m >= (x/2 - 10)) : ((x - m*2) <= 10 || (y - m*2) <= 10);
    mErr.classList.toggle('hidden', !mBad);
    if(mBad) block = true;

    if (pT < 170 || pT > 305) { pErr.innerHTML = "Invalid Printing Temp!"; pErr.classList.remove('hidden'); pInput.classList.add('input-error'); block = true; }
    else if (pT > 290) { pErr.innerHTML = "All-Metal Hotend Required"; pErr.className = "warning-text"; pErr.classList.remove('hidden'); pInput.classList.add('input-warning'); }
    else if (pT > 260) { pErr.innerHTML = "PTFE Liner Danger Zone"; pErr.className = "warning-text"; pErr.classList.remove('hidden'); pInput.classList.add('input-warning'); }

    if (bT < 0 || bT > 125) { bErr.innerHTML = "Unsafe Bed Temp!"; bErr.classList.remove('hidden'); bInput.classList.add('input-error'); block = true; }
    else if (bT > 85) { bErr.innerHTML = "Magnet Demagnetization Risk"; bErr.className = "warning-text"; bErr.classList.remove('hidden'); bInput.classList.add('input-warning'); }

    document.getElementById('generateBtn').disabled = block;

    // Drawing
    ctx.fillStyle = "#111111"; ctx.fillRect(0, 0, 300, 200);
    const scale = 120 / Math.max(x, y), cx = 150, cy = 100;

    ctx.strokeStyle = "#9b59b6"; ctx.fillStyle = "rgba(155, 89, 182, 0.15)"; ctx.lineWidth = 2;
    if (kin === 'delta') { ctx.beginPath(); ctx.arc(cx, cy, (x/2)*scale, 0, Math.PI*2); ctx.fill(); ctx.stroke(); }
    else { ctx.fillRect(cx - (x/2)*scale, cy - (y/2)*scale, x*scale, y*scale); ctx.strokeRect(cx - (x/2)*scale, cy - (y/2)*scale, x*scale, y*scale); }

    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"; ctx.setLineDash([5, 5]); ctx.beginPath();
    if (kin === 'delta') { ctx.arc(cx, cy, (x/2 - m)*scale, 0, Math.PI * 2); }
    else { ctx.rect(cx - (x/2 - m)*scale, cy - (y/2 - m)*scale, (x - m*2)*scale, (y - m*2)*scale); }
    ctx.stroke(); ctx.setLineDash([]);

    // Purge Line
    ctx.strokeStyle = "#ff00ff"; ctx.lineWidth = 3; ctx.beginPath();
    if (kin === 'delta') { ctx.moveTo(cx - 20 * scale, cy + (y/2 - m) * scale); ctx.lineTo(cx + 20 * scale, cy + (y/2 - m) * scale); }
    else { ctx.moveTo(cx - (x/2 - m) * scale, cy + (y/2 - m) * scale); ctx.lineTo(cx - (x/2 - m - 50) * scale, cy + (y/2 - m) * scale); }
    ctx.stroke();

    ctx.fillStyle = "#ff4d4d"; ctx.beginPath();
    if (kin === 'delta') { ctx.arc(cx, cy, 6, 0, Math.PI*2); }
    else { ctx.arc(cx - (x/2)*scale, cy + (y/2)*scale, 6, 0, Math.PI*2); }
    ctx.fill();
}

function downloadMacros() {
    const code = document.getElementById('gcodeOutput').innerText;
    if (!code) return;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'kanrog_macros.cfg';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
}

function generateMacros() {
    const kin = document.getElementById('kin').value, x = document.getElementById('maxX').value, y = document.getElementById('maxY').value;
    const pT = document.getElementById('printTemp').value, bT = document.getElementById('bedTemp').value, m = document.getElementById('margin').value;
    const zT = document.getElementById('useZTilt').value === 'true', probe = document.getElementById('probeType').value;
    const led = document.getElementById('ledName').value, useLED = document.getElementById('useLED').value === 'true';
    const torture = document.getElementById('tortureLevel').value;

    let out = GCODE_TEMPLATES.header(kin, x, y, 250, m);
    out += GCODE_TEMPLATES.user_vars(x/2, y/2, 240, 450, m, pT, bT, "Custom", 2000, 255);
    if(useLED) out += GCODE_TEMPLATES.lighting(led, "RED=0.0 GREEN=0.0 BLUE=1.0", "RED=1.0 GREEN=1.0 BLUE=1.0");
    out += GCODE_TEMPLATES.diagnostics(kin, probe, zT);
    out += GCODE_TEMPLATES.torture(x, y, 250, m, (torture === 'aggressive' ? 800000 : 500000));
    out += GCODE_TEMPLATES.core_ops(kin, true, "X20 Y20", "X60 Y20", "staged", "Custom", probe, zT);
    out += GCODE_TEMPLATES.utility(false, probe, bT);

    document.getElementById('gcodeOutput').innerText = out;
    document.getElementById('outputCard').classList.remove('hidden');
    document.getElementById('outputCard').scrollIntoView({ behavior: 'smooth' });
}

function copyToClipboard() { navigator.clipboard.writeText(document.getElementById('gcodeOutput').innerText); alert("Copied!"); }

window.onload = function() { initCanvas(); updateMaterialPresets(); updateUI(); };
