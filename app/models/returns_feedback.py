from transformers import pipeline
from typing import List, NamedTuple, Tuple

class FeedbackResult(NamedTuple):
    score: float
    explanation: str

classifier = pipeline(
    "text-classification", 
    model="distilbert-base-uncased-finetuned-sst-2-english"
)

def classify(feedbacks: List[str]) -> FeedbackResult:
    if not feedbacks:
        return FeedbackResult(
            score=0.0,
            explanation="No return feedback available for analysis"
        )
    
    scores = []
    negative_triggers = ["fake", "counterfeit", "not as described", "wrong item"]
    positive_triggers = ["perfect", "as expected", "no issues"]
    analysis_notes = []
    most_impactful: Tuple[int, str, float] = (0, "", 0.0)  # (index, feedback, impact)
    
    for i, fb in enumerate(feedbacks[:5], 1):  # Limit to 5 feedbacks
        try:
            fb_lower = fb.lower()
            current_impact = 0.0
            
            # Check for obvious keywords first
            if any(trigger in fb_lower for trigger in negative_triggers):
                scores.append(0.0)
                note = f"Feedback {i}: Contains negative trigger words"
                analysis_notes.append(note)
                current_impact = -1.0
                if current_impact < most_impactful[2]:
                    most_impactful = (i, fb, current_impact)
                continue
                
            if any(trigger in fb_lower for trigger in positive_triggers):
                scores.append(1.0)
                note = f"Feedback {i}: Contains positive indicators"
                analysis_notes.append(note)
                current_impact = 1.0
                if current_impact > most_impactful[2]:
                    most_impactful = (i, fb, current_impact)
                continue
                
            # Use model for nuanced cases
            result = classifier(fb)[0]
            score = 1.0 if result["label"] == "POSITIVE" else 0.0
            scores.append(score)
            
            current_impact = result['score'] * (1 if result['label'] == 'POSITIVE' else -1)
            if abs(current_impact) > abs(most_impactful[2]):
                most_impactful = (i, fb, current_impact)
            
            analysis_notes.append(
                f"Feedback {i}: Classified as {result['label']} "
                f"(confidence: {result['score']:.2f})"
            )
        except Exception as e:
            scores.append(0.5)
            analysis_notes.append(f"Feedback {i}: Analysis error - {str(e)}")
    
    avg_score = round(sum(scores) / len(scores), 2)
    
    # Build explanation focusing on the most impactful feedback
    impact_direction = "positive" if most_impactful[2] > 0 else "negative"
    impact_strength = "strongly" if abs(most_impactful[2]) > 0.7 else "moderately"
    
    return FeedbackResult(
        score=avg_score,
        explanation="Return Feedback Analysis: " + (
            "Positive return experience" if avg_score >= 0.8 else
            "Mixed return feedback" if avg_score >= 0.5 else
            "Frequent return issues reported"
        ) + f". The most {impact_direction} impact came from feedback {most_impactful[0]}: " + 
        f"'{most_impactful[1]}' (this was a {impact_strength} {impact_direction} factor). " +
        f"Full analysis: {'; '.join(analysis_notes)}"
    )