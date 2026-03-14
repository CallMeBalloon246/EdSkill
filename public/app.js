async function loadSkills() {
    const res = await fetch("/.netlify/functions/list-skills");
    const data = await res.json();
  
    const box = document.getElementById("skill-list");
    if (!box) return;
  
    box.innerHTML = data.map(item => `
      <div class="skill-card">
        <h3>${item.title}</h3>
        <p>${item.description}</p>
      </div>
    `).join("");
  }
  
  loadSkills();
  