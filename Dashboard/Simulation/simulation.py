import simpy
import random
import numpy as np
from metrics import MetricsCollector


class LaptopFactory:
    def __init__(self, env: simpy.Environment, metrics: MetricsCollector):
        self.env = env
        self.metrics = metrics

        # Resources
        self.stations = [simpy.Resource(env, capacity=1) for _ in range(6)]
        self.supply_devices = simpy.Resource(env, capacity=3)

        # Materials storage with more nuanced initial distribution
        self.materials = {
            "motherboard_circuits": 25,
            "cpus": {"intel": 13, "amd": 12},
            "gpus": {"nvidia": 8, "amd": 8, "intel": 9},
            "ram": {"8GB": 10, "16GB": 10, "32GB": 5},
            "hdd": 15,
            "m2": 10,
            "screens": 25,
            "metal": 15,
            "plastic": 10,
            "boxes": 25,
        }

        # Enhanced failure probabilities with more variation
        self.failure_probs = [0.02, 0.01, 0.05, 0.15, 0.07, 0.06]

        # Tracking product count per station for error checks
        self.station_product_counts = [0] * 6

        # Start processes
        self.day_process = env.process(self.run_day())
        self.manufacturing_process = env.process(self.run_manufacturing())

    def run_day(self):
        """Control daily operations and accidents with more realistic randomness"""
        while True:
            # Variable day length with some randomness
            day_length = random.normalvariate(24, 2)
            yield self.env.timeout(max(1, day_length))

            # Accident probability with slight variation
            if random.random() < 0.01:
                # print(f"Accident occurred at time {self.env.now}")
                accident_duration = random.normalvariate(24, 4)
                yield self.env.timeout(max(1, accident_duration))

    def run_manufacturing(self):
        """Main manufacturing process with more dynamic processing"""
        while True:
            try:
                # Create a new laptop with variable start delay
                yield self.env.process(self.create_laptop())

                # Variable delay between laptop starts
                delay = max(0.1, random.normalvariate(4, 2))
                yield self.env.timeout(delay)

            except simpy.Interrupt:
                continue

    def check_station_failure(self, station_id):
        """Check for potential station failure with more detailed handling"""
        self.station_product_counts[station_id] += 1

        # Check for errors every 5 products
        if self.station_product_counts[station_id] % 5 == 0:
            failure_prob = self.failure_probs[station_id]
            if random.random() < failure_prob:
                # Simulate repair with exponential distribution
                repair_time = random.expovariate(1 / 3)
                # print(f"Station {station_id} failed, repair time: {repair_time:.2f}")
                self.metrics.record_fixing_time(station_id, repair_time)
                return repair_time
        return 0

    def create_laptop(self):
        """Complete laptop creation process with enhanced randomness"""
        start_time = self.env.now

        try:
            # 1. Create motherboard
            yield self.env.process(self.create_motherboard())

            # 2-4. Parallel assembly with more dynamic component selection
            yield self.env.process(self.parallel_assembly())

            # 5. Case assembly with weighted material selection
            yield self.env.process(self.assemble_case())

            # 6. Final assembly and testing
            yield self.env.process(self.final_assembly())

            # Quality check with more nuanced rejection
            quality_score = random.random()
            if quality_score < 0.05:  # 5% rejection rate
                self.metrics.record_faulty()
                # print(f"Laptop rejected at quality check (score: {quality_score:.4f})")
            else:
                self.metrics.record_production()

            # Record total production time
            self.metrics.record_production_time(self.env.now - start_time)

        except simpy.Interrupt:
            print(f"Production interrupted at {self.env.now}")

    def create_motherboard(self):
        """Create motherboard at station 1 with failure checking"""
        if self.materials["motherboard_circuits"] <= 0:
            yield self.env.process(self.resupply_materials("motherboard_circuits"))

        with self.stations[0].request() as req:
            wait_start = self.env.now
            yield req

            # Record waiting time
            self.metrics.record_waiting_time(0, self.env.now - wait_start)

            # Check for potential station failure
            failure_time = self.check_station_failure(0)
            if failure_time > 0:
                yield self.env.timeout(failure_time)

            # Process time with increased variance
            process_time = max(0.1, random.normalvariate(4, 2))
            yield self.env.timeout(process_time)

            # Record work time
            self.metrics.record_work_time(0, process_time)

            self.materials["motherboard_circuits"] -= 1

    def parallel_assembly(self):
        """Handle CPU, GPU, and Memory installation with more dynamic processing"""
        # Define components with their selection weights
        components = [
            (1, "cpus", self.materials["cpus"], [0.6, 0.4]),  # Weighted brand selection
            (2, "gpus", self.materials["gpus"], [0.4, 0.3, 0.3]),  # Different weights
            (3, "ram", self.materials["ram"], [0.4, 0.4, 0.2]),  # RAM size weights
        ]

        # Randomize order and process
        random.shuffle(components)

        for station_id, component_type, component_stock, weights in components:
            # Check and resupply if needed
            if isinstance(component_stock, dict) and sum(component_stock.values()) <= 0:
                yield self.env.process(self.resupply_materials(component_type))

            with self.stations[station_id].request() as req:
                wait_start = self.env.now
                yield req

                # Record waiting time
                self.metrics.record_waiting_time(station_id, self.env.now - wait_start)

                # Check for potential station failure
                failure_time = self.check_station_failure(station_id)
                if failure_time > 0:
                    yield self.env.timeout(failure_time)

                # Process time with increased variance
                process_time = max(0.1, random.normalvariate(4, 2))
                yield self.env.timeout(process_time)

                # Record work time
                self.metrics.record_work_time(station_id, process_time)

                # Dynamic component selection with weights
                if isinstance(component_stock, dict):
                    available = [k for k, v in component_stock.items() if v > 0]
                    if available:
                        # Use weighted random selection
                        adjusted_weights = [
                            weights[available.index(k)] for k in available
                        ]
                        choice = random.choices(available, weights=adjusted_weights)[0]
                        component_stock[choice] -= 1

    def assemble_case(self):
        """Assemble case with more nuanced material selection"""
        # Weighted selection of case material
        case_material = random.choices(["metal", "plastic"], weights=[0.6, 0.4])[0]

        if self.materials[case_material] <= 0:
            yield self.env.process(self.resupply_materials(case_material))

        with self.stations[4].request() as req:
            wait_start = self.env.now
            yield req

            # Record waiting time
            self.metrics.record_waiting_time(4, self.env.now - wait_start)

            # Check for potential station failure
            failure_time = self.check_station_failure(4)
            if failure_time > 0:
                yield self.env.timeout(failure_time)

            # Process time with increased variance
            process_time = max(0.1, random.normalvariate(4, 2))
            yield self.env.timeout(process_time)

            # Record work time
            self.metrics.record_work_time(4, process_time)

            self.materials[case_material] -= 1

    def final_assembly(self):
        """Final assembly with more comprehensive checks"""
        if self.materials["screens"] <= 0:
            yield self.env.process(self.resupply_materials("screens"))

        with self.stations[5].request() as req:
            wait_start = self.env.now
            yield req

            # Record waiting time
            self.metrics.record_waiting_time(5, self.env.now - wait_start)

            # Check for potential station failure
            failure_time = self.check_station_failure(5)
            if failure_time > 0:
                yield self.env.timeout(failure_time)

            # Process time with increased variance
            process_time = max(0.1, random.normalvariate(4, 2))
            yield self.env.timeout(process_time)

            # Record work time
            self.metrics.record_work_time(5, process_time)

            self.materials["screens"] -= 1

    def resupply_materials(self, material_type):
        """Enhanced material resupply process"""
        with self.supply_devices.request() as req:
            supply_start = self.env.now
            yield req

            # Resupply time with more variance
            resupply_time = max(0.1, random.normalvariate(2, 0.5))
            yield self.env.timeout(resupply_time)

            # Record supplier occupancy
            self.metrics.record_supply_time(self.env.now - supply_start)

            # Resupply with more dynamic component generation
            if material_type in ["cpus", "gpus"]:
                self.generate_components(material_type)
            else:
                # Add some randomness to resupply quantities
                resupply_amount = random.randint(20, 30)
                self.materials[material_type] = resupply_amount

    def generate_components(self, component_type):
        """Generate new batch of components with more varied distribution"""
        if component_type == "cpus":
            intel_count = random.randint(10, 15)
            self.materials["cpus"] = {"intel": intel_count, "amd": 25 - intel_count}
        elif component_type == "gpus":
            nvidia_count = random.randint(7, 10)
            amd_count = random.randint(7, 10)
            intel_count = 25 - nvidia_count - amd_count
            self.materials["gpus"] = {
                "nvidia": nvidia_count,
                "amd": amd_count,
                "intel": intel_count,
            }
