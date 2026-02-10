const apiKey = '12a9b591053ab6975bef5f64f74b61c2'; // API Key của bạn
let city = 'Hanoi'; // Giá trị mặc định nếu không tìm thấy IP

// 1. Đồng hồ
function updateClock() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
    document.getElementById('date').innerText = now.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });
}
setInterval(updateClock, 1000);
updateClock();

// 2. Xử lý tìm kiếm
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

searchBtn.addEventListener('click', () => {
    if (searchInput.value.trim() !== "") {
        city = searchInput.value;
        getCurrentWeather();
        getForecast();
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

// 4. Lấy thời tiết hiện tại
async function getCurrentWeather() {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=vi`;
    try {
        const res = await fetch(url);
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
            // Nếu không tìm thấy (do IP định vị sai tên), quay về mặc định
            if (city !== 'Hanoi') {
                alert("Không tìm thấy địa điểm từ IP, chuyển về Hà Nội.");
                city = 'Hanoi';
                getCurrentWeather();
                getForecast();
            }
        }
    } catch (error) {
        console.error("Lỗi:", error);
    }
}

// 5. Lấy dự báo
async function getForecast() {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&lang=vi`;
    try {
        const res = await fetch(url);
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
    } catch (error) { console.error(error); }
}

// 6. HÀM MỚI: Tự động định vị qua IP
async function autoLocate() {
    try {
        // Gọi API check IP miễn phí
        const ipRes = await fetch('https://ipwho.is/');
        const ipData = await ipRes.json();

        if (ipData.success) {
            // Nếu tìm thấy, gán thành phố từ IP vào biến city
            city = ipData.city;
            console.log("Đã phát hiện vị trí:", city);
        } else {
            console.log("Không check được IP, dùng mặc định Hà Nội");
        }
    } catch (error) {
        console.error("Lỗi check IP:", error);
    }

    // Sau khi có vị trí (hoặc mặc định), mới tải thời tiết
    getCurrentWeather();
    getForecast();
}

// Thay vì gọi trực tiếp, ta gọi hàm autoLocate khi mở web
autoLocate();