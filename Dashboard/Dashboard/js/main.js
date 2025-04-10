// main.js

// Global variables for simulation data and charts
let productionCharts;
let stationCharts;
let timeCharts;

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize UI elements
    initUI();
    
    // Load initial data
    await loadSimulationResults();
    
    // Initialize visualizations
    initCharts();
    
    // Set up optimization scenarios
    setupOptimizationScenario();
});

function initUI() {
    // Set up date controls
    setupDateControls();
    
    // Update optimization controls
    updateOptimizationControls();

    // Set up simulation button
    document.getElementById('runSimulation').addEventListener('click', async () => {
        try {
            // Show loading indicator
            const button = document.getElementById('runSimulation');
            const originalText = button.textContent;
            button.disabled = true;
            button.textContent = 'Running...';
            
            // Show simulation status
            const simulationStatus = document.getElementById('simulationStatus');
            if (simulationStatus) {
                simulationStatus.innerHTML = `
                    <div class="alert alert-info">
                        <div class="d-flex align-items-center">
                            <div class="spinner-border spinner-border-sm mr-2" role="status">
                                <span class="sr-only">Running...</span>
                            </div>
                            <div>Running simulation...</div>
                        </div>
                    </div>
                `;
            }
            
            console.log("Starting simulation...");
            
            // Call server endpoint to run simulation
            const response = await fetch('http://localhost:5000/run-simulation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Show output in browser console
                console.log("Simulation result:");
                console.log(data.output);
                
                if (simulationStatus) {
                    simulationStatus.innerHTML = `
                        <div class="alert alert-success">
                            <strong>Simulation completed successfully.</strong>
                        </div>
                    `;
                }
                
                // Reload data and update charts
                await loadSimulationResults();
                updateAllCharts();
                
                console.log("Visualizations updated with new data");
            } else {
                console.error("Error running simulation:", data.error);
                
                if (simulationStatus) {
                    simulationStatus.innerHTML = `
                        <div class="alert alert-danger">
                            <strong>Error running simulation.</strong>
                            <p>${data.error}</p>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('Error:', error);
            
            const simulationStatus = document.getElementById('simulationStatus');
            if (simulationStatus) {
                simulationStatus.innerHTML = `
                    <div class="alert alert-danger">
                        <strong>Connection error:</strong>
                        <p>${error.message}</p>
                    </div>
                `;
            }
        } finally {
            // Restore button
            const originalText = "Run Simulation"; 
            const button = document.getElementById('runSimulation');
            button.disabled = false;
            button.textContent = originalText;
        }
    });
}

function setupDateControls() {
    // Initialize calendar visualizer
    updateDateVisualizer();
    
    // Event for period change
    document.getElementById('timeFilter').addEventListener('change', (e) => {
        currentPeriod = e.target.value;
        validateDateRange();
        updateDateRangeInfo();
        updateDateVisualizer();
        updateAllCharts();
    });
    
    // Event for start date change
    document.getElementById('startDate').addEventListener('change', (e) => {
        currentStartDate = parseInt(e.target.value);
        validateDateRange();
        updateDateRangeInfo();
        updateDateVisualizer();
        updateAllCharts();
    });
    
    // Navigation buttons
    document.getElementById('prevDate').addEventListener('click', () => {
        let step = getPeriodLength();
        currentStartDate = Math.max(1, currentStartDate - step);
        document.getElementById('startDate').value = currentStartDate;
        validateDateRange();
        updateDateRangeInfo();
        updateDateVisualizer();
        updateAllCharts();
    });
    
    document.getElementById('nextDate').addEventListener('click', () => {
        let step = getPeriodLength();
        let maxStart = MAX_RUN - getPeriodLength() + 1;
        currentStartDate = Math.min(maxStart, currentStartDate + step);
        document.getElementById('startDate').value = currentStartDate;
        validateDateRange();
        updateDateRangeInfo();
        updateDateVisualizer();
        updateAllCharts();
    });
    
    // Initialize date range info
    updateDateRangeInfo();
}

async function loadSimulationResults() {
    try {
        console.log("Loading simulation results...");
        
        const response = await fetch('http://localhost:5000/get-simulation-results');
        
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Store data for use in visualizations
            window.simulationData = data;
            console.log("Data loaded successfully");
            return data;
        } else {
            console.error("Error loading data:", data.error);
            
            // Generate test data in case of error
            window.simulationData = generateTestData();
            return window.simulationData;
        }
    } catch (error) {
        console.error("Error loading results:", error);
        
        // Generate test data in case of error
        window.simulationData = generateTestData();
        return window.simulationData;
    }
}

function generateTestData() {
    // Test data for development when unable to connect to server
    return {
        success: true,
        runs: Array.from({ length: 100 }, (_, i) => {
            return {
                run: i + 1,
                metrics: {
                    'Total Production': 160 + Math.floor(Math.random() * 20),
                    'Faulty Products': 5 + Math.floor(Math.random() * 8),
                    'Faulty Rate': 0.03 + Math.random() * 0.04,
                    'Station 1 Occupancy Rate': 0.13 + Math.random() * 0.02,
                    'Station 2 Occupancy Rate': 0.13 + Math.random() * 0.02,
                    'Station 3 Occupancy Rate': 0.13 + Math.random() * 0.02,
                    'Station 4 Occupancy Rate': 0.13 + Math.random() * 0.02,
                    'Station 5 Occupancy Rate': 0.13 + Math.random() * 0.02,
                    'Station 6 Occupancy Rate': 0.13 + Math.random() * 0.02,
                    'Station 1 Wait Time': Math.random() * 0.5,
                    'Station 2 Wait Time': Math.random() * 0.5,
                    'Station 3 Wait Time': Math.random() * 0.5,
                    'Station 4 Wait Time': Math.random() * 0.5,
                    'Station 5 Wait Time': Math.random() * 0.5,
                    'Station 6 Wait Time': Math.random() * 0.5,
                    'Station 1 Downtime': 1 + Math.random() * 2,
                    'Station 2 Downtime': 0.5 + Math.random() * 1.5,
                    'Station 3 Downtime': 4 + Math.random() * 3,
                    'Station 4 Downtime': 12 + Math.random() * 5,
                    'Station 5 Downtime': 6 + Math.random() * 3,
                    'Station 6 Downtime': 4 + Math.random() * 2,
                    'Production Time': 23 + Math.random() * 3,
                    'Fixing Time': 2.5 + Math.random() * 1,
                    'Supplier Occupancy': 0.01 + Math.random() * 0.005
                }
            };
        })
    };
}

function initCharts() {
    console.log("Initializing charts...");
    
    if (!window.simulationData) {
        console.warn("No data available for charts");
        return;
    }
    
    // Create chart instances
    productionCharts = new ProductionCharts();
    stationCharts = new StationCharts();
    timeCharts = new TimeCharts();
    
    // Initialize all charts
    productionCharts.createCharts();
    stationCharts.createCharts();
    timeCharts.createCharts();
    
    console.log("Charts initialized successfully");
}

function updateAllCharts() {
    console.log(`Updating all charts with period: ${currentPeriod}, starting from day: ${currentStartDate}`);
    
    if (productionCharts) {
        productionCharts.updateCharts();
    }
    
    if (stationCharts) {
        stationCharts.updateCharts();
    }
    
    if (timeCharts) {
        timeCharts.updateCharts();
    }
    
    // Update optimization controls
    updateOptimizationControls();
    
    console.log("Visualizations updated successfully");
}