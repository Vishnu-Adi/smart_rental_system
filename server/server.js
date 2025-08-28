const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
// Anomaly detection integrations
const { detectAnomaly } = require('./anamolyservice');
const anomalyRoutes = require('./routes/anamoly');

const app = express();
const PORT = 5001;

// Simple CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json());

// Mount anomaly routes
app.use('/anomaly', anomalyRoutes);

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Vishnu@234',
  database: 'rental_sys',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,  
});

// Test DB connection
(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ MySQL connected');
  } catch (err) {
    console.error('❌ MySQL error:', err.message);
  }
})();

// Assets endpoint
app.get('/api/assets', async (req, res) => {
  try {
    const [assets] = await pool.query(`
      SELECT m.*, 
        CASE WHEN rc.rental_status = 'active' THEN 'Rented' ELSE m.status END AS rentalStatus,
        c.name AS currentRenter
      FROM Machine m
      LEFT JOIN RentalContract rc ON m.machine_id = rc.machine_id AND rc.rental_status = 'active'
      LEFT JOIN Company c ON rc.company_id = c.company_id
    `);

    const [catRows] = await pool.query('SELECT asset_type, COUNT(*) AS count FROM Machine GROUP BY asset_type');
    const categoryDistribution = {};
    catRows.forEach(r => categoryDistribution[r.asset_type] = Number(r.count));

    const rentedCount = assets.filter(a => a.status === 'rented').length;
    const totalCount = assets.length;

    res.json({
      assets,
      summary: {
        total: totalCount,
        rented: rentedCount,
        available: totalCount - rentedCount,
        rentedPercentage: totalCount > 0 ? (rentedCount / totalCount) * 100 : 0,
      },
      categoryDistribution,
    });
  } catch (error) {
    console.error('Assets error:', error);
    res.status(500).json({ message: 'Error processing asset data', error: error.message });
  }
});

// Health endpoint
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT m.machine_id, CONCAT(m.asset_type, ' #', m.machine_id) AS name,
        m.manufacturer, mha.*
      FROM Machine m
      LEFT JOIN (
        SELECT t.* FROM MachineHealthAnalytics t
        JOIN (SELECT machine_id, MAX(log_timestamp) AS max_ts FROM MachineHealthAnalytics GROUP BY machine_id) latest 
        ON t.machine_id = latest.machine_id AND t.log_timestamp = latest.max_ts
      ) mha ON m.machine_id = mha.machine_id
    `);
    res.json(rows);
  } catch (error) {
    console.error('Health error:', error);
    res.status(500).json({ message: 'Error processing health data', error: error.message });
  }
});

// Machine detail endpoint
app.get('/api/health/:machineId', async (req, res) => {
  try {
    const { machineId } = req.params;
    const [machines] = await pool.query('SELECT * FROM Machine WHERE machine_id = ?', [machineId]);
    if (!machines.length) return res.status(404).json({ message: 'Machine not found' });

    const [sensor] = await pool.query(
      'SELECT * FROM MachineSensorData WHERE machine_id = ? ORDER BY `timestamp` DESC LIMIT 50',
      [machineId]
    );

    res.json({
      machine: machines[0],
      sensorReadings: sensor.reverse(),
    });
  } catch (error) {
    console.error('Machine detail error:', error);
    res.status(500).json({ message: 'Error processing machine detail data', error: error.message });
  }
});

// Usage endpoint
app.get('/api/usage', async (req, res) => {
  try {
    const [usageLogs] = await pool.query(`
      SELECT m.machine_id, CONCAT(m.asset_type, ' #', m.machine_id) AS name,
        m.current_location_lat AS location_lat, m.current_location_lon AS location_lon, msd.*
      FROM Machine m
      LEFT JOIN (
        SELECT s.* FROM MachineSensorData s
        JOIN (SELECT machine_id, MAX(\`timestamp\`) AS max_ts FROM MachineSensorData GROUP BY machine_id) latest 
        ON s.machine_id = latest.machine_id AND s.\`timestamp\` = latest.max_ts
      ) msd ON m.machine_id = msd.machine_id
    `);

    const processed = usageLogs.map((log) => {
      let utilization_status = 'Normal';
      const productiveMins = parseFloat(log.productive_time_mins || 0);
      const idleMins = parseFloat(log.idle_time_mins || 0);
      const totalMins = productiveMins + idleMins;
      if (totalMins > 0) {
        const idleRatio = idleMins / totalMins;
        if (idleRatio > 0.4) utilization_status = 'Underutilized';
        if (productiveMins > 500) utilization_status = 'Overutilized';
      }
      return { ...log, utilization_status };
    });

    res.json(processed);
  } catch (error) {
    console.error('Usage error:', error);
    res.status(500).json({ message: 'Error processing usage data', error: error.message });
  }
});

// Usage Analytics endpoint
app.get('/api/usage/analytics', async (req, res) => {
  try {
    // Get total runtime and rental hours
    const [runtimeStats] = await pool.query(`
      SELECT 
        SUM(productive_time_mins + idle_time_mins) / 60 as total_runtime_hours,
        SUM(productive_time_mins) / 60 as total_productive_hours,
        SUM(idle_time_mins) / 60 as total_idle_hours,
        AVG(avg_fuel_consumption_rate) as avg_fuel_rate,
        COUNT(DISTINCT machine_id) as active_machines
      FROM MachineSensorData 
      WHERE productive_time_mins IS NOT NULL
    `);

    // Get rental hours from contracts
    const [rentalStats] = await pool.query(`
      SELECT 
        SUM(TIMESTAMPDIFF(HOUR, actual_start_date, COALESCE(actual_end_date, NOW()))) as total_rental_hours,
        COUNT(*) as total_contracts,
        COUNT(CASE WHEN rental_status = 'active' THEN 1 END) as active_contracts
      FROM RentalContract 
      WHERE actual_start_date IS NOT NULL
    `);

    // Get usage by location/site  
    const [siteUsage] = await pool.query(`
      SELECT 
        CONCAT(ROUND(current_location_lat, 1), ',', ROUND(current_location_lon, 1)) as site,
        COUNT(DISTINCT m.machine_id) as machines_count,
        SUM(productive_time_mins + idle_time_mins) / 60 as site_runtime_hours,
        AVG(avg_fuel_consumption_rate) as avg_fuel_consumption
      FROM Machine m
      LEFT JOIN MachineSensorData msd ON m.machine_id = msd.machine_id
      WHERE msd.productive_time_mins IS NOT NULL
      GROUP BY site
      HAVING machines_count > 0
      ORDER BY site_runtime_hours DESC
      LIMIT 10
    `);

    // Get fuel consumption trends by asset type
    const [fuelByType] = await pool.query(`
      SELECT 
        m.asset_type,
        AVG(msd.avg_fuel_consumption_rate) as avg_fuel_rate,
        SUM(msd.productive_time_mins + msd.idle_time_mins) / 60 as total_hours,
        COUNT(DISTINCT m.machine_id) as machine_count
      FROM Machine m
      JOIN MachineSensorData msd ON m.machine_id = msd.machine_id
      WHERE msd.avg_fuel_consumption_rate IS NOT NULL
      GROUP BY m.asset_type
      ORDER BY avg_fuel_rate DESC
    `);

    // Get daily usage trends (last 30 days)
    const [dailyTrends] = await pool.query(`
      SELECT 
        DATE(timestamp) as date,
        SUM(productive_time_mins) / 60 as productive_hours,
        SUM(idle_time_mins) / 60 as idle_hours,
        AVG(avg_fuel_consumption_rate) as avg_fuel_rate,
        COUNT(DISTINCT machine_id) as active_machines
      FROM MachineSensorData 
      WHERE timestamp >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        AND productive_time_mins IS NOT NULL
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
      LIMIT 30
    `);

    // Get downtime incidents
    const [downtimeData] = await pool.query(`
      SELECT 
        COUNT(*) as total_incidents,
        SUM(CASE WHEN error_code_frequency > 5 THEN 1 ELSE 0 END) as critical_incidents,
        AVG(error_code_frequency) as avg_error_frequency
      FROM MachineSensorData 
      WHERE error_code_frequency IS NOT NULL
    `);

    res.json({
      runtime: runtimeStats[0] || {},
      rental: rentalStats[0] || {},
      siteUsage: siteUsage || [],
      fuelByType: fuelByType || [],
      dailyTrends: dailyTrends || [],
      downtime: downtimeData[0] || {}
    });
  } catch (error) {
    console.error('Usage analytics error:', error);
    res.status(500).json({ message: 'Error processing usage analytics', error: error.message });
  }
});

// Forecast endpoint
app.get('/api/forecast', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT month, COUNT(*) AS rentals
      FROM (SELECT DATE_FORMAT(start_date, '%Y-%m') AS month FROM RentalContract) t
      GROUP BY month ORDER BY month
    `);
    res.json(rows);
  } catch (error) {
    console.error('Forecast error:', error);
    res.status(500).json({ message: 'Error processing forecast data', error: error.message });
  }
});

// Advanced Demand Forecasting endpoint
app.get('/api/forecast/advanced', async (req, res) => {
  try {
    // Demand prediction by asset type and location
    const [demandPredictions] = await pool.query(`
      WITH HistoricalDemand AS (
        SELECT 
          m.asset_type,
          CONCAT(ROUND(m.current_location_lat, 1), ',', ROUND(m.current_location_lon, 1)) as location,
          MONTH(rc.start_date) as month,
          COUNT(*) as historical_demand,
          AVG(TIMESTAMPDIFF(DAY, rc.start_date, rc.end_date)) as avg_rental_duration
        FROM RentalContract rc
        JOIN Machine m ON rc.machine_id = m.machine_id
        WHERE rc.start_date IS NOT NULL
        GROUP BY m.asset_type, location, month
      ),
      SeasonalTrends AS (
        SELECT 
          asset_type,
          location,
          month,
          historical_demand,
          avg_rental_duration,
          AVG(historical_demand) OVER (PARTITION BY asset_type, location) as avg_demand,
          (historical_demand / AVG(historical_demand) OVER (PARTITION BY asset_type, location)) * 100 as seasonality_index
        FROM HistoricalDemand
      )
      SELECT 
        asset_type,
        location,
        month,
        ROUND(historical_demand * (1 + (seasonality_index - 100) / 100), 0) as predicted_demand,
        ROUND(avg_rental_duration, 1) as expected_duration,
        ROUND(seasonality_index, 1) as trend_factor,
        CASE 
          WHEN seasonality_index > 120 THEN 'High Season'
          WHEN seasonality_index < 80 THEN 'Low Season'
          ELSE 'Normal Season'
        END as demand_category
      FROM SeasonalTrends
      WHERE historical_demand > 0
      ORDER BY predicted_demand DESC
      LIMIT 50
    `);

    // Project DNA Matching - Similar project patterns
    const [projectDNA] = await pool.query(`
      WITH ProjectPatterns AS (
        SELECT 
          c.company_id,
          c.name as company_name,
          c.industry,
          GROUP_CONCAT(DISTINCT m.asset_type ORDER BY m.asset_type) as equipment_combo,
          COUNT(DISTINCT rc.contract_id) as project_count,
          AVG(TIMESTAMPDIFF(DAY, rc.start_date, rc.end_date)) as avg_project_duration,
          SUM(CASE WHEN rc.rental_status = 'completed' THEN 1 ELSE 0 END) / COUNT(*) * 100 as success_rate
        FROM Company c
        JOIN RentalContract rc ON c.company_id = rc.company_id
        JOIN Machine m ON rc.machine_id = m.machine_id
        GROUP BY c.company_id, c.name, c.industry
        HAVING project_count >= 2
      )
      SELECT 
        industry,
        equipment_combo,
        COUNT(*) as pattern_frequency,
        ROUND(AVG(avg_project_duration), 1) as typical_duration,
        ROUND(AVG(success_rate), 1) as success_probability,
        CASE 
          WHEN COUNT(*) >= 5 THEN 'Proven Pattern'
          WHEN COUNT(*) >= 3 THEN 'Emerging Pattern'
          ELSE 'Rare Pattern'
        END as pattern_confidence
      FROM ProjectPatterns
      GROUP BY industry, equipment_combo
      ORDER BY pattern_frequency DESC, success_probability DESC
      LIMIT 20
    `);

    // Competitive Intelligence - Activity detection (simplified)
    const [competitiveActivity] = await pool.query(`
      SELECT 
        m.asset_type,
        COUNT(*) as recent_bookings,
        COUNT(DISTINCT rc.company_id) as unique_companies,
        ROUND(AVG(TIMESTAMPDIFF(DAY, rc.start_date, rc.end_date)), 1) as avg_rental_days,
        5.0 as normal_weekly_average,
        ROUND(((COUNT(*) - 5.0) / 5.0) * 100, 1) as activity_spike_pct,
        CASE 
          WHEN COUNT(*) > 7 THEN 'High Alert'
          WHEN COUNT(*) > 6 THEN 'Moderate Alert'
          ELSE 'Normal'
        END as alert_level
      FROM RentalContract rc
      JOIN Machine m ON rc.machine_id = m.machine_id
      WHERE rc.start_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY m.asset_type
      ORDER BY recent_bookings DESC
    `);

    // Economic Indicators Simulation (mock data for demo)
    const economicIndicators = [
      {
        indicator: 'Building Permits',
        region: 'Mumbai Metro',
        current_value: 1250,
        trend: '+15%',
        impact_on_demand: 'High',
        equipment_affected: ['crane', 'excavator', 'loader']
      },
      {
        indicator: 'Infrastructure Spending',
        region: 'Delhi NCR', 
        current_value: 95000,
        trend: '+8%',
        impact_on_demand: 'Medium',
        equipment_affected: ['bulldozer', 'compactor', 'generator']
      },
      {
        indicator: 'Government Tenders',
        region: 'Bangalore',
        current_value: 45,
        trend: '+22%',
        impact_on_demand: 'High',
        equipment_affected: ['crane', 'generator', 'loader']
      }
    ];

    // Equipment Trading Floor - High demand equipment
    const [tradingFloor] = await pool.query(`
      WITH DemandMetrics AS (
        SELECT 
          m.asset_type,
          COUNT(DISTINCT rc.contract_id) as total_bookings,
          COUNT(DISTINCT CASE WHEN rc.start_date >= CURDATE() THEN rc.contract_id END) as future_bookings,
          COUNT(DISTINCT m.machine_id) as available_units,
          COUNT(DISTINCT rc.company_id) as competing_companies
        FROM Machine m
        LEFT JOIN RentalContract rc ON m.machine_id = rc.machine_id
        GROUP BY m.asset_type
      )
      SELECT 
        asset_type,
        available_units,
        total_bookings,
        future_bookings,
        competing_companies,
        ROUND((future_bookings / NULLIF(available_units, 0)) * 100, 1) as demand_pressure_pct,
        CASE 
          WHEN (future_bookings / NULLIF(available_units, 0)) > 0.8 THEN 'Critical Shortage'
          WHEN (future_bookings / NULLIF(available_units, 0)) > 0.6 THEN 'High Demand'
          WHEN (future_bookings / NULLIF(available_units, 0)) > 0.4 THEN 'Moderate Demand'
          ELSE 'Low Demand'
        END as market_status,
        ROUND(1000 + (future_bookings / NULLIF(available_units, 0)) * 500, 0) as suggested_bid_price
      FROM DemandMetrics
      WHERE available_units > 0
      ORDER BY demand_pressure_pct DESC
    `);

    // Collaborative Forecasting - Shared insights
    const collaborativeInsights = [
      {
        shared_by: 'Construction Consortium Alpha',
        insight: 'Major infrastructure project starting Q2 - high crane demand expected',
        equipment_type: 'crane',
        confidence_level: 85,
        impact_timeframe: '2-4 months',
        region: 'Mumbai'
      },
      {
        shared_by: 'Real Estate Alliance',
        insight: 'Seasonal spike in excavator usage during monsoon prep',
        equipment_type: 'excavator', 
        confidence_level: 78,
        impact_timeframe: '1-2 months',
        region: 'Kerala'
      },
      {
        shared_by: 'Infrastructure Network',
        insight: 'Generator demand increasing due to power grid maintenance',
        equipment_type: 'generator',
        confidence_level: 92,
        impact_timeframe: '2-6 weeks',
        region: 'Tamil Nadu'
      }
    ];

    res.json({
      demandPredictions: demandPredictions || [],
      projectDNA: projectDNA || [],
      competitiveActivity: competitiveActivity || [],
      economicIndicators: economicIndicators,
      tradingFloor: tradingFloor || [],
      collaborativeInsights: collaborativeInsights
    });

  } catch (error) {
    console.error('Advanced forecast error:', error);
    res.status(500).json({ message: 'Error processing advanced forecast data', error: error.message });
  }
});

// Customers endpoint
app.get('/api/customers', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      WITH ContractMetrics AS (
        SELECT company_id, COUNT(*) AS total_rentals,
          COUNT(CASE WHEN rental_status = 'overdue' THEN 1 END) AS overdue_rentals
        FROM RentalContract GROUP BY company_id
      ),
      HealthMetrics AS (
        SELECT rc.company_id, AVG(mha.safety_score) AS avg_safety_score,
          AVG(mha.wear_and_tear_index) AS avg_wear_index
        FROM RentalContract rc
        JOIN MachineHealthAnalytics mha ON rc.machine_id = mha.machine_id
        WHERE mha.log_timestamp BETWEEN rc.actual_start_date AND rc.actual_end_date
        GROUP BY rc.company_id
      )
      SELECT c.*, COALESCE(cm.total_rentals, 0) AS totalRentals,
        CASE WHEN COALESCE(cm.total_rentals, 0) > 0
          THEN (1 - (COALESCE(cm.overdue_rentals, 0) / cm.total_rentals)) * 100 ELSE 100 END AS onTimeReturnRate,
        COALESCE(hm.avg_safety_score, 100) AS avgSafetyScore,
        COALESCE(hm.avg_wear_index, 0) AS avgWearIndex
      FROM Company c
      LEFT JOIN ContractMetrics cm ON c.company_id = cm.company_id
      LEFT JOIN HealthMetrics hm ON c.company_id = hm.company_id
    `);
    res.json(rows);
  } catch (error) {
    console.error('Customers error:', error);
    res.status(500).json({ message: 'Error processing customer data', error: error.message });
  }
});

// Dashboard analytics endpoint
app.get('/api/dashboard/analytics', async (req, res) => {
  try {
    // Asset type distribution with availability
    const [assetTypes] = await pool.query(`
      SELECT 
        asset_type,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'available' THEN 1 END) as available,
        COUNT(CASE WHEN status != 'available' THEN 1 END) as used
      FROM Machine 
      WHERE machine_id <= 150
      GROUP BY asset_type 
      ORDER BY total DESC
    `);

    // Overall availability
    const [availability] = await pool.query(`
      SELECT 
        COUNT(CASE WHEN status = 'available' THEN 1 END) as available,
        COUNT(CASE WHEN status != 'available' THEN 1 END) as unavailable
      FROM Machine 
      WHERE machine_id <= 150
    `);

    // Billing status from rental contracts
    const [billing] = await pool.query(`
      SELECT 
        COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN payment_status IS NULL OR payment_status = '' THEN 1 END) as unknown
      FROM RentalContract
    `);

    // Contract status
    const [contracts] = await pool.query(`
      SELECT 
        COUNT(CASE WHEN rental_status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN rental_status = 'active' THEN 1 END) as ongoing,
        COUNT(CASE WHEN rental_status = 'overdue' THEN 1 END) as overdue
      FROM RentalContract
    `);

    res.json({
      assetTypes: assetTypes,
      availability: availability[0],
      billing: billing[0],
      contracts: contracts[0]
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ message: 'Error processing dashboard analytics', error: error.message });
  }
});



// --- CUSTOMER AUTHENTICATION & PORTAL ENDPOINTS ---

const saltRounds = 10;

// Registration endpoint
app.post('/api/auth/register', async (req, res) => {
  const { username, password, company_id } = req.body;

  if (!username || !password || !company_id) {
    return res.status(400).json({ error: 'Username, password, and company_id are required.' });
  }

  try {
    // Hash the password
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new client
    const [result] = await pool.query(
      'INSERT INTO Clients (username, password_hash, company_id) VALUES (?, ?, ?)',
      [username, passwordHash, company_id]
    );

    // Get the created client
    const [clients] = await pool.query(
      'SELECT id, username, company_id FROM Clients WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Client registered successfully!',
      client: clients[0]
    });

  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username already exists.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  const { username, password, userType } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  // Admin login
  if (userType === 'admin' && username === 'admin' && password === 'admin') {
    return res.status(200).json({
      message: 'Admin login successful!',
      user: { id: 'admin', username: 'admin', userType: 'admin' }
    });
  }

  // Customer login
  try {
    const [clients] = await pool.query(
      'SELECT * FROM Clients WHERE username = ?',
      [username]
    );

    if (clients.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const client = clients[0];
    const match = await bcrypt.compare(password, client.password_hash);

    if (match) {
      res.status(200).json({
        message: 'Login successful!',
        user: {
          id: client.id,
          username: client.username,
          company_id: client.company_id,
          userType: 'customer'
        }
      });
    } else {
      res.status(401).json({ error: 'Invalid username or password.' });
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Customer dashboard endpoint
app.get('/api/customer/dashboard/:companyId', async (req, res) => {
  const { companyId } = req.params;

  if (!companyId || isNaN(parseInt(companyId))) {
    return res.status(400).json({ error: 'A valid company ID is required.' });
  }

  try {
    // Company info
    const [companyInfo] = await pool.query(
      'SELECT name, industry, address, state, segment FROM Company WHERE company_id = ?',
      [companyId]
    );

    // Contract summary
    const [contractSummary] = await pool.query(
      `SELECT rental_status, COUNT(*) as count
       FROM RentalContract
       WHERE company_id = ?
       GROUP BY rental_status`,
      [companyId]
    );

    // Financials
    const [financials] = await pool.query(
      `SELECT 
         SUM(billing_amount) as total_billed_amount,
         SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid_invoices,
         SUM(CASE WHEN payment_status IN ('failed', 'pending') THEN 1 ELSE 0 END) as pending_invoices
       FROM RentalContract
       WHERE company_id = ?`,
      [companyId]
    );

    // Active machines
    const [activeMachines] = await pool.query(
      `SELECT m.machine_id, m.asset_type, m.manufacturer, rc.end_date
       FROM RentalContract rc
       JOIN Machine m ON rc.machine_id = m.machine_id
       WHERE rc.company_id = ? AND rc.rental_status = 'active'`,
      [companyId]
    );

    if (companyInfo.length === 0) {
      return res.status(404).json({ error: 'Company not found.' });
    }

    // Format contract summary
    const contractSummaryObj = { active: 0, completed: 0, overdue: 0 };
    contractSummary.forEach(row => {
      contractSummaryObj[row.rental_status] = parseInt(row.count, 10);
    });

    const dashboardData = {
      companyInfo: companyInfo[0],
      contractSummary: contractSummaryObj,
      financials: {
        totalBilledAmount: parseFloat(financials[0]?.total_billed_amount) || 0,
        paidInvoices: parseInt(financials[0]?.paid_invoices, 10) || 0,
        pendingInvoices: parseInt(financials[0]?.pending_invoices, 10) || 0
      },
      activeMachineCount: activeMachines.length,
      activeMachines: activeMachines
    };

    res.status(200).json(dashboardData);

  } catch (error) {
    console.error(`Dashboard fetch error for company ${companyId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Notifications endpoint
app.get('/api/customer/notifications/:clientId', async (req, res) => {
  const { clientId } = req.params;
  
  try {
    const [notifications] = await pool.query(
      'SELECT * FROM Notifications WHERE client_id = ? ORDER BY sent_at DESC',
      [clientId]
    );
    res.json(notifications);
  } catch (error) {
    console.error('Notifications fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
app.put('/api/customer/notifications/:notificationId/read', async (req, res) => {
  const { notificationId } = req.params;
  
  try {
    await pool.query(
      'UPDATE Notifications SET is_read = TRUE, read_at = NOW() WHERE id = ?',
      [notificationId]
    );
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Get all companies for registration dropdown
app.get('/api/companies', async (req, res) => {
  try {
    const [companies] = await pool.query(
      'SELECT company_id, name FROM Company ORDER BY name'
    );
    res.json(companies);
  } catch (error) {
    console.error('Companies fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// Anomaly detection direct check endpoint
app.post('/api/anomaly/check', async (req, res) => {
  try {
    const learn = req.query.learn === 'true';
    const result = await detectAnomaly(req.body, learn);
    res.json(result);
  } catch (err) {
    console.error('Anomaly detection error:', err.message);
    res.status(500).json({ error: 'Failed to detect anomaly' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
