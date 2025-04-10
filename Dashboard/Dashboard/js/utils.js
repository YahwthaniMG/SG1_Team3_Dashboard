// Variables globales para el control de fechas
let currentPeriod = 'day';
let currentStartDate = 1;
const MAX_RUN = 100; // Total de runs/días disponibles

// Función para obtener la longitud del período seleccionado
function getPeriodLength() {
    switch (currentPeriod) {
        case 'day': return 1;
        case 'week': return 7;
        case 'month': return 30;
        case 'quarter': return 90;
        default: return 1;
    }
}

// Función para formatear números
function formatNumber(number, decimals = 2) {
    return number.toFixed(decimals);
}

// Función para formatear porcentajes
function formatPercent(number) {
    return (number * 100).toFixed(2) + "%";
}

// Función para validar el rango de fechas seleccionado
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
    
    // Actualizar el máximo permitido según el período
    const startDateElement = document.getElementById('startDate');
    if (startDateElement) {
        startDateElement.max = maxStartDate;
    }
}

// Función para actualizar la información del rango de fechas
function updateDateRangeInfo() {
    const endDate = currentStartDate + getPeriodLength() - 1;
    let rangeText = '';
    
    switch (currentPeriod) {
        case 'day':
            rangeText = `Mostrando datos del día ${currentStartDate}`;
            break;
        case 'week':
            rangeText = `Mostrando datos de la semana: días ${currentStartDate} - ${endDate}`;
            break;
        case 'month':
            rangeText = `Mostrando datos del mes: días ${currentStartDate} - ${endDate}`;
            break;
        case 'quarter':
            rangeText = `Mostrando datos del trimestre: días ${currentStartDate} - ${endDate}`;
            break;
    }
    
    const dateRangeInfoElement = document.getElementById('dateRangeInfo');
    if (dateRangeInfoElement) {
        dateRangeInfoElement.textContent = rangeText;
    }
}

// Función para actualizar el visualizador de fechas
function updateDateVisualizer() {
    const visualizer = document.getElementById('dateVisualizer');
    if (!visualizer) return;
    
    visualizer.innerHTML = '';
    
    const periodLength = getPeriodLength();
    const endDate = currentStartDate + periodLength - 1;
    
    // Crear una cuadrícula de 10 celdas por fila (puedes ajustar esto según prefieras)
    const cellsPerRow = 10;
    
    // Crear contenedores para cada fila
    let currentRow;
    
    for (let i = 1; i <= MAX_RUN; i++) {
        // Crear una nueva fila cada 10 celdas
        if ((i - 1) % cellsPerRow === 0) {
            currentRow = document.createElement('div');
            currentRow.classList.add('date-row');
            currentRow.style.display = 'flex';
            currentRow.style.flexDirection = 'row';
            visualizer.appendChild(currentRow);
        }
        
        const dateCell = document.createElement('div');
        dateCell.classList.add('date-cell');
        
        // Verificar si está en el rango seleccionado
        if (i >= currentStartDate && i <= endDate) {
            dateCell.classList.add('active');
        }
        
        // Agregar número del día
        dateCell.textContent = i;
        
        // Hacer los días clickeables para seleccionar directamente
        dateCell.addEventListener('click', () => {
            if (currentPeriod === 'day') {
                currentStartDate = i;
            } else {
                // Para otros períodos, ajustar para que comience en este día
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

// Función para inicializar el escenario de optimización
function setupOptimizationScenario() {
    const station4FailureRate = document.getElementById('station4FailureRate');
    const failureRateValue = document.getElementById('failureRateValue');
    const simulateOptimizationBtn = document.getElementById('simulateOptimization');
    
    if (!station4FailureRate || !failureRateValue || !simulateOptimizationBtn) return;
    
    // Actualizar el valor mostrado cuando se cambia el control deslizante
    station4FailureRate.addEventListener('input', () => {
        failureRateValue.textContent = `${station4FailureRate.value}%`;
    });
    
    // Simular la optimización cuando se hace clic en el botón
    simulateOptimizationBtn.addEventListener('click', () => {
        const newFailureRate = parseInt(station4FailureRate.value) / 100;
        simulateOptimization(newFailureRate);
    });
}

// Función para simular la optimización
function simulateOptimization(stationId, currentFailureRate, newFailureRate) {
    const optimizationChart = document.getElementById('optimizationChart');
    if (!optimizationChart) return;
    
    // Limpiar el contenedor
    optimizationChart.innerHTML = "";
    
    // Crear el SVG
    const svg = d3.select(optimizationChart)
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", "0 0 800 400")
        .attr("preserveAspectRatio", "xMidYMid meet");
    
    // Configurar dimensiones y márgenes
    const margin = {top: 40, right: 100, bottom: 60, left: 60};
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Crear el contenedor principal
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Simular producción con diferentes tasas de fallo
    const currentData = getCurrentPeriodData();
    if (!currentData || currentData.length === 0) {
        svg.append("text")
            .attr("x", 400)
            .attr("y", 200)
            .attr("text-anchor", "middle")
            .text("No hay datos disponibles para este período");
        return;
    }
    
    // Calcular promedios actuales
    let totalProduction = 0;
    let faultyProducts = 0;
    
    currentData.forEach(run => {
        totalProduction += run.metrics['Total Production'] || 0;
        faultyProducts += run.metrics['Faulty Products'] || 0;
    });
    
    // Estimar la contribución de la estación seleccionada a los fallos totales
    // Obtenemos las tasas de fallo para todas las estaciones
    const failureRates = [0.02, 0.01, 0.05, 0.15, 0.07, 0.06]; // Estaciones 1-6
    const totalFailureRate = failureRates.reduce((sum, rate) => sum + rate, 0);
    
    // Calcular qué porcentaje de los fallos totales proviene de esta estación
    const stationContribution = currentFailureRate / totalFailureRate;
    const stationFaults = faultyProducts * stationContribution;
    
    // Calcular nuevos fallos basados en la nueva tasa
    const reductionFactor = newFailureRate / currentFailureRate;
    const newStationFaults = stationFaults * reductionFactor;
    const otherFaults = faultyProducts - stationFaults;
    const newTotalFaults = newStationFaults + otherFaults;
    
     // Estimar impacto en producción (menos fallos = menos tiempo perdido = más producción)
    // Factor de conversión: cada fallo evitado permite producir 0.5 unidades adicionales
    const productivityGain = (stationFaults - newStationFaults) * 0.5;
    const newTotalProduction = totalProduction + productivityGain;

    // Crear datos para el gráfico
    const comparisonData = [
        {
            scenario: "Actual",
            totalProduction: totalProduction,
            faultyProducts: faultyProducts,
            faultyRate: faultyProducts / totalProduction
        },
        {
            scenario: "Optimizado",
            totalProduction: newTotalProduction,
            faultyProducts: newTotalFaults,
            faultyRate: newTotalFaults / newTotalProduction
        }
    ];
    
    // Definir escalas para el gráfico de barras agrupadas
    const x0 = d3.scaleBand()
        .domain(comparisonData.map(d => d.scenario))
        .range([0, width])
        .padding(0.3);
        
    const x1 = d3.scaleBand()
        .domain(['Producción Total', 'Productos Defectuosos'])
        .range([0, x0.bandwidth()])
        .padding(0.05);
        
    const y = d3.scaleLinear()
        .domain([0, d3.max(comparisonData, d => d.totalProduction) * 1.1])
        .range([height, 0]);
    
    // Definir colores
    const color = d3.scaleOrdinal()
        .domain(['Producción Total', 'Productos Defectuosos'])
        .range(['#007bff', '#dc3545']);
    
    // Agregar ejes
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0));
        
    g.append("g")
        .call(d3.axisLeft(y));
    
    // Crear grupos para cada escenario
    const scenarioGroups = g.selectAll(".scenario-group")
        .data(comparisonData)
        .enter()
        .append("g")
        .attr("class", "scenario-group")
        .attr("transform", d => `translate(${x0(d.scenario)},0)`);
    
    // Dibujar barras para producción total
    scenarioGroups.append("rect")
        .attr("x", x1('Producción Total'))
        .attr("y", d => y(d.totalProduction))
        .attr("width", x1.bandwidth())
        .attr("height", d => height - y(d.totalProduction))
        .attr("fill", color('Producción Total'));
    
    // Dibujar barras para productos defectuosos
    scenarioGroups.append("rect")
        .attr("x", x1('Productos Defectuosos'))
        .attr("y", d => y(d.faultyProducts))
        .attr("width", x1.bandwidth())
        .attr("height", d => height - y(d.faultyProducts))
        .attr("fill", color('Productos Defectuosos'));
    
    // Agregar etiquetas con valores
    scenarioGroups.append("text")
        .attr("x", x1('Producción Total') + x1.bandwidth() / 2)
        .attr("y", d => y(d.totalProduction) - 5)
        .attr("text-anchor", "middle")
        .text(d => d.totalProduction.toFixed(0));
        
    scenarioGroups.append("text")
        .attr("x", x1('Productos Defectuosos') + x1.bandwidth() / 2)
        .attr("y", d => y(d.faultyProducts) - 5)
        .attr("text-anchor", "middle")
        .text(d => d.faultyProducts.toFixed(0));
    
    // Agregar línea para tasa de fallos
    // Crear una escala Y secundaria para la tasa de fallos
    const y2 = d3.scaleLinear()
        .domain([0, d3.max(comparisonData, d => d.faultyRate) * 1.5])
        .range([height, 0]);
    
    g.append("g")
        .attr("transform", `translate(${width},0)`)
        .call(d3.axisRight(y2).tickFormat(d => (d * 100).toFixed(1) + "%"));
    
    // Dibujar línea de tasa de fallos
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
    
    // Agregar etiquetas para tasa de fallos
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
    
    // Agregar título
    svg.append("text")
        .attr("x", width / 2 + margin.left)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(`Optimización de Estación ${stationId} (${getStationName(stationId)}): ${(currentFailureRate * 100).toFixed(0)}% → ${(newFailureRate * 100).toFixed(0)}%`);
    
    // Agregar leyenda
    const legend = svg.append("g")
        .attr("transform", `translate(${width + margin.left + 20}, ${margin.top + 10})`);
        
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
        .text("Productos Defectuosos");
        
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

// Función para obtener datos filtrados por el período actual
function getCurrentPeriodData() {
    // Obtener los datos según el período y fecha seleccionados
    const startDate = currentStartDate;
    const endDate = currentStartDate + getPeriodLength() - 1;
    
    if (!window.simulationData || !window.simulationData.runs) {
        return [];
    }
    
    return window.simulationData.runs.filter(run => {
        return run.run >= startDate && run.run <= endDate;
    });
}

// Función para actualizar los controles de optimización
function updateOptimizationControls() {
    const optimizationControls = document.getElementById('optimizationControls');
    if (!optimizationControls) return;
    
    // Obtener los datos del período actual
    const data = getCurrentPeriodData();
    if (!data || data.length === 0) {
        optimizationControls.innerHTML = '<div class="alert alert-warning">No hay datos disponibles para este período</div>';
        return;
    }
    
    // Calcular tiempos de inactividad promedio por estación
    const stationDowntimes = [];
    // También almacenar las tasas de fallo por estación
    const failureRates = [0.02, 0.01, 0.05, 0.15, 0.07, 0.06]; // tasas de fallo de estaciones 1-6
    
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
    
    // Encontrar la estación con mayor tiempo de inactividad
    stationDowntimes.sort((a, b) => b.downtime - a.downtime);
    const worstStation = stationDowntimes[0];
    
    // Generar los controles para la estación más problemática
    optimizationControls.innerHTML = `
        <div class="form-group">
            <h5>Estación ${worstStation.stationId}: ${worstStation.name}</h5>
            <p class="text-muted">Tiempo de inactividad: ${worstStation.downtime.toFixed(1)} unidades</p>
            <p class="text-muted">Tasa de fallos actual: ${(worstStation.failureRate * 100).toFixed(0)}%</p>
            <label for="station${worstStation.stationId}FailureRate">Tasa de Fallos propuesta:</label>
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
            <button id="simulateOptimization" class="btn btn-success btn-block">Simular Mejoras</button>
        </div>
    `;
    
    // Configurar eventos para el control deslizante y el botón
    document.getElementById(`station${worstStation.stationId}FailureRate`).addEventListener('input', (e) => {
        document.getElementById('failureRateValue').textContent = `${e.target.value}%`;
    });
    
    document.getElementById('simulateOptimization').addEventListener('click', () => {
        const newFailureRate = parseInt(document.getElementById(`station${worstStation.stationId}FailureRate`).value) / 100;
        simulateOptimization(worstStation.stationId, worstStation.failureRate, newFailureRate);
    });
}

// Función auxiliar para obtener el nombre de la estación
function getStationName(stationNumber) {
    const stationNames = [
        "Motherboard", "CPU", "GPU", "Memoria", "Carcasa", "Pantalla"
    ];
    return stationNames[stationNumber - 1];
}