import os
import sys
import pandas as pd
from pathlib import Path

# Add parent directory to path to import utils
sys.path.append(str(Path(__file__).resolve().parent.parent))

from utils.data_loader import DataLoader
from utils.preprocessor import TextPreprocessor, MultilingualPreprocessor

def main():
    """
    Preprocess all datasets in the data directory
    """
    print("Starting data preprocessing...")
    
    # Initialize data loader
    data_dir = os.path.join(Path(__file__).resolve().parent.parent, "data")
    loader = DataLoader(data_dir)
    
    # Load datasets
    datasets = loader.load_all_datasets()
    
    if not datasets:
        print("No datasets found in the data directory")
        return
    
    print(f"Loaded {len(datasets)} datasets")
    
    # Initialize preprocessors
    text_preprocessor = TextPreprocessor()
    multilingual_preprocessor = MultilingualPreprocessor()
    
    # Process each dataset
    processed_datasets = {}
    
    for name, df in datasets.items():
        print(f"\nProcessing dataset: {name}")
        
        # Skip empty datasets
        if df.empty:
            print(f"Dataset {name} is empty, skipping")
            continue
        
        # Determine if dataset has language column
        has_language = 'language' in df.columns
        
        # Display dataset info
        print(f"Dataset shape: {df.shape}")
        print(f"Columns: {', '.join(df.columns)}")
        
        # Determine text column
        text_column = None
        for col in ['text', 'description', 'subject']:
            if col in df.columns:
                text_column = col
                break
        
        if not text_column:
            print(f"No text column found in dataset {name}, skipping")
            continue
            
        print(f"Using '{text_column}' as text column")
        
        # Preprocess text data
        if has_language:
            print("Using multilingual preprocessor")
            processed_df = multilingual_preprocessor.preprocess_df(
                df, text_column=text_column, language_column='language'
            )
        else:
            print("Using English preprocessor")
            processed_df = text_preprocessor.preprocess_df(df, text_column)
        
        # Save processed dataset
        processed_name = f"processed_{name}"
        processed_path = os.path.join(data_dir, processed_name)
        
        # Save as CSV
        processed_df.to_csv(processed_path, index=False)
        print(f"Saved processed dataset to {processed_path}")
        
        # Store for later use
        processed_datasets[processed_name] = processed_df
    
    # Combine datasets if multiple are available
    if len(processed_datasets) > 1:
        print("\nCombining processed datasets...")
        
        dataframes = list(processed_datasets.values())
        text_columns = ['processed_text'] * len(dataframes)
        
        try:
            combined_df = loader.combine_datasets(dataframes, text_columns)
            
            # Save combined dataset
            combined_path = os.path.join(data_dir, "combined_dataset.csv")
            combined_df.to_csv(combined_path, index=False)
            
            print(f"Saved combined dataset to {combined_path}")
            print(f"Combined dataset shape: {combined_df.shape}")
        except Exception as e:
            print(f"Error combining datasets: {e}")
    
    print("\nPreprocessing completed successfully")

if __name__ == "__main__":
    main() 