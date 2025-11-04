document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const logoutBtn = document.getElementById("logoutBtn");
  const moodSelector = document.getElementById("mood-selector");
  const saveMoodBtn = document.getElementById("saveMoodBtn");
  const moodNoteInput = document.getElementById("mood-note");
  const moodFeedback = document.getElementById("mood-feedback");
  const moodChartCanvas = document.getElementById("moodChart");

  let selectedMood = null;
  let moodChart = null;

  // --- Logout ---
  logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });

  // --- Mood Selection ---
  moodSelector.addEventListener("click", (e) => {
    const button = e.target.closest(".emoji-btn");
    if (!button) return;

    document.querySelectorAll(".emoji-btn").forEach((btn) => btn.classList.remove("selected"));
    button.classList.add("selected");
    selectedMood = button.dataset.mood;
  });

  // --- Save Mood ---
  saveMoodBtn.addEventListener("click", async () => {
    if (!selectedMood) {
      showFeedback("Please select a mood emoji.", "error");
      return;
    }

    saveMoodBtn.disabled = true;
    saveMoodBtn.textContent = "Saving...";

    try {
      // const res = await fetch("http://localhost:4000/api/mood", {
      //above one changed to below for deployment
      const res = await fetch("https://mindbloom-8xjk.onrender.com/api/mood", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mood: selectedMood,
          note: moodNoteInput.value,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showFeedback("Mood saved successfully!", "success");
        moodNoteInput.value = "";
        document.querySelectorAll(".emoji-btn").forEach((btn) => btn.classList.remove("selected"));
        selectedMood = null;
        fetchMoodData();
      } else {
        throw new Error(data.message || "Failed to save mood.");
      }
    } catch (error) {
      showFeedback(error.message, "error");
    } finally {
      saveMoodBtn.disabled = false;
      saveMoodBtn.textContent = "Save Mood";
    }
  });

  // --- Feedback message ---
  function showFeedback(message, type = "success") {
    moodFeedback.textContent = message;
    moodFeedback.className = `text-center text-sm mt-2 h-4 ${
      type === "error" ? "text-red-500" : "text-green-500"
    }`;
    setTimeout(() => (moodFeedback.textContent = ""), 3000);
  }

  // --- Fetch Moods for Chart ---
  async function fetchMoodData() {
    try {
      // const res = await fetch("http://localhost:4000/api/mood", {
      //above one changed to below for deployment
      const res = await fetch("https://mindbloom-8xjk.onrender.com/api/mood", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Could not fetch mood data");
      const data = await res.json();
      renderMoodChart(data);
    } catch (error) {
      console.error("Mood fetch error:", error);
    }
  }

  // --- Render Chart ---
  function renderMoodChart(data) {
    const labels = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString("en-US", { weekday: "short" }));
    }

    const dailyMoods = new Array(7).fill(null);

    data.forEach((entry) => {
      const entryDate = new Date(entry.createdAt);
      const diffDays = Math.floor((today - entryDate) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        dailyMoods[6 - diffDays] = parseInt(entry.mood);
      }
    });

    if (moodChart) moodChart.destroy();

    moodChart = new Chart(moodChartCanvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Your Mood",
            data: dailyMoods,
            borderColor: "#6366f1",
            backgroundColor: "rgba(99,102,241,0.1)",
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: "#6366f1",
            pointRadius: 5,
            pointHoverRadius: 7,
            spanGaps: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 5,
            ticks: {
              stepSize: 1,
              callback: (value) => ["😩", "😟", "😐", "😊", "🥰"][value - 1] || "",
            },
          },
          x: { grid: { display: false } },
        },
        plugins: { legend: { display: false } },
      },
    });
  }

  // --- Filter Buttons ---
  const filterButtons = document.querySelectorAll(".rec-filter-btn");
  const recItems = document.querySelectorAll(".rec-item");

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Highlight selected button
      filterButtons.forEach((b) =>
        b.classList.replace("bg-indigo-100", "bg-gray-100")
      );
      filterButtons.forEach((b) => b.classList.replace("text-indigo-700", "text-gray-600"));
      btn.classList.replace("bg-gray-100", "bg-indigo-100");
      btn.classList.replace("text-gray-600", "text-indigo-700");

      const category = btn.textContent.trim();
      recItems.forEach((item) => {
        const title = item.querySelector("h3").textContent.toLowerCase();
        if (category === "All" || title.includes(category.toLowerCase().split(" ")[0])) {
          item.style.display = "flex";
        } else {
          item.style.display = "none";
        }
      });
    });
  });

  // --- Recommendation Clicks (open + mark visited) ---
  recItems.forEach((item) => {
    const title = item.querySelector("h3").textContent;
    const lastVisited = item.querySelector("p");

    const visitedData = JSON.parse(localStorage.getItem("visitedArticles") || "{}");
    if (visitedData[title]) {
      lastVisited.textContent = `Last visited: ${visitedData[title]}`;
    }

    item.addEventListener("click", () => {
      let link = "#";
      if (title.includes("Mindfulness"))
        link = "https://www.headspace.com/mindfulness";
      else if (title.includes("Sleep"))
        link = "https://www.sleepfoundation.org/sleep-hygiene";
      else if (title.includes("Foods"))
        link = "https://www.healthline.com/nutrition/foods-that-boost-mood";

      window.open(link, "_blank");

      const date = new Date().toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });

      visitedData[title] = date;
      localStorage.setItem("visitedArticles", JSON.stringify(visitedData));
      lastVisited.textContent = `Last visited: ${date}`;
    });
  });

  // --- Fix Navigation Links ---
  document.querySelectorAll("nav a").forEach((link) => {
    const text = link.textContent.trim().toLowerCase();
    if (text === "home") link.href = "index.html";
    if (text === "resources") link.href = "resources.html";
    if (text === "survey") link.href = "index.html#survey";
    if (text === "chatbot") link.href = "index.html#chatbot";
    if (text === "about us") link.href = "aboutus.html";
  });

  // --- Initial Load ---
  fetchMoodData();
});
