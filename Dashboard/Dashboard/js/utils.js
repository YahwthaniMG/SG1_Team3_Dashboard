// Global variables for date control
let currentPeriod = 'day';
let currentStartDate = 1;
const MAX_RUN = 100; // Total available runs/days

// Function to get the length of the selected period
function getPeriodLength() {
    switch (currentPeriod) {
        case 'day': return 1;
        case 'week': return 7;
        case 'month': return 30;
        case 'quarter': return 90;
        default: return 1;
    }
}

// Function to format numbers
function formatNumber(number, decimals = 2) {
    return number.toFixed(decimals);
}

// Function to format percentages
function formatPercent(number) {
    return (number * 100).toFixed(2) + "%";
}

// Function to validate the selected date range
function validateDateRange() {
    const periodLength = getPeriodLength();
    const maxStartDate = MAX_RUN - periodLength + 1;
    
    if (currentStartDate > maxStartDate) {
        currentStartDate = maxStartDate;
        const startDateElement = document.getElementById('startDate');
        if (startDateElement) {
            startDateElement.value = currentStartDate;
        }
    }
    
    // Update maximum allowed based on period
    const startDateElement = document.getElementById('startDate');
    if (startDateElement) {
        startDateElement.max = maxStartDate;
    }
}

// Function to update date range information
function updateDateRangeInfo() {
    const endDate = currentStartDate + getPeriodLength() - 1;
    let rangeText = '';
    
    switch (currentPeriod) {
        case 'day':
            rangeText = `Showing data for day ${currentStartDate}`;
            break;
        case 'week':
            rangeText = `Showing weekly data: days ${currentStartDate} - ${endDate}`;
            break;
        case 'month':
            rangeText = `Showing monthly data: days ${currentStartDate} - ${endDate}`;
            break;
        case 'quarter':
            rangeText = `Showing quarterly data: days ${currentStartDate} - ${endDate}`;
            break;
    }
    
    const dateRangeInfoElement = document.getElementById('dateRangeInfo');
    if (dateRangeInfoElement) {
        dateRangeInfoElement.textContent = rangeText;
    }
}

// Function to update the date visualizer
function updateDateVisualizer() {
    const visualizer = document.getElementById('dateVisualizer');
    if (!visualizer) return;
    
    visualizer.innerHTML = '';
    
    const periodLength = getPeriodLength();
    const endDate = currentStartDate + periodLength - 1;
    
    // Create a grid with 10 cells per row (you can adjust this as preferred)
    const cellsPerRow = 10;
    
    // Create containers for each row
    let currentRow;
    
    for (let i = 1; i <= MAX_RUN; i++) {
        // Create a new row every 10 cells
        if ((i - 1) % cellsPerRow === 0) {
            currentRow = document.createElement('div');
            currentRow.classList.add('date-row');
            currentRow.style.display = 'flex';
            currentRow.style.flexDirection = 'row';
            visualizer.appendChild(currentRow);
        }
        
        const dateCell = document.createElement('div');
        dateCell.classList.add('date-cell');
        
        // Check if it's in the selected range
        if (i >= currentStartDate && i <= endDate) {
            dateCell.classList.add('active');
        }
        
        // Add day number
        dateCell.textContent = i;
        
        // Make days clickable for direct selection
        dateCell.addEventListener('click', () => {
            if (currentPeriod === 'day') {
                currentStartDate = i;
            } else {
                // For other periods, adjust to start on this day
                currentStartDate = i;
                validateDateRange();
            }
            
            const startDateElement = document.getElementById('startDate');
            if (startDateElement) {
                startDateElement.value = currentStartDate;
            }
            
            updateDateRangeInfo();
            updateDateVisualizer();
            updateAllCharts();
        });
        
        currentRow.appendChild(dateCell);
    }
}

// Function to initialize optimization scenario
function setupOptimizationScenario() {
    const station4FailureRate = document.getElementById('station4FailureRate');
    const failureRateValue = document.getElementById('failureRateValue');
    const simulateOptimizationBtn = document.getElementById('simulateOptimization');
    
    if (!station4FailureRate || !failureRateValue || !simulateOptimizationBtn) return;
    
    // Update displayed value when slider changes
    station4FailureRate.addEventListener('input', () => {
        failureRateValue.textContent = `${station4FailureRate.value}%`;
    });
    
    // Simulate optimization when button is clicked
    simulateOptimizationBtn.addEventListener('click', () => {
        const newFailureRate = parseInt(station4FailureRate.value) / 100;
        simulateOptimization(newFailureRate);
    });
}

// Function to simulate optimization
function simulateOptimization(stationId, currentFailureRate, newFailureRate) {
    const optimizationChart = document.getElementById('optimizationChart');
    if (!optimizationChart) return;
    
    // Clear container
    optimizationChart.innerHTML = "";
    
    // Create SVG
    const svg = d3.select(optimizationChart)
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", "0 0 800 400")
        .attr("preserveAspectRatio", "xMidYMid meet");
    
    // Configure dimensions and margins
    const margin = {top: 40, right: 100, bottom: 60, left: 60};
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Create main container
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Simulate production with different failure rates
    const currentData = getCurrentPeriodData();
    if (!currentData || currentData.length === 0) {
        svg.append("text")
            .attr("x", 400)
            .attr("y", 200)
            .attr("text-anchor", "middle")
            .text("No data available for this period");
        return;
    }
    
    // Calculate current averages
    let totalProduction = 0;
    let faultyProducts = 0;
    
    currentData.forEach(run => {
        totalProduction += run.metrics['Total Production'] || 0;
        faultyProducts += run.metrics['Faulty Products'] || 0;
    });
    
    // Estimate selected station's contribution to total failures
    // Get failure rates for all stations
    const failureRates = [0.02, 0.01, 0.05, 0.15, 0.07, 0.06]; // Stations 1-6
    const totalFailureRate = failureRates.reduce((sum, rate) => sum + rate, 0);
    
    // Calculate what percentage of total failures comes from this station
    const stationContribution = currentFailureRate / totalFailureRate;
    const stationFaults = faultyProducts * stationContribution;
    
    // Calculate new failures based on new rate
    const reductionFactor = newFailureRate / currentFailureRate;
    const newStationFaults = stationFaults * reductionFactor;
    const otherFaults = faultyProducts - stationFaults;
    const newTotalFaults = newStationFaults + otherFaults;
    
     // Estimate impact on production (fewer failures = less wasted time = more production)
    // Conversion factor: each avoided failure allows producing 0.5 additional units
    const productivityGain = (stationFaults - newStationFaults) * 0.5;
    const newTotalProduction = totalProduction + productivityGain;

    // Create data for chart
    const comparisonData = [
        {
            scenario: "Current",
            totalProduction: totalProduction,
            faultyProducts: faultyProducts,
            faultyRate: faultyProducts / totalProduction
        },
        {
            scenario: "Optimized",
            totalProduction: newTotalProduction,
            faultyProducts: newTotalFaults,
            faultyRate: newTotalFaults / newTotalProduction
        }
    ];
    
    // Define scales for grouped bar chart
    const x0 = d3.scaleBand()
        .domain(comparisonData.map(d => d.scenario))
        .range([0, width])
        .padding(0.3);
        
    const x1 = d3.scaleBand()
        .domain(['Total Production', 'Faulty Products'])
        .range([0, x0.bandwidth()])
        .padding(0.05);
        
    const y = d3.scaleLinear()
        .domain([0, d3.max(comparisonData, d => d.totalProduction) * 1.1])
        .range([height, 0]);
    
    // Define colors
    const color = d3.scaleOrdinal()
        .domain(['Total Production', 'Faulty Products'])
        .range(['#007bff', '#dc3545']);
    
    // Add axes
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0));
        
    g.append("g")
        .call(d3.axisLeft(y));
    
    // Create groups for each scenario
    const scenarioGroups = g.selectAll(".scenario-group")
        .data(comparisonData)
        .enter()
        .append("g")
        .attr("class", "scenario-group")
        .attr("transform", d => `translate(${x0(d.scenario)},0)`);
    
    // Draw bars for total production
    scenarioGroups.append("rect")
        .attr("x", x1('Total Production'))
        .attr("y", d => y(d.totalProduction))
        .attr("width", x1.bandwidth())
        .attr("height", d => height - y(d.totalProduction))
        .attr("fill", color('Total Production'));
    
    // Draw bars for faulty products
    scenarioGroups.append("rect")
        .attr("x", x1('Faulty Products'))
        .attr("y", d => y(d.faultyProducts))
        .attr("width", x1.bandwidth())
        .attr("height", d => height - y(d.faultyProducts))
        .attr("fill", color('Faulty Products'));
    
    // Add value labels
    scenarioGroups.append("text")
        .attr("x", x1('Total Production') + x1.bandwidth() / 2)
        .attr("y", d => y(d.totalProduction) - 5)
        .attr("text-anchor", "middle")
        .text(d => d.totalProduction.toFixed(0));
        
    scenarioGroups.append("text")
        .attr("x", x1('Faulty Products') + x1.bandwidth() / 2)
        .attr("y", d => y(d.faultyProducts) - 5)
        .attr("text-anchor", "middle")
        .text(d => d.faultyProducts.toFixed(0));
    
    // Add line for failure rate
    // Create secondary Y scale for failure rate
    const y2 = d3.scaleLinear()
        .domain([0, d3.max(comparisonData, d => d.faultyRate) * 1.5])
        .range([height, 0]);
    
    g.append("g")
        .attr("transform", `translate(${width},0)`)
        .call(d3.axisRight(y2).tickFormat(d => (d * 100).toFixed(1) + "%"));
    
    // Draw failure rate line
    const line = d3.line()
        .x(d => x0(d.scenario) + x0.bandwidth() / 2)
        .y(d => y2(d.faultyRate));
        
    g.append("path")
        .datum(comparisonData)
        .attr("fill", "none")
        .attr("stroke", "#ffc107")
        .attr("stroke-width", 3)
        .attr("d", line);
        
    g.selectAll(".rate-dot")
        .data(comparisonData)
        .enter()
        .append("circle")
        .attr("class", "rate-dot")
        .attr("cx", d => x0(d.scenario) + x0.bandwidth() / 2)
        .attr("cy", d => y2(d.faultyRate))
        .attr("r", 5)
        .attr("fill", "#ffc107");
    
    // Add labels for failure rate
    g.selectAll(".rate-label")
        .data(comparisonData)
        .enter()
        .append("text")
        .attr("class", "rate-label")
        .attr("x", d => x0(d.scenario) + x0.bandwidth() / 2)
        .attr("y", d => y2(d.faultyRate) - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "#ffc107")
        .text(d => (d.faultyRate * 100).toFixed(2) + "%");
    
    // Add title
    svg.append("text")
        .attr("x", width / 2 + margin.left)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(`Station ${stationId} Optimization (${getStationName(stationId)}): ${(currentFailureRate * 100).toFixed(0)}% → ${(newFailureRate * 100).toFixed(0)}%`);
    
    // Add legend
    const legend = svg.append("g")
        .attr("transform", `translate(${width + margin.left + 20}, ${margin.top + 10})`);
        
    // Total production
    legend.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", "#007bff");
        
    legend.append("text")
        .attr("x", 20)
        .attr("y", 7.5)
        .attr("dy", "0.35em")
        .style("font-size", "12px")
        .text("Total Production");
        
    // Faulty products
    legend.append("rect")
        .attr("x", 0)
        .attr("y", 25)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", "#dc3545");
        
    legend.append("text")
        .attr("x", 20)
        .attr("y", 32.5)
        .attr("dy", "0.35em")
        .style("font-size", "12px")
        .text("Faulty Products");
        
    // Failure rate
    legend.append("line")
        .attr("x1", 0)
        .attr("y1", 57.5)
        .attr("x2", 15)
        .attr("y2", 57.5)
        .attr("stroke", "#ffc107")
        .attr("stroke-width", 3);
        
    legend.append("text")
        .attr("x", 20)
        .attr("y", 57.5)
        .attr("dy", "0.35em")
        .style("font-size", "12px")
        .text("Failure Rate");
}

// Function to get filtered data for current period
function getCurrentPeriodData() {
    // Get data according to selected period and date
    const startDate = currentStartDate;
    const endDate = currentStartDate + getPeriodLength() - 1;
    
    if (!window.simulationData || !window.simulationData.runs) {
        return [];
    }
    
    return window.simulationData.runs.filter(run => {
        return run.run >= startDate && run.run <= endDate;
    });
}

// Function to update optimization controls
function updateOptimizationControls() {
    const optimizationControls = document.getElementById('optimizationControls');
    if (!optimizationControls) return;
    
    // Get data for current period
    const data = getCurrentPeriodData();
    if (!data || data.length === 0) {
        optimizationControls.innerHTML = '<div class="alert alert-warning">No data available for this period</div>';
        return;
    }
    
    // Calculate average downtime by station
    const stationDowntimes = [];
    // Also store failure rates by station
    const failureRates = [0.02, 0.01, 0.05, 0.15, 0.07, 0.06]; // failure rates for stations 1-6
    
    for (let i = 1; i <= 6; i++) {
        const downtimes = data.map(run => run.metrics[`Station ${i} Downtime`] || 0);
        const avgDowntime = downtimes.reduce((sum, time) => sum + time, 0) / downtimes.length;
        
        stationDowntimes.push({
            stationId: i,
            name: getStationName(i),
            downtime: avgDowntime,
            failureRate: failureRates[i-1]
        });
    }
    
    // Find station with highest downtime
    stationDowntimes.sort((a, b) => b.downtime - a.downtime);
    const worstStation = stationDowntimes[0];
    
    // Generate controls for the most problematic station
    optimizationControls.innerHTML = `
        <div class="form-group">
            <h5>Station ${worstStation.stationId}: ${worstStation.name}</h5>
            <p class="text-muted">Downtime: ${worstStation.downtime.toFixed(1)} units</p>
            <p class="text-muted">Current failure rate: ${(worstStation.failureRate * 100).toFixed(0)}%</p>
            <label for="station${worstStation.stationId}FailureRate">Proposed Failure Rate:</label>
            <input type="range" class="custom-range" 
                   id="station${worstStation.stationId}FailureRate" 
                   min="1" max="${(worstStation.failureRate * 100).toFixed(0)}" 
                   value="${(worstStation.failureRate * 100 / 2).toFixed(0)}">
            <div class="d-flex justify-content-between">
                <span>1%</span>
                <span id="failureRateValue">${(worstStation.failureRate * 100 / 2).toFixed(0)}%</span>
                <span>${(worstStation.failureRate * 100).toFixed(0)}%</span>
            </div>
        </div>
        <div class="mt-4">
            <button id="simulateOptimization" class="btn btn-success btn-block">Simulate Improvements</button>
        </div>
    `;
    
    // Set up events for slider and button
    document.getElementById(`station${worstStation.stationId}FailureRate`).addEventListener('input', (e) => {
        document.getElementById('failureRateValue').textContent = `${e.target.value}%`;
    });
    
    document.getElementById('simulateOptimization').addEventListener('click', () => {
        const newFailureRate = parseInt(document.getElementById(`station${worstStation.stationId}FailureRate`).value) / 100;
        simulateOptimization(worstStation.stationId, worstStation.failureRate, newFailureRate);
    });
}

// Helper function to get station name
function getStationName(stationNumber) {
    const stationNames = [
        "Motherboard", "CPU", "GPU", "Memory", "Chassis", "Display"
    ];
    return stationNames[stationNumber - 1];
}