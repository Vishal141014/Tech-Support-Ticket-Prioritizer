#!/usr/bin/env python3
"""
Simple HTTP server to serve the frontend.
Run this script and then navigate to http://localhost:8080
"""

import os
import sys
import http.server
import socketserver
from pathlib import Path

# Default port
PORT = 8080

def main():
    """Start the HTTP server"""
    # Change directory to where this script is located
    os.chdir(Path(__file__).resolve().parent)
    
    # Create a simple HTTP server
    handler = http.server.SimpleHTTPRequestHandler
    
    # Allow port reuse
    socketserver.TCPServer.allow_reuse_address = True
    
    # Create and start the server
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"Serving frontend at http://localhost:{PORT}")
        print("Press Ctrl+C to stop")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped")

if __name__ == "__main__":
    # Check if port is specified as an argument
    if len(sys.argv) > 1:
        try:
            PORT = int(sys.argv[1])
        except ValueError:
            print(f"Invalid port: {sys.argv[1]}, using default: {PORT}")
    
    main() 