// dataProcessor.js
class DataProcessor {
    constructor() {
        this.simulationData = null;
        this.processedData = {
            production: {},
            stations: {},
            timeMetrics: {}
        };
    }

    async loadData() {
        try {
            const response = await fetch('http://localhost:5000/get-simulation-results');
            
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.simulationData = data;
                this.processData();
                return this.processedData;
            } else {
                console.error("Error loading data:", data.error);
                return null;
            }
        } catch (error) {
            console.error("Error loading results:", error);
            // Generate test data in case of error
            this.generateTestData();
            this.processData();
            return this.processedData;
        }
    }

    processData() {
        if (!this.simulationData || !this.simulationData.runs || this.simulationData.runs.length === 0) {
            return;
        }
        
        // Process production data
        this.processProductionData();
        
        // Process station data
        this.processStationData();
        
        // Process time data
        this.processTimeData();
    }

    processProductionData() {
        const runs = this.simulationData.runs;
        const productionData = runs.map(run => {
            return {
                run: run.run,
                totalProduction: run.metrics['Total Production'] || 0,
                faultyProducts: run.metrics['Faulty Products'] || 0,
                faultyRate: run.metrics['Faulty Rate'] || 0
            };
        });
        
        this.processedData.production = {
            byRun: productionData,
            averages: {
                totalProduction: this.calculateAverage(productionData, 'totalProduction'),
                faultyProducts: this.calculateAverage(productionData, 'faultyProducts'),
                faultyRate: this.calculateAverage(productionData, 'faultyRate')
            }
        };
    }

    processStationData() {
        const runs = this.simulationData.runs;
        const stationData = [];
        
        for (let i = 1; i <= 6; i++) {
            const stationMetrics = runs.map(run => {
                return {
                    run: run.run,
                    occupancyRate: run.metrics[`Station ${i} Occupancy Rate`] || 0,
                    waitTime: run.metrics[`Station ${i} Wait Time`] || 0,
                    downtime: run.metrics[`Station ${i} Downtime`] || 0
                };
            });
            
            stationData.push({
                stationId: i,
                metrics: stationMetrics,
                averages: {
                    occupancyRate: this.calculateAverage(stationMetrics, 'occupancyRate'),
                    waitTime: this.calculateAverage(stationMetrics, 'waitTime'),
                    downtime: this.calculateAverage(stationMetrics, 'downtime')
                }
            });
        }
        
        this.processedData.stations = stationData;
    }

    processTimeData() {
        const runs = this.simulationData.runs;
        const timeData = runs.map(run => {
            return {
                run: run.run,
                productionTime: run.metrics['Production Time'] || 0,
                fixingTime: run.metrics['Fixing Time'] || 0,
                supplierOccupancy: run.metrics['Supplier Occupancy'] || 0
            };
        });
        
        this.processedData.timeMetrics = {
            byRun: timeData,
            averages: {
                productionTime: this.calculateAverage(timeData, 'productionTime'),
                fixingTime: this.calculateAverage(timeData, 'fixingTime'),
                supplierOccupancy: this.calculateAverage(timeData, 'supplierOccupancy')
            }
        };
    }

    calculateAverage(data, property) {
        if (!data || data.length === 0) {
            return 0;
        }
        
        const sum = data.reduce((total, item) => total + item[property], 0);
        return sum / data.length;
    }

    getFilteredData(startDate, endDate) {
        if (!this.simulationData || !this.simulationData.runs) {
            return null;
        }
        
        // Filter runs within the selected range
        return this.simulationData.runs.filter(run => {
            return run.run >= startDate && run.run <= endDate;
        });
    }

    generateTestData() {
        // Test data for development
        this.simulationData = {
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
}

// Create global instance
const dataProcessor = new DataProcessor();