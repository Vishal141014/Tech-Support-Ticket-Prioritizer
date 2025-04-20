#!/usr/bin/env python3
"""
Main entry point for the Tech Support Ticket Prioritizer system.
This script provides a unified interface to run different components.
"""

import os
import sys
import argparse
import subprocess
from pathlib import Path

def run_command(command, cwd=None):
    """Run a shell command and print output"""
    print(f"\n>>> Running: {command}")
    return subprocess.call(command, shell=True, cwd=cwd)

def main():
    """Main entry point"""
    # Get the project root directory
    root_dir = Path(__file__).resolve().parent
    
    # Create the argument parser
    parser = argparse.ArgumentParser(description="Tech Support Ticket Prioritizer")
    
    # Create subparsers for different commands
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # Setup command - preprocess data and train models
    setup_parser = subparsers.add_parser("setup", help="Preprocess data and train models")
    
    # API command - run the API server
    api_parser = subparsers.add_parser("api", help="Run the API server")
    api_parser.add_argument("--host", default="0.0.0.0", help="Host to bind the server to")
    api_parser.add_argument("--port", "-p", type=int, default=8000, help="Port to bind the server to")
    
    # Frontend command - run the frontend server
    frontend_parser = subparsers.add_parser("frontend", help="Run the frontend server")
    frontend_parser.add_argument("--port", "-p", type=int, default=8080, help="Port to bind the server to")
    
    # React frontend command - run the React web-ui
    react_parser = subparsers.add_parser("react", help="Run the React frontend")
    react_parser.add_argument("--port", "-p", type=int, default=3000, help="Port to bind the server to")
    
    # Both command - run both API and old frontend
    both_parser = subparsers.add_parser("both", help="Run both API and old frontend")
    
    # Full command - run both API and React frontend
    full_parser = subparsers.add_parser("full", help="Run both API and React frontend")
    
    # CLI command - run the CLI interface
    cli_parser = subparsers.add_parser("cli", help="Run the CLI interface")
    cli_parser.add_argument("cli_args", nargs=argparse.REMAINDER, help="Arguments to pass to the CLI")
    
    # Demo command - run the demo
    demo_parser = subparsers.add_parser("demo", help="Run the demo")
    
    # Parse arguments
    args = parser.parse_args()
    
    # Handle commands
    if args.command == "setup":
        print("Setting up the system...")
        run_command(f"python {root_dir}/scripts/preprocess.py")
        run_command(f"python {root_dir}/scripts/train_models.py")
        print("\nSetup completed!")
        
    elif args.command == "api":
        print(f"Starting API server on {args.host}:{args.port}...")
        run_command(f"python -m uvicorn api.main:app --host {args.host} --port {args.port}", cwd=root_dir)
        
    elif args.command == "frontend":
        print(f"Starting frontend server on port {args.port}...")
        run_command(f"python {root_dir}/frontend/serve.py {args.port}")
    
    elif args.command == "react":
        print(f"Starting React frontend on port {args.port}...")
        run_command(f"npm start", cwd=f"{root_dir}/web-ui")
        
    elif args.command == "both":
        print("Starting both API and old frontend servers...")
        
        # Start API server in the background
        api_process = subprocess.Popen(
            f"python -m uvicorn api.main:app --host 0.0.0.0 --port 8000",
            shell=True,
            cwd=root_dir
        )
        
        # Give the API server a moment to start
        print("API server starting up...")
        import time
        time.sleep(2)
        
        try:
            # Start frontend server in the foreground
            print("Starting frontend server...")
            run_command(f"python {root_dir}/frontend/serve.py")
        finally:
            # Make sure to terminate the API server when done
            if api_process:
                print("Shutting down API server...")
                api_process.terminate()
    
    elif args.command == "full":
        print("Starting both API and React frontend...")
        
        # Start API server in the background
        api_process = subprocess.Popen(
            f"python -m uvicorn api.main:app --host 0.0.0.0 --port 8000",
            shell=True,
            cwd=root_dir
        )
        
        # Give the API server a moment to start
        print("API server starting up...")
        import time
        time.sleep(2)
        
        try:
            # Start React frontend in the foreground
            print("Starting React frontend...")
            run_command(f"npm start", cwd=f"{root_dir}/web-ui")
        finally:
            # Make sure to terminate the API server when done
            if api_process:
                print("Shutting down API server...")
                api_process.terminate()
        
    elif args.command == "cli":
        cli_cmd = f"python {root_dir}/scripts/cli.py"
        if args.cli_args:
            cli_cmd += " " + " ".join(args.cli_args)
        run_command(cli_cmd)
        
    elif args.command == "demo":
        print("Running demo...")
        run_command(f"python {root_dir}/demo.py")
        
    else:
        parser.print_help()

if __name__ == "__main__":
    main() 