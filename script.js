const WORKER_URL = "https://shrill-bush-9db8.angeliquezometa.workers.dev";

let allProducts = [];
let selected = [];

const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const selectedProducts = document.getElementById("selectedProducts");
const generateBtn = document.getElementById("generateRoutine");
const chatWindow = document.getElementById("chatWindow");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");

document.addEventListener("DOMContentLoaded", loadProducts);

async function loadProducts() {
  try {
    const res = await fetch("./products.json");
    const data = await res.json();
    allProducts = data.products;

    console.log("LOADED:", allProducts);
  } catch (err) {
    console.error("FAILED:", err);
    productsContainer.innerHTML = "FAILED TO LOAD PRODUCTS";
  }
}

categoryFilter.addEventListener("change", () => {
  const category = categoryFilter.value;

  const filtered = allProducts.filter(p => p.category === category);

  productsContainer.innerHTML = filtered.map(p => `
    <div class="product" data-id="${p.id}">
      <img src="${p.image}" />
      <h3>${p.name}</h3>
      <p>${p.brand}</p>
    </div>
  `).join("");

  document.querySelectorAll(".product").forEach(card => {
    card.addEventListener("click", () => toggleProduct(card.dataset.id));
  });
});

function toggleProduct(id) {
  const product = allProducts.find(p => p.id == id);

  if (selected.some(p => p.id == id)) {
    selected = selected.filter(p => p.id != id);
  } else {
    selected.push(product);
  }

  renderSelected();
}

function renderSelected() {
  selectedProducts.innerHTML = selected.map(p => `
    <div>${p.name}</div>
  `).join("");
}

generateBtn.addEventListener("click", async () => {
  if (selected.length === 0) {
    alert("Select products first");
    return;
  }

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: `Create routine using: ${JSON.stringify(selected)}`
          }
        ]
      })
    });

    const data = await response.json();

    chatWindow.innerHTML += `<div>${data.reply}</div>`;
  } catch (err) {
    chatWindow.innerHTML += `<div>ERROR GENERATING ROUTINE</div>`;
  }
});

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const message = userInput.value;

  chatWindow.innerHTML += `<div><b>You:</b> ${message}</div>`;

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: message }]
      })
    });

    const data = await response.json();

    chatWindow.innerHTML += `<div><b>AI:</b> ${data.reply}</div>`;
  } catch {
    chatWindow.innerHTML += `<div>ERROR</div>`;
  }

  userInput.value = "";
});
