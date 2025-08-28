// =================================================================
// NODE.JS SCRIPT FOR REAL-TIME DATA SIMULATION (MySQL Version)
// =================================================================
// This script runs continuously to simulate live IoT data from rented machines.
// Converted from PostgreSQL to MySQL for the Smart Rental System.

const mysql = require('mysql2/promise');

// --- Database Connection ---
// These should match your main server's MySQL configuration.
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Vishnu@234',
    database: process.env.DB_NAME || 'rental_sys',
    port: Number(process.env.DB_PORT || 3306),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true,
});

// Test connection
(async () => {
    try {
        await pool.query('SELECT 1');
        console.log('✅ Simulation script connected to the MySQL database.');
    } catch (err) {
        console.error('❌ Error connecting to the MySQL database:', err);
        process.exit(1);
    }
})();

// --- MySQL Auto-increment Reset Function ---
const synchronizeAutoIncrement = async () => {
    const connection = await pool.getConnection();
    try {
        console.log('🔄 Synchronizing database AUTO_INCREMENT values...');
        
        // Reset AUTO_INCREMENT for MachineSensorData table
        const [sensorMaxResult] = await connection.query(`SELECT MAX(reading_id) as max_id FROM MachineSensorData`);
        const maxSensorId = sensorMaxResult[0].max_id || 0;
        await connection.query(`ALTER TABLE MachineSensorData AUTO_INCREMENT = ${maxSensorId + 1}`);

        // Reset AUTO_INCREMENT for MachineHealthAnalytics table
        const [healthMaxResult] = await connection.query(`SELECT MAX(analytics_id) as max_id FROM MachineHealthAnalytics`);
        const maxHealthId = healthMaxResult[0].max_id || 0;
        await connection.query(`ALTER TABLE MachineHealthAnalytics AUTO_INCREMENT = ${maxHealthId + 1}`);

        console.log('👍 AUTO_INCREMENT values synchronized successfully.');
    } catch (error) {
        console.error('🔥 Failed to synchronize AUTO_INCREMENT values:', error);
        // We don't exit here, as the script might still work if the values are already correct.
    } finally {
        connection.release();
    }
};

// --- Data Generation Logic ---

/**
 * Generates a new set of randomized sensor readings for a given machine.
 * @param {object} machine - The machine object, must contain machine_id.
 * @returns {object} A complete sensor data record.
 */
const generateSensorData = (machine) => {
    const productive_time_mins = Math.floor(Math.random() * 8) + 1; // 1-8 mins of productive time per interval
    const idle_time_mins = Math.floor(Math.random() * 2); // 0-1 mins of idle time

    return {
        machine_id: machine.machine_id,
        timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '), // MySQL datetime format
        avg_fuel_consumption_rate: (Math.random() * 5 + 18).toFixed(2), // 18-23 L/hr
        idle_fuel_consumption_pct: (Math.random() * 10 + 20).toFixed(2), // 20-30%
        rpm_variance: (Math.random() * 100 + 150).toFixed(2),
        coolant_temp_anomalies: Math.random() > 0.95 ? 1 : 0, // 5% chance of an anomaly
        productive_time_mins,
        idle_time_mins,
        vibration_anomalies: Math.random() > 0.9 ? 1 : 0, // 10% chance
        overload_cycles: Math.random() > 0.8 ? Math.floor(Math.random() * 3) : 0,
        over_speed_events: Math.random() > 0.98 ? 1 : 0, // 2% chance
        tire_pressure_deviations: 0,
        error_code_frequency: Math.random() > 0.97 ? 1 : 0, // 3% chance
        battery_low_voltage_events: Math.random() > 0.96 ? 1 : 0, // 4% chance
    };
};

/**
 * Calculates high-level health scores based on a set of sensor data.
 * @param {object} sensorData - The generated sensor data record.
 * @returns {object} A complete health analytics record.
 */
const calculateHealthAnalytics = (sensorData) => {
    const riskFactor = (sensorData.coolant_temp_anomalies + sensorData.error_code_frequency) > 0 ? 1.5 : 1;
    const totalMins = sensorData.productive_time_mins + sensorData.idle_time_mins;

    return {
        machine_id: sensorData.machine_id,
        log_timestamp: sensorData.timestamp,
        fuel_efficiency_score: Math.max(50, 95 - (sensorData.idle_fuel_consumption_pct - 20)).toFixed(2),
        engine_stability_score: Math.max(50, 98 - (sensorData.rpm_variance / 50)).toFixed(2),
        utilization_ratio: totalMins > 0 ? (sensorData.productive_time_mins / totalMins).toFixed(2) : '0.00',
        wear_and_tear_index: Math.min(100, 15 + sensorData.vibration_anomalies * 5 + sensorData.overload_cycles * 2).toFixed(2),
        safety_score: Math.max(0, 99 - sensorData.over_speed_events * 10).toFixed(2),
        downtime_risk_pct: Math.min(100, 5 + (sensorData.error_code_frequency + sensorData.battery_low_voltage_events) * 10 * riskFactor).toFixed(2),
    };
};

// --- Main Simulation Loop ---

const runSimulation = async () => {
    const connection = await pool.getConnection();
    try {
        // 1. Fetch all machines that are currently marked as 'rented' in their status.
        const [rentedMachines] = await connection.query("SELECT machine_id FROM Machine WHERE status = 'rented'");

        if (rentedMachines.length === 0) {
            console.log('No rented machines to simulate. Waiting for next cycle...');
            return;
        }

        console.log(`[${new Date().toLocaleTimeString()}] Simulating new data for ${rentedMachines.length} rented machines...`);

        // 2. Generate and insert new data for each rented machine in a single transaction.
        await connection.beginTransaction();

        for (const machine of rentedMachines) {
            const newSensorData = generateSensorData(machine);
            const newHealthData = calculateHealthAnalytics(newSensorData);

            // Insert sensor data (MySQL will auto-generate reading_id)
            await connection.query(
                `INSERT INTO MachineSensorData (
                    machine_id, timestamp, avg_fuel_consumption_rate, idle_fuel_consumption_pct, 
                    rpm_variance, coolant_temp_anomalies, productive_time_mins, idle_time_mins, 
                    vibration_anomalies, overload_cycles, over_speed_events, tire_pressure_deviations, 
                    error_code_frequency, battery_low_voltage_events
                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    newSensorData.machine_id, newSensorData.timestamp, newSensorData.avg_fuel_consumption_rate,
                    newSensorData.idle_fuel_consumption_pct, newSensorData.rpm_variance, newSensorData.coolant_temp_anomalies,
                    newSensorData.productive_time_mins, newSensorData.idle_time_mins, newSensorData.vibration_anomalies,
                    newSensorData.overload_cycles, newSensorData.over_speed_events, newSensorData.tire_pressure_deviations,
                    newSensorData.error_code_frequency, newSensorData.battery_low_voltage_events
                ]
            );

            // Insert health analytics data (MySQL will auto-generate analytics_id)
            await connection.query(
                `INSERT INTO MachineHealthAnalytics (
                    machine_id, log_timestamp, fuel_efficiency_score, engine_stability_score, 
                    utilization_ratio, wear_and_tear_index, safety_score, downtime_risk_pct
                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    newHealthData.machine_id, newHealthData.log_timestamp, newHealthData.fuel_efficiency_score,
                    newHealthData.engine_stability_score, newHealthData.utilization_ratio, newHealthData.wear_and_tear_index,
                    newHealthData.safety_score, newHealthData.downtime_risk_pct
                ]
            );
        }
        
        await connection.commit();
        console.log(`✅ Simulation cycle complete. New data inserted for ${rentedMachines.length} machines.`);

    } catch (error) {
        await connection.rollback();
        console.error('❌ Error during simulation cycle:', error);
    } finally {
        connection.release();
    }
};

// --- Graceful Shutdown ---
const gracefulShutdown = () => {
    console.log('\n🛑 Simulation script shutting down gracefully...');
    pool.end().then(() => {
        console.log('✅ Database connections closed.');
        process.exit(0);
    }).catch((err) => {
        console.error('❌ Error closing database connections:', err);
        process.exit(1);
    });
};

// Handle shutdown signals
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// --- Script Execution ---
// Use an async IIFE (Immediately Invoked Function Expression) to run the setup.
(async () => {
    console.log('🚀 Starting Smart Rental System - Data Simulation Script');
    console.log('📊 This script will generate real-time IoT data for rented machines');
    console.log('⏱️  Simulation runs every 30 seconds');
    console.log('🛑 Press Ctrl+C to stop\n');
    
    await synchronizeAutoIncrement(); // Run the sync function once on startup.
    
    // Run the simulation immediately on start, then set the interval.
    await runSimulation();
    
    // Run the simulation every 30 seconds (30000 milliseconds).
    const simulationInterval = setInterval(runSimulation, 30000);
    
    // Store interval reference for cleanup
    process.simulationInterval = simulationInterval;
})();
