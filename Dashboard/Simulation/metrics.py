# metrics.py
import numpy as np
from typing import Dict, List

class MetricsCollector:
    def __init__(self):
        # Production metrics
        self.production_count = 0
        self.faulty_products = 0
        
        # Time metrics
        self.station_work_times = [0] * 6
        self.station_wait_times = [0] * 6
        self.station_downtimes = [0] * 6
        self.supplier_occupancy_time = 0
        self.production_times = []
        self.fixing_times = []
        
        # Material metrics
        self.materials_used = {
            'motherboard_circuits': 0,
            'cpus': {'intel': 0, 'amd': 0},
            'gpus': {'nvidia': 0, 'amd': 0, 'intel': 0},
            'ram': {'8GB': 0, '16GB': 0, '32GB': 0},
            'hdd': 0,
            'm2': 0,
            'screens': 0,
            'metal': 0,
            'plastic': 0,
            'boxes': 0
        }
        
        # Resupply metrics
        self.resupply_counts = {
            'motherboard_circuits': 0,
            'cpus': 0,
            'gpus': 0,
            'ram': 0,
            'hdd': 0,
            'm2': 0,
            'screens': 0,
            'metal': 0,
            'plastic': 0,
            'boxes': 0
        }
        
    def record_production(self):
        self.production_count += 1
        
    def record_faulty(self):
        self.faulty_products += 1
        
    def record_work_time(self, station_id: int, time: float):
        self.station_work_times[station_id] += time
        
    def record_waiting_time(self, station_id: int, time: float):
        self.station_wait_times[station_id] += time
        
    def record_fixing_time(self, station_id: int, time: float):
        self.fixing_times.append(time)
        self.station_downtimes[station_id] += time
        
    def record_supply_time(self, time: float):
        self.supplier_occupancy_time += time
        
    def record_production_time(self, time: float):
        self.production_times.append(time)

    

    def record_material_use(self, material: str, quantity: int = 1, subtype: str = None):
        if subtype:
            self.materials_used[material][subtype] += quantity
        else:
            self.materials_used[material] += quantity
    
    def record_resupply(self, material: str):
        self.resupply_counts[material] += 1
        
    def get_metrics(self, total_time: float) -> Dict:
        """Return comprehensive metrics"""
        return {
            'production': {
                'total': self.production_count,
                'faulty': self.faulty_products,
                'faulty_rate': self.faulty_products/(self.production_count + self.faulty_products) if self.production_count > 0 else 0
            },
            'station_metrics': {
                'occupancy_rates': [work/total_time for work in self.station_work_times],
                'wait_times': [wait/self.production_count if self.production_count > 0 else 0 for wait in self.station_wait_times],
                'downtimes': self.station_downtimes
            },
            'time_metrics': {
                'avg_production_time': np.mean(self.production_times) if self.production_times else 0,
                'avg_fixing_time': np.mean(self.fixing_times) if self.fixing_times else 0,
                'supplier_occupancy': self.supplier_occupancy_time/total_time
            },
            'material_metrics': {
                'materials_used': self.materials_used,
                'resupply_counts': self.resupply_counts
            }
        }