const WORKER_URL = "https://shrill-bush-9db8.angeliquezometa.workers.dev";

let allProducts = [];
let selectedProducts = JSON.parse(localStorage.getItem("selectedProducts")) || [];

let chatHistory = [
  {
    role: "system",
    content:
      "You are a helpful L'Oréal beauty advisor. Only answer questions about the user's selected products, generated routine, skincare, haircare, makeup, fragrance, and beauty-related topics. Keep answers clear, practical, organized, and friendly. Do not recommend products that were not selected unless the user specifically asks for general beauty advice."
  }
];

/* DOM Elements */
const categoryFilter = document.getElementById("categoryFilter");
const searchInput = document.getElementById("searchInput");
const productGrid = document.getElementById("productGrid");
const selectedProductsList = document.getElementById("selectedProductsList");
const clearSelectedBtn = document.getElementById("clearSelectedBtn");
const generateRoutineBtn = document.getElementById("generateRoutineBtn");

const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

/* Initialize app */
document.addEventListener("DOMContentLoaded", async () => {
  addMessage(
    "👋 Hello! I’m your L'Oréal beauty assistant. Select products, generate a personalized routine, and ask follow-up beauty questions.",
    "assistant"
  );

  await loadProducts();
  renderProducts();
  renderSelectedProducts();

  categoryFilter.addEventListener("change", renderProducts);
  searchInput.addEventListener("input", renderProducts);
  clearSelectedBtn.addEventListener("click", clearAllSelections);
  generateRoutineBtn.addEventListener("click", generateRoutine);

  chatForm.addEventListener("submit", handleChatSubmit);
});

/* Load products.json */
async function loadProducts() {
  try {
    const response = await fetch("./products.json");

    if (!response.ok) {
      throw new Error("Could not load products.json");
    }

    allProducts = await response.json();
  } catch (error) {
    console.error("Error loading products:", error);
    addMessage("Sorry, I couldn't load the product list.", "assistant");
  }
}

/* Render products based on category + search */
function renderProducts() {
  const selectedCategory = categoryFilter.value.toLowerCase();
  const searchTerm = searchInput.value.trim().toLowerCase();

  const filteredProducts = allProducts.filter((product) => {
    const matchesCategory =
      selectedCategory === "all" ||
      product.category.toLowerCase() === selectedCategory;

    const matchesSearch =
      searchTerm === "" ||
      product.name.toLowerCase().includes(searchTerm) ||
      product.brand.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm);

    return matchesCategory && matchesSearch;
  });

  productGrid.innerHTML = "";

  if (filteredProducts.length === 0) {
    productGrid.innerHTML = `<p class="empty-state">No products match your search.</p>`;
    return;
  }

  filteredProducts.forEach((product) => {
    const isSelected = selectedProducts.some(
      (item) => item.name === product.name
    );

    const card = document.createElement("div");
    card.className = `product-card ${isSelected ? "selected" : ""}`;

    card.innerHTML = `
      <div class="product-card-top">
        <h3>${product.name}</h3>
        <p class="brand">${product.brand}</p>
        <p class="category">${product.category}</p>
      </div>

      <button type="button" class="description-btn">Show Description</button>

      <div class="product-description hidden">
        <p>${product.description}</p>
      </div>
    `;

    /* Select/unselect card */
    card.addEventListener("click", (event) => {
      if (event.target.classList.contains("description-btn")) return;
      toggleProductSelection(product);
    });

    /* Show/hide description */
    const descriptionBtn = card.querySelector(".description-btn");
    const descriptionBox = card.querySelector(".product-description");

    descriptionBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      descriptionBox.classList.toggle("hidden");
      descriptionBtn.textContent = descriptionBox.classList.contains("hidden")
        ? "Show Description"
        : "Hide Description";
    });

    productGrid.appendChild(card);
  });
}

/* Select / unselect product */
function toggleProductSelection(product) {
  const alreadySelected = selectedProducts.some(
    (item) => item.name === product.name
  );

  if (alreadySelected) {
    selectedProducts = selectedProducts.filter(
      (item) => item.name !== product.name
    );
  } else {
    selectedProducts.push(product);
  }

  saveSelections();
  renderProducts();
  renderSelectedProducts();
}

/* Render selected product list */
function renderSelectedProducts() {
  selectedProductsList.innerHTML = "";

  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML =
      `<li class="empty-state">No products selected yet.</li>`;
    return;
  }

  selectedProducts.forEach((product) => {
    const li = document.createElement("li");
    li.className = "selected-item";

    li.innerHTML = `
      <div class="selected-item-info">
        <strong>${product.name}</strong>
        <span>${product.brand} • ${product.category}</span>
      </div>
      <button type="button" class="remove-btn">Remove</button>
    `;

    li.querySelector(".remove-btn").addEventListener("click", () => {
      selectedProducts = selectedProducts.filter(
        (item) => item.name !== product.name
      );
      saveSelections();
      renderProducts();
      renderSelectedProducts();
    });

    selectedProductsList.appendChild(li);
  });
}

/* Clear all selections */
function clearAllSelections() {
  selectedProducts = [];
  saveSelections();
  renderProducts();
  renderSelectedProducts();
}

/* Save to localStorage */
function saveSelections() {
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

/* Generate personalized routine */
async function generateRoutine() {
  if (selectedProducts.length === 0) {
    addMessage(
      "Please select at least one product before generating a routine.",
      "assistant"
    );
    return;
  }

  const productData = selectedProducts.map((product) => ({
    name: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description
  }));

  addMessage("Generating your personalized routine...", "assistant");

  const routinePrompt = `
Create a personalized beauty routine using ONLY these selected products:

${JSON.stringify(productData, null, 2)}

Instructions:
- Use only the selected products
- Organize the routine clearly
- Separate into morning and evening if appropriate
- Briefly explain why each product is used
- Keep the advice practical, personalized, and beauty-focused
- Do not invent extra products
`;

  chatHistory.push({
    role: "user",
    content: routinePrompt
  });

  try {
    const aiReply = await sendToWorker(chatHistory);
    chatHistory.push({ role: "assistant", content: aiReply });
    addMessage(aiReply, "assistant");
  } catch (error) {
    console.error(error);
    addMessage(`Error: ${error.message}`, "assistant");
  }
}

/* Follow-up chat */
async function handleChatSubmit(event) {
  event.preventDefault();

  const message = userInput.value.trim();
  if (!message) return;

  addMessage(message, "user");
  userInput.value = "";

  chatHistory.push({
    role: "user",
    content: message
  });

  try {
    const aiReply = await sendToWorker(chatHistory);
    chatHistory.push({ role: "assistant", content: aiReply });
    addMessage(aiReply, "assistant");
  } catch (error) {
    console.error(error);
    addMessage(`Error: ${error.message}`, "assistant");
  }
}

/* Send conversation to Cloudflare Worker */
async function sendToWorker(messages) {
  const response = await fetch(WORKER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ messages })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to get response.");
  }

  return data.reply || "No response returned.";
}

/* Add message to chat */
function addMessage(text, sender) {
  const messageEl = document.createElement("div");
  messageEl.classList.add("msg", sender);
  messageEl.textContent = text;
  chatWindow.appendChild(messageEl);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}
