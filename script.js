let chart;
let chartData = [];
let chartLabels = [];
let tracking = false;
let interval;
let startTime;
let endTime;
let videoId = "";
let targetViews = 0;
let spikeStartTime;
let spikeIntervalMinutes = 5;
let apiKey = "AIzaSyCo5NvQZpziJdaCsOjf1H2Rq-1YeiU9Uq8";

function startTracking() {
  clearInterval(interval);
  tracking = true;
  videoId = document.getElementById("videoId").value;
  targetViews = parseInt(document.getElementById("targetViews").value);
  const targetTimeString = document.getElementById("targetTime").value;
  const firstSpikeTimeString = document.getElementById("firstSpikeTime").value;
  spikeIntervalMinutes = parseInt(document.getElementById("spikeInterval").value);

  if (!targetTimeString || !firstSpikeTimeString) {
    alert("Please select both target and first spike times.");
    return;
  }

  startTime = new Date();
  endTime = new Date(targetTimeString);
  spikeStartTime = new Date(firstSpikeTimeString);

  if (!chart) {
    initChart();
  }

  updateStats();
  interval = setInterval(updateStats, 10000); // every 10 seconds
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
        y: { beginAtZero: false }
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
      const timeLeftMinutes = Math.max(0, Math.floor((endTime - currentTime) / 60000));

      // Add new data point
      chartLabels.push(currentTime.toLocaleTimeString());
      chartData.push(viewCount);
      chart.update();

      // Calculate view differences using 6 points per minute
      const last5 = getViewsDiff(5);
      const last10 = getViewsDiff(10);
      const last15 = getViewsDiff(15);
      const last20 = getViewsDiff(20);
      const last25 = getViewsDiff(25);
      const last30 = getViewsDiff(30);
      const avg15 = last15 / 15;

      const viewsLeft = Math.max(0, targetViews - viewCount);
      const requiredRate = timeLeftMinutes > 0 ? viewsLeft / timeLeftMinutes : 0;
      const requiredNext5 = requiredRate * 5;
      const projectedViews = Math.floor(viewCount + (last5 / 5 * timeLeftMinutes));
      const forecast = projectedViews >= targetViews ? "Yes" : "No";

      document.getElementById("liveViews").innerText = viewCount.toLocaleString();
      document.getElementById("last5Min").innerText = last5.toLocaleString();
      document.getElementById("last10Min").innerText = last10.toLocaleString();
      document.getElementById("last15Min").innerText = last15.toLocaleString();
      document.getElementById("last20Min").innerText = last20.toLocaleString();
      document.getElementById("last25Min").innerText = last25.toLocaleString();
      document.getElementById("last30Min").innerText = last30.toLocaleString();
      document.getElementById("avg15Min").innerText = avg15.toFixed(2);
      document.getElementById("requiredRate").innerText = requiredRate.toFixed(2);
      document.getElementById("requiredNext5").innerText = Math.round(requiredNext5).toLocaleString();
      document.getElementById("projectedViews").innerText = projectedViews.toLocaleString();
      document.getElementById("forecast").innerText = forecast;

      const timeLeftString = `${timeLeftMinutes}:${(60 - currentTime.getSeconds()).toString().padStart(2, "0")}`;
      document.getElementById("timeLeft").innerText = timeLeftString;

      const viewsLeftEl = document.getElementById("viewsLeft");
      viewsLeftEl.innerText = viewsLeft.toLocaleString();
      viewsLeftEl.classList.remove("green", "red", "neutral");
      viewsLeftEl.classList.add(forecast === "Yes" ? "green" : "red");

      updateSpikeList(currentTime, viewCount, viewsLeft);
    })
    .catch(error => {
      console.error("Error fetching YouTube data:", error);
    });
}

function getViewsDiff(minutes) {
  const pointsPerMinute = 6; // 10-second intervals
  const pointsAgo = minutes * pointsPerMinute;
  const index = chartData.length - pointsAgo - 1;

  if (index >= 0) {
    return chartData[chartData.length - 1] - chartData[index];
  } else {
    return 0;
  }
}

function updateSpikeList(currentTime, currentViews, viewsLeft) {
  const spikeList = document.getElementById("spikeList");
  spikeList.innerHTML = "";

  let spikeTime = new Date(spikeStartTime);
  const spikes = [];

  while (spikeTime <= endTime) {
    if (spikeTime >= currentTime) {
      spikes.push(new Date(spikeTime));
    }
    spikeTime.setMinutes(spikeTime.getMinutes() + spikeIntervalMinutes);
  }

  const viewsPerSpike = spikes.length > 0 ? Math.ceil(viewsLeft / spikes.length) : 0;

  spikes.forEach(spike => {
    const li = document.createElement("li");
    li.textContent = `${spike.toLocaleTimeString()} - ${viewsPerSpike.toLocaleString()} views required`;
    spikeList.appendChild(li);
  });
}
