function updateUI() {
    const kin = document.getElementById('kin').value;
    const x = parseFloat(document.getElementById('maxX').value) || 235;
    const y = parseFloat(document.getElementById('maxY').value) || 235;
    const ctx = document.getElementById('previewCanvas').getContext('2d');
    
    ctx.clearRect(0,0,300,200);
    const scale = 120 / Math.max(x, y);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.beginPath();
    if(kin === 'delta') ctx.arc(150, 100, (x/2)*scale, 0, Math.PI*2);
    else ctx.rect(150-(x/2)*scale, 100-(y/2)*scale, x*scale, y*scale);
    ctx.fill();
}

function generateMacros() {
    const kin = document.getElementById('kin').value;
    const x = document.getElementById('maxX').value;
    const y = document.getElementById('maxY').value;
    const z = document.getElementById('maxZ').value;
    const useLED = document.getElementById('useLED').value === 'true';
    const usePurge = document.getElementById('usePurge').value === 'true';

    let pkX = (kin==='delta') ? 0 : x/2;
    let pkY = (kin==='bedslinger' ? y-5 : (kin==='delta' ? 0 : y/2));
    let pStart = (kin==='delta') ? `X-10 Y-${(y/2-20)}` : `X20 Y20`;
    let pEnd = (kin==='delta') ? `X10 Y-${(y/2-20)}` : `X60 Y20`;

    let gcode = GCODE_TEMPLATES.header(kin, x, y, z, 20);
    gcode += GCODE_TEMPLATES.user_vars(pkX, pkY, z-10, 450, 20);
    if(useLED) gcode += GCODE_TEMPLATES.lighting;
    gcode += GCODE_TEMPLATES.diagnostics;
    gcode += GCODE_TEMPLATES.core(kin, usePurge, pStart, pEnd);

    document.getElementById('gcodeOutput').innerText = gcode;
    document.getElementById('outputCard').style.display = 'block';
}

window.onload = updateUI;