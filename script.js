const apiKey = '5f7b6f0bba4fa1bb1074c861edfb750e'; 

// 1. Đồng hồ
function updateClock() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
    document.getElementById('date').innerText = now.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });
}
setInterval(updateClock, 1000);
updateClock();

// 2. Xử lý tìm kiếm (Tìm theo TÊN)
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

searchBtn.addEventListener('click', () => {
    const city = searchInput.value.trim();
    if (city !== "") {
        // Tìm theo tên thành phố (q=...)
        loadWeather(`q=${city}`);
        searchInput.value = "";
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchBtn.click();
});

// 3. Hàm đổi hình nền
function updateBackground(weatherMain) {
    let bgUrl = '';
    switch (weatherMain) {
        case 'Clear': 
            bgUrl = 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?q=80&w=1974&auto=format&fit=crop';
            break;
        case 'Clouds': 
            bgUrl = 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=80&w=1951&auto=format&fit=crop';
            break;
        case 'Rain': 
        case 'Drizzle':
            bgUrl = 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=1974&auto=format&fit=crop';
            break;
        case 'Thunderstorm': 
            bgUrl = 'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?q=80&w=2071&auto=format&fit=crop';
            break;
        case 'Snow': 
            bgUrl = 'https://images.unsplash.com/photo-1477601263568-180e2c6d046e?q=80&w=2070&auto=format&fit=crop';
            break;
        case 'Mist': 
        case 'Haze':
        case 'Fog':
            bgUrl = 'https://images.unsplash.com/photo-1485236715568-ddc5ee6ca227?q=80&w=1974&auto=format&fit=crop';
            break;
        default: 
            bgUrl = 'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?q=80&w=1974&auto=format&fit=crop';
    }
    document.body.style.backgroundImage = `url('${bgUrl}')`;
}

// 4. HÀM GỌI API CHUNG (Chấp nhận cả Tên hoặc Tọa độ)
async function loadWeather(queryParam) {
    // queryParam sẽ là "q=Hanoi" hoặc "lat=20&lon=105"
    
    // A. Lấy thời tiết hiện tại
    try {
        const urlCurrent = `https://api.openweathermap.org/data/2.5/weather?${queryParam}&appid=${apiKey}&units=metric&lang=vi`;
        const res = await fetch(urlCurrent);
        const data = await res.json();
        
        if (data.cod === 200) {
            document.getElementById('temp').innerText = Math.round(data.main.temp) + "°";
            document.getElementById('desc').innerText = data.weather[0].description;
            document.getElementById('humidity').innerText = data.main.humidity + "%";
            document.getElementById('wind').innerText = data.wind.speed + " m/s";
            document.getElementById('visibility').innerText = (data.visibility / 1000) + " km";
            document.getElementById('city-name').innerHTML = `<i class="fa-solid fa-location-dot"></i> ${data.name}, ${data.sys.country}`;
            document.getElementById('icon').src = `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
            
            updateBackground(data.weather[0].main);
        } else {
            alert("Không tìm thấy địa điểm này!");
        }
    } catch (error) { console.error("Lỗi Current:", error); }

    // B. Lấy dự báo
    try {
        const urlForecast = `https://api.openweathermap.org/data/2.5/forecast?${queryParam}&appid=${apiKey}&units=metric&lang=vi`;
        const res = await fetch(urlForecast);
        const data = await res.json();
        
        if (data.cod === "200") {
            const forecastList = document.getElementById('forecast-list');
            forecastList.innerHTML = "";
            const dailyData = data.list.filter(item => item.dt_txt.includes("12:00:00"));
            for (let i = 0; i < 3; i++) {
                const dayData = dailyData[i];
                if (!dayData) break;
                const date = new Date(dayData.dt * 1000);
                const dayName = date.toLocaleDateString('vi-VN', { weekday: 'short' });
                const icon = `http://openweathermap.org/img/wn/${dayData.weather[0].icon}.png`;
                const temp = Math.round(dayData.main.temp) + "°";
                const html = `
                    <div class="forecast-item">
                        <div class="forecast-day">${dayName}</div>
                        <img class="forecast-icon" src="${icon}" alt="icon">
                        <div class="forecast-temp">${temp}</div>
                    </div>`;
                forecastList.innerHTML += html;
            }
        }
    } catch (error) { console.error("Lỗi Forecast:", error); }
}

// 5. Tự động định vị (Dùng TỌA ĐỘ Lat/Lon -> Chuẩn 100%)
async function autoLocate() {
    try {
        const ipRes = await fetch('https://ipwho.is/');
        const ipData = await ipRes.json();

        if (ipData.success) {
            // Lấy chính xác tọa độ
            const lat = ipData.latitude;
            const lon = ipData.longitude;
            console.log(`Vị trí IP: ${ipData.city} (${lat}, ${lon})`);
            
            // Gọi API thời tiết bằng tọa độ (Không sợ sai tên nữa)
            loadWeather(`lat=${lat}&lon=${lon}`);
        } else {
            console.log("Không check được IP, về mặc định Hà Nội");
            loadWeather('q=Hanoi');
        }
    } catch (error) {
        console.error("Lỗi check IP:", error);
        loadWeather('q=Hanoi'); // Lỗi mạng thì về Hà Nội
    }
}

// Chạy check vị trí ngay khi mở web
autoLocate();