import os
import numpy as np
import pandas as pd
import joblib
from typing import Dict, List, Union, Tuple, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.multiclass import OneVsRestClassifier
from sklearn.svm import LinearSVC
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score, f1_score
from sklearn.preprocessing import LabelEncoder

class TicketClassifier:
    def __init__(self, model_dir: str):
        """
        Initialize the ticket classifier
        
        Args:
            model_dir: Directory to save/load models
        """
        self.model_dir = model_dir
        self.category_model = None
        self.priority_model = None
        self.category_encoder = LabelEncoder()
        self.priority_encoder = LabelEncoder()
        
        # Create model directory if it doesn't exist
        os.makedirs(model_dir, exist_ok=True)
    
    def train_category_model(self, X_train: pd.Series, y_train: pd.Series) -> None:
        """
        Train the category classification model
        
        Args:
            X_train: Training text data
            y_train: Training category labels
        """
        # Encode category labels
        y_encoded = self.category_encoder.fit_transform(y_train)
        
        # Create and train the pipeline
        self.category_model = Pipeline([
            ('vectorizer', TfidfVectorizer(max_features=10000, ngram_range=(1, 2))),
            ('classifier', OneVsRestClassifier(LinearSVC(C=1.0)))
        ])
        
        self.category_model.fit(X_train, y_encoded)
    
    def train_priority_model(self, X_train: pd.Series, y_train: pd.Series) -> None:
        """
        Train the priority prediction model
        
        Args:
            X_train: Training text data
            y_train: Training priority labels
        """
        # Encode priority labels
        y_encoded = self.priority_encoder.fit_transform(y_train)
        
        # Create and train the pipeline
        self.priority_model = Pipeline([
            ('vectorizer', TfidfVectorizer(max_features=5000, ngram_range=(1, 2))),
            ('classifier', LogisticRegression(max_iter=1000))
        ])
        
        self.priority_model.fit(X_train, y_encoded)
    
    def evaluate_models(self, X_test: pd.Series, y_category_test: pd.Series, 
                       y_priority_test: pd.Series) -> Dict[str, Dict[str, float]]:
        """
        Evaluate both models on test data
        
        Args:
            X_test: Test text data
            y_category_test: Test category labels
            y_priority_test: Test priority labels
            
        Returns:
            Dictionary with evaluation metrics
        """
        results = {
            'category': {},
            'priority': {}
        }
        
        # Evaluate category model
        if self.category_model:
            y_cat_encoded = self.category_encoder.transform(y_category_test)
            y_cat_pred = self.category_model.predict(X_test)
            
            results['category']['accuracy'] = accuracy_score(y_cat_encoded, y_cat_pred)
            results['category']['f1_weighted'] = f1_score(y_cat_encoded, y_cat_pred, average='weighted')
            
            # Decode predictions for the report
            y_cat_pred_decoded = self.category_encoder.inverse_transform(y_cat_pred)
            print("\nCategory Classification Report:")
            print(classification_report(y_category_test, y_cat_pred_decoded))
        
        # Evaluate priority model
        if self.priority_model:
            y_pri_encoded = self.priority_encoder.transform(y_priority_test)
            y_pri_pred = self.priority_model.predict(X_test)
            
            results['priority']['accuracy'] = accuracy_score(y_pri_encoded, y_pri_pred)
            results['priority']['f1_weighted'] = f1_score(y_pri_encoded, y_pri_pred, average='weighted')
            
            # Decode predictions for the report
            y_pri_pred_decoded = self.priority_encoder.inverse_transform(y_pri_pred)
            print("\nPriority Classification Report:")
            print(classification_report(y_priority_test, y_pri_pred_decoded))
        
        return results
    
    def predict(self, texts: List[str]) -> Dict[str, List[str]]:
        """
        Predict category and priority for texts
        
        Args:
            texts: List of ticket texts to classify
            
        Returns:
            Dictionary with predictions
        """
        results = {
            'category': [],
            'priority': []
        }
        
        # Make category predictions
        if self.category_model:
            category_preds = self.category_model.predict(texts)
            category_labels = self.category_encoder.inverse_transform(category_preds)
            results['category'] = category_labels.tolist()
        
        # Make priority predictions
        if self.priority_model:
            priority_preds = self.priority_model.predict(texts)
            priority_labels = self.priority_encoder.inverse_transform(priority_preds)
            results['priority'] = priority_labels.tolist()
        
        return results
    
    def save_models(self) -> None:
        """Save trained models to disk"""
        if self.category_model:
            joblib.dump(self.category_model, os.path.join(self.model_dir, 'category_model.pkl'))
            joblib.dump(self.category_encoder, os.path.join(self.model_dir, 'category_encoder.pkl'))
        
        if self.priority_model:
            joblib.dump(self.priority_model, os.path.join(self.model_dir, 'priority_model.pkl'))
            joblib.dump(self.priority_encoder, os.path.join(self.model_dir, 'priority_encoder.pkl'))
    
    def load_models(self) -> bool:
        """
        Load trained models from disk
        
        Returns:
            True if both models were loaded successfully, False otherwise
        """
        try:
            self.category_model = joblib.load(os.path.join(self.model_dir, 'category_model.pkl'))
            self.category_encoder = joblib.load(os.path.join(self.model_dir, 'category_encoder.pkl'))
            self.priority_model = joblib.load(os.path.join(self.model_dir, 'priority_model.pkl'))
            self.priority_encoder = joblib.load(os.path.join(self.model_dir, 'priority_encoder.pkl'))
            return True
        except Exception as e:
            print(f"Error loading models: {e}")
            return False

    def create_dummy_models(self) -> None:
        """
        Create dummy models for testing when real models are not available.
        This sets up basic models that return fixed categories and priorities.
        """
        print("Creating dummy models for testing...")
        
        # Set up basic categories and priorities
        categories = ['bug', 'feature', 'query', 'general']
        priorities = ['low', 'medium', 'high', 'critical']
        
        # Fit encoders with categories and priorities
        self.category_encoder.fit(categories)
        self.priority_encoder.fit(priorities)
        
        # Create a simple TF-IDF vectorizer and classifier pipeline
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.multiclass import OneVsRestClassifier
        from sklearn.svm import LinearSVC
        from sklearn.pipeline import Pipeline
        
        # Simple dummy models
        self.category_model = Pipeline([
            ('vectorizer', TfidfVectorizer(max_features=10, ngram_range=(1, 1))),
            ('classifier', OneVsRestClassifier(LinearSVC(C=1.0)))
        ])
        
        self.priority_model = Pipeline([
            ('vectorizer', TfidfVectorizer(max_features=10, ngram_range=(1, 1))),
            ('classifier', OneVsRestClassifier(LinearSVC(C=1.0)))
        ])
        
        # Train models with dummy data
        dummy_texts = [
            "Application crashing when saving", 
            "Please add dark mode feature",
            "How do I reset my password?",
            "Thanks for your help"
        ]
        
        # Use simple categories and priorities for training
        dummy_categories = self.category_encoder.transform(categories)
        dummy_priorities = self.priority_encoder.transform(priorities)
        
        # Fit dummy models
        self.category_model.fit(dummy_texts, dummy_categories)
        self.priority_model.fit(dummy_texts, dummy_priorities)
        
        # Save models
        self.save_models()
        
        print("Dummy models created and saved successfully")
        return True 