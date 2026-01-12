/**
 * KLIPPER MACRO GENERATOR - LOGIC ENGINE
 * VERSION: FINAL SAFETY 2026.01.12
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
    
    if (mat === "PLA") {
        pInput.value = 210;
        bInput.value = 60;
    } else if (mat === "PETG") {
        pInput.value = 240;
        bInput.value = 80;
    } else if (mat === "ABS") {
        pInput.value = 250;
        bInput.value = 100;
    } else if (mat === "TPU") {
        pInput.value = 230;
        bInput.value = 50;
    }
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

    // --- SAFETY CHECK SYSTEM ---
    const warningBox = document.getElementById('warningBox');
    const warningMsg = document.getElementById('warningMsg');
    const genBtn = document.getElementById('generateBtn');
    
    let isUnsafe = false;
    let errorText = "";

    // 1. Margin Checks
    if (kin === 'delta') {
        const radius = x / 2;
        if (m >= radius - 10) {
            isUnsafe = true;
            errorText = `Margin (${m}mm) is too close to Radius (${radius}mm). Increase X or decrease Margin.`;
        }
    } else {
        if ((x - (m * 2) <= 10) || (y - (m * 2) <= 10)) {
            isUnsafe = true;
            errorText = `Margin (${m}mm) leaves no printable space on Bed (${x}x${y}). Decrease Margin.`;
        }
    }

    // 2. Temperature Checks
    if (!isUnsafe) {
        if (pTemp < 170) {
            isUnsafe = true;
            errorText = `Nozzle Temp (${pTemp}°C) is too low for extrusion. Min 170°C.`;
        } else if (pTemp > 300) {
            isUnsafe = true;
            errorText = `Nozzle Temp (${pTemp}°C) exceeds safety limits (300°C).`;
        } else if (bTemp > 120) {
            isUnsafe = true;
            errorText = `Bed Temp (${bTemp}°C) exceeds standard limits (120°C).`;
        }
    }

    if (isUnsafe) {
        warningMsg.innerText = errorText;
        warningBox.classList.remove('hidden');
        genBtn.disabled = true;
        genBtn.classList.add('btn-disabled');
    } else {
        warningBox.classList.add('hidden');
        genBtn.disabled = false;
        genBtn.classList.remove('btn-disabled');
    }
    // ---------------------------

    ctx.clearRect(0, 0, 300, 200);
    const scale = 120 / Math.max(x, y);
    const cx = 150; 
    const cy = 100;

    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.beginPath();
    if (kin === 'delta') {
        ctx.arc(cx, cy, (x / 2) * scale, 0, Math.PI * 2);
    } else {
        ctx.rect(cx - (x / 2) * scale, cy - (y / 2) * scale, x * scale, y * scale);
    }
    ctx.fill();

    ctx.strokeStyle = "#a29bfe";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    if (kin === 'delta') {
        ctx.arc(cx, cy, (x / 2 - m) * scale, 0, Math.PI * 2);
    } else {
        ctx.rect(cx - (x / 2 - m) * scale, cy - (y / 2 - m) * scale, (x - m * 2) * scale, (y - m * 2) * scale);
    }
    ctx.stroke();

    ctx.fillStyle = "#ff4d4d";
    ctx.setLineDash([]);
    ctx.beginPath();
    if (kin === 'delta') {
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    } else {
        ctx.arc(cx - (x / 2) * scale, cy + (y / 2) * scale, 5, 0, Math.PI * 2);
    }
    ctx.fill();

    if (usePurge) {
        ctx.strokeStyle = "#ff00ff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (kin === 'delta') {
            const py = cy + (y / 2 - m) * scale;
            ctx.moveTo(cx - 15 * scale, py);
            ctx.lineTo(cx + 15 * scale, py);
        } else {
            const px = cx - (x / 2 - m) * scale;
            const py = cy + (y / 2 - m) * scale;
            ctx.moveTo(px, py);
            ctx.lineTo(px + (40 * scale), py);
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
    if (material === "TPU") {
        retractSpeed = 300;
    } else if (material === "ABS") {
        fanSpeed = 64;
    }

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
    if (useLED) {
        output += GCODE_TEMPLATES.lighting(ledName, idleRGB, printRGB);
    }
    output += GCODE_TEMPLATES.diagnostics(kin, probeType);
    output += GCODE_TEMPLATES.torture(maxX, maxY, maxZ, margin, stressSpeed);
    output += GCODE_TEMPLATES.core_ops(kin, usePurge, pStart, pEnd, heatStyle, material, probeType);
    output += GCODE_TEMPLATES.utility(useChamber, probeType, bTemp);

    document.getElementById('gcodeOutput').innerText = output;
    document.getElementById('outputCard').classList.remove('hidden');
    document.getElementById('outputCard').scrollIntoView({ behavior: 'smooth' });
}

function copyToClipboard() {
    navigator.clipboard.writeText(document.getElementById('gcodeOutput').innerText).then(() => alert("Copied!"));
}

function downloadConfig() {
    const blob = new Blob([document.getElementById('gcodeOutput').innerText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'macros.cfg';
    a.click();
}

window.onload = function() {
    updateMaterialPresets();
    updateUI();
};