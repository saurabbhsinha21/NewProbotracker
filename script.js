let chart;
let chartData = [];
let chartLabels = [];
let tracking = false;
let interval;
let startTime;
let endTime;
let videoId = "";
let targetViews = 0;
let firstSpikeTime;
let spikeIntervalMin = 0;
let apiKey = "AIzaSyCo5NvQZpziJdaCsOjf1H2Rq-1YeiU9Uq8";

function startTracking() {
  clearInterval(interval);
  tracking = true;
  videoId = document.getElementById("videoId").value;
  targetViews = parseInt(document.getElementById("targetViews").value);
  const targetTimeString = document.getElementById("targetTime").value;
  const spikeTimeString = document.getElementById("firstSpikeTime").value;
  spikeIntervalMin = parseInt(document.getElementById("spikeInterval").value);

  if (!targetTimeString || !spikeTimeString) {
    alert("Please select target and first spike times.");
    return;
  }

  startTime = new Date();
  endTime = new Date(targetTimeString);
  firstSpikeTime = new Date(spikeTimeString);

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
      const timeLeftSeconds = Math.max(0, Math.floor((endTime - currentTime) / 1000));

      chartLabels.push(currentTime.toLocaleTimeString());
      chartData.push(viewCount);
      chart.update();

      const last5 = chartData.length >= 6 ? viewCount - chartData[chartData.length - 6] : 0;
      const last10 = chartData.length >= 11 ? viewCount - chartData[chartData.length - 11] : 0;
      const last15 = chartData.length >= 16 ? viewCount - chartData[chartData.length - 16] : 0;
      const last20 = chartData.length >= 21 ? viewCount - chartData[chartData.length - 21] : 0;
      const last25 = chartData.length >= 26 ? viewCount - chartData[chartData.length - 26] : 0;
      const last30 = chartData.length >= 31 ? viewCount - chartData[chartData.length - 31] : 0;
      const avg15 = last15 / 15;

      const requiredRate = timeLeftMinutes > 0 ? (targetViews - viewCount) / timeLeftMinutes : 0;
      const requiredNext5 = requiredRate * 5;
      const projectedViews = Math.floor(viewCount + (last5 / 5 * timeLeftMinutes));
      const forecast = projectedViews >= targetViews ? "Yes" : "No";
      const viewsLeft = Math.max(0, targetViews - viewCount);

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

      // 🟡 Spike Calculation
      const spikeList = document.getElementById("spikeList");
      spikeList.innerHTML = "";

      const spikes = [];
      let spikeTime = new Date(firstSpikeTime);
      while (spikeTime <= endTime) {
        if (spikeTime > currentTime) {
          spikes.push(new Date(spikeTime));
        }
        spikeTime.setMinutes(sp
