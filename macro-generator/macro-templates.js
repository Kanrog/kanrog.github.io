const GCODE_TEMPLATES = {
    header: (kin, x, y, z, m) => `#=====================================================#
# KANROG UNIVERSAL MACRO SET | ARCHETYPE: ${kin.toUpperCase()}
# Bed: ${x}x${y}x${z} | Margin: ${m}mm
#=====================================================#\n\n`,

    user_vars: (pkX, pkY, zPark, bowden, m, endRetract, m600Purge) => `[gcode_macro _USER_VARS]
variable_park_x: ${pkX}
variable_park_y: ${pkY}
variable_z_park: ${zPark}
variable_bowden: ${bowden}
variable_margin: ${m}
variable_end_retract: ${endRetract}
variable_m600_purge: ${m600Purge}
gcode:\n\n`,

    lighting: (name, br, idle, print) => `[neopixel ${name}]
pin: gpio6 # Edit to your actual control pin
chain_count: 12
color_order: GRB

[gcode_macro LED_RED]
gcode: SET_LED LED=${name} RED=1 GREEN=0 BLUE=0 TRANSMIT=1
[gcode_macro LED_ORANGE]
gcode: SET_LED LED=${name} RED=1 GREEN=0.5 BLUE=0 TRANSMIT=1
[gcode_macro LED_GREEN]
gcode: SET_LED LED=${name} RED=0 GREEN=1 BLUE=0 TRANSMIT=1
[gcode_macro LED_BLUE]
gcode: SET_LED LED=${name} RED=0 GREEN=0 BLUE=1 TRANSMIT=1
[gcode_macro LED_WHITE]
gcode: SET_LED LED=${name} RED=1 GREEN=1 BLUE=1 TRANSMIT=1
[gcode_macro LED_OFF]
gcode: SET_LED LED=${name} RED=0 GREEN=0 BLUE=0 TRANSMIT=1

[gcode_macro LED_IDLE]
gcode: SET_LED LED=${name} RED=${idle[0]} GREEN=${idle[1]} BLUE=${idle[2]} TRANSMIT=1
[gcode_macro LED_PRINT]
gcode: SET_LED LED=${name} RED=${print[0]} GREEN=${print[1]} BLUE=${print[2]} TRANSMIT=1

[gcode_macro LED_CYCLE]
gcode:
    {% for repeat in range(4) %}
    LED_RED
    G4 P100
    LED_ORANGE
    G4 P100
    LED_GREEN
    G4 P100
    LED_BLUE
    G4 P100
    {% endfor %}
    LED_IDLE

[delayed_gcode Welcome]
initial_duration: 1
gcode:
    LED_CYCLE
    LED_IDLE\n\n`,

    diagnostics: (kin) => `[gcode_macro BUZZ_A]
gcode: STEPPER_BUZZ STEPPER=stepper_a
[gcode_macro BUZZ_B]
gcode: STEPPER_BUZZ STEPPER=stepper_b
[gcode_macro BUZZ_C]
gcode: STEPPER_BUZZ STEPPER=stepper_c
[gcode_macro BUZZ_E]
gcode: STEPPER_BUZZ STEPPER=extruder

[gcode_macro E_CALIBRATE]
description: Extrude 50mm slowly for rotation distance calibration
gcode:
    {% if "xyz" not in printer.toolhead.homed_axes %} G28 {% endif %}
    LED_WHITE
    G91
    G1 E50 F60
    G4 P5000
    LED_IDLE

[gcode_macro PROBE_TEST]
gcode:
    {% if "xyz" not in printer.toolhead.homed_axes %} G28 {% endif %}
    PROBE_ACCURACY SAMPLES=10

[gcode_macro CALIBRATE_BED]
gcode:
    {% if "xyz" not in printer.toolhead.homed_axes %} G28 {% endif %}
    ${kin === 'delta' ? 'DELTA_CALIBRATE_MANUAL' : 'BED_MESH_CALIBRATE'}\n\n`,

    torture: (x, y, z, m) => `[gcode_macro TORTURE_XY]
gcode:
    {% if "xyz" not in printer.toolhead.homed_axes %} G28 {% endif %}
    G90
    G1 Z20 F1500
    G91
    {% for i in range(8) %}
    G1 X+${(x-m*2).toFixed(1)} Y+${(y-m*2).toFixed(1)} F500000
    G1 X-${(x-m*2).toFixed(1)} Y-${(y-m*2).toFixed(1)} F500000
    {% endfor %}
    G90

[gcode_macro TORTURE_SHAKE]
gcode:
    {% if "xyz" not in printer.toolhead.homed_axes %} G28 {% endif %}
    G91
    {% for i in range(16) %}
    G1 X+15 F800000
    G1 X-15 F800000
    {% endfor %}
    G90\n\n`,

    core_ops: (kin, heat, usePurge, purgeStart, purgeEnd) => `[gcode_macro PRINT_START]
gcode:
    LED_CYCLE
    {% set T_BED = params.T_BED|default(60)|float %}
    {% set T_EXTRUDER = params.T_EXTRUDER|default(200)|float %}
    M140 S{T_BED}
    ${heat === 'staged' ? 'M190 S{T_BED * 0.85}\nM109 S{T_EXTRUDER}\nM190 S{T_BED}' : 'M109 S{T_EXTRUDER}\nM190 S{T_BED}'}
    G28
    LED_PRINT
    G90
    ${usePurge ? 'PURGE' : '# PURGE DISABLED'}

[gcode_macro END_PRINT]
gcode:
    G91
    G1 E-15 F1000
    G90
    G28
    TURN_OFF_HEATERS
    LED_CYCLE
    LED_IDLE
    M106 S0

[gcode_macro PURGE]
gcode:
    G90
    G1 Z0.3 F3000
    G1 ${purgeStart} F3000
    G1 ${purgeEnd} E15 F300
    G92 E0

[gcode_macro M600]
gcode:
    SAVE_GCODE_STATE NAME=M600_state
    PAUSE
    G91
    G1 E-.8 F2700
    G1 Z10
    G90
    G1 X{printer["gcode_macro _USER_VARS"].park_x} Y{printer["gcode_macro _USER_VARS"].park_y} F3000
    RESTORE_GCODE_STATE NAME=M600_state

[gcode_macro RESUME]
rename_existing: RESUME_BASE
gcode:
    G91
    G1 E{printer["gcode_macro _USER_VARS"].m600_purge} F300
    G90
    RESUME_BASE
    LED_PRINT\n\n`,

    utility: `[gcode_macro HEAT_CHAMBER]
gcode:
    {% if "xyz" not in printer.toolhead.homed_axes %} G28 {% endif %}
    LED_ORANGE
    G90
    G1 Z10 F5000
    G1 X0 Y0 F3000
    M140 S100
    M106 S255
    G4 S1800
    LED_IDLE

[gcode_macro _LOW_TEMP_CHECK]
gcode:
    {% set T = params.T|default(200)|int %}
    {% if printer.extruder.temperature < T %}
        M109 S{T}
    {% endif %}\n\n[exclude_object]\n[pause_resume]\n[display_status]`
};