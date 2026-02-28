/* ========================================================
   GUNGO 2026 - SCRIPT PRINCIPAL HÍBRIDO PRO
   ======================================================== */

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyBv849w6NNk_4QhOnaY3x7LOE38apvc6o4",
    authDomain: "gungo-tv.firebaseapp.com",
    projectId: "gungo-tv",
    storageBucket: "gungo-tv.firebasestorage.app",
    messagingSenderId: "132166094948",
    appId: "1:132166094948:web:0ca391d2dc20306e85cf71",
    measurementId: "G-MFNZH83Y1X"
};

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const db = firebase.firestore();

// --- FUNCIONES GLOBALES ---
window.toggleSearch = function() {
    const overlay = document.getElementById('searchOverlay');
    const input = document.getElementById('searchInput');
    if (!overlay) return;
    overlay.classList.toggle('active');
    if (overlay.classList.contains('active')) setTimeout(() => input && input.focus(), 100);
};

window.toggleReact = function(btn, e) {
    e.stopPropagation(); 
    btn.classList.toggle('active');
    const span = btn.querySelector('span');
    if (span) {
        let count = parseInt(span.innerText.replace(/,/g, '')) || 0;
        span.innerText = btn.classList.contains('active') ? count + 1 : count - 1;
    }
};

window.shareNative = function(title, text) {
    if (navigator.share) {
        navigator.share({ title: title, text: text, url: window.location.href }).catch(console.error);
    } else {
        navigator.clipboard.writeText(window.location.href);
        window.showToast("¡Enlace copiado!");
    }
};

window.shareCurrentModal = function() {
    const title = document.getElementById('modalTitle')?.innerText || "Noticia GUNGO";
    window.shareNative(title, "¡Mira esta información en GUNGO.tv!");
};

window.showToast = function(msg) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.innerHTML = `<div class="toast-header">NOTIFICACIÓN</div><div class="toast-body">${msg}</div>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
};

/* --- MOTOR HÍBRIDO (FIREBASE + JSON) --- */
document.addEventListener("DOMContentLoaded", () => {
    const newsGrid = document.querySelector('.news-grid');

    if (newsGrid) {
        Promise.all([
            db.collection("noticias").orderBy("publishedAt", "desc").get()
              .catch(e => { console.warn("Modo Offline Firebase", e); return { docs: [] }; }),
            fetch('data.json').then(r => r.ok ? r.json() : null)
              .catch(e => { console.warn("Sin JSON", e); return null; })
        ])
        .then(([firebaseSnapshot, jsonData]) => {
            const firebaseNews = firebaseSnapshot.docs ? firebaseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) : [];
            const jsonNews = jsonData ? [...(jsonData.newsArticles || []), ...(jsonData.loadMoreData || [])] : [];
            
            // Unimos TODAS las noticias sin excluir las internacionales
            window.allNewsData = [...firebaseNews, ...jsonNews];
            
            renderNews(window.allNewsData.slice(0, 9), false); 
            
            let scrollLoaded = false;
            window.addEventListener('scroll', function loadRestOnScroll() {
                if (!scrollLoaded && window.scrollY > 300) {
                    scrollLoaded = true;
                    renderNews(window.allNewsData.slice(9), true);
                    window.removeEventListener('scroll', loadRestOnScroll);
                }
            });

            // CARGAR COMPONENTES FALTANTES
            if (jsonData) {
                if (jsonData.storiesData) renderStories(jsonData.storiesData);
                if (jsonData.tickerNews) updateTicker(jsonData.tickerNews);
                if (jsonData.pollData) initPoll(jsonData.pollData);
            }
        });
    }
    
       function renderNews(articles, append = false) {
    if (!newsGrid) return;
    if (!append) newsGrid.innerHTML = ''; 
    
    articles.forEach((news, index) => {
        const card = document.createElement('div');
        
        // Lógica de la Tarjeta Gigante
        if (index === 0 && !append) {
            card.className = 'news-card featured-card visible';
        } else {
            card.className = 'news-card visible';
        }
        
        const fallbackImg = "https://placehold.co/600x400/111/E50914/png?text=GUNGO+NEWS";

        card.innerHTML = `
            <span class="category-tag">${news.category || 'Noticia'}</span>
            <img src="${news.image}" alt="${news.title}" onerror="this.src='${fallbackImg}'" loading="lazy">
            <div class="card-content">
                <div class="reading-time"><i class="far fa-clock"></i> ${index === 0 && !append ? 'NOTICIA PRINCIPAL' : '3 min'}</div>
                <h3>${news.title}</h3>
                <p>${news.summary}</p>
                <div class="reaction-bar">
                    <button class="reaction-btn" onclick="window.toggleReact(this, event)">🔥 <span>${Math.floor(Math.random()*100)+10}</span></button>
                    <button class="share-btn-card" onclick="event.stopPropagation(); window.shareNative('${news.title}', 'Gungo.tv')"><i class="fas fa-share"></i></button>
                </div>
            </div>
        `;
        card.addEventListener('click', (e) => {
            if (!e.target.closest('button')) window.openModal(news);
        });
        newsGrid.appendChild(card);

        // --- INYECCIÓN DEL BANNER PUBLICITARIO PREMIUM ---
        if (index === 0 && !append) {
            const adBanner = document.createElement('div');
            adBanner.className = 'ad-container ad-leaderboard';
            adBanner.style.gridColumn = '1 / -1'; // Fuerza a que ocupe todo el ancho
            adBanner.style.margin = '20px auto 40px';
            adBanner.innerHTML = 'ESPACIO PUBLICITARIO PREMIUM (INSERTA TU CÓDIGO AQUÍ)';
            newsGrid.appendChild(adBanner);
        }
    });
}F

    /* --- FUNCIONES RESTAURADAS PARA QUE FUNCIONE EL JSON --- */
    function renderStories(stories) {
        const container = document.getElementById('storiesFeed');
        if (!container) return;
        container.innerHTML = stories.map(s => `
            <div>
                <div class="story-circle"><img src="${s.img}" alt="${s.name}" onerror="this.src='https://placehold.co/150x150/222/FFFFFF/png?text=User'"></div>
                <p class="story-name">${s.name}</p>
            </div>
        `).join('');
    }

    function updateTicker(newsList) {
        const el = document.querySelector('.breaking-text');
        if (el) el.innerText = newsList.map(item => item.title || item.text || "").join('   •   ') + '   •   ';
    }

    function initPoll(data) {
        const title = document.querySelector('.poll-title-text');
        const optsContainer = document.querySelector('.poll-options');
        if (title) title.innerText = data.question;
        if (optsContainer && data.options) {
            optsContainer.innerHTML = data.options.map(opt => `
                <div class="poll-option" onclick="window.votePoll(${opt.id})">
                    <span class="poll-text">${opt.text}</span>
                    <div class="poll-bar" id="bar-${opt.id}"></div>
                    <span class="poll-percent" id="percent-${opt.id}">0%</span>
                </div>
            `).join('');
        }
    }

    window.votePoll = function(id) {
        if (localStorage.getItem('gungo_poll_voted')) {
            window.showToast("¡Ya votaste en esta encuesta!");
            return;
        }
        const results = id === 0 ? [68, 32] : [41, 59];
        ['0', '1'].forEach((idx) => {
            const bar = document.getElementById(`bar-${idx}`);
            const pct = document.getElementById(`percent-${idx}`);
            if (bar) bar.style.width = results[idx] + '%';
            if (pct) pct.innerText = results[idx] + '%';
        });
        localStorage.setItem('gungo_poll_voted', 'true');
        window.showToast("¡Gracias por tu voto!");
    };

    // --- ZONATUBER ---
    function renderZonaTuber() {
        const ytGrid = document.getElementById('youtube-grid');
        if (!ytGrid) return;
        const videosYouTube = ["I0K_Eorx7yY", "4cPlfn7WUPw"]; 
        videosYouTube.forEach(videoId => {
            const iframe = document.createElement('iframe');
            iframe.setAttribute('src', `https://www.youtube-nocookie.com/embed/${videoId}`);
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
            iframe.setAttribute('allowfullscreen', 'true');
            iframe.style.width = "100%"; iframe.style.height = "300px"; iframe.style.maxWidth = "600px";
            iframe.style.borderRadius = "15px"; iframe.style.boxShadow = "0 10px 30px rgba(0,0,0,0.5)";
            iframe.style.border = "2px solid #333";
            ytGrid.appendChild(iframe);
        });
    }
    renderZonaTuber();
});

 // --- MODAL PREMIUM: GUNGO PULSE ---
window.openModal = function(article) {
    const modal = document.getElementById('newsModal');
    if (!modal) return;
    
    // Asignar datos básicos
    document.getElementById('modalImg').src = article.image;
    document.getElementById('modalTitle').innerText = article.title;
    
    // 1. CÁLCULO INTELIGENTE DEL TIEMPO DE LECTURA
    const textContent = article.longDescription || article.summary;
    const wordCount = textContent.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // Promedio humano: 200 palabras por minuto

    // 2. GENERADOR DE "SOCIAL PROOF" (Lectores en vivo aleatorios para FOMO)
    const liveViewers = Math.floor(Math.random() * (120 - 35 + 1)) + 35; // Entre 35 y 120 personas

    // Inyectar Categoría + Lectores + Tiempo
    document.getElementById('modalCat').innerHTML = `
        ${article.category || 'Gungo'} 
        <span class="live-readers"><i class="fas fa-circle"></i> ${liveViewers} leyendo ahora</span>
    `;

    // Inyectar la descripción (innerHTML para procesar etiquetas) y añadir la barra al inicio del texto
    document.getElementById('modalDesc').innerHTML = `
        <div id="progress-container"><div id="reading-progress"></div></div>
        <div class="smart-read-time"><i class="far fa-clock"></i> Tiempo estimado: ${readingTime} min</div>
        ${textContent}
    `;

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    // 3. MOTOR DE LA BARRA DE PROGRESO DE LECTURA
    const modalTextContainer = document.querySelector('.modal-text');
    const progressBar = document.getElementById('reading-progress');
    
    // Limpiar eventos anteriores para evitar bugs
    modalTextContainer.onscroll = null; 
    
    // Escuchar el scroll dentro de la noticia
    modalTextContainer.onscroll = function() {
        const scrollTop = modalTextContainer.scrollTop;
        const scrollHeight = modalTextContainer.scrollHeight - modalTextContainer.clientHeight;
        const scrollPercentage = (scrollTop / scrollHeight) * 100;
        
        if (progressBar) {
            progressBar.style.width = scrollPercentage + '%';
        }
    };
};

const closeModalBtn = document.querySelector('.close-modal');
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        if (window.speechSynthesis) { window.speechSynthesis.cancel(); }
        const btn = document.getElementById('tts-button');
        if (btn) { btn.classList.remove('playing'); btn.innerHTML = '<i class="fas fa-volume-up"></i> Escuchar noticia'; }
        document.getElementById('newsModal').classList.remove('open');
        document.body.style.overflow = 'auto';
    });
}

window.filtrarNoticias = function(categoria) {
    const botones = document.querySelectorAll('.filter-btn');
    botones.forEach(btn => btn.classList.remove('active', 'active-filter'));
    const normalize = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    const catBusqueda = normalize(categoria);
    
    let noticiasFiltradas = catBusqueda === 'TODO' || catBusqueda === 'INICIO' 
        ? window.allNewsData 
        : window.allNewsData.filter(item => item.category && normalize(item.category) === catBusqueda);

    const newsGrid = document.querySelector('.news-grid');
    newsGrid.innerHTML = ''; 
    
    noticiasFiltradas.forEach(news => {
        const card = document.createElement('div');
        card.className = 'news-card visible';
        card.innerHTML = `
            <span class="category-tag">${news.category}</span>
            <img src="${news.image}" alt="${news.title}">
            <div class="card-content">
                <h3>${news.title}</h3>
                <p>${news.summary}</p>
                <div class="reaction-bar">
                    <button class="reaction-btn" onclick="window.toggleReact(this, event)">🔥 <span>${Math.floor(Math.random()*100)+10}</span></button>
                    <button class="share-btn-card" onclick="event.stopPropagation(); window.shareNative('${news.title}', 'Gungo.tv')"><i class="fas fa-share"></i></button>
                </div>
            </div>
        `;
        card.addEventListener('click', (e) => { if (!e.target.closest('button')) window.openModal(news); });
        newsGrid.appendChild(card);
    });
    if (noticiasFiltradas.length === 0) window.showToast(`Sección ${categoria} sin noticias nuevas.`);
};

// --- CHAT CON SEGURIDAD ANTI-SPAM (Rate Limit) ---
let ultimoMensajeTime = 0;
window.sendGungoMessage = function() {
    const input = document.getElementById('chat-input');
    const display = document.getElementById('chat-display');
    if(!input || !display) return;
    
    let msg = input.value.trim();
    if (msg === "") return;

    // Seguridad 1: Rate Limiter
    const now = Date.now();
    if (now - ultimoMensajeTime < 4000) {
        window.showToast("Por favor espera 4 segundos entre mensajes.");
        return;
    }
    ultimoMensajeTime = now;

    // Seguridad 2: Filtro Anti-Groserías
    const prohibitedWords = ["http", ".com", "www", "spam", "puta", "mierda", "diablo", "estafa"]; 
    if (prohibitedWords.some(word => msg.toLowerCase().includes(word))) {
        window.showToast("Mensaje bloqueado: Sistema de seguridad activo.");
        input.value = "";
        return;
    }

    const msgContainer = document.createElement('div');
    msgContainer.style = "background: linear-gradient(145deg, #1a1a1a, #222); padding: 15px 20px; border-radius: 0px 20px 20px 20px; border: 1px solid #333; border-left: 4px solid #FFEB3B; font-size: 0.95rem; color: #fff; margin-bottom: 5px;";
    msgContainer.innerHTML = `<strong style="color: #FFEB3B; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 5px;"><i class="fas fa-user-circle"></i> UsuarioVIP_${Math.floor(Math.random() * 999)}</strong> ${msg}`;
    
    display.appendChild(msgContainer);
    display.scrollTop = display.scrollHeight; 
    input.value = "";
};

// --- TTS ---
if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
window.toggleSpeech = function() {
    const synth = window.speechSynthesis;
    const btn = document.getElementById('tts-button');
    if (synth.speaking) {
        synth.cancel();
        if(btn) { btn.classList.remove('playing'); btn.innerHTML = '<i class="fas fa-volume-up"></i> Escuchar noticia'; }
        return;
    }
    const utterance = new SpeechSynthesisUtterance(`${document.getElementById('modalTitle').innerText}. ${document.getElementById('modalDesc').innerText}`);
    const voice = synth.getVoices().find(v => v.lang.includes('es') || v.name.includes('Spanish') || v.name.includes('Monica'));
    utterance.voice = voice || synth.getVoices()[0];
    utterance.onend = () => { if(btn) { btn.classList.remove('playing'); btn.innerHTML = '<i class="fas fa-volume-up"></i> Escuchar noticia'; } };
    if(btn) { btn.classList.add('playing'); btn.innerHTML = '<i class="fas fa-stop"></i> Detener lectura'; }
    synth.speak(utterance);
};