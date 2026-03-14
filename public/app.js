async function loadSkills() {
    const box = document.getElementById("skill-list");
    if (!box) return;
  
    try {
      const res = await fetch("/.netlify/functions/list-skills");
      const data = await res.json();
  
      if (!Array.isArray(data) || data.length === 0) {
        box.innerHTML = "<p>Chưa có kỹ năng nào.</p>";
        return;
      }
  
      box.innerHTML = data.map(item => `
        <div class="skill-card">
          <h3>${item.title}</h3>
          <p>${item.description}</p>
          <div class="skill-meta">ID kỹ năng: ${item.id}</div>
        </div>
      `).join("");
    } catch (error) {
      box.innerHTML = "<p>Không tải được dữ liệu kỹ năng.</p>";
      console.error(error);
    }
  }
  
  loadSkills();
  