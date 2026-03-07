/* ========================================================
   GUNGO 2026 - SCRIPT PRINCIPAL HÍBRIDO PRO
   ======================================================== */

var firebaseConfig = {
    apiKey: "AIzaSyBv849w6NNk_4QhOnaY3x7LOE38apvc6o4",
    authDomain: "gungo-tv.firebaseapp.com",
    projectId: "gungo-tv",
    storageBucket: "gungo-tv.firebasestorage.app",
    messagingSenderId: "132166094948",
    appId: "1:132166094948:web:0ca391d2dc20306e85cf71",
    measurementId: "G-MFNZH83Y1X"
};

if (!firebase.apps.length) { 
    firebase.initializeApp(firebaseConfig); 
}
var db = firebase.firestore();

// --- FUNCIONES GLOBALES INTERACTIVAS ---
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

/* --- SISTEMA DE REGISTRO VIP --- */
window.openAuthModal = () => {
    const modal = document.getElementById('authModal');
    if(modal) modal.classList.add('open');
};

window.closeAuthModal = () => {
    const modal = document.getElementById('authModal');
    if(modal) modal.classList.remove('open');
};

window.processAuth = function() {
    const user = document.getElementById('auth-username').value.trim();
    if(user.length < 3) return window.showToast("Tu alias debe tener al menos 3 letras.");
    
    localStorage.setItem('gungo_user', user);
    window.closeAuthModal();
    window.checkAuthStatus();
    window.showToast(`¡Bienvenido a la comunidad VIP, ${user}!`);
};

window.checkAuthStatus = function() {
    const user = localStorage.getItem('gungo_user');
    const overlay = document.getElementById('chat-auth-overlay');
    const btn = document.getElementById('user-auth-btn');
    if(user) {
        if(overlay) overlay.style.display = 'none';
        if(btn) btn.innerHTML = `<i class="fas fa-user-check"></i> ${user}`;
    } else {
        if(overlay) overlay.style.display = 'flex';
        if(btn) btn.innerHTML = `<i class="fas fa-user"></i> Ingresar`;
    }
};

/* --- MOTOR HÍBRIDO (FIREBASE + JSON) --- */
document.addEventListener("DOMContentLoaded", () => {
    const themeBtn = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('gungo_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            let theme = document.documentElement.getAttribute('data-theme');
            let newTheme = theme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('gungo_theme', newTheme);
        });
    }

    window.checkAuthStatus();
    
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
            
            window.allNewsData = [...firebaseNews, ...jsonNews];
            
            const breakingText = document.getElementById('ticker-text') || document.querySelector('.breaking-text');
            if (breakingText && window.allNewsData.length > 0) {
                breakingText.innerText = "GUNGO.TV ACTUALIZADO EN TIEMPO REAL   •   " + window.allNewsData.map(item => item.title).slice(0,5).join('   •   ');
            }

            renderNews(window.allNewsData.slice(0, 9), false); 
            
            let scrollLoaded = false;
            window.addEventListener('scroll', function loadRestOnScroll() {
                if (!scrollLoaded && window.scrollY > 300) {
                    scrollLoaded = true;
                    if (window.allNewsData.length > 9) {
                        renderNews(window.allNewsData.slice(9), true);
                    }
                    window.removeEventListener('scroll', loadRestOnScroll);
                }
            });

            if (jsonData) {
                if (jsonData.storiesData) renderStories(jsonData.storiesData);
                if (jsonData.pollData) initPoll(jsonData.pollData);
            }
        }).catch(err => console.error("Error cargando noticias:", err));
    }
    
    renderZonaTuber();
});

function renderNews(articles, append = false) {
    const newsGrid = document.querySelector('.news-grid');
    if (!newsGrid) return;
    if (!append) newsGrid.innerHTML = ''; 
    
    articles.forEach((news, index) => {
        const card = document.createElement('div');
        
        if (index === 0 && !append) {
            card.className = 'news-card featured-card visible';
        } else {
            card.className = 'news-card visible';
        }
        
        const fallbackImg = "https://placehold.co/600x400/111/E50914/png?text=GUNGO+NEWS";
        let textoLimpio = news.summary ? news.summary.replace(/<[^>]*>?/gm, '') : '';

        card.innerHTML = `
            <span class="category-tag">${news.category || 'Noticia'}</span>
            <img src="${news.image}" alt="${news.title}" onerror="this.src='${fallbackImg}'" loading="lazy">
            <div class="card-content">
                <div class="reading-time"><i class="far fa-clock"></i> ${index === 0 && !append ? 'HISTORIA PRINCIPAL' : '3 min'}</div>
                <h3 class="card-title-fix">${news.title}</h3>
                <p class="summary-text">${textoLimpio}</p>
                <button class="btn-read-more" style="background:transparent; color:#FFEB3B; border:none; font-weight:800; cursor:pointer; padding:0; text-align:left; margin-bottom:15px; display:inline-block;">LEER MÁS →</button>
                <div class="reaction-bar">
                    <button class="reaction-btn" onclick="window.toggleReact(this, event)">🔥 <span>${Math.floor(Math.random()*100)+10}</span></button>
                    <button class="share-btn-card" onclick="event.stopPropagation(); window.shareNative('${news.title}', 'Gungo.tv')"><i class="fas fa-share"></i></button>
                </div>
            </div>
        `;
        
        card.addEventListener('click', (e) => {
            if (!e.target.closest('button.reaction-btn') && !e.target.closest('button.share-btn-card')) {
                window.openModal(news);
            }
        });
        newsGrid.appendChild(card);

        if (index === 0 && !append) {
            const adBanner = document.createElement('div');
            adBanner.className = 'ad-container ad-leaderboard';
            adBanner.style.gridColumn = '1 / -1'; 
            adBanner.style.margin = '20px auto 40px';
            adBanner.innerHTML = 'ESPACIO PUBLICITARIO PREMIUM (INSERTA TU CÓDIGO AQUÍ)';
            newsGrid.appendChild(adBanner);
        }
    });
}

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

function renderZonaTuber() {
    const ytGrid = document.getElementById('youtube-grid');
    if (!ytGrid) return;
    const videosYouTube = ["I0K_Eorx7yY", "pHd_obdi9oE"]; 
    videosYouTube.forEach(videoId => {
        const iframe = document.createElement('iframe');
        iframe.setAttribute('src', `https://www.youtube-nocookie.com/embed/${videoId}`);
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
        iframe.setAttribute('allowfullscreen', 'true');
        iframe.classList.add('zonatuber-iframe'); 
        ytGrid.appendChild(iframe);
    });
}

// --- FILTRADO DE NOTICIAS UNIFICADO ---
window.filtrarNoticias = function(categoria) {
    const botones = document.querySelectorAll('.filter-btn');
    botones.forEach(btn => btn.classList.remove('active', 'active-filter'));

    const targetBtn = Array.from(botones).find(b => 
        b.innerText.trim().toUpperCase() === categoria.toUpperCase() || 
        (categoria.toUpperCase() === 'TODO' && b.innerText.trim() === 'INICIO')
    );
    if(targetBtn) targetBtn.classList.add('active');

    const normalize = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    const catBusqueda = normalize(categoria);
    
    let noticiasFiltradas = catBusqueda === 'TODO' || catBusqueda === 'INICIO' 
        ? window.allNewsData 
        : window.allNewsData.filter(item => item.category && normalize(item.category) === catBusqueda);

    renderNews(noticiasFiltradas, false);
    if (noticiasFiltradas.length === 0) window.showToast(`Sección ${categoria} sin noticias nuevas.`);
};

// --- MODAL DE LECTURA PRO (ARQUITECTURA DE PORTADA + FOTOS EMBEBIDAS) ---
window.openModal = function(article) {
    const modal = document.getElementById('newsModal');
    if (!modal) return;
    
    // 1. Configuramos la Foto de Portada (Libre y Majestuosa)
    let mainImg = document.getElementById('modalImg');
    if (!mainImg) {
        // Si no existe, la creamos dinámicamente
        mainImg = document.createElement('img');
        mainImg.id = 'modalImg';
        const modalTextContainer = document.querySelector('.modal-text');
        document.querySelector('.modal-content').insertBefore(mainImg, modalTextContainer);
    }
    mainImg.src = article.image;

    // 2. Datos de la noticia
    document.getElementById('modalTitle').innerText = article.title || '';
    
    const textContent = article.longDescription || article.summary || '';
    const wordCount = textContent.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);
    const liveViewers = Math.floor(Math.random() * (120 - 35 + 1)) + 35;

    const modalCat = document.getElementById('modalCat');
    if (modalCat) {
        modalCat.innerHTML = `
            ${article.category || 'Gungo'} 
            <span class="live-readers"><i class="fas fa-circle"></i> ${liveViewers} leyendo ahora</span>
        `;
    }

    const readTimeBadge = document.getElementById('read-time-badge');
    if (readTimeBadge) {
        readTimeBadge.innerHTML = `<div class="smart-read-time"><i class="far fa-clock"></i> Tiempo estimado: ${readingTime} min</div>`;
    }
    
    // ==========================================
    // MAGIA DE IMÁGENES EMBEBIDAS (INYECCIÓN DE FOTOS ADICIONALES)
    // ==========================================
    let contenidoFinal = textContent;

    // Si existe la Imagen 2 en Firebase, la inyectamos en el texto
    if (article.image2 && article.image2.trim() !== "") {
        contenidoFinal += `<img src="${article.image2}" alt="Imagen adicional de la noticia">`;
    }

    // Si existe la Imagen 3 en Firebase, la inyectamos debajo
    if (article.image3 && article.image3.trim() !== "") {
        contenidoFinal += `<img src="${article.image3}" alt="Tercera imagen de la noticia">`;
    }

    // Enviamos el texto y las fotos a la caja del lector
    document.getElementById('modalDesc').innerHTML = contenidoFinal;

    const progressBar = document.getElementById('reading-progress');
    if (progressBar) progressBar.style.width = '0%';

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    const modalTextContainer = document.querySelector('.modal-text');
    if (modalTextContainer) {
        modalTextContainer.onscroll = null; 
        modalTextContainer.onscroll = function() {
            const scrollTop = modalTextContainer.scrollTop;
            const scrollHeight = modalTextContainer.scrollHeight - modalTextContainer.clientHeight;
            const scrollPercentage = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
            if (progressBar) { progressBar.style.width = scrollPercentage + '%'; }
        };
    }
};

// --- CONTROLES DEL MODAL ---
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

// --- SISTEMA DE CHAT DEBATE ---
let ultimoMensajeTime = 0;
window.sendGungoMessage = function() {
    const input = document.getElementById('chat-input');
    const display = document.getElementById('chat-display');
    const currentUser = localStorage.getItem('gungo_user');

    if (!currentUser) {
        window.showToast("Debes iniciar sesión para comentar.");
        window.openAuthModal();
        return;
    }

    if(!input || !display) return;
    
    let msg = input.value.trim();
    if (msg === "") return;

    const now = Date.now();
    if (now - ultimoMensajeTime < 4000) {
        window.showToast("Por favor espera 4 segundos entre mensajes.");
        return;
    }
    ultimoMensajeTime = now;

    const prohibitedWords = ["http", ".com", "www", "spam", "puta", "mierda", "diablo", "estafa"]; 
    if (prohibitedWords.some(word => msg.toLowerCase().includes(word))) {
        window.showToast("Mensaje bloqueado: Sistema de seguridad activo.");
        input.value = "";
        return;
    }

    const msgContainer = document.createElement('div');
    msgContainer.style = "background: linear-gradient(145deg, #1a1a1a, #222); padding: 15px 20px; border-radius: 0px 20px 20px 20px; border: 1px solid #333; border-left: 4px solid #FFEB3B; font-size: 0.95rem; color: #fff; margin-bottom: 5px;";
    
    msgContainer.innerHTML = `<strong style="color: #FFEB3B; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 5px;"><i class="fas fa-check-circle"></i> ${currentUser}</strong> ${msg}`;
    
    display.appendChild(msgContainer);
    display.scrollTop = display.scrollHeight; 
    input.value = "";
};

// --- LECTOR DE NOTICIAS (TEXT-TO-SPEECH) ---
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

// --- RADAR GUNGO ISLAND ---
document.addEventListener("DOMContentLoaded", () => {
    const island = document.getElementById('gungo-island');
    const islandText = document.getElementById('island-text');
    
    if (!island || !islandText) return;

    const mensajesRadar = [
        "🔥 Alguien en Santo Domingo lee la noticia principal",
        "💬 Un nuevo usuario VIP entró al Debate Live",
        "📈 El tráfico en Gungo.tv acaba de subir un 40%",
        "⚡ Cientos de usuarios están conectados ahora",
        "👀 Una noticia de Farándula se está haciendo viral",
        "🚨 Atención: Revisa las alertas de clima en Noticias"
    ];

    setInterval(() => {
        const randomMsg = mensajesRadar[Math.floor(Math.random() * mensajesRadar.length)];
        islandText.innerText = randomMsg;
        
        island.classList.add('show');
        
        setTimeout(() => {
            island.classList.remove('show');
        }, 5000);
        
    }, 25000);
});

/* =======================================================
   8. MOTOR DE DATOS FINANCIEROS EN VIVO (SOLO API GRATIS)
   ======================================================= */
const marketData = {
    btc: { name: 'BTC', basePrice: 67000, icon: 'fab fa-bitcoin', color: '#F7931A', prefix: '$' },
    eth: { name: 'ETH', basePrice: 3800, icon: 'fab fa-ethereum', color: '#627EEA', prefix: '$' }
};

async function initFinancialTicker() {
    const track = document.getElementById('dynamic-ticker');
    if (!track) return;

    let liveData = JSON.parse(JSON.stringify(marketData));

    // 1. CONEXIÓN API REAL PARA CRIPTOMONEDAS
    try {
        const cryptoRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true');
        const cryptoApi = await cryptoRes.json();
        
        if(cryptoApi.bitcoin) {
            liveData.btc.price = cryptoApi.bitcoin.usd;
            liveData.btc.change = cryptoApi.bitcoin.usd_24h_change;
        }
        if(cryptoApi.ethereum) {
            liveData.eth.price = cryptoApi.ethereum.usd;
            liveData.eth.change = cryptoApi.ethereum.usd_24h_change;
        }
    } catch(e) { console.warn("Aviso: Error de conexión con la API."); }

    // 2. RENDERIZAR EL HTML DEL CINTILLO
    let tickerHTML = '';
    Object.values(liveData).forEach(item => {
        let currentPrice = item.price || item.basePrice;
        let currentChange = item.change || 0;

        const isUp = currentChange >= 0;
        const changeClass = isUp ? 'ticker-up' : 'ticker-down';
        const changeIcon = isUp ? 'fa-caret-up' : 'fa-caret-down';
        
        const formattedPrice = currentPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        const formattedChange = Math.abs(currentChange).toFixed(2);
        const sign = isUp ? '+' : '-';
        
        tickerHTML += `<div class="ticker-item"><i class="${item.icon}" style="color: ${item.color};"></i> ${item.name} <strong>${item.prefix}${formattedPrice}</strong> <span class="${changeClass}">${sign}${formattedChange}% <i class="fas ${changeIcon}"></i></span></div>`;
    });

    track.innerHTML = tickerHTML.repeat(8);
}

document.addEventListener("DOMContentLoaded", () => {
    initFinancialTicker();
    setInterval(initFinancialTicker, 300000);
});