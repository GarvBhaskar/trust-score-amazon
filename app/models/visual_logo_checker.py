from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import requests
from io import BytesIO
from typing import List, NamedTuple, Tuple, Optional
import numpy as np

class LogoResult(NamedTuple):
    score: float
    explanation: str

model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

def verify(title: str, image_urls: List[str]) -> LogoResult:
    if not image_urls:
        return LogoResult(
            score=0.5,
            explanation="No product images available for brand verification"
        )
    
    potential_brands = extract_brands_from_title(title)
    if not potential_brands:
        return LogoResult(
            score=0.5,
            explanation="No clear brand identified in product title"
        )
    
    scores = []
    analysis_notes = []
    best_match: Optional[Tuple[int, str, float, str]] = None  # (index, brand, score, url)
    
    for i, url in enumerate(image_urls[:3], 1):  # Check first 3 images
        try:
            response = requests.get(url, timeout=5)
            img = Image.open(BytesIO(response.content))
            
            inputs = processor(
                text=potential_brands,
                images=img,
                return_tensors="pt",
                padding=True
            )
            
            outputs = model(**inputs)
            probs = outputs.logits_per_image.softmax(dim=1).detach().numpy()
            max_prob = float(np.max(probs))
            best_match_idx = np.argmax(probs)
            best_brand = potential_brands[best_match_idx]
            
            scores.append(max_prob)
            analysis_notes.append(
                f"Image {i}: Best match '{best_brand}' "
                f"(confidence: {max_prob:.2f})"
            )
            
            # Track best overall match
            if best_match is None or max_prob > best_match[2]:
                best_match = (i, best_brand, max_prob, url)
                
        except Exception as e:
            scores.append(0.0)
            analysis_notes.append(f"Image {i}: Analysis error - {str(e)}")
    
    avg_score = round(np.mean(scores), 2) if scores else 0.5
    
    # Build detailed explanation
    explanation = "Brand Consistency: " + (
        "Strong brand presence confirmed" if avg_score >= 0.7 else
        "Possible brand consistency issues" if avg_score >= 0.4 else
        "Potential counterfeit risk detected"
    )
    
    if best_match:
        confidence_level = (
            "high" if best_match[2] >= 0.7 else
            "moderate" if best_match[2] >= 0.4 else
            "low"
        )
        explanation += (
            f". The strongest match was image {best_match[0]} "
            f"with {confidence_level} confidence ({best_match[2]:.2f}) "
            f"for brand '{best_match[1]}'"
        )
    
    explanation += f". Details: {'; '.join(analysis_notes)}"
    
    return LogoResult(
        score=avg_score,
        explanation=explanation
    )

def extract_brands_from_title(title: str) -> List[str]:
    # Improved brand extraction with common brand indicators
    indicators = ["®", "™", "by", "from", "for", "-"]
    title = title.strip()
    
    # Check for explicit brand markers first
    for indicator in indicators:
        if indicator in title:
            parts = title.split(indicator)
            if len(parts) > 1:
                candidate = parts[0].strip()
                if 0 < len(candidate.split()) <= 3:  # Allow slightly longer brand names
                    return [candidate]
    
    # Fallback to first capitalized word sequence (excluding common words)
    words = title.split()
    common_words = {"the", "new", "best", "amazon", "official", "genuine"}
    
    # Find the first sequence of capitalized words not in common words
    brand_candidates = []
    current_candidate = []
    
    for word in words:
        if word and word[0].isupper() and word.lower() not in common_words:
            current_candidate.append(word)
        elif current_candidate:
            # Join the current candidate if we've hit a non-capitalized word
            if 1 <= len(current_candidate) <= 3:
                brand_candidates.append(" ".join(current_candidate))
            current_candidate = []
    
    # Check if we have any remaining candidate at the end
    if current_candidate and 1 <= len(current_candidate) <= 3:
        brand_candidates.append(" ".join(current_candidate))
    
    return brand_candidates[:1] if brand_candidates else []  # Return only the first candidate if multiple exist