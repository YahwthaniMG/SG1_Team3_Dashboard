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
        this.charts.occupancyChart = {
            svg: svg,
            containerId: containerId
        };
        
        // Dibujar el gráfico inicial
        this.updateOccupancyChart();
    }
    
    createDowntimeChart(containerId) {
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
        this.charts.downtimeChart = {
            svg: svg,
            containerId: containerId
        };
        
        // Dibujar el gráfico inicial
        this.updateDowntimeChart();
    }
    
    createBottleneckVisualization(containerId) {
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
        this.charts.bottleneckChart = {
            svg: svg,
            containerId: containerId
        };
        
        // Dibujar el gráfico inicial
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
        
        // Calcular tasas de ocupación promedio por estación
        const stationData = [];
        for (let i = 1; i <= 6; i++) {
            const occupancyRates = data.map(run => run.metrics[`Station ${i} Occupancy Rate`] || 0);
            const avgOccupancy = occupancyRates.reduce((sum, rate) => sum + rate, 0) / occupancyRates.length;
            
            stationData.push({
                station: `Estación ${i}`,
                stationNumber: i,
                occupancyRate: avgOccupancy
            });
        }
        
        // Configurar dimensiones y márgenes
        const margin = { top: 40, right: 30, bottom: 60, left: 70 };
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
            .domain([0, Math.max(d3.max(stationData, d => d.occupancyRate) * 1.1, 0.2)])
            .range([height, 0]);
        
        // Agregar ejes
        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));
            
        g.append("g")
            .call(d3.axisLeft(y).tickFormat(d => (d * 100).toFixed(0) + "%"));
        
        // Encontrar valores min y max para la escala de colores
        const minOccupancy = d3.min(stationData, d => d.occupancyRate);
        const maxOccupancy = d3.max(stationData, d => d.occupancyRate);
        const avgOccupancy = d3.mean(stationData, d => d.occupancyRate);
        
        // Determinar si hay variación significativa en las tasas de ocupación
        const occupancyVariation = maxOccupancy - minOccupancy;
        const significantVariation = occupancyVariation > avgOccupancy * 0.1; // 10% del promedio
    
        // Dibujar barras
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
                // Si no hay variación significativa, usar un color base
                if (!significantVariation) return "#007bff";
                
                // Asignar colores según la tasa de ocupación relativa
                // Si la tasa es cercana al máximo, es bueno (azul)
                // Si es baja comparada con el máximo, podría indicar un problema (rojo/naranja)
                const ratio = (d.occupancyRate - minOccupancy) / (maxOccupancy - minOccupancy);
                
                if (ratio > 0.8) return "#007bff"; // Bueno - azul
                if (ratio > 0.6) return "#17a2b8"; // Aceptable - cyan
                if (ratio > 0.4) return "#ffc107"; // Precaución - amarillo
                if (ratio > 0.2) return "#fd7e14"; // Preocupante - naranja
                return "#dc3545"; // Crítico - rojo
            })
            .attr("opacity", 0.7);
        
        // Agregar etiquetas de porcentaje
        g.selectAll(".label")
            .data(stationData)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => x(d.station) + x.bandwidth() / 2)
            .attr("y", d => y(d.occupancyRate) - 5)
            .attr("text-anchor", "middle")
            .text(d => (d.occupancyRate * 100).toFixed(1) + "%");
        
        // Agregar título
        svg.append("text")
            .attr("x", width / 2 + margin.left)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("Tasa de Ocupación por Estación");
            
        // Agregar título del eje Y
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -(height / 2) - margin.top)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text("Tasa de Ocupación (%)");
        
        // Agregar leyenda si hay variación significativa
        if (significantVariation) {
            const legend = svg.append("g")
                .attr("transform", `translate(${width - 100 + margin.left}, ${margin.top})`);
                
            const legendItems = [
                { color: "#007bff", label: "Excelente" },
                { color: "#17a2b8", label: "Bueno" },
                { color: "#ffc107", label: "Regular" },
                { color: "#fd7e14", label: "Bajo" },
                { color: "#dc3545", label: "Crítico" }
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
        
        // Calcular tiempos de inactividad promedio por estación
        const stationData = [];
        for (let i = 1; i <= 6; i++) {
            const downtimes = data.map(run => run.metrics[`Station ${i} Downtime`] || 0);
            const avgDowntime = downtimes.reduce((sum, time) => sum + time, 0) / downtimes.length;
            
            stationData.push({
                station: `Estación ${i}`,
                stationNumber: i,
                downtime: avgDowntime
            });
        }
        
        // Configurar dimensiones y márgenes
        const margin = { top: 40, right: 30, bottom: 60, left: 70 };
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
            .domain([0, d3.max(stationData, d => d.downtime) * 1.1])
            .range([height, 0]);
        
        // Agregar ejes
        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));
            
        g.append("g")
            .call(d3.axisLeft(y));
        
        // Encontrar el máximo downtime para escalar los colores
        const maxDowntime = d3.max(stationData, d => d.downtime);
        
        // Dibujar barras
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
                // Asignar colores según la proporción del tiempo de inactividad
                const ratio = d.downtime / maxDowntime;
                
                if (ratio >= 0.8) return "#dc3545"; // Crítico (rojo)
                if (ratio >= 0.6) return "#fd7e14"; // Alto (naranja)
                if (ratio >= 0.3) return "#ffc107"; // Medio (amarillo)
                if (ratio >= 0.1) return "#6c757d"; // Bajo (gris)
                return "#28a745"; // Muy bajo (verde)
            })
            .attr("opacity", 0.8);
        
        // Agregar etiquetas
        g.selectAll(".label")
            .data(stationData)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => x(d.station) + x.bandwidth() / 2)
            .attr("y", d => y(d.downtime) - 5)
            .attr("text-anchor", "middle")
            .text(d => d.downtime.toFixed(1));
        
        // Agregar título
        svg.append("text")
            .attr("x", width / 2 + margin.left)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("Tiempo de Inactividad por Estación");
            
        // Agregar título del eje Y
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -(height / 2) - margin.top)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text("Tiempo de Inactividad (unidades)");
        
        // Agregar leyenda
    const legend = svg.append("g")
        .attr("transform", `translate(${width - 100 + margin.left}, ${margin.top})`);
        
    const legendItems = [
        { color: "#dc3545", label: "Crítico" },
        { color: "#fd7e14", label: "Alto" },
        { color: "#ffc107", label: "Medio" },
        { color: "#6c757d", label: "Bajo" },
        { color: "#28a745", label: "Mínimo" }
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
        
        // Obtener datos filtrados para el período actual
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
        const margin = { top: 40, right: 30, bottom: 60, left: 70 };
        const width = 800 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;
        
        // Crear el contenedor principal
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        // Calcular métricas para cada estación
        const stationData = [];
        let totalDowntime = 0;

        // También rastrear las tasas de fallo por estación
        const failureRates = [0.02, 0.01, 0.05, 0.15, 0.07, 0.06]; // tasas de fallo de estaciones 1-6
        
        for (let i = 1; i <= 6; i++) {
            const downtimes = data.map(run => run.metrics[`Station ${i} Downtime`] || 0);
            const avgDowntime = downtimes.reduce((sum, time) => sum + time, 0) / downtimes.length;
            totalDowntime += avgDowntime;
            
            stationData.push({
                station: `Estación ${i}`,
                stationNumber: i,
                downtime: avgDowntime,
                failureRate: failureRates[i - 1] // Tasa de fallo
            });
        }
        
        // Calcular porcentaje de tiempo de inactividad para cada estación
        stationData.forEach(station => {
            station.percentage = totalDowntime > 0 ? station.downtime / totalDowntime : 0;
        });
        
        // Ordenar estaciones por tiempo de inactividad (mayor a menor)
        stationData.sort((a, b) => b.downtime - a.downtime);

        
        // Definir posiciones X para cada estación
        const xPositions = {
            "Estación 1": 0,
            "Estación 2": width / 5,
            "Estación 3": 2 * width / 5,
            "Estación 4": 3 * width / 5,
            "Estación 5": 4 * width / 5,
            "Estación 6": width
        };
        
        // Determinar altura máxima para la visualización
        const maxNodeHeight = height * 0.8;
        
        // Calcular altura para cada estación basada en su tiempo de inactividad
        const maxDowntime = d3.max(stationData, d => d.downtime);
        
        //Asignar colores basados en la proporción de downtime
        stationData.forEach(station => {
            const downtimeRatio = station.downtime / maxDowntime;
            
            if (downtimeRatio >= 0.8) {
                station.color = "#dc3545"; // Crítico (rojo)
                station.criticality = "Crítico";
            } else if (downtimeRatio >= 0.5) {
                station.color = "#fd7e14"; // Alto (naranja)
                station.criticality = "Alto";
            } else if (downtimeRatio >= 0.25) {
                station.color = "#ffc107"; // Medio (amarillo)
                station.criticality = "Medio";
            } else {
                station.color = "#6c757d"; // Normal (gris)
                station.criticality = "Normal";
            }
        });
    
        // Actualizar la sección de "Problemas Identificados" con datos reales
        this.updateBottleneckInsights(stationData);

        // Dibujar flujo del proceso
        g.append("rect")
            .attr("x", 0)
            .attr("y", height / 2 - 10)
            .attr("width", width)
            .attr("height", 20)
            .attr("fill", "#e9ecef");
        
        // Dibujar nodos de estación
        stationData.forEach((station, i) => {
            const xPos = xPositions[station.station];
            const nodeHeight = Math.max(maxNodeHeight * (station.downtime / maxDowntime), 30);
            
            // Dibujar nodo
            g.append("rect")
                .attr("x", xPos - 30)
                .attr("y", height / 2 - nodeHeight / 2)
                .attr("width", 60)
                .attr("height", nodeHeight)
                .attr("fill", station.color)
                .attr("opacity", 0.8)
                .attr("rx", 5)
                .attr("ry", 5);
            
            // Agregar etiqueta de estación
            g.append("text")
                .attr("x", xPos)
                .attr("y", height / 2 + nodeHeight / 2 + 20)
                .attr("text-anchor", "middle")
                .style("font-size", "14px")
                .style("font-weight", station.stationNumber === 4 ? "bold" : "normal")
                .text(station.station);
            
            // Agregar etiqueta de tiempo de inactividad
            g.append("text")
                .attr("x", xPos)
                .attr("y", height / 2)
                .attr("text-anchor", "middle")
                .style("font-size", "12px")
                .style("fill", "white")
                .style("font-weight", "bold")
                .text(station.downtime.toFixed(1));
            
            // Agregar etiqueta de porcentaje
            g.append("text")
                .attr("x", xPos)
                .attr("y", height / 2 + 15)
                .attr("text-anchor", "middle")
                .style("font-size", "12px")
                .style("fill", "white")
                .text((station.percentage * 100).toFixed(0) + "%");
        });
        
        // Agregar título
        svg.append("text")
            .attr("x", width / 2 + margin.left)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("Visualización de Cuellos de Botella en el Proceso");
            
        // Agregar leyenda
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
            .text("Crítico");
            
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
            .text("Alto");
            
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
            .text("Medio");
            
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

    //función para actualizar los insights
    updateBottleneckInsights(stationData) {
        const bottleneckInsights = document.getElementById('bottleneckInsights');
        if (!bottleneckInsights) return;
        
        // Ordenar estaciones por downtime (descendente)
        const sortedByDowntime = [...stationData].sort((a, b) => b.downtime - a.downtime);
        
        // La estación con mayor downtime
        const worstStation = sortedByDowntime[0];
        
        // Calcular el porcentaje total de productos defectuosos causados por esta estación
        // Usamos la proporción entre su tasa de fallo y la suma total de tasas de fallo
        const totalFailureRate = stationData.reduce((sum, station) => sum + station.failureRate, 0);
        const failureContribution = worstStation.failureRate / totalFailureRate * 100;
        
        // Crear el texto HTML para los insights
        let insightsHTML = `
            <p><strong>Estación ${worstStation.stationNumber} (${this.getStationName(worstStation.stationNumber)}):</strong> 
            Esta estación tiene la mayor tasa de fallos (${(worstStation.failureRate * 100).toFixed(0)}%) 
            y el mayor tiempo de inactividad (${worstStation.downtime.toFixed(1)} unidades).</p>
            <p><strong>Impacto:</strong> Esto causa aproximadamente el ${failureContribution.toFixed(0)}% 
            del total de productos defectuosos.</p>
        `;
        
        // Si hay una segunda estación problemática, mencionarla también
        const maxDowntime = d3.max(stationData, d => d.downtime);
        if (sortedByDowntime.length > 1 && sortedByDowntime[1].downtime > maxDowntime * 0.5) {
            const secondWorstStation = sortedByDowntime[1];
            const secondFailureContribution = secondWorstStation.failureRate / totalFailureRate * 100;
            
            insightsHTML += `
                <p><strong>Estación ${secondWorstStation.stationNumber} (${this.getStationName(secondWorstStation.stationNumber)}):</strong> 
                También presenta problemas significativos con una tasa de fallos del ${(secondWorstStation.failureRate * 100).toFixed(0)}% 
                y un tiempo de inactividad de ${secondWorstStation.downtime.toFixed(1)} unidades (${secondFailureContribution.toFixed(0)}% de los defectos).</p>
            `;
        }
        
        // Actualizar el contenido
        bottleneckInsights.innerHTML = insightsHTML;
    }

    // Función auxiliar para obtener el nombre de la estación
    getStationName(stationNumber) {
        const stationNames = [
            "Motherboard", "CPU", "GPU", "Memoria", "Carcasa", "Pantalla"
        ];
        return stationNames[stationNumber - 1];
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