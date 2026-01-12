/**
 * THE KANROG UNIVERSAL MACRO LIBRARY
 * VERSION: FINAL EXPANSION 2026.01.12
 * * Contains uncompressed, fully annotated Jinja2 templates for Klipper.
 */

const GCODE_TEMPLATES = {
    // =================================================================
    // 1. FILE HEADER
    // =================================================================
    header: (kin, x, y, z, m) => 
`#====================================================================
# KANROG UNIVERSAL MACRO CONFIGURATION
# Generated for Archetype: ${kin.toUpperCase()}
# Build Volume: ${x}mm x ${y}mm x ${z}mm
# Safety Margin: ${m}mm
#====================================================================\n\n`,

    // =================================================================
    // 2. USER VARIABLE STORE
    // =================================================================
    user_vars: (pkX, pkY, zPark, bowden, m, pTemp, bTemp, mat) => 
`[gcode_macro _USER_VARS]
description: Central database for printer variables
variable_park_x: ${pkX}
variable_park_y: ${pkY}
variable_z_park: ${zPark}
variable_bowden_len: ${bowden}
variable_margin: ${m}
# --- Material Settings for ${mat} ---
variable_print_temp: ${pTemp}
variable_bed_temp: ${bTemp}
variable_material: '${mat}'
gcode:
    # This section contains no executable code
    # It is used for variable storage only\n\n`,

    // =================================================================
    // 3. FULL RGB LIGHTING SUITE
    // =================================================================
    lighting: (name, idle, print) => 
`#--------------------------------------------------------------------
# LED STATUS INDICATORS
#--------------------------------------------------------------------
[gcode_macro LED_RED]
gcode:
    SET_LED LED=${name} RED=1.0 GREEN=0.0 BLUE=0.0 TRANSMIT=1

[gcode_macro LED_ORANGE]
gcode:
    SET_LED LED=${name} RED=1.0 GREEN=0.5 BLUE=0.0 TRANSMIT=1

[gcode_macro LED_YELLOW]
gcode:
    SET_LED LED=${name} RED=1.0 GREEN=1.0 BLUE=0.0 TRANSMIT=1

[gcode_macro LED_GREEN]
gcode:
    SET_LED LED=${name} RED=0.0 GREEN=1.0 BLUE=0.0 TRANSMIT=1

[gcode_macro LED_TEAL]
gcode:
    SET_LED LED=${name} RED=0.0 GREEN=0.5 BLUE=1.0 TRANSMIT=1

[gcode_macro LED_BLUE]
gcode:
    SET_LED LED=${name} RED=0.0 GREEN=0.0 BLUE=1.0 TRANSMIT=1

[gcode_macro LED_PURPLE]
gcode:
    SET_LED LED=${name} RED=1.0 GREEN=0.0 BLUE=1.0 TRANSMIT=1

[gcode_macro LED_WHITE]
gcode:
    SET_LED LED=${name} RED=0.8 GREEN=0.8 BLUE=0.8 TRANSMIT=1

[gcode_macro LED_OFF]
gcode:
    SET_LED LED=${name} RED=0.0 GREEN=0.0 BLUE=0.0 TRANSMIT=1

[gcode_macro LED_IDLE]
description: Set LEDs to the user-defined Idle color
gcode:
    LED_${idle}

[gcode_macro LED_PRINT]
description: Set LEDs to the user-defined Print color
gcode:
    LED_${print}

[gcode_macro LED_CYCLE]
description: The Flyer Signature Light Show
gcode:
    {% for repeat in range(4) %}
        LED_RED
        G4 P150
        LED_ORANGE
        G4 P150
        LED_YELLOW
        G4 P150
        LED_GREEN
        G4 P150
        LED_TEAL
        G4 P150
        LED_BLUE
        G4 P150
        LED_PURPLE
        G4 P150
    {% endfor %}
    LED_IDLE

[delayed_gcode Welcome_Lightshow]
initial_duration: 1
gcode:
    LED_CYCLE\n\n`,

    // =================================================================
    // 4. DIAGNOSTICS & CALIBRATION
    // =================================================================
    diagnostics: (kin) => 
`#--------------------------------------------------------------------
# DIAGNOSTICS
#--------------------------------------------------------------------
[gcode_macro BUZZ_MOTORS]
description: Test all steppers for connectivity
gcode: 
    STEPPER_BUZZ STEPPER=stepper_a
    STEPPER_BUZZ STEPPER=stepper_b
    STEPPER_BUZZ STEPPER=stepper_c
    STEPPER_BUZZ STEPPER=extruder

[gcode_macro PID_HOTEND]
description: PID Tune Hotend to Preset Temp
gcode:
    {% if "xyz" not in printer.toolhead.homed_axes %}
        G28
    {% endif %}
    G90
    G1 Z10 F600
    M106 S255
    PID_CALIBRATE HEATER=extruder TARGET={printer["gcode_macro _USER_VARS"].print_temp}
    SAVE_CONFIG

[gcode_macro PID_HOTBED]
description: PID Tune Bed to Preset Temp
gcode:
    {% if "xyz" not in printer.toolhead.homed_axes %}
        G28
    {% endif %}
    PID_CALIBRATE HEATER=heater_bed TARGET={printer["gcode_macro _USER_VARS"].bed_temp}
    SAVE_CONFIG

${kin === 'delta' ? `[gcode_macro ENDSTOPS_CALIBRATION]
description: Delta Endstop Phase Calibration Suite
gcode:
    G28
    G91
    G0 Z-50 F1500
    G28
    ENDSTOP_PHASE_CALIBRATE stepper=stepper_a
    ENDSTOP_PHASE_CALIBRATE stepper=stepper_b
    ENDSTOP_PHASE_CALIBRATE stepper=stepper_c
    G28` : ''}\n\n`,

    // =================================================================
    // 5. STRESS TESTING
    // =================================================================
    torture: (x, y, z, m, speed) => 
`#--------------------------------------------------------------------
# STRESS TESTS
#--------------------------------------------------------------------
[gcode_macro TORTURE_XY]
description: Full bed raster movement test
gcode:
    {% if "xyz" not in printer.toolhead.homed_axes %}
        G28
    {% endif %}
    G90
    G1 Z20 F1500
    G91
    {% for i in range(10) %}
        G1 X+${(x-m*2).toFixed(1)} Y+${(y-m*2).toFixed(1)} F${speed}
        G1 X-${(x-m*2).toFixed(1)} Y-${(y-m*2).toFixed(1)} F${speed}
    {% endfor %}
    G90

[gcode_macro TORTURE_SHAKE]
description: High-frequency short-move vibration test
gcode:
    {% if "xyz" not in printer.toolhead.homed_axes %}
        G28
    {% endif %}
    G91
    {% for i in range(20) %}
        G1 X+15 F${speed}
        G1 X-15 F${speed}
    {% endfor %}
    G90\n\n`,

    // =================================================================
    // 6. PRINT OPERATIONS
    // =================================================================
    core_ops: (kin, usePurge, pStart, pEnd, heatStyle, material) => 
`#--------------------------------------------------------------------
# CORE PRINT OPERATIONS
#--------------------------------------------------------------------
[gcode_macro PRINT_START]
description: Full Start Sequence (Heat, Home, Mesh, Purge)
gcode:
    # 1. Visual Indicator
    LED_CYCLE
    
    # 2. Get Temperatures
    {% set T_BED = params.T_BED|default(printer["gcode_macro _USER_VARS"].bed_temp)|float %}
    {% set T_EXT = params.T_EXTRUDER|default(printer["gcode_macro _USER_VARS"].print_temp)|float %}
    
    # 3. Start Bed Heating
    M140 S{T_BED}
    
    # 4. Heating Logic: ${heatStyle.toUpperCase()}
    ${heatStyle === 'staged' ? 
    `# Staged Heating: Waiting for bed to reach 85% to save PSU load
    TEMPERATURE_WAIT SENSOR=heater_bed MINIMUM={T_BED * 0.85}
    M109 S{T_EXT}
    M190 S{T_BED}` : 
    `# Parallel Heating: All heaters full power
    M109 S{T_EXT}
    M190 S{T_BED}`}
    
    # 5. Homing
    G28
    
    # 6. Load Bed Mesh for ${material}
    BED_MESH_PROFILE LOAD=${material}
    
    # 7. Print Status
    LED_PRINT
    G90
    ${usePurge ? 'PURGE' : '# Purge Disabled'}

[gcode_macro END_PRINT]
description: Safely finish print and retract
gcode:
    G91
    # Retract filament to prevent oozing
    G1 E-15 F1000
    G90
    # Move to safe home
    G28
    # Cooldown
    TURN_OFF_HEATERS
    LED_CYCLE
    M106 S0
    M84

[gcode_macro PURGE]
description: Prime the nozzle
gcode:
    G90
    G1 Z0.3 F3000
    G1 ${pStart} F3000
    G1 ${pEnd} E15 F300
    G92 E0

[gcode_macro M600]
description: Filament Change Trigger
gcode:
    SAVE_GCODE_STATE NAME=M600_state
    PAUSE
    G91
    G1 E-.8 F2700
    G1 Z10
    G90
    G1 X{printer["gcode_macro _USER_VARS"].park_x} Y{printer["gcode_macro _USER_VARS"].park_y} F3000
    RESTORE_GCODE_STATE NAME=M600_state\n\n`,

    // =================================================================
    // 7. UTILITY & MAINTENANCE
    // =================================================================
    utility: (useChamber) => 
`#--------------------------------------------------------------------
# UTILITY
#--------------------------------------------------------------------
${useChamber ? `[gcode_macro HEAT_CHAMBER]
description: Pre-heat enclosure using bed and fans
gcode:
    {% if "xyz" not in printer.toolhead.homed_axes %}
        G28
    {% endif %}
    LED_ORANGE
    G90
    G1 Z10 F5000
    G1 X0 Y0 F3000
    M140 S100
    M106 S255
    # Wait 30 minutes
    G4 S1800\n\n` : ''}

[gcode_macro LOAD_FILAMENT]
description: Load filament using preset temperatures
gcode:
    {% set T = printer["gcode_macro _USER_VARS"].print_temp %}
    M109 S{T}
    M83
    G1 E{printer["gcode_macro _USER_VARS"].variable_bowden_len} F2000
    G1 E50 F200

[gcode_macro UNLOAD_FILAMENT]
description: Unload filament using preset temperatures
gcode:
    {% set T = printer["gcode_macro _USER_VARS"].print_temp %}
    M109 S{T}
    G91
    G1 E10 F100
    G1 E-{printer["gcode_macro _USER_VARS"].variable_bowden_len + 50} F2000
    G90

[gcode_macro PAUSE]
rename_existing: PAUSE_BASE
gcode:
    PAUSE_BASE
    G91
    G1 E-2 F1000
    G90
    G1 X{printer["gcode_macro _USER_VARS"].park_x} Y{printer["gcode_macro _USER_VARS"].park_y} Z{printer.toolhead.position.z + 10} F3000
    LED_RED

[gcode_macro RESUME]
rename_existing: RESUME_BASE
gcode:
    G91
    G1 E20 F300
    G90
    RESUME_BASE
    LED_PRINT
    
[exclude_object]
[pause_resume]
[display_status]`
};