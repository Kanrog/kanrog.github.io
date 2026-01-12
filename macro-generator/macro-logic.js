/**
 * KLIPPER MACRO GENERATOR - LOGIC ENGINE
 * VERSION: FINAL 2026.01.12
 */

const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');

function updateUI() {
    const kin = document.getElementById('kin').value;
    const x = parseFloat(document.getElementById('maxX').value) || 235;
    const y = parseFloat(document.getElementById('maxY').value) || 235;
    const m = parseFloat(document.getElementById('margin').value) || 20;
    const usePurge = document.getElementById('usePurge').value === 'true';

    ctx.clearRect(0, 0, 300, 200);
    const scale = 120 / Math.max(x, y);
    const cx = 150; 
    const cy = 100;

    // Draw Bed
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.beginPath();
    if (kin === 'delta') {
        ctx.arc(cx, cy, (x / 2) * scale, 0, Math.PI * 2);
    } else {
        ctx.rect(cx - (x / 2) * scale, cy - (y / 2) * scale, x * scale, y * scale);
    }
    ctx.fill();

    // Draw Safe Zone
    ctx.strokeStyle = "#a29bfe";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    if (kin === 'delta') {
        ctx.arc(cx, cy, (x / 2 - m) * scale, 0, Math.PI * 2);
    } else {
        ctx.rect(cx - (x / 2 - m) * scale, cy - (y / 2 - m) * scale, (x - m * 2) * scale, (y - m * 2) * scale);
    }
    ctx.stroke();

    // Draw Origin
    ctx.fillStyle = "#ff4d4d";
    ctx.setLineDash([]);
    ctx.beginPath();
    if (kin === 'delta') {
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    } else {
        ctx.arc(cx - (x / 2) * scale, cy + (y / 2) * scale, 5, 0, Math.PI * 2);
    }
    ctx.fill();

    // Draw Purge Line
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

function generateMacros() {
    // 1. MECHANICS
    const kin = document.getElementById('kin').value;
    const maxX = parseFloat(document.getElementById('maxX').value);
    const maxY = parseFloat(document.getElementById('maxY').value);
    const maxZ = parseFloat(document.getElementById('maxZ').value);
    const margin = parseFloat(document.getElementById('margin').value) || 20;

    // 2. LOGISTICS
    const bowden = document.getElementById('bowden').value || 450;
    const useChamber = document.getElementById('useChamber').value === 'true';
    const usePurge = document.getElementById('usePurge').value === 'true';
    const heatStyle = document.getElementById('heatStyle').value;

    // 3. MATERIAL PROFILES (WITH RETRACTION & FAN LOGIC)
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

    // 4. LIGHTING
    const useLED = document.getElementById('useLED').value === 'true';
    const ledName = document.getElementById('ledName').value || 'status_leds';
    const idleCol = document.getElementById('colorIdle').value;
    const printCol = document.getElementById('colorPrint').value;
    
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
        output += GCODE_TEMPLATES.lighting(ledName, idleCol, printCol);
    }
    
    output += GCODE_TEMPLATES.diagnostics(kin);
    output += GCODE_TEMPLATES.torture(maxX, maxY, maxZ, margin, stressSpeed);
    
    // Pass Material to Core Ops for Mesh Loading
    output += GCODE_TEMPLATES.core_ops(kin, usePurge, pStart, pEnd, heatStyle, material);
    
    output += GCODE_TEMPLATES.utility(useChamber);

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

window.onload = updateUI;