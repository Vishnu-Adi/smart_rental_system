const mysql = require('mysql2/promise');

// Database connection
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

// Function to send checkout reminders
async function sendCheckoutReminders() {
  try {
    console.log('🔍 Checking for contracts ending in 7 days...');
    
    // Find contracts ending in exactly 7 days
    const [contracts] = await pool.query(`
      SELECT 
        rc.contract_id, 
        rc.end_date, 
        c.id AS client_id, 
        c.username, 
        co.name AS company_name,
        m.asset_type,
        m.machine_id
      FROM RentalContract rc
      JOIN Clients c ON rc.company_id = c.company_id
      JOIN Company co ON rc.company_id = co.company_id
      JOIN Machine m ON rc.machine_id = m.machine_id
      WHERE DATE(rc.end_date) = DATE(DATE_ADD(CURDATE(), INTERVAL 7 DAY))
      AND rc.rental_status = 'active'
    `);

    console.log(`📧 Found ${contracts.length} contracts ending in 7 days`);

    for (const contract of contracts) {
      const message = `Dear ${contract.username}, your rental contract for ${contract.asset_type} #${contract.machine_id} is ending on ${contract.end_date}. Please prepare for checkout.`;

      // Insert notification record
      await pool.query(`
        INSERT INTO Notifications (client_id, contract_id, notification_type, message)
        VALUES (?, ?, ?, ?)
      `, [contract.client_id, contract.contract_id, 'checkout_reminder', message]);

      console.log(`✅ Notification sent to ${contract.username}: Contract ${contract.contract_id} ending soon`);
    }

  } catch (error) {
    console.error('❌ Error sending checkout notifications:', error);
  }
}

// Function to send payment reminders
async function sendPaymentReminders() {
  try {
    console.log('🔍 Checking for overdue payments...');
    
    // Find contracts with pending payments that are overdue
    const [overduePayments] = await pool.query(`
      SELECT 
        rc.contract_id,
        rc.billing_amount,
        c.id AS client_id,
        c.username,
        co.name AS company_name,
        rc.end_date
      FROM RentalContract rc
      JOIN Clients c ON rc.company_id = c.company_id
      JOIN Company co ON rc.company_id = co.company_id
      WHERE rc.payment_status IN ('pending', 'failed')
      AND DATE(rc.end_date) < CURDATE()
    `);

    console.log(`💰 Found ${overduePayments.length} overdue payments`);

    for (const payment of overduePayments) {
      const message = `Payment reminder: Your payment of ₹${payment.billing_amount} for contract #${payment.contract_id} is overdue. Please make payment immediately to avoid service disruption.`;

      // Insert notification record
      await pool.query(`
        INSERT INTO Notifications (client_id, contract_id, notification_type, message)
        VALUES (?, ?, ?, ?)
      `, [payment.client_id, payment.contract_id, 'payment_due', message]);

      console.log(`💸 Payment reminder sent to ${payment.username}: Contract ${payment.contract_id}`);
    }

  } catch (error) {
    console.error('❌ Error sending payment reminders:', error);
  }
}

// Function to send maintenance alerts
async function sendMaintenanceAlerts() {
  try {
    console.log('🔧 Checking for maintenance alerts...');
    
    // Find machines that need maintenance based on health metrics
    const [maintenanceNeeded] = await pool.query(`
      SELECT DISTINCT
        m.machine_id,
        m.asset_type,
        rc.company_id,
        c.id AS client_id,
        c.username
      FROM Machine m
      JOIN RentalContract rc ON m.machine_id = rc.machine_id
      JOIN Clients c ON rc.company_id = c.company_id
      JOIN MachineHealthAnalytics mha ON m.machine_id = mha.machine_id
      WHERE rc.rental_status = 'active'
      AND (
        mha.safety_score < 70 
        OR mha.wear_and_tear_index > 80
        OR mha.predictive_maintenance_alert = 'high'
      )
      AND mha.log_timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);

    console.log(`🔧 Found ${maintenanceNeeded.length} machines needing maintenance`);

    for (const machine of maintenanceNeeded) {
      const message = `Maintenance Alert: Your rented ${machine.asset_type} #${machine.machine_id} requires immediate maintenance attention. Please contact support to schedule maintenance.`;

      // Insert notification record
      await pool.query(`
        INSERT INTO Notifications (client_id, notification_type, message)
        VALUES (?, ?, ?)
      `, [machine.client_id, 'maintenance_alert', message]);

      console.log(`🔧 Maintenance alert sent for machine ${machine.machine_id} to ${machine.username}`);
    }

  } catch (error) {
    console.error('❌ Error sending maintenance alerts:', error);
  }
}

// Main function to run all notification checks
async function runNotificationSystem() {
  console.log('🚀 Starting notification system...');
  console.log('⏰', new Date().toLocaleString());
  
  await sendCheckoutReminders();
  await sendPaymentReminders();
  await sendMaintenanceAlerts();
  
  console.log('✅ Notification system completed');
  console.log('-----------------------------------');
}

// If this file is run directly, execute the notification system
if (require.main === module) {
  runNotificationSystem()
    .then(() => {
      console.log('🎉 All notifications processed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error in notification system:', error);
      process.exit(1);
    });
}

// Export for use in cron jobs or other scripts
module.exports = {
  runNotificationSystem,
  sendCheckoutReminders,
  sendPaymentReminders,
  sendMaintenanceAlerts
};
