/**
 * KLIPPER MACRO GENERATOR - LOGIC ENGINE
 * VERSION: 2026.01.12 - FULL EXPANSION
 * * Handles UI interactions, canvas visualization, and G-Code assembly.
 * Strictly avoids consolidation of logic or variable handling.
 */

const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');

/**
 * Updates the 2D Canvas Visualizer
 * Provides real-time feedback for the selected archetype and safety margins.
 */
function updateUI() {
    const kin = document.getElementById('kin').value;
    const x = parseFloat(document.getElementById('maxX').value) || 235;
    const y = parseFloat(document.getElementById('maxY').value) || 235;
    const m = parseFloat(document.getElementById('margin').value) || 20;
    const usePurge = document.getElementById('usePurge').value === 'true';

    // Reset Canvas State
    ctx.clearRect(0, 0, 300, 200);

    // Calculate scaling factor to fit the bed inside the 300x200 canvas
    const scale = 120 / Math.max(x, y);
    const cx = 150; // Center X of Canvas
    const cy = 100; // Center Y of Canvas

    // --- 1. Draw Printer Bed ---
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.beginPath();
    if (kin === 'delta') {
        // Delta printers are circular; center is (0,0)
        ctx.arc(cx, cy, (x / 2) * scale, 0, Math.PI * 2);
    } else {
        // Cartesian/CoreXY are rectangular; center is (X/2, Y/2)
        ctx.rect(cx - (x / 2) * scale, cy - (y / 2) * scale, x * scale, y * scale);
    }
    ctx.fill();

    // --- 2. Draw Safe Zone Boundary ---
    ctx.strokeStyle = "#a29bfe"; // Purple accent
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    if (kin === 'delta') {
        ctx.arc(cx, cy, (x / 2 - m) * scale, 0, Math.PI * 2);
    } else {
        ctx.rect(cx - (x / 2 - m) * scale, cy - (y / 2 - m) * scale, (x - m * 2) * scale, (y - m * 2) * scale);
    }
    ctx.stroke();

    // --- 3. Draw Homing Origin (Red Dot) ---
    ctx.fillStyle = "#ff4d4d";
    ctx.setLineDash([]);
    ctx.beginPath();
    if (kin === 'delta') {
        // Deltas home to the center
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    } else {
        // Cartesian/Bedslinger home to Front-Left (0,0)
        ctx.arc(cx - (x / 2) * scale, cy + (y / 2) * scale, 5, 0, Math.PI * 2);
    }
    ctx.fill();

    // --- 4. Draw Purge Line Indicator (Pink) ---
    if (usePurge) {
        ctx.strokeStyle = "#ff00ff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (kin === 'delta') {
            // Delta purge line at the front arc boundary
            const py = cy + (y / 2 - m) * scale;
            ctx.moveTo(cx - 15 * scale, py);
            ctx.lineTo(cx + 15 * scale, py);
        } else {
            // Cartesian purge line along the front X-axis
            const px = cx - (x / 2 - m) * scale;
            const py = cy + (y / 2 - m) * scale;
            ctx.moveTo(px, py);
            ctx.lineTo(px + (40 * scale), py);
        }
        ctx.stroke();
        ctx.lineWidth = 1; // Reset line width
    }
}

/**
 * Main Generation Logic
 * Gathers every UI variable and assembles the config string.
 */
function generateMacros() {
    // Collect Geometry Inputs
    const kin = document.getElementById('kin').value;
    const x = parseFloat(document.getElementById('maxX').value);
    const y = parseFloat(document.getElementById('maxY').value);
    const z = parseFloat(document.getElementById('maxZ').value);
    const m = parseFloat(document.getElementById('margin').value) || 20;

    // Collect Logistic Inputs
    const bowden = document.getElementById('bowden').value || 450;
    const useChamber = document.getElementById('useChamber').value === 'true';
    const usePurge = document.getElementById('usePurge').value === 'true';
    const heatStyle = document.getElementById('heatStyle').value;

    // Collect Lighting & Stress Inputs
    const useLED = document.getElementById('useLED').value === 'true';
    const ledName = document.getElementById('ledName').value || 'status_leds';
    const tLevel = document.getElementById('tortureLevel').value;
    
    // Logic for Torture Speed
    let tSpeed = 500000; // Standard 500mm/s
    if (tLevel === 'aggressive') {
        tSpeed = 800000; // Aggressive 800mm/s
    }
    
    // Logic for Parking Coordinates
    let pkX = 0;
    let pkY = 0;
    if (kin === 'delta') {
        pkX = 0;
        pkY = 0;
    } else if (kin === 'bedslinger') {
        pkX = x / 2;
        pkY = y - 5; // Pull bed forward for easy access
    } else {
        pkX = x / 2;
        pkY = y / 2;
    }

    // Logic for Purge Start/End strings
    let pStart = "";
    let pEnd = "";
    if (kin === 'delta') {
        pStart = "X-7.5 Y-" + (y / 2 - m).toFixed(1);
        pEnd = "X7.5 Y-" + (y / 2 - m).toFixed(1);
    } else {
        pStart = "X" + m + " Y" + m;
        pEnd = "X" + (m + 40) + " Y" + m;
    }

    // --- ASSEMBLE G-CODE BLOCKS ---
    let finalGcode = "";

    // 1. Add Header
    finalGcode += GCODE_TEMPLATES.header(kin, x, y, z, m);
    
    // 2. Add Variables Block
    finalGcode += GCODE_TEMPLATES.user_vars(pkX, pkY, z - 10, bowden, m);
    
    // 3. Add Lighting Suite (If enabled)
    if (useLED) {
        finalGcode += GCODE_TEMPLATES.lighting(ledName);
    }
    
    // 4. Add Diagnostics & Calibration
    finalGcode += GCODE_TEMPLATES.diagnostics(kin);
    
    // 5. Add Torture Testing Suite
    finalGcode += GCODE_TEMPLATES.torture(x, y, z, m, tSpeed);
    
    // 6. Add Core Operations (Start, End, Purge, M600)
    finalGcode += GCODE_TEMPLATES.core_ops(kin, usePurge, pStart, pEnd, heatStyle);
    
    // 7. Add Utility & Safety
    finalGcode += GCODE_TEMPLATES.utility(useChamber);

    // --- DISPLAY OUTPUT ---
    const outputField = document.getElementById('gcodeOutput');
    outputField.innerText = finalGcode;
    
    const outputCard = document.getElementById('outputCard');
    outputCard.classList.remove('hidden');
    outputCard.style.display = 'block';
    
    // Provide smooth scrolling to the result
    outputCard.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Utility: Copy to Clipboard
 */
function copyToClipboard() {
    const textToCopy = document.getElementById('gcodeOutput').innerText;
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy).then(() => {
        alert("Configuration copied to clipboard!");
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

/**
 * Utility: File Download
 */
function downloadConfig() {
    const gcodeText = document.getElementById('gcodeOutput').innerText;
    if (!gcodeText) return;

    const blob = new Blob([gcodeText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    
    downloadAnchor.href = url;
    downloadAnchor.download = 'macros.cfg';
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    
    // Cleanup
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(url);
}

// Ensure the UI visualizer runs immediately on page load
window.onload = function() {
    updateUI();
};