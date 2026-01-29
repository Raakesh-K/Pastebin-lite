async function createPaste() {
  const content = document.getElementById("content").value;
  const ttl = document.getElementById("ttl").value;
  const views = document.getElementById("views").value;
  const result = document.getElementById("result");

  try {
    const res = await fetch("/api/pastes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        ttl_seconds: ttl ? parseInt(ttl) : null,
        max_views: views ? parseInt(views) : null
      })
    });

    const data = await res.json();

    if (data.url) {
      result.innerHTML = `<a href="${data.url}" target="_blank">${data.url}</a>`;
    } else {
      result.innerText = data.error || "Failed";
    }
  } catch (err) {
    result.innerText = "Server error";
    console.error(err);
  }
}
