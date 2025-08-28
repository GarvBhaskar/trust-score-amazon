// Trust Score Extension using Shadow DOM

// Fetch Trust Score from backend
async function fetchTrustScore(data) {
  try {
    const response = await fetch("https://garvbtri-trust-score-api.hf.space/trust_score", {
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
function showLoadingInShadow() {
  const loaderHost = document.createElement("div");
  loaderHost.id = "trust-score-loading-root";
  loaderHost.style.position = "fixed";
  loaderHost.style.bottom = "20px";
  loaderHost.style.left = "20px";
  loaderHost.style.zIndex = "2147483647";
  document.body.appendChild(loaderHost);

  const shadow = loaderHost.attachShadow({ mode: "open" });

  shadow.innerHTML = `
    <style>
      .loader {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #ffffff;
        border: 2px dashed #007185;
        padding: 10px 14px;
        border-radius: 10px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        color: #007185;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }

      .loader::after {
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
    </style>
    <div class="loader">Calculating Trust Score</div>
  `;

  return loaderHost; // to be removed later
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

  const returnFeedback = ["Item not as described", "Wrong product", "Looked fake"];

  return { title, description, images, top_reviews: reviews, return_feedback: returnFeedback };
}

function formatExplanation(rawText) {
  if (!rawText) return "";

  const [summaryPart, detailPart = ""] = rawText.split(". Details:").map(part => part.trim());
  let formatted = `<p>${summaryPart}</p>`;

  if (detailPart) {
    const items = detailPart.split(/;(?=\s*Review|\s*Feedback|\s*Image)/);
    formatted += "<ul>" + items.filter(i => i.trim()).map(i => `<li>${i.trim()}</li>`).join("") + "</ul>";
  }
  return formatted;
}

// Shadow DOM Host Creation
function createShadowHost(id = "trust-score-root") {
  const host = document.createElement("div");
  host.id = id;
  host.style.position = "fixed";
  host.style.zIndex = "2147483647";
  host.style.bottom = "20px";
  host.style.left = "20px";
  document.body.appendChild(host);
  return host.attachShadow({ mode: "open" });
}

function renderUIInShadow(shadow, trustScore, details) {
  shadow.innerHTML = `
    <style>
      .trust-score-button {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #ffffff;
        border: 2px solid #007185;
        border-radius: 20px;
        padding: 8px 12px;
        font-family: Arial, sans-serif;
        cursor: pointer;
        transition: all 0.2s ease;
        opacity: 0.95;
      }
      .trust-score-button:hover {
        transform: scale(1.05);
        opacity: 1;
      }
      .trust-score-badge {
        font-weight: bold;
        font-size: 16px;
        color: #007185;
      }
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
        font-family: Arial, sans-serif;
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
      }
      .overall-score {
        font-weight: bold;
        font-size: 18px;
        color: #007185;
        background: #f0f7fa;
        padding: 5px 10px;
        border-radius: 5px;
      }
      .score-details { margin: 20px 0; }
      .detail-item { padding: 10px; background: #f8f8f8; border-radius: 5px; margin-bottom: 10px; }
      .detail-label { font-weight: bold; margin-bottom: 5px; }
      .detail-value { color: #007185; font-size: 16px; margin: 4px 0; }
      .detail-explanation { font-size: 14px; color: #555; }
      .close-modal { margin-top: 10px; padding: 8px 12px; background: #007185; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%; }
    </style>
    <div class="trust-score-button" id="ts-button">
      <div class="trust-score-badge">${Math.round(trustScore * 100)}%</div>
      <span>Trust Score</span>
    </div>
    <div class="trust-score-modal" id="ts-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>🔍 Detailed Trust Analysis</h3>
          <div class="overall-score">Overall: ${Math.round(trustScore * 100)}%</div>
        </div>
        <div class="score-details">
          <div class="detail-item">
            <div class="detail-label">🖼️ Image Match:</div>
            <div class="detail-value">${Math.round(details.image_text_alignment.score * 100)}%</div>
            <div class="detail-explanation">${details.image_text_alignment.summary}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">✍️ Review Quality:</div>
            <div class="detail-value">${Math.round(details.review_authenticity.score * 100)}%</div>
            <div class="detail-explanation">${formatExplanation(details.review_authenticity.summary)}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">🏷️ Brand Verification:</div>
            <div class="detail-value">${Math.round(details.logo_verification.score * 100)}%</div>
            <div class="detail-explanation">${formatExplanation(details.logo_verification.summary)}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">🔄 Return Feedback:</div>
            <div class="detail-value">${Math.round(details.returns_feedback.score * 100)}%</div>
            <div class="detail-explanation">${formatExplanation(details.returns_feedback.summary)}</div>
          </div>
        </div>
        <button class="close-modal" id="close-modal">Close</button>
      </div>
    </div>
  `;

  shadow.getElementById("ts-button").addEventListener("click", () => {
    shadow.getElementById("ts-modal").style.display = "flex";
  });

  shadow.getElementById("close-modal").addEventListener("click", () => {
    shadow.getElementById("ts-modal").style.display = "none";
  });

  shadow.getElementById("ts-modal").addEventListener("click", (e) => {
    if (e.target === shadow.getElementById("ts-modal")) {
      shadow.getElementById("ts-modal").style.display = "none";
    }
  });
}

// Main Execution
(async () => {
  const productData = extractProductInfo();

  if (!productData.title || productData.images.length === 0) {
    console.error("Insufficient product data");
    return;
  }
  const loader = showLoadingInShadow();
  const result = await fetchTrustScore(productData);
  if (loader && loader.parentNode) loader.remove();
  if (!result) {
    console.error("No trust score data received");
    return;
  }

  const shadow = createShadowHost();
  renderUIInShadow(shadow, result.trust_score, result.details);
})();
