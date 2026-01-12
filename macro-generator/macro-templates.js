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

    lighting: (name, idle, print) => `[neopixel status_leds]
pin: gpio6 
chain_count: 12
color_order: GRB

[gcode_macro LED_RED]
gcode: SET_LED LED=status_leds RED=1 GREEN=0 BLUE=0 TRANSMIT=1
[gcode_macro LED_IDLE]
gcode: SET_LED LED=status_leds RED=${idle[0]} GREEN=${idle[1]} BLUE=${idle[2]} TRANSMIT=1
[gcode_macro LED_PRINT]
gcode: SET_LED LED=status_leds RED=${print[0]} GREEN=${print[1]} BLUE=${print[2]} TRANSMIT=1

[gcode_macro LED_CYCLE]
gcode:
    {% for repeat in range(4) %}
    LED_RED
    G4 P100
    SET_LED LED=status_leds RED=1 GREEN=0.5 BLUE=0 TRANSMIT=1
    G4 P100
    SET_LED LED=status_leds RED=0 GREEN=1 BLUE=0 TRANSMIT=1
    G4 P100
    {% endfor %}
    LED_IDLE

[delayed_gcode Welcome]
initial_duration: 1
gcode:
    LED_CYCLE\n\n`,

    diagnostics: (kin) => `[gcode_macro BUZZ_MOTORS]
gcode:
    STEPPER_BUZZ STEPPER=stepper_a
    STEPPER_BUZZ STEPPER=stepper_b
    STEPPER_BUZZ STEPPER=stepper_c

[gcode_macro E_CALIBRATE]
gcode:
    G28
    G91
    G1 E50 F60
    G4 P5000
    G90

[gcode_macro CALIBRATE_BED]
gcode:
    G28
    ${kin === 'delta' ? 'DELTA_CALIBRATE_MANUAL' : 'BED_MESH_CALIBRATE'}\n\n`,

    torture: (x, y, z, m, speed) => `[gcode_macro TORTURE_XY]
gcode:
    {% if "xyz" not in printer.toolhead.homed_axes %} G28 {% endif %}
    G91
    {% for i in range(8) %}
    G1 X+${(x-m*2).toFixed(1)} Y+${(y-m*2).toFixed(1)} F${speed}
    G1 X-${(x-m*2).toFixed(1)} Y-${(y-m*2).toFixed(1)} F${speed}
    {% endfor %}
    G90

[gcode_macro TORTURE_SHAKE]
gcode:
    {% if "xyz" not in printer.toolhead.homed_axes %} G28 {% endif %}
    G91
    {% for i in range(20) %}
    G1 X+15 F${speed}
    G1 X-15 F${speed}
    {% endfor %}
    G90\n\n`,

    core_ops: (kin, usePurge, purgeStart, purgeEnd) => `[gcode_macro PRINT_START]
gcode:
    LED_CYCLE
    {% set T_BED = params.T_BED|default(60)|float %}
    {% set T_EXTRUDER = params.T_EXTRUDER|default(200)|float %}
    M140 S{T_BED}
    M190 S{T_BED}
    G28
    M109 S{T_EXTRUDER}
    LED_PRINT
    G90
    ${usePurge ? 'PURGE' : '# PURGE DISABLED'}

[gcode_macro END_PRINT]
gcode:
    G91; G1 E-15 F1000; G90
    G28
    TURN_OFF_HEATERS
    LED_CYCLE
    M106 S0

[gcode_macro PURGE]
gcode:
    G90
    G1 Z0.3 F3000
    G1 ${purgeStart} F3000
    G1 ${purgeEnd} E15 F300
    G92 E0\n\n`,

    utility: (useChamber) => `${useChamber ? `[gcode_macro HEAT_CHAMBER]
gcode:
    G28
    G90
    G1 X0 Y0 Z10 F3000
    M140 S100
    M106 S255
    G4 S1800\n\n` : ''}
[exclude_object]
[pause_resume]
[display_status]`
};