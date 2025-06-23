# 🔐 AI-Powered Trust Score System

**Team Fractals** – Garv Bhaskar (22BAI1371), Aviral Srivastava (22BAI1167)
🏆 *Amazon HackOn - Season 5 Submission*

---

## 🚀 Project Overview

The **AI-Powered Trust Score System** is a browser-integrated tool designed to improve customer confidence in online shopping—specifically on Amazon—by programmatically analyzing product listings to detect:

* Counterfeit goods
* Misleading or inconsistent product information
* Inauthentic or bot-generated reviews
* Suspicious return feedback patterns

By synthesizing data from product images, descriptions, reviews, and return feedback using lightweight, explainable AI models, our system generates a clear, actionable **Trust Score** displayed directly on the product page.

---

## 🧩 System Architecture

### 1. 🧭 Chrome Extension (Frontend)

* **Data Extraction**:

  * Product title and description
  * Images and top reviews

* **UI Elements**:

  * A floating button overlay displays the computed Trust Score
  * Modal window reveals a detailed breakdown and human-readable justifications

* **Communication**:

  * Extracted data is securely transmitted to the backend API for evaluation

### 2. ⚙️ Backend (FastAPI-based)

The backend receives product data and computes a Trust Score using the following submodules:

| Module                   | Purpose                                               | Technologies Used       |
| ------------------------ | ----------------------------------------------------- | ----------------------- |
| 🖼️ Image-Text Alignment | Validates consistency between images and descriptions | BLIP                    |
| 🗣️ Review Authenticity  | Identifies fake, manipulative, or low-effort reviews  | BERT (Zero-shot)        |
| 🏷️ Brand Verification   | Detects counterfeit logos and visual branding errors  | Custom CNN, LogoNet     |
| 📦 Return Sentiment      | Interprets return feedback to detect buyer concerns   | DistilBERT (fine-tuned) |

* Each module returns a **normalized score (0–1)** and a **justification**
* Final **Trust Score** is the mean of all four sub-scores

---

## 💻 Tech Stack (Implemented)

| Component         | Technologies & Tools Used                                               |
| ----------------- | ----------------------------------------------------------------------- |
| **Frontend**      | JavaScript, HTML, CSS, Chrome Extensions API                            |
| **Backend**       | Python, FastAPI                                                         |
| **ML Models**     | Hugging Face Transformers (BERT, DistilBERT), BLIP, Custom CNN, LogoNet |
| **Data Handling** | pandas, PIL                                                             |
| **Deployment**    | Local prototype with Docker-ready services                              |

---

## 🧠 Machine Learning Models

All models used are open-source and optimized for performance and explainability.

| Task                         | Model                      |
| ---------------------------- | -------------------------- |
| Image-Text Matching          | BLIP                       |
| Review Classification        | BERT (Zero-shot)           |
| Return Intent Classification | DistilBERT (with adapters) |
| Visual Brand Detection       | Custom CNN + LogoNet       |

Optional summarization models enhance natural-language explanations.

---

## 📊 Key Success Metrics

* Higher trust at the point of purchase
* Reduced return rates due to better informed decisions
* Fewer support queries relating to product misrepresentation
* Increased buyer retention and repeat purchases

---

## 🧱 Scalability & Deployment Strategy

* Modular, containerized backend services
* Stateless submodules allow for independent scaling
* Trust Scores computed in asynchronous batch windows (e.g., hourly)
* Infrastructure compatible with AWS Lambda and SNS for cloud-native scaling

---

## 🔍 Example Use Case

> A user views a product page on Amazon.
> Our extension activates, analyzes product data, and displays:
>
> ✅ **Trust Score**: 82%
> 🧾 *"Reviews are specific and largely verified. Product images align with description. Minor inconsistency found in logo positioning."*

---

## 🌱 Future Enhancements

* Real-time anomaly detection in review patterns
* Continuous learning from user return behavior
* Integration of seller reputation and historical fraud data

