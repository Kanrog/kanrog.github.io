/**
 * KLIPPER MACRO GENERATOR - LOGIC ENGINE
 * Handles UI interactions, canvas visualization, and G-Code assembly.
 */

const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');

/**
 * Updates the 2D Canvas Preview based on user input
 */
function updateUI() {
    const kin = document.getElementById('kin').value;
    const x = parseFloat(document.getElementById('maxX').value) || 235;
    const y = parseFloat(document.getElementById('maxY').value) || 235;
    const m = parseFloat(document.getElementById('margin').value) || 20;
    const usePurge = document.getElementById('usePurge').value === 'true';

    // Canvas Constants
    ctx.clearRect(0, 0, 300, 200);
    const scale = 120 / Math.max(x, y);
    const cx = 150, cy = 100;

    // 1. Draw Bed (Dark Glass look)
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.beginPath();
    if (kin === 'delta') {
        ctx.arc(cx, cy, (x / 2) * scale, 0, Math.PI * 2);
    } else {
        ctx.rect(cx - (x / 2) * scale, cy - (y / 2) * scale, x * scale, y * scale);
    }
    ctx.fill();

    // 2. Draw Safe Zone (Dashed Purple Line)
    ctx.strokeStyle = "#a29bfe";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    if (kin === 'delta') {
        ctx.arc(cx, cy, (x / 2 - m) * scale, 0, Math.PI * 2);
    } else {
        ctx.rect(cx - (x / 2 - m) * scale, cy - (y / 2 - m) * scale, (x - m * 2) * scale, (y - m * 2) * scale);
    }
    ctx.stroke();

    // 3. Draw Home Point (Red Dot)
    ctx.fillStyle = "#ff4d4d";
    ctx.setLineDash([]);
    ctx.beginPath();
    if (kin === 'delta') {
        ctx.arc(cx, cy, 5, 0, Math.PI * 2); // Center home
    } else {
        ctx.arc(cx - (x / 2) * scale, cy + (y / 2) * scale, 5, 0, Math.PI * 2); // Front-Left home
    }
    ctx.fill();

    // 4. Draw Purge Line Indicator (Pink Line)
    if (usePurge) {
        ctx.strokeStyle = "#ff00ff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (kin === 'delta') {
            // Purge at the front edge of the circular bed
            const purgeY = cy + (y / 2 - m) * scale;
            ctx.moveTo(cx - 15 * scale, purgeY);
            ctx.lineTo(cx + 15 * scale, purgeY);
        } else {
            // Purge at the front-left edge
            const purgeX = cx - (x / 2 - m) * scale;
            const purgeY = cy + (y / 2 - m) * scale;
            ctx.moveTo(purgeX, purgeY);
            ctx.lineTo(purgeX + (40 * scale), purgeY);
        }
        ctx.stroke();
        ctx.lineWidth = 1;
    }
}

/**
 * Main Generation Function
 * Gathers UI data and runs it through GCODE_TEMPLATES
 */
function generateMacros() {
    // Collect Inputs
    const kin = document.getElementById('kin').value;
    const x = parseFloat(document.getElementById('maxX').value);
    const y = parseFloat(document.getElementById('maxY').value);
    const z = parseFloat(document.getElementById('maxZ').value);
    const m = parseFloat(document.getElementById('margin').value) || 20;
    const bowden = document.getElementById('bowden').value || 450;
    
    const useLED = document.getElementById('useLED').value === 'true';
    const ledName = document.getElementById('ledName').value || 'status_leds';
    const usePurge = document.getElementById('usePurge').value === 'true';
    const useChamber = document.getElementById('useChamber').value === 'true';
    const tLevel = document.getElementById('tortureLevel').value;
    
    // Logic Calculations
    const tSpeed = (tLevel === 'aggressive') ? 800000 : 500000;
    
    // Parking Logic
    let pkX = (kin === 'delta') ? 0 : x / 2;
    let pkY = (kin === 'delta') ? 0 : (kin === 'bedslinger' ? y - 5 : y / 2);

    // Purge Location Logic (Calculated based on Archetype origin)
    let pStart, pEnd;
    if (kin === 'delta') {
        pStart = `X-7.5 Y-${(y / 2 - m).toFixed(1)}`;
        pEnd = `X7.5 Y-${(y / 2 - m).toFixed(1)}`;
    } else {
        pStart = `X${m} Y${m}`;
        pEnd = `X${m + 40} Y${m}`;
    }

    // --- ASSEMBLE G-CODE ---
    let finalCode = GCODE_TEMPLATES.header(kin, x, y, z, m);
    
    // 1. Variables
    finalCode += GCODE_TEMPLATES.user_vars(pkX, pkY, z - 10, bowden, m);
    
    // 2. Conditional Features
    if (useLED) {
        finalCode += GCODE_TEMPLATES.lighting(ledName);
    }
    
    // 3. Maintenance & Diagnostics
    finalCode += GCODE_TEMPLATES.diagnostics(kin);
    
    // 4. Torture Suite
    finalCode += GCODE_TEMPLATES.torture(x, y, z, m, tSpeed);
    
    // 5. Core Operations
    finalCode += GCODE_TEMPLATES.core_ops(kin, usePurge, pStart, pEnd);
    
    // 6. Utility & Safety
    finalCode += GCODE_TEMPLATES.utility(useChamber);

    // Update UI Output
    const outputElement = document.getElementById('gcodeOutput');
    outputElement.innerText = finalCode;
    
    const outputCard = document.getElementById('outputCard');
    outputCard.classList.remove('hidden');
    outputCard.style.display = 'block'; // Ensure it overrides any CSS hidden states
    
    // Smooth scroll to results
    outputCard.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Copy result to clipboard
 */
function copyToClipboard() {
    const text = document.getElementById('gcodeOutput').innerText;
    if (!text) return;
    
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector('.btn-secondary');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => { btn.innerHTML = originalText; }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

/**
 * Trigger File Download
 */
function downloadConfig() {
    const text = document.getElementById('gcodeOutput').innerText;
    if (!text) return;

    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'macros.cfg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Ensure UI is initialized when the script loads
window.onload = updateUI;