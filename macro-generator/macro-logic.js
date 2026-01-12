const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');

function toggleCustomTemps() {
    document.getElementById('customTempPanel').style.display = (document.getElementById('filament').value === 'custom') ? 'grid' : 'none';
}

function updateUI() {
    const kin = document.getElementById('kin').value;
    const x = parseFloat(document.getElementById('maxX').value) || 235;
    const y = parseFloat(document.getElementById('maxY').value) || 235;
    const m = 20;

    ctx.clearRect(0,0,300,200);
    const scale = 120 / Math.max(x, y);
    const cx = 150, cy = 100;

    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.beginPath();
    if(kin === 'delta') ctx.arc(cx, cy, (x/2)*scale, 0, Math.PI*2);
    else ctx.rect(cx-(x/2)*scale, cy-(y/2)*scale, x*scale, y*scale);
    ctx.fill();

    ctx.strokeStyle = "#a29bfe";
    ctx.setLineDash([5,5]);
    ctx.beginPath();
    if(kin === 'delta') ctx.arc(cx, cy, (x/2-m)*scale, 0, Math.PI*2);
    else ctx.rect(cx-(x/2-m)*scale, cy-(y/2-m)*scale, (x-m*2)*scale, (y-m*2)*scale);
    ctx.stroke();
}

function generateMacros() {
    const kin = document.getElementById('kin').value;
    const x = parseFloat(document.getElementById('maxX').value);
    const y = parseFloat(document.getElementById('maxY').value);
    const z = parseFloat(document.getElementById('maxZ').value);
    const m = 20;
    
    const useLED = document.getElementById('useLED').value === 'true';
    const ledName = document.getElementById('ledName').value || 'status_leds';
    const usePurge = document.getElementById('usePurge').value === 'true';

    // Calculate Coordinates
    let pkX = (kin==='delta') ? 0 : x/2;
    let pkY = (kin==='delta') ? 0 : (kin==='bedslinger' ? y-5 : y/2);
    let pStart = (kin==='delta') ? `X-10 Y-${(y/2-m)}` : `X${m} Y${m}`;
    let pEnd = (kin==='delta') ? `X10 Y-${(y/2-m)}` : `X${m+40} Y${m}`;

    let gcode = GCODE_TEMPLATES.header(kin, x, y, z, m);
    gcode += GCODE_TEMPLATES.user_vars(pkX, pkY, z-10, 450, m, 15, 20);
    
    if(useLED) {
        const idle = document.getElementById('colorIdle').value.split(',');
        const print = document.getElementById('colorPrint').value.split(',');
        gcode += GCODE_TEMPLATES.lighting(ledName, 0.5, idle, print);
    }

    gcode += GCODE_TEMPLATES.diagnostics(kin);
    gcode += GCODE_TEMPLATES.torture(x, y, z, m);
    gcode += GCODE_TEMPLATES.core_ops(kin, 'staged', usePurge, pStart, pEnd);
    gcode += GCODE_TEMPLATES.utility;

    document.getElementById('gcodeOutput').innerText = gcode;
    document.getElementById('outputCard').classList.remove('hidden');
}

function copyToClipboard() {
    navigator.clipboard.writeText(document.getElementById('gcodeOutput').innerText).then(() => alert("Copied!"));
}

function downloadConfig() {
    const blob = new Blob([document.getElementById('gcodeOutput').innerText], {type: 'text/plain'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'macros.cfg';
    a.click();
}

updateUI();