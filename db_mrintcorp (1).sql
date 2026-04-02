-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 01, 2026 at 07:03 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.1.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_mrintcorp`
--

-- --------------------------------------------------------

--
-- Table structure for table `tbl_client`
--

CREATE TABLE `tbl_client` (
  `client_ID` int(11) NOT NULL,
  `client_name` varchar(100) NOT NULL,
  `client_contactNumber` varchar(11) NOT NULL,
  `client_email` varchar(40) DEFAULT NULL,
  `client_address` varchar(100) NOT NULL,
  `client_contactPersonID` int(9) NOT NULL,
  `TIN_Code` varchar(255) DEFAULT NULL,
  `client_outstandingbalance` decimal(9,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_client`
--

INSERT INTO `tbl_client` (`client_ID`, `client_name`, `client_contactNumber`, `client_email`, `client_address`, `client_contactPersonID`, `TIN_Code`, `client_outstandingbalance`) VALUES
(1, 'MU Retail Store', '12345678910', 'notrealemail@notreal.com', 'Davao City', 1, NULL, 0.00),
(2, 'JM Retail Corp', '12345678910', 'notrealemail@notreal.com', 'Tagum City, Davao del Norte', 2, '', 820.00),
(3, 'Bloxys', '12345678910', 'notrealemail@notreal.com', 'Davao City', 3, NULL, 0.00),
(4, 'KREW Mart', '01234567891', 'notrealemail@notreal.com', 'Vancouver, British Columbia, Canada', 6, '', 1230.00),
(5, 'Mississauga\'s Freshest Grocery Store', '09111111112', 'yesthisis@notrealemail.com', 'Mississauga, Greater Toronto Area, Ontario, Canada', 11, '', 310.00),
(6, 'The Totally Real Canadian Tire', '12345678910', 'lolthisistotallyreal@notreal.com', 'Medicine Hat, Alberta, Canada', 12, '', 825.00),
(7, 'SM Supermarket', '09234567891', 'frjs@notrealemail.com.ph', 'Bangkal, Davao City', 13, '', 0.00),
(8, 'JM\'s Superstore', '0999999999', 'jm@notrealemail.com', 'Digos, Davao del Sur', 17, '', 400.00),
(9, 'fff', '09555879226', 'candsa@notrealemail.com', 'canada', 19, '', 0.00),
(10, 'Greatwall', '09854562143', '', 'Uyanguren, Davao City', 20, '', 2016.00),
(11, 'TWICE eatery', '02955555556', 'myouimina@totallyreal.com', 'Matina Crossing Davao City', 21, '', 0.02),
(12, 'MMK Store', '02596555555', 'chaeyoung@notreal.com', 'Bajada, Davao City', 22, '', 0.00),
(13, 'dsta', '09177199843', '', 'uyanguren', 23, '', 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_customer`
--

CREATE TABLE `tbl_customer` (
  `client_contactPersonID` int(9) NOT NULL,
  `contactPerson` varchar(60) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_customer`
--

INSERT INTO `tbl_customer` (`client_contactPersonID`, `contactPerson`) VALUES
(1, 'Mark Union'),
(2, 'John Mattheson'),
(3, 'Franz Orcasitas'),
(4, NULL),
(5, NULL),
(6, 'Golden Eby'),
(7, NULL),
(8, NULL),
(9, NULL),
(10, NULL),
(11, 'Bonnie Crombie'),
(12, 'Douglas Stiles'),
(13, 'Francis Javier Sanchez'),
(14, NULL),
(15, NULL),
(16, NULL),
(17, 'John Merrick'),
(18, NULL),
(19, 'Kelly Kelly'),
(20, 'Kenneth Ceballos'),
(21, 'Myoui Mina'),
(22, 'Son Chaeyoung'),
(23, 'helen faller');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_damage_during`
--

CREATE TABLE `tbl_damage_during` (
  `damage_ID` int(11) NOT NULL,
  `shipment_id` int(11) NOT NULL,
  `damage_date` date NOT NULL DEFAULT curdate(),
  `productLine_id` int(11) DEFAULT NULL,
  `damage_quantity` int(9) NOT NULL,
  `damage_amount` decimal(9,2) NOT NULL,
  `damage_subtotal` decimal(9,2) DEFAULT NULL,
  `damage_description` varchar(255) DEFAULT NULL
) ;

--
-- Dumping data for table `tbl_damage_during`
--

INSERT INTO `tbl_damage_during` (`damage_ID`, `shipment_id`, `damage_date`, `productLine_id`, `damage_quantity`, `damage_amount`, `damage_subtotal`, `damage_description`) VALUES
(4, 9, '2026-03-08', 1, 2, 350.00, 700.00, NULL),
(5, 9, '2026-03-08', 2, 2, 55.00, 110.00, NULL),
(6, 37, '2026-03-11', 1, 3, 350.00, 1050.00, NULL),
(7, 40, '2026-03-12', 3, 3, 40.00, 120.00, NULL),
(8, 40, '2026-03-12', 4, 5, 45.00, 225.00, NULL),
(10, 43, '2026-03-14', 8, 2, 8.00, 16.00, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_damage_withinwarehouse`
--

CREATE TABLE `tbl_damage_withinwarehouse` (
  `damage_ID` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `damage_quantity` int(9) NOT NULL,
  `damage_amount` decimal(9,2) NOT NULL,
  `damage_subtotal` decimal(9,2) DEFAULT NULL,
  `damage_description` varchar(255) DEFAULT NULL,
  `employee_id` int(9) DEFAULT NULL COMMENT 'employee responsible for the loss/breakage',
  `manager_id` int(9) DEFAULT NULL,
  `damage_date` date DEFAULT NULL,
  `damage_type` enum('Warehouse','Bad Order') NOT NULL DEFAULT 'Warehouse'
) ;

--
-- Dumping data for table `tbl_damage_withinwarehouse`
--

INSERT INTO `tbl_damage_withinwarehouse` (`damage_ID`, `product_id`, `damage_quantity`, `damage_amount`, `damage_subtotal`, `damage_description`, `employee_id`, `manager_id`, `damage_date`, `damage_type`) VALUES
(1, 5, 3, 65.00, 195.00, 'Dropped during shelving', 3, 1, NULL, 'Warehouse'),
(2, 1, 5, 350.00, 1750.00, 'Dropped while putting in the truck', 0, 1, NULL, 'Warehouse'),
(3, 5, 5, 60.00, 300.00, NULL, 0, 1, NULL, 'Warehouse'),
(4, 2, 2, 0.00, 110.00, 'No description', 58, 3, '2026-03-08', 'Warehouse'),
(5, 5, 4, 0.00, 240.00, 'No description', 3, 1, '2026-03-08', 'Warehouse'),
(7, 2, 1, 55.00, 55.00, 'No description', 58, 1, '2026-03-11', 'Warehouse'),
(8, 1, 2, 700.00, 700.00, 'No description', 58, 1, '2026-03-11', 'Warehouse'),
(9, 6, 2, 100.00, 100.00, 'No description', 58, 1, '2026-03-11', 'Warehouse'),
(10, 3, 2, 80.00, 80.00, 'No description', 33, 3, '2026-03-11', 'Warehouse'),
(11, 4, 2, 90.00, 90.00, 'No description', 33, 3, '2026-03-11', 'Warehouse'),
(12, 7, 2, 100.00, 100.00, 'No description', 1, 1, '2026-03-11', 'Warehouse'),
(13, 1, 1, 350.00, 350.00, 'No description', 1, 1, '2026-03-11', 'Warehouse'),
(14, 1, 1, 350.00, 350.00, 'No description', 58, 3, '2026-03-11', 'Warehouse'),
(15, 1, 10, 3500.00, 3500.00, 'No description', 58, 5, '2026-03-11', 'Warehouse'),
(16, 5, 5, 300.00, 300.00, 'No description', 58, 5, '2026-03-11', 'Warehouse'),
(17, 8, 5, 1910.00, 1910.00, 'No description', 999, 1, '2026-03-12', 'Warehouse'),
(18, 1, 10, 3500.00, 3500.00, 'No description', 58, 1, '2026-03-12', 'Warehouse'),
(19, 7, 4, 200.00, 200.00, 'No description', 58, 1, '2026-03-12', 'Warehouse'),
(20, 16, 10, 400.00, 400.00, 'No description', 1, 3, '2026-03-14', 'Warehouse'),
(21, 10, 5, 1325.00, 1325.00, 'No description', 1, 3, '2026-03-14', 'Warehouse');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_employee`
--

CREATE TABLE `tbl_employee` (
  `employee_ID` int(9) NOT NULL,
  `employee_name` varchar(60) DEFAULT NULL,
  `employee_role` varchar(30) DEFAULT NULL,
  `employee_email` varchar(35) DEFAULT NULL,
  `employee_contactNo` varchar(11) DEFAULT NULL,
  `employee_address` varchar(100) DEFAULT NULL,
  `employee_gender` varchar(15) DEFAULT NULL,
  `employee_dateHired` date DEFAULT NULL,
  `employee_status` varchar(15) DEFAULT 'Active',
  `employee_birthdate` date DEFAULT NULL,
  `username` varchar(50) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `system_role` enum('Owner','Manager','Employee') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_employee`
--

INSERT INTO `tbl_employee` (`employee_ID`, `employee_name`, `employee_role`, `employee_email`, `employee_contactNo`, `employee_address`, `employee_gender`, `employee_dateHired`, `employee_status`, `employee_birthdate`, `username`, `password_hash`, `system_role`) VALUES
(0, 'Jane Roe', 'Driver', 'janeroe@janedoe.com', '09123456789', 'London, UK', 'Female', '2026-03-03', 'Inactive', '1989-10-26', NULL, NULL, NULL),
(1, 'Markham Unionville', 'Accountant', 'mu@notrealemail.com', '12345678910', 'Davao City', 'Male', '2025-04-28', 'Active', '1980-09-22', 'markham', 'admin123', 'Manager'),
(2, 'Regina Quapelle', 'Senior Manager', 'rq@notrealemail.com', '12345678910', 'Cagayan de Oro City', 'Female', '2021-04-28', 'Inactive', '1999-05-12', 'regina', 'admin123', 'Employee'),
(3, 'Francis Hepburn', 'Accountant', 'fh@notrealemail.com', '12345678910', 'Manila', 'Male', '2018-10-25', 'Active', '1988-06-04', 'francis', 'admin123', 'Employee'),
(5, 'LESTER DOYUGAN ', 'Manager', 'lester@yahoo.com', '09998880000', 'BUHANGIN', 'Male', '2023-12-20', 'Active', '1970-11-20', NULL, NULL, NULL),
(10, 'Juan Dela Cruz', 'Driver', 'jdc@notrealemail.com', '09555555555', 'Davao City', 'Male', '2026-03-14', 'Active', '1986-03-14', NULL, NULL, NULL),
(25, 'Myoui Mina', 'Supervisor', 'mina@totallyreal.com', '09125875555', 'Seoul, South Korea', 'Female', '2026-02-17', 'Active', '1997-02-24', NULL, NULL, NULL),
(30, 'Pierre Poilievre', 'Accountant', 'pp@letsbringithomenotreal.com', '09555555557', 'Battle River Crowfoot, Alberta, Canada', 'Male', '2026-03-10', 'Inactive', '1979-06-03', NULL, NULL, NULL),
(33, 'Jean-Francois Roberge', 'Accountant', 'therealnotme@notrealemai.com', '0999999999', 'Davao City', 'Male', '2026-02-17', 'Inactive', '1974-06-17', NULL, NULL, NULL),
(55, 'John Doe', 'Driver', 'jdoe@notrealemail.com', '09555555555', 'Davao City', 'Male', '2026-03-14', 'Active', '1988-07-22', NULL, NULL, NULL),
(56, 'John Doe', 'Manager', 'jd@notrealemail.com', '095555555', 'Davao City', 'Male', '2026-03-14', 'Active', '1988-05-18', NULL, NULL, NULL),
(58, 'Francese Mission', 'Office Clerk', '', '09111111111', '', 'Female', '2026-03-07', 'Active', '1961-06-15', NULL, NULL, NULL),
(999, 'Administrator', 'Owner', NULL, NULL, NULL, NULL, NULL, 'Active', NULL, 'admin', 'admin123', 'Owner');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_inventory`
--

CREATE TABLE `tbl_inventory` (
  `inventory_ID` int(11) NOT NULL,
  `inventory_date` date NOT NULL,
  `manager_ID` int(5) NOT NULL,
  `inventory_total` decimal(9,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_inventory`
--

INSERT INTO `tbl_inventory` (`inventory_ID`, `inventory_date`, `manager_ID`, `inventory_total`) VALUES
(1, '2026-02-23', 1, 15500.50),
(2, '2026-02-23', 3, 8000.00),
(3, '2026-03-05', 1, 500.00),
(4, '2026-03-05', 1, 1500.00),
(5, '2026-03-08', 1, 2500.00),
(6, '2026-03-08', 1, 1250.00),
(7, '2026-03-08', 1, 2500.00),
(8, '2026-03-08', 1, 1250.00),
(9, '2026-03-08', 1, 2500.00),
(10, '2026-03-08', 1, 2500.00),
(11, '2026-03-11', 1, 2500.00),
(12, '2026-03-11', 1, 2500.00),
(13, '2026-03-12', 1, 38200.00),
(14, '2026-03-12', 1, 4000.00),
(15, '2026-03-14', 1, 4000.00),
(16, '2026-03-14', 1, 4000.00),
(17, '2026-03-14', 1, 16500.00);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_inventory_details`
--

CREATE TABLE `tbl_inventory_details` (
  `inventory_ID` int(11) NOT NULL,
  `product_ID` int(11) NOT NULL,
  `quantity` int(9) NOT NULL,
  `inventory_cost` decimal(9,2) DEFAULT NULL,
  `inventory_subtotal` decimal(9,2) DEFAULT NULL
) ;

--
-- Dumping data for table `tbl_inventory_details`
--

INSERT INTO `tbl_inventory_details` (`inventory_ID`, `product_ID`, `quantity`, `inventory_cost`, `inventory_subtotal`) VALUES
(1, 1, 110, 350.00, 38500.00),
(2, 3, 100, 150.00, 15000.00),
(3, 2, 10, 50.00, 500.00),
(4, 6, 50, 30.00, 1500.00),
(5, 5, 50, 50.00, 2500.00),
(6, 4, 25, 50.00, 1250.00),
(7, 4, 50, 50.00, 2500.00),
(8, 3, 25, 50.00, 1250.00),
(9, 3, 50, 50.00, 2500.00),
(10, 2, 50, 50.00, 2500.00),
(11, 5, 50, 50.00, 2500.00),
(12, 3, 50, 50.00, 2500.00),
(13, 8, 100, 382.00, 38200.00),
(14, 7, 80, 50.00, 4000.00),
(15, 3, 100, 40.00, 4000.00),
(16, 14, 500, 8.00, 4000.00),
(17, 5, 150, 110.00, 16500.00);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_manager`
--

CREATE TABLE `tbl_manager` (
  `employee_ID` int(9) DEFAULT NULL,
  `manager_ID` int(9) NOT NULL,
  `manager_dateStarted` date DEFAULT NULL,
  `manager_dateEnded` date DEFAULT NULL,
  `manager_status` varchar(15) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_manager`
--

INSERT INTO `tbl_manager` (`employee_ID`, `manager_ID`, `manager_dateStarted`, `manager_dateEnded`, `manager_status`) VALUES
(5, 0, '2026-03-12', NULL, 'Active'),
(1, 1, '2022-05-23', NULL, 'active'),
(2, 2, '2023-01-23', '2025-04-18', 'Retired'),
(3, 3, '2026-01-29', NULL, 'Active'),
(25, 5, '2026-03-11', NULL, 'Active');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_payment_details`
--

CREATE TABLE `tbl_payment_details` (
  `payment_ID` int(11) NOT NULL,
  `sales_ID` int(11) NOT NULL,
  `payment_type` varchar(15) NOT NULL,
  `payment_ORNumber` varchar(11) DEFAULT NULL,
  `payment_paidDate` date NOT NULL,
  `payment_amount` decimal(9,2) NOT NULL,
  `employee_ID` int(9) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_payment_details`
--

INSERT INTO `tbl_payment_details` (`payment_ID`, `sales_ID`, `payment_type`, `payment_ORNumber`, `payment_paidDate`, `payment_amount`, `employee_ID`) VALUES
(1, 1, 'Cash', 'OR-9901', '2026-02-23', 5000.00, 1),
(3, 15, 'Check', NULL, '2026-02-27', 2000.00, 1),
(4, 16, 'Cash', NULL, '2026-03-01', 213.98, 1),
(5, 18, 'Cash', NULL, '2026-03-05', 500.00, 1),
(6, 19, 'Cash', NULL, '2026-03-05', 500.00, 1),
(7, 18, 'Cash', '55555555', '2026-03-05', 100.00, 1),
(8, 17, 'Cash', '', '2026-03-05', 1000.00, 1),
(9, 22, 'Cash', '55-55-5555-', '2026-03-05', 40.00, 1),
(10, 21, 'Cash', '5-88855-88', '2026-03-05', 410.00, 1),
(11, 15, 'Cash', '5555', '2026-03-05', 1155.00, 1),
(12, 19, 'Cash', '55542', '2026-03-05', 1000.00, 1),
(13, 20, 'Cash', NULL, '2026-03-05', 500.00, 1),
(15, 1, 'Cash', '444444444', '2026-03-06', 1000.00, 0),
(16, 20, 'Check', '425687', '2026-03-06', 500.00, 1),
(17, 1, 'Cash', '125496', '2026-03-07', 4000.00, 3),
(18, 20, 'Cash', '555', '2026-03-07', 100.00, 1),
(19, 20, 'Cash', '123456', '2026-03-07', 100.00, 33),
(22, 24, 'Cash', NULL, '2026-03-07', 500.00, 1),
(26, 24, 'Cash', NULL, '2026-03-07', 600.00, 1),
(28, 24, 'Cash', NULL, '2026-03-07', 300.00, 1),
(29, 26, 'Cash', NULL, '2026-03-07', 350.00, 2),
(30, 25, 'Cash', '5558', '2026-03-07', 700.00, 58),
(31, 27, 'Cash', NULL, '2026-03-07', 350.00, 1),
(32, 28, 'GCash', NULL, '2026-03-08', 500.00, 1),
(33, 29, 'Cash', NULL, '2026-03-08', 250.00, 1),
(34, 30, 'Cash', NULL, '2026-03-08', 700.00, 1),
(35, 31, 'Cash', NULL, '2026-03-08', 50.00, 1),
(36, 32, 'Cash', NULL, '2026-03-08', 119.99, 1),
(37, 29, 'Cash', '5265', '2026-03-11', 19.00, 1),
(38, 32, 'Cash', '10000', '2026-03-11', 0.01, 1),
(39, 17, 'Cash', '256', '2026-03-11', 360.00, 1),
(40, 16, 'Cash', '1010', '2026-03-11', 986.02, 1),
(41, 20, 'GCash', '001010', '2026-03-11', 4000.00, 1),
(42, 20, 'Cash', '1526', '2026-03-11', 800.00, 1),
(43, 33, 'Check', '1023', '2026-03-11', 250.00, 1),
(44, 33, 'GCash', '101', '2026-03-11', 1.00, 1),
(45, 34, 'Check', NULL, '2026-03-11', 760.00, 1),
(47, 33, 'Cash', NULL, '2026-03-11', 774.00, 1),
(48, 35, 'Cash', NULL, '2026-03-11', 99.98, 1),
(49, 36, 'Cash', NULL, '2026-03-11', 300.00, 1),
(50, 37, 'Check', NULL, '2026-03-11', 1000.00, 1),
(51, 28, 'Cash', '6363', '2026-03-12', 1175.00, 1),
(52, 37, 'Cash', '696', '2026-03-12', 238.00, 1),
(53, 35, 'Cash', NULL, '2026-03-12', 425.00, 1),
(54, 37, 'Cash', '52365', '2026-03-12', 500.00, 1),
(55, 38, 'Cash', NULL, '2026-03-12', 2000.00, 1),
(56, 38, 'Check', '2568', '2026-03-12', 4000.00, 1),
(57, 37, 'Cash', NULL, '2026-03-12', 500.00, 1),
(58, 34, 'Cash', NULL, '2026-03-12', 250.00, 1),
(59, 38, 'Check', '2654', '2026-03-12', 2140.00, 58),
(60, 39, 'Check', '7856', '2026-03-12', 6060.00, 58),
(61, 40, 'Check', NULL, '2026-03-12', 1500.00, 1),
(62, 40, 'Cash', '425', '2026-03-12', 300.00, 1),
(63, 41, 'Cash', NULL, '2026-03-12', 1000.00, 1),
(64, 41, 'Check', '3654', '2026-03-12', 2350.00, 1),
(65, 42, 'Check', '0001', '2026-03-12', 4500.00, 5),
(66, 42, 'Check', '0002', '2026-03-12', 600.00, 5),
(67, 56, 'Check', NULL, '2026-03-14', 564.00, 999),
(68, 43, 'Cash', NULL, '2026-03-14', 3900.00, 1),
(69, 52, 'Check', '634', '2026-03-14', 1000.00, 1),
(70, 51, 'Cash', '198', '2026-03-14', 1460.00, 3);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_product`
--

CREATE TABLE `tbl_product` (
  `product_ID` int(11) NOT NULL,
  `product_name` varchar(80) NOT NULL,
  `product_stockQty` int(9) NOT NULL DEFAULT 0,
  `product_unitOfMeasure` varchar(15) NOT NULL,
  `product_reorderLevel` int(5) DEFAULT 0,
  `product_unitPrice` decimal(9,2) NOT NULL,
  `product_description` varchar(255) DEFAULT NULL,
  `product_pricePerCase` decimal(9,2) DEFAULT NULL,
  `product_plantPrice` decimal(9,2) DEFAULT NULL
) ;

--
-- Dumping data for table `tbl_product`
--

INSERT INTO `tbl_product` (`product_ID`, `product_name`, `product_stockQty`, `product_unitOfMeasure`, `product_reorderLevel`, `product_unitPrice`, `product_description`, `product_pricePerCase`, `product_plantPrice`) VALUES
(1, 'MBK 3.8kg', 34, '3.8kg x 4', 20, 108.00, 'Main product', 394.00, NULL),
(2, 'MBK 2.0kg', 3, '2.0kg x 6', 5, 68.00, 'Banana Ketchup', 380.00, NULL),
(3, 'MBK 1kg', 62, '1kg x 12', 50, 40.00, 'Small bottles of soy sauce', 410.00, NULL),
(4, 'MBK 200 g SUP', 20, '200g x 36', 40, 8.00, 'Small bottles of vinegar', 240.00, NULL),
(5, 'Mommy\'s Premium Soy Sauce 3.8kg', 155, '3.8kg x 4', 30, 110.00, 'Fresh miki noodles', 420.00, NULL),
(6, 'Mommy\'s Premium Soy Sauce', 20, '2.0kg x 6', 20, 75.00, '', 410.00, NULL),
(7, 'Mommy\'s Premium Soy Sauce', 66, '1kg x 12', 40, 45.00, '', 450.00, NULL),
(8, '200g SUP Mommy\'s Premium Soy Sauce', 24, '200g x 36', 15, 8.00, '', 232.00, NULL),
(9, 'Mitoyo Soy Sauce', 100, 'container', 40, 260.00, NULL, 265.00, NULL),
(10, 'Mommy Vinegar (White/Brown)', 95, 'container', 50, 265.00, NULL, 268.00, NULL),
(11, 'Mommy Cane Vinegar 3.8kg', 114, '3.8kg x 4', 30, 95.00, NULL, 365.00, NULL),
(12, 'Mommy Cane Vinegar 2.0kg', 150, '2.0kg x 6', 30, 65.00, NULL, 352.00, NULL),
(13, 'Mommy Cane Vinegar 1.0kg', 150, '1.0kg x 12', 30, 35.00, NULL, 378.00, NULL),
(14, 'Mommy Cane Vinegar 200g', 650, '200g x 36', 150, 8.00, NULL, 238.00, NULL),
(15, 'MPSS Carboy (19 Liters)', 100, 'container', 20, 460.00, NULL, 460.00, NULL),
(16, 'Fresh Miki (Pancit Miki)', 172, 'kilogram', 30, 40.00, NULL, 155.00, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_sales`
--

CREATE TABLE `tbl_sales` (
  `sales_ID` int(11) NOT NULL,
  `client_ID` int(11) NOT NULL,
  `employee_ID` int(11) NOT NULL,
  `sales_createdAt` date NOT NULL DEFAULT curdate(),
  `sales_dateCompleted` date DEFAULT NULL,
  `sales_status` varchar(15) NOT NULL DEFAULT 'Pending',
  `sales_notes` varchar(255) DEFAULT NULL,
  `sales_paymentStatus` varchar(15) NOT NULL DEFAULT 'Unpaid',
  `sales_totalAmount` decimal(9,2) NOT NULL,
  `sales_usedPoints` int(11) DEFAULT NULL,
  `sales_SINumber` int(11) DEFAULT NULL,
  `sales_DRNumber` int(11) DEFAULT NULL,
  `sales_SWSNumber` int(11) DEFAULT NULL,
  `sales_Balance` decimal(9,2) NOT NULL DEFAULT 0.00
) ;

--
-- Dumping data for table `tbl_sales`
--

INSERT INTO `tbl_sales` (`sales_ID`, `client_ID`, `employee_ID`, `sales_createdAt`, `sales_dateCompleted`, `sales_status`, `sales_notes`, `sales_paymentStatus`, `sales_totalAmount`, `sales_usedPoints`, `sales_SINumber`, `sales_DRNumber`, `sales_SWSNumber`, `sales_Balance`) VALUES
(1, 1, 1, '2026-02-23', NULL, 'Completed', NULL, 'Paid', 10000.00, NULL, NULL, NULL, NULL, 0.00),
(2, 2, 1, '2026-02-23', NULL, 'Completed', NULL, 'Paid', 8000.00, NULL, NULL, NULL, NULL, 0.00),
(3, 2, 2, '2026-02-23', NULL, 'Completed', NULL, 'Paid', 5000.00, NULL, NULL, NULL, NULL, 0.00),
(15, 3, 1, '2026-02-27', NULL, 'Completed', '', 'Paid', 3155.00, NULL, NULL, NULL, NULL, 0.00),
(16, 1, 1, '2026-03-01', NULL, 'Cancelled', '', 'Paid', 1200.00, NULL, NULL, NULL, NULL, 0.00),
(17, 2, 1, '2026-03-01', NULL, 'Cancelled', '', 'Partial', 4360.00, NULL, NULL, NULL, NULL, 3000.00),
(18, 4, 1, '2026-03-05', NULL, 'Pending', NULL, 'Paid', 600.00, NULL, NULL, NULL, NULL, 0.00),
(19, 4, 1, '2026-03-05', NULL, 'Completed', NULL, 'Paid', 1500.00, NULL, 0, NULL, NULL, 0.00),
(20, 5, 1, '2026-03-05', '2026-03-06', 'Completed', NULL, 'Paid', 6000.00, NULL, NULL, NULL, NULL, 0.00),
(21, 7, 1, '2026-03-05', NULL, 'Pending', NULL, 'Paid', 410.00, NULL, NULL, NULL, NULL, 0.00),
(22, 2, 1, '2026-03-05', NULL, 'Pending', NULL, 'Paid', 40.00, NULL, NULL, NULL, NULL, 0.00),
(24, 10, 1, '2026-03-07', NULL, 'Completed', NULL, 'Paid', 1400.00, NULL, NULL, NULL, NULL, 0.00),
(25, 10, 2, '2026-03-07', NULL, 'Pending', NULL, 'Paid', 700.00, NULL, NULL, 1445, NULL, 0.00),
(26, 10, 2, '2026-03-07', NULL, 'Pending', 'additional order', 'Paid', 350.00, NULL, 210, 14454, 521, 0.00),
(27, 4, 1, '2026-03-07', NULL, 'Pending', NULL, 'Paid', 350.00, NULL, NULL, NULL, NULL, 0.00),
(28, 3, 1, '2026-03-08', NULL, 'Pending', NULL, 'Paid', 1675.00, NULL, NULL, 2, NULL, 0.00),
(29, 10, 1, '2026-03-08', NULL, 'Pending', NULL, 'Paid', 269.00, NULL, NULL, NULL, NULL, 0.00),
(30, 9, 1, '2026-03-08', NULL, 'Completed', NULL, 'Paid', 700.00, NULL, NULL, NULL, NULL, 0.00),
(31, 3, 1, '2026-03-08', NULL, 'In Transit', NULL, 'Paid', 50.00, NULL, NULL, NULL, NULL, 0.00),
(32, 3, 1, '2026-03-08', NULL, 'In Transit', NULL, 'Paid', 120.00, NULL, NULL, NULL, NULL, 0.00),
(33, 4, 1, '2026-03-11', NULL, 'Pending', NULL, 'Paid', 1025.00, NULL, NULL, NULL, NULL, 0.00),
(34, 4, 1, '2026-03-11', NULL, 'Pending', NULL, 'Paid', 1010.00, NULL, NULL, NULL, NULL, 0.00),
(35, 11, 1, '2026-03-11', NULL, 'Pending', NULL, 'Partial', 525.00, NULL, 0, NULL, NULL, 0.02),
(36, 10, 1, '2026-03-11', NULL, 'Completed', NULL, 'Paid', 300.00, NULL, 2550, 2156, 2232, 0.00),
(37, 4, 1, '2026-03-11', NULL, 'Completed', NULL, 'Paid', 2238.00, NULL, 1212, 125, 5496, 0.00),
(38, 10, 1, '2026-03-12', NULL, 'Completed', NULL, 'Paid', 8140.00, NULL, NULL, 2524, NULL, 0.00),
(39, 13, 1, '2026-03-12', NULL, 'Pending', NULL, 'Paid', 6060.00, NULL, NULL, 3467, NULL, 0.00),
(40, 10, 1, '2026-03-12', NULL, 'Completed', NULL, 'Paid', 1800.00, NULL, 3636, 259, NULL, 0.00),
(41, 13, 1, '2026-03-12', NULL, 'Completed', NULL, 'Paid', 3350.00, NULL, 3678, 125, NULL, 0.00),
(42, 7, 1, '2026-03-12', NULL, 'Completed', NULL, 'Paid', 5100.00, NULL, 88, NULL, NULL, 0.00),
(43, 3, 1, '2026-03-14', NULL, 'Pending', NULL, 'Paid', 3900.00, NULL, NULL, NULL, NULL, 0.00),
(44, 10, 1, '2026-03-14', NULL, 'In Transit', NULL, 'Unpaid', 936.00, NULL, 2569, NULL, NULL, 936.00),
(45, 4, 1, '2026-03-14', NULL, 'Pending', NULL, 'Unpaid', 1230.00, NULL, NULL, NULL, NULL, 1230.00),
(46, 2, 1, '2026-03-14', NULL, 'Pending', NULL, 'Unpaid', 820.00, NULL, NULL, NULL, NULL, 820.00),
(47, 8, 1, '2026-03-14', NULL, 'Pending', NULL, 'Unpaid', 400.00, NULL, NULL, NULL, NULL, 400.00),
(50, 5, 1, '2026-03-14', NULL, 'Pending', NULL, 'Unpaid', 310.00, NULL, 2565, NULL, NULL, 310.00),
(51, 8, 1, '2026-03-14', NULL, 'Pending', NULL, 'Paid', 1460.00, NULL, 126, NULL, NULL, 0.00),
(52, 6, 1, '2026-03-14', NULL, 'Pending', NULL, 'Partial', 1825.00, NULL, 126, NULL, NULL, 825.00),
(54, 10, 5, '2026-03-14', NULL, 'Pending', NULL, 'Unpaid', 1040.00, NULL, 252, NULL, NULL, 1040.00),
(56, 5, 999, '2026-03-14', NULL, 'Completed', NULL, 'Paid', 464.00, NULL, 5789, NULL, NULL, 0.00),
(57, 10, 999, '2026-03-14', NULL, 'Pending', NULL, 'Unpaid', 40.00, NULL, NULL, NULL, NULL, 40.00);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_sales_details`
--

CREATE TABLE `tbl_sales_details` (
  `sales_ID` int(11) NOT NULL,
  `productLine_ID` int(11) NOT NULL,
  `salesDetail_qty` int(9) NOT NULL,
  `salesDetail_amountPerProduct` decimal(6,2) DEFAULT NULL,
  `salesDetail_subtotal` decimal(9,2) DEFAULT NULL,
  `salesDetail_unitPriceSold` decimal(9,2) NOT NULL,
  `salesDetail_unitType` enum('Cases','Pieces') NOT NULL DEFAULT 'Cases',
  `salesDetail_remainder` int(11) NOT NULL DEFAULT 0
) ;

--
-- Dumping data for table `tbl_sales_details`
--

INSERT INTO `tbl_sales_details` (`sales_ID`, `productLine_ID`, `salesDetail_qty`, `salesDetail_amountPerProduct`, `salesDetail_subtotal`, `salesDetail_unitPriceSold`, `salesDetail_unitType`, `salesDetail_remainder`) VALUES
(15, 1, 5, NULL, 1750.00, 350.00, 'Cases', 0),
(15, 2, 3, NULL, 165.00, 55.00, 'Cases', 0),
(15, 3, 10, NULL, 400.00, 40.00, 'Cases', 0),
(15, 4, 12, NULL, 540.00, 45.00, 'Cases', 0),
(15, 5, 5, NULL, 300.00, 60.00, 'Cases', 0),
(16, 5, 20, NULL, 1200.00, 60.00, 'Cases', 0),
(17, 1, 5, NULL, 1750.00, 350.00, 'Cases', 0),
(17, 2, 8, NULL, 440.00, 55.00, 'Cases', 0),
(17, 3, 10, NULL, 400.00, 40.00, 'Cases', 0),
(17, 4, 6, NULL, 270.00, 45.00, 'Cases', 0),
(17, 5, 25, NULL, 1500.00, 60.00, 'Cases', 0),
(18, 1, 1, NULL, 350.00, 350.00, 'Cases', 0),
(18, 2, 1, NULL, 55.00, 55.00, 'Cases', 0),
(18, 3, 1, NULL, 40.00, 40.00, 'Cases', 0),
(18, 4, 1, NULL, 45.00, 45.00, 'Cases', 0),
(18, 5, 1, NULL, 60.00, 60.00, 'Cases', 0),
(18, 6, 1, NULL, 50.00, 50.00, 'Cases', 0),
(19, 5, 25, NULL, 1500.00, 60.00, 'Cases', 0),
(20, 1, 10, NULL, 3500.00, 350.00, 'Cases', 0),
(20, 2, 10, NULL, 550.00, 55.00, 'Cases', 0),
(20, 3, 10, NULL, 400.00, 40.00, 'Cases', 0),
(20, 4, 10, NULL, 450.00, 45.00, 'Cases', 0),
(20, 5, 10, NULL, 600.00, 60.00, 'Cases', 0),
(20, 6, 10, NULL, 500.00, 50.00, 'Cases', 0),
(21, 1, 1, NULL, 350.00, 350.00, 'Cases', 0),
(21, 5, 1, NULL, 60.00, 60.00, 'Cases', 0),
(22, 3, 1, NULL, 40.00, 40.00, 'Cases', 0),
(24, 1, 4, NULL, 1400.00, 350.00, 'Cases', 0),
(25, 1, 2, NULL, 700.00, 350.00, 'Cases', 0),
(26, 1, 1, NULL, 350.00, 350.00, 'Cases', 0),
(27, 1, 1, NULL, 350.00, 350.00, 'Cases', 0),
(28, 1, 3, NULL, 1050.00, 350.00, 'Cases', 0),
(28, 3, 3, NULL, 120.00, 40.00, 'Cases', 0),
(28, 4, 3, NULL, 135.00, 45.00, 'Cases', 0),
(28, 5, 2, NULL, 120.00, 60.00, 'Cases', 0),
(28, 6, 5, NULL, 250.00, 50.00, 'Cases', 0),
(29, 1, 5, NULL, 105.00, 21.00, 'Cases', 0),
(29, 4, 2, NULL, 24.00, 12.00, 'Cases', 0),
(29, 5, 2, NULL, 100.00, 50.00, 'Cases', 0),
(29, 6, 2, NULL, 40.00, 20.00, 'Cases', 0),
(30, 1, 2, NULL, 700.00, 350.00, 'Cases', 0),
(31, 7, 1, NULL, 50.00, 50.00, 'Cases', 0),
(32, 7, 3, NULL, 120.00, 40.00, 'Cases', 0),
(33, 1, 5, NULL, 175.00, 35.00, 'Cases', 0),
(33, 5, 10, NULL, 600.00, 60.00, 'Cases', 0),
(33, 7, 5, NULL, 250.00, 50.00, 'Cases', 0),
(34, 1, 16, NULL, 560.00, 35.00, 'Cases', 0),
(34, 3, 15, NULL, 450.00, 30.00, 'Cases', 0),
(35, 3, 5, NULL, 125.00, 25.00, 'Cases', 0),
(35, 5, 10, NULL, 400.00, 40.00, 'Cases', 0),
(36, 3, 10, NULL, 300.00, 30.00, 'Cases', 0),
(37, 1, 13, NULL, 338.00, 26.00, 'Cases', 0),
(37, 5, 20, NULL, 1100.00, 55.00, 'Cases', 0),
(37, 7, 20, NULL, 800.00, 40.00, 'Cases', 0),
(38, 7, 10, NULL, 500.00, 50.00, 'Cases', 0),
(38, 8, 20, NULL, 7640.00, 382.00, 'Cases', 0),
(39, 4, 10, NULL, 2650.00, 265.00, 'Cases', 0),
(39, 5, 10, NULL, 1500.00, 150.00, 'Cases', 0),
(39, 8, 5, NULL, 1910.00, 382.00, 'Cases', 0),
(40, 1, 5, NULL, 1250.00, 250.00, 'Cases', 0),
(40, 6, 10, NULL, 550.00, 55.00, 'Cases', 0),
(42, 1, 10, NULL, 3500.00, 350.00, 'Cases', 0),
(42, 5, 10, NULL, 1600.00, 160.00, 'Cases', 0),
(43, 5, 5, NULL, 150.00, 30.00, 'Cases', 4),
(43, 7, 15, NULL, 3750.00, 250.00, 'Cases', 3),
(44, 2, 18, NULL, 936.00, 52.00, 'Cases', 0),
(45, 3, 3, NULL, 1230.00, 410.00, 'Cases', 0),
(46, 3, 2, NULL, 820.00, 410.00, 'Cases', 5),
(47, 3, 10, NULL, 400.00, 40.00, 'Pieces', 0),
(50, 16, 2, NULL, 310.00, 155.00, 'Cases', 0),
(51, 11, 4, NULL, 1460.00, 365.00, 'Cases', 0),
(52, 11, 5, NULL, 1825.00, 365.00, 'Cases', 0),
(54, 2, 1, NULL, 365.00, 365.00, 'Cases', 0),
(54, 16, 15, NULL, 675.00, 45.00, 'Pieces', 0),
(56, 8, 2, NULL, 464.00, 232.00, 'Cases', 0),
(57, 16, 1, NULL, 40.00, 40.00, 'Cases', 5);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_shipment`
--

CREATE TABLE `tbl_shipment` (
  `shipment_ID` int(11) NOT NULL,
  `manager_id` int(9) NOT NULL,
  `shipment_date` date NOT NULL,
  `vehicle_id` tinyint(4) NOT NULL,
  `shipment_total` int(9) DEFAULT NULL,
  `sales_ID` int(11) NOT NULL,
  `shipment_DRNumber` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_shipment`
--

INSERT INTO `tbl_shipment` (`shipment_ID`, `manager_id`, `shipment_date`, `vehicle_id`, `shipment_total`, `sales_ID`, `shipment_DRNumber`) VALUES
(1, 3, '2026-02-23', 1, NULL, 1, NULL),
(2, 1, '2026-02-23', 1, NULL, 1, NULL),
(9, 1, '2026-03-06', 3, NULL, 20, NULL),
(32, 1, '2026-03-11', 1, NULL, 24, NULL),
(33, 1, '2026-03-11', 3, NULL, 30, NULL),
(34, 1, '2026-03-11', 4, NULL, 32, NULL),
(35, 3, '2026-03-11', 4, NULL, 31, NULL),
(36, 5, '2026-03-11', 1, NULL, 36, NULL),
(37, 5, '2026-03-11', 4, NULL, 37, NULL),
(38, 1, '2026-03-12', 3, NULL, 38, NULL),
(39, 3, '2026-03-12', 4, NULL, 40, NULL),
(40, 5, '2026-03-12', 1, NULL, 41, NULL),
(41, 0, '2026-03-12', 5, NULL, 42, NULL),
(42, 0, '2026-03-14', 5, NULL, 44, NULL),
(43, 5, '2026-03-14', 5, NULL, 56, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_shipment_employee_details`
--

CREATE TABLE `tbl_shipment_employee_details` (
  `shipment_ID` int(11) NOT NULL,
  `employee_ID` int(9) NOT NULL,
  `employee_role` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_shipment_employee_details`
--

INSERT INTO `tbl_shipment_employee_details` (`shipment_ID`, `employee_ID`, `employee_role`) VALUES
(1, 3, 'Driver'),
(9, 0, NULL),
(32, 58, NULL),
(33, 58, NULL),
(34, 0, NULL),
(34, 58, NULL),
(35, 0, NULL),
(35, 58, NULL),
(36, 3, NULL),
(36, 58, NULL),
(37, 1, NULL),
(37, 3, NULL),
(37, 25, NULL),
(37, 58, NULL),
(38, 58, NULL),
(38, 999, NULL),
(39, 30, NULL),
(39, 58, NULL),
(40, 58, NULL),
(41, 58, NULL),
(42, 3, NULL),
(42, 30, NULL),
(42, 58, NULL),
(43, 3, NULL),
(43, 30, NULL),
(43, 58, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_shipment_productdetails`
--

CREATE TABLE `tbl_shipment_productdetails` (
  `shipment_ID` int(11) NOT NULL,
  `product_ID` int(11) NOT NULL,
  `product_quantity` int(9) DEFAULT NULL,
  `product_markupPrice` decimal(4,2) DEFAULT NULL,
  `product_subtotal` decimal(9,2) DEFAULT NULL,
  `productLine_ID` int(11) NOT NULL
) ;

--
-- Dumping data for table `tbl_shipment_productdetails`
--

INSERT INTO `tbl_shipment_productdetails` (`shipment_ID`, `product_ID`, `product_quantity`, `product_markupPrice`, `product_subtotal`, `productLine_ID`) VALUES
(1, 1, 100, 0.10, 3500.00, 1),
(1, 1, 20, NULL, NULL, 500),
(1, 2, 100, 0.10, 5000.00, 2),
(1, 2, 100, 0.10, 5000.00, 3),
(1, 5, 50, 2.50, NULL, 5001),
(2, 3, 50, 2.00, NULL, 6001),
(9, 1, 10, NULL, NULL, 1),
(9, 2, 10, NULL, NULL, 2),
(9, 3, 10, NULL, NULL, 3),
(9, 4, 10, NULL, NULL, 4),
(9, 5, 10, NULL, NULL, 5),
(9, 6, 10, NULL, NULL, 6),
(32, 1, 4, NULL, NULL, 1),
(33, 1, 2, NULL, NULL, 1),
(34, 7, 3, NULL, NULL, 7),
(35, 7, 1, NULL, NULL, 7),
(36, 3, 10, NULL, NULL, 3),
(37, 1, 13, NULL, NULL, 1),
(37, 5, 20, NULL, NULL, 5),
(37, 7, 20, NULL, NULL, 7),
(38, 7, 10, NULL, NULL, 7),
(38, 8, 20, NULL, NULL, 8),
(39, 1, 5, NULL, NULL, 1),
(39, 6, 10, NULL, NULL, 6),
(40, 3, 30, NULL, NULL, 3),
(40, 4, 25, NULL, NULL, 4),
(41, 1, 10, NULL, NULL, 1),
(41, 5, 10, NULL, NULL, 5),
(42, 2, 18, NULL, NULL, 2),
(43, 8, 2, NULL, NULL, 8);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_unsold_products`
--

CREATE TABLE `tbl_unsold_products` (
  `shipment_ID` int(11) NOT NULL,
  `manager_id` int(9) DEFAULT NULL,
  `approved_date` date DEFAULT NULL,
  `description_status` varchar(40) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_unsold_products`
--

INSERT INTO `tbl_unsold_products` (`shipment_ID`, `manager_id`, `approved_date`, `description_status`) VALUES
(1, 1, '2026-02-26', 'Returned from Toril Route'),
(2, 1, '2026-02-23', 'Returned from Bajada Route');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_unsold_products_details`
--

CREATE TABLE `tbl_unsold_products_details` (
  `shipment_ID` int(11) NOT NULL,
  `product_id` int(10) NOT NULL,
  `product_quantity` int(9) DEFAULT NULL,
  `product_subtotal` decimal(9,2) DEFAULT NULL
) ;

--
-- Dumping data for table `tbl_unsold_products_details`
--

INSERT INTO `tbl_unsold_products_details` (`shipment_ID`, `product_id`, `product_quantity`, `product_subtotal`) VALUES
(1, 2, 7, 385.00);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_vehicle`
--

CREATE TABLE `tbl_vehicle` (
  `vehicle_ID` tinyint(4) NOT NULL,
  `vehicle_number` varchar(9) DEFAULT NULL,
  `vehicle_model` varchar(45) DEFAULT NULL,
  `vehicle_description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_vehicle`
--

INSERT INTO `tbl_vehicle` (`vehicle_ID`, `vehicle_number`, `vehicle_model`, `vehicle_description`) VALUES
(1, 'D34A', 'Chevrolet Silverado', NULL),
(3, 'AA44', 'Ford F-150', 'pickup truck'),
(4, 'QBC 506', 'Alberta Truck', 'Big Black Pickup Truck'),
(5, 'PRZ 674', 'MITSUBISHI CANTER ', 'WHITE CLOSED VAN');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `tbl_client`
--
ALTER TABLE `tbl_client`
  ADD PRIMARY KEY (`client_ID`),
  ADD KEY `client_contactPersonID` (`client_contactPersonID`);

--
-- Indexes for table `tbl_customer`
--
ALTER TABLE `tbl_customer`
  ADD PRIMARY KEY (`client_contactPersonID`);

--
-- Indexes for table `tbl_damage_during`
--
ALTER TABLE `tbl_damage_during`
  ADD PRIMARY KEY (`damage_ID`),
  ADD KEY `productLine_id` (`productLine_id`),
  ADD KEY `fk_damage_shipment` (`shipment_id`);

--
-- Indexes for table `tbl_damage_withinwarehouse`
--
ALTER TABLE `tbl_damage_withinwarehouse`
  ADD PRIMARY KEY (`damage_ID`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `manager_id` (`manager_id`),
  ADD KEY `employee_id` (`employee_id`);

--
-- Indexes for table `tbl_employee`
--
ALTER TABLE `tbl_employee`
  ADD PRIMARY KEY (`employee_ID`),
  ADD UNIQUE KEY `employee_email` (`employee_email`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `tbl_inventory`
--
ALTER TABLE `tbl_inventory`
  ADD PRIMARY KEY (`inventory_ID`),
  ADD KEY `manager_ID` (`manager_ID`);

--
-- Indexes for table `tbl_inventory_details`
--
ALTER TABLE `tbl_inventory_details`
  ADD PRIMARY KEY (`inventory_ID`),
  ADD KEY `product_ID` (`product_ID`);

--
-- Indexes for table `tbl_manager`
--
ALTER TABLE `tbl_manager`
  ADD PRIMARY KEY (`manager_ID`),
  ADD UNIQUE KEY `employee_ID` (`employee_ID`);

--
-- Indexes for table `tbl_payment_details`
--
ALTER TABLE `tbl_payment_details`
  ADD PRIMARY KEY (`payment_ID`),
  ADD UNIQUE KEY `payment_ORNumber` (`payment_ORNumber`),
  ADD KEY `sales_ID` (`sales_ID`),
  ADD KEY `employee_ID` (`employee_ID`);

--
-- Indexes for table `tbl_product`
--
ALTER TABLE `tbl_product`
  ADD PRIMARY KEY (`product_ID`);

--
-- Indexes for table `tbl_sales`
--
ALTER TABLE `tbl_sales`
  ADD PRIMARY KEY (`sales_ID`),
  ADD KEY `client_ID` (`client_ID`),
  ADD KEY `employee_ID` (`employee_ID`);

--
-- Indexes for table `tbl_sales_details`
--
ALTER TABLE `tbl_sales_details`
  ADD PRIMARY KEY (`sales_ID`,`productLine_ID`),
  ADD KEY `fk_product_line` (`productLine_ID`);

--
-- Indexes for table `tbl_shipment`
--
ALTER TABLE `tbl_shipment`
  ADD PRIMARY KEY (`shipment_ID`),
  ADD UNIQUE KEY `shipment_DRNumber` (`shipment_DRNumber`),
  ADD KEY `vehicle_id` (`vehicle_id`),
  ADD KEY `manager_id` (`manager_id`),
  ADD KEY `fk_shipment_sale` (`sales_ID`);

--
-- Indexes for table `tbl_shipment_employee_details`
--
ALTER TABLE `tbl_shipment_employee_details`
  ADD PRIMARY KEY (`shipment_ID`,`employee_ID`),
  ADD KEY `employee_ID` (`employee_ID`);

--
-- Indexes for table `tbl_shipment_productdetails`
--
ALTER TABLE `tbl_shipment_productdetails`
  ADD PRIMARY KEY (`shipment_ID`,`product_ID`,`productLine_ID`),
  ADD KEY `productLine_ID` (`productLine_ID`),
  ADD KEY `product_ID` (`product_ID`);

--
-- Indexes for table `tbl_unsold_products`
--
ALTER TABLE `tbl_unsold_products`
  ADD PRIMARY KEY (`shipment_ID`),
  ADD UNIQUE KEY `shipment_ID` (`shipment_ID`),
  ADD KEY `fk_unsold_manager` (`manager_id`);

--
-- Indexes for table `tbl_unsold_products_details`
--
ALTER TABLE `tbl_unsold_products_details`
  ADD PRIMARY KEY (`shipment_ID`,`product_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `tbl_vehicle`
--
ALTER TABLE `tbl_vehicle`
  ADD PRIMARY KEY (`vehicle_ID`),
  ADD UNIQUE KEY `vehicle_number` (`vehicle_number`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `tbl_client`
--
ALTER TABLE `tbl_client`
  MODIFY `client_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `tbl_customer`
--
ALTER TABLE `tbl_customer`
  MODIFY `client_contactPersonID` int(9) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `tbl_damage_during`
--
ALTER TABLE `tbl_damage_during`
  MODIFY `damage_ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_damage_withinwarehouse`
--
ALTER TABLE `tbl_damage_withinwarehouse`
  MODIFY `damage_ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_inventory`
--
ALTER TABLE `tbl_inventory`
  MODIFY `inventory_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `tbl_payment_details`
--
ALTER TABLE `tbl_payment_details`
  MODIFY `payment_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=71;

--
-- AUTO_INCREMENT for table `tbl_product`
--
ALTER TABLE `tbl_product`
  MODIFY `product_ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_sales`
--
ALTER TABLE `tbl_sales`
  MODIFY `sales_ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_shipment`
--
ALTER TABLE `tbl_shipment`
  MODIFY `shipment_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `tbl_client`
--
ALTER TABLE `tbl_client`
  ADD CONSTRAINT `tbl_client_ibfk_1` FOREIGN KEY (`client_contactPersonID`) REFERENCES `tbl_customer` (`client_contactPersonID`);

--
-- Constraints for table `tbl_damage_during`
--
ALTER TABLE `tbl_damage_during`
  ADD CONSTRAINT `fk_damage_shipment` FOREIGN KEY (`shipment_id`) REFERENCES `tbl_shipment` (`shipment_ID`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_damage_during_ibfk_1` FOREIGN KEY (`productLine_id`) REFERENCES `tbl_shipment_productdetails` (`productLine_ID`);

--
-- Constraints for table `tbl_damage_withinwarehouse`
--
ALTER TABLE `tbl_damage_withinwarehouse`
  ADD CONSTRAINT `tbl_damage_withinwarehouse_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `tbl_product` (`product_ID`),
  ADD CONSTRAINT `tbl_damage_withinwarehouse_ibfk_2` FOREIGN KEY (`manager_id`) REFERENCES `tbl_manager` (`manager_ID`),
  ADD CONSTRAINT `tbl_damage_withinwarehouse_ibfk_3` FOREIGN KEY (`employee_id`) REFERENCES `tbl_employee` (`employee_ID`);

--
-- Constraints for table `tbl_inventory`
--
ALTER TABLE `tbl_inventory`
  ADD CONSTRAINT `tbl_inventory_ibfk_1` FOREIGN KEY (`manager_ID`) REFERENCES `tbl_manager` (`manager_ID`);

--
-- Constraints for table `tbl_inventory_details`
--
ALTER TABLE `tbl_inventory_details`
  ADD CONSTRAINT `tbl_inventory_details_ibfk_1` FOREIGN KEY (`product_ID`) REFERENCES `tbl_product` (`product_ID`),
  ADD CONSTRAINT `tbl_inventory_details_ibfk_2` FOREIGN KEY (`inventory_ID`) REFERENCES `tbl_inventory` (`inventory_ID`);

--
-- Constraints for table `tbl_manager`
--
ALTER TABLE `tbl_manager`
  ADD CONSTRAINT `tbl_manager_ibfk_1` FOREIGN KEY (`employee_ID`) REFERENCES `tbl_employee` (`employee_ID`);

--
-- Constraints for table `tbl_payment_details`
--
ALTER TABLE `tbl_payment_details`
  ADD CONSTRAINT `tbl_payment_details_ibfk_1` FOREIGN KEY (`sales_ID`) REFERENCES `tbl_sales` (`sales_ID`),
  ADD CONSTRAINT `tbl_payment_details_ibfk_2` FOREIGN KEY (`employee_ID`) REFERENCES `tbl_employee` (`employee_ID`);

--
-- Constraints for table `tbl_sales`
--
ALTER TABLE `tbl_sales`
  ADD CONSTRAINT `tbl_sales_ibfk_1` FOREIGN KEY (`client_ID`) REFERENCES `tbl_client` (`client_ID`),
  ADD CONSTRAINT `tbl_sales_ibfk_2` FOREIGN KEY (`employee_ID`) REFERENCES `tbl_employee` (`employee_ID`);

--
-- Constraints for table `tbl_sales_details`
--
ALTER TABLE `tbl_sales_details`
  ADD CONSTRAINT `tbl_sales_details_ibfk_1` FOREIGN KEY (`sales_ID`) REFERENCES `tbl_sales` (`sales_ID`);

--
-- Constraints for table `tbl_shipment`
--
ALTER TABLE `tbl_shipment`
  ADD CONSTRAINT `fk_shipment_sale` FOREIGN KEY (`sales_ID`) REFERENCES `tbl_sales` (`sales_ID`),
  ADD CONSTRAINT `tbl_shipment_ibfk_1` FOREIGN KEY (`vehicle_id`) REFERENCES `tbl_vehicle` (`vehicle_ID`),
  ADD CONSTRAINT `tbl_shipment_ibfk_2` FOREIGN KEY (`manager_id`) REFERENCES `tbl_manager` (`manager_ID`);

--
-- Constraints for table `tbl_shipment_employee_details`
--
ALTER TABLE `tbl_shipment_employee_details`
  ADD CONSTRAINT `tbl_shipment_employee_details_ibfk_1` FOREIGN KEY (`shipment_ID`) REFERENCES `tbl_shipment` (`shipment_ID`),
  ADD CONSTRAINT `tbl_shipment_employee_details_ibfk_2` FOREIGN KEY (`employee_ID`) REFERENCES `tbl_employee` (`employee_ID`);

--
-- Constraints for table `tbl_shipment_productdetails`
--
ALTER TABLE `tbl_shipment_productdetails`
  ADD CONSTRAINT `tbl_shipment_productdetails_ibfk_1` FOREIGN KEY (`shipment_ID`) REFERENCES `tbl_shipment` (`shipment_ID`),
  ADD CONSTRAINT `tbl_shipment_productdetails_ibfk_2` FOREIGN KEY (`product_ID`) REFERENCES `tbl_product` (`product_ID`);

--
-- Constraints for table `tbl_unsold_products`
--
ALTER TABLE `tbl_unsold_products`
  ADD CONSTRAINT `fk_unsold_manager` FOREIGN KEY (`manager_id`) REFERENCES `tbl_manager` (`manager_ID`),
  ADD CONSTRAINT `tbl_unsold_products_ibfk_1` FOREIGN KEY (`shipment_ID`) REFERENCES `tbl_shipment_productdetails` (`shipment_ID`);

--
-- Constraints for table `tbl_unsold_products_details`
--
ALTER TABLE `tbl_unsold_products_details`
  ADD CONSTRAINT `tbl_unsold_products_details_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `tbl_product` (`product_ID`),
  ADD CONSTRAINT `tbl_unsold_products_details_ibfk_2` FOREIGN KEY (`shipment_ID`) REFERENCES `tbl_unsold_products` (`shipment_ID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
