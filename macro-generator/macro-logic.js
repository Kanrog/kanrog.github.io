/**
 * KLIPPER MACRO GENERATOR - LOGIC ENGINE
 * VERSION: 2026.01.12 - FULL EXPANSION BUILD
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
    const centerX = 150;
    const centerY = 100;

    // Bed Visualization
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.beginPath();
    if (kin === 'delta') {
        ctx.arc(centerX, centerY, (x / 2) * scale, 0, Math.PI * 2);
    } else {
        ctx.rect(centerX - (x / 2) * scale, centerY - (y / 2) * scale, x * scale, y * scale);
    }
    ctx.fill();

    // Safe Zone Visualization
    ctx.strokeStyle = "#a29bfe";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    if (kin === 'delta') {
        ctx.arc(centerX, centerY, (x / 2 - m) * scale, 0, Math.PI * 2);
    } else {
        ctx.rect(centerX - (x / 2 - m) * scale, centerY - (y / 2 - m) * scale, (x - m * 2) * scale, (y - m * 2) * scale);
    }
    ctx.stroke();

    // Homing Origin Indicator
    ctx.fillStyle = "#ff4d4d";
    ctx.setLineDash([]);
    ctx.beginPath();
    if (kin === 'delta') {
        ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    } else {
        ctx.arc(centerX - (x / 2) * scale, centerY + (y / 2) * scale, 5, 0, Math.PI * 2);
    }
    ctx.fill();

    // Purge Line Visualization
    if (usePurge) {
        ctx.strokeStyle = "#ff00ff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (kin === 'delta') {
            const py = centerY + (y / 2 - m) * scale;
            ctx.moveTo(centerX - 15 * scale, py);
            ctx.lineTo(centerX + 15 * scale, py);
        } else {
            const px = centerX - (x / 2 - m) * scale;
            const py = centerY + (y / 2 - m) * scale;
            ctx.moveTo(px, py);
            ctx.lineTo(px + (40 * scale), py);
        }
        ctx.stroke();
        ctx.lineWidth = 1;
    }
}

function generateMacros() {
    // Collect All Inputs Individually
    const kin = document.getElementById('kin').value;
    const maxX = parseFloat(document.getElementById('maxX').value) || 235;
    const maxY = parseFloat(document.getElementById('maxY').value) || 235;
    const maxZ = parseFloat(document.getElementById('maxZ').value) || 250;
    const margin = parseFloat(document.getElementById('margin').value) || 20;

    const bowden = document.getElementById('bowden').value || 450;
    const useChamber = document.getElementById('useChamber').value === 'true';
    const usePurge = document.getElementById('usePurge').value === 'true';
    const heatStyle = document.getElementById('heatStyle').value;

    const useLED = document.getElementById('useLED').value === 'true';
    const ledName = document.getElementById('ledName').value || 'status_leds';
    const idleColor = document.getElementById('colorIdle').value || 'BLUE';
    const printColor = document.getElementById('colorPrint').value || 'WHITE';
    const tortureLevel = document.getElementById('tortureLevel').value;
    
    let movementSpeed = 500000; 
    if (tortureLevel === 'aggressive') {
        movementSpeed = 800000;
    }
    
    // Parking Logic
    let pkX = (kin === 'delta') ? 0 : maxX / 2;
    let pkY = (kin === 'delta') ? 0 : (kin === 'bedslinger' ? maxY - 5 : maxY / 2);

    // Purge Coordinate Math
    let pStart = (kin === 'delta') ? `X-7.5 Y-${(maxY / 2 - margin).toFixed(1)}` : `X${margin} Y${margin}`;
    let pEnd = (kin === 'delta') ? `X7.5 Y-${(maxY / 2 - margin).toFixed(1)}` : `X${margin + 40} Y${margin}`;

    // BUILD STRING
    let out = GCODE_TEMPLATES.header(kin, maxX, maxY, maxZ, margin);
    out += GCODE_TEMPLATES.user_vars(pkX, pkY, maxZ - 10, bowden, margin);
    
    if (useLED) {
        out += GCODE_TEMPLATES.lighting(ledName, idleColor, printColor);
    }
    
    out += GCODE_TEMPLATES.diagnostics(kin);
    out += GCODE_TEMPLATES.torture(maxX, maxY, maxZ, margin, movementSpeed);
    out += GCODE_TEMPLATES.core_ops(kin, usePurge, pStart, pEnd, heatStyle);
    out += GCODE_TEMPLATES.utility(useChamber);

    document.getElementById('gcodeOutput').innerText = out;
    document.getElementById('outputCard').classList.remove('hidden');
    document.getElementById('outputCard').style.display = 'block';
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