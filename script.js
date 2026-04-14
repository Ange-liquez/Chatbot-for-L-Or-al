const WORKER_URL = "https://misty-snow-dff0.angeliquezometa.workers.dev";

const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const questionPreview = document.getElementById("questionPreview");
const statusText = document.getElementById("statusText");
const sendBtn = document.getElementById("sendBtn");

const systemPrompt = `
You are the L'Oréal Smart Beauty Advisor.

You only answer questions related to:
- L'Oréal products
- skincare
- makeup
- haircare
- fragrance
- beauty routines
- beauty recommendations

Rules:
1. Politely refuse questions unrelated to beauty or L'Oréal.
2. Be warm, polished, and professional.
3. Keep answers concise, helpful, and easy to understand.
4. Do not provide medical advice.
5. When helpful, recommend a simple product type or routine order.
`;

const messages = [
  { role: "system", content: systemPrompt }
];

const beautyKeywords = [
  "l'oreal",
  "l’oréal",
  "loreal",
  "beauty",
  "skincare",
  "skin",
  "haircare",
  "hair",
  "makeup",
  "fragrance",
  "perfume",
  "routine",
  "cleanser",
  "serum",
  "moisturizer",
  "sunscreen",
  "spf",
  "foundation",
  "mascara",
  "lipstick",
  "shampoo",
  "conditioner",
  "scalp",
  "acne",
  "dry skin",
  "oily skin",
  "combination skin",
  "hydration",
  "anti-aging",
  "brightening"
];

function isBeautyRelated(text) {
  const normalized = text.toLowerCase();
  return beautyKeywords.some((keyword) => normalized.includes(keyword));
}

function addMessage(text, type) {
  const msg = document.createElement("div");
  msg.className = `message ${type === "user" ? "user-message" : "bot-message"}`;

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.textContent = text;

  msg.appendChild(bubble);
  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function setLoading(state) {
  sendBtn.disabled = state;
  userInput.disabled = state;
  statusText.textContent = state ? "Thinking..." : "";
}

chatWindow.innerHTML = "";
addMessage(
  "Welcome to the L’Oréal Smart Beauty Advisor. Ask me about skincare, haircare, makeup, fragrance, or beauty routines, and I’ll help you find the right direction.",
  "bot"
);

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = userInput.value.trim();
  if (!text) return;

  questionPreview.textContent = `You asked: ${text}`;
  questionPreview.classList.remove("hidden");

  addMessage(text, "user");
  messages.push({ role: "user", content: text });

  userInput.value = "";
  setLoading(true);

  try {
    if (!isBeautyRelated(text)) {
      const refusal =
        "I’m here to help with L’Oréal beauty products, skincare, haircare, makeup, fragrance, and beauty routines only.";
      addMessage(refusal, "bot");
      messages.push({ role: "assistant", content: refusal });
      return;
    }

    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ messages })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed.");
    }

    const reply =
      data?.choices?.[0]?.message?.content ||
      "Sorry, I could not generate a response right now.";

    addMessage(reply, "bot");
    messages.push({ role: "assistant", content: reply });
  } catch (error) {
    console.error(error);
    addMessage(
      "I couldn’t connect to the AI service right now. Please verify your Cloudflare Worker setup and try again.",
      "bot"
    );
    statusText.textContent = error.message;
  } finally {
    setLoading(false);
    userInput.focus();
  }
});
