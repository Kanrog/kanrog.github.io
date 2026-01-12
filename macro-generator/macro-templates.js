/**
 * KLIPPER MACRO TEMPLATES LIBRARY
 * Contains all core logic for Flyer, CoreXY, and Bedslinger printers.
 * Placeholders are injected via macro-logic.js
 */

const GCODE_TEMPLATES = {
    // 1. Header & Variables
    header: (kin, x, y, z, m) => `#=====================================================#
# KANROG UNIVERSAL MACRO SET | ARCHETYPE: ${kin.toUpperCase()}
# Generated Bed Volume: ${x}x${y}x${z} | Margin: ${m}mm
#=====================================================#\n\n`,

    user_vars: (pkX, pkY, zPark, bowden, m) => `[gcode_macro _USER_VARS]
variable_park_x: ${pkX}
variable_park_y: ${pkY}
variable_z_park: ${zPark}
variable_bowden: ${bowden}
variable_margin: ${m}
gcode:\n\n`,

    // 2. Lighting Suite (Flyer Signature)
    lighting: (name) => `#==================================#
# LED CONTROL & COLOR PRESETS
#==================================#
[gcode_macro LED_RED]
gcode: SET_LED LED=${name} RED=1 GREEN=0 BLUE=0 TRANSMIT=1

[gcode_macro LED_ORANGE]
gcode: SET_LED LED=${name} RED=1 GREEN=0.5 BLUE=0 TRANSMIT=1

[gcode_macro LED_YELLOW]
gcode: SET_LED LED=${name} RED=1 GREEN=1 BLUE=0 TRANSMIT=1

[gcode_macro LED_GREEN]
gcode: SET_LED LED=${name} RED=0 GREEN=1 BLUE=0 TRANSMIT=1

[gcode_macro LED_BLUE]
gcode: SET_LED LED=${name} RED=0 GREEN=0 BLUE=1 TRANSMIT=1

[gcode_macro LED_PURPLE]
gcode: SET_LED LED=${name} RED=1 GREEN=0 BLUE=1 TRANSMIT=1

[gcode_macro LED_WHITE]
gcode: SET_LED LED=${name} RED=0.8 GREEN=0.8 BLUE=0.8 TRANSMIT=1

[gcode_macro LED_OFF]
gcode: SET_LED LED=${name} RED=0 GREEN=0 BLUE=0 TRANSMIT=1

[gcode_macro LED_IDLE]
gcode: SET_LED LED=${name} RED=0.2 GREEN=0.2 BLUE=0.2 TRANSMIT=1

[gcode_macro LED_PRINT]
gcode: SET_LED LED=${name} RED=0.8 GREEN=0.8 BLUE=0.8 TRANSMIT=1

[gcode_macro LED_CYCLE]
description: The Flyer Lightshow!
gcode:
    {% for repeat in range(4) %}
    LED_RED
    G4 P100
    LED_ORANGE
    G4 P100
    LED_YELLOW
    G4 P100
    LED_GREEN
    G4 P100
    LED_BLUE
    G4 P100
    LED_PURPLE
    G4 P100
    {% endfor %}
    LED_IDLE

[delayed_gcode Welcome]
initial_duration: 1
gcode:
    LED_CYCLE\n\n`,

    // 3. Diagnostics & Calibration
    diagnostics: (kin) => `#==================================#
# DIAGNOSTICS & CALIBRATION
#==================================#
[gcode_macro BUZZ_A]
gcode: STEPPER_BUZZ STEPPER=stepper_a

[gcode_macro BUZZ_B]
gcode: STEPPER_BUZZ STEPPER=stepper_b

[gcode_macro BUZZ_C]
gcode: STEPPER_BUZZ STEPPER=stepper_c

[gcode_macro BUZZ_E]
gcode: STEPPER_BUZZ STEPPER=extruder

[gcode_macro E_CALIBRATE]
description: Rotation distance calibration (50mm)
gcode:
    {% if "xyz" not in printer.toolhead.homed_axes %} G28 {% endif %}
    LED_WHITE
    G91; G1 E50 F60; G4 P5000; G90
    LED_IDLE

[gcode_macro PROBE_TEST]
description: Runs a 10-sample probe accuracy test
gcode:
    {% if "xyz" not in printer.toolhead.homed_axes %} G28 {% endif %}
    G90
    G1 X{printer["gcode_macro _USER_VARS"].park_x} Y{printer["gcode_macro _USER_VARS"].park_y} Z10 F3000
    PROBE_ACCURACY SAMPLES=10

[gcode_macro CALIBRATE_BED]
gcode:
    {% if "xyz" not in printer.toolhead.homed_axes %} G28 {% endif %}
    ${kin === 'delta' ? 'DELTA_CALIBRATE METHOD=manual' : 'BED_MESH_CALIBRATE'}

[gcode_macro PID_HOTEND]
gcode:
    G28; G1 Z10 F600; M106 S255
    PID_CALIBRATE HEATER=extruder TARGET=210
    SAVE_CONFIG

[gcode_macro PID_HOTBED]
gcode:
    G28; PID_CALIBRATE HEATER=heater_bed TARGET=60
    SAVE_CONFIG

${kin === 'delta' ? `[gcode_macro ENDSTOPS_CALIBRATION]
description: Delta Endstop Phase Calibration
gcode:
    G28; G91; G0 Z-50 F1500; G28
    ENDSTOP_PHASE_CALIBRATE stepper=stepper_a
    ENDSTOP_PHASE_CALIBRATE stepper=stepper_b
    ENDSTOP_PHASE_CALIBRATE stepper=stepper_c
    G28` : ''}\n\n`,

    // 4. Torture & Movement
    torture: (x, y, z, m, speed) => `#==================================#
# TORTURE & MOVEMENT TESTS
#==================================#
[gcode_macro TORTURE_XY]
gcode:
    {% if "xyz" not in printer.toolhead.homed_axes %} G28 {% endif %}
    G90; G1 Z20 F1500; G91
    {% for i in range(10) %}
    G1 X+${(x-m*2).toFixed(1)} Y+${(y-m*2).toFixed(1)} F${speed}
    G1 X-${(x-m*2).toFixed(1)} Y-${(y-m*2).toFixed(1)} F${speed}
    {% endfor %}
    G90

[gcode_macro TORTURE_SHAKE]
description: High-speed vibration test
gcode:
    {% if "xyz" not in printer.toolhead.homed_axes %} G28 {% endif %}
    G91
    {% for i in range(20) %}
    G1 X+15 F${speed}; G1 X-15 F${speed}
    {% endfor %}
    G90

[gcode_macro CYCLE_MOVEMENT]
description: Cycle axis movements to determine limits
gcode:
    {% if "xyz" not in printer.toolhead.homed_axes %} G28 {% endif %}
    G90; G1 Z20 F1500; G91
    {% for i in range(16) %}
    G1 X-15 F5000; G1 X+30 F5000; G1 X-15 F5000
    G1 Y-15 F5000; G1 Y+30 F5000; G1 Y-15 F5000
    {% endfor %}
    G90\n\n`,

    // 5. Core Print Operations
    core_ops: (kin, usePurge, pStart, pEnd) => `#==================================#
# START / END / FILAMENT
#==================================#
[gcode_macro PRINT_START]
gcode:
    LED_CYCLE
    {% set bedtemp = params.T_BED|default(60)|int %}
    {% set hotendtemp = params.T_EXTRUDER|default(200)|int %}
    M140 S{bedtemp}
    M190 S{bedtemp}
    G28
    M109 S{hotendtemp}
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
    M84

[gcode_macro PURGE]
gcode:
    G90; G1 Z0.3 F3000
    G1 ${pStart} F3000
    G1 ${pEnd} E15 F300
    G92 E0

[gcode_macro M600]
description: Filament change
gcode:
    SAVE_GCODE_STATE NAME=M600_state
    PAUSE
    G91; G1 E-.8 F2700; G1 Z10; G90
    G1 X{printer["gcode_macro _USER_VARS"].park_x} Y{printer["gcode_macro _USER_VARS"].park_y} F3000
    RESTORE_GCODE_STATE NAME=M600_state\n\n`,

    // 6. Utility & Safety
    utility: (useChamber) => `#==================================#
# UTILITY & SAFETY
#==================================#
${useChamber ? `[gcode_macro HEAT_CHAMBER]
description: Pre-heat enclosure using bed and fans
gcode:
    {% if "xyz" not in printer.toolhead.homed_axes %} G28 {% endif %}
    LED_ORANGE
    G90; G1 Z10 F5000; G1 X0 Y0 F1000
    M140 S100; M106 S255; G4 S1800; LED_IDLE\n\n` : ''}
[gcode_macro LOAD_FILAMENT]
gcode:
    SAVE_GCODE_STATE NAME=loading_filament
    M83; G92 E0.0
    G1 E{printer["gcode_macro _USER_VARS"].bowden} F2000
    G1 E50 F200
    G1 E-5 F400
    RESTORE_GCODE_STATE NAME=loading_filament

[gcode_macro UNLOAD_FILAMENT]
gcode:
    SAVE_GCODE_STATE NAME=unloading_filament
    G91; G1 E10 F100; G1 E-20 F600; G1 E-{printer["gcode_macro _USER_VARS"].bowden + 50} F2000
    RESTORE_GCODE_STATE NAME=unloading_filament

[gcode_macro _LOW_TEMP_CHECK]
gcode:
    {% set T = params.T|default(200)|int %}
    {% if printer.extruder.temperature < T %}
        M109 S{T}
    {% endif %}

[exclude_object]
[pause_resume]
[display_status]`
};