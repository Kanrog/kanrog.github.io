/**
 * KLIPPER MACRO GENERATOR - LOGIC ENGINE
 * VERSION: DE-OPTIMIZED / FULLY EXPANDED 2026.01.12
 * This file handles all calculations, safety checks, and UI updates.
 */

const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');

// Color Database (Base Values)
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

/**
 * Handle Material Preset Changes
 * Automatically sets temperatures based on selected filament.
 */
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
    // If Custom, do nothing (preserve user input)
}

/**
 * Switch Dropdown to 'Custom' if user types manually
 */
function setCustomMaterial() {
    document.getElementById('material').value = "Custom";
}

/**
 * Update UI, Canvas & Safety Checks
 * This function runs on every user interaction.
 */
function updateUI() {
    // Gather Inputs
    const kin = document.getElementById('kin').value;
    const x = parseFloat(document.getElementById('maxX').value) || 235;
    const y = parseFloat(document.getElementById('maxY').value) || 235;
    const m = parseFloat(document.getElementById('margin').value) || 20;
    const usePurge = document.getElementById('usePurge').value === 'true';

    // --- SAFETY CHECK SYSTEM ---
    const warningBox = document.getElementById('warningBox');
    const warningMsg = document.getElementById('warningMsg');
    const genBtn = document.getElementById('generateBtn');
    
    let isUnsafe = false;
    let errorText = "";

    if (kin === 'delta') {
        // Delta Safety: Margin must be less than Radius (X/2)
        const radius = x / 2;
        if (m >= radius - 10) {
            isUnsafe = true;
            errorText = `Margin (${m}mm) is too close to Radius (${radius}mm). Increase X or decrease Margin.`;
        }
    } else {
        // Cartesian Safety: X/Y must be > Margin * 2
        if ((x - (m * 2) <= 10) || (y - (m * 2) <= 10)) {
            isUnsafe = true;
            errorText = `Margin (${m}mm) leaves no printable space on Bed (${x}x${y}). Decrease Margin.`;
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

    // Draw Canvas Visualization
    ctx.clearRect(0, 0, 300, 200);
    const scale = 120 / Math.max(x, y);
    const cx = 150; 
    const cy = 100;

    // Draw Bed (Circle for Delta, Square for others)
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.beginPath();
    if (kin === 'delta') {
        ctx.arc(cx, cy, (x / 2) * scale, 0, Math.PI * 2);
    } else {
        ctx.rect(cx - (x / 2) * scale, cy - (y / 2) * scale, x * scale, y * scale);
    }
    ctx.fill();

    // Draw Safe Zone (Dashed Line)
    ctx.strokeStyle = "#a29bfe";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    if (kin === 'delta') {
        ctx.arc(cx, cy, (x / 2 - m) * scale, 0, Math.PI * 2);
    } else {
        ctx.rect(cx - (x / 2 - m) * scale, cy - (y / 2 - m) * scale, (x - m * 2) * scale, (y - m * 2) * scale);
    }
    ctx.stroke();

    // Draw Origin (Red Dot)
    ctx.fillStyle = "#ff4d4d";
    ctx.setLineDash([]);
    ctx.beginPath();
    if (kin === 'delta') {
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    } else {
        ctx.arc(cx - (x / 2) * scale, cy + (y / 2) * scale, 5, 0, Math.PI * 2);
    }
    ctx.fill();

    // Draw Purge Line (Pink Line)
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

/**
 * Calculates a Klipper-ready LED string (RED=x GREEN=y BLUE=z)
 * applying the brightness multiplier.
 */
function getRGBString(colorName, brightness) {
    const base = COLOR_MAP[colorName] || COLOR_MAP['WHITE'];
    const r = (base.r * brightness).toFixed(2);
    const g = (base.g * brightness).toFixed(2);
    const b = (base.b * brightness).toFixed(2);
    return `RED=${r} GREEN=${g} BLUE=${b}`;
}

/**
 * Main Generator Function
 * Aggregates all data and calls template functions.
 */
function generateMacros() {
    // 1. MECHANICS
    const kin = document.getElementById('kin').value;
    const maxX = parseFloat(document.getElementById('maxX').value);
    const maxY = parseFloat(document.getElementById('maxY').value);
    const maxZ = parseFloat(document.getElementById('maxZ').value);
    const margin = parseFloat(document.getElementById('margin').value) || 20;

    // 2. LOGISTICS
    const bowden = document.getElementById('bowden').value || 450;
    const probeType = document.getElementById('probeType').value;
    const useChamber = document.getElementById('useChamber').value === 'true';
    const usePurge = document.getElementById('usePurge').value === 'true';
    const heatStyle = document.getElementById('heatStyle').value;

    // 3. MATERIAL PROFILES
    const material = document.getElementById('material').value;
    const pTemp = document.getElementById('printTemp').value;
    const bTemp = document.getElementById('bedTemp').value;
    
    // Auto-calculate retraction/fan based on material
    let retractSpeed = 2000; // Default fast retraction
    let fanSpeed = 255;      // Default 100% fan
    
    if (material === "TPU") {
        retractSpeed = 300; // Slow retraction for Flex
    } else if (material === "ABS") {
        fanSpeed = 64;      // Low fan for ABS
    }

    // 4. LIGHTING with BRIGHTNESS
    const useLED = document.getElementById('useLED').value === 'true';
    const ledName = document.getElementById('ledName').value || 'status_leds';
    
    // Calculate Idle Color string using slider value
    const idleColorName = document.getElementById('colorIdle').value;
    const idleBright = parseFloat(document.getElementById('brightIdleRange').value);
    const idleRGB = getRGBString(idleColorName, idleBright);

    // Calculate Print Color string using slider value
    const printColorName = document.getElementById('colorPrint').value;
    const printBright = parseFloat(document.getElementById('brightPrintRange').value);
    const printRGB = getRGBString(printColorName, printBright);
    
    // 5. STRESS
    const tortureLevel = document.getElementById('tortureLevel').value;
    const stressSpeed = (tortureLevel === 'aggressive') ? 800000 : 500000;

    // 6. COORDINATE MATH
    let pkX = (kin === 'delta') ? 0 : maxX / 2;
    let pkY = (kin === 'delta') ? 0 : (kin === 'bedslinger' ? maxY - 5 : maxY / 2);

    let pStart = (kin === 'delta') ? `X-7.5 Y-${(maxY / 2 - margin).toFixed(1)}` : `X${margin} Y${margin}`;
    let pEnd = (kin === 'delta') ? `X7.5 Y-${(maxY / 2 - margin).toFixed(1)}` : `X${margin + 40} Y${margin}`;

    // 7. ASSEMBLY
    let output = GCODE_TEMPLATES.header(kin, maxX, maxY, maxZ, margin);
    
    // Pass Extended Variables (Including Retraction/Fan)
    output += GCODE_TEMPLATES.user_vars(pkX, pkY, maxZ - 10, bowden, margin, pTemp, bTemp, material, retractSpeed, fanSpeed);
    
    if (useLED) {
        // Passing calculated RGB strings instead of just color names
        output += GCODE_TEMPLATES.lighting(ledName, idleRGB, printRGB);
    }
    
    output += GCODE_TEMPLATES.diagnostics(kin, probeType);
    output += GCODE_TEMPLATES.torture(maxX, maxY, maxZ, margin, stressSpeed);
    
    // Pass ProbeType and Material to Core Ops for Mesh Loading logic
    output += GCODE_TEMPLATES.core_ops(kin, usePurge, pStart, pEnd, heatStyle, material, probeType);
    
    output += GCODE_TEMPLATES.utility(useChamber, probeType, bTemp);

    // 8. RENDER
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

// Initial Visualization
window.onload = function() {
    updateMaterialPresets();
    updateUI();
};