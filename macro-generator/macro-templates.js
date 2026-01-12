/**
 * THE KANROG UNIVERSAL MACRO LIBRARY
 * VERSION: FINAL COMPLETE + TILT & OFFSET 2026.01.12
 */

const GCODE_TEMPLATES = {
    // =================================================================
    // 1. FILE HEADER
    // =================================================================
    header: (kin, x, y, z, m) => {
        return `#====================================================================
# KANROG UNIVERSAL MACRO CONFIGURATION
# Archetype: ${kin.toUpperCase()}
# Volume: ${x}mm x ${y}mm x ${z}mm
# Safety Margin: ${m}mm
#====================================================================\n\n`;
    },

    // =================================================================
    // 2. USER VARIABLE STORE
    // =================================================================
    user_vars: (pkX, pkY, zPark, bowden, m, pTemp, bTemp, mat, rSpeed, fSpeed) => {
        return `[gcode_macro _USER_VARS]
description: Central database for printer variables
variable_park_x: ${pkX}
variable_park_y: ${pkY}
variable_z_park: ${zPark}
variable_bowden_len: ${bowden}
variable_margin: ${m}
# --- Material Settings for ${mat} ---
variable_print_temp: ${pTemp}
variable_bed_temp: ${bTemp}
variable_retract_speed: ${rSpeed}
variable_fan_speed: ${fSpeed}
variable_material: '${mat}'
gcode:
    # This section contains no executable code
    # It is used for variable storage only\n\n`;
    },

    // =================================================================
    // 3. FULL RGB LIGHTING SUITE
    // =================================================================
    lighting: (name, idle_params, print_params) => {
        return `#--------------------------------------------------------------------
# INDIVIDUAL COLOR MACROS
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

#--------------------------------------------------------------------
# STATUS MACROS
#--------------------------------------------------------------------
[gcode_macro LED_IDLE]
description: Set LEDs to user-defined Idle color/brightness
gcode:
    SET_LED LED=${name} ${idle_params} TRANSMIT=1

[gcode_macro LED_PRINT]
description: Set LEDs to user-defined Print color/brightness
gcode:
    SET_LED LED=${name} ${print_params} TRANSMIT=1

[gcode_macro LED_HEATING]
gcode: LED_ORANGE

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
    LED_CYCLE\n\n`;
    },

    // =================================================================
    // 4. DIAGNOSTICS & PROBE & TILT
    // =================================================================
    diagnostics: (kin, probeType, useZTilt) => {
        // 1. Probe Logic (Test Accuracy, Adjust Offset, Screws Tilt)
        let probe_macro_block = "";
        if (probeType !== 'none') {
            probe_macro_block = `[gcode_macro CHECK_PROBE]
description: Test probe accuracy
gcode:
    G28
    PROBE_ACCURACY samples=10

[gcode_macro ADJUST_Z_OFFSET]
description: Calibrate Probe Z-Offset
gcode:
    G28
    PROBE_CALIBRATE

[gcode_macro SCREWS_TILT]
description: Helper for manual leveling using the probe
gcode:
    G28
    SCREWS_TILT_CALCULATE`;
        }

        // 2. Manual Logic (No Probe)
        let manual_level_block = "";
        if (probeType === 'none') {
            manual_level_block = `#=====================================================
# Manual Bed Level
#=====================================================

[gcode_macro LEVEL_BED]
description: run manual bed leveling
gcode:
    G28
    BED_SCREWS_ADJUST

#=====================================================
# Calibrate Z-Endstop location
#=====================================================

[gcode_macro Z_Calibrate]
description: Calibrate Z endstop
gcode:
    G28
    Z_ENDSTOP_CALIBRATE`;
        }

        // 3. Z-Tilt Adjustment Logic (Independent Motors)
        let z_tilt_block = "";
        if (useZTilt) {
            z_tilt_block = `[gcode_macro ALIGN_Z_GANTRY]
description: Auto-align Z gantries
gcode:
    G28
    Z_TILT_ADJUST`;
        }

        // 4. Delta Calibration Logic
        let delta_cal_block = "";
        if (kin === 'delta') {
            delta_cal_block = `[gcode_macro ENDSTOPS_CALIBRATION]
description: Delta Endstop Phase Calibration Suite
gcode:
    G28
    G91
    G0 Z-50 F1500
    G28
    ENDSTOP_PHASE_CALIBRATE stepper=stepper_a
    ENDSTOP_PHASE_CALIBRATE stepper=stepper_b
    ENDSTOP_PHASE_CALIBRATE stepper=stepper_c
    G28`;
        }

        return `#--------------------------------------------------------------------
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

[gcode_macro E_CALIBRATE]
description: Calibrate rotation_distance
gcode:
    {% if "xyz" not in printer.toolhead.homed_axes %} G28 {% endif %}
    M109 S{printer["gcode_macro _USER_VARS"].print_temp}
    G91
    G1 E50 F60

${probe_macro_block}

${manual_level_block}

${z_tilt_block}

${delta_cal_block}\n\n`;
    },

    // =================================================================
    // 5. STRESS TESTING
    // =================================================================
    torture: (x, y, z, m, speed) => {
        return `#--------------------------------------------------------------------
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
    G90\n\n`;
    },

    // =================================================================
    // 6. CORE OPERATIONS
    // =================================================================
    core_ops: (kin, usePurge, pStart, pEnd, heatStyle, material, probeType, useZTilt) => {
        
        let heating_logic_block = "";
        if (heatStyle === 'staged') {
            heating_logic_block = `    # Staged Heating: Waiting for bed to reach 85% to save PSU load
    TEMPERATURE_WAIT SENSOR=heater_bed MINIMUM={T_BED * 0.85}
    M109 S{T_EXT}
    M190 S{T_BED}`;
        } else {
            heating_logic_block = `    # Parallel Heating: All heaters full power
    M109 S{T_EXT}
    M190 S{T_BED}`;
        }

        // Logic for Z-Tilt
        let z_tilt_op = "";
        if (useZTilt) {
            z_tilt_op = `Z_TILT_ADJUST
    G28 Z`;
        }

        // Logic for Mesh
        let mesh_logic_block = "";
        if (probeType !== 'none') {
            mesh_logic_block = `BED_MESH_PROFILE LOAD=${material}`;
        } else {
            mesh_logic_block = `# Manual Leveling: No Mesh Load`;
        }

        let purge_logic_block = "";
        if (usePurge) {
            purge_logic_block = `PURGE`;
        } else {
            purge_logic_block = `# Purge Disabled`;
        }

        return `#--------------------------------------------------------------------
# CORE OPERATIONS
#--------------------------------------------------------------------
[gcode_macro PRINT_START]
description: Full Start Sequence (Heat, Home, Tilt, Mesh, Purge)
gcode:
    # 1. Visual Indicator
    LED_CYCLE
    
    # 2. Get Temperatures
    {% set T_BED = params.T_BED|default(printer["gcode_macro _USER_VARS"].bed_temp)|float %}
    {% set T_EXT = params.T_EXTRUDER|default(printer["gcode_macro _USER_VARS"].print_temp)|float %}
    
    LED_HEATING
    M140 S{T_BED}
    
    # 3. Heating Logic: ${heatStyle.toUpperCase()}
${heating_logic_block}
    
    # 4. Homing
    G28
    
    # 5. Z-Tilt Adjustment (If Enabled)
    ${z_tilt_op}
    
    # 6. Load Bed Mesh for ${material}
    ${mesh_logic_block}
    
    # 7. Print Status
    LED_PRINT
    G90
    ${purge_logic_block}

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
    RESTORE_GCODE_STATE NAME=M600_state\n\n`;
    },

    // =================================================================
    // 7. UTILITY & LEVELING
    // =================================================================
    utility: (useChamber, probeType, bTemp) => {
        
        let chamber_block = "";
        if (useChamber) {
            chamber_block = `[gcode_macro HEAT_CHAMBER]
description: Pre-heat enclosure using bed and fans
gcode:
    {% if "xyz" not in printer.toolhead.homed_axes %}
        G28
    {% endif %}
    LED_HEATING
    G90
    G1 Z10 F5000
    G1 X0 Y0 F3000
    M140 S100
    M106 S255
    # Wait 30 minutes
    G4 S1800\n\n`;
        }

        let mesh_builder_block = "";
        if (probeType !== 'none') {
            mesh_builder_block = `[gcode_macro BUILD_MESH]
description: Create and save a mesh for the current material
gcode:
    {% set T_BED = printer["gcode_macro _USER_VARS"].bed_temp %}
    {% set MAT = printer["gcode_macro _USER_VARS"].variable_material %}
    M118 Heating bed for mesh generation...
    M190 S{T_BED}
    G28
    M118 Probing Mesh for {MAT}...
    BED_MESH_CALIBRATE PROFILE={MAT}
    M118 Mesh saved as {MAT}.
    SAVE_CONFIG\n\n`;
        }

        return `#--------------------------------------------------------------------
# UTILITY
#--------------------------------------------------------------------
${chamber_block}
${mesh_builder_block}
[gcode_macro COUNTDOWN]
gcode:
    {% set MSG = params.MSG|default("Time: ") %}
    {% set TIME = params.TIME|default(10) %}
    {% for s in range(TIME|int, 0, -1) %}
        G4 P1000
        M117 {MSG} {s}s
    {% endfor %}

[gcode_macro LOAD_FILAMENT]
description: Load filament using preset temperatures
gcode:
    {% set T = printer["gcode_macro _USER_VARS"].print_temp %}
    _LOW_TEMP_CHECK T={T}
    M109 S{T}
    M83
    G1 E{printer["gcode_macro _USER_VARS"].variable_bowden_len} F2000
    G1 E50 F200

[gcode_macro UNLOAD_FILAMENT]
description: Unload filament using preset temperatures
gcode:
    {% set T = printer["gcode_macro _USER_VARS"].print_temp %}
    _LOW_TEMP_CHECK T={T}
    M109 S{T}
    G91
    G1 E10 F100
    # Use variable retract speed for flexible filaments
    G1 E-{printer["gcode_macro _USER_VARS"].variable_bowden_len + 50} F{printer["gcode_macro _USER_VARS"].variable_retract_speed}
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
    
[gcode_macro _LOW_TEMP_CHECK]
description: Check for minimum extrusion temperature
gcode:
    {% set T = params.T|default(210)|int %}
    {% if printer.extruder.target < T %}
        M118 Target temp {T} too low. Heating...
        M109 S{T}
    {% endif %}

[exclude_object]
[pause_resume]
[display_status]`;
    }
};