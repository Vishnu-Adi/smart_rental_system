// const express = require('express');
// const cors = require('cors');
// const mysql = require('mysql2/promise');

// const app = express();
// const PORT = process.env.PORT || 5001;

// const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
// app.use(cors({
//   origin: (origin, cb) => {
//     if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
//     return cb(new Error('Not allowed by CORS'));
//   },
//   methods: ['GET','POST','PUT','DELETE','OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true,
// }));
// app.options('*', cors());

// app.use(express.json());

// const pool = mysql.createPool({
//   host: process.env.DB_HOST || 'localhost',
//   user: process.env.DB_USER || 'root',
//   password: process.env.DB_PASSWORD || 'Vishnu@234',
//   database: process.env.DB_NAME || 'rental_sys',
//   port: Number(process.env.DB_PORT || 3306),
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
//   dateStrings: true,
// });

// (async () => {
//   try {
//     await pool.query('SELECT 1');
//     console.log('✅ Successfully connected to the MySQL database.');
//   } catch (err) {
//     console.error('❌ Error connecting to the MySQL database:', err);
//     process.exit(1);
//   }
// })();

// app.get('/api/assets', async (req, res) => {
//   try {
//     const assetsSql = `
//       SELECT
//         m.*,
//         CASE WHEN rc.rental_status = 'active' THEN 'Rented' ELSE m.status END AS rentalStatus,
//         c.name AS currentRenter
//       FROM Machine m
//       LEFT JOIN RentalContract rc
//         ON m.machine_id = rc.machine_id AND rc.rental_status = 'active'
//       LEFT JOIN Company c
//         ON rc.company_id = c.company_id
//     `;
//     const [assets] = await pool.query(assetsSql);

//     const [catRows] = await pool.query(
//       'SELECT asset_type, COUNT(*) AS count FROM Machine GROUP BY asset_type'
//     );
//     const categoryDistribution = {};
//     for (const r of catRows) categoryDistribution[r.asset_type] = Number(r.count);

//     const rentedCount = assets.filter((a) => a.status === 'rented').length;
//     const totalCount = assets.length;

//     res.json({
//       assets,
//       summary: {
//         total: totalCount,
//         rented: rentedCount,
//         available: totalCount - rentedCount,
//         rentedPercentage: totalCount > 0 ? (rentedCount / totalCount) * 100 : 0,
//       },
//       categoryDistribution,
//     });
//   } catch (error) {
//     console.error('Error fetching asset data:', error);
//     res.status(500).json({ message: 'Error processing asset data', error: error.message });
//   }
// });

// app.get('/api/health', async (req, res) => {
//   try {
//     const sql = `
//       SELECT
//         m.machine_id,
//         CONCAT(m.asset_type, ' #', m.machine_id) AS name,
//         m.manufacturer,
//         mha.*
//       FROM Machine m
//       LEFT JOIN (
//         SELECT t.*
//         FROM MachineHealthAnalytics t
//         JOIN (
//           SELECT machine_id, MAX(log_timestamp) AS max_ts
//           FROM MachineHealthAnalytics
//           GROUP BY machine_id
//         ) latest ON t.machine_id = latest.machine_id AND t.log_timestamp = latest.max_ts
//       ) mha ON m.machine_id = mha.machine_id
//     `;
//     const [rows] = await pool.query(sql);
//     res.json(rows);
//   } catch (error) {
//     console.error('Error fetching health data:', error);
//     res.status(500).json({ message: 'Error processing health data', error: error.message });
//   }
// });

// app.get('/api/health/:machineId', async (req, res) => {
//   try {
//     const { machineId } = req.params;
//     const [machines] = await pool.query('SELECT * FROM Machine WHERE machine_id = ?', [machineId]);
//     if (!machines.length) return res.status(404).json({ message: 'Machine not found' });

//     const [sensor] = await pool.query(
//       'SELECT * FROM MachineSensorData WHERE machine_id = ? ORDER BY `timestamp` DESC LIMIT 50',
//       [machineId]
//     );

//     res.json({
//       machine: machines[0],
//       sensorReadings: sensor.reverse(),
//     });
//   } catch (error) {
//     console.error('Error fetching machine detail data:', error);
//     res.status(500).json({ message: 'Error processing machine detail data', error: error.message });
//   }
// });

// app.get('/api/usage', async (req, res) => {
//   try {
//     const sql = `
//       SELECT
//         m.machine_id,
//         CONCAT(m.asset_type, ' #', m.machine_id) AS name,
//         m.current_location_lat AS location_lat,
//         m.current_location_lon AS location_lon,
//         msd.*
//       FROM Machine m
//       LEFT JOIN (
//         SELECT s.*
//         FROM MachineSensorData s
//         JOIN (
//           SELECT machine_id, MAX(\`timestamp\`) AS max_ts
//           FROM MachineSensorData
//           GROUP BY machine_id
//         ) latest ON s.machine_id = latest.machine_id AND s.\`timestamp\` = latest.max_ts
//       ) msd ON m.machine_id = msd.machine_id
//     `;
//     const [usageLogs] = await pool.query(sql);

//     const processed = usageLogs.map((log) => {
//       let utilization_status = 'Normal';
//       const productiveMins = parseFloat(log.productive_time_mins || 0);
//       const idleMins = parseFloat(log.idle_time_mins || 0);
//       const totalMins = productiveMins + idleMins;
//       if (totalMins > 0) {
//         const idleRatio = idleMins / totalMins;
//         if (idleRatio > 0.4) utilization_status = 'Underutilized';
//         if (productiveMins > 500) utilization_status = 'Overutilized';
//       }
//       return { ...log, utilization_status };
//     });

//     res.json(processed);
//   } catch (error) {
//     console.error('Error fetching usage data:', error);
//     res.status(500).json({ message: 'Error processing usage data', error: error.message });
//   }
// });

// app.get('/api/forecast', async (req, res) => {
//   try {
//     const sql = `
//       SELECT month, COUNT(*) AS rentals
//       FROM (
//         SELECT DATE_FORMAT(start_date, '%Y-%m') AS month
//         FROM RentalContract
//       ) t
//       GROUP BY month
//       ORDER BY month
//     `;
//     const [rows] = await pool.query(sql);
//     res.json(rows);
//   } catch (error) {
//     console.error('Error fetching forecast data:', error);
//     res.status(500).json({ message: 'Error processing forecast data', error: error.message });
//   }
// });

// app.get('/api/customers', async (req, res) => {
//   try {
//     const sql = `
//       WITH ContractMetrics AS (
//         SELECT
//           company_id,
//           COUNT(*) AS total_rentals,
//           COUNT(CASE WHEN rental_status = 'overdue' THEN 1 END) AS overdue_rentals
//         FROM RentalContract
//         GROUP BY company_id
//       ),
//       HealthMetrics AS (
//         SELECT
//           rc.company_id,
//           AVG(mha.safety_score) AS avg_safety_score,
//           AVG(mha.wear_and_tear_index) AS avg_wear_index
//         FROM RentalContract rc
//         JOIN MachineHealthAnalytics mha ON rc.machine_id = mha.machine_id
//         WHERE mha.log_timestamp BETWEEN rc.actual_start_date AND rc.actual_end_date
//         GROUP BY rc.company_id
//       )
//       SELECT
//         c.*,
//         COALESCE(cm.total_rentals, 0) AS totalRentals,
//         CASE
//           WHEN COALESCE(cm.total_rentals, 0) > 0
//           THEN (1 - (COALESCE(cm.overdue_rentals, 0) / cm.total_rentals)) * 100
//           ELSE 100
//         END AS onTimeReturnRate,
//         COALESCE(hm.avg_safety_score, 100) AS avgSafetyScore,
//         COALESCE(hm.avg_wear_index, 0) AS avgWearIndex
//       FROM Company c
//       LEFT JOIN ContractMetrics cm ON c.company_id = cm.company_id
//       LEFT JOIN HealthMetrics hm ON c.company_id = hm.company_id
//     `;
//     const [rows] = await pool.query(sql);
//     res.json(rows);
//   } catch (error) {
//     console.error('Error fetching customer data:', error);
//     res.status(500).json({ message: 'Error processing customer data', error: error.message });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`🚀 Server is running on http://localhost:${PORT}`);
// });