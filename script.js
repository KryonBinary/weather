const apiKey = '5f7b6f0bba4fa1bb1074c861edfb750e'; 
let myChart = null;

document.addEventListener('DOMContentLoaded', () => {
    updateClock();
    autoLocate();
});
setInterval(updateClock, 1000);


const searchInput = document.getElementById('search-input');
document.getElementById('search-btn').addEventListener('click', () => handleSearch());
document.getElementById('locate-btn').addEventListener('click', () => autoLocate());
searchInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') handleSearch(); });

function updateClock() {
    const now = new Date();
    document.getElementById('date').innerText = now.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });
}


function handleSearch() {
    const city = searchInput.value.trim();
    if(city) {
        fetchWeatherData(`q=${city}`);
        searchInput.value = '';
    }
}


async function autoLocate() {
    try {
        const res = await fetch('https://ipwho.is/');
        const data = await res.json();
        if(data.success) {
            fetchWeatherData(`lat=${data.latitude}&lon=${data.longitude}`);
        } else {
            fetchWeatherData('q=Hanoi');
        }
    } catch {
        fetchWeatherData('q=Hanoi');
    }
}


async function fetchWeatherData(query) {
    try {

        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?${query}&appid=${apiKey}&units=metric&lang=vi`);
        const data = await res.json();
        
        if(data.cod === 200) {
            updateUI(data); 
            
    
            const resForecast = await fetch(`https://api.openweathermap.org/data/2.5/forecast?${query}&appid=${apiKey}&units=metric&lang=vi`);
            const dataForecast = await resForecast.json();
            if(dataForecast.cod === "200") {
                updateForecastUI(dataForecast.list);
                drawChart(dataForecast.list);
            }
        } else {
            alert('Không tìm thấy địa điểm này!');
        }
    } catch(err) {
        console.error(err);
    }
}

function updateUI(data) {

    document.getElementById('city-name').innerHTML = `<i class="fa-solid fa-location-dot"></i> ${data.name}, ${data.sys.country}`;
    const temp = Math.round(data.main.temp);
    document.getElementById('temp').innerText = temp + "°";
    document.getElementById('desc').innerText = data.weather[0].description;
    
    const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    document.getElementById('weather-icon').src = iconUrl;


    document.title = `${temp}°C - ${data.name} | Weather App`;
    document.getElementById('favicon').href = iconUrl;

    document.getElementById('feels-like').innerText = Math.round(data.main.feels_like) + "°";
    document.getElementById('humidity').innerText = data.main.humidity + "%";
    document.getElementById('wind-speed').innerText = data.wind.speed + " m/s";
    document.getElementById('wind-dir').innerHTML = `<i class="fa-solid fa-location-arrow" style="transform: rotate(${data.wind.deg-45}deg)"></i> ${getCompassDirection(data.wind.deg)}`;
    document.getElementById('pressure').innerText = data.main.pressure + " hPa";
    document.getElementById('visibility').innerText = (data.visibility / 1000).toFixed(1) + " km";
    document.getElementById('sunrise').innerText = formatUnixTime(data.sys.sunrise);
    document.getElementById('sunset').innerText = formatUnixTime(data.sys.sunset);


    updateBackground(data.weather[0].main);
}

function updateForecastUI(list) {
    const forecastList = document.getElementById('forecast-list');
    forecastList.innerHTML = "";
    const dailyData = list.filter(item => item.dt_txt.includes("12:00:00")).slice(0, 3);
    
    dailyData.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayName = date.toLocaleDateString('vi-VN', { weekday: 'short' });
        const html = `
            <div class="forecast-item">
                <div style="font-size:0.8rem; font-weight:bold">${dayName}</div>
                <img class="forecast-icon" src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png">
                <div style="font-weight:bold">${Math.round(item.main.temp)}°</div>
            </div>`;
        forecastList.innerHTML += html;
    });
}


function drawChart(list) {
    const ctx = document.getElementById('tempChart').getContext('2d');
    const next8Hours = list.slice(0, 8);
    const labels = next8Hours.map(item => new Date(item.dt * 1000).getHours() + 'h');
    const dataPoints = next8Hours.map(item => Math.round(item.main.temp));

    if(myChart) myChart.destroy();
    

    Chart.register(ChartDataLabels);

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: dataPoints,
                borderColor: 'white',
                backgroundColor: 'rgba(255,255,255,0.2)',
                tension: 0.4, fill: true, pointBackgroundColor: 'white', pointRadius: 4, borderWidth: 2
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            layout: { padding: { top: 20 } },
            plugins: { 
                legend: { display: false }, tooltip: { enabled: false },
                datalabels: { color: 'white', anchor: 'end', align: 'top', offset: 5, font: { weight: 'bold' }, formatter: (v) => v + '°' }
            },
            scales: { x: { ticks: { color: '#eee' }, grid: { display: false } }, y: { display: false, min: Math.min(...dataPoints) - 5 } }
        }
    });
}


function formatUnixTime(unix) {
    return new Date(unix * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
}
function getCompassDirection(deg) {
    const directions = ['Bắc', 'Đông Bắc', 'Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc'];
    return directions[Math.round(deg / 45) % 8];
}
function updateBackground(main) {
    let url = 'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?q=80&w=1974';
    if(main === 'Clear') url = 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?q=80&w=1974';
    if(main === 'Clouds') url = 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=80&w=1951';
    if(main === 'Rain') url = 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=1974';
    document.body.style.backgroundImage = `url('${url}')`;
}