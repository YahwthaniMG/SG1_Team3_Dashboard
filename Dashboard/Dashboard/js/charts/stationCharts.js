class StationCharts {
    constructor() {
        this.charts = {};
    }
    

    createCharts() {
        this.createOccupancyChart('stationOccupancyChart');
        this.createDowntimeChart('stationDowntimeChart');
        this.createBottleneckVisualization('bottleneckChart');
    }
    
    createOccupancyChart(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Clear previous content
        container.innerHTML = "";
        
        // Create SVG container
        const svg = d3.select(container)
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", "0 0 700 400")
            .attr("preserveAspectRatio", "xMidYMid meet");
            
        // Save reference to the chart
        this.charts.occupancyChart = {
            svg: svg,
            containerId: containerId
        };
        
        // Draw initial chart
        this.updateOccupancyChart();
    }
    
    createDowntimeChart(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Clear the container
        container.innerHTML = "";
        
        // Create SVG container
        const svg = d3.select(container)
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", "0 0 700 400")
            .attr("preserveAspectRatio", "xMidYMid meet");
            
        // Save reference to the chart
        this.charts.downtimeChart = {
            svg: svg,
            containerId: containerId
        };
        
        // Draw initial chart
        this.updateDowntimeChart();
    }
    
    createBottleneckVisualization(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Clear previous content
        container.innerHTML = "";
        
        // Create SVG container
        const svg = d3.select(container)
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", "0 0 800 400")
            .attr("preserveAspectRatio", "xMidYMid meet");
            
        // Save reference to the chart
        this.charts.bottleneckChart = {
            svg: svg,
            containerId: containerId
        };
        
        // Draw initial chart
        this.updateBottleneckVisualization();
    }
    
    updateCharts() {
        this.updateOccupancyChart();
        this.updateDowntimeChart();
        this.updateBottleneckVisualization();
    }
    
    updateOccupancyChart() {
        if (!this.charts.occupancyChart) return;
        
        const svg = this.charts.occupancyChart.svg;
        svg.selectAll("*").remove();
        
        // Get filtered data for the current period
        const data = this.getCurrentPeriodData();
        
        // Check if there is data
        if (!data || data.length === 0) {
            svg.append("text")
                .attr("x", 350)
                .attr("y", 200)
                .attr("text-anchor", "middle")
                .text("No data available for this period");
            return;
        }
        
        // Calculate average occupancy rates by station
        const stationData = [];
        for (let i = 1; i <= 6; i++) {
            const occupancyRates = data.map(run => run.metrics[`Station ${i} Occupancy Rate`] || 0);
            const avgOccupancy = occupancyRates.reduce((sum, rate) => sum + rate, 0) / occupancyRates.length;
            
            stationData.push({
                station: `Station ${i}`,
                stationNumber: i,
                occupancyRate: avgOccupancy
            });
        }
        
        // Configure dimensions and margins
        const margin = { top: 40, right: 30, bottom: 60, left: 70 };
        const width = 700 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;
        
        // Create the main container
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        // Define scales
        const x = d3.scaleBand()
            .domain(stationData.map(d => d.station))
            .range([0, width])
            .padding(0.2);
            
        const y = d3.scaleLinear()
            .domain([0, Math.max(d3.max(stationData, d => d.occupancyRate) * 1.1, 0.2)])
            .range([height, 0]);
        
        // Add axes
        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));
            
        g.append("g")
            .call(d3.axisLeft(y).tickFormat(d => (d * 100).toFixed(0) + "%"));
        
        // Find min and max values for the color scale
        const minOccupancy = d3.min(stationData, d => d.occupancyRate);
        const maxOccupancy = d3.max(stationData, d => d.occupancyRate);
        const avgOccupancy = d3.mean(stationData, d => d.occupancyRate);
        
        // Determine if there is a significant variation in occupancy rates
        const occupancyVariation = maxOccupancy - minOccupancy;
        const significantVariation = occupancyVariation > avgOccupancy * 0.1; // 10% of the average
    
        // Draw bars
        g.selectAll(".bar")
            .data(stationData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.station))
            .attr("y", d => y(d.occupancyRate))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d.occupancyRate))
            .attr("fill", d => {
                // If there is no significant variation, use a base color
                if (!significantVariation) return "#007bff";
                
                // Assign colors based on the relative occupancy rate.
                // If the rate is close to the maximum, it is good (blue
                // If it is low compared to the maximum, it may indicate a problem (red/orange)
                const ratio = (d.occupancyRate - minOccupancy) / (maxOccupancy - minOccupancy);
                
                if (ratio > 0.8) return "#007bff"; // Good - blue
                if (ratio > 0.6) return "#17a2b8"; // Acceptable - cyan
                if (ratio > 0.4) return "#ffc107"; // Caution - yellow
                if (ratio > 0.2) return "#fd7e14"; // Concerning - orange
                return "#dc3545"; // Critical - red
            })
            .attr("opacity", 0.7);
        
        // Add percentage labels
        g.selectAll(".label")
            .data(stationData)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => x(d.station) + x.bandwidth() / 2)
            .attr("y", d => y(d.occupancyRate) - 5)
            .attr("text-anchor", "middle")
            .text(d => (d.occupancyRate * 100).toFixed(1) + "%");
        
        // Add title
        svg.append("text")
            .attr("x", width / 2 + margin.left)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("Occupancy Rate by Station");
            
        // Add Y-axis title
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -(height / 2) - margin.top)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text("Occupancy Rate (%)");
        
        // Add a legend if there is significant variation
        if (significantVariation) {
            const legend = svg.append("g")
                .attr("transform", `translate(${width - 100 + margin.left}, ${margin.top})`);
                
            const legendItems = [
                { color: "#007bff", label: "Excellent" },
                { color: "#17a2b8", label: "Good" },
                { color: "#ffc107", label: "Fair" },
                { color: "#fd7e14", label: "Low" },
                { color: "#dc3545", label: "Critical" }
            ];
            
            legendItems.forEach((item, i) => {
                legend.append("rect")
                    .attr("x", 0)
                    .attr("y", i * 25)
                    .attr("width", 15)
                    .attr("height", 15)
                    .attr("fill", item.color);
                    
                legend.append("text")
                    .attr("x", 20)
                    .attr("y", i * 25 + 7.5)
                    .attr("dy", "0.35em")
                    .style("font-size", "12px")
                    .text(item.label);
            });
        }
    }
    
    updateDowntimeChart() {
        if (!this.charts.downtimeChart) return;
        
        const svg = this.charts.downtimeChart.svg;
        svg.selectAll("*").remove();
        
        // Obtain filtered data for the current period
        const data = this.getCurrentPeriodData();
        
        // Check if there is data
        if (!data || data.length === 0) {
            svg.append("text")
                .attr("x", 350)
                .attr("y", 200)
                .attr("text-anchor", "middle")
                .text("No data available for this period");
            return;
        }
        
        // Calculate average downtime by station
        const stationData = [];
        for (let i = 1; i <= 6; i++) {
            const downtimes = data.map(run => run.metrics[`Station ${i} Downtime`] || 0);
            const avgDowntime = downtimes.reduce((sum, time) => sum + time, 0) / downtimes.length;
            
            stationData.push({
                station: `Station ${i}`,
                stationNumber: i,
                downtime: avgDowntime
            });
        }
        
        // Configure dimensions and margins
        const margin = { top: 40, right: 30, bottom: 60, left: 70 };
        const width = 700 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;
        
        // Create the main container
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        // Define scales
        const x = d3.scaleBand()
            .domain(stationData.map(d => d.station))
            .range([0, width])
            .padding(0.2);
            
        const y = d3.scaleLinear()
            .domain([0, d3.max(stationData, d => d.downtime) * 1.1])
            .range([height, 0]);
        
        // Add axes
        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));
            
        g.append("g")
            .call(d3.axisLeft(y));
        
        // Find the maximum downtime to scale the colors
        const maxDowntime = d3.max(stationData, d => d.downtime);
        
        // Draw bars
        g.selectAll(".bar")
            .data(stationData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.station))
            .attr("y", d => y(d.downtime))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d.downtime))
            .attr("fill", d => {
                // Assign colors based on the proportion of downtime
                const ratio = d.downtime / maxDowntime;
                
                if (ratio >= 0.8) return "#dc3545"; // Critical (red)
                if (ratio >= 0.6) return "#fd7e14"; // High (orange)
                if (ratio >= 0.3) return "#ffc107"; // Medium (yellow)
                if (ratio >= 0.1) return "#6c757d"; // Low (gray)
                return "#28a745"; // Very Low (green)
            })
            .attr("opacity", 0.8);
        
        // Add labels
        g.selectAll(".label")
            .data(stationData)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => x(d.station) + x.bandwidth() / 2)
            .attr("y", d => y(d.downtime) - 5)
            .attr("text-anchor", "middle")
            .text(d => d.downtime.toFixed(1));
        
        // Add title
        svg.append("text")
            .attr("x", width / 2 + margin.left)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("Downtime by Station");
            
        // Add Y-axis title
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -(height / 2) - margin.top)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text("Downtime (units)");
        
        // Add legend
    const legend = svg.append("g")
        .attr("transform", `translate(${width - 100 + margin.left}, ${margin.top})`);
        
    const legendItems = [
        { color: "#dc3545", label: "Critical" },
        { color: "#fd7e14", label: "High" },
        { color: "#ffc107", label: "Medium" },
        { color: "#6c757d", label: "Low" },
        { color: "#28a745", label: "Minimum" }
    ];
    
    legendItems.forEach((item, i) => {
        legend.append("rect")
            .attr("x", 0)
            .attr("y", i * 25)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", item.color);
            
        legend.append("text")
            .attr("x", 20)
            .attr("y", i * 25 + 7.5)
            .attr("dy", "0.35em")
            .style("font-size", "12px")
            .text(item.label);
    });
    }
    
    updateBottleneckVisualization() {
        if (!this.charts.bottleneckChart) return;
        
        const svg = this.charts.bottleneckChart.svg;
        svg.selectAll("*").remove();
        
        // Obtain filtered data for the current period
        const data = this.getCurrentPeriodData();
        
        // Check if there is data
        if (!data || data.length === 0) {
            svg.append("text")
                .attr("x", 400)
                .attr("y", 200)
                .attr("text-anchor", "middle")
                .text("No data available for this period");
            return;
        }
        
        // Configure dimensions and margins
        const margin = { top: 40, right: 30, bottom: 60, left: 70 };
        const width = 800 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;
        
        // Create the main container
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        // Calculate metrics for each station
        const stationData = [];
        let totalDowntime = 0;

        // Also track failure rates by station.
        const failureRates = [0.02, 0.01, 0.05, 0.15, 0.07, 0.06]; // failure rates for stations 1-6
        
        for (let i = 1; i <= 6; i++) {
            const downtimes = data.map(run => run.metrics[`Station ${i} Downtime`] || 0);
            const avgDowntime = downtimes.reduce((sum, time) => sum + time, 0) / downtimes.length;
            totalDowntime += avgDowntime;
            
            stationData.push({
                station: `Station ${i}`,
                stationNumber: i,
                downtime: avgDowntime,
                failureRate: failureRates[i - 1] // failure rate for the station
            });
        }
        
        // Calculate downtime percentage for each station
        stationData.forEach(station => {
            station.percentage = totalDowntime > 0 ? station.downtime / totalDowntime : 0;
        });
        
        // Sort stations by downtime (highest to lowest)
        stationData.sort((a, b) => b.downtime - a.downtime);

        
        // Define X positions for each station
        const xPositions = {
            "Station 1": 0,
            "Station 2": width / 5,
            "Station 3": 2 * width / 5,
            "Station 4": 3 * width / 5,
            "Station 5": 4 * width / 5,
            "Station 6": width
        };
        
        // Determine maximum height for visualization
        const maxNodeHeight = height * 0.8;
        
        // Calculate height for each station based on its downtime
        const maxDowntime = d3.max(stationData, d => d.downtime);
        
        // Assign colors based on the proportion of downtime
        stationData.forEach(station => {
            const downtimeRatio = station.downtime / maxDowntime;
            
            if (downtimeRatio >= 0.8) {
                station.color = "#dc3545"; // Critical (red)
                station.criticality = "Critical";
            } else if (downtimeRatio >= 0.5) {
                station.color = "#fd7e14"; // High (orange)
                station.criticality = "High";
            } else if (downtimeRatio >= 0.25) {
                station.color = "#ffc107"; // Medium (yellow)
                station.criticality = "Medium";
            } else {
                station.color = "#6c757d"; // Normal (gray)
                station.criticality = "Normal";
            }
        });
    
        // Update the "Identified Issues" section with real data
        this.updateBottleneckInsights(stationData);

        // Draw process flow
        g.append("rect")
            .attr("x", 0)
            .attr("y", height / 2 - 10)
            .attr("width", width)
            .attr("height", 20)
            .attr("fill", "#e9ecef");
        
        // Draw nodes for each station
        stationData.forEach((station, i) => {
            const xPos = xPositions[station.station];
            const nodeHeight = Math.max(maxNodeHeight * (station.downtime / maxDowntime), 30);
            
            // Draw node
            g.append("rect")
                .attr("x", xPos - 30)
                .attr("y", height / 2 - nodeHeight / 2)
                .attr("width", 60)
                .attr("height", nodeHeight)
                .attr("fill", station.color)
                .attr("opacity", 0.8)
                .attr("rx", 5)
                .attr("ry", 5);
            
            // Add label for the station
            g.append("text")
                .attr("x", xPos)
                .attr("y", height / 2 + nodeHeight / 2 + 20)
                .attr("text-anchor", "middle")
                .style("font-size", "14px")
                .style("font-weight", station.stationNumber === 4 ? "bold" : "normal")
                .text(station.station);
            
            // Add label for downtime
            g.append("text")
                .attr("x", xPos)
                .attr("y", height / 2)
                .attr("text-anchor", "middle")
                .style("font-size", "12px")
                .style("fill", "white")
                .style("font-weight", "bold")
                .text(station.downtime.toFixed(1));
            
            // Add label for percentage
            g.append("text")
                .attr("x", xPos)
                .attr("y", height / 2 + 15)
                .attr("text-anchor", "middle")
                .style("font-size", "12px")
                .style("fill", "white")
                .text((station.percentage * 100).toFixed(0) + "%");
        });
        
        // Add title
        svg.append("text")
            .attr("x", width / 2 + margin.left)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("Bottleneck Visualization in the Process");
            
        // Add legend
        const legend = svg.append("g")
            .attr("transform", `translate(${width - 200 + margin.left}, ${margin.top})`);
            
        legend.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", "#dc3545");
            
        legend.append("text")
            .attr("x", 20)
            .attr("y", 7.5)
            .attr("dy", "0.35em")
            .style("font-size", "12px")
            .text("Critical");
            
        legend.append("rect")
            .attr("x", 0)
            .attr("y", 25)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", "#fd7e14");
            
        legend.append("text")
            .attr("x", 20)
            .attr("y", 32.5)
            .attr("dy", "0.35em")
            .style("font-size", "12px")
            .text("High");
            
        legend.append("rect")
            .attr("x", 0)
            .attr("y", 50)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", "#ffc107");
            
        legend.append("text")
            .attr("x", 20)
            .attr("y", 57.5)
            .attr("dy", "0.35em")
            .style("font-size", "12px")
            .text("Medium");
            
        legend.append("rect")
            .attr("x", 0)
            .attr("y", 75)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", "#6c757d");
            
        legend.append("text")
            .attr("x", 20)
            .attr("y", 82.5)
            .attr("dy", "0.35em")
            .style("font-size", "12px")
            .text("Normal");
    }

    //Function to update the bottleneck insights section
    updateBottleneckInsights(stationData) {
        const bottleneckInsights = document.getElementById('bottleneckInsights');
        if (!bottleneckInsights) return;
        
        // Sort stations by downtime (descending)
        const sortedByDowntime = [...stationData].sort((a, b) => b.downtime - a.downtime);
        
        // The station with the highest downtime
        const worstStation = sortedByDowntime[0];
        
        // Calculate the total percentage of defective products caused by this station
        // Use the ratio between its failure rate and the total sum of failure rates
        const totalFailureRate = stationData.reduce((sum, station) => sum + station.failureRate, 0);
        const failureContribution = worstStation.failureRate / totalFailureRate * 100;
        
        // Create the HTML text for the insights
        let insightsHTML = `
            <p><strong>Station ${worstStation.stationNumber} (${this.getStationName(worstStation.stationNumber)}):</strong> 
            This station has the highest failure rate (${(worstStation.failureRate * 100).toFixed(0)}%) 
            and the highest downtime (${worstStation.downtime.toFixed(1)} units).</p>
            <p><strong>Impact:</strong> This causes approximately ${failureContribution.toFixed(0)}% 
            of the total faulty products.</p>
        `;
        
        // If there is a second problematic station, mention it as well
        const maxDowntime = d3.max(stationData, d => d.downtime);
        if (sortedByDowntime.length > 1 && sortedByDowntime[1].downtime > maxDowntime * 0.5) {
            const secondWorstStation = sortedByDowntime[1];
            const secondFailureContribution = secondWorstStation.failureRate / totalFailureRate * 100;
            
            insightsHTML += `
                <p><strong>Station ${secondWorstStation.stationNumber} (${this.getStationName(secondWorstStation.stationNumber)}):</strong> 
                Also shows significant issues with a failure rate of ${(secondWorstStation.failureRate * 100).toFixed(0)}% 
                and a downtime of ${secondWorstStation.downtime.toFixed(1)} units (${secondFailureContribution.toFixed(0)}% of defects).</p>
            `;
        }
        
        // Update the content
        bottleneckInsights.innerHTML = insightsHTML;
    }

    // Helper function to get the station name
    getStationName(stationNumber) {
        const stationNames = [
            "Motherboard", "CPU", "GPU", "Memory", "Chassis", "Display"
        ];
        return stationNames[stationNumber - 1];
    }
    getCurrentPeriodData() {
        // Get the data according to the selected period and date
        const period = currentPeriod;
        const startDate = currentStartDate;
        const endDate = currentStartDate + getPeriodLength() - 1;
        
        if (!window.simulationData || !window.simulationData.runs) {
            return [];
        }
        
        return window.simulationData.runs.filter(run => {
            return run.run >= startDate && run.run <= endDate;
        });
    }
}