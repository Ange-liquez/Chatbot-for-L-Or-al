const WORKER_URL = "https://shrill-bush-9db8.angeliquezometa.workers.dev";

/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

/* Add message to chat */
function addMessage(text, sender) {
  const messageEl = document.createElement("div");
  messageEl.classList.add("msg", sender);
  messageEl.textContent = text;
  chatWindow.appendChild(messageEl);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Set initial message */
addMessage(
  "👋 Hello! I’m your L'Oréal beauty assistant. Ask me about skincare routines, dry skin, oily skin, acne-friendly products, or beauty tips.",
  "system"
);

/* Call Cloudflare Worker */
async function getAIResponse(message) {
  const response = await fetch(WORKER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to get response.");
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || "No response returned.";
}

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const message = userInput.value.trim();
  if (!message) return;

  addMessage(message, "user");
  userInput.value = "";

  try {
    const aiReply = await getAIResponse(message);
    addMessage(aiReply, "ai");
  } catch (error) {
    addMessage(`Error: ${error.message}`, "system");
  }
});
