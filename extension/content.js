// Trust Score Extension 

// Fetch Trust Score from backend
async function fetchTrustScore(data) {
  try {
    const response = await fetch("http://127.0.0.1:8000/trust_score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch trust score:", error);
    return null;
  }
}

// Extract product data from Amazon page
function extractProductInfo() {
  const title = document.querySelector("#productTitle")?.innerText.trim() || "";
  const description = document.querySelector("#feature-bullets")?.innerText.trim() || "";

  const images = Array.from(document.querySelectorAll("#imgTagWrapperId img, #landingImage"))
    .map(img => img.src.replace(/_([A-Z]+)\d+_/, '_SL1500_'))
    .filter(url => url.startsWith("http"));

  const reviews = Array.from(document.querySelectorAll(".review-text-content, .review-text, [data-hook=review-body]"))
    .slice(0, 5)
    .map(review => review.textContent.trim());

  // Static placeholder - replace with actual return feedback if available
  const returnFeedback = [
    "Item not as described",
    "Wrong product",
    "Looked fake"
  ];

  return { title, description, images, top_reviews: reviews, return_feedback: returnFeedback };
}

// ========================
// UI Components
// ========================

// Add CSS styles dynamically
function addStyles() {
  const style = document.createElement("style");
  style.textContent = `
    /* Trust Score Button - Fixed position overlay */
    .trust-score-button {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #ffffff;
      border: 2px solid #007185;
      border-radius: 20px;
      padding: 8px 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      font-family: Arial, sans-serif;
      position: fixed;
      bottom: 20px;
      left: 20px;
      z-index: 2147483647;
      cursor: pointer;
      transition: all 0.2s ease;
      opacity: 0.95;
    }
    
    .trust-score-button:hover {
      transform: scale(1.05);
      opacity: 1;
      box-shadow: 0 4px 15px rgba(0,0,0,0.15);
    }
    
    .trust-score-badge {
      font-weight: bold;
      font-size: 16px;
      color: #007185;
    }
    
    /* Modal - Fixed position overlay */
    .trust-score-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 2147483647;
      backdrop-filter: blur(2px);
    }
    
    .modal-content {
      background: white;
      border-radius: 8px;
      padding: 20px;
      width: 90%;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      position: relative;
      box-shadow: 0 5px 20px rgba(0,0,0,0.2);
      animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    
    .overall-score {
      font-weight: bold;
      font-size: 18px;
      color: #007185;
      background: #f0f7fa;
      padding: 5px 10px;
      border-radius: 5px;
    }
    
    .score-details {
      display: grid;
      gap: 15px;
      margin: 20px 0;
    }
    
    .detail-item {
      padding: 12px;
      background: #f8f8f8;
      border-radius: 5px;
      transition: all 0.2s ease;
    }
    
    .detail-item:hover {
      background: #f0f0f0;
      transform: translateX(2px);
    }
    
    .detail-label {
      font-weight: bold;
      margin-bottom: 5px;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .detail-value {
      font-size: 18px;
      font-weight: bold;
      color: #007185;
      margin: 5px 0;
    }
    
    .detail-explanation {
      font-size: 14px;
      color: #555;
      line-height: 1.4;
    }
    
    .close-modal {
      margin-top: 20px;
      padding: 10px 16px;
      background: #007185;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      width: 100%;
      transition: all 0.2s ease;
    }
    
    .close-modal:hover {
      background: #005f73;
      transform: translateY(-1px);
    }
    
    /* Loading indicator */
    .trust-score-loader {
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: #ffffff;
      border: 2px dashed #007185;
      padding: 10px 14px;
      border-radius: 10px;
      font-family: Arial, sans-serif;
      z-index: 2147483647;
      font-size: 14px;
      color: #007185;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .trust-score-loader:after {
      content: "";
      width: 16px;
      height: 16px;
      border: 2px solid #007185;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    /* Error message */
    .trust-score-error {
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: #ffecec;
      border: 2px solid #ff6b6b;
      border-radius: 10px;
      padding: 10px 14px;
      font-family: Arial, sans-serif;
      z-index: 2147483647;
      font-size: 14px;
      color: #d32f2f;
      max-width: 300px;
    }
  `;
  document.head.appendChild(style);
}

function formatExplanation(rawText) {
  if (!rawText) return "";

  const mainParts = rawText.split("Full analysis:");
  const summaryPart = mainParts[0].trim();
  const detailPart = (mainParts[1] || "").trim();

  let formatted = `<p>${summaryPart}</p>`;

  if (detailPart) {
    const items = detailPart.split(/;(?=\s*Review|\s*Feedback|\s*Image)/); // Keep semantic breaks
    formatted += "<ul>";
    for (const item of items) {
      if (item.trim()) {
        formatted += `<li>${item.trim()}</li>`;
      }
    }
    formatted += "</ul>";
  }

  return formatted;
}

// Create and inject the trust score button
function createTrustButton(score) {
  const button = document.createElement("div");
  button.className = "trust-score-button";
  button.innerHTML = `
    <div class="trust-score-badge">
      ${Math.round(score * 100)}%
    </div>
    <span>Trust Score</span>
  `;
  document.body.appendChild(button);
  return button;
}

// Create detailed explanation modal
function createExplanationModal(result) {
  const modal = document.createElement("div");
  modal.className = "trust-score-modal";
  
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>🔍 Detailed Trust Analysis</h3>
        <div class="overall-score">Overall: ${Math.round(result.trust_score * 100)}%</div>
      </div>
      
      <div class="score-details">
        <div class="detail-item">
          <div class="detail-label">🖼️ Image Match:</div>
          <div class="detail-value">${Math.round(result.details.image_text_alignment.score * 100)}%</div>
          <div class="detail-explanation">${result.details.image_text_alignment.summary}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">✍️ Review Quality:</div>
          <div class="detail-value">${Math.round(result.details.review_authenticity.score * 100)}%</div>
          <div class="detail-explanation">${formatExplanation(result.details.review_authenticity.summary)}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">🏷️ Brand Verification:</div>
          <div class="detail-value">${Math.round(result.details.logo_verification.score * 100)}%</div>
          <div class="detail-explanation">${formatExplanation(result.details.logo_verification.summary)}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">🔄 Return Feedback:</div>
          <div class="detail-value">${Math.round(result.details.returns_feedback.score * 100)}%</div>
          <div class="detail-explanation">${formatExplanation(result.details.returns_feedback.summary)}</div>
        </div>
      </div>
      
      <button class="close-modal">Close</button>
    </div>
  `;
  
  document.body.appendChild(modal);
  return modal;
}

// Show loading indicator
function showLoader() {
  const loader = document.createElement("div");
  loader.className = "trust-score-loader";
  loader.textContent = "Calculating Trust Score";
  document.body.appendChild(loader);
  return loader;
}

// Show error message
function showError(message) {
  const errorEl = document.createElement("div");
  errorEl.className = "trust-score-error";
  errorEl.textContent = message;
  document.body.appendChild(errorEl);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (errorEl.parentNode) {
      errorEl.remove();
    }
  }, 5000);
  
  return errorEl;
}

// ========================
// Main Execution
// ========================

(async () => {
  // Add styles first
  addStyles();
  
  // Show loading indicator
  const loader = showLoader();
  
  try {
    // Get product data and fetch score
    const productData = extractProductInfo();
    
    // Validate we have basic product data
    if (!productData.title || productData.images.length === 0) {
      throw new Error("Insufficient product data");
    }
    
    const result = await fetchTrustScore(productData);
    
    if (!result) {
      throw new Error("No trust score data received");
    }
    
    // Create and display trust button
    const button = createTrustButton(result.trust_score);
    
    // Create modal (hidden by default)
    const modal = createExplanationModal(result);
    
    // Add click handlers
    button.addEventListener("click", () => {
      modal.style.display = "flex";
    });
    
    modal.querySelector(".close-modal").addEventListener("click", () => {
      modal.style.display = "none";
    });
    
    // Close modal when clicking outside
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });
    
  } catch (error) {
    console.error("Error in trust score extension:", error);
    showError("Failed to calculate trust score. Please try again.");
  } finally {
    // Remove loader when done
    if (loader && loader.parentNode) {
      loader.remove();
    }
  }
})();