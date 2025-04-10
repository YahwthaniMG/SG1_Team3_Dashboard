// productionCharts.js
class ProductionCharts {
    constructor() {
        this.charts = {};
    }
    
    createCharts() {
        this.createProductionOverview('productionOverviewChart');
        this.updateKPIs();
    }
    
    createProductionOverview(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Limpiar el contenedor
        container.innerHTML = "";
        
        // Crear el SVG
        const svg = d3.select(container)
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", "0 0 800 400")
            .attr("preserveAspectRatio", "xMidYMid meet");
            
        // Guardar referencia al gráfico
        this.charts.productionOverview = {
            svg: svg,
            containerId: containerId
        };
        
        // Dibujar el gráfico inicial
        this.updateProductionOverview();
    }
    
    updateCharts() {
        this.updateProductionOverview();
        this.updateKPIs();
    }
    
    updateProductionOverview() {
        if (!this.charts.productionOverview) return;
        
        const svg = this.charts.productionOverview.svg;
        svg.selectAll("*").remove();
        
        // Obtener datos filtrados según el período actual
        const data = this.getCurrentPeriodData();
        
        // Comprobar si hay datos
        if (!data || data.length === 0) {
            svg.append("text")
                .attr("x", 400)
                .attr("y", 200)
                .attr("text-anchor", "middle")
                .text("No hay datos disponibles para este período");
            return;
        }
        
        // Configurar dimensiones y márgenes
        const margin = {top: 40, right: 30, bottom: 60, left: 60};
        const width = 800 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;
        
        // Crear el contenedor principal con los márgenes
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        // Procesar datos
        const productionData = data.map(run => {
            return {
                run: run.run,
                totalProduction: run.metrics['Total Production'] || 0,
                faultyProducts: run.metrics['Faulty Products'] || 0,
                faultyRate: run.metrics['Faulty Rate'] || 0
            };
        });
        
        // Definir escalas
        const x = d3.scaleBand()
            .domain(productionData.map(d => d.run))
            .range([0, width])
            .padding(0.2);
            
        const y = d3.scaleLinear()
            .domain([0, d3.max(productionData, d => d.totalProduction) * 1.1])
            .range([height, 0]);
            
        const y2 = d3.scaleLinear()
            .domain([0, d3.max(productionData, d => d.faultyRate) * 1.5])
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
            
        g.append("g")
            .attr("transform", `translate(${width},0)`)
            .call(d3.axisRight(y2).ticks(5, "%"));
        
        // Dibujar barras para producción total
        g.selectAll(".bar-total")
            .data(productionData)
            .enter()
            .append("rect")
            .attr("class", "bar-total")
            .attr("x", d => x(d.run))
            .attr("y", d => y(d.totalProduction))
            .attr("width", x.bandwidth() * 0.6)
            .attr("height", d => height - y(d.totalProduction))
            .attr("fill", "#007bff");
        
        // Dibujar barras para productos defectuosos
        g.selectAll(".bar-faulty")
            .data(productionData)
            .enter()
            .append("rect")
            .attr("class", "bar-faulty")
            .attr("x", d => x(d.run) + x.bandwidth() * 0.6)
            .attr("y", d => y(d.faultyProducts))
            .attr("width", x.bandwidth() * 0.4)
            .attr("height", d => height - y(d.faultyProducts))
            .attr("fill", "#dc3545");
        
        // Dibujar línea para tasa de fallos
        const line = d3.line()
            .x(d => x(d.run) + x.bandwidth() / 2)
            .y(d => y2(d.faultyRate));
            
        g.append("path")
            .datum(productionData)
            .attr("fill", "none")
            .attr("stroke", "#ffc107")
            .attr("stroke-width", 3)
            .attr("d", line);
            
        // Agregar círculos en los puntos de datos de la línea
        g.selectAll(".dot")
            .data(productionData)
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr("cx", d => x(d.run) + x.bandwidth() / 2)
            .attr("cy", d => y2(d.faultyRate))
            .attr("r", 4)
            .attr("fill", "#ffc107");
        
        // Agregar títulos y leyendas
        svg.append("text")
            .attr("x", width / 2 + margin.left)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("Producción y Fallos por Día");
            
        // Leyenda
        const legend = svg.append("g")
            .attr("transform", `translate(${width - 120 + margin.left}, ${margin.top})`);
            
        // Producción total
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
            .text("Producción Total");
            
        // Productos defectuosos
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
            .text("Defectuosos");
            
        // Tasa de fallos
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
            .text("Tasa de Fallos");
    }
    
    updateKPIs() {
        // Obtener datos para el período actual
        const data = this.getCurrentPeriodData();
        
        if (!data || data.length === 0) {
            document.getElementById('totalProductionKPI').textContent = "0";
            document.getElementById('faultyProductsKPI').textContent = "0";
            document.getElementById('faultyRateKPI').textContent = "0%";
            return;
        }
        
        // Calcular promedios para los KPIs
        let totalProduction = 0;
        let faultyProducts = 0;
        let totalRate = 0;
        
        data.forEach(run => {
            totalProduction += run.metrics['Total Production'] || 0;
            faultyProducts += run.metrics['Faulty Products'] || 0;
            totalRate += run.metrics['Faulty Rate'] || 0;
        });
        
        const avgRate = totalRate / data.length;
        
        // Actualizar KPIs
        document.getElementById('totalProductionKPI').textContent = totalProduction.toFixed(0);
        document.getElementById('faultyProductsKPI').textContent = faultyProducts.toFixed(0);
        document.getElementById('faultyRateKPI').textContent = (avgRate * 100).toFixed(2) + "%";
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