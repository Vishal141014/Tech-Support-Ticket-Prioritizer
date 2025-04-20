import os
import sys

# Try to import torch and transformers, but make them optional
try:
    import torch
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    print("Warning: PyTorch/Transformers not available. Falling back to traditional models.")

import numpy as np
import pandas as pd
from typing import Dict, List, Union, Tuple, Optional
from transformers import pipeline
from transformers import Trainer, TrainingArguments
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, f1_score, classification_report
import joblib
from datasets import Dataset

class TransformerTicketClassifier:
    """
    Classifier using transformer-based models for ticket classification
    """
    
    def __init__(self, model_dir):
        """
        Initialize the classifier with model directory
        """
        self.model_dir = model_dir
        self.category_model = None
        self.priority_model = None
        self.category_tokenizer = None 
        self.priority_tokenizer = None
        self._models_loaded = False
        
    def models_loaded(self):
        """Check if models are loaded"""
        return self._models_loaded
        
    def load_models(self):
        """
        Load transformer models for category and priority prediction
        """
        if not TRANSFORMERS_AVAILABLE:
            print("Transformers not available. Cannot load models.")
            return False
            
        try:
            # Paths to models
            category_model_path = os.path.join(self.model_dir, "transformer_category")
            priority_model_path = os.path.join(self.model_dir, "transformer_priority")
            
            # Check if models exist
            if not (os.path.exists(category_model_path) and os.path.exists(priority_model_path)):
                print("Transformer models not found.")
                return False
                
            # Load tokenizers and models
            try:
                self.category_tokenizer = AutoTokenizer.from_pretrained(category_model_path)
                self.category_model = AutoModelForSequenceClassification.from_pretrained(category_model_path)
                
                self.priority_tokenizer = AutoTokenizer.from_pretrained(priority_model_path)
                self.priority_model = AutoModelForSequenceClassification.from_pretrained(priority_model_path)
                
                # Set models to evaluation mode
                self.category_model.eval()
                self.priority_model.eval()
                
                self._models_loaded = True
                return True
            except Exception as e:
                print(f"Error loading pre-trained models: {e}")
                return False
            
        except Exception as e:
            print(f"Error loading transformer models: {e}")
            return False
            
    def predict(self, texts):
        """
        Predict category and priority for a list of texts
        """
        if not TRANSFORMERS_AVAILABLE or not self._models_loaded:
            # Return dummy results for demo purposes
            categories = ["bug", "feature", "query"]
            priorities = ["low", "medium", "high", "critical"]
            
            import random
            return {
                "category": [random.choice(categories) for _ in texts],
                "priority": [random.choice(priorities) for _ in texts]
            }
            
        try:
            # Ensure all texts are strings
            texts = [str(text) for text in texts]
            
            # Prepare results
            results = {
                "category": [],
                "priority": []
            }
            
            # Get predictions for each text
            for text in texts:
                # Category prediction
                inputs = self.category_tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
                with torch.no_grad():
                    outputs = self.category_model(**inputs)
                    category_scores = outputs.logits.softmax(dim=1)
                    category_id = category_scores.argmax().item()
                    category = self.category_model.config.id2label[category_id]
                
                # Priority prediction  
                inputs = self.priority_tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
                with torch.no_grad():
                    outputs = self.priority_model(**inputs)
                    priority_scores = outputs.logits.softmax(dim=1)
                    priority_id = priority_scores.argmax().item()
                    priority = self.priority_model.config.id2label[priority_id]
                
                # Add to results
                results["category"].append(category)
                results["priority"].append(priority)
                
            return results
            
        except Exception as e:
            print(f"Error in transformer prediction: {e}")
            # Return fallback results in case of error
            import random
            categories = ["bug", "feature", "query"]
            priorities = ["low", "medium", "high", "critical"]
            return {
                "category": [random.choice(categories) for _ in texts],
                "priority": [random.choice(priorities) for _ in texts]
            }
    
    def encode_labels(self, labels: pd.Series, encoder_type: str = 'category') -> np.ndarray:
        """
        Encode labels using the appropriate encoder
        
        Args:
            labels: Series of labels to encode
            encoder_type: Type of encoder to use ('category' or 'priority')
        
        Returns:
            Encoded labels as numpy array
        """
        if encoder_type == 'category':
            return self.category_encoder.fit_transform(labels)
        else:  # priority
            return self.priority_encoder.fit_transform(labels)
    
    def prepare_dataset(self, texts: pd.Series, labels: np.ndarray) -> Dataset:
        """
        Prepare a HuggingFace Dataset from text and labels
        
        Args:
            texts: Series of text data
            labels: Array of encoded labels
        
        Returns:
            HuggingFace Dataset
        """
        # Create a dataset from pandas
        dataset_dict = {
            'text': texts.tolist(),
            'label': labels.tolist()
        }
        
        return Dataset.from_dict(dataset_dict)
    
    def tokenize_function(self, examples):
        """Tokenize examples for transformer model"""
        return self.tokenizer(
            examples['text'],
            padding="max_length",
            truncation=True,
            max_length=512  # Adjust as needed
        )
    
    def train_model(self, texts: pd.Series, labels: pd.Series, model_type: str = 'category') -> None:
        """
        Train a transformer model for either category or priority prediction
        
        Args:
            texts: Training text data
            labels: Training labels
            model_type: Type of model to train ('category' or 'priority')
        """
        # Encode labels
        if model_type == 'category':
            encoded_labels = self.encode_labels(labels, 'category')
            num_labels = len(self.category_encoder.classes_)
            model_path = os.path.join(self.model_dir, 'category_transformer')
        else:  # priority
            encoded_labels = self.encode_labels(labels, 'priority')
            num_labels = len(self.priority_encoder.classes_)
            model_path = os.path.join(self.model_dir, 'priority_transformer')
        
        # Prepare dataset
        dataset = self.prepare_dataset(texts, encoded_labels)
        
        # Tokenize dataset
        tokenized_dataset = dataset.map(
            self.tokenize_function,
            batched=True
        )
        
        # Load pretrained model
        model = AutoModelForSequenceClassification.from_pretrained(
            self.model_name,
            num_labels=num_labels
        )
        
        # Define training arguments (adjust as needed)
        training_args = TrainingArguments(
            output_dir=model_path,
            per_device_train_batch_size=8,
            num_train_epochs=3,
            learning_rate=5e-5,
            weight_decay=0.01,
            save_strategy="epoch",
            evaluation_strategy="no",
            load_best_model_at_end=False,
        )
        
        # Initialize trainer
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=tokenized_dataset,
        )
        
        # Train the model
        trainer.train()
        
        # Save the model
        trainer.save_model(model_path)
        
        # Store the trained model in the appropriate attribute
        if model_type == 'category':
            self.category_model = model_path
        else:  # priority
            self.priority_model = model_path
    
    def save_encoders(self) -> None:
        """Save label encoders to disk"""
        joblib.dump(self.category_encoder, os.path.join(self.model_dir, 'category_encoder_transformer.pkl'))
        joblib.dump(self.priority_encoder, os.path.join(self.model_dir, 'priority_encoder_transformer.pkl'))
    
    def load_encoders(self) -> bool:
        """
        Load label encoders from disk
        
        Returns:
            True if encoders were loaded successfully, False otherwise
        """
        try:
            self.category_encoder = joblib.load(os.path.join(self.model_dir, 'category_encoder_transformer.pkl'))
            self.priority_encoder = joblib.load(os.path.join(self.model_dir, 'priority_encoder_transformer.pkl'))
            return True
        except Exception as e:
            print(f"Error loading encoders: {e}")
            return False
            
    def init_tokenizer(self):
        """Initialize tokenizer from pretrained model"""
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
    
    def init_encoders(self):
        """Initialize label encoders"""
        self.category_encoder = LabelEncoder()
        self.priority_encoder = LabelEncoder()
    
    def init_model(self, model_name: str = "distilbert-base-multilingual-cased"):
        """
        Initialize the transformer-based ticket classifier
        
        Args:
            model_name: Pretrained model name (default: distilbert-base-multilingual-cased)
        """
        self.model_name = model_name
        self.tokenizer = None
        self.category_model = None
        self.priority_model = None
        self.category_encoder = LabelEncoder()
        self.priority_encoder = LabelEncoder()
        self._models_loaded = False
        
        # Create model directory if it doesn't exist
        os.makedirs(self.model_dir, exist_ok=True)
        
        # Initialize tokenizer
        self.init_tokenizer()
        self.init_encoders()
    
    def train_model(self, texts: pd.Series, labels: pd.Series, model_type: str = 'category') -> None:
        """
        Train a transformer model for either category or priority prediction
        
        Args:
            texts: Training text data
            labels: Training labels
            model_type: Type of model to train ('category' or 'priority')
        """
        # Encode labels
        if model_type == 'category':
            encoded_labels = self.encode_labels(labels, 'category')
            num_labels = len(self.category_encoder.classes_)
            model_path = os.path.join(self.model_dir, 'category_transformer')
        else:  # priority
            encoded_labels = self.encode_labels(labels, 'priority')
            num_labels = len(self.priority_encoder.classes_)
            model_path = os.path.join(self.model_dir, 'priority_transformer')
        
        # Prepare dataset
        dataset = self.prepare_dataset(texts, encoded_labels)
        
        # Tokenize dataset
        tokenized_dataset = dataset.map(
            self.tokenize_function,
            batched=True
        )
        
        # Load pretrained model
        model = AutoModelForSequenceClassification.from_pretrained(
            self.model_name,
            num_labels=num_labels
        )
        
        # Define training arguments (adjust as needed)
        training_args = TrainingArguments(
            output_dir=model_path,
            per_device_train_batch_size=8,
            num_train_epochs=3,
            learning_rate=5e-5,
            weight_decay=0.01,
            save_strategy="epoch",
            evaluation_strategy="no",
            load_best_model_at_end=False,
        )
        
        # Initialize trainer
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=tokenized_dataset,
        )
        
        # Train the model
        trainer.train()
        
        # Save the model
        trainer.save_model(model_path)
        
        # Store the trained model in the appropriate attribute
        if model_type == 'category':
            self.category_model = model_path
        else:  # priority
            self.priority_model = model_path
    
    def predict(self, texts: List[str]) -> Dict[str, List[str]]:
        """
        Predict category and priority for texts
        
        Args:
            texts: List of ticket texts to classify
            
        Returns:
            Dictionary with predictions
        """
        if not TRANSFORMERS_AVAILABLE or not self._models_loaded:
            return {"error": "Models not loaded or transformers not available"}
        
        try:
            # Ensure all texts are strings
            texts = [str(text) for text in texts]
            
            # Prepare results
            results = {
                "category": [],
                "priority": []
            }
            
            # Get predictions for each text
            for text in texts:
                # Category prediction
                inputs = self.tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
                with torch.no_grad():
                    outputs = self.category_model(**inputs)
                    category_scores = outputs.logits.softmax(dim=1)
                    category_id = category_scores.argmax().item()
                    category = self.category_model.config.id2label[category_id]
                
                # Priority prediction  
                inputs = self.tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
                with torch.no_grad():
                    outputs = self.priority_model(**inputs)
                    priority_scores = outputs.logits.softmax(dim=1)
                    priority_id = priority_scores.argmax().item()
                    priority = self.priority_model.config.id2label[priority_id]
                
                # Add to results
                results["category"].append(category)
                results["priority"].append(priority)
                
            return results
            
        except Exception as e:
            print(f"Error in transformer prediction: {e}")
            return {"error": str(e)} 