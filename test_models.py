from app.models import (
    image_text_alignment,
    review_detector,
    visual_logo_checker,
    returns_feedback
)

# Test image-text alignment
print(image_text_alignment.evaluate(
    title="Wireless Earbuds",
    desc="Noise cancelling Bluetooth 5.0",
    image_urls=["https://m.media-amazon.com/images/I/51RBV1bQ4BL._SL1500_.jpg"]
))

# Test review classifier
print(review_detector.analyze([
    "Absolutely fake!",
    "Genuine product, works great"
]))

# Test logo verification
print(visual_logo_checker.verify(
    title="Sony WH-1000XM4",
    image_urls=["https://m.media-amazon.com/images/I/71o8Q5XJS5L._SL1500_.jpg"]
))