# main.py
import os
import random
from typing import Dict, List

import numpy as np
import simpy

from metrics import MetricsCollector
from saveSimulation import *
from simulation import LaptopFactory


def run_simulation(sim_time: int = 5000, runs: int = 100) -> Dict:
    """Run multiple simulation instances and collect results"""
    all_metrics = []

    for run in range(runs):
        # Initialize simulation environment
        env = simpy.Environment()
        metrics = MetricsCollector()
        factory = LaptopFactory(env, metrics)

        # Run simulation
        env.run(until=sim_time)

        # Collect metrics
        run_metrics = metrics.get_metrics(sim_time)
        all_metrics.append(run_metrics)

        # Save individual run results
        os.makedirs("./Results", exist_ok=True)
        save_single_run_metrics_to_csv(run_metrics, f"./Results/single_run_{run+1}.csv")
        # save_single_run_metrics_to_graph(run_metrics, f"./Results/", {run + 1})

        print(
            f"Run {run + 1} completed: Produced {run_metrics['production']['total']} laptops "
            f"({run_metrics['production']['faulty']} faulty)"
        )

    return analyze_results(all_metrics)


def analyze_results(metrics_list: List[Dict]) -> Dict:
    """Analyze metrics from multiple runs"""
    # Initialize aggregation structure
    aggregated = {
        "production": {"total": [], "faulty": [], "faulty_rate": []},
        "station_metrics": {
            "occupancy_rates": [[] for _ in range(6)],
            "wait_times": [[] for _ in range(6)],
            "downtimes": [[] for _ in range(6)],
        },
        "time_metrics": {
            "avg_production_time": [],
            "avg_fixing_time": [],
            "supplier_occupancy": [],
        },
    }

    # Aggregate metrics from all runs
    for metrics in metrics_list:
        # Production metrics
        aggregated["production"]["total"].append(metrics["production"]["total"])
        aggregated["production"]["faulty"].append(metrics["production"]["faulty"])
        aggregated["production"]["faulty_rate"].append(
            metrics["production"]["faulty_rate"]
        )

        # Station metrics
        for i in range(6):
            aggregated["station_metrics"]["occupancy_rates"][i].append(
                metrics["station_metrics"]["occupancy_rates"][i]
            )
            aggregated["station_metrics"]["wait_times"][i].append(
                metrics["station_metrics"]["wait_times"][i]
            )
            aggregated["station_metrics"]["downtimes"][i].append(
                metrics["station_metrics"]["downtimes"][i]
            )

        # Time metrics
        aggregated["time_metrics"]["avg_production_time"].append(
            metrics["time_metrics"]["avg_production_time"]
        )
        aggregated["time_metrics"]["avg_fixing_time"].append(
            metrics["time_metrics"]["avg_fixing_time"]
        )
        aggregated["time_metrics"]["supplier_occupancy"].append(
            metrics["time_metrics"]["supplier_occupancy"]
        )

    # Calculate final statistics
    results = {
        "production": {
            "avg_total": np.mean(aggregated["production"]["total"]),
            "std_total": np.std(aggregated["production"]["total"]),
            "avg_faulty": np.mean(aggregated["production"]["faulty"]),
            "avg_faulty_rate": np.mean(aggregated["production"]["faulty_rate"]),
        },
        "station_metrics": {
            "avg_occupancy_rates": [
                np.mean(rates)
                for rates in aggregated["station_metrics"]["occupancy_rates"]
            ],
            "avg_wait_times": [
                np.mean(times) for times in aggregated["station_metrics"]["wait_times"]
            ],
            "avg_downtimes": [
                np.mean(times) for times in aggregated["station_metrics"]["downtimes"]
            ],
        },
        "time_metrics": {
            "avg_production_time": np.mean(
                aggregated["time_metrics"]["avg_production_time"]
            ),
            "avg_fixing_time": np.mean(aggregated["time_metrics"]["avg_fixing_time"]),
            "avg_supplier_occupancy": np.mean(
                aggregated["time_metrics"]["supplier_occupancy"]
            ),
        },
    }
    save_simulation_results_to_graph(results)
    return results


if __name__ == "__main__":
    # Run simulation and get results
    results = run_simulation()
    save_simulation_results_to_graph(results, "/")

    # Print detailed results
    print("\nSimulation Results:")
    print(f"\nProduction Metrics:")
    print(f"Average Production: {results['production']['avg_total']:.2f} laptops")
    print(f"Production Standard Deviation: {results['production']['std_total']:.2f}")
    print(f"Average Faulty Products: {results['production']['avg_faulty']:.2f}")
    print(f"Average Faulty Rate: {results['production']['avg_faulty_rate']:.2%}")

    """ print(f"\nStation Metrics:")
    for i in range(6):
        print(f"\nStation {i+1}:")
        print(f"  Occupancy Rate: {results['station_metrics']['avg_occupancy_rates'][i]:.2%}")
        print(f"  Average Wait Time: {results['station_metrics']['avg_wait_times'][i]:.2f} units")
        print(f"  Total Downtime: {results['station_metrics']['avg_downtimes'][i]:.2f} units") """

    print(f"\nTime Metrics:")
    print(
        f"Average Production Time: {results['time_metrics']['avg_production_time']:.2f} units"
    )
    print(
        f"Average Fixing Time: {results['time_metrics']['avg_fixing_time']:.2f} units"
    )
    print(
        f"Average Supplier Occupancy: {results['time_metrics']['avg_supplier_occupancy']:.2%}"
    )
