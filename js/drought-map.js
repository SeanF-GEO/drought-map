const droughtDates = [
  '20200107','20200204','20200303','20200407','20200505','20200602','20200707','20200804','20200901','20201006','20201103','20201201',
  '20210105','20210202','20210302','20210406','20210504','20210601','20210706','20210803','20210907','20211005','20211102','20211207',
  '20220104','20220201','20220301','20220405','20220503','20220607','20220705','20220802','20220906','20221004','20221101','20221206',
  '20230103','20230207','20230307','20230404','20230502','20230606','20230704','20230801','20230905','20231003','20231107','20231205',
  '20240102','20240206','20240305','20240402','20240507','20240604','20240702','20240806','20240903','20241001','20241105','20241203',
  '20250107','20250204','20250304','20250401','20250506','20250603','20250701'
];

// 🌎 Initialize Leaflet map with full zoom capability
const map = L.map('droughtMap', {
  zoomControl: true
}).setView([37.8, -96], 5); // You can change this to your town’s coordinates

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19, // 🚀 Now you can zoom in all the way to street level
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// 🗺️ Load state outlines
fetch('data/48states.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      style: { color: '#333', weight: 1, fillOpacity: 0 }
    }).addTo(map);
  });

// 🎨 Get drought color by DM level
function getColor(dm) {
  return {
    0: '#FFF500',
    1: '#FFA500',
    2: '#FF0000',
    3: '#870000',
    4: '#390000'
  }[dm] || '#cccccc';
}

let droughtLayer;

// 🔁 Load and display drought GeoJSON by date
function loadDroughtByDate(dateStr) {
  if (!droughtDates.includes(dateStr)) {
    alert(`No data for ${dateStr}`);
    return;
  }

  if (droughtLayer) {
    map.removeLayer(droughtLayer);
  }

  fetch(`data/USDM_${dateStr}.geojson`)
    .then(res => res.json())
    .then(data => {
      droughtLayer = L.geoJSON(data, {
        style: f => ({
          fillColor: getColor(Number(f.properties.DM)),
          color: '#333',
          weight: 0.5,
          fillOpacity: 0.7
        }),
        onEachFeature: (f, layer) => {
          layer.bindPopup(`Drought Category: D${f.properties.DM}`);
        }
      }).addTo(map);
    });
}

// 📅 Populate dropdowns
const yearSelect = document.getElementById('yearSelect');
const monthSelect = document.getElementById('monthSelect');

// Add years
['2020','2021','2022','2023','2024','2025'].forEach(y => {
  const opt = document.createElement('option');
  opt.value = y;
  opt.textContent = y;
  yearSelect.appendChild(opt);
});

// Add months
[
  { val: '01', name: 'January' },
  { val: '02', name: 'February' },
  { val: '03', name: 'March' },
  { val: '04', name: 'April' },
  { val: '05', name: 'May' },
  { val: '06', name: 'June' },
  { val: '07', name: 'July' },
  { val: '08', name: 'August' },
  { val: '09', name: 'September' },
  { val: '10', name: 'October' },
  { val: '11', name: 'November' },
  { val: '12', name: 'December' }
].forEach(m => {
  const opt = document.createElement('option');
  opt.value = m.val;
  opt.textContent = m.name;
  monthSelect.appendChild(opt);
});

// 🧠 Handle dropdown changes
function handleSelectChange() {
  const year = yearSelect.value;
  const month = monthSelect.value;
  const match = droughtDates.find(d => d.startsWith(`${year}${month}`));
  if (match) {
    loadDroughtByDate(match);
  } else {
    alert(`No data found for ${year}-${month}`);
  }
}

yearSelect.addEventListener('change', handleSelectChange);
monthSelect.addEventListener('change', handleSelectChange);

// 📦 Load default on startup
yearSelect.value = '2020';
monthSelect.value = '01';
handleSelectChange();

// 🧭 Add legend
const legend = L.control({ position: 'bottomright' });
legend.onAdd = function () {
  const div = L.DomUtil.create('div', 'info legend');
  const levels = [0, 1, 2, 3, 4];
  const labels = [
    'D0 - Abnormally Dry',
    'D1 - Moderate Drought',
    'D2 - Severe Drought',
    'D3 - Extreme Drought',
    'D4 - Exceptional Drought'
  ];
  div.innerHTML = '<b>Drought Intensity</b><br>';
  levels.forEach((d, i) => {
    div.innerHTML += `<i style="background:${getColor(d)}"></i> ${labels[i]}<br>`;
  });
  return div;
};
legend.addTo(map);

// --- Counties and Chart Functionality ---

let countiesLayer;
let countiesVisible = false;
let selectedCounties = [];
let droughtChart;

document.getElementById('toggleCounties').addEventListener('click', () => {
  countiesVisible = !countiesVisible;
  if (countiesVisible) {
    loadCountiesLayer();
  } else if (countiesLayer) {
    map.removeLayer(countiesLayer);
    countiesLayer = null;
  }
});

function loadCountiesLayer() {
  fetch('data/enriched_counties.geojson')
    .then(res => res.json())
    .then(data => {
countiesLayer = L.geoJSON(data, {
  style: {
    color: '#114f57',       // 🟢 dark green border
    fillColor: '#a9e1e8',   // 🟩 light green fill
    weight: 1,              // border thickness
    fillOpacity: 0.4        // adjust: 0 = invisible, 1 = solid
  },
  onEachFeature: (feature, layer) => {
    layer.on('click', () => countyClicked(feature, layer));
  }
}).addTo(map);
    });
}

function countyClicked(feature, layer) {
  const countyId = feature.properties.conty_d;
  const isSelected = selectedCounties.find(c => c.id === countyId);

  if (isSelected) {
    selectedCounties = selectedCounties.filter(c => c.id !== countyId);
    layer.setStyle({ fillOpacity: 0.1, fillColor: '#000' });
  } else {
    selectedCounties.push({
      id: countyId,
      name: feature.properties.NAME,
      region: feature.properties.REGION || 'Unknown',
      data: getCountyDM(feature)
    });
    layer.setStyle({ fillOpacity: 0.6, fillColor: '#00f' });
  }

  updateChart();
}

function getCountyDM(feature) {
  const labels = [];
  const data = [];

  droughtDates.forEach(date => {
    const ym = date.slice(0, 6);
    const dmVal = feature.properties[`DM_${ym}`];
    labels.push(`${ym.slice(0, 4)}-${ym.slice(4, 6)}`);
    data.push(dmVal === null ? NaN : Number(dmVal));
  });

  return { labels, data };
}

function updateChart() {
  const ctx = document.getElementById('chartCanvas').getContext('2d');
  if (droughtChart) droughtChart.destroy();

  if (selectedCounties.length === 0) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    return;
  }

  droughtChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: selectedCounties[0].data.labels,
      datasets: selectedCounties.map((county, idx) => ({
        label: `${county.name} (${county.region})`,
        data: county.data.data,
        borderColor: getStyledChartColor(idx),
        backgroundColor: getStyledChartColor(idx),
        spanGaps: true,
        tension: 0.35,
        borderWidth: 3,
        pointRadius: 3
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          reverse: true,
          min: 0,
          max: 4,
          ticks: {
            stepSize: 1,
            callback: v => {
             const labels = {
              0: 'D0 (Abnormally Dry)',
              1: 'D1 (Moderate Drought)',
              2: 'D2 (Severe Drought)',
              3: 'D3 (Extreme Drought)',
              4: 'D4 (Exceptional Drought)'
              };
              return labels[v] || '';
            },
            color: '#435239',
            font: { size: 16, weight: 'bold' }
          },
          title: {
            display: true,
            text: 'Drought Intensity',
            color: '#435239',
            font: { size: 18 }
          },
          grid: {
            color: '#43523944'
          }
        },
        x: {
          ticks: {
            color: '#435239',
            font: { size: 14 }
          },
          title: {
            display: true,
            text: 'Date',
            color: '#435239',
            font: { size: 18 }
          },
          grid: {
            color: '#43523944'
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: '#435239',
            font: { size: 14, weight: 'bold' }
          }
        },
        tooltip: {
          backgroundColor: '#390600',
          titleColor: '#ffe8c2',
          bodyColor: '#ffe8c2',
          callbacks: {
            label: ctx =>{
              const val = ctx.raw;
              const labels = {
                0: 'D0 (Abnormally Dry)',
                1: 'D1 (Moderate Drought)',
                2: 'D2 (Severe Drought)',
                3: 'D3 (Extreme Drought)',
                4: 'D4 (Exceptional Drought)'
              };
              return isNaN(val) ? 'No Data' : labels[val] || `D${val}`;
            }
          }
        }
      }
    },
    plugins: [{
      id: 'customCanvasBackground',
      beforeDraw: (chart) => {
        const ctx = chart.canvas.getContext('2d');
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = '#ffe8c2';
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
      }
    }]
  });
}


function getStyledChartColor(i, opacity = 1) {
  const baseColors = [
    [139, 26, 26],   // #8B1A1A
    [160, 82, 45],   // #A0522D
    [115, 83, 6],  // #735306
    [107, 142, 35],  // #6B8E23
    [34, 139, 34],   // #228B22
    [0, 139, 139],   // #008B8B
    [0, 0, 139],     // #00008B
    [75, 0, 130],    // #4B0082
    [128, 0, 128],   // #800080
    [105, 105, 105]  // #696969
  ];
  const [r, g, b] = baseColors[i % baseColors.length];
  return `rgba(${r}, ${g}, ${b})`;
}
