/**
 * KLIPPER MACRO GENERATOR - LOGIC ENGINE
 * VERSION: CODE-ONLY DYNAMIC CODES 2026.05.30
 */

/**
 * Reverts all UI inputs to their default startup values
 */
function resetDefaults() {
    document.getElementById('kin').value = "bedslinger";
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    const kin = document.getElementById('kin').value;
    const m = parseFloat(document.getElementById('margin').value) || 20;
    const pT = parseFloat(document.getElementById('printTemp').value) || 0;
    const bT = parseFloat(document.getElementById('bedTemp').value) || 0;

    let block = false;
    const mErr = document.getElementById('err-margin');
    const pInput = document.getElementById('printTemp'), pErr = document.getElementById('err-printTemp');
    const bInput = document.getElementById('bedTemp'), bErr = document.getElementById('err-bedTemp');

    // Reset Safety Styles
    pInput.classList.remove('input-error', 'input-warning');
    bInput.classList.remove('input-error', 'input-warning');
    pErr.classList.add('hidden'); bErr.classList.add('hidden');
    pErr.className = "error-text"; bErr.className = "error-text";
    pErr.innerHTML = ""; bErr.innerHTML = "";

    // General Safety Margin Limit checks
    let mBad = (m < 0 || m > 100);
    mErr.classList.toggle('hidden', !mBad);
    if(mBad) block = true;

    // Nozzle Safety
    if (pT < 170 || pT > 305) { pErr.innerHTML = "Invalid Printing Temp!"; pErr.classList.remove('hidden'); pInput.classList.add('input-error'); block = true; }
    else if (pT > 290) { pErr.innerHTML = "All-Metal Hotend Required"; pErr.className = "warning-text"; pErr.classList.remove('hidden'); pInput.classList.add('input-warning'); }
    else if (pT > 260) { pErr.innerHTML = "PTFE Liner Danger Zone"; pErr.className = "warning-text"; pErr.classList.remove('hidden'); pInput.classList.add('input-warning'); }

    // Bed Safety
    if (bT < 0 || bT > 125) { bErr.innerHTML = "Unsafe Bed Temp!"; bErr.classList.remove('hidden'); bInput.classList.add('input-error'); block = true; }
    else if (bT > 85) { bErr.innerHTML = "Magnet Demagnetization Risk"; bErr.className = "warning-text"; bErr.classList.remove('hidden'); bInput.classList.add('input-warning'); }

    document.getElementById('generateBtn').disabled = block;
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
    const kin = document.getElementById('kin').value;
    const pT = document.getElementById('printTemp').value;
    const bT = document.getElementById('bedTemp').value;
    const m = document.getElementById('margin').value;
    const zT = document.getElementById('useZTilt').value === 'true';
    const probe = document.getElementById('probeType').value;
    const led = document.getElementById('ledName').value;
    const useLED = document.getElementById('useLED').value === 'true';
    const torture = document.getElementById('tortureLevel').value;

    let out = GCODE_TEMPLATES.header(kin);
    
    // Core Variables without physical size requirements
    out += GCODE_TEMPLATES.user_vars(m, pT, bT, "Custom", 2000, 255);
    
    if(useLED && led) {
        out += GCODE_TEMPLATES.lighting(led, "RED=0.0 GREEN=0.0 BLUE=1.0", "RED=1.0 GREEN=1.0 BLUE=1.0");
    }
    
    out += GCODE_TEMPLATES.diagnostics(kin, probe, zT);
    out += GCODE_TEMPLATES.torture((torture === 'aggressive' ? 800000 : 500000));
    out += GCODE_TEMPLATES.core_ops(kin, true, "staged", "Custom", probe, zT, useLED);
    out += GCODE_TEMPLATES.utility(false, probe, bT);

    document.getElementById('gcodeOutput').innerText = out;
    document.getElementById('outputCard').classList.remove('hidden');
    document.getElementById('outputCard').scrollIntoView({ behavior: 'smooth' });
}

function copyToClipboard() { navigator.clipboard.writeText(document.getElementById('gcodeOutput').innerText); alert("Copied to clipboard!"); }

window.onload = function() { updateMaterialPresets(); updateUI(); };