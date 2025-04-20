#!/usr/bin/env python3
"""
Demo script for Tech Support Ticket Prioritizer

This script demonstrates the full pipeline:
1. Preprocessing data
2. Training models
3. Making predictions
4. Running the API server
"""

import os
import sys
import time
from pathlib import Path

def run_command(command):
    """Run a shell command and print output"""
    print(f"\n>>> Running: {command}")
    os.system(command)

def main():
    """Run the demo pipeline"""
    print("=" * 80)
    print("Tech Support Ticket Prioritizer Demo")
    print("=" * 80)
    
    # Get the project root directory
    root_dir = Path(__file__).resolve().parent
    
    # Step 1: Preprocess data
    print("\n[Step 1] Preprocessing data...")
    preprocess_script = os.path.join(root_dir, "scripts", "preprocess.py")
    run_command(f"python {preprocess_script}")
    
    # Step 2: Train models
    print("\n[Step 2] Training models...")
    train_script = os.path.join(root_dir, "scripts", "train_models.py")
    run_command(f"python {train_script}")
    
    # Step 3: Make predictions on sample tickets
    print("\n[Step 3] Making predictions on sample tickets...")
    print("\nExample 1: Bug report (English)")
    ticket1 = "The application keeps crashing when I try to save my work. This is very frustrating!"
    cli_script = os.path.join(root_dir, "scripts", "cli.py")
    run_command(f'python {cli_script} predict "{ticket1}"')
    
    print("\nExample 2: Feature request (English)")
    ticket2 = "It would be great if you could add a dark mode to reduce eye strain during night usage."
    run_command(f'python {cli_script} predict "{ticket2}"')
    
    print("\nExample 3: Query (Spanish)")
    ticket3 = "¿Cómo puedo restablecer mi contraseña? He intentado varias veces pero no funciona."
    run_command(f'python {cli_script} predict "{ticket3}" --language es')
    
    # Step 4: Process a batch of tickets
    print("\n[Step 4] Processing a batch of tickets from CSV...")
    csv_file = os.path.join(root_dir, "data", "dataset-tickets-multi-lang3-4k.csv")
    run_command(f'python {cli_script} process "{csv_file}"')
    
    # Step 5: Start the API server
    print("\n[Step 5] Starting the API server...")
    print("Press Ctrl+C to stop the server")
    try:
        run_command(f'python {cli_script} serve')
    except KeyboardInterrupt:
        print("\nServer stopped")
    
    print("\nDemo completed!")

if __name__ == "__main__":
    main() 