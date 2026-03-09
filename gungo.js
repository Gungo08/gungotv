/* ========================================================
   GUNGO 2026 - SCRIPT PRINCIPAL HÍBRIDO PRO (V10 - BLINDADO)
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
    if(modal) {
        modal.style.display = 'flex';
        requestAnimationFrame(() => modal.classList.add('open'));
    }
};

window.closeAuthModal = () => {
    const modal = document.getElementById('authModal');
    if(modal) {
        modal.classList.remove('open');
        setTimeout(() => modal.style.display = 'none', 300);
    }
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
            const fbDocs = firebaseSnapshot && firebaseSnapshot.docs ? firebaseSnapshot.docs : [];
            const firebaseNews = fbDocs.map(doc => ({ id: doc.id, ...doc.data() })).filter(news => news.category !== "Urbano & Redes");
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
                if (jsonData.storiesData) window.renderStories(jsonData.storiesData);
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
        card.className = (index === 0 && !append) ? 'news-card featured-card visible' : 'news-card visible';
        
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
        
        // EVENTO CLIC BLINDADO
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

window.renderStories = function(stories) {
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


// ========================================================
// 🔥 MOTOR DEL MODAL BLINDADO (FOTO PRINCIPAL + FOTOS APILADAS)
// ========================================================
window.openModal = function(article) {
    const modal = document.getElementById('newsModal');
    if (!modal) {
        console.error("Modal no encontrado en el HTML");
        return;
    }
    
    // Forzamos el display block/flex para asegurar que CSS no lo bloquee
    modal.style.display = 'flex';
    
    const modalContent = modal.querySelector('.modal-content');
    const modalTextContainer = modal.querySelector('.modal-text');

    // 1. Inyectar imagen de portada dinámicamente
    let mainImg = document.getElementById('modalImg');
    if (!mainImg) {
        mainImg = document.createElement('img');
        mainImg.id = 'modalImg';
        if(modalContent && modalTextContainer) {
            modalContent.insertBefore(mainImg, modalTextContainer);
        }
    }
    mainImg.src = article.image;
    mainImg.onerror = function() { this.src = "https://placehold.co/1280x720/1a1a1a/FFEB3B/png?text=GUNGO+NEWS"; };

    // 2. Título y meta-datos
    const titleEl = document.getElementById('modalTitle');
    if(titleEl) titleEl.innerHTML = article.title || '&nbsp;';
    
    const wordCount = (article.longDescription || article.summary || '').split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200) || 1;
    const liveViewers = Math.floor(Math.random() * (120 - 35 + 1)) + 35;

    const modalCat = document.getElementById('modalCat');
    if (modalCat) {
        modalCat.innerHTML = `${article.category || 'Gungo'} <span class="live-readers"><i class="fas fa-circle" style="color:#FF1744; font-size:0.6rem; animation: pulse-active 2s infinite;"></i> ${liveViewers} leyendo ahora</span>`;
    }

    const readTimeBadge = document.getElementById('read-time-badge');
    if (readTimeBadge) {
        readTimeBadge.innerHTML = `<div class="smart-read-time"><i class="far fa-clock"></i> Tiempo estimado: ${readingTime} min</div>`;
    }
    
    // 3. Inyección de Texto y Fotos Adicionales (Apiladas)
    let contenidoFinal = article.longDescription || article.summary || '';

    // Validamos estrictamente que la imagen exista y sea un string antes de inyectar
    if (article.image2 && typeof article.image2 === 'string' && article.image2.trim() !== "") {
        contenidoFinal += `<img src="${article.image2}" alt="Imagen 2" loading="lazy" style="width: 100%; border-radius: 15px; margin: 25px 0; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">`;
    }
    if (article.image3 && typeof article.image3 === 'string' && article.image3.trim() !== "") {
        contenidoFinal += `<img src="${article.image3}" alt="Imagen 3" loading="lazy" style="width: 100%; border-radius: 15px; margin: 25px 0; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">`;
    }

    const descEl = document.getElementById('modalDesc');
    if(descEl) descEl.innerHTML = contenidoFinal;

    const progressBar = document.getElementById('reading-progress');
    if (progressBar) progressBar.style.width = '0%';

    // Bloquear scroll de fondo
    document.body.style.overflow = 'hidden';
    
    // Aplicar clase open para la animación de opacidad
    requestAnimationFrame(() => {
        modal.classList.add('open');
        modal.style.opacity = '1';
        modal.style.pointerEvents = 'all';
    });

    if (modalTextContainer) {
        modalTextContainer.onscroll = null; 
        modalTextContainer.onscroll = function() {
            const scrollTop = modalTextContainer.scrollTop;
            const scrollHeight = modalTextContainer.scrollHeight - modalTextContainer.clientHeight;
            const scrollPercentage = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
            if (progressBar) progressBar.style.width = scrollPercentage + '%';
        };
    }
    
    if (window.instgrm) window.instgrm.Embeds.process();
};

// --- CIERRE DE MODAL SEGURO ---
window.closeNewsModal = function() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    const btn = document.getElementById('tts-button');
    if (btn) { btn.classList.remove('playing'); btn.innerHTML = '<i class="fas fa-volume-up"></i> Escuchar noticia'; }
    
    const modal = document.getElementById('newsModal');
    if (modal) {
        modal.classList.remove('open');
        modal.style.opacity = '0';
        modal.style.pointerEvents = 'none';
        setTimeout(() => { modal.style.display = 'none'; }, 300); // Esperar la transición antes de ocultar
    }
    document.body.style.overflow = 'auto';
};

// Cerrar modales (Noticias o Auth) si se hace click en el fondo oscuro
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        if (e.target.id === 'newsModal') window.closeNewsModal();
        if (e.target.id === 'authModal') window.closeAuthModal();
    }
});

// --- LECTOR DE NOTICIAS ---
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
    const voice = synth.getVoices().find(v => v.lang.includes('es'));
    utterance.voice = voice || synth.getVoices()[0];
    utterance.onend = () => { if(btn) { btn.classList.remove('playing'); btn.innerHTML = '<i class="fas fa-volume-up"></i> Escuchar noticia'; } };
    if(btn) { btn.classList.add('playing'); btn.innerHTML = '<i class="fas fa-stop"></i> Detener lectura'; }
    synth.speak(utterance);
}; 

// --- CHAT EN VIVO ---
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

    const prohibitedWords = ["http", ".com", "www", "spam", "puta", "mierda"]; 
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

/* =======================================================
   MOTOR DE DATOS FINANCIEROS
   ======================================================= */
const marketData = {
    btc: { name: 'BTC', basePrice: 67000, icon: 'fab fa-bitcoin', color: '#F7931A', prefix: '$' },
    eth: { name: 'ETH', basePrice: 3800, icon: 'fab fa-ethereum', color: '#627EEA', prefix: '$' }
};

async function initFinancialTicker() {
    const track = document.getElementById('dynamic-ticker');
    if (!track) return;
    let liveData = JSON.parse(JSON.stringify(marketData));
    try {
        const cryptoRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true');
        const cryptoApi = await cryptoRes.json();
        if(cryptoApi.bitcoin) { liveData.btc.price = cryptoApi.bitcoin.usd; liveData.btc.change = cryptoApi.bitcoin.usd_24h_change; }
        if(cryptoApi.ethereum) { liveData.eth.price = cryptoApi.ethereum.usd; liveData.eth.change = cryptoApi.ethereum.usd_24h_change; }
    } catch(e) {}

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

// Vortex Glow para mouse (Efecto Visual Premium)
let rafId = null;
document.addEventListener('mousemove', (e) => {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => {
    const cards = document.querySelectorAll('.news-card');
    if (!cards.length) return;
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x >= 0 && y >= 0 && x <= rect.width && y <= rect.height) {
        card.style.backgroundImage = `radial-gradient(circle at ${Math.round(x)}px ${Math.round(y)}px, rgba(255,235,59,0.12) 0%, rgba(26,26,26,1) 50%)`;
        card.style.borderColor = "rgba(255,235,59,0.5)";
      } else {
        card.style.backgroundImage = '';
        card.style.borderColor = '';
      }
    });
  });
});

// Hype Engine (El Radar Notificador)
(function () {
  const DEFAULT_INTERVAL_MS = 45000;
  const eventosHype = [
    "🔥 ¡VIRAL! 1,200 personas compartiendo la última exclusiva",
    "📈 Tendencia en RD: Gungo.tv sube al #1",
    "💬 45 usuarios VIP están debatiendo ahora mismo",
    "📸 ¡Nuevo post en el Radar! La calle está encendida",
    "⚡ Noticia de último minuto enviada a 5,000 dispositivos"
  ];
  let intervalId = null;
  let intervalMs = DEFAULT_INTERVAL_MS;
  let isPaused = false;

  function obtenerMensaje() { return eventosHype[Math.floor(Math.random() * eventosHype.length)]; }

  function dispararMensaje() {
    const msg = obtenerMensaje();
    if (typeof window.triggerIsland === "function") {
      try { window.triggerIsland(msg); } catch (err) { console.error("triggerIsland falló:", err); }
    } else {
      const ev = new CustomEvent("hypeEngineMessage", { detail: msg });
      window.dispatchEvent(ev);
    }
  }

  function start() {
    if (intervalId) return;
    intervalId = setInterval(() => { if (!isPaused) dispararMensaje(); }, intervalMs);
    dispararMensaje();
  }

  function stop() {
    if (!intervalId) return;
    clearInterval(intervalId);
    intervalId = null;
  }

  function pause() { isPaused = true; }
  function resume() { isPaused = false; }
  function setIntervalMs(ms) {
    if (typeof ms !== "number" || ms < 1000) return;
    intervalMs = ms;
    if (intervalId) { stop(); start(); }
  }

  function handleVisibility() { if (document.hidden) pause(); else resume(); }
  document.addEventListener("visibilitychange", handleVisibility);

  window.hypeEngine = { start, stop, pause, resume, setIntervalMs, dispararMensaje };

  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", start); } 
  else { start(); }
})();
