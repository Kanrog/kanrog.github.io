/**
 * KLIPPER MACRO GENERATOR - LOGIC CORE
 * Handles input capture, canvas visualization, and template assembly.
 */

const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');

function updateUI() {
    // Collect Visualization Inputs
    const kin = document.getElementById('kin').value;
    const x = parseFloat(document.getElementById('maxX').value) || 235;
    const y = parseFloat(document.getElementById('maxY').value) || 235;
    const m = parseFloat(document.getElementById('margin').value) || 20;
    const usePurge = document.getElementById('usePurge').value === 'true';

    // Reset Canvas
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

    // Draw Homing Point
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
            ctx.moveTo(cx - 10 * scale, py);
            ctx.lineTo(cx + 10 * scale, py);
        } else {
            const px = cx - (x / 2 - m) * scale;
            const py = cy + (y / 2 - m) * scale;
            ctx.moveTo(px, py);
            ctx.lineTo(px + (30 * scale), py);
        }
        ctx.stroke();
    }
}

function generateMacros() {
    // 1. Capture Mechanics
    const kin = document.getElementById('kin').value;
    const maxX = parseFloat(document.getElementById('maxX').value);
    const maxY = parseFloat(document.getElementById('maxY').value);
    const maxZ = parseFloat(document.getElementById('maxZ').value);
    const margin = parseFloat(document.getElementById('margin').value) || 20;

    // 2. Capture Material & Temps
    const material = document.getElementById('material').value;
    const pTemp = document.getElementById('printTemp').value;
    const bTemp = document.getElementById('bedTemp').value;

    // 3. Capture Logistics
    const bowden = document.getElementById('bowden').value || 450;
    const useChamber = document.getElementById('useChamber').value === 'true';
    const usePurge = document.getElementById('usePurge').value === 'true';
    const heatStyle = document.getElementById('heatStyle').value;

    // 4. Capture Lighting
    const useLED = document.getElementById('useLED').value === 'true';
    const ledName = document.getElementById('ledName').value || 'status_leds';
    const idleCol = document.getElementById('colorIdle').value;
    const printCol = document.getElementById('colorPrint').value;

    // 5. Derived Logic
    let pkX = (kin === 'delta') ? 0 : maxX / 2;
    let pkY = (kin === 'delta') ? 0 : (kin === 'bedslinger' ? maxY - 5 : maxY / 2);

    let pStart = (kin === 'delta') ? `X-7.5 Y-${(maxY / 2 - margin).toFixed(1)}` : `X${margin} Y${margin}`;
    let pEnd = (kin === 'delta') ? `X7.5 Y-${(maxY / 2 - margin).toFixed(1)}` : `X${margin + 40} Y${margin}`;

    // 6. Template Assembly
    let output = GCODE_TEMPLATES.header(kin, maxX, maxY, maxZ, margin);
    
    // Pass Filament and Geometry to Variables
    output += GCODE_TEMPLATES.user_vars(pkX, pkY, maxZ - 10, bowden, margin, pTemp, bTemp, material);
    
    if (useLED) {
        output += GCODE_TEMPLATES.lighting(ledName, idleCol, printCol);
    }
    
    output += GCODE_TEMPLATES.diagnostics(kin);
    output += GCODE_TEMPLATES.torture(maxX, maxY, maxZ, margin, 500000);
    
    // Pass Material to Core Ops for Bed Mesh Loading
    output += GCODE_TEMPLATES.core_ops(kin, usePurge, pStart, pEnd, heatStyle, material);
    
    output += GCODE_TEMPLATES.utility(useChamber);

    // 7. Render
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

// Init
window.onload = updateUI;