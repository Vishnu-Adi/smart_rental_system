# Smart Rental System - Data Simulation Script

This simulation script generates real-time IoT data for rented machines in the Smart Rental System.

## Overview

The simulation script:
- **Generates realistic sensor data** for all machines marked as 'rented'
- **Calculates health analytics** based on sensor readings
- **Runs continuously** every 30 seconds
- **Synchronizes database AUTO_INCREMENT** values on startup
- **Uses MySQL transactions** for data consistency

## Generated Data

### Sensor Data (MachineSensorData)
- **Fuel consumption rates** (18-23 L/hr)
- **Idle fuel percentage** (20-30%)
- **RPM variance** (150-250)
- **Temperature anomalies** (5% probability)
- **Productive/idle time** (1-8 mins productive, 0-1 mins idle)
- **Vibration anomalies** (10% probability)
- **Overload cycles** (random 0-2)
- **Safety events** (speed, pressure, errors, battery)

### Health Analytics (MachineHealthAnalytics)
- **Fuel efficiency score** (calculated from idle percentage)
- **Engine stability score** (based on RPM variance)
- **Utilization ratio** (productive time / total time)
- **Wear & tear index** (based on vibration and overload)
- **Safety score** (affected by overspeed events)
- **Downtime risk percentage** (calculated from error frequency)

## Usage

### Start the Simulation
```bash
# Navigate to server directory
cd /Users/vishnuadithya/Documents/Projects/caterpillars/smart_rental_system/server

# Run the simulation script
npm run simulate
```

### Alternative Commands
```bash
# Direct node execution
node simulation.js

# With environment variables
DB_HOST=localhost DB_USER=root DB_PASSWORD=Vishnu@234 node simulation.js
```

### Stop the Simulation
- Press `Ctrl+C` to gracefully stop the simulation
- The script will close database connections properly

## Environment Variables

The script uses the same environment variables as your main server:

```bash
DB_HOST=localhost          # MySQL host (default: localhost)
DB_USER=root              # MySQL username (default: root)
DB_PASSWORD=Vishnu@234    # MySQL password (default: Vishnu@234)
DB_NAME=rental_sys        # Database name (default: rental_sys)
DB_PORT=3306             # MySQL port (default: 3306)
```

## Requirements

- **MySQL database** with rental_sys schema
- **Node.js** with mysql2 package
- **Machines marked as 'rented'** in the Machine table

## Database Tables

The script inserts data into:
- `MachineSensorData` - Raw sensor readings
- `MachineHealthAnalytics` - Calculated health scores

## Running Both Server and Simulation

1. **Terminal 1: Start the main server**
   ```bash
   cd /Users/vishnuadithya/Documents/Projects/caterpillars/smart_rental_system/server
   node server.js
   ```

2. **Terminal 2: Start the simulation**
   ```bash
   cd /Users/vishnuadithya/Documents/Projects/caterpillars/smart_rental_system/server
   npm run simulate
   ```

3. **Terminal 3: Start the frontend**
   ```bash
   cd /Users/vishnuadithya/Documents/Projects/caterpillars/smart_rental_system/frontend
   npm run dev
   ```

## Monitoring

The simulation provides console output:
- ✅ **Connection status**
- 🔄 **Synchronization progress**
- 📊 **Data generation cycles**
- ❌ **Error reporting**

## Integration with Frontend

The simulated data will automatically appear in:
- **Usage Page** - Real-time sensor readings
- **Health Page** - Updated health analytics
- **Dashboard** - Live metrics and charts

The frontend will show real-time updates as the simulation generates new data every 30 seconds.
