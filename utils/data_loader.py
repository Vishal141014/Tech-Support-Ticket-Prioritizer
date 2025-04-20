import os
import json
import pandas as pd
from typing import Dict, List, Union, Optional

class DataLoader:
    def __init__(self, data_dir: str):
        """
        Initialize the data loader with the directory containing datasets
        
        Args:
            data_dir: Path to the directory containing data files
        """
        self.data_dir = data_dir
    
    def load_csv(self, filename: str) -> pd.DataFrame:
        """
        Load data from a CSV file
        
        Args:
            filename: Name of the CSV file in the data directory
            
        Returns:
            DataFrame containing the CSV data
        """
        filepath = os.path.join(self.data_dir, filename)
        return pd.read_csv(filepath)
    
    def load_json(self, filename: str) -> Union[Dict, List]:
        """
        Load data from a JSON file
        
        Args:
            filename: Name of the JSON file in the data directory
            
        Returns:
            Dictionary or List containing the JSON data
        """
        filepath = os.path.join(self.data_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def json_to_dataframe(self, json_data: List[Dict], 
                         text_field: str = 'description',
                         id_field: str = 'ticket_id') -> pd.DataFrame:
        """
        Convert JSON data to a DataFrame focused on text and ID
        
        Args:
            json_data: List of dictionaries containing ticket data
            text_field: Field name containing the ticket text
            id_field: Field name containing the ticket ID
            
        Returns:
            DataFrame with the extracted fields
        """
        # Extract relevant fields
        records = []
        
        for item in json_data:
            record = {
                'ticket_id': item.get(id_field, ''),
                'text': item.get(text_field, '')
            }
            
            # Include subject if available
            if 'subject' in item:
                record['subject'] = item.get('subject', '')
            
            # Extract customer info if available
            if 'customer' in item and isinstance(item['customer'], dict):
                customer = item['customer']
                record['customer_id'] = customer.get('id', '')
                record['customer_name'] = customer.get('name', '')
                record['account_tier'] = customer.get('account_tier', '')
            
            # Extract product info if available
            if 'product' in item:
                record['product'] = item.get('product', '')
            
            # Extract timestamp if available
            if 'timestamp' in item:
                record['timestamp'] = item.get('timestamp', '')
            
            records.append(record)
        
        return pd.DataFrame(records)
    
    def load_all_datasets(self) -> Dict[str, pd.DataFrame]:
        """
        Load all available datasets in the data directory
        
        Returns:
            Dictionary mapping dataset names to DataFrames
        """
        datasets = {}
        
        # List all files in the data directory
        for file in os.listdir(self.data_dir):
            filepath = os.path.join(self.data_dir, file)
            
            # Skip directories
            if os.path.isdir(filepath):
                continue
                
            if file.endswith('.csv'):
                # Load CSV files
                try:
                    datasets[file] = self.load_csv(file)
                except Exception as e:
                    print(f"Error loading {file}: {e}")
            
            elif file.endswith('.json'):
                # Load JSON files and convert to DataFrame
                try:
                    json_data = self.load_json(file)
                    if isinstance(json_data, list):
                        datasets[file] = self.json_to_dataframe(json_data)
                    else:
                        print(f"Warning: {file} does not contain a list of records")
                except Exception as e:
                    print(f"Error loading {file}: {e}")
        
        return datasets
    
    def combine_datasets(self, dataframes: List[pd.DataFrame], 
                         text_columns: List[str]) -> pd.DataFrame:
        """
        Combine multiple dataframes with potentially different columns
        
        Args:
            dataframes: List of dataframes to combine
            text_columns: List of column names containing text (one per dataframe)
            
        Returns:
            Combined DataFrame with standardized columns
        """
        if len(dataframes) != len(text_columns):
            raise ValueError("Number of dataframes must match number of text columns")
        
        combined_data = []
        
        for df, text_col in zip(dataframes, text_columns):
            # Create a copy to avoid modifying the original
            temp_df = df.copy()
            
            # Ensure 'text' column exists
            if text_col != 'text':
                temp_df['text'] = temp_df[text_col]
            
            # Select common columns or add them if missing
            for col in ['ticket_id', 'text', 'category', 'priority', 'language']:
                if col not in temp_df.columns:
                    if col == 'language':
                        temp_df[col] = 'en'  # Default language
                    elif col in ['category', 'priority']:
                        temp_df[col] = None  # Will be predicted
                    elif col == 'ticket_id' and 'id' in temp_df.columns:
                        temp_df['ticket_id'] = temp_df['id']
                    else:
                        temp_df[col] = ''
            
            combined_data.append(temp_df)
        
        # Concatenate all dataframes
        return pd.concat(combined_data, ignore_index=True) 