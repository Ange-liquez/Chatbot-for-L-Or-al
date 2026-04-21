const container = document.getElementById("savedRoutines");

const routines = JSON.parse(localStorage.getItem("routines")) || [];

if (routines.length === 0) {
  container.innerHTML = "<p>No routines saved yet.</p>";
} else {
  container.innerHTML = routines.map(r => `
    <div class="card">
      <p>${r}</p>
    </div>
  `).join("");
}

function goHome() {
  window.location.href = "index.html";
}
