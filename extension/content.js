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

function extractProductInfo() {
  const title = (document.querySelector("#productTitle")?.innerText || "")
    .trim().replace(/\s+/g, " ");

  const bullets = document.querySelector("#feature-bullets");
  const description = bullets
    ? Array.from(bullets.querySelectorAll("li"))
        .map(li => li.innerText.trim().replace(/\s+/g, " "))
        .join(". ")
    : "";

  const images = Array.from(document.querySelectorAll("#imgTagWrapperId img, #landingImage"))
    .map(img => img.src.replace(/_([A-Z]+)\d+_/, '_SL1500_'))
    .filter(url => url.startsWith("http"));

  const reviews = Array.from(document.querySelectorAll(".review-text-content, .review-text, [data-hook=review-body]"))
    .slice(0, 5)
    .map(review => review.textContent.trim().replace(/\s+/g, " "));

  const returnFeedback = [
    "Item not as described",
    "Wrong product",
    "Looked fake"
  ];

  return { title, description, images, top_reviews: reviews, return_feedback: returnFeedback };
}

function formatExplanation(rawText) {
  if (!rawText) return "";

  const mainParts = rawText.split("Full analysis:");
  const summaryPart = mainParts[0].trim().replace(/\s+/g, " ");
  const detailPart = (mainParts[1] || "").trim();

  let formatted = `<p>${summaryPart}</p>`;
  if (detailPart) {
    const items = detailPart.split(/;(?=\s*Review|\s*Feedback|\s*Image)/);
    formatted += "<ul>";
    for (const item of items) {
      const cleaned = item.replace(/\s+/g, " ").trim();
      if (cleaned) formatted += `<li>${cleaned}</li>`;
    }
    formatted += "</ul>";
  }

  return formatted;
}

function createTrustButton(score) {
  const button = document.createElement("div");
  button.className = "trust-score-button";
  button.innerHTML = `
    <div class="trust-score-badge">${Math.round(score * 100)}%</div>
    <span>Trust Score</span>
  `;
  document.body.appendChild(button);
  return button;
}

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

function showLoader() {
  const loader = document.createElement("div");
  loader.className = "trust-score-loader";
  loader.textContent = "Calculating Trust Score";
  document.body.appendChild(loader);
  return loader;
}

function showError(message) {
  const errorEl = document.createElement("div");
  errorEl.className = "trust-score-error";
  errorEl.textContent = message;
  document.body.appendChild(errorEl);
  setTimeout(() => errorEl.remove(), 5000);
  return errorEl;
}

function addStyles() {
  fetch(chrome.runtime.getURL("styles.css"))
    .then(res => res.text())
    .then(css => {
      const style = document.createElement("style");
      style.textContent = css;
      document.head.appendChild(style);
    });
}

(async () => {
  if (document.querySelector(".trust-score-button")) return;

  addStyles();
  const loader = showLoader();

  try {
    const productData = extractProductInfo();
    if (!productData.title || productData.images.length === 0)
      throw new Error("Insufficient product data");

    const result = await fetchTrustScore(productData);
    if (!result) throw new Error("No trust score data received");

    const button = createTrustButton(result.trust_score);
    const modal = createExplanationModal(result);

    button.addEventListener("click", () => modal.style.display = "flex");
    modal.querySelector(".close-modal").addEventListener("click", () => modal.style.display = "none");
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });

  } catch (error) {
    console.error("Trust Score Extension Error:", error);
    showError("Failed to calculate trust score. Please try again.");
  } finally {
    loader.remove();
  }
})();
