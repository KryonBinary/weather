const apiKey = '12a9b591053ab6975bef5f64f74b61c2'; // Key cũ của bạn
const city = 'Hanoi'; // Đổi thành phố ở đây

// 1. Đồng hồ
function updateClock() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
    document.getElementById('date').innerText = now.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });
}
setInterval(updateClock, 1000);
updateClock();

// 2. Lấy thời tiết hiện tại
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
            document.getElementById('city-name').innerHTML = `<i class="fa-solid fa-location-dot"></i> ${data.name}`;
            document.getElementById('icon').src = `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
        }
    } catch (error) {
        console.error("Lỗi thời tiết hiện tại:", error);
    }
}

// 3. Lấy dự báo 3 ngày tới (Logic mới)
async function getForecast() {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&lang=vi`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.cod === "200") {
            const forecastList = document.getElementById('forecast-list');
            forecastList.innerHTML = ""; // Xóa nội dung cũ

            // API trả về 5 ngày, mỗi ngày 8 mốc (3h/lần). 
            // Ta lọc lấy mốc 12:00:00 trưa mỗi ngày để hiển thị
            const dailyData = data.list.filter(item => item.dt_txt.includes("12:00:00"));

            // Chỉ lấy 3 ngày đầu tiên trong danh sách lọc được
            for (let i = 0; i < 3; i++) {
                const dayData = dailyData[i];
                if (!dayData) break; // Phòng trường hợp thiếu dữ liệu

                const date = new Date(dayData.dt * 1000);
                const dayName = date.toLocaleDateString('vi-VN', { weekday: 'short' }); // Thứ (T2, T3...)
                const icon = `http://openweathermap.org/img/wn/${dayData.weather[0].icon}.png`;
                const temp = Math.round(dayData.main.temp) + "°";

                // Tạo HTML cho từng ô dự báo
                const html = `
                    <div class="forecast-item">
                        <div class="forecast-day">${dayName}</div>
                        <img class="forecast-icon" src="${icon}" alt="icon">
                        <div class="forecast-temp">${temp}</div>
                    </div>
                `;
                forecastList.innerHTML += html;
            }
        }
    } catch (error) {
        console.error("Lỗi dự báo:", error);
        document.getElementById('forecast-list').innerText = "Không lấy được dự báo.";
    }
}

// Gọi hàm chạy
getCurrentWeather();
getForecast();

// Cập nhật 10 phút/lần
setInterval(() => {
    getCurrentWeather();
    getForecast();
}, 600000);