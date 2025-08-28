from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime
import json
import os
from app.models import image_text_alignment, review_detector, visual_logo_checker, returns_feedback

app = FastAPI(title="Amazon Trust Score API")

# Debugging Setup
DEBUG_MODE = True
LOG_DIR = "/tmp/debug_logs"
os.makedirs(LOG_DIR, exist_ok=True)

def log_debug_data(source: str, data: Any):
    if not DEBUG_MODE:
        return
    
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    filename = f"{LOG_DIR}/{timestamp}_{source}.json"
    
    with open(filename, 'w') as f:
        if isinstance(data, dict):
            json.dump(data, f, indent=2)
        else:
            f.write(str(data))

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProductData(BaseModel):
    title: str
    description: str
    images: List[str]
    top_reviews: List[str]
    return_feedback: List[str]

class AnalysisResult(BaseModel):
    score: float
    explanation: str

@app.middleware("http")
async def debug_middleware(request: Request, call_next):
    if DEBUG_MODE:
        # Log incoming request
        request_data = {
            "method": request.method,
            "url": str(request.url),
            "headers": dict(request.headers),
            "query_params": dict(request.query_params)
        }
        
        try:
            body = await request.json()
            request_data["body"] = body
            log_debug_data("request", request_data)
        except:
            pass
    
    response = await call_next(request)
    return response

@app.get("/")
async def root():
    return {"status": "ok", "message": "Trust Score API is running"}

@app.post("/trust_score")
async def get_trust_score(data: ProductData) -> Dict[str, Any]:
    try:
        # Debug: Log incoming data
        log_debug_data("incoming_data", data.dict())
        
        # Get detailed analysis from each module
        img_text_result = image_text_alignment.evaluate(data.title, data.description, data.images)
        review_result = review_detector.analyze(data.top_reviews)
        logo_result = visual_logo_checker.verify(data.title, data.images)
        return_result = returns_feedback.classify(data.return_feedback)
        
        # Debug: Log module outputs
        log_debug_data("module_outputs", {
            "image_text": img_text_result._asdict(),
            "reviews": review_result._asdict(),
            "logo": logo_result._asdict(),
            "returns": return_result._asdict()
        })

        # Calculate overall trust score
        trust_score = round((
            img_text_result.score + 
            review_result.score + 
            logo_result.score + 
            return_result.score
        ) / 4, 2)

        # Determine which explanations to display
        primary_explanations = [
            img_text_result.explanation.split(". Details:")[0],
            review_result.explanation.split(". Details:")[0],
            logo_result.explanation.split(". Details:")[0],
            return_result.explanation.split(". Details:")[0]
        ]
        
        response_data = {
            "trust_score": trust_score,
            "primary_findings": primary_explanations,
            "details": {
                "image_text_alignment": {
                    "score": img_text_result.score,
                    "summary": img_text_result.explanation.split(". Details:")[0],
                    "details": img_text_result.explanation.split(". Details:")[1] if ". Details:" in img_text_result.explanation else ""
                },
                "review_authenticity": {
                    "score": review_result.score,
                    "summary": review_result.explanation.split(". Details:")[0],
                    "details": review_result.explanation.split(". Details:")[1] if ". Details:" in review_result.explanation else ""
                },
                "logo_verification": {
                    "score": logo_result.score,
                    "summary": logo_result.explanation.split(". Details:")[0],
                    "details": logo_result.explanation.split(". Details:")[1] if ". Details:" in logo_result.explanation else ""
                },
                "returns_feedback": {
                    "score": return_result.score,
                    "summary": return_result.explanation.split(". Details:")[0],
                    "details": return_result.explanation.split(". Details:")[1] if ". Details:" in return_result.explanation else ""
                }
            },
            "technical_details": {
                "images_analyzed": len(data.images[:2]),  # First 2 images
                "reviews_analyzed": len(data.top_reviews[:5]),  # First 5 reviews
                "return_feedbacks_analyzed": len(data.return_feedback[:5])  # First 5 returns
            }
        }

        # Debug: Log final response
        log_debug_data("response_data", response_data)
        
        return response_data
        
    except Exception as e:
        error_data = {
            "error": str(e),
            "input_data": data.dict() if 'data' in locals() else None
        }
        log_debug_data("error", error_data)
        return {"error": str(e)}

def generate_summary(*results: AnalysisResult, overall_score: float) -> str:
    summary = [
        f"Overall Trust Score: {overall_score * 100:.0f}%",
        "\nKey Findings:"
    ]
    
    for result in results:
        summary.append(f"\n- {result.explanation.split('. Details:')[0]}")
    
    return "\n".join(summary)