chrome.runtime.onMessage.addListener(async (request) => {
  if (request.action === "summarize") {
    const pageText = document.body.innerText.slice(0, 5000); // limit size

    showSidebar("Summarizing...");

    const summary = await getSummary(pageText);
    showSidebar(summary);
  }
});

function showSidebar(content) {
  let sidebar = document.getElementById("ai-sidebar");

  if (!sidebar) {
    sidebar = document.createElement("div");
    sidebar.id = "ai-sidebar";
    document.body.appendChild(sidebar);
  }

  sidebar.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      right: 0;
      width: 350px;
      height: 100%;
      background: white;
      box-shadow: -2px 0 5px rgba(0,0,0,0.3);
      padding: 15px;
      overflow-y: auto;
      z-index: 999999;
    ">
      <h3>AI Summary</h3>
      <p>${content}</p>
      <button onclick="this.parentElement.remove()">Close</button>
    </div>
  `;
}

async function getSummary(text) {
  const apiKey = "AIzaSyAsefR36Lz9QpC0zrNB9LZwLvV9ey6k8JE";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: "Summarize this webpage:\n\n" + text }
            ]
          }
        ]
      })
    }
  );

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "No summary available.";
}
