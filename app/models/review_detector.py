from transformers import pipeline
from typing import List, NamedTuple, Tuple
import numpy as np

class ReviewResult(NamedTuple):
    score: float
    explanation: str

classifier = pipeline(
    "zero-shot-classification",
    model="facebook/bart-large-mnli"
)

labels = ["genuine", "too generic", "bot-like", "emotionally manipulative"]
label_descriptions = {
    "genuine": "Authentic customer review with specific details",
    "too generic": "Overly vague or templated language",
    "bot-like": "Patterns consistent with automated generation",
    "emotionally manipulative": "Attempts to artificially influence perception"
}

def analyze(reviews: List[str]) -> ReviewResult:
    if not reviews:
        return ReviewResult(
            score=0.0,
            explanation="No reviews available for analysis"
        )
    
    scores = []
    analysis_notes = []
    most_impactful: Tuple[int, str, str, float] = (0, "", "", 0.0)  # (index, review, label, impact)
    
    for i, review in enumerate(reviews[:5], 1):  # Analyze first 5 reviews
        try:
            result = classifier(review, candidate_labels=labels)
            top_label = result["labels"][0]
            confidence = result["scores"][0]
            
            is_genuine = top_label == "genuine"
            score = 1.0 if is_genuine else 0.0
            scores.append(score)
            
            # Calculate impact (positive for genuine, negative for others)
            current_impact = confidence if is_genuine else -confidence
            
            # Update most impactful if this review has stronger impact
            if abs(current_impact) > abs(most_impactful[3]):
                most_impactful = (i, review, top_label, current_impact)
            
            analysis_notes.append(
                f"Review {i}: Classified as '{top_label}' "
                f"(confidence: {confidence:.2f}) - "
                f"{label_descriptions.get(top_label, '')}"
            )
        except Exception as e:
            scores.append(0.5)
            analysis_notes.append(f"Review {i}: Analysis error - {str(e)}")
    
    avg_score = round(sum(scores) / len(scores), 2)
    
    # Build explanation focusing on the most impactful review
    impact_type = "positive" if most_impactful[3] > 0 else "negative"
    impact_strength = "strong" if abs(most_impactful[3]) > 0.7 else "moderate"
    impact_label = most_impactful[2]
    
    return ReviewResult(
        score=avg_score,
        explanation="Review Authenticity: " + (
            "Highly authentic reviews" if avg_score >= 0.8 else
            "Mixed authenticity" if avg_score >= 0.5 else
            "Potential review manipulation detected"
        ) + f". The most {impact_type} impact came from review {most_impactful[0]} " +
        f"(classified as '{impact_label}' with {impact_strength} confidence): " +
        f"\"{most_impactful[1][:100]}{'...' if len(most_impactful[1]) > 100 else ''}\". " +
        f"Full analysis: {'; '.join(analysis_notes)}"
    )