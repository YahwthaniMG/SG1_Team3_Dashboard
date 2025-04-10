// main.js

// Variables globales para instancias de los gráficos
let productionCharts;
let stationCharts;
let timeCharts;

document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar elementos UI
    initUI();
    
    // Cargar datos iniciales
    await loadSimulationResults();
    
    // Inicializar visualizaciones
    initCharts();
    
    // Configurar escenarios de optimización
    setupOptimizationScenario();
});

function initUI() {
    // Configurar controles de fecha
    setupDateControls();
    
    // Actualizar los controles de optimización
    updateOptimizationControls();

    // Configurar el botón de simulación
    document.getElementById('runSimulation').addEventListener('click', async () => {
        try {
            // Mostrar indicador de carga
            const button = document.getElementById('runSimulation');
            const originalText = button.textContent;
            button.disabled = true;
            button.textContent = 'Ejecutando...';
            
            // Mostrar estado de la simulación
            const simulationStatus = document.getElementById('simulationStatus');
            if (simulationStatus) {
                simulationStatus.innerHTML = `
                    <div class="alert alert-info">
                        <div class="d-flex align-items-center">
                            <div class="spinner-border spinner-border-sm mr-2" role="status">
                                <span class="sr-only">Ejecutando...</span>
                            </div>
                            <div>Ejecutando simulación...</div>
                        </div>
                    </div>
                `;
            }
            
            console.log("Iniciando simulación...");
            
            // Llamar al endpoint del servidor para ejecutar la simulación
            const response = await fetch('http://localhost:5000/run-simulation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Mostrar salida en la consola del navegador
                console.log("Resultado de la simulación:");
                console.log(data.output);
                
                if (simulationStatus) {
                    simulationStatus.innerHTML = `
                        <div class="alert alert-success">
                            <strong>Simulación completada exitosamente.</strong>
                        </div>
                    `;
                }
                
                // Recargar los datos y actualizar gráficos
                await loadSimulationResults();
                updateAllCharts();
                
                console.log("Visualizaciones actualizadas con los nuevos datos");
            } else {
                console.error("Error al ejecutar la simulación:", data.error);
                
                if (simulationStatus) {
                    simulationStatus.innerHTML = `
                        <div class="alert alert-danger">
                            <strong>Error al ejecutar la simulación.</strong>
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
                        <strong>Error de conexión:</strong>
                        <p>${error.message}</p>
                    </div>
                `;
            }
        } finally {
            // Restaurar botón
            const originalText = "Ejecutar Simulación"; 
            const button = document.getElementById('runSimulation');
            button.disabled = false;
            button.textContent = originalText;
        }
    });
}

function setupDateControls() {
    // Inicializar visualizador de calendario
    updateDateVisualizer();
    
    // Evento para cambio de período
    document.getElementById('timeFilter').addEventListener('change', (e) => {
        currentPeriod = e.target.value;
        validateDateRange();
        updateDateRangeInfo();
        updateDateVisualizer();
        updateAllCharts();
    });
    
    // Evento para cambio de fecha inicial
    document.getElementById('startDate').addEventListener('change', (e) => {
        currentStartDate = parseInt(e.target.value);
        validateDateRange();
        updateDateRangeInfo();
        updateDateVisualizer();
        updateAllCharts();
    });
    
    // Botones de navegación
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
    
    // Inicializar información de rango de fechas
    updateDateRangeInfo();
}

async function loadSimulationResults() {
    try {
        console.log("Cargando resultados de la simulación...");
        
        const response = await fetch('http://localhost:5000/get-simulation-results');
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Almacenar los datos para usarlos en las visualizaciones
            window.simulationData = data;
            console.log("Datos cargados correctamente");
            return data;
        } else {
            console.error("Error al cargar los datos:", data.error);
            
            // Generar datos de prueba en caso de error
            window.simulationData = generateTestData();
            return window.simulationData;
        }
    } catch (error) {
        console.error("Error al cargar los resultados:", error);
        
        // Generar datos de prueba en caso de error
        window.simulationData = generateTestData();
        return window.simulationData;
    }
}

function generateTestData() {
    // Datos de prueba para desarrollo cuando no se puede conectar al servidor
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
    console.log("Inicializando gráficos...");
    
    if (!window.simulationData) {
        console.warn("No hay datos disponibles para los gráficos");
        return;
    }
    
    // Crear instancias de gráficos
    productionCharts = new ProductionCharts();
    stationCharts = new StationCharts();
    timeCharts = new TimeCharts();
    
    // Inicializar todos los gráficos
    productionCharts.createCharts();
    stationCharts.createCharts();
    timeCharts.createCharts();
    
    console.log("Gráficos inicializados correctamente");
}

function updateAllCharts() {
    console.log(`Actualizando todos los gráficos con período: ${currentPeriod}, desde el día: ${currentStartDate}`);
    
    if (productionCharts) {
        productionCharts.updateCharts();
    }
    
    if (stationCharts) {
        stationCharts.updateCharts();
    }
    
    if (timeCharts) {
        timeCharts.updateCharts();
    }
    
    // Actualizar los controles de optimización
    updateOptimizationControls();
    
    console.log("Visualizaciones actualizadas correctamente");
}