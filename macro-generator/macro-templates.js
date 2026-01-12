const GCODE_TEMPLATES = {
    header: (kin, x, y, z) => `#=====================================================#
# KANROG GENERATED CONFIG | Archetype: ${kin.toUpperCase()}
# Bed: ${x}x${y}x${z} | Date: ${new Date().toLocaleDateString()}
#=====================================================#\n\n`,

    user_vars: (x, y, z, m, bowden) => `[gcode_macro _USER_VARS]
variable_park_x: ${x}
variable_park_y: ${y}
variable_z_park: ${z - 10}
variable_bowden: ${bowden}
variable_margin: ${m}
gcode:\n\n`,

    led_macros: (name, bright, idle, print) => `[gcode_macro LED_IDLE]
gcode: SET_LED LED=${name} RED=${idle[0]} GREEN=${idle[1]} BLUE=${idle[2]} BRIGHTNESS=${bright}

[gcode_macro LED_PRINT]
gcode: SET_LED LED=${name} RED=${print[0]} GREEN=${print[1]} BLUE=${print[2]} BRIGHTNESS=${bright}

[gcode_macro LED_HEATING]
gcode: SET_LED LED=${name} RED=1.0 GREEN=0 BLUE=0\n\n`,

    core_ops: (kin, usePurge) => `[gcode_macro PRINT_START]
gcode:
    {% set T_BED = params.T_BED|default(60)|float %}
    {% set T_EXTRUDER = params.T_EXTRUDER|default(200)|float %}
    LED_HEATING
    M190 S{T_BED}
    G28
    M109 S{T_EXTRUDER}
    LED_PRINT
    ${usePurge ? 'PURGE' : '# PURGE DISABLED'}

[gcode_macro END_PRINT]
gcode:
    G91
    G1 E-15 F1000
    G90
    G28
    TURN_OFF_HEATERS
    LED_IDLE
    M106 S0\n\n`,

    maintenance: `[gcode_macro BUZZ_MOTORS]
gcode: STEPPER_BUZZ STEPPER=stepper_a; STEPPER_BUZZ STEPPER=stepper_b; STEPPER_BUZZ STEPPER=stepper_c

[gcode_macro E_CALIBRATE]
gcode: G91; G1 E50 F60; G90\n\n`
};
