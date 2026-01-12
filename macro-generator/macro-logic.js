/**
 * KLIPPER MACRO GENERATOR - LOGIC ENGINE
 * VERSION: 2026.01.12 - FULL EXPANSION BUILD
 * * This script manages the interaction between the user interface and the 
 * GCODE_TEMPLATES library. It handles real-time canvas updates and 
 * the final assembly of the configuration file.
 */

const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');

/**
 * Updates the 2D Canvas Preview.
 * Visually represents the bed size, safety margins, and homing origins.
 */
function updateUI() {
    // Collect current values from the DOM
    const kin = document.getElementById('kin').value;
    const x = parseFloat(document.getElementById('maxX').value) || 235;
    const y = parseFloat(document.getElementById('maxY').value) || 235;
    const m = parseFloat(document.getElementById('margin').value) || 20;
    const usePurge = document.getElementById('usePurge').value === 'true';

    // Reset the canvas for a fresh frame
    ctx.clearRect(0, 0, 300, 200);

    // Calculate drawing scale (120px max size for better fit)
    const scale = 120 / Math.max(x, y);
    const centerX = 150;
    const centerY = 100;

    // --- 1. Draw the Printer Bed ---
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.beginPath();
    
    if (kin === 'delta') {
        // Delta printers use a circular coordinate system centered at 0,0
        ctx.arc(centerX, centerY, (x / 2) * scale, 0, Math.PI * 2);
    } else {
        // Cartesian and CoreXY use a rectangular coordinate system
        ctx.rect(centerX - (x / 2) * scale, centerY - (y / 2) * scale, x * scale, y * scale);
    }
    ctx.fill();

    // --- 2. Draw the Safety Margin (Safe Zone) ---
    ctx.strokeStyle = "#a29bfe";
    ctx.setLineDash([5, 5]); // Dashed line to indicate boundary
    ctx.beginPath();
    
    if (kin === 'delta') {
        ctx.arc(centerX, centerY, (x / 2 - m) * scale, 0, Math.PI * 2);
    } else {
        ctx.rect(
            centerX - (x / 2 - m) * scale, 
            centerY - (y / 2 - m) * scale, 
            (x - m * 2) * scale, 
            (y - m * 2) * scale
        );
    }
    ctx.stroke();

    // --- 3. Draw Homing Origin (Red Indicator) ---
    ctx.fillStyle = "#ff4d4d";
    ctx.setLineDash([]); // Solid line for point
    ctx.beginPath();
    
    if (kin === 'delta') {
        // Delta homes to Center (0,0)
        ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    } else {
        // Cartesian usually homes to Front-Left (0,0)
        ctx.arc(centerX - (x / 2) * scale, centerY + (y / 2) * scale, 5, 0, Math.PI * 2);
    }
    ctx.fill();

    // --- 4. Draw Purge Line (Pink Indicator) ---
    if (usePurge) {
        ctx.strokeStyle = "#ff00ff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        if (kin === 'delta') {
            // Delta purge line follows the front arc of the circle
            const purgeY = centerY + (y / 2 - m) * scale;
            ctx.moveTo(centerX - 15 * scale, purgeY);
            ctx.lineTo(centerX + 15 * scale, purgeY);
        } else {
            // Cartesian purge line at the front edge of the bed
            const purgeX = centerX - (x / 2 - m) * scale;
            const purgeY = centerY + (y / 2 - m) * scale;
            ctx.moveTo(purgeX, purgeY);
            ctx.lineTo(purgeX + (40 * scale), purgeY);
        }
        ctx.stroke();
        ctx.lineWidth = 1; // Reset line width for other drawings
    }
}

/**
 * Generates the Final Macro Configuration.
 * Pulls every individual setting and runs it through GCODE_TEMPLATES.
 */
function generateMacros() {
    // 1. Collect Mechanical & Movement Settings
    const kin = document.getElementById('kin').value;
    const maxX = parseFloat(document.getElementById('maxX').value) || 235;
    const maxY = parseFloat(document.getElementById('maxY').value) || 235;
    const maxZ = parseFloat(document.getElementById('maxZ').value) || 250;
    const margin = parseFloat(document.getElementById('margin').value) || 20;

    // 2. Collect Logistic Settings
    const bowdenLength = document.getElementById('bowden').value || 450;
    const useChamber = document.getElementById('useChamber').value === 'true';
    const usePurge = document.getElementById('usePurge').value === 'true';
    const heatingStyle = document.getElementById('heatStyle').value;

    // 3. Collect Lighting & Performance Settings
    const useLED = document.getElementById('useLED').value === 'true';
    const ledName = document.getElementById('ledName').value || 'status_leds';
    const idleColor = document.getElementById('colorIdle').value || 'BLUE';
    const printColor = document.getElementById('colorPrint').value || 'WHITE';
    const tortureLevel = document.getElementById('tortureLevel').value;
    
    // 4. Determine Torture Speed Variable
    let movementSpeed = 500000; 
    if (tortureLevel === 'aggressive') {
        movementSpeed = 800000;
    }
    
    // 5. Calculate Toolhead Parking Logic
    let parkXCoord = 0;
    let parkYCoord = 0;

    if (kin === 'delta') {
        // Delta parking is usually center
        parkXCoord = 0;
        parkYCoord = 0;
    } else if (kin === 'bedslinger') {
        // Bedslingers park the bed forward for part removal
        parkXCoord = maxX / 2;
        parkYCoord = maxY - 5;
    } else {
        // CoreXY usually parks center-rear or absolute center
        parkXCoord = maxX / 2;
        parkYCoord = maxY / 2;
    }

    // 6. Calculate Purge Coordinates for Template Placeholder
    let purgeStartString = "";
    let purgeEndString = "";

    if (kin === 'delta') {
        purgeStartString = "X-7.5 Y-" + (maxY / 2 - margin).toFixed(1);
        purgeEndString = "X7.5 Y-" + (maxY / 2 - margin).toFixed(1);
    } else {
        purgeStartString = "X" + margin + " Y" + margin;
        purgeEndString = "X" + (margin + 40) + " Y" + margin;
    }

    // --- 7. CONFIGURATION ASSEMBLY ---
    let finalGcodeBuffer = "";

    // Header
    finalGcodeBuffer += GCODE_TEMPLATES.header(kin, maxX, maxY, maxZ, margin);
    
    // Global Variables Block
    finalGcodeBuffer += GCODE_TEMPLATES.user_vars(parkXCoord, parkYCoord, maxZ - 10, bowdenLength, margin);
    
    // Lighting Suite
    if (useLED === true) {
        finalGcodeBuffer += GCODE_TEMPLATES.lighting(ledName, idleColor, printColor);
    }
    
    // Maintenance & Diagnostics
    finalGcodeBuffer += GCODE_TEMPLATES.diagnostics(kin);
    
    // Torture Tests
    finalGcodeBuffer += GCODE_TEMPLATES.torture(maxX, maxY, maxZ, margin, movementSpeed);
    
    // Print Start/End/Pause
    finalGcodeBuffer += GCODE_TEMPLATES.core_ops(kin, usePurge, purgeStartString, purgeEndString, heatingStyle);
    
    // Utility and Chamber
    finalGcodeBuffer += GCODE_TEMPLATES.utility(useChamber);

    // --- 8. FINAL RENDER ---
    const outputField = document.getElementById('gcodeOutput');
    outputField.innerText = finalGcodeBuffer;
    
    const outputCard = document.getElementById('outputCard');
    outputCard.classList.remove('hidden');
    outputCard.style.display = 'block';
    
    // Provide user feedback with a smooth scroll
    outputCard.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Copy to clipboard helper
 */
function copyToClipboard() {
    const rawGcode = document.getElementById('gcodeOutput').innerText;
    if (!rawGcode) {
        return;
    }

    navigator.clipboard.writeText(rawGcode).then(function() {
        alert("Configuration copied to clipboard!");
    }).catch(function(err) {
        console.error('Could not copy text: ', err);
    });
}

/**
 * File Download helper
 */
function downloadConfig() {
    const rawGcode = document.getElementById('gcodeOutput').innerText;
    if (!rawGcode) {
        return;
    }

    const fileBlob = new Blob([rawGcode], { type: 'text/plain' });
    const downloadUrl = URL.createObjectURL(fileBlob);
    const hiddenLink = document.createElement('a');
    
    hiddenLink.href = downloadUrl;
    hiddenLink.download = 'macros.cfg';
    document.body.appendChild(hiddenLink);
    hiddenLink.click();
    document.body.removeChild(hiddenLink);
    
    // Free up memory
    URL.revokeObjectURL(downloadUrl);
}

// Ensure visualizer is ready on page load
window.onload = function() {
    updateUI();
};