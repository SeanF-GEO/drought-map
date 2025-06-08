const droughtDates = [
  '20200107','20200204','20200303','20200407','20200505','20200602','20200707','20200804','20200901','20201006','20201103','20201201',
  '20210105','20210202','20210302','20210406','20210504','20210601','20210706','20210803','20210907','20211005','20211102','20211207',
  '20220104','20220201','20220301','20220405','20220503','20220607','20220705','20220802','20220906','20221004','20221101','20221206',
  '20230103','20230207','20230307','20230404','20230502','20230606','20230704','20230801','20230905','20231003','20231107','20231205',
  '20240102','20240206','20240305','20240402','20240507','20240604','20240702','20240806','20240903','20241001','20241105','20241203',
  '20250107','20250204','20250304','20250401','20250506','20250603'
];

const map = L.map('droughtMap').setView([37.8, -96], 4);

// Base map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 6
}).addTo(map);

// State boundaries
fetch('data/48states.geojson')
  .then(res => res.json())
  .then(states => {
    L.geoJSON(states, {
      style: { color: '#333', weight: 1, fillOpacity: 0 }
    }).addTo(map);
  });

let droughtLayer;

function getColor(dm) {
  switch (DM) {
    case 0: return '#ffff00'; // D0 - yellow
    case 1: return '#fcd37f'; // D1 - light orange
    case 2: return '#ffaa00'; // D2 - orange
    case 3: return '#e60000'; // D3 - red
    case 4: return '#730000'; // D4 - dark red
    default: return '#cccccc'; // unknown
  }
}

function loadDrought(index) {
  const date = droughtDates[index];
  document.getElementById('dateLabel').textContent = `Date: ${date}`;

  if (droughtLayer) {
    map.removeLayer(droughtLayer);
  }

  fetch(`data/USDM_${date}.geojson`)
    .then(res => res.json())
    .then(data => {
      droughtLayer = L.geoJSON(data, {
        style: feature => ({
          color: '#444',
          weight: 0.5,
          fillColor: getColor(Number(feature.properties.DM)),
          fillOpacity: 0.7
        }),
        onEachFeature: (feature, layer) => {
          layer.bindPopup(`Intensity: D${feature.properties.DM}`);
        }
      }).addTo(map);
    });
}

const slider = document.getElementById('dateSlider');
slider.max = droughtDates.length - 1;
slider.addEventListener('input', () => loadDrought(slider.value));

// Initial load
loadDrought(0);

// Legend
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
