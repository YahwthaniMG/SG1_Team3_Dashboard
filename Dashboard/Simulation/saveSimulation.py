import csv

import matplotlib.pyplot as plt
import numpy as np


def save_simulation_results_to_csv(metrics, filename="simulation_resultsSummary.csv"):
    """Saves simulation metrics to a CSV file."""

    # Validate data structure
    if not isinstance(metrics, dict):
        print("ERROR: Metrics is not a dictionary.")
        return

    if "production" not in metrics:
        print("ERROR: 'production' key missing in metrics.")
        return

    try:
        with open(filename, mode="w", newline="") as file:
            writer = csv.writer(file)
            writer.writerow(["Metric", "Value"])

            # Save production metrics
            writer.writerow(
                ["Average Total Production", metrics["production"]["avg_total"]]
            )
            writer.writerow(
                ["Production Standard Deviation", metrics["production"]["std_total"]]
            )
            writer.writerow(
                ["Average Faulty Products", metrics["production"]["avg_faulty"]]
            )
            writer.writerow(
                ["Average Faulty Rate", metrics["production"]["avg_faulty_rate"]]
            )

            # Save station metrics
            for i in range(6):
                writer.writerow(
                    [
                        f"Station {i+1} Occupancy Rate",
                        metrics["station_metrics"]["avg_occupancy_rates"][i],
                    ]
                )
                writer.writerow(
                    [
                        f"Station {i+1} Average Wait Time",
                        metrics["station_metrics"]["avg_wait_times"][i],
                    ]
                )
                writer.writerow(
                    [
                        f"Station {i+1} Downtime",
                        metrics["station_metrics"]["avg_downtimes"][i],
                    ]
                )

            # Save time metrics
            writer.writerow(
                [
                    "Average Production Time",
                    metrics["time_metrics"]["avg_production_time"],
                ]
            )
            writer.writerow(
                ["Average Fixing Time", metrics["time_metrics"]["avg_fixing_time"]]
            )
            writer.writerow(
                [
                    "Average Supplier Occupancy",
                    metrics["time_metrics"]["avg_supplier_occupancy"],
                ]
            )

        # print(f"✅ Simulation results saved to {filename}")

    except Exception as e:
        print("ERROR writing to CSV:", e)


def save_simulation_results_to_graph(metrics, folder="./Results"):
    """Generates and saves graphs for aggregated simulation results."""
    if not isinstance(metrics, dict) or "production" not in metrics:
        print("ERROR: Invalid metrics format.")
        return

    # Production Metrics
    labels = ["Avg Production", "Avg Faulty", "Faulty Rate"]
    values = [
        metrics["production"]["avg_total"],
        metrics["production"]["avg_faulty"],
        metrics["production"]["avg_faulty_rate"] * 100,
    ]  # Convert to percentage

    plt.figure(figsize=(10, 5))
    plt.bar(labels, values, color=["blue", "red", "orange"])
    plt.ylabel("Values")
    plt.title("Production Metrics")
    plt.savefig("simulation_resultsSummary_production_metrics.png")
    plt.close()

    # Workstation Downtime & Occupancy
    stations = [f"Station {i+1}" for i in range(6)]
    occupancy_rates = metrics["station_metrics"]["avg_occupancy_rates"]
    downtimes = metrics["station_metrics"]["avg_downtimes"]

    fig, ax1 = plt.subplots(figsize=(10, 5))
    ax1.set_xlabel("Workstations")
    ax1.set_ylabel("Occupancy Rate (%)", color="blue")
    ax1.bar(
        stations,
        np.array(occupancy_rates) * 100,
        color="blue",
        alpha=0.6,
        label="Occupancy Rate",
    )
    ax1.tick_params(axis="y", labelcolor="blue")

    ax2 = ax1.twinx()
    ax2.set_ylabel("Downtime (units)", color="red")
    ax2.plot(
        stations,
        downtimes,
        color="red",
        marker="o",
        linestyle="dashed",
        label="Downtime",
    )
    ax2.tick_params(axis="y", labelcolor="red")

    plt.title("Workstation Performance")
    fig.tight_layout()
    plt.savefig("simulation_resultsSummary_workstation_metrics.png")
    plt.close()
    """ print(
        f"✅ Simulation graphs saved as simulation_resultsSummary_production_metrics.png and simulation_resultsSummary_workstation_metrics.png"
    ) """


def save_single_run_metrics_to_csv(metrics, filename="single_run_results.csv"):
    """Saves a single simulation run's metrics to a CSV file."""

    # Convert JSON string to dictionary if needed
    if isinstance(metrics, str):
        try:
            metrics = json.loads(metrics)
        except json.JSONDecodeError:
            print("ERROR: Invalid JSON format for metrics.")
            return

    # Validate data structure
    if not isinstance(metrics, dict):
        print("ERROR: Metrics is not a dictionary.")
        return

    if (
        "production" not in metrics
        or "station_metrics" not in metrics
        or "time_metrics" not in metrics
    ):
        print("ERROR: Missing expected keys in metrics.")
        return

    try:
        with open(filename, mode="w", newline="") as file:
            writer = csv.writer(file)
            writer.writerow(["Metric", "Value"])

            # Save production metrics
            writer.writerow(["Total Production", metrics["production"]["total"]])
            writer.writerow(["Faulty Products", metrics["production"]["faulty"]])
            writer.writerow(["Faulty Rate", metrics["production"]["faulty_rate"]])

            # Save station metrics
            for i in range(6):
                writer.writerow(
                    [
                        f"Station {i+1} Occupancy Rate",
                        metrics["station_metrics"]["occupancy_rates"][i],
                    ]
                )
                writer.writerow(
                    [
                        f"Station {i+1} Wait Time",
                        metrics["station_metrics"]["wait_times"][i],
                    ]
                )
                writer.writerow(
                    [
                        f"Station {i+1} Downtime",
                        metrics["station_metrics"]["downtimes"][i],
                    ]
                )

            # Save time metrics
            writer.writerow(
                ["Production Time", metrics["time_metrics"]["avg_production_time"]]
            )
            writer.writerow(["Fixing Time", metrics["time_metrics"]["avg_fixing_time"]])
            writer.writerow(
                ["Supplier Occupancy", metrics["time_metrics"]["supplier_occupancy"]]
            )

        # print(f"✅ Single run results saved to {filename}")

    except Exception as e:
        print("ERROR writing to CSV:", e)


def save_single_run_metrics_to_graph(metrics, folder="/Results", iteration=0):
    """Generates and saves graphs for a single run's metrics."""
    if not isinstance(metrics, dict) or "production" not in metrics:
        print("ERROR: Invalid metrics format.")
        return

    # Single Run Production Metrics
    labels = ["Total Production", "Faulty Products", "Faulty Rate"]
    values = [
        metrics["production"]["total"],
        metrics["production"]["faulty"],
        metrics["production"]["faulty_rate"] * 100,
    ]

    plt.figure(figsize=(10, 5))
    plt.bar(labels, values, color=["blue", "red", "orange"])
    plt.ylabel("Values")
    plt.title("Single Run Production Metrics")
    plt.savefig(f"{folder}single_run_production_metrics_{iteration}.png")
    plt.close()

    # Workstation Downtime & Occupancy for Single Run
    stations = [f"Station {i+1}" for i in range(6)]
    occupancy_rates = metrics["station_metrics"]["occupancy_rates"]
    downtimes = metrics["station_metrics"]["downtimes"]

    fig, ax1 = plt.subplots(figsize=(10, 5))
    ax1.set_xlabel("Workstations")
    ax1.set_ylabel("Occupancy Rate (%)", color="blue")
    ax1.bar(
        stations,
        np.array(occupancy_rates) * 100,
        color="blue",
        alpha=0.6,
        label="Occupancy Rate",
    )
    ax1.tick_params(axis="y", labelcolor="blue")

    ax2 = ax1.twinx()
    ax2.set_ylabel("Downtime (units)", color="red")
    ax2.plot(
        stations,
        downtimes,
        color="red",
        marker="o",
        linestyle="dashed",
        label="Downtime",
    )
    ax2.tick_params(axis="y", labelcolor="red")

    plt.title("Single Run Workstation Performance")
    fig.tight_layout()
    plt.savefig(f"{folder}single_run_workstation_metrics_{iteration}.png")
    plt.close()
    """ print(
        f"✅ Single run graphs saved as single_run_production_metrics_{iteration}.png and single_run_workstation_metrics_{iteration}.png"
    ) """
