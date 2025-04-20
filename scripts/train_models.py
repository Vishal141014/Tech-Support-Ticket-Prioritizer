import os
import sys
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split

# Add parent directory to path to import utils
sys.path.append(str(Path(__file__).resolve().parent.parent))

from utils.model import TicketClassifier
from utils.transformer_model import TransformerTicketClassifier

def main(use_transformer=False):
    """
    Train classification models on the processed data
    
    Args:
        use_transformer: Whether to use transformer models instead of traditional ML
    """
    print("Starting model training...")
    
    # Paths
    base_dir = Path(__file__).resolve().parent.parent
    data_dir = os.path.join(base_dir, "data")
    model_dir = os.path.join(base_dir, "models")
    
    # Ensure model directory exists
    os.makedirs(model_dir, exist_ok=True)
    
    # Look for the combined dataset first
    combined_path = os.path.join(data_dir, "combined_dataset.csv")
    
    if os.path.exists(combined_path):
        print("Using combined dataset")
        df = pd.read_csv(combined_path)
    else:
        # Look for processed datasets
        processed_files = [f for f in os.listdir(data_dir) if f.startswith("processed_")]
        
        if not processed_files:
            print("No processed datasets found. Please run preprocess.py first.")
            return
        
        print(f"Using first processed dataset: {processed_files[0]}")
        df = pd.read_csv(os.path.join(data_dir, processed_files[0]))
    
    # Check if dataset has the required columns
    required_columns = ['processed_text']
    if not all(col in df.columns for col in required_columns):
        print(f"Dataset missing required columns: {required_columns}")
        return
    
    # Check if we have labels for training
    has_category = 'category' in df.columns and not df['category'].isna().all()
    has_priority = 'priority' in df.columns and not df['priority'].isna().all()
    
    if not has_category and not has_priority:
        print("No label columns found for training")
        return
    
    # Prepare features and labels
    X = df['processed_text']
    
    # Handle missing values in labels
    if has_category:
        y_category = df['category'].fillna('unknown')
    else:
        y_category = None
        
    if has_priority:
        y_priority = df['priority'].fillna('medium')
    else:
        y_priority = None
    
    # Split data
    test_size = 0.2
    random_state = 42
    
    if has_category and has_priority:
        X_train, X_test, y_cat_train, y_cat_test, y_pri_train, y_pri_test = train_test_split(
            X, y_category, y_priority, test_size=test_size, random_state=random_state
        )
    elif has_category:
        X_train, X_test, y_cat_train, y_cat_test = train_test_split(
            X, y_category, test_size=test_size, random_state=random_state
        )
        y_pri_train, y_pri_test = None, None
    else:
        X_train, X_test, y_pri_train, y_pri_test = train_test_split(
            X, y_priority, test_size=test_size, random_state=random_state
        )
        y_cat_train, y_cat_test = None, None
    
    print(f"Training data shape: {X_train.shape}")
    print(f"Test data shape: {X_test.shape}")
    
    # Initialize classifier
    if use_transformer:
        print("Using transformer-based models")
        classifier = TransformerTicketClassifier(model_dir)
    else:
        print("Using traditional ML models")
        classifier = TicketClassifier(model_dir)
    
    # Train models
    if has_category:
        print("\nTraining category classifier...")
        if use_transformer:
            classifier.train_model(X_train, y_cat_train, model_type='category')
        else:
            classifier.train_category_model(X_train, y_cat_train)
    
    if has_priority:
        print("\nTraining priority classifier...")
        if use_transformer:
            classifier.train_model(X_train, y_pri_train, model_type='priority')
        else:
            classifier.train_priority_model(X_train, y_pri_train)
    
    # Evaluate models
    if has_category or has_priority:
        print("\nEvaluating models on test data:")
        if use_transformer:
            # For transformer models, save encoders before evaluation
            classifier.save_encoders()
        else:
            # Evaluate traditional ML models
            results = classifier.evaluate_models(
                X_test, 
                y_cat_test if has_category else None,
                y_pri_test if has_priority else None
            )
            
            # Print overall results
            if has_category:
                print(f"Category classifier accuracy: {results['category'].get('accuracy', 'N/A'):.4f}")
                print(f"Category classifier F1 score: {results['category'].get('f1_weighted', 'N/A'):.4f}")
            
            if has_priority:
                print(f"Priority classifier accuracy: {results['priority'].get('accuracy', 'N/A'):.4f}")
                print(f"Priority classifier F1 score: {results['priority'].get('f1_weighted', 'N/A'):.4f}")
    
    # Save models
    print("\nSaving models...")
    if use_transformer:
        classifier.save_encoders()
    else:
        classifier.save_models()
    
    print("Model training completed successfully")

if __name__ == "__main__":
    # Check if we should use transformer models
    use_transformer = "--transformer" in sys.argv
    main(use_transformer) 