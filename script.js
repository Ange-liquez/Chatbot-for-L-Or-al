/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

/* Your deployed Cloudflare Worker URL */
const WORKER_URL = "https://misty-snow-dff0.angeliquezometa.workers.dev/";

/* Conversation history for extra credit */
const messages = [
  {
    role: "system",
    content:
      "You are a L'Oréal beauty assistant. Only answer questions related to L'Oréal products, skincare, haircare, makeup, fragrance, beauty routines, and beauty recommendations. If a user asks something unrelated, politely refuse and redirect them back to L'Oréal beauty topics."
  },
  {
    role: "assistant",
    content:
      "👋 Hello! I’m your L’Oréal beauty assistant. Ask me about products, routines, skincare, makeup, haircare, or fragrance."
  }
];

/* Initial message */
renderChat();

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userMessage = userInput.value.trim();
  if (!userMessage) return;

  messages.push({
    role: "user",
    content: userMessage
  });

  userInput.value = "";
  renderChat("Thinking...");

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ messages })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Worker error:", data);
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    const assistantReply =
      data?.choices?.[0]?.message?.content ||
      "Sorry, I couldn’t generate a response right now.";

    messages.push({
      role: "assistant",
      content: assistantReply
    });

    renderChat();
  } catch (error) {
    console.error("Chat error:", error);

    messages.push({
      role: "assistant",
      content:
        "Sorry, I’m having trouble connecting right now. Please check your Cloudflare Worker and API key settings."
    });

    renderChat();
  }
});

/* Render chat bubbles */
function renderChat(statusMessage = "") {
  chatWindow.innerHTML = "";

  messages
    .filter((msg) => msg.role !== "system")
    .forEach((msg) => {
      const bubble = document.createElement("div");
      bubble.className =
        msg.role === "user" ? "message user-message" : "message bot-message";
      bubble.textContent = msg.content;
      chatWindow.appendChild(bubble);
    });

  if (statusMessage) {
    const statusBubble = document.createElement("div");
    statusBubble.className = "message bot-message";
    statusBubble.textContent = statusMessage;
    chatWindow.appendChild(statusBubble);
  }

  chatWindow.scrollTop = chatWindow.scrollHeight;
}
