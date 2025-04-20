import os
import sys
import uuid
from pathlib import Path
import pandas as pd
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import random
from datetime import datetime

# Add parent directory to path to import utils
sys.path.append(str(Path(__file__).resolve().parent.parent))

from utils.model import TicketClassifier
from utils.transformer_model import TransformerTicketClassifier
from utils.preprocessor import TextPreprocessor, MultilingualPreprocessor
from api.models import (
    TicketRequest, 
    TicketResponse, 
    PredictionRequest, 
    PredictionResponse,
    TicketBatchRequest,
    TicketBatchResponse,
    ErrorResponse,
    ChatRequest,
    ChatResponse,
    SuggestionRequest,
    SuggestionResponse,
    FeedbackRequest
)

# Initialize FastAPI app
app = FastAPI(
    title="Tech Support Ticket Prioritizer API",
    description="API for classifying and prioritizing support tickets",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = os.path.join(BASE_DIR, "models")
DATA_DIR = os.path.join(BASE_DIR, "data")
OUTPUT_FILE = os.path.join(DATA_DIR, "predictions.csv")
CHAT_LOG_FILE = os.path.join(DATA_DIR, "chat_history.csv")

# Initialize preprocessors
text_preprocessor = TextPreprocessor()
multilingual_preprocessor = MultilingualPreprocessor()

# Initialize classifier with traditional ML models by default
classifier = TicketClassifier(MODEL_DIR)
transformer_available = False

# Try loading traditional models
try:
    if classifier.load_models():
        print("Traditional ML models loaded successfully")
    else:
        print("No trained models found. Creating dummy models for testing.")
        classifier.create_dummy_models()
except Exception as e:
    print(f"Could not load models: {e}")
    print("Creating dummy models for testing...")
    classifier.create_dummy_models()

# Helper function to preprocess text
def preprocess_text(text: str, language: str = "en") -> str:
    """Preprocess text for prediction"""
    if language != "en":
        # Use multilingual preprocessor for non-English text
        return multilingual_preprocessor.preprocess(text, language)
    else:
        # Use English preprocessor for English text
        return text_preprocessor.preprocess(text)

# Helper function to get predictions
def get_predictions(text: str, language: str = "en") -> dict:
    """Get category and priority predictions for text"""
    # Preprocess text
    processed_text = preprocess_text(text, language)
    
    # Check if processed text is empty
    if not processed_text:
        processed_text = text.lower()  # Fallback to minimally processed text
    
    # Use models for prediction
    result = classifier.predict([processed_text])
    
    # Extract predictions
    category = result.get('category', ['unknown'])[0]
    priority = result.get('priority', ['medium'])[0]
    
    # Create dummy confidence scores (real confidence would come from the model)
    confidence = {
        "category": 0.85,
        "priority": 0.78
    }
    
    return {
        "category": category,
        "priority": priority,
        "confidence": confidence
    }

# Helper function to save predictions to CSV
def save_prediction_to_csv(ticket_data: dict):
    """Save prediction to CSV file"""
    try:
        # Create or load existing predictions CSV
        if os.path.exists(OUTPUT_FILE):
            predictions_df = pd.read_csv(OUTPUT_FILE)
        else:
            predictions_df = pd.DataFrame(columns=[
                'ticket_id', 'text', 'subject', 'category', 'priority', 
                'customer_id', 'customer_name', 'product', 'language'
            ])
        
        # Append new prediction
        new_row = pd.DataFrame([ticket_data])
        predictions_df = pd.concat([predictions_df, new_row], ignore_index=True)
        
        # Save to CSV
        predictions_df.to_csv(OUTPUT_FILE, index=False)
    except Exception as e:
        print(f"Error saving prediction to CSV: {e}")

# Helper function to save chat history to CSV
def save_chat_to_csv(chat_data: dict):
    """Save chat interaction to CSV file"""
    try:
        # Create or load existing chat history CSV
        if os.path.exists(CHAT_LOG_FILE):
            chat_df = pd.read_csv(CHAT_LOG_FILE)
        else:
            chat_df = pd.DataFrame(columns=[
                'session_id', 'message_id', 'timestamp', 'user_message',
                'bot_response', 'category', 'priority', 'language'
            ])
        
        # Append new chat
        new_row = pd.DataFrame([chat_data])
        chat_df = pd.concat([chat_df, new_row], ignore_index=True)
        
        # Save to CSV
        chat_df.to_csv(CHAT_LOG_FILE, index=False)
    except Exception as e:
        print(f"Error saving chat to CSV: {e}")

# Generate chat response based on user message and model predictions
def generate_chat_response(message: str, language: str = "en") -> dict:
    """Generate chat response using the model predictions"""
    # Get category and priority predictions
    predictions = get_predictions(message, language)
    category = predictions["category"]
    priority = predictions["priority"]
    
    # Generate response based on category
    if category == "bug":
        responses = [
            f"I've identified your issue as a potential bug. Based on our analysis, it's a {priority} priority item.",
            f"This appears to be a bug in our system. Our AI has classified it as {priority} priority.",
            f"I understand you're experiencing a technical issue. Let me help troubleshoot this {priority} priority bug."
        ]
    elif category == "feature":
        responses = [
            f"Thanks for the feature suggestion! Our system has categorized this as a {priority} priority request.",
            f"I appreciate your input on new functionality. This has been classified as a {priority} priority feature request.",
            f"Your feature idea has been noted with {priority} priority. Would you like to provide more details?"
        ]
    elif category == "query":
        responses = [
            f"I'd be happy to answer your question. Our system has classified this as a {priority} priority query.",
            f"Let me help you with that question. Based on our analysis, this is a {priority} priority item.",
            f"I understand you have a question. I'll assist you with this {priority} priority query right away."
        ]
    else:
        responses = [
            f"Thank you for reaching out. I've categorized your message as {category} with {priority} priority.",
            f"I've received your message and classified it as {category} with {priority} priority. How can I help further?",
            f"I'm here to help with your {category} issue, which has been assigned {priority} priority."
        ]
    
    # Randomly select a response
    response = random.choice(responses)
    
    # Generate follow-up questions/suggestions
    if category == "bug":
        suggestions = [
            "Can you provide steps to reproduce this issue?",
            "What version of the software are you using?",
            "Did this issue start happening after a recent update?"
        ]
    elif category == "feature":
        suggestions = [
            "How would this feature benefit your workflow?",
            "Are there similar features in other products you've used?",
            "Would you like to submit a detailed feature request?"
        ]
    elif category == "query":
        suggestions = [
            "Is there anything specific about this you'd like to know?",
            "Would you like me to provide documentation links?",
            "Do you need step-by-step instructions?"
        ]
    else:
        suggestions = [
            "Would you like to create a support ticket?",
            "Is there anything else you'd like to know?",
            "Can I help with anything else?"
        ]
    
    # Determine if a ticket should be created based on priority
    create_ticket = priority in ["high", "critical"]
    
    return {
        "message": response,
        "category": category,
        "priority": priority,
        "suggestions": random.sample(suggestions, min(2, len(suggestions))),
        "create_ticket": create_ticket
    }

@app.get("/")
async def root():
    """API root endpoint"""
    return {"message": "Tech Support Ticket Prioritizer API", "status": "active"}

@app.post("/api/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """
    Predict category and priority for text
    """
    try:
        result = get_predictions(request.text, request.language)
        return PredictionResponse(
            category=result["category"],
            priority=result["priority"],
            confidence=result["confidence"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction error: {str(e)}"
        )

@app.post("/api/tickets", response_model=TicketResponse)
async def submit_ticket(
    request: TicketRequest, 
    background_tasks: BackgroundTasks
):
    """
    Submit a new ticket and get predictions
    """
    try:
        # Generate a ticket ID
        ticket_id = f"T{uuid.uuid4().hex[:6].upper()}"
        
        # Get predictions
        result = get_predictions(request.text, request.language)
        
        # Prepare response
        response = TicketResponse(
            ticket_id=ticket_id,
            category=result["category"],
            priority=result["priority"],
            text=request.text,
            subject=request.subject
        )
        
        # Prepare data for saving
        ticket_data = {
            "ticket_id": ticket_id,
            "text": request.text,
            "subject": request.subject,
            "category": result["category"],
            "priority": result["priority"],
            "customer_id": request.customer_id,
            "customer_name": request.customer_name,
            "product": request.product,
            "language": request.language
        }
        
        # Save prediction in background
        background_tasks.add_task(save_prediction_to_csv, ticket_data)
        
        return response
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ticket submission error: {str(e)}"
        )

@app.post("/api/tickets/batch", response_model=TicketBatchResponse)
async def batch_process_tickets(
    request: TicketBatchRequest,
    background_tasks: BackgroundTasks
):
    """
    Process multiple tickets in batch
    """
    try:
        results = []
        batch_data = []
        
        for ticket_request in request.tickets:
            # Generate a ticket ID
            ticket_id = f"T{uuid.uuid4().hex[:6].upper()}"
            
            # Get predictions
            result = get_predictions(ticket_request.text, ticket_request.language)
            
            # Create response
            response = TicketResponse(
                ticket_id=ticket_id,
                category=result["category"],
                priority=result["priority"],
                text=ticket_request.text,
                subject=ticket_request.subject
            )
            results.append(response)
            
            # Prepare data for saving
            ticket_data = {
                "ticket_id": ticket_id,
                "text": ticket_request.text,
                "subject": ticket_request.subject,
                "category": result["category"],
                "priority": result["priority"],
                "customer_id": ticket_request.customer_id,
                "customer_name": ticket_request.customer_name,
                "product": ticket_request.product,
                "language": ticket_request.language
            }
            batch_data.append(ticket_data)
        
        # Save all predictions in background
        for ticket_data in batch_data:
            background_tasks.add_task(save_prediction_to_csv, ticket_data)
        
        return TicketBatchResponse(results=results)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Batch processing error: {str(e)}"
        )

@app.get("/api/health")
async def health_check():
    """
    Health check endpoint for API monitoring
    """
    return {"status": "ok", "message": "API is running"}

@app.post("/api/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    background_tasks: BackgroundTasks
):
    """
    Chat endpoint that uses the model to generate responses
    """
    try:
        # Generate message and session IDs
        message_id = f"M{uuid.uuid4().hex[:8]}"
        session_id = request.history[0].timestamp if request.history else f"S{uuid.uuid4().hex[:8]}"
        
        # Generate response using our trained model
        result = generate_chat_response(request.message, request.language)
        
        # Prepare response
        response = ChatResponse(
            message=result["message"],
            category=result["category"],
            priority=result["priority"],
            suggestions=result["suggestions"],
            create_ticket=result["create_ticket"]
        )
        
        # Prepare data for logging
        chat_data = {
            "session_id": session_id,
            "message_id": message_id,
            "timestamp": datetime.now().isoformat(),
            "user_message": request.message,
            "bot_response": result["message"],
            "category": result["category"],
            "priority": result["priority"],
            "language": request.language
        }
        
        # Save chat in background
        background_tasks.add_task(save_chat_to_csv, chat_data)
        
        return response
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Chat error: {str(e)}"
        )

@app.get("/api/chat/suggestions", response_model=SuggestionResponse)
async def get_suggestions(query: str):
    """
    Get suggested queries based on partial user input
    """
    try:
        # Simple predefined suggestions based on common prefixes
        suggestions = []
        
        query = query.lower()
        
        if query.startswith("how"):
            suggestions = [
                "How do I reset my password?",
                "How can I update my software?",
                "How to export data to PDF?",
                "How do I fix network connection issues?"
            ]
        elif query.startswith("why"):
            suggestions = [
                "Why is my application running slowly?",
                "Why am I getting error code 404?",
                "Why can't I login to my account?",
                "Why does my screen freeze during video calls?"
            ]
        elif query.startswith("what"):
            suggestions = [
                "What are the system requirements?",
                "What version am I running?",
                "What's the status of my ticket?",
                "What does this error message mean?"
            ]
        elif query.startswith("is"):
            suggestions = [
                "Is there a mobile version available?",
                "Is my data being backed up?",
                "Is two-factor authentication supported?",
                "Is my license expired?"
            ]
        elif query.startswith("can"):
            suggestions = [
                "Can I recover deleted files?",
                "Can I use the software offline?",
                "Can I transfer my license to another device?",
                "Can I customize the dashboard?"
            ]
        else:
            # General suggestions
            suggestions = [
                "Help with login issues",
                "Software crashes frequently",
                "Feature request",
                "Can't connect to server",
                "How to export data"
            ]
            
        # Filter suggestions based on the query
        filtered_suggestions = [s for s in suggestions if query in s.lower()]
        
        # Return all suggestions if none match the filter
        if not filtered_suggestions:
            filtered_suggestions = suggestions
            
        return SuggestionResponse(suggestions=filtered_suggestions[:5])
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Suggestion error: {str(e)}"
        )

@app.post("/api/chat/feedback")
async def submit_feedback(
    request: FeedbackRequest,
    background_tasks: BackgroundTasks
):
    """
    Submit feedback for a chat message
    """
    try:
        # In a production system, this would store the feedback in a database
        # For demonstration, we'll just log it
        feedback_data = {
            "message_id": request.message_id,
            "rating": request.rating,
            "comments": request.comments,
            "timestamp": datetime.now().isoformat()
        }
        
        print(f"Received feedback: {feedback_data}")
        
        return {"status": "success", "message": "Feedback received"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Feedback submission error: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 