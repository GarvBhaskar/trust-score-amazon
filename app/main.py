from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from models import image_text_alignment, review_detector, visual_logo_checker, returns_feedback

app = FastAPI(title="Amazon Trust Score API")

# ✅ Enable CORS for frontend access (e.g., from Chrome extension)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict this to ["chrome-extension://<your-extension-id>"] if needed
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

@app.post("/trust_score")
async def get_trust_score(data: ProductData):
    try:
        img_text_score = image_text_alignment.evaluate(data.title, data.description, data.images)
        review_score = review_detector.analyze(data.top_reviews)
        logo_score = visual_logo_checker.verify(data.title, data.images)
        return_score = returns_feedback.classify(data.return_feedback)

        trust_score = round((img_text_score + review_score + logo_score + return_score) / 4, 2)

        return {
            "trust_score": trust_score,
            "details": {
                "image_text_alignment": img_text_score,
                "review_authenticity": review_score,
                "logo_verification": logo_score,
                "returns_feedback": return_score
            }
        }
    except Exception as e:
        return {"error": str(e)}
