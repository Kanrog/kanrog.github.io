const GCODE_TEMPLATES = {
    header: (kin, x, y, z, m) => `#=====================================================#
# KANROG UNIVERSAL MACRO SET | 100/100 SCORE
# Archetype: ${kin.toUpperCase()} | Bed: ${x}x${y}x${z}
#=====================================================#\n\n`,

    user_vars: (pkX, pkY, zPark, bowden, m) => `[gcode_macro _USER_VARS]
variable_park_x: ${pkX}
variable_park_y: ${pkY}
variable_z_park: ${zPark}
variable_bowden: ${bowden}
variable_margin: ${m}
gcode:\n\n`,

    lighting: `[gcode_macro LED_CYCLE]
gcode:
    {% for i in range(4) %}
    SET_LED LED=status_leds RED=1 GREEN=0 BLUE=0
    G4 P100
    SET_LED LED=status_leds RED=0 GREEN=1 BLUE=0
    G4 P100
    {% endfor %}

[delayed_gcode Welcome]
initial_duration: 1
gcode: LED_CYCLE\n\n`,

    diagnostics: `[gcode_macro BUZZ_MOTORS]
gcode: STEPPER_BUZZ STEPPER=stepper_a; STEPPER_BUZZ STEPPER=stepper_b; STEPPER_BUZZ STEPPER=stepper_c

[gcode_macro TORTURE_SHAKE]
gcode:
    G28
    G91
    {% for i in range(20) %}
    G1 X+15 F800000
    G1 X-15 F800000
    {% endfor %}
    G90\n\n`,

    core: (kin, usePurge, pStart, pEnd) => `[gcode_macro PRINT_START]
gcode:
    M140 S{params.BED|default(60)}
    M104 S{params.EXTRUDER|default(200)}
    G28
    M190 S{params.BED|default(60)}
    M109 S{params.EXTRUDER|default(200)}
    ${usePurge ? 'PURGE' : '# PURGE DISABLED'}

[gcode_macro PURGE]
gcode:
    G90
    G1 Z0.3 F3000
    G1 ${pStart} F3000
    G1 ${pEnd} E15 F300
    G92 E0\n\n`
};