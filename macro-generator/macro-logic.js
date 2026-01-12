/**
 * KLIPPER MACRO GENERATOR - LOGIC ENGINE
 * Handles UI interactions, canvas visualization, and G-Code assembly.
 */

const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');

/**
 * Updates the 2D Canvas Visualizer
 * This function handles the drawing of the bed, safe zones, and purge locations.
 */
function updateUI() {
    const kin = document.getElementById('kin').value;
    const x = parseFloat(document.getElementById('maxX').value) || 235;
    const y = parseFloat(document.getElementById('maxY').value) || 235;
    const m = parseFloat(document.getElementById('margin').value) || 20;
    const usePurge = document.getElementById('usePurge').value === 'true';

    // Clear previous drawing
    ctx.clearRect(0, 0, 300, 200);

    // Calculate scale and center
    const scale = 120 / Math.max(x, y);
    const cx = 150;
    const cy = 100;

    // 1. Draw Printer Bed
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.beginPath();
    if (kin === 'delta') {
        // Delta printers use a circular bed
        ctx.arc(cx, cy, (x / 2) * scale, 0, Math.PI * 2);
    } else {
        // Cartesian/CoreXY use rectangular beds
        ctx.rect(cx - (x / 2) * scale, cy - (y / 2) * scale, x * scale, y * scale);
    }
    ctx.fill();

    // 2. Draw Safe Zone (Printable Area)
    ctx.strokeStyle = "#a29bfe";
    ctx.setLineDash([5, 5]); // Dashed line for safety boundary
    ctx.beginPath();
    if (kin === 'delta') {
        ctx.arc(cx, cy, (x / 2 - m) * scale, 0, Math.PI * 2);
    } else {
        ctx.rect(cx - (x / 2 - m) * scale, cy - (y / 2 - m) * scale, (x - m * 2) * scale, (y - m * 2) * scale);
    }
    ctx.stroke();

    // 3. Draw Homing Origin (Red Dot)
    ctx.fillStyle = "#ff4d4d";
    ctx.setLineDash([]); // Solid line for point
    ctx.beginPath();
    if (kin === 'delta') {
        // Deltas home to center/top
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    } else {
        // Cartesian usually home to Front-Left (0,0)
        ctx.arc(cx - (x / 2) * scale, cy + (y / 2) * scale, 5, 0, Math.PI * 2);
    }
    ctx.fill();

    // 4. Draw Purge Line Indicator
    if (usePurge) {
        ctx.strokeStyle = "#ff00ff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (kin === 'delta') {
            // Purge at the front-most arc
            const py = cy + (y / 2 - m) * scale;
            ctx.moveTo(cx - 15 * scale, py);
            ctx.lineTo(cx + 15 * scale, py);
        } else {
            // Purge along the front-left edge
            const px = cx - (x / 2 - m) * scale;
            const py = cy + (y / 2 - m) * scale;
            ctx.moveTo(px, py);
            ctx.lineTo(px + (40 * scale), py);
        }
        ctx.stroke();
        ctx.lineWidth = 1;
    }
}

/**
 * Main Generation Logic
 * Orchestrates the collection of data and building the final string.
 */
function generateMacros() {
    // Collect Mechanical Inputs
    const kin = document.getElementById('kin').value;
    const x = parseFloat(document.getElementById('maxX').value);
    const y = parseFloat(document.getElementById('maxY').value);
    const z = parseFloat(document.getElementById('maxZ').value);
    const m = parseFloat(document.getElementById('margin').value) || 20;

    // Collect Logistics Inputs
    const bowden = document.getElementById('bowden').value || 450;
    const useChamber = document.getElementById('useChamber').value === 'true';
    const usePurge = document.getElementById('usePurge').value === 'true';
    const heatStyle = document.getElementById('heatStyle').value;

    // Collect UI/Stress Inputs
    const useLED = document.getElementById('useLED').value === 'true';
    const ledName = document.getElementById('ledName').value || 'status_leds';
    const tLevel = document.getElementById('tortureLevel').value;
    
    // Calculate Derived Movement Values
    const tSpeed = (tLevel === 'aggressive') ? 800000 : 500000;
    
    // Calculate Parking Coordinates
    let pkX = 0;
    let pkY = 0;

    if (kin === 'delta') {
        pkX = 0;
        pkY = 0;
    } else if (kin === 'bedslinger') {
        pkX = x / 2;
        pkY = y - 5; // Park bed forward
    } else {
        pkX = x / 2;
        pkY = y / 2;
    }

    // Determine Purge Coordinates for Template
    let pStart = "";
    let pEnd = "";

    if (kin === 'delta') {
        pStart = "X-7.5 Y-" + (y / 2 - m).toFixed(1);
        pEnd = "X7.5 Y-" + (y / 2 - m).toFixed(1);
    } else {
        pStart = "X" + m + " Y" + m;
        pEnd = "X" + (m + 40) + " Y" + m;
    }

    // --- ASSEMBLE OUTPUT ---
    let finalOutput = "";

    // 1. Header Block
    finalOutput += GCODE_TEMPLATES.header(kin, x, y, z, m);
    
    // 2. Variable Storage
    finalOutput += GCODE_TEMPLATES.user_vars(pkX, pkY, z - 10, bowden, m);
    
    // 3. Lighting Suite
    if (useLED) {
        finalOutput += GCODE_TEMPLATES.lighting(ledName);
    }
    
    // 4. Diagnostics Block
    finalOutput += GCODE_TEMPLATES.diagnostics(kin);
    
    // 5. Stress Testing Suite
    finalOutput += GCODE_TEMPLATES.torture(x, y, z, m, tSpeed);
    
    // 6. Core Print Operations
    finalOutput += GCODE_TEMPLATES.core_ops(kin, usePurge, pStart, pEnd, heatStyle);
    
    // 7. Utility & Safety
    finalOutput += GCODE_TEMPLATES.utility(useChamber);

    // Render to Output Box
    const outputElement = document.getElementById('gcodeOutput');
    outputElement.innerText = finalOutput;
    
    // Reveal the output card
    const outCard = document.getElementById('outputCard');
    outCard.classList.remove('hidden');
    
    // Focus the view on the generated code
    outCard.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Clipboard Integration
 */
function copyToClipboard() {
    const code = document.getElementById('gcodeOutput').innerText;
    if (!code) return;

    navigator.clipboard.writeText(code).then(() => {
        alert("Macro configuration copied to clipboard!");
    }).catch(err => {
        console.error('Could not copy text: ', err);
    });
}

/**
 * File Export Integration
 */
function downloadConfig() {
    const code = document.getElementById('gcodeOutput').innerText;
    if (!code) return;

    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = 'macros.cfg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Initialization
 */
window.onload = function() {
    updateUI();
};