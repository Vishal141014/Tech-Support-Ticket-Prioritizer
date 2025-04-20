from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class TicketRequest(BaseModel):
    """Model for ticket submission request"""
    text: str = Field(..., description="The content of the support ticket")
    subject: Optional[str] = Field(None, description="The subject of the support ticket")
    customer_id: Optional[str] = Field(None, description="Customer identifier")
    customer_name: Optional[str] = Field(None, description="Customer name")
    product: Optional[str] = Field(None, description="Product the ticket is related to")
    language: str = Field("en", description="Language of the ticket (ISO code)")
    
    class Config:
        schema_extra = {
            "example": {
                "text": "The application keeps crashing when I try to export my data to PDF.",
                "subject": "Application crash during PDF export",
                "customer_id": "C12345",
                "customer_name": "John Smith",
                "product": "DataManager Pro",
                "language": "en"
            }
        }

class TicketResponse(BaseModel):
    """Model for ticket response with predictions"""
    ticket_id: str = Field(..., description="Generated ticket identifier")
    category: str = Field(..., description="Predicted category")
    priority: str = Field(..., description="Predicted priority")
    text: str = Field(..., description="Original ticket text")
    subject: Optional[str] = Field(None, description="Original ticket subject")
    
    class Config:
        schema_extra = {
            "example": {
                "ticket_id": "T12345",
                "category": "bug",
                "priority": "high",
                "text": "The application keeps crashing when I try to export my data to PDF.",
                "subject": "Application crash during PDF export"
            }
        }

class PredictionRequest(BaseModel):
    """Model for prediction request"""
    text: str = Field(..., description="Text to classify")
    language: str = Field("en", description="Language of the text (ISO code)")

class PredictionResponse(BaseModel):
    """Model for prediction response"""
    category: str = Field(..., description="Predicted category")
    priority: str = Field(..., description="Predicted priority")
    confidence: Dict[str, float] = Field(
        ..., 
        description="Confidence scores for each prediction"
    )

class TicketBatchRequest(BaseModel):
    """Model for batch ticket processing request"""
    tickets: List[TicketRequest] = Field(..., description="List of tickets to process")

class TicketBatchResponse(BaseModel):
    """Model for batch ticket processing response"""
    results: List[TicketResponse] = Field(..., description="Processing results")
    
class ErrorResponse(BaseModel):
    """Model for error responses"""
    error: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Error details")

# Chat models
class ChatMessage(BaseModel):
    """Model for a chat message"""
    text: str = Field(..., description="Message content")
    sender: str = Field(..., description="Message sender (user or bot)")
    timestamp: Optional[str] = Field(None, description="Message timestamp")

class ChatRequest(BaseModel):
    """Model for chat request"""
    message: str = Field(..., description="User message")
    history: Optional[List[ChatMessage]] = Field([], description="Chat history")
    language: str = Field("en", description="Language of the message (ISO code)")
    
    class Config:
        schema_extra = {
            "example": {
                "message": "My application keeps crashing when I export to PDF",
                "history": [],
                "language": "en"
            }
        }

class ChatResponse(BaseModel):
    """Model for chat response"""
    message: str = Field(..., description="Bot response message")
    category: Optional[str] = Field(None, description="Detected ticket category")
    priority: Optional[str] = Field(None, description="Detected ticket priority")
    suggestions: Optional[List[str]] = Field(None, description="Suggested follow-up questions")
    create_ticket: Optional[bool] = Field(False, description="If a ticket should be created")
    
    class Config:
        schema_extra = {
            "example": {
                "message": "I understand you're having issues with PDF exports. Have you tried updating to the latest version?",
                "category": "bug",
                "priority": "medium",
                "suggestions": ["How do I update my app?", "The update didn't fix it"],
                "create_ticket": False
            }
        }

class SuggestionRequest(BaseModel):
    """Model for suggestion request"""
    partial_query: str = Field(..., description="Partial user query")

class SuggestionResponse(BaseModel):
    """Model for suggestion response"""
    suggestions: List[str] = Field(..., description="Query suggestions")

class FeedbackRequest(BaseModel):
    """Model for chat feedback"""
    message_id: str = Field(..., description="Message identifier")
    rating: int = Field(..., description="User rating (1-5)")
    comments: Optional[str] = Field(None, description="User comments") 