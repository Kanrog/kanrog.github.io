/**
 * THE KANROG UNIVERSAL MACRO LIBRARY
 * VERSION: DYNAMIC RUNTIME ENGINE + HIDDEN UTILITIES 2026.05.30
 * INSTRUCTIONS: NEVER REMOVE SECTIONS. ONLY INJECT VARIABLES.
 */

const GCODE_TEMPLATES = {
    // =================================================================
    // 1. HEADER
    // =================================================================
    header: (kin, m) => {
        return `#====================================================================
# KANROG UNIVERSAL DYNAMIC MACRO CONFIGURATION
# Archetype: ${kin.toUpperCase()}
# Volume: Automatically read from active printer.cfg bounds
# Safety Margin: ${m}mm
#====================================================================\n\n`;
    },

    // =================================================================
    // 2. USER VARS
    // =================================================================
    user_vars: (m, pTemp, bTemp, mat, rSpeed, fSpeed) => {
        return `[gcode_macro _USER_VARS]
description: Central configuration database for printer variables and material states
variable_margin: ${m}
# --- Material Settings for ${mat} ---
variable_print_temp: ${pTemp}
variable_bed_temp: ${bTemp}
variable_retract_speed: ${rSpeed}
variable_fan_speed: ${fSpeed}
variable_material: '${mat}'
gcode:
    # This section contains no executable code\n\n`;
    },

    // =================================================================
    // 3. LIGHTING
    // =================================================================
    lighting: (name, idle_params, print_params) => {
        return `#--------------------------------------------------------------------
# LIGHTING CONTROL
#--------------------------------------------------------------------
[gcode_macro _LED_RED]
description: Helper preset to set light strip to Red state
gcode:
    SET_LED LED=${name} RED=1.0 GREEN=0.0 BLUE=0.0 TRANSMIT=1

[gcode_macro _LED_ORANGE]
description: Helper preset to set light strip to Orange state
gcode:
    SET_LED LED=${name} RED=1.0 GREEN=0.5 BLUE=0.0 TRANSMIT=1

[gcode_macro _LED_YELLOW]
description: Helper preset to set light strip to Yellow state
gcode:
    SET_LED LED=${name} RED=1.0 GREEN=1.0 BLUE=0.0 TRANSMIT=1

[gcode_macro _LED_GREEN]
description: Helper preset to set light strip to Green state
gcode:
    SET_LED LED=${name} RED=0.0 GREEN=1.0 BLUE=0.0 TRANSMIT=1

[gcode_macro _LED_TEAL]
description: Helper preset to set light strip to Teal state
gcode:
    SET_LED LED=${name} RED=0.0 GREEN=0.5 BLUE=1.0 TRANSMIT=1

[gcode_macro _LED_BLUE]
description: Helper preset to set light strip to Blue state
gcode:
    SET_LED LED=${name} RED=0.0 GREEN=0.0 BLUE=1.0 TRANSMIT=1

[gcode_macro _LED_PURPLE]
description: Helper preset to set light strip to Purple state
gcode:
    SET_LED LED=${name} RED=1.0 GREEN=0.0 BLUE=1.0 TRANSMIT=1

[gcode_macro _LED_WHITE]
description: Helper preset to set light strip to White state
gcode:
    SET_LED LED=${name} RED=0.8 GREEN=0.8 BLUE=0.8 TRANSMIT=1

[gcode_macro _LED_OFF]
description: Helper preset to turn off all channels on the light strip
gcode:
    SET_LED LED=${name} RED=0.0 GREEN=0.0 BLUE=0.0 TRANSMIT=1

[gcode_macro _LED_IDLE]
description: Background routine to transition LEDs to the user-defined Idle color profile
gcode:
    SET_LED LED=${name} ${idle_params} TRANSMIT=1

[gcode_macro _LED_PRINT]
description: Background routine to transition LEDs to the user-defined Print color profile
gcode:
    SET_LED LED=${name} ${print_params} TRANSMIT=1

[gcode_macro _LED_HEATING]
description: Helper preset to flash light strip to heating color state
gcode:
    _LED_ORANGE

[gcode_macro LED_CYCLE]
description: Multi-color dynamic lighting show sequence (Flyer Signature)
gcode:
    {% for repeat in range(4) %}
        _LED_RED
        G4 P150
        _LED_ORANGE
        G4 P150
        _LED_YELLOW
        G4 P150
        _LED_GREEN
        G4 P150
        _LED_TEAL
        G4 P150
        _LED_BLUE
        G4 P150
        _LED_PURPLE
        G4 P150
    {% endfor %}
    _LED_IDLE

[delayed_gcode Welcome_Lightshow]
initial_duration: 1
gcode:
    LED_CYCLE\n\n`;
    },

    // =================================================================
    // 4. DIAGNOSTICS & PROBE & TILT
    // =================================================================
    diagnostics: (kin, probeType, useZTilt) => {
        let probe_macro_block = "";
        if (probeType !== 'none') {
            const tap_pre = (probeType === 'tap') ? `\n    M104 S150 ; Set nozzle to safe probing temp for Tap` : "";

            probe_macro_block = `[gcode_macro CHECK_PROBE]
description: Automated diagnostic tool to measure probe variance accuracy (Runs 10 consecutive samples)
gcode:
    ${tap_pre}
    G28
    PROBE_ACCURACY samples=10

[gcode_macro ADJUST_Z_OFFSET]
description: Interactive guidance sequence to calibrate and tune the physical probe Z-Offset height
gcode:
    ${tap_pre}
    G28
    PROBE_CALIBRATE

[gcode_macro SCREWS_TILT]
description: Diagnostic tool calculation sequence to assist with structural manual bed screw level leveling adjustment alignments
gcode:
    G28
    SCREWS_TILT_CALCULATE`;
        }

        let manual_level_block = "";
        if (probeType === 'none') {
            manual_level_block = `#=====================================================
# Manual Bed Level
#=====================================================

[gcode_macro LEVEL_BED]
description: Interactive alignment helper suite to run manual mechanical bed leveling adjustments
gcode:
    G28
    BED_SCREWS_ADJUST

#=====================================================
# Calibrate Z-Endstop location
#=====================================================

[gcode_macro Z_Calibrate]
description: Automated wizard sequence to calibrate the hardware manual physical Z-Endstop switch location
gcode:
    G28
    Z_ENDSTOP_CALIBRATE`;
        }

        let z_tilt_block = "";
        if (useZTilt) {
            z_tilt_block = `[gcode_macro ALIGN_Z_GANTRY]
description: Automated calibration sequence to auto-align multiple independent physical Z-axis stepper gantries
gcode:
    G28
    Z_TILT_ADJUST`;
        }

        let delta_cal_block = "";
        if (kin === 'delta') {
            delta_cal_block = `[gcode_macro ENDSTOPS_CALIBRATION]
description: Delta kinematic structural optimization framework and configuration suite for endstop phase alignment variables
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
[gcode_macro PID_HOTEND]
description: Automated PID calibration sequence optimization run for the heater hotend extruder element
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
description: Automated PID calibration sequence optimization run for the heater_bed element surface
gcode:
    {% if "xyz" not in printer.toolhead.homed_axes %}
        G28
    {% endif %}
    PID_CALIBRATE HEATER=heater_bed TARGET={printer["gcode_macro _USER_VARS"].bed_temp}
    SAVE_CONFIG

[gcode_macro E_CALIBRATE]
description: Utility tuning calibration line sequence loop to calibrate extruder flow rotation_distance configurations
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
    torture: (speed) => {
        return `#--------------------------------------------------------------------
# STRESS TESTS
#--------------------------------------------------------------------
[gcode_macro TORTURE_XY]
description: Stress tool utility to execute full-bed high velocity raster movement sweeps pulling boundaries dynamically from printer parameters
gcode:
    {% if "xyz" not in printer.toolhead.homed_axes %}
        G28
    {% endif %}
    
    # Extract structural boundaries directly from printer config model
    {% set max_x = printer.configfile.config["stepper_x"]["position_max"]|float %}
    {% set max_y = printer.configfile.config["stepper_y"]["position_max"]|float %}
    {% set margin = printer["gcode_macro _USER_VARS"].margin|float %}
    
    # Calculate motion profiles dynamically
    {% set travel_x = max_x - (margin * 2) %}
    {% set travel_y = max_y - (margin * 2) %}

    G90
    G1 Z20 F1500
    G1 X{margin} Y{margin} F${speed}
    G91
    {% for i in range(10) %}
        G1 X+{travel_x|round(1)} Y+{travel_y|round(1)} F${speed}
        G1 X-{travel_x|round(1)} Y-{travel_y|round(1)} F${speed}
    {% endfor %}
    G90

[gcode_macro TORTURE_SHAKE]
description: Dynamic vibration stress test executing high-frequency short-travel rapid toolhead directional reversals
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
    core_ops: (kin, usePurge, heatStyle, material, probeType, useZTilt, useLED) => {
        const led_cycle = useLED ? "LED_CYCLE" : "# LED Cycle Disabled";
        const led_heating = useLED ? "_LED_HEATING" : "# LED Heating Disabled";
        const led_print = useLED ? "_LED_PRINT" : "# LED Print Disabled";

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

        let z_tilt_op = "";
        if (useZTilt) {
            z_tilt_op = `_ALIGN_Z_GANTRY_INTERNAL\n    G28 Z`;
        }

        let mesh_logic_block = "";
        if (probeType !== 'none') {
            mesh_logic_block = `BED_MESH_PROFILE LOAD=${material}`;
        } else {
            mesh_logic_block = `# Manual Leveling: No Mesh Load`;
        }

        let purge_logic_block = usePurge ? `PURGE` : `# Purge Disabled`;
        const tap_prep = (probeType === 'tap') ? `    M104 S150 ; Tap Safety` : "";

        return `#--------------------------------------------------------------------
# CORE OPERATIONS
#--------------------------------------------------------------------
[gcode_macro PRINT_START]
description: Complete consolidated structural startup orchestration routine loop sequence (Heat, Home, Align, Bed-Mesh, Purge)
gcode:
    # 1. Visual Indicator
    ${led_cycle}
    
    # 2. Get Temperatures
    {% set T_BED = params.T_BED|default(printer["gcode_macro _USER_VARS"].bed_temp)|float %}
    {% set T_EXT = params.T_EXTRUDER|default(printer["gcode_macro _USER_VARS"].print_temp)|float %}
    
    ${led_heating}
    M140 S{T_BED}
    
    # 3. Heating Logic: ${heatStyle.toUpperCase()}
${heating_logic_block}
    
    # 4. Homing
    ${tap_prep}
    G28
    
    # 5. Z-Tilt Adjustment (If Enabled)
    ${z_tilt_op}
    
    # 6. Load Bed Mesh for ${material}
    ${mesh_logic_block}
    
    # 7. Print Status
    ${led_print}
    G90
    ${purge_logic_block}

[gcode_macro END_PRINT]
description: Consolidated teardown sequence optimization run executed upon normal completion or cancellation of an active print job
gcode:
    G91
    # Retract filament to prevent oozing
    G1 E-15 F1000
    G90
    
    # Dynamic center calculation for safe park location on finish
    {% set max_x = printer.configfile.config["stepper_x"]["position_max"]|float %}
    {% set max_y = printer.configfile.config["stepper_y"]["position_max"]|float %}
    G1 X{max_x / 2} Y{max_y / 2} F3000
    
    # Cooldown
    TURN_OFF_HEATERS
    ${led_cycle}
    M106 S0
    M84

[gcode_macro PURGE]
description: Automated sequence to prime and baseline nozzle extrusion pressure relative to dynamic axis endpoint constraints
gcode:
    {% set max_x = printer.configfile.config["stepper_x"]["position_max"]|float %}
    {% set max_y = printer.configfile.config["stepper_y"]["position_max"]|float %}
    {% set margin = printer["gcode_macro _USER_VARS"].margin|float %}
    
    G90
    G1 Z0.3 F3000
    G1 X{margin} Y{max_y - margin} F3000 ; Dynamic start point
    G1 X{margin + 50} Y{max_y - margin} E15 F300 ; Extrude 50mm dynamic line
    G92 E0

[gcode_macro M600]
description: Standardized filament modification mid-print change pause interruption script trigger
gcode:
    SAVE_GCODE_STATE NAME=M600_state
    PAUSE
    G91
    G1 E-.8 F2700
    G1 Z10
    G90
    {% set max_x = printer.configfile.config["stepper_x"]["position_max"]|float %}
    {% set max_y = printer.configfile.config["stepper_y"]["position_max"]|float %}
    G1 X{max_x / 2} Y{max_y / 2} F3000
    RESTORE_GCODE_STATE NAME=M600_state

[gcode_macro _ALIGN_Z_GANTRY_INTERNAL]
description: Background automation call hook wrapper to run Z_TILT_ADJUST leveling procedures safely inside startup scripts
gcode:
    Z_TILT_ADJUST\n\n`;
    },

    // =================================================================
    // 7. UTILITY
    // =================================================================
    utility: (useChamber, probeType, bTemp) => {
        let chamber_block = "";
        if (useChamber) {
            chamber_block = `[gcode_macro HEAT_CHAMBER]
description: Pre-heat system framework routine utilizing heated bed convection radiation currents and high-velocity cooling loops to elevate chamber enclosure temps
gcode:
    {% if "xyz" not in printer.toolhead.homed_axes %}
        G28
    {% endif %}
    _LED_HEATING
    G90
    G1 Z10 F5000
    G1 X0 Y0 F3000
    M140 S100
    M106 S255
    # Wait 30 minutes
    _COUNTDOWN TIME=1800 MSG="Chamber Soak: "\n\n`;
        }

        let mesh_builder_block = "";
        if (probeType !== 'none') {
            mesh_builder_block = `[gcode_macro BUILD_MESH]
description: Automatic optimization calibration mapping engine to probe, generate, map, validate, and write a bed profile grid array configuration file structure
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
[gcode_macro _COUNTDOWN]
description: Graphical telemetry display timing sequence framework tool to flash status readouts down to the active terminal window interface
gcode:
    {% set MSG = params.MSG|default("Time: ") %}
    {% set TIME = params.TIME|default(10) %}
    {% for s in range(TIME|int, 0, -1) %}
        G4 P1000
        M117 {MSG} {s}s
    {% endfor %}

[gcode_macro LOAD_FILAMENT]
description: Utility optimization sequence loop to feed, extrude, clean, clear, and prime new material into the extruder assembly toolhead system using configuration variables
gcode:
    {% set T = printer["gcode_macro _USER_VARS"].print_temp %}
    _LOW_TEMP_CHECK T={T}
    M109 S{T}
    M83
    G1 E200 F2000
    G1 E50 F200

[gcode_macro UNLOAD_FILAMENT]
description: Utility optimization sequence loop to safely warm, isolate, tip-form, cut-free, and cleanly purge-retract raw material out of the filament drive system
gcode:
    {% set T = printer["gcode_macro _USER_VARS"].print_temp %}
    _LOW_TEMP_CHECK T={T}
    M109 S{T}
    G91
    G1 E10 F100
    G1 E-250 F{printer["gcode_macro _USER_VARS"].variable_retract_speed}
    G90

[gcode_macro PAUSE]
rename_existing: PAUSE_BASE
description: Standardized runtime process interruption framework hook to park active coordinates and secure motion layers safely during printing anomalies
gcode:
    PAUSE_BASE
    G91
    G1 E-2 F1000
    G90
    {% set max_x = printer.configfile.config["stepper_x"]["position_max"]|float %}
    {% set max_y = printer.configfile.config["stepper_y"]["position_max"]|float %}
    G1 X{max_x / 2} Y{max_y / 2} Z{printer.toolhead.position.z + 10} F3000
    _LED_RED

[gcode_macro RESUME]
rename_existing: RESUME_BASE
description: Standardized loop re-entry processing sequence routine to restore fluid mechanics, tracking bounds, coordinates, and layer continuity after pause terminations
gcode:
    G91
    G1 E20 F300
    G90
    RESUME_BASE
    _LED_PRINT
    
[gcode_macro _LOW_TEMP_CHECK]
description: Background threshold security routine loop verifying safety limitations to prevent cold extruder gearing grinds
gcode:
    {% set T = params.T|default(210)|int %}
    {% if printer.extruder.target < T %}
        M118 Target temp {T} too low. Heating...
        M109 S{T}
    {% endif %}

[delayed_gcode _SAFETY_TIMEOUT]
description: Background security loop timing script checking status run periods to automatically disable heater elements during unmonitored drop cycles
gcode:
    {% if printer.idle_timeout.state == "Idle" %}
        TURN_OFF_HEATERS
        M118 Safety Timeout: Heaters disabled.
        _LED_OFF
    {% endif %}

[exclude_object]
[pause_resume]
[display_status]`;
    }
};