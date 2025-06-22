# Gorexplorer AutoScan

Welcome to the **Gorexplorer AutoScan**, a web application built with Node.js to provide real-time monitoring and visualization of the **GORCHAIN** blockchain network. This project fetches and displays critical metrics such as network health, transaction details, economic data, validator status, and more, with interactive charts for deeper insights.

🟢 **Live Dashboard**:  
- [https://data.gorexplorer.net](https://data.gorexplorer.net)

---

## Table of Contents
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## Features

- **Real-Time Data Fetching and Display**  
  Continuously updates key metrics directly from the GORCHAIN network.

- **Responsive Design**  
  Fully optimized for both desktop and mobile viewing using a clean, grid-based layout.

- **Interactive Charts**  
  Time-series visualizations for TPS, slot, and block height using Chart.js.

- **Comprehensive Metrics**
  - **Network**:
    - Health
    - Slot
    - Block height
    - TPS (Transactions Per Second)
    - Epoch number and progress
    - Current slot leader
    - Cluster version
    - Epoch progress bar
  - **Economics**:
    - Total supply
    - Circulating supply
    - Inflation rate
    - Minimum rent exemption
  - **Validators**:
    - Current validators
    - Delinquent validators
    - Active nodes
    - Vote accounts
    - Leader schedule
  - **Transactions**:
    - Total transaction count
    - Base fee
    - Prioritization fee
    - Sample transaction data (signature, status, fee, etc.)
  - **Snapshots & Blocks**:
    - Highest snapshot slot
    - Recent block slot
    - Block transactions
    - Block rewards

- **Custom Domain Support**  
  The app is deployed via Render and secured over HTTPS using a custom domain.

- **Feather Icons**  
  Lightweight, customizable icons for an elegant and responsive UI.

---

## Installation

To run Gorexplorer AutoScan locally on your machine:

### 1. Clone the repository
```bash
git clone https://github.com/GORexplorer/gorautoscan.git
cd gorautoscan

2. Install dependencies
Ensure you have Node.js v22.16.0 or later installed.
Then run:

bash
Copy
Edit
npm install
3. Start the development server
bash
Copy
Edit
npm run dev
Open your browser and go to:
http://localhost:3000


Usage
Open the dashboard in your web browser.

Monitor GORCHAIN network metrics in real-time.

Use the charts and grid layouts to analyze performance, transaction trends, and validator behavior.

All data updates automatically at regular intervals.

Deployment

This application is live at:

https://data.gorexplorer.net

To deploy your own version via Render:

Push this project to your GitHub repository.

Go to https://render.com and create a new Web Service.

Connect your GitHub repository.

Set the following commands:

Build Command:

bash
Copy
Edit
npm install
Start Command:

bash
Copy
Edit
npm run start
Set the environment to Node and choose your region.

Deploy! Your app will be live with HTTPS support.


Contact

📫 For support, questions, or partnerships, contact us:

🌐 Website: https://gorexplorer.net

🐦 Twitter: @GORexplorer
