# SG1_Team3 - Laptop Manufacturing Simulation & Dashboard

## Project Overview

This repository contains a comprehensive manufacturing simulation and interactive dashboard system, developed as part of a simulation and visualization course. The project combines a SimPy-based manufacturing simulation with a D3.js-powered dashboard to analyze production efficiency, identify bottlenecks, and visualize optimization scenarios.

## Table of Contents
- [Installation](#installation)
- [Dependencies](#dependencies)
- [Project Structure](#project-structure)
- [Running the Application](#running-the-application)
- [Simulation Parameters](#simulation-parameters)
- [Dashboard Features](#dashboard-features)
- [Team Members](#team-members)

## Installation

### Prerequisites
- Python 3.13 or higher
- pip package manager
- Modern web browser (Chrome, Firefox, Edge recommended)

### Clone the Repository
```bash
git clone https://github.com/YahwthaniMG/SG1_Team3.git
cd SG1_Team3
```

### Virtual Environment (Recommended)
```bash
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
```

### Install Dependencies
```bash
pip install -r requirements.txt
```

## Dependencies
- **Python Packages**:
  - SimPy: For discrete-event simulation
  - NumPy: For numerical computations
  - Flask: For web server functionality
  - Pandas: For data processing
  - Matplotlib: For image generation
  
- **Frontend Libraries** (included in the project):
  - D3.js: For interactive data visualizations
  - Bootstrap: For responsive layouts and UI components

## Project Structure
```
SG1_Team3/
│
├── app.py                  # Flask server application
|
├── Simulation/             # Python simulation
│   ├── main.py             # Main simulation runner
│   ├── simulation.py       # Core simulation logic
│   ├── metrics.py          # Metrics collection and analysis
│   ├── saveSimulation.py   # Functions to save simulation results
│   ├── requirements.txt    # Python dependencies
│
├── Dashboard/              # Frontend web application
│   ├── index.html          # Main dashboard page
│   ├── css/                # Stylesheets
│   │   ├── styles.css      # Custom styles
│   │   └── bootstrap.min.css # Bootstrap framework
│   └── js/                 # JavaScript files
│       ├── main.js         # Main application script
│       ├── utils.js        # Utility functions
│       ├── dataProcessor.js # Data processing module
│       ├── d3.min.js       # D3.js library
│       └── charts/         # Visualization modules
│           ├── productionCharts.js
│           ├── stationCharts.js
│           └── timeCharts.js
│
└── Results/               # Simulation results storage
    └── single_run_*.csv   # Individual run metrics
```

## Running the Application

### Starting the Server
To run the application, execute the Flask server:

```bash
python app.py
```

The server will start at `http://localhost:5000`. Open this URL in your web browser to access the dashboard.

### Using the Dashboard

1. **View Simulation Results**: When you first open the dashboard, it loads the most recent simulation results.

2. **Filter Data**:
   - Select the period type (Day, Week, Month, Quarter)
   - Choose a starting day to visualize different time ranges
   - Use the calendar view to quickly navigate between days

3. **Run New Simulations**:
   - Click the "Run Simulation" button to execute a new simulation run
   - The dashboard will automatically update with new results

4. **Explore Optimization Scenarios**:
   - Use the slider in the "Scenarios de Optimización" section to explore potential improvements
   - View the projected impact on production metrics

## Simulation Parameters

### Workstation Configuration
- 6 specialized workstations modeling a laptop assembly line
- Initial material capacity: 25 units per station
- 3 resupply devices

### Failure Probabilities
- Station 1 (Motherboard): 2%
- Station 2 (CPU): 1%
- Station 3 (GPU): 5%
- Station 4 (Memory): 15%
- Station 5 (Case): 7%
- Station 6 (Screen): 6%

## Dashboard Features

### Production Overview
- Total production metrics
- Faulty product analysis
- Failure rate trends

### Station Performance
- Station occupancy rates
- Downtime analysis by station
- Comparative performance visualization

### Bottleneck Analysis
- Visual identification of critical bottlenecks
- Process flow visualization
- Automated bottleneck detection

### Optimization Scenarios
- Interactive "what-if" analysis
- Failure rate optimization simulation
- Production impact prediction

### Time Metrics
- Production time analysis
- Fixing time by station
- Time efficiency visualization

## Team Members
- Andrés López Álvarez
- Omar Vidaña Rodríguez
- Yahwthani Morales Gómez
- Hector Manuel Eguiarte Carlos

## Acknowledgments
- Professor Gabriel Castillo
- Simulation & Visualization Course
- SimPy and D3.js communities

---

**Note**: This application combines simulation and data visualization to provide insights into manufacturing processes. The simulation models are computational approximations and would benefit from validation in real-world manufacturing environments.