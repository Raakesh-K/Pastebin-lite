async function createPaste() {
  const content = document.getElementById("content").value;
  const ttl = document.getElementById("ttl").value;
  const views = document.getElementById("views").value;
  const result = document.getElementById("result");

  const BASE_URL = window.location.origin;

  try {
    const res = await fetch(`/api/pastes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        ttl_seconds: ttl ? parseInt(ttl) : null,
        max_views: views ? parseInt(views) : null
      })
    });

    // 🟢 SAFE JSON PARSE
    const text = await res.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Server did not return JSON");
    }

    if (!res.ok) {
      throw new Error(data.error || "Server error");
    }

    // ✅ SHOW LINK
    result.innerHTML = `
      <a href="${BASE_URL}${data.url}" target="_blank" style="color:#00ffc8;font-weight:bold;">
        ${BASE_URL}${data.url}
      </a>
    `;

  } catch (err) {
    result.innerText = "❌ " + err.message;
  }
}
