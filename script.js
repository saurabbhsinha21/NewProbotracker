let chart;
let chartData = [];
let chartLabels = [];
let tracking = false;
let interval;
let startTime;
let targetMinutes = 0;
let videoId = "";
let targetViews = 0;
let apiKey = "AIzaSyCo5NvQZpziJdaCsOjf1H2Rq-1YeiU9Uq8";

function startTracking() {
  clearInterval(interval);
  tracking = true;
  videoId = document.getElementById("videoId").value;
  targetViews = parseInt(document.getElementById("targetViews").value);
  startTime = new Date();

  const targetInput = document.getElementById("targetTime").value;
  const targetDate = new Date(targetInput);

  if (isNaN(targetDate.getTime())) {
    alert("Invalid target time. Please use the picker.");
    return;
  }

  const now = new Date();
  targetMinutes = Math.ceil((targetDate - now) / 60000);

  if (targetMinutes <= 0) {
    alert("Target time must be in the future.");
    return;
  }

  if (!chart) {
    initChart();
  }

  updateStats();
  interval = setInterval(updateStats, 60000);
}

function initChart() {
  const ctx = document.getElementById("viewChart").getContext("2d");
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: chartLabels,
      datasets: [{
        label: "Live Views",
        data: chartData,
        fill: false,
        borderColor: "blue",
        backgroundColor: "blue",
        tension: 0.3,
        pointRadius: 4
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: false
        }
      }
    }
  });
}

function updateStats() {
  fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKey}`)
    .then(res => res.json())
    .then(data => {
      const viewCount = parseInt(data.items[0].statistics.viewCount);
      const currentTime = new Date();
      const minutesPassed = Math.floor((currentTime - startTime) / 60000);
      const timeLeft = Math.max(0, targetMinutes - minutesPassed);

      chartLabels.push(currentTime.toLocaleTimeString());
      chartData.push(viewCount);
      chart.update();

      const last5 = chartData.length >= 6 ? viewCount - chartData[chartData.length - 6] : 0;
      const viewsPerMin = last5 / 5;
      const requiredRate = timeLeft > 0 ? (targetViews - viewCount) / timeLeft : 0;
      const requiredNext5 = requiredRate * 5;
      const projectedViews = Math.floor(viewCount + (viewsPerMin * timeLeft));
      const forecast = projectedViews >= targetViews ? "Yes" : "No";
      const viewsLeft = Math.max(0, targetViews - viewCount);

      function getViewsDiff(minutes) {
        const index = chartData.length - minutes;
        if (index >= 0) {
          return viewCount - chartData[index];
        }
        return 0;
      }

      const last15 = getViewsDiff(15);
      const last20 = getViewsDiff(20);
      const last25 = getViewsDiff(25);
      const last30 = getViewsDiff(30);
      const avg15 = last15 / 15;

      document.getElementById("liveViews").innerText = viewCount.toLocaleString();
      document.getElementById("last5Min").innerText = last5.toLocaleString();
      document.getElementById("last15Min").innerText = last15.toLocaleString();
      document.getElementById("last20Min").innerText = last20.toLocaleString();
      document.getElementById("last25Min").innerText = last25.toLocaleString();
      document.getElementById("last30Min").innerText = last30.toLocaleString();
      document.getElementById("avg15Min").innerText = isFinite(avg15) ? avg15.toFixed(2) : "-";
      document.getElementById("requiredRate").innerText = isFinite(requiredRate) ? requiredRate.toFixed(2) : "-";
      document.getElementById("requiredNext5").innerText = isFinite(requiredNext5) ? Math.round(requiredNext5).toLocaleString() : "-";
      document.getElementById("projectedViews").innerText = projectedViews.toLocaleString();
      document.getElementById("forecast").innerText = forecast;
      document.getElementById("timeLeft").innerText = `${timeLeft}:${(60 - currentTime.getSeconds()).toString().padStart(2, "0")}`;

      const viewsLeftEl = document.getElementById("viewsLeft");
      viewsLeftEl.innerText = viewsLeft.toLocaleString();
      viewsLeftEl.classList.remove("green", "red", "neutral");
      viewsLeftEl.classList.add(forecast === "Yes" ? "green" : "red");
    })
    .catch(error => {
      console.error("Error fetching YouTube data:", error);
    });
}
