const apiKey = '5f7b6f0bba4fa1bb1074c861edfb750';
let myChart = null;

// 1. Khởi tạo & Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    updateClock();
    autoLocate(); // Tự động tìm vị trí khi mở
});

setInterval(updateClock, 1000);

const searchInput = document.getElementById('search-input');
document.getElementById('search-btn').addEventListener('click', () => handleSearch());
document.getElementById('locate-btn').addEventListener('click', () => autoLocate());
searchInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') handleSearch(); });

// 2. Các hàm xử lý chính
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
            fetchWeatherData('q=Hanoi'); // Mặc định
        }
    } catch {
        fetchWeatherData('q=Hanoi');
    }
}

// 3. Hàm gọi API "All-in-One"
async function fetchWeatherData(query) {
    try {
        // A. Thời tiết hiện tại
        const resCurrent = await fetch(`https://api.openweathermap.org/data/2.5/weather?${query}&appid=${apiKey}&units=metric&lang=vi`);
        const currentData = await resCurrent.json();
        
        if(currentData.cod === 200) {
            updateUI(currentData);
            updateBackground(currentData.weather[0].main);
        } else {
            alert('Không tìm thấy địa điểm!');
            return;
        }

        // B. Dự báo (Cho list 3 ngày & Biểu đồ)
        const resForecast = await fetch(`https://api.openweathermap.org/data/2.5/forecast?${query}&appid=${apiKey}&units=metric&lang=vi`);
        const forecastData = await resForecast.json();
        
        if(forecastData.cod === "200") {
            updateForecastUI(forecastData.list);
            drawChart(forecastData.list);
        }

    } catch(err) {
        console.error(err);
    }
}

// 4. Cập nhật giao diện (UI)
function updateUI(data) {
    // Thông tin chính
    document.getElementById('city-name').innerHTML = `<i class="fa-solid fa-location-dot"></i> ${data.name}, ${data.sys.country}`;
    document.getElementById('temp').innerText = Math.round(data.main.temp) + "°";
    document.getElementById('desc').innerText = data.weather[0].description;
    document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

    // Chi tiết Grid
    document.getElementById('feels-like').innerText = Math.round(data.main.feels_like) + "°";
    document.getElementById('humidity').innerText = data.main.humidity + "%";
    document.getElementById('pressure').innerText = data.main.pressure + " hPa";
    document.getElementById('visibility').innerText = (data.visibility / 1000).toFixed(1) + " km";
    
    // Gió & Hướng gió
    document.getElementById('wind-speed').innerText = data.wind.speed + " m/s";
    const deg = data.wind.deg;
    document.getElementById('wind-dir-icon').querySelector('i').style.transform = `rotate(${deg - 45}deg)`; // Xoay icon theo hướng gió
    document.getElementById('wind-dir-text').innerText = getCompassDirection(deg);

    // Bình minh / Hoàng hôn
    document.getElementById('sunrise').innerText = formatUnixTime(data.sys.sunrise);
    document.getElementById('sunset').innerText = formatUnixTime(data.sys.sunset);
}

function updateForecastUI(list) {
    const forecastList = document.getElementById('forecast-list');
    forecastList.innerHTML = "";
    
    // Lọc lấy 12:00 trưa mỗi ngày
    const dailyData = list.filter(item => item.dt_txt.includes("12:00:00")).slice(0, 3);
    
    dailyData.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayName = date.toLocaleDateString('vi-VN', { weekday: 'short' });
        const html = `
            <div class="forecast-item">
                <div style="font-size:0.8rem; font-weight:bold">${dayName}</div>
                <img class="forecast-icon" src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png">
                <div style="font-weight:bold">${Math.round(item.main.temp)}°</div>
            </div>
        `;
        forecastList.innerHTML += html;
    });
}

// 5. Hàm phụ trợ
function formatUnixTime(unix) {
    const date = new Date(unix * 1000);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function getCompassDirection(deg) {
    const directions = ['Bắc', 'Đông Bắc', 'Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc'];
    return directions[Math.round(deg / 45) % 8];
}

function updateBackground(main) {
    // Logic đổi nền như cũ, bạn có thể thêm ảnh mới tùy thích
    let url = 'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?q=80&w=1974';
    if(main === 'Clear') url = 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?q=80&w=1974';
    if(main === 'Clouds') url = 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=80&w=1951';
    if(main === 'Rain') url = 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=1974';
    document.body.style.backgroundImage = `url('${url}')`;
}

// 6. Vẽ biểu đồ (Chart.js)
function drawChart(list) {
    const ctx = document.getElementById('tempChart').getContext('2d');
    const next8Hours = list.slice(0, 8); // Lấy 24h tới (8 mốc x 3h)
    
    const labels = next8Hours.map(item => {
        return new Date(item.dt * 1000).getHours() + 'h';
    });
    const dataPoints = next8Hours.map(item => Math.round(item.main.temp));

    if(myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Nhiệt độ',
                data: dataPoints,
                borderColor: 'white',
                backgroundColor: 'rgba(255,255,255,0.2)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: 'white',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#eee' }, grid: { display: false } },
                y: { display: false }
            }
        }
    });
}