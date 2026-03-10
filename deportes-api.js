/* ========================================================
   MOTOR API YOUTUBE - GUNGO DEPORTES (Nivel Staff)
   ======================================================== */
const YOUTUBE_API_KEY = "AIzaSyDkp3j998hkGt6eHawy3P0cxePG82r8CUY"; // ¡Cambia esta llave después por seguridad!

const CANALES_OFICIALES = {
    nfl: "UCDVYQ4Zhbm3S2dlz7P1GBDg",      // NFL Oficial
    mlb: "UC08mnbiC4FykqpHqbEWgFcg",      // MLB Oficial
    nba: "UCWJ2lWNubArHWmf3FIHbfcQ",      // NBA Oficial
    futbol: "UCpcTrCXblq78GZrTUTLWeBw",   // Fútbol (Tu canal elegido)
    nhl: "UCqFMzb-4AUf6WAIbl132QKA",      // NHL Oficial
    voleibol: "UCGP7V-7K1xVb1eE3b2iNXXg", // Volleyball World
    tenis: "UC-2hhqBG5Su7s91_HmhaODQ",    // ATP Tour
    golf: "UC5igJFdBQVqg7hXFI7075OQ",      // PGA TOUR
    boxeo: "UC518BHmSjZ2R1UanxO9nHmg",    // Top Rank Boxing
    lacrosse: "UCvP1PWePZc24l_n4sX_R0Kw"  // Premier Lacrosse League
};

async function obtenerHighlights(deporteKey, channelId) {
    const cacheKey = `gungo_deportes_${deporteKey}`;
    const cacheActivo = sessionStorage.getItem(cacheKey);

    if (cacheActivo) return JSON.parse(cacheActivo);

    try {
        const url = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${channelId}&part=snippet,id&order=date&maxResults=4`;
        const response = await fetch(url);
        
        if (!response.ok) {
            console.error("Fallo de Google:", response.status, response.statusText);
            throw new Error(`Google rechazó la conexión (Código ${response.status})`);
        }
        
        const data = await response.json();
        const videos = data.items.filter(item => item.id && item.id.videoId).map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            date: new Date(item.snippet.publishedAt).toLocaleDateString(),
            thumbnail: item.snippet.thumbnails.high.url
        }));

        sessionStorage.setItem(cacheKey, JSON.stringify(videos));
        return videos;

    } catch (error) {
        console.error(`Error en API ${deporteKey}:`, error);
        return { error: true, mensaje: error.message };
    }
}

async function renderizarDeportes() {
    const grid = document.getElementById('deportes-grid');
    grid.innerHTML = '<div style="color:#FFEB3B; text-align:center; width:100%; font-weight:bold; grid-column: 1 / -1;">Conectando al satélite Gungo... 📡</div>';
    
    let htmlFinal = '';
    let huboError = false;

    for (const [deporte, channelId] of Object.entries(CANALES_OFICIALES)) {
        const videos = await obtenerHighlights(deporte, channelId);
        
        if (videos.error) {
            huboError = true;
            continue; 
        }

        videos.forEach(vid => {
            htmlFinal += `
            <div class="deportes-card" data-deporte="${deporte}">
                <div class="card-image">
                    <img src="${vid.thumbnail}" alt="${deporte}">
                    <span class="live-badge">NUEVO</span>
                </div>
                <div class="card-content">
                    <span class="sport-tag">${deporte.toUpperCase()}</span>
                    <h3 style="color:white; margin:10px 0; font-size:1.1rem;">${vid.title.substring(0, 50)}...</h3>
                    <p class="summary">${vid.channel} • ${vid.date}</p>
                    <div class="card-meta">
                        <button onclick="reproducirVideoAPI('${vid.id}', '${vid.title.replace(/'/g, "\\'")}')" class="watch-btn">Ver video ▶</button>
                    </div>
                </div>
            </div>`;
        });
    }

    if (htmlFinal === '' || huboError) {
        grid.innerHTML = `
        <div style="background: #2a0000; color: #ff4444; padding: 20px; border-radius: 10px; text-align: center; grid-column: 1 / -1; border: 1px solid red;">
            <h3>❌ Conexión Bloqueada por Google</h3>
            <p>1. Asegúrate de no abrir el archivo con doble clic (file://). Sube la página a GitHub o usa Live Server.</p>
            <p>2. Presiona <b>F12</b> y ve a la pestaña <b>Console</b> para leer el error exacto.</p>
        </div>`;
        return;
    }

    grid.innerHTML = htmlFinal;
    if (typeof safeFilter === 'function') safeFilter('all'); 
}

window.reproducirVideoAPI = function(videoId, titulo) {
    document.getElementById('modal-deporte-title').textContent = titulo;
    document.getElementById('modal-deporte-desc').textContent = "Transmitiendo desde servidores oficiales de YouTube.";
    
    const container = document.getElementById('modal-video-container');
    container.innerHTML = `
        <iframe width="100%" height="450" 
                src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&amp;rel=0&amp;modestbranding=1" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
        </iframe>
    `;

    const modal = document.getElementById('deporte-modal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(renderizarDeportes, 1000); 

});

