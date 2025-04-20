let chart;
let chartData = [];
let chartLabels = [];
let tracking = false;
let interval;
let startTime;
let targetTime;
let firstSpikeTime;
let spikeInterval;
let videoId = "";
let targetViews = 0;
let apiKey = "AIzaSyCo5NvQZpziJdaCsOjf1H2Rq-1YeiU9Uq8";
let viewsLeftToMeetTarget = 0;

function startTracking() {
  clearInterval(interval);
  tracking = true;
  videoId = document.getElementById("videoId").value;
  targetViews = parseInt(document.getElementById("targetViews").value);
  targetTime = new Date(document.getElementById("targetTime").value);
  firstSpikeTime = new Date(document.getElementById("firstSpikeTime").value);
  spikeInterval = parseInt(document.getElementById("spikeInterval").value);
  startTime = new Date();

  if (!chart) {
    initChart();
  }

  updateStats();
  interval = setInterval(updateStats, 60000); // 1 minute interval
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
      const timeLeft = Math.max(0, (targetTime - currentTime) / 60000); // minutes left to target time

      chartLabels.push(currentTime.toLocaleTimeString());
      chartData.push(viewCount);
      chart.update();

      const requiredRate = (targetViews - viewCount) / timeLeft;
      const viewsLeft = Math.max(0, targetViews - viewCount);

      const spikeTimesAndViews = calculateSpikeTimesAndViews(viewCount, timeLeft);

      document.getElementById("liveViews").innerText = viewCount.toLocaleString();
      document.getElementById("timeLeft").innerText = `${timeLeft.toFixed(0)} minutes left`;

      const viewsLeftEl = document.getElementById("viewsLeft");
      viewsLeftEl.innerText = viewsLeft.toLocaleString();
      viewsLeftEl.classList.remove("green", "red", "neutral");
      viewsLeftEl.classList.add((requiredRate > 0) ? "green" : "red");

      const spikeHtml = spikeTimesAndViews.map(item => `${item.time} => ${item.requiredViews}`).join(' | ');

      document.getElementById("stats").innerHTML = `
        Live View Count: ${viewCount.toLocaleString()}<br>
        Upcoming Spike Times & Required Views: ${spikeHtml}<br>
        Views Left to Meet Target: ${viewsLeft.toLocaleString()}
      `;
    })
    .catch(error => {
      console.error("Error fetching YouTube data:", error);
    });
}

function calculateSpikeTimesAndViews(currentViews, timeLeft) {
  const spikes = [];
  const firstSpikeTimeAdjusted = firstSpikeTime.getTime();
  
  let spikeTime = firstSpikeTimeAdjusted;
  let viewsLeft = targetViews - currentViews;
  let totalSpikes = Math.floor(timeLeft / spikeInterval);

  for (let i = 0; i < totalSpikes; i++) {
    const nextSpikeTime = new Date(spikeTime + (i * spikeInterval * 60000));
    const timeToNextSpike = Math.max(0, (nextSpikeTime - Date.now()) / 60000);
    const requiredViews = Math.ceil(viewsLeft / (totalSpikes - i));
    spikes.push({ time: nextSpikeTime.toLocaleTimeString(), requiredViews });
  }

  return spikes;
}
