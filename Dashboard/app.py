from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import subprocess
import os
import glob
import pandas as pd

app = Flask(__name__)
CORS(app)


@app.route("/")
def index():
    return send_from_directory("Dashboard", "index.html")


@app.route("/<path:path>")
def static_files(path):
    # This serves any file in the Dashboard folder
    return send_from_directory("Dashboard", path)


@app.route("/run-simulation", methods=["POST"])
def run_simulation():
    try:
        # Execute main.py script in the Simulation folder
        result = subprocess.run(
            ["python", "Simulation/main.py"], capture_output=True, text=True
        )

        if result.returncode != 0:
            return (
                jsonify(
                    {"success": False, "output": result.stdout, "error": result.stderr}
                ),
                500,
            )

        return jsonify(
            {"success": True, "output": result.stdout, "error": result.stderr}
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/get-simulation-results", methods=["GET"])
def get_simulation_results():
    try:
        # Route to the results folder
        results_folder = "Results"

        # Obtain all CSV files in the results folder
        csv_files = glob.glob(os.path.join(results_folder, "single_run_*.csv"))

        # Process each CSV file and extract run data
        runs_data = []
        for csv_file in csv_files:
            try:
                run_number = os.path.basename(csv_file).split("_")[2].split(".")[0]
                df = pd.read_csv(csv_file)
                # Convert DataFrame to dictionary
                run_data = {
                    "run": int(run_number),
                    "metrics": df.set_index("Metric")["Value"].to_dict(),
                }
                runs_data.append(run_data)
            except Exception as e:
                print(f"Error procesando {csv_file}: {e}")

        # If there are no individual runs, create dummy data for testing
        if not runs_data:
            print(
                "Individual run files were not found. Utilizing test data."
            )
            runs_data = [
                {
                    "run": 1,
                    "metrics": {
                        "Total Production": 165,
                        "Faulty Products": 8,
                        "Faulty Rate": 0.05,
                        "Station 1 Occupancy Rate": 0.14,
                        "Station 2 Occupancy Rate": 0.14,
                        "Station 3 Occupancy Rate": 0.14,
                        "Station 4 Occupancy Rate": 0.14,
                        "Station 5 Occupancy Rate": 0.14,
                        "Station 6 Occupancy Rate": 0.14,
                        "Station 1 Wait Time": 0.0,
                        "Station 2 Wait Time": 0.0,
                        "Station 3 Wait Time": 0.0,
                        "Station 4 Wait Time": 0.0,
                        "Station 5 Wait Time": 0.0,
                        "Station 6 Wait Time": 0.0,
                        "Station 1 Downtime": 1.5,
                        "Station 2 Downtime": 1.0,
                        "Station 3 Downtime": 5.0,
                        "Station 4 Downtime": 14.0,
                        "Station 5 Downtime": 7.5,
                        "Station 6 Downtime": 5.0,
                        "Production Time": 24.7,
                        "Fixing Time": 2.8,
                        "Supplier Occupancy": 0.013,
                    },
                }
            ]

        # Calculate summary as average of all runs
        summary_data = {}
        if runs_data:
            # Obtain all unique metrics from runs
            all_metrics = set()
            for run in runs_data:
                all_metrics.update(run["metrics"].keys())

            # Calculate average for each metric
            for metric in all_metrics:
                values = [run["metrics"].get(metric, 0) for run in runs_data]
                summary_data[metric] = sum(values) / len(values) if values else 0

        return jsonify({"success": True, "runs": runs_data, "summary": summary_data})
    except Exception as e:
        import traceback

        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
