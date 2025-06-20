from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import requests
from io import BytesIO
from typing import List
import numpy as np

# Load CLIP model for zero-shot image classification
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

def verify(title: str, image_urls: List[str]) -> float:
    """
    Uses CLIP to verify brand logos in product images.
    Returns a score between 0-1 based on brand-title consistency.
    """
    if not image_urls:
        return 0.5  # Neutral score if no images
    
    # Extract potential brand names from title (better than hardcoded list)
    potential_brands = extract_brands_from_title(title)
    if not potential_brands:
        return 0.5
    
    scores = []
    for url in image_urls[:3]:  # Check max 3 images for performance
        try:
            # Download and process image
            response = requests.get(url, timeout=5)
            img = Image.open(BytesIO(response.content))
            
            # Prepare inputs for CLIP
            inputs = processor(
                text=potential_brands, 
                images=img, 
                return_tensors="pt", 
                padding=True
            )
            
            # Get similarity scores
            outputs = model(**inputs)
            logits_per_image = outputs.logits_per_image
            probs = logits_per_image.softmax(dim=1).detach().numpy()
            
            # Get highest matching brand probability
            max_prob = np.max(probs)
            scores.append(float(max_prob))
            
        except Exception:
            scores.append(0.0)
    
    return round(np.mean(scores), 2) if scores else 0.5

def extract_brands_from_title(title: str) -> List[str]:
    """
    Heuristic to extract potential brand names from product title.
    Example: "Nike Air Max Running Shoes" -> ["Nike"]
    """
    # Common brand indicators (can be expanded)
    indicators = [
        "by", "from", "®", "™"
    ]
    
    # Simple heuristic - first word is often the brand
    first_word = title.split()[0].strip()
    
    # Check for brand indicators
    for indicator in indicators:
        if indicator in title:
            parts = title.split(indicator)
            if len(parts) > 1:
                candidate = parts[0].strip()
                if len(candidate.split()) <= 2:  # Likely brand if 1-2 words
                    return [candidate]
    
    # Return first word if it looks like a brand (capitalized, not a common word)
    if (first_word.istitle() and len(first_word) > 2 and 
        first_word.lower() not in ["the", "new", "best"]):
        return [first_word]
    
    return []