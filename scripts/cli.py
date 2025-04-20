#!/usr/bin/env python3
import os
import sys
import argparse
from pathlib import Path
import pandas as pd

# Add parent directory to path to import utils
sys.path.append(str(Path(__file__).resolve().parent.parent))

from utils.model import TicketClassifier
from utils.preprocessor import TextPreprocessor, MultilingualPreprocessor

def process_single_ticket(text, language="en", model_dir=None):
    """Process a single ticket and print predictions"""
    # Initialize preprocessor and model
    preprocessor = TextPreprocessor() if language == "en" else MultilingualPreprocessor()
    
    if model_dir is None:
        model_dir = os.path.join(Path(__file__).resolve().parent.parent, "models")
    
    classifier = TicketClassifier(model_dir)
    
    # Try to load models
    if not classifier.load_models():
        print("No trained models found. Please train models first.")
        return
        
    # Preprocess text
    if language == "en":
        processed_text = preprocessor.preprocess(text)
    else:
        processed_text = preprocessor.preprocess(text, language)
        
    # Make predictions
    predictions = classifier.predict([processed_text])
    
    # Print results
    print("\nPrediction Results:")
    print("-" * 50)
    print(f"Text: {text}")
    print(f"Category: {predictions.get('category', ['unknown'])[0]}")
    print(f"Priority: {predictions.get('priority', ['medium'])[0]}")
    print("-" * 50)

def process_file(file_path, output_path=None, model_dir=None):
    """Process tickets from a CSV or JSON file"""
    # Determine file type
    if file_path.endswith('.csv'):
        # Load CSV
        df = pd.read_csv(file_path)
    elif file_path.endswith('.json'):
        # Load JSON
        df = pd.read_json(file_path)
    else:
        print(f"Unsupported file format: {file_path}")
        return
    
    # Check if we have text field
    text_field = None
    for field in ['text', 'description', 'subject']:
        if field in df.columns:
            text_field = field
            break
    
    if text_field is None:
        print(f"No text field found in the file. Available columns: {', '.join(df.columns)}")
        return
    
    # Initialize language 
    has_language = 'language' in df.columns
    
    # Initialize model
    if model_dir is None:
        model_dir = os.path.join(Path(__file__).resolve().parent.parent, "models")
    
    classifier = TicketClassifier(model_dir)
    
    # Try to load models
    if not classifier.load_models():
        print("No trained models found. Please train models first.")
        return
    
    # Initialize preprocessors
    text_preprocessor = TextPreprocessor()
    multilingual_preprocessor = MultilingualPreprocessor()
    
    # Process each ticket
    print(f"Processing {len(df)} tickets...")
    
    # Create new columns for predictions
    df['predicted_category'] = 'unknown'
    df['predicted_priority'] = 'medium'
    
    for i, row in df.iterrows():
        text = row[text_field]
        language = row['language'] if has_language else 'en'
        
        # Preprocess text
        if language == 'en':
            processed_text = text_preprocessor.preprocess(text)
        else:
            processed_text = multilingual_preprocessor.preprocess(text, language)
        
        # Make predictions
        predictions = classifier.predict([processed_text])
        
        # Store predictions
        df.at[i, 'predicted_category'] = predictions.get('category', ['unknown'])[0]
        df.at[i, 'predicted_priority'] = predictions.get('priority', ['medium'])[0]
        
        # Print progress
        if i % 10 == 0:
            print(f"Processed {i+1}/{len(df)} tickets")
    
    # Save results
    if output_path is None:
        base, ext = os.path.splitext(file_path)
        output_path = f"{base}_predictions{ext}"
    
    if output_path.endswith('.csv'):
        df.to_csv(output_path, index=False)
    elif output_path.endswith('.json'):
        df.to_json(output_path, orient='records')
    else:
        df.to_csv(output_path, index=False)
    
    print(f"Predictions saved to {output_path}")
    
    # Print summary
    category_counts = df['predicted_category'].value_counts()
    priority_counts = df['predicted_priority'].value_counts()
    
    print("\nCategory Counts:")
    for category, count in category_counts.items():
        print(f"{category}: {count}")
    
    print("\nPriority Counts:")
    for priority, count in priority_counts.items():
        print(f"{priority}: {count}")

def main():
    """Main CLI function"""
    parser = argparse.ArgumentParser(description="Tech Support Ticket Prioritizer CLI")
    
    # Create subparsers for different commands
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # Predict command
    predict_parser = subparsers.add_parser("predict", help="Predict category and priority for a single ticket")
    predict_parser.add_argument("text", help="Ticket text to classify")
    predict_parser.add_argument("--language", "-l", default="en", help="Language of the ticket (default: en)")
    predict_parser.add_argument("--model-dir", "-m", help="Directory containing trained models")
    
    # Process file command
    file_parser = subparsers.add_parser("process", help="Process tickets from a file")
    file_parser.add_argument("file", help="CSV or JSON file containing tickets")
    file_parser.add_argument("--output", "-o", help="Output file path")
    file_parser.add_argument("--model-dir", "-m", help="Directory containing trained models")
    
    # Server command
    server_parser = subparsers.add_parser("serve", help="Start the API server")
    server_parser.add_argument("--host", default="0.0.0.0", help="Host to bind the server to")
    server_parser.add_argument("--port", "-p", type=int, default=8000, help="Port to bind the server to")
    
    # Parse arguments
    args = parser.parse_args()
    
    # Handle commands
    if args.command == "predict":
        process_single_ticket(args.text, args.language, args.model_dir)
    elif args.command == "process":
        process_file(args.file, args.output, args.model_dir)
    elif args.command == "serve":
        try:
            import uvicorn
            from api.main import app
            print(f"Starting API server at http://{args.host}:{args.port}")
            uvicorn.run(app, host=args.host, port=args.port)
        except ImportError:
            print("Error: uvicorn is required to run the API server")
            print("Install it with: pip install uvicorn")
    else:
        parser.print_help()

if __name__ == "__main__":
    main() 