const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');

function updateUI() {
    const kin = document.getElementById('kin').value;
    const x = parseFloat(document.getElementById('maxX').value) || 200;
    const y = parseFloat(document.getElementById('maxY').value) || 200;
    const m = 20; // Internal safety margin

    ctx.clearRect(0,0,300,200);
    const scale = 120 / Math.max(x, y);
    const cx = 150, cy = 100;

    // Draw Bed
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.beginPath();
    if(kin === 'delta') ctx.arc(cx, cy, (x/2)*scale, 0, Math.PI*2);
    else ctx.rect(cx-(x/2)*scale, cy-(y/2)*scale, x*scale, y*scale);
    ctx.fill();

    // Draw Safe Zone
    ctx.strokeStyle = "#a29bfe";
    ctx.setLineDash([5,5]);
    ctx.beginPath();
    if(kin === 'delta') ctx.arc(cx, cy, (x/2-m)*scale, 0, Math.PI*2);
    else ctx.rect(cx-(x/2-m)*scale, cy-(y/2-m)*scale, (x-m*2)*scale, (y-m*2)*scale);
    ctx.stroke();
}

function generateMacros() {
    // Get all UI values
    const kin = document.getElementById('kin').value;
    const x = parseFloat(document.getElementById('maxX').value);
    const y = parseFloat(document.getElementById('maxY').value);
    const z = parseFloat(document.getElementById('maxZ').value);
    const m = parseFloat(document.getElementById('margin').value) || 20;
    const bowden = document.getElementById('bowden').value || 450;
    const useLED = document.getElementById('useLED').value === 'true';
    const ledName = document.getElementById('ledName').value || 'status_leds';
    const br = document.getElementById('ledBright').value || 0.5;
    const usePurge = document.getElementById('usePurge').value === 'true';

    // Logic for coordinates
    let pkX = (kin==='delta') ? 0 : x/2;
    let pkY = (kin==='delta') ? 0 : (kin==='bedslinger' ? y-5 : y/2);
    let pStart = (kin==='delta') ? `X-10 Y-${(y/2-m)}` : `X${m} Y${m}`;
    let pEnd = (kin==='delta') ? `X10 Y-${(y/2-m)}` : `X${m+40} Y${m}`;

    // Assemble G-Code
    let gcode = GCODE_TEMPLATES.header(kin, x, y, z, m);
    gcode += GCODE_TEMPLATES.user_vars(pkX, pkY, z-10, bowden, m, 15, 20);
    
    if(useLED) {
        const idle = document.getElementById('colorIdle').value.split(',').map(v => (v*br).toFixed(2));
        const print = document.getElementById('colorPrint').value.split(',').map(v => (v*br).toFixed(2));
        gcode += GCODE_TEMPLATES.lighting(ledName, br, idle, print);
    }

    gcode += GCODE_TEMPLATES.diagnostics(kin);
    gcode += GCODE_TEMPLATES.torture(x, y, z, m);
    gcode += GCODE_TEMPLATES.core_ops(kin, 'staged', usePurge, pStart, pEnd);
    gcode += GCODE_TEMPLATES.utility;

    document.getElementById('gcodeOutput').innerText = gcode;
    document.getElementById('outputCard').classList.remove('hidden');
}

function copyToClipboard() {
    const text = document.getElementById('gcodeOutput').innerText;
    navigator.clipboard.writeText(text).then(() => alert("Copied to clipboard!"));
}

function downloadConfig() {
    const text = document.getElementById('gcodeOutput').innerText;
    const blob = new Blob([text], {type: 'text/plain'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'macros.cfg';
    a.click();
}

// Init
updateUI();
