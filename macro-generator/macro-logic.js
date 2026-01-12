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
    const kin = document.getElementById('kin').value;
    const x = document.getElementById('maxX').value;
    const y = document.getElementById('maxY').value;
    const z = document.getElementById('maxZ').value;
    
    let gcode = GCODE_TEMPLATES.header(kin, x, y, z);
    gcode += GCODE_TEMPLATES.user_vars(x/2, y/2, z, 20, 450);
    gcode += GCODE_TEMPLATES.core_ops(kin, true);
    gcode += GCODE_TEMPLATES.maintenance;
    
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
