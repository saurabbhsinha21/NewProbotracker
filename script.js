let chart;
let chartData = [];
let chartLabels = [];
let chartTimestamps = [];
let tracking = false;
let interval;
let startTime;
let endTime;
let videoId = "";
let targetViews = 0;
let firstSpikeTime;
let spikeInterval = 0;
let apiKey = "AIzaSyCo5NvQZpziJdaCsOjf1H2Rq-1YeiU9Uq8";

function startTracking() {
  clearInterval(interval);
  tracking = true;

  videoId = document.getElementById("videoId").value;
  targetViews = parseInt(document.getElementById("targetViews").value);
  spikeInterval = parseInt(document.getElementById("spikeInterval").value);
  const targetTimeString = document.getElementById("targetTime").value;
  const firstSpikeTimeString = document.getElementById("firstSpikeTime").value;

  if (!targetTimeString || !firstSpikeTimeString) {
    alert("Please select both Target Time and First Spike Time.");
    return;
  }

  startTime = new Date();
  endTime = new Date(targetTimeString);
  firstSpikeTime = new Date(firstSpikeTimeString);

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

      chartLabels.push(currentTime.toLocaleTimeString());
      chartData.push(viewCount);
      chartTimestamps.push(currentTime);
      chart.update();

      // Time left
      const timeLeftMinutes = Math.max(0, Math.floor((endTime - currentTime) / 60000));
      const viewsLeft = Math.max(0, targetViews - viewCount);

      // Views over last X minutes using timestamps
      function getViewsInLastMinutes(minutes) {
        const cutoff = new Date(currentTime.getTime() - minutes * 60000);
        for (let i = chartTimestamps.length - 1; i >= 0; i--) {
          if (chartTimestamps[i] <= cutoff) {
            return viewCount - chartData[i];
          }
        }
        return 0;
      }

      const last5 = getViewsInLastMinutes(5);
      const last10 = getViewsInLastMinutes(10);
      const last15 = getViewsInLastMinutes(15);
      const last20 = getViewsInLastMinutes(20);
      const last25 = getViewsInLastMinutes(25);
      const last30 = getViewsInLastMinutes(30);
      const avg15 = last15 / 15;

      const viewsPerMin = last5 / 5;
      const requiredRate = timeLeftMinutes > 0 ? viewsLeft / timeLeftMinutes : 0;
      const requiredNext5 = requiredRate * 5;
      const projectedViews = Math.floor(viewCount + (viewsPerMin * timeLeftMinutes));
      const forecast = projectedViews >= targetViews ? "Yes" : "No";

      // Update DOM
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

      updateSpikeForecast(viewsLeft, currentTime);
    })
    .catch(error => {
      console.error("Error fetching YouTube data:", error);
    });
}

function updateSpikeForecast(viewsLeft, currentTime) {
  const forecastContainer = document.getElementById("spikeForecast");
  forecastContainer.innerHTML = "";

  if (!firstSpikeTime || spikeInterval <= 0 || viewsLeft <= 0) return;

  const spikes = [];
  let spikeTime = new Date(firstSpikeTime);
  while (spikeTime <= endTime) {
    if (spikeTime > currentTime) {
      spikes.push(new Date(spikeTime));
    }
    spikeTime.setMinutes(spikeTime.getMinutes() + spikeInterval);
  }

  const viewsPerSpike = Math.ceil(viewsLeft / spikes.length);

  const ul = document.createElement("ul");
  spikes.forEach(time => {
    const li = document.createElement("li");
    li.textContent = `${time.toLocaleTimeString()} - ${viewsPerSpike.toLocaleString()} views required`;
    ul.appendChild(li);
  });

  forecastContainer.appendChild(ul);
}
