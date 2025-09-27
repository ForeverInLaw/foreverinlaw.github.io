window.addEventListener('scroll', e=> {
	document.body.style.cssText += `--scrollTop: ${this.scrollY}px`
})
gsap.registerPlugin(ScrollTrigger, ScrollSmoother)
ScrollSmoother.create({
	wrapper: '.wrapper',
	content: '.content'
})
document.addEventListener('DOMContentLoaded', () => {
const spotifyWidget = document.getElementById('spotify-now-playing');
const apiUrl = 'https://spotify-show-last-68db402e666c.herokuapp.com/api/now-playing';
async function fetchNowPlaying() {
	try {
		const response = await fetch(apiUrl);
		if (!response.ok) {
			// Попытаться получить текст ошибки с сервера
			const errorData = await response.json().catch(() => ({})); // Попытаться распарсить JSON, если нет - пустой объект
			console.error(`Ошибка получения данных с API: ${response.status}`, errorData.error || '');
			spotifyWidget.textContent = 'Не удалось загрузить данные Spotify.';
			 spotifyWidget.className = 'not-playing'; // Добавить класс для стилизации ошибки/неактивности
			return;
		}

		const data = await response.json();

		if (data.trackId) {
			// Если есть trackId (неважно, isPlaying true или false), показываем плеер
			const label = data.isPlaying ? "Now listening:" : "Last song on Spotify:";
			const embedHtml = `
				<p>${label}</p>
				<iframe
					style="border-radius:12px"
					src="https://open.spotify.com/embed/track/${data.trackId}?utm_source=generator&theme=0"
					width="100%" height="80" frameBorder="0" allowfullscreen=""
					allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
					loading="lazy">
				</iframe>
			`;
			spotifyWidget.innerHTML = embedHtml;
			spotifyWidget.className = ''; // Убираем класс not-playing
		} else {
			// Сюда попадаем ТОЛЬКО если бэкенд не вернул trackId
			spotifyWidget.textContent = 'Spotify неактивен.'; // Текст для случая, когда нет ни текущего, ни последнего трека
			spotifyWidget.className = 'not-playing';
		}
		

	} catch (error) {
		console.error('Ошибка при запросе к API:', error);
		spotifyWidget.textContent = 'Ошибка соединения с сервером Spotify.';
		 spotifyWidget.className = 'not-playing';
	}
}

// Запрашивать данные сразу при загрузке
fetchNowPlaying();

// И затем обновлять каждые 30 секунд (30000 миллисекунд)
setInterval(fetchNowPlaying, 30000);

}); // Конец 'DOMContentLoaded'
