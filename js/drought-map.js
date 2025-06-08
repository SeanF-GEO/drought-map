const droughtDates = [
  '20200107','20200204','20200303','20200407','20200505','20200602','20200707','20200804','20200901','20201006','20201103','20201201',
  '20210105','20210202','20210302','20210406','20210504','20210601','20210706','20210803','20210907','20211005','20211102','20211207',
  '20220104','20220201','20220301','20220405','20220503','20220607','20220705','20220802','20220906','20221004','20221101','20221206',
  '20230103','20230207','20230307','20230404','20230502','20230606','20230704','20230801','20230905','20231003','20231107','20231205',
  '20240102','20240206','20240305','20240402','20240507','20240604','20240702','20240806','20240903','20241001','20241105','20241203',
  '20250107','20250204','20250304','20250401','20250506','20250603'
];

// Initialize Leaflet map
const map = L.map('droughtMap').setView([37.8, -96], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 6
}).addTo(map);

// Load state outlines
fetch('data/48states.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      style: { color: '#333', weight: 1, fillOpacity: 0 }
    }).addTo(map);
  });

// Color function by DM level
function getColor(dm) {
  switch (dm) {
    case 0: return '#ffff00'; // D0
    case 1: return '#fcd37f'; // D1
    case 2: return '#ffaa00'; // D2
    case 3: return '#e60000'; // D3
    case 4: return '#730000'; // D4
    default: return '#cccccc';
  }
}

let droughtLayer;

// Load drought GeoJSON by full date
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

// Setup dropdowns
const yearSelect = document.getElementById('yearSelect');
const monthSelect = document.getElementById('monthSelect');

// Hardcoded year options
['2020','2021','2022','2023','2024','2025'].forEach(y => {
  const opt = document.createElement('option');
  opt.value = y;
  opt.textContent = y;
  yearSelect.appendChild(opt);
});

// Month options
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

// Handle dropdown changes
function handleSelectChange() {
  const year = yearSelect.value;
  const month = monthSelect.value;
  if (!year || !month) return;

  const match = droughtDates.find(d => d.startsWith(`${year}${month}`));
  if (match) {
    loadDroughtByDate(match);
  } else {
    alert(`No data found for ${year}-${month}`);
  }
}

yearSelect.addEventListener('change', handleSelectChange);
monthSelect.addEventListener('change', handleSelectChange);

// Set default selection (latest date available)
yearSelect.value = '2025';
monthSelect.value = '06';
handleSelectChange();

// Add legend
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
