from transformers import pipeline
from typing import List

classifier = pipeline(
    "zero-shot-classification",
    model="facebook/bart-large-mnli"
)

labels = ["genuine", "too generic", "bot-like", "emotionally manipulative"]

def analyze(reviews: List[str]) -> float:
    if not reviews:
        return 0.0
    
    scores = []
    for r in reviews[:5]:  # Limit to 5 reviews
        try:
            result = classifier(r, candidate_labels=labels)
            scores.append(1.0 if result["labels"][0] == "genuine" else 0.0)
        except:
            scores.append(0.5)  # Neutral score if analysis fails
    return round(sum(scores) / len(scores), 2)