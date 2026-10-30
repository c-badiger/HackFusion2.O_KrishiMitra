# Krishi Mitra - MySQL Database Setup Guide

## Prerequisites
* MySQL Server 8.0 running on localhost:3306
* MySQL command-line client or MySQL Workbench

## Setup Steps

### 1. Create Schema and Tables
Run the schema file using the MySQL CLI:
```powershell
mysql -u root -p < database/schema.sql
```

### 2. Seed Verified Schemes and Rules
Seed the verified Karnataka and Central agricultural welfare schemes:
```powershell
mysql -u root -p krishi_mitra_db < database/seed_schemes.sql
```

### 3. Verify Database
```sql
USE krishi_mitra_db;
SHOW TABLES;
SELECT id, name_kn, department_kn FROM government_schemes;
```
