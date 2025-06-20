from transformers import pipeline
from typing import List

classifier = pipeline(
    "text-classification",
    model="distilbert-base-uncased-finetuned-sst-2-english"
)

def classify(feedbacks: List[str]) -> float:
    if not feedbacks:
        return 0.0
    
    scores = []
    negative_triggers = ["fake", "counterfeit", "not as described", "wrong item"]
    
    for fb in feedbacks[:5]:  # Limit to 5 feedbacks
        try:
            # First check for obvious negative keywords
            if any(trigger in fb.lower() for trigger in negative_triggers):
                scores.append(0.0)
                continue
                
            # Then use model for nuanced cases
            result = classifier(fb)[0]
            scores.append(1.0 if result["label"] == "POSITIVE" else 0.0)
        except:
            scores.append(0.5)  # Neutral score if analysis fails
            
    return round(sum(scores) / len(scores), 2)