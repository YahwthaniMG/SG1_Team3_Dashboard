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
        
        // Limpiar el contenedor
        container.innerHTML = "";
        
        // Crear el SVG
        const svg = d3.select(container)
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", "0 0 700 400")
            .attr("preserveAspectRatio", "xMidYMid meet");
            
        // Guardar referencia al gráfico
        this.charts.productionTimeChart = {
            svg: svg,
            containerId: containerId
        };
        
        // Dibujar el gráfico inicial
        this.updateProductionTimeChart();
    }
    
    createFixingTimeChart(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Limpiar el contenedor
        container.innerHTML = "";
        
        // Crear el SVG
        const svg = d3.select(container)
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", "0 0 700 400")
            .attr("preserveAspectRatio", "xMidYMid meet");
            
        // Guardar referencia al gráfico
        this.charts.fixingTimeChart = {
            svg: svg,
            containerId: containerId
        };
        
        // Dibujar el gráfico inicial
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
        
        // Obtener datos filtrados para el período actual
        const data = this.getCurrentPeriodData();
        
        // Comprobar si hay datos
        if (!data || data.length === 0) {
            svg.append("text")
                .attr("x", 350)
                .attr("y", 200)
                .attr("text-anchor", "middle")
                .text("No hay datos disponibles para este período");
            return;
        }
        
        // Extraer tiempos de producción
        const timeData = data.map(run => ({
            run: run.run,
            productionTime: run.metrics['Production Time'] || 0
        }));
        
        // Configurar dimensiones y márgenes
        const margin = {top: 40, right: 30, bottom: 60, left: 60};
        const width = 700 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;
        
        // Crear el contenedor principal
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        // Definir escalas
        const x = d3.scaleBand()
            .domain(timeData.map(d => d.run))
            .range([0, width])
            .padding(0.2);
            
        const y = d3.scaleLinear()
            .domain([d3.min(timeData, d => d.productionTime) * 0.9, d3.max(timeData, d => d.productionTime) * 1.1])
            .range([height, 0]);
        
        // Agregar ejes
        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");
            
        g.append("g")
            .call(d3.axisLeft(y));
        
        // Definir la línea
        const line = d3.line()
            .x(d => x(d.run) + x.bandwidth() / 2)
            .y(d => y(d.productionTime))
            .curve(d3.curveMonotoneX);
        
        // Dibujar la línea
        g.append("path")
            .datum(timeData)
            .attr("fill", "none")
            .attr("stroke", "#007bff")
            .attr("stroke-width", 3)
            .attr("d", line);
        
        // Dibujar puntos
        g.selectAll(".dot")
            .data(timeData)
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr("cx", d => x(d.run) + x.bandwidth() / 2)
            .attr("cy", d => y(d.productionTime))
            .attr("r", 5)
            .attr("fill", "#007bff");
        
        // Agregar título
        svg.append("text")
            .attr("x", width / 2 + margin.left)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("Tiempo de Producción por Día");
            
        // Agregar título del eje Y
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -(height / 2) - margin.top)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text("Tiempo de Producción (unidades)");
        
        // Agregar línea promedio
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
            .text(`Promedio: ${avgProductionTime.toFixed(2)}`);
    }
    
    updateFixingTimeChart() {
        if (!this.charts.fixingTimeChart) return;
        
        const svg = this.charts.fixingTimeChart.svg;
        svg.selectAll("*").remove();
        
        // Obtener datos filtrados para el período actual
        const data = this.getCurrentPeriodData();
        
        // Comprobar si hay datos
        if (!data || data.length === 0) {
            svg.append("text")
                .attr("x", 350)
                .attr("y", 200)
                .attr("text-anchor", "middle")
                .text("No hay datos disponibles para este período");
            return;
        }
        
        // Calcular tiempos de reparación promedio por estación
        const stationData = [];
        for (let i = 1; i <= 6; i++) {
            const fixingTimes = data.map(run => {
                // Para este gráfico, multiplicamos el tiempo de inactividad por la tasa de fallos
                // para obtener una visualización del impacto total
                const downtime = run.metrics[`Station ${i} Downtime`] || 0;
                return downtime;
            });
            
            const avgFixingTime = fixingTimes.reduce((sum, time) => sum + time, 0) / fixingTimes.length;
            
            stationData.push({
                station: `Estación ${i}`,
                fixingTime: avgFixingTime
            });
        }
        
        // Configurar dimensiones y márgenes
        const margin = {top: 40, right: 30, bottom: 60, left: 60};
        const width = 700 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;
        
        // Crear el contenedor principal
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        // Definir escalas
        const x = d3.scaleBand()
            .domain(stationData.map(d => d.station))
            .range([0, width])
            .padding(0.2);
            
        const y = d3.scaleLinear()
            .domain([0, d3.max(stationData, d => d.fixingTime) * 1.1])
            .range([height, 0]);
        
        // Agregar ejes
        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));
            
        g.append("g")
            .call(d3.axisLeft(y));
        
        // Crear gradiente para barras
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
        
        // Dibujar barras
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
        
        // Agregar etiquetas
        g.selectAll(".label")
            .data(stationData)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => x(d.station) + x.bandwidth() / 2)
            .attr("y", d => y(d.fixingTime) - 5)
            .attr("text-anchor", "middle")
            .text(d => d.fixingTime.toFixed(1));
        
        // Agregar título
        svg.append("text")
            .attr("x", width / 2 + margin.left)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("Tiempo de Reparación por Estación");
            
        // Agregar título del eje Y
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -(height / 2) - margin.top)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text("Tiempo de Reparación (unidades)");
    }
    
    getCurrentPeriodData() {
        // Obtener los datos según el período y fecha seleccionados
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