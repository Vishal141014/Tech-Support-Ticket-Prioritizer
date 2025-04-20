import re
import nltk
import pandas as pd
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer

# Download required NLTK resources
def download_nltk_resources():
    resources = ['punkt', 'stopwords', 'wordnet']
    for resource in resources:
        try:
            nltk.data.find(f'tokenizers/{resource}')
        except LookupError:
            nltk.download(resource)

class TextPreprocessor:
    def __init__(self, language='english'):
        download_nltk_resources()
        self.stop_words = set(stopwords.words(language))
        self.lemmatizer = WordNetLemmatizer()
    
    def preprocess(self, text):
        """
        Preprocess text by:
        1. Converting to lowercase
        2. Removing special characters and digits
        3. Tokenizing
        4. Removing stopwords
        5. Lemmatizing
        """
        if not isinstance(text, str):
            return ""
            
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters and digits
        text = re.sub(r'[^\w\s]', '', text)
        text = re.sub(r'\d+', '', text)
        
        # Tokenize
        tokens = word_tokenize(text)
        
        # Remove stopwords and lemmatize
        cleaned_tokens = [
            self.lemmatizer.lemmatize(token) 
            for token in tokens 
            if token not in self.stop_words
        ]
        
        return " ".join(cleaned_tokens)
    
    def preprocess_df(self, df, text_column):
        """Apply preprocessing to a dataframe column"""
        df_copy = df.copy()
        df_copy['processed_text'] = df_copy[text_column].apply(self.preprocess)
        return df_copy

class MultilingualPreprocessor:
    def __init__(self):
        # Initialize with English as default
        self.english_preprocessor = TextPreprocessor('english')
        
        # Language detection will be used to route to the right preprocessor
        # For simplicity, we're assuming language is provided in the data
    
    def preprocess(self, text, language='en'):
        """
        Preprocess text based on language
        Currently simplistic - in production would use more language-specific tools
        """
        # For now, use the English preprocessor for everything
        # In a real system, we'd use language-specific tools or a multilingual model
        return self.english_preprocessor.preprocess(text)
    
    def preprocess_df(self, df, text_column, language_column=None):
        """
        Apply preprocessing to a dataframe with optional language column
        If language_column is provided, use language-specific preprocessing
        """
        df_copy = df.copy()
        
        if language_column and language_column in df_copy.columns:
            # Apply language-specific preprocessing
            df_copy['processed_text'] = df_copy.apply(
                lambda row: self.preprocess(row[text_column], row[language_column]), 
                axis=1
            )
        else:
            # Apply default English preprocessing
            df_copy['processed_text'] = df_copy[text_column].apply(
                lambda text: self.preprocess(text)
            )
            
        return df_copy 