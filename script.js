const WORKER_URL = "https://shrill-bush-9db8.angeliquezometa.workers.dev";

let allProducts = [];
let selectedProducts = [];

let user = JSON.parse(localStorage.getItem("user")) || {
  name: "Guest",
  skinType: "normal"
};

localStorage.setItem("user", JSON.stringify(user));

const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const chatWindow = document.getElementById("chatWindow");

/* LOAD */
fetch("products.json")
  .then(r => r.json())
  .then(data => allProducts = data.products);

/* CATEGORY */
categoryFilter.addEventListener("change", renderProducts);

function renderProducts() {
  const filtered = allProducts.filter(p => p.category === categoryFilter.value);

  productsContainer.innerHTML = filtered.map(p => `
    <div class="card ${selectedProducts.some(x=>x.id===p.id) ? "selected" : ""}" data-id="${p.id}">
      <div class="heart" onclick="event.stopPropagation(); toggleProduct(${p.id})">
        ${selectedProducts.some(x=>x.id===p.id) ? "❤️" : "🤍"}
      </div>
      <img src="${p.image}">
      <h3>${p.name}</h3>
      <p>${p.brand}</p>
      <button onclick="event.stopPropagation(); showModal(${p.id})">View</button>
    </div>
  `).join("");

  document.querySelectorAll(".card").forEach(c =>
    c.onclick = () => toggleProduct(Number(c.dataset.id))
  );
}

/* SELECT */
function toggleProduct(id) {
  const p = allProducts.find(x=>x.id===id);

  if (selectedProducts.some(x=>x.id===id)) {
    selectedProducts = selectedProducts.filter(x=>x.id!==id);
  } else {
    selectedProducts.push(p);
  }

  renderProducts();
  renderSelected();
}

function renderSelected() {
  selectedProductsList.innerHTML = selectedProducts.map(p=>`<div>${p.name}</div>`).join("");
}

/* MODAL */
function showModal(id) {
  const p = allProducts.find(x=>x.id===id);
  document.getElementById("modalContent").innerHTML = `<h2>${p.name}</h2><p>${p.description}</p>`;
  document.getElementById("modal").style.display = "flex";
}

/* ROUTINE */
document.getElementById("generateRoutine").onclick = async () => {
  if (!selectedProducts.length) return addMessage("Select products first","ai");

  const res = await fetch(WORKER_URL,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      messages:[{
        role:"user",
        content:`Routine for ${user.skinType} skin using: ${selectedProducts.map(p=>p.name).join(", ")}`
      }]
    })
  });

  const data = await res.json();
  addMessage(data.reply,"ai");

  const routines = JSON.parse(localStorage.getItem("routines"))||[];
  routines.push(data.reply);
  localStorage.setItem("routines",JSON.stringify(routines));
};

/* CHAT */
document.getElementById("chatForm").onsubmit = async e=>{
  e.preventDefault();

  const input = document.getElementById("userInput");
  const msg = input.value;

  addMessage(msg,"user");
  input.value="";

  const res = await fetch(WORKER_URL,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({messages:[{role:"user",content:msg}]})
  });

  const data = await res.json();
  addMessage(data.reply,"ai");
};

/* UI */
function addMessage(text,type){
  const d=document.createElement("div");
  d.className=type;
  d.textContent=text;
  chatWindow.appendChild(d);
  chatWindow.scrollTop=chatWindow.scrollHeight;
}

/* NAV */
function goDashboard(){window.location.href="dashboard.html";}
function logout(){localStorage.clear();location.reload();}
function toggleDark(){document.body.classList.toggle("dark");}
function updateSkin(type){user.skinType=type;localStorage.setItem("user",JSON.stringify(user));}
