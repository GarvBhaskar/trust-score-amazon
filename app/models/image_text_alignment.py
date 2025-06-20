from transformers import BlipProcessor, BlipForConditionalGeneration
from PIL import Image
import requests
from io import BytesIO
from typing import List

processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")

def evaluate(title: str, desc: str, image_urls: List[str]) -> float:
    scores = []
    for url in image_urls[:2]:  # Limit to 2 images for performance
        try:
            response = requests.get(url, timeout=5)
            img = Image.open(BytesIO(response.content)).convert("RGB")
            inputs = processor(img, return_tensors="pt")
            out = model.generate(**inputs)
            caption = processor.decode(out[0], skip_special_tokens=True)
            
            keywords = title.lower().split() + desc.lower().split()
            matched = any(keyword in caption.lower() for keyword in keywords if len(keyword) > 3)
            scores.append(1 if matched else 0)
        except:
            scores.append(0)
    return round(sum(scores) / len(scores), 2) if scores else 0.0