const WORKER_URL = "https://shrill-bush-9db8.angeliquezometa.workers.dev";

let allProducts = [];
let selectedProducts = JSON.parse(localStorage.getItem("selectedProducts")) || [];

let chatHistory = [
  {
    role: "system",
    content:
      "You are a L'Oréal beauty advisor. Only give advice based on selected products and beauty-related topics. Do not recommend products not selected unless asked. If the user asks for a routine, use only the selected products."
  }
];

const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateBtn = document.getElementById("generateRoutine");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

document.addEventListener("DOMContentLoaded", async () => {
  addMessage("👋 Select products to build your routine!", "assistant");

  await loadProducts();
  renderSelectedProducts();

  categoryFilter.addEventListener("change", renderProducts);
  generateBtn.addEventListener("click", generateRoutine);
  chatForm.addEventListener("submit", handleChat);
});

async function loadProducts() {
  try {
    const response = await fetch("./products.json");

    if (!response.ok) {
      throw new Error("Could not load products.json");
    }

    const data = await response.json();
    allProducts = data.products;

    if (!Array.isArray(allProducts)) {
      throw new Error("products.json format is invalid.");
    }
  } catch (error) {
    console.error("Error loading products:", error);
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        Sorry, I couldn’t load the product list.
      </div>
    `;
    addMessage("There was a problem loading the product list.", "assistant");
  }
}

function renderProducts() {
  const selectedCategory = categoryFilter.value;

  if (!selectedCategory) {
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        Select a category to view products
      </div>
    `;
    return;
  }

  const filteredProducts = allProducts.filter(
    (product) => product.category === selectedCategory
  );

  if (filteredProducts.length === 0) {
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        No products found in this category.
      </div>
    `;
    return;
  }

  productsContainer.innerHTML = filteredProducts
    .map((product) => {
      const isSelected = selectedProducts.some((p) => p.id === product.id);

      return `
        <div class="product-card ${isSelected ? "selected" : ""}" data-id="${product.id}">
          <img src="${product.image}" alt="${product.name}" class="product-image" />
          <div class="product-info">
            <h3>${product.name}</h3>
            <p class="brand">${product.brand}</p>
            <p class="category">${product.category}</p>
            <button type="button" class="desc-btn">Details</button>
            <div class="desc hidden">${product.description}</div>
          </div>
        </div>
      `;
    })
    .join("");

  attachProductCardEvents();
}

function attachProductCardEvents() {
  const cards = document.querySelectorAll(".product-card");

  cards.forEach((card) => {
    const productId = Number(card.dataset.id);
    const product = allProducts.find((p) => p.id === productId);
    const descBtn = card.querySelector(".desc-btn");
    const descBox = card.querySelector(".desc");

    card.addEventListener("click", (event) => {
      if (event.target.classList.contains("desc-btn")) return;
      toggleProduct(product);
    });

    descBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      descBox.classList.toggle("hidden");
      descBtn.textContent = descBox.classList.contains("hidden")
        ? "Details"
        : "Hide Details";
    });
  });
}

function toggleProduct(product) {
  const exists = selectedProducts.some((p) => p.id === product.id);

  if (exists) {
    selectedProducts = selectedProducts.filter((p) => p.id !== product.id);
  } else {
    selectedProducts.push(product);
  }

  saveSelections();
  renderProducts();
  renderSelectedProducts();
}

function renderSelectedProducts() {
  if (!selectedProductsList) return;

  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `<p class="empty-state">No products selected yet.</p>`;
    return;
  }

  selectedProductsList.innerHTML = selectedProducts
    .map(
      (product) => `
        <div class="selected-item">
          <div class="selected-text">
            <strong>${product.name}</strong>
            <span>${product.brand}</span>
          </div>
          <button type="button" class="remove-btn" data-id="${product.id}">Remove</button>
        </div>
      `
    )
    .join("");

  const removeButtons = selectedProductsList.querySelectorAll(".remove-btn");

  removeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const productId = Number(button.dataset.id);
      selectedProducts = selectedProducts.filter((p) => p.id !== productId);
      saveSelections();
      renderProducts();
      renderSelectedProducts();
    });
  });
}

function saveSelections() {
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

async function generateRoutine() {
  if (selectedProducts.length === 0) {
    addMessage("Please select at least one product first.", "assistant");
    return;
  }

  addMessage("Generating your personalized routine...", "assistant");

  const prompt = `
Create a personalized beauty routine using ONLY these selected products:

${JSON.stringify(selectedProducts, null, 2)}

Instructions:
- Use only the selected products
- Organize the routine clearly
- Explain when to use each product
- Keep the advice beauty-focused and practical
- Do not invent products that are not listed
`;

  chatHistory.push({ role: "user", content: prompt });

  try {
    const reply = await sendToWorker(chatHistory);
    chatHistory.push({ role: "assistant", content: reply });
    addMessage(reply, "assistant");
  } catch (error) {
    console.error(error);
    addMessage("There was a problem generating your routine.", "assistant");
  }
}

async function handleChat(event) {
  event.preventDefault();

  const message = userInput.value.trim();
  if (!message) return;

  addMessage(message, "user");
  userInput.value = "";

  chatHistory.push({ role: "user", content: message });

  try {
    const reply = await sendToWorker(chatHistory);
    chatHistory.push({ role: "assistant", content: reply });
    addMessage(reply, "assistant");
  } catch (error) {
    console.error(error);
    addMessage("There was a problem getting a response.", "assistant");
  }
}

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
    throw new Error(data.error || "Worker request failed.");
  }

  return data.reply || "No response returned.";
}

function addMessage(text, sender) {
  const messageEl = document.createElement("div");
  messageEl.className = `msg ${sender}`;
  messageEl.textContent = text;
  chatWindow.appendChild(messageEl);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}
