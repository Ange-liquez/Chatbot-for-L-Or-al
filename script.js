const WORKER_URL = "https://shrill-bush-9db8.angeliquezometa.workers.dev";

let allProducts = [];
let selected = [];
let chatHistory = [
  {
    role: "system",
    content:
      "You are a helpful L'Oréal beauty advisor. Build clear, practical routines using only the selected products provided by the user. Organize routines into Morning and Night when appropriate. Answer follow-up questions about the selected products and routine."
  }
];

const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const selectedProducts = document.getElementById("selectedProducts");
const generateBtn = document.getElementById("generateRoutine");
const chatWindow = document.getElementById("chatWindow");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");

document.addEventListener("DOMContentLoaded", async () => {
  await loadProducts();
  renderSelected();
  addMessage("Select products and click Generate Routine to begin.", "status");
});

async function loadProducts() {
  try {
    const res = await fetch("./products.json");
    const data = await res.json();
    allProducts = data.products || [];
  } catch (error) {
    console.error("Failed to load products:", error);
    productsContainer.innerHTML =
      '<p class="empty-state">Failed to load products.</p>';
  }
}

categoryFilter.addEventListener("change", renderProducts);

function renderProducts() {
  const category = categoryFilter.value;

  if (!category) {
    productsContainer.innerHTML =
      '<p class="empty-state">Choose a category to see products.</p>';
    return;
  }

  const filtered = allProducts.filter((p) => p.category === category);

  if (filtered.length === 0) {
    productsContainer.innerHTML =
      '<p class="empty-state">No products found in this category.</p>';
    return;
  }

  productsContainer.innerHTML = filtered
    .map(
      (p) => `
        <div class="product ${selected.some((item) => item.id === p.id) ? "selected" : ""}">
          <img src="${p.image}" alt="${p.name}">
          <h3>${p.name}</h3>
          <p class="brand">${p.brand}</p>
          <p class="category">${p.category}</p>
          <p class="description">${p.description}</p>
          <button type="button" data-id="${p.id}">
            ${selected.some((item) => item.id === p.id) ? "Remove" : "Add to Routine"}
          </button>
        </div>
      `
    )
    .join("");

  document.querySelectorAll(".product button").forEach((button) => {
    button.addEventListener("click", () => toggleProduct(Number(button.dataset.id)));
  });
}

function toggleProduct(id) {
  const product = allProducts.find((p) => p.id === id);
  if (!product) return;

  const exists = selected.some((p) => p.id === id);

  if (exists) {
    selected = selected.filter((p) => p.id !== id);
  } else {
    selected.push(product);
  }

  renderSelected();
  renderProducts();
}

function renderSelected() {
  if (selected.length === 0) {
    selectedProducts.innerHTML =
      '<p class="empty-state">No products selected yet.</p>';
    return;
  }

  selectedProducts.innerHTML = selected
    .map((p) => `<div class="selected-item">${p.name}</div>`)
    .join("");
}

generateBtn.addEventListener("click", async () => {
  if (selected.length === 0) {
    addMessage("Please select at least one product first.", "status");
    return;
  }

  addMessage("Generating your personalized routine...", "status");

  const prompt = `
Create a structured beauty routine using ONLY these selected products:

${selected
  .map(
    (p) => `
Name: ${p.name}
Brand: ${p.brand}
Category: ${p.category}
Description: ${p.description}
`
  )
  .join("\n")}

Instructions:
- Organize into Morning and Night if appropriate
- Use only the selected products
- Explain what each step does
- Keep the routine clear, helpful, and beginner-friendly
`;

  chatHistory.push({ role: "user", content: prompt });

  try {
    const reply = await sendToWorker(chatHistory);
    chatHistory.push({ role: "assistant", content: reply });
    addMessage(reply, "ai");
  } catch (error) {
    console.error("Routine generation error:", error);
    addMessage(`AI failed to respond. ${error.message}`, "status");
  }
});

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const message = userInput.value.trim();
  if (!message) return;

  addMessage(message, "user");
  userInput.value = "";
  chatHistory.push({ role: "user", content: message });

  try {
    const reply = await sendToWorker(chatHistory);
    chatHistory.push({ role: "assistant", content: reply });
    addMessage(reply, "ai");
  } catch (error) {
    console.error("Chat error:", error);
    addMessage(`AI failed to respond. ${error.message}`, "status");
  }
});

async function sendToWorker(messages) {
  const response = await fetch(WORKER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ messages })
  });

  const data = await response.json();
  console.log("Worker response:", data);

  if (!response.ok) {
    throw new Error(data.error || "Worker request failed.");
  }

  if (!data.reply) {
    throw new Error("No reply field returned from Worker.");
  }

  return data.reply;
}

function addMessage(text, sender) {
  const div = document.createElement("div");
  div.className = `message ${sender}`;
  div.textContent = text;
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}
