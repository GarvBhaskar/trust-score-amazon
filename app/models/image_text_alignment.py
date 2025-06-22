from transformers import BlipProcessor, BlipForConditionalGeneration
from PIL import Image
import requests
from io import BytesIO
from typing import List, NamedTuple

class AlignmentResult(NamedTuple):
    score: float
    explanation: str

processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")

def evaluate(title: str, desc: str, image_urls: List[str]) -> AlignmentResult:
    scores = []
    explanations = []
    
    for i, url in enumerate(image_urls[:2], 1):  # Limit to 2 images
        try:
            response = requests.get(url, timeout=5)
            img = Image.open(BytesIO(response.content)).convert("RGB")
            inputs = processor(img, return_tensors="pt")
            out = model.generate(**inputs)
            caption = processor.decode(out[0], skip_special_tokens=True)
            
            keywords = [word.lower() for word in title.split() + desc.split() if len(word) > 3]
            matched_keywords = [kw for kw in keywords if kw in caption.lower()]
            
            is_match = len(matched_keywords) > 0
            scores.append(1 if is_match else 0)
            
            explanations.append(
                f"Image {i}: Found {len(matched_keywords)} matching keywords "
                f"({', '.join(matched_keywords[:3]) or 'none'}) in caption '{caption[:50]}...'"
            )
        except Exception as e:
            scores.append(0)
            explanations.append(f"Image {i}: Error processing - {str(e)}")
    
    avg_score = round(sum(scores) / len(scores), 2) if scores else 0.0
    
    return AlignmentResult(
        score=avg_score,
        explanation="Visual-Text Consistency: " + (
            "Strong match between images and description" if avg_score >= 0.8 else
            "Partial match found" if avg_score >= 0.5 else
            "Weak or no visual-text correlation"
        ) + f". Details: {'; '.join(explanations)}"
    )