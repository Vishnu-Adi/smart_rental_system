-- Smart Rental System - Customer Portal Database Schema
-- Run this script in MySQL Workbench

USE rental_sys;

-- 1. Create Clients table for customer authentication
CREATE TABLE IF NOT EXISTS Clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    company_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES Company(company_id) ON DELETE CASCADE,
    INDEX idx_company_id (company_id),
    INDEX idx_username (username)
);

-- 2. Create Notifications table
CREATE TABLE IF NOT EXISTS Notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    contract_id INT,
    notification_type ENUM('checkout_reminder', 'payment_due', 'contract_renewal', 'maintenance_alert', 'general') DEFAULT 'general',
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    FOREIGN KEY (client_id) REFERENCES Clients(id) ON DELETE CASCADE,
    FOREIGN KEY (contract_id) REFERENCES RentalContract(contract_id) ON DELETE SET NULL,
    INDEX idx_client_id (client_id),
    INDEX idx_sent_at (sent_at),
    INDEX idx_is_read (is_read)
);

-- 3. Insert sample clients with hashed passwords
-- Password for both users is: 'password123'
INSERT IGNORE INTO Clients (username, password_hash, company_id) VALUES 
('demo_user', '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 1),
('test_company', '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 2),
('acme_client', '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 3);

-- 4. Insert sample notifications
INSERT IGNORE INTO Notifications (client_id, notification_type, message) VALUES 
(1, 'general', 'Welcome to Smart Rental System! Your account has been activated successfully.'),
(1, 'contract_renewal', 'Your rental contract for Excavator #101 is due for renewal in 30 days. Please contact support.'),
(1, 'payment_due', 'Payment of $5,250 is due for Contract #RC001 by March 15th. Please ensure timely payment.'),
(1, 'checkout_reminder', 'Equipment checkout reminder: Please return Crane #205 by tomorrow at 5:00 PM.'),
(1, 'maintenance_alert', 'Scheduled maintenance for Bulldozer #150 is due next week. Equipment will be temporarily unavailable.'),
(2, 'general', 'New safety protocols have been implemented. Please review the updated guidelines.'),
(2, 'payment_due', 'Invoice #INV-2024-002 for $3,750 is now available for payment.'),
(3, 'contract_renewal', 'Your annual contract is up for renewal. Contact us to discuss terms.');

-- 5. Verify the data
SELECT 'Clients Table' as Info;
SELECT c.id, c.username, c.company_id, co.name as company_name, c.created_at 
FROM Clients c 
JOIN Company co ON c.company_id = co.company_id;

SELECT 'Notifications Table' as Info;
SELECT n.id, n.client_id, c.username, n.notification_type, n.message, n.is_read, n.sent_at 
FROM Notifications n 
JOIN Clients c ON n.client_id = c.id 
ORDER BY n.sent_at DESC;
