// timeCharts.js
class TimeCharts {
    constructor() {
        this.charts = {};
    }
    
    createCharts() {
        this.createProductionTimeChart('productionTimeChart');
        this.createFixingTimeChart('fixingTimeChart');
    }
    
    createProductionTimeChart(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Clear the container
        container.innerHTML = "";
        
        // Create the SVG
        const svg = d3.select(container)
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", "0 0 700 400")
            .attr("preserveAspectRatio", "xMidYMid meet");
            
        // Save chart reference
        this.charts.productionTimeChart = {
            svg: svg,
            containerId: containerId
        };
        
        // Draw initial chart
        this.updateProductionTimeChart();
    }
    
    createFixingTimeChart(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Clear the container
        container.innerHTML = "";
        
        // Create the SVG
        const svg = d3.select(container)
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", "0 0 700 400")
            .attr("preserveAspectRatio", "xMidYMid meet");
            
        // Save chart reference
        this.charts.fixingTimeChart = {
            svg: svg,
            containerId: containerId
        };
        
        // Draw initial chart
        this.updateFixingTimeChart();
    }
    
    updateCharts() {
        this.updateProductionTimeChart();
        this.updateFixingTimeChart();
    }
    
    updateProductionTimeChart() {
        if (!this.charts.productionTimeChart) return;
        
        const svg = this.charts.productionTimeChart.svg;
        svg.selectAll("*").remove();
        
        // Get filtered data for current period
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
        
        // Extract production times
        const timeData = data.map(run => ({
            run: run.run,
            productionTime: run.metrics['Production Time'] || 0
        }));
        
        // Configure dimensions and margins
        const margin = {top: 40, right: 30, bottom: 60, left: 60};
        const width = 700 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;
        
        // Create main container
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        // Define scales
        const x = d3.scaleBand()
            .domain(timeData.map(d => d.run))
            .range([0, width])
            .padding(0.2);
            
        const y = d3.scaleLinear()
            .domain([d3.min(timeData, d => d.productionTime) * 0.9, d3.max(timeData, d => d.productionTime) * 1.1])
            .range([height, 0]);
        
        // Add axes
        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");
            
        g.append("g")
            .call(d3.axisLeft(y));
        
        // Define the line
        const line = d3.line()
            .x(d => x(d.run) + x.bandwidth() / 2)
            .y(d => y(d.productionTime))
            .curve(d3.curveMonotoneX);
        
        // Draw the line
        g.append("path")
            .datum(timeData)
            .attr("fill", "none")
            .attr("stroke", "#007bff")
            .attr("stroke-width", 3)
            .attr("d", line);
        
        // Draw points
        g.selectAll(".dot")
            .data(timeData)
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr("cx", d => x(d.run) + x.bandwidth() / 2)
            .attr("cy", d => y(d.productionTime))
            .attr("r", 5)
            .attr("fill", "#007bff");
        
        // Add title
        svg.append("text")
            .attr("x", width / 2 + margin.left)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("Production Time by Day");
            
        // Add Y-axis title
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -(height / 2) - margin.top)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text("Production Time (units)");
        
        // Add average line
        const avgProductionTime = d3.mean(timeData, d => d.productionTime);
        
        g.append("line")
            .attr("x1", 0)
            .attr("y1", y(avgProductionTime))
            .attr("x2", width)
            .attr("y2", y(avgProductionTime))
            .attr("stroke", "#dc3545")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "5,5");
            
        g.append("text")
            .attr("x", width - 5)
            .attr("y", y(avgProductionTime) - 5)
            .attr("text-anchor", "end")
            .style("font-size", "12px")
            .style("fill", "#dc3545")
            .text(`Average: ${avgProductionTime.toFixed(2)}`);
    }
    
    updateFixingTimeChart() {
        if (!this.charts.fixingTimeChart) return;
        
        const svg = this.charts.fixingTimeChart.svg;
        svg.selectAll("*").remove();
        
        // Get filtered data for current period
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
        
        // Calculate average repair times by station
        const stationData = [];
        for (let i = 1; i <= 6; i++) {
            const fixingTimes = data.map(run => {
                // For this chart, we multiply downtime by failure rate
                // to get a visualization of total impact
                const downtime = run.metrics[`Station ${i} Downtime`] || 0;
                return downtime;
            });
            
            const avgFixingTime = fixingTimes.reduce((sum, time) => sum + time, 0) / fixingTimes.length;
            
            stationData.push({
                station: `Station ${i}`,
                fixingTime: avgFixingTime
            });
        }
        
        // Configure dimensions and margins
        const margin = {top: 40, right: 30, bottom: 60, left: 60};
        const width = 700 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;
        
        // Create main container
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        // Define scales
        const x = d3.scaleBand()
            .domain(stationData.map(d => d.station))
            .range([0, width])
            .padding(0.2);
            
        const y = d3.scaleLinear()
            .domain([0, d3.max(stationData, d => d.fixingTime) * 1.1])
            .range([height, 0]);
        
        // Add axes
        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));
            
        g.append("g")
            .call(d3.axisLeft(y));
        
        // Create gradient for bars
        const defs = svg.append("defs");
        const gradient = defs.append("linearGradient")
            .attr("id", "fixingTimeGradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%");
            
        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#dc3545");
            
        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#fd7e14");
        
        // Draw bars
        g.selectAll(".bar")
            .data(stationData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.station))
            .attr("y", d => y(d.fixingTime))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d.fixingTime))
            .attr("fill", (d, i) => i === 3 ? "#dc3545" : "url(#fixingTimeGradient)")
            .attr("opacity", 0.8);
        
        // Add labels
        g.selectAll(".label")
            .data(stationData)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => x(d.station) + x.bandwidth() / 2)
            .attr("y", d => y(d.fixingTime) - 5)
            .attr("text-anchor", "middle")
            .text(d => d.fixingTime.toFixed(1));
        
        // Add title
        svg.append("text")
            .attr("x", width / 2 + margin.left)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("Repair Time by Station");
            
        // Add Y-axis title
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -(height / 2) - margin.top)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text("Repair Time (units)");
    }
    
    getCurrentPeriodData() {
        // Get data according to selected period and date
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