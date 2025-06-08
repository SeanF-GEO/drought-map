const droughtDates = [
  '20200107','20200204','20200303','20200407','20200505','20200602','20200707','20200804','20200901','20201006','20201103','20201201',
  '20210105','20210202','20210302','20210406','20210504','20210601','20210706','20210803','20210907','20211005','20211102','20211207',
  '20220104','20220201','20220301','20220405','20220503','20220607','20220705','20220802','20220906','20221004','20221101','20221206',
  '20230103','20230207','20230307','20230404','20230502','20230606','20230704','20230801','20230905','20231003','20231107','20231205',
  '20240102','20240206','20240305','20240402','20240507','20240604','20240702','20240806','20240903','20241001','20241105','20241203',
  '20250107','20250204','20250304','20250401','20250506','20250603'
];

const map = L.map('droughtMap').setView([37.8, -96], 4);

// Base layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 6,
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

function loadDrought(index) {
  const date = droughtDates[index];
  document.getElementById('dateLabel').textContent = `Date: ${date}`;
  if (droughtLayer) map.removeLayer(droughtLayer);

  fetch(`data/USDM_${date}.geojson`)
    .then(res => res.json())
    .then(data => {
      droughtLayer = L.geoJSON(data, {
        style: {
          color: '#cc0000',
          weight: 0.5,
          fillOpacity: 0.4
        }
      }).addTo(map);
    });
}

const slider = document.getElementById('dateSlider');
slider.addEventListener('input', () => loadDrought(slider.value));
slider.max = droughtDates.length - 1;

// Initial load
loadDrought(0);
