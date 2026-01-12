/**
 * KLIPPER MACRO GENERATOR - LOGIC ENGINE
 * VERSION: FINAL SAFETY INLINE 2026.01.12
 */

const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');

const COLOR_MAP = {
    'RED':    {r: 1.0, g: 0.0, b: 0.0},
    'ORANGE': {r: 1.0, g: 0.5, b: 0.0},
    'YELLOW': {r: 1.0, g: 1.0, b: 0.0},
    'GREEN':  {r: 0.0, g: 1.0, b: 0.0},
    'TEAL':   {r: 0.0, g: 0.5, b: 1.0},
    'BLUE':   {r: 0.0, g: 0.0, b: 1.0},
    'PURPLE': {r: 1.0, g: 0.0, b: 1.0},
    'WHITE':  {r: 0.8, g: 0.8, b: 0.8}
};

function updateMaterialPresets() {
    const mat = document.getElementById('material').value;
    const pInput = document.getElementById('printTemp');
    const bInput = document.getElementById('bedTemp');
    
    if (mat === "PLA") { pInput.value = 210; bInput.value = 60; }
    else if (mat === "PETG") { pInput.value = 240; bInput.value = 80; }
    else if (mat === "ABS") { pInput.value = 250; bInput.value = 100; }
    else if (mat === "TPU") { pInput.value = 230; bInput.value = 50; }
}

function setCustomMaterial() {
    document.getElementById('material').value = "Custom";
}

function updateUI() {
    // Gather Inputs
    const kin = document.getElementById('kin').value;
    const x = parseFloat(document.getElementById('maxX').value) || 235;
    const y = parseFloat(document.getElementById('maxY').value) || 235;
    const m = parseFloat(document.getElementById('margin').value) || 20;
    const usePurge = document.getElementById('usePurge').value === 'true';
    
    const pTemp = parseFloat(document.getElementById('printTemp').value) || 0;
    const bTemp = parseFloat(document.getElementById('bedTemp').value) || 0;

    // --- INLINE SAFETY CHECKS ---
    let isUnsafe = false;
    
    // Elements
    const marginInput = document.getElementById('margin');
    const marginErr = document.getElementById('err-margin');
    
    const printTempInput = document.getElementById('printTemp');
    const printTempErr = document.getElementById('err-printTemp');
    
    const bedTempInput = document.getElementById('bedTemp');
    const bedTempErr = document.getElementById('err-bedTemp');

    // 1. Check Margin
    let marginErrorText = "";
    let marginIsBad = false;
    
    if (kin === 'delta') {
        const radius = x / 2;
        if (m >= radius - 10) {
            marginIsBad = true;
            marginErrorText = `Too close to Radius (${radius}mm)`;
        }
    } else {
        if ((x - (m * 2) <= 10) || (y - (m * 2) <= 10)) {
            marginIsBad = true;
            marginErrorText = `Leaves no printable space`;
        }
    }

    if (marginIsBad) {
        isUnsafe = true;
        marginInput.classList.add('input-error');
        marginErr.querySelector('span').innerText = marginErrorText;
        marginErr.classList.remove('hidden');
    } else {
        marginInput.classList.remove('input-error');
        marginErr.classList.add('hidden');
    }

    // 2. Check Print Temp
    let printErrorText = "";
    let printIsBad = false;
    
    if (pTemp < 170) {
        printIsBad = true;
        printErrorText = "Too low (<170°C)";
    } else if (pTemp > 300) {
        printIsBad = true;
        printErrorText = "Unsafe (>300°C)";
    }

    if (printIsBad) {
        isUnsafe = true;
        printTempInput.classList.add('input-error');
        printTempErr.querySelector('span').innerText = printErrorText;
        printTempErr.classList.remove('hidden');
    } else {
        printTempInput.classList.remove('input-error');
        printTempErr.classList.add('hidden');
    }

    // 3. Check Bed Temp
    let bedErrorText = "";
    let bedIsBad = false;
    
    if (bTemp > 120) {
        bedIsBad = true;
        bedErrorText = "Unsafe (>120°C)";
    }

    if (bedIsBad) {
        isUnsafe = true;
        bedTempInput.classList.add('input-error');
        bedTempErr.querySelector('span').innerText = bedErrorText;
        bedTempErr.classList.remove('hidden');
    } else {
        bedTempInput.classList.remove('input-error');
        bedTempErr.classList.add('hidden');
    }

    // Disable Button if any error exists
    const genBtn = document.getElementById('generateBtn');
    if (isUnsafe) {
        genBtn.disabled = true;
        genBtn.classList.add('btn-disabled');
    } else {
        genBtn.disabled = false;
        genBtn.classList.remove('btn-disabled');
    }
    // ----------------------------

    ctx.clearRect(0, 0, 300, 200);
    const scale = 120 / Math.max(x, y);
    const cx = 150; const cy = 100;

    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.beginPath();
    if (kin === 'delta') ctx.arc(cx, cy, (x / 2) * scale, 0, Math.PI * 2);
    else ctx.rect(cx - (x / 2) * scale, cy - (y / 2) * scale, x * scale, y * scale);
    ctx.fill();

    ctx.strokeStyle = "#a29bfe";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    if (kin === 'delta') ctx.arc(cx, cy, (x / 2 - m) * scale, 0, Math.PI * 2);
    else ctx.rect(cx - (x / 2 - m) * scale, cy - (y / 2 - m) * scale, (x - m * 2) * scale, (y - m * 2) * scale);
    ctx.stroke();

    ctx.fillStyle = "#ff4d4d";
    ctx.setLineDash([]);
    ctx.beginPath();
    if (kin === 'delta') ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    else ctx.arc(cx - (x / 2) * scale, cy + (y / 2) * scale, 5, 0, Math.PI * 2);
    ctx.fill();

    if (usePurge) {
        ctx.strokeStyle = "#ff00ff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (kin === 'delta') {
            const py = cy + (y / 2 - m) * scale;
            ctx.moveTo(cx - 15 * scale, py); ctx.lineTo(cx + 15 * scale, py);
        } else {
            const px = cx - (x / 2 - m) * scale; const py = cy + (y / 2 - m) * scale;
            ctx.moveTo(px, py); ctx.lineTo(px + (40 * scale), py);
        }
        ctx.stroke();
    }
}

function getRGBString(colorName, brightness) {
    const base = COLOR_MAP[colorName] || COLOR_MAP['WHITE'];
    const r = (base.r * brightness).toFixed(2);
    const g = (base.g * brightness).toFixed(2);
    const b = (base.b * brightness).toFixed(2);
    return `RED=${r} GREEN=${g} BLUE=${b}`;
}

function generateMacros() {
    const kin = document.getElementById('kin').value;
    const maxX = parseFloat(document.getElementById('maxX').value);
    const maxY = parseFloat(document.getElementById('maxY').value);
    const maxZ = parseFloat(document.getElementById('maxZ').value);
    const margin = parseFloat(document.getElementById('margin').value) || 20;

    const bowden = document.getElementById('bowden').value || 450;
    const probeType = document.getElementById('probeType').value;
    const useChamber = document.getElementById('useChamber').value === 'true';
    const usePurge = document.getElementById('usePurge').value === 'true';
    const heatStyle = document.getElementById('heatStyle').value;

    const material = document.getElementById('material').value;
    const pTemp = document.getElementById('printTemp').value;
    const bTemp = document.getElementById('bedTemp').value;
    
    let retractSpeed = 2000; 
    let fanSpeed = 255;      
    if (material === "TPU") retractSpeed = 300;
    if (material === "ABS") fanSpeed = 64;

    const useLED = document.getElementById('useLED').value === 'true';
    const ledName = document.getElementById('ledName').value || 'status_leds';
    
    const idleRGB = getRGBString(document.getElementById('colorIdle').value, parseFloat(document.getElementById('brightIdleRange').value));
    const printRGB = getRGBString(document.getElementById('colorPrint').value, parseFloat(document.getElementById('brightPrintRange').value));
    
    const tortureLevel = document.getElementById('tortureLevel').value;
    const stressSpeed = (tortureLevel === 'aggressive') ? 800000 : 500000;

    let pkX = (kin === 'delta') ? 0 : maxX / 2;
    let pkY = (kin === 'delta') ? 0 : (kin === 'bedslinger' ? maxY - 5 : maxY / 2);

    let pStart = (kin === 'delta') ? `X-7.5 Y-${(maxY / 2 - margin).toFixed(1)}` : `X${margin} Y${margin}`;
    let pEnd = (kin === 'delta') ? `X7.5 Y-${(maxY / 2 - margin).toFixed(1)}` : `X${margin + 40} Y${margin}`;

    let output = GCODE_TEMPLATES.header(kin, maxX, maxY, maxZ, margin);
    output += GCODE_TEMPLATES.user_vars(pkX, pkY, maxZ - 10, bowden, margin, pTemp, bTemp, material, retractSpeed, fanSpeed);
    if (useLED) output += GCODE_TEMPLATES.lighting(ledName, idleRGB, printRGB);
    output += GCODE_TEMPLATES.diagnostics(kin, probeType);
    output += GCODE_TEMPLATES.torture(maxX, maxY, maxZ, margin, stressSpeed);
    output += GCODE_TEMPLATES.core_ops(kin, usePurge, pStart, pEnd, heatStyle, material, probeType);
    output += GCODE_TEMPLATES.utility(useChamber, probeType, bTemp);

    document.getElementById('gcodeOutput').innerText = output;
    document.getElementById('outputCard').classList.remove('hidden');
    document.getElementById('outputCard').scrollIntoView({ behavior: 'smooth' });
}

function copyToClipboard() { navigator.clipboard.writeText(document.getElementById('gcodeOutput').innerText).then(() => alert("Copied!")); }
function downloadConfig() {
    const blob = new Blob([document.getElementById('gcodeOutput').innerText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'macros.cfg'; a.click();
}

window.onload = function() { updateMaterialPresets(); updateUI(); };