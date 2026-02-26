/* ========================================================
   GUNGO 2026 - SCRIPT PRINCIPAL (CHAT, LAZY LOAD, TTS, TIKTOK)
   ======================================================== */

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
        showToast("¡Enlace copiado al portapapeles!");
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

/* --- INICIALIZACIÓN DEL DOM Y CARGA INTELIGENTE (LAZY LOAD 9 NOTICIAS) --- */
document.addEventListener("DOMContentLoaded", () => {
    const newsGrid = document.querySelector('.news-grid');
    const searchInput = document.getElementById('searchInput');

    if (newsGrid) {
        fetch('data.json')
            .then(r => r.ok ? r.json() : Promise.reject("Error de Red"))
            .then(data => {
                window.allNewsData = [...(data.newsArticles || []), ...(data.loadMoreData || [])];
                
                // 1. CARGA INMEDIATA: Las primeras 9 noticias
                const initialNews = window.allNewsData.slice(0, 9);
                renderNews(initialNews, false); 
                
                // 2. CARGA DIFERIDA: El resto al hacer scroll (para no frisarse)
                let scrollLoaded = false;
                window.addEventListener('scroll', function loadRestOnScroll() {
                    if (!scrollLoaded && window.scrollY > 300) {
                        scrollLoaded = true;
                        const remainingNews = window.allNewsData.slice(9);
                        renderNews(remainingNews, true); // append = true
                        window.removeEventListener('scroll', loadRestOnScroll);
                    }
                });

                if (data.storiesData) renderStories(data.storiesData);
                if (data.tickerNews) updateTicker(data.tickerNews);
                if (data.pollData) initPoll(data.pollData);
            })
            .catch(err => console.warn("Modo Offline o Error:", err));
    }
    
    function renderNews(articles, append = false) {
        if (!newsGrid) return;
        if (!append) newsGrid.innerHTML = ''; 
        
        articles.forEach(news => {
            const card = document.createElement('div');
            card.className = 'news-card visible';
            const fallbackImg = "https://placehold.co/600x400/111/E50914/png?text=GUNGO+NEWS";

            card.innerHTML = `
                <span class="category-tag">${news.category}</span>
                <img src="${news.image}" alt="${news.title}" onerror="this.src='${fallbackImg}'" loading="lazy">
                <div class="card-content">
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
        });
    }

    function renderStories(stories) {
        const container = document.getElementById('storiesFeed');
        if (!container || !stories) return;
        container.innerHTML = stories.map(s => `
            <div>
                <div class="story-circle"><img src="${s.img}" alt="${s.name}" onerror="this.src='https://placehold.co/150x150/222/FFFFFF/png?text=User'"></div>
                <p class="story-name">${s.name}</p>
            </div>
        `).join('');
    }

    function updateTicker(newsList) {
        const el = document.querySelector('.breaking-text');
        if (el && newsList) el.innerText = newsList.map(item => item.title || item.text || "").join('   •   ') + '   •   ';
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

    // --- ZONA VIRAL TIKTOK ---
    function renderTikToks() {
        const tiktokGrid = document.getElementById('tiktok-grid');
        if (!tiktokGrid) return;
        const videosVirales = ["7473723326759029014", "7461414449019620630", "7473859600187641110"];
        videosVirales.forEach(videoId => {
            const blockquote = document.createElement('blockquote');
            blockquote.className = 'tiktok-embed';
            blockquote.setAttribute('cite', `https://www.tiktok.com/@gungo_6/video/${videoId}`);
            blockquote.setAttribute('data-video-id', videoId);
            blockquote.style.maxWidth = "605px";
            blockquote.style.minWidth = "325px";
            
            const section = document.createElement('section');
            blockquote.appendChild(section);
            tiktokGrid.appendChild(blockquote);
        });
    }
    renderTikToks();
});

// --- MODAL ---
window.openModal = function(article) {
    const modal = document.getElementById('newsModal');
    if (!modal) return;
    
    document.getElementById('modalImg').src = article.image;
    document.getElementById('modalTitle').innerText = article.title;
    document.getElementById('modalCat').innerText = article.category;
    document.getElementById('modalDesc').innerText = article.longDescription || article.summary;

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
};

const closeModalBtn = document.querySelector('.close-modal');
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            const btn = document.getElementById('tts-button');
            if (btn) {
                btn.classList.remove('playing');
                btn.innerHTML = '<i class="fas fa-volume-up"></i> Escuchar noticia';
            }
        }
        document.getElementById('newsModal').classList.remove('open');
        document.body.style.overflow = 'auto';
    });
}

// --- FILTROS ---
window.filtrarNoticias = function(categoria) {
    const botones = document.querySelectorAll('.filter-btn');
    botones.forEach(btn => btn.classList.remove('active', 'active-filter'));

    const normalize = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    const catBusqueda = normalize(categoria);
    let noticiasFiltradas;

    if (catBusqueda === 'TODO' || catBusqueda === 'INICIO') {
        noticiasFiltradas = window.allNewsData;
    } else {
        noticiasFiltradas = window.allNewsData.filter(item => normalize(item.category) === catBusqueda);
    }

    const newsGrid = document.querySelector('.news-grid');
    newsGrid.innerHTML = ''; // Limpiar grilla

    noticiasFiltradas.forEach(news => {
        const card = document.createElement('div');
        card.className = 'news-card visible';
        const fallbackImg = "https://placehold.co/600x400/111/E50914/png?text=GUNGO+NEWS";

        card.innerHTML = `
            <span class="category-tag">${news.category}</span>
            <img src="${news.image}" alt="${news.title}" onerror="this.src='${fallbackImg}'">
            <div class="card-content">
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
    });

    if (noticiasFiltradas.length === 0) window.showToast(`Sección ${categoria} sin noticias nuevas.`);
};

// --- CHAT INTERNO FUNCIONAL Y SEGURO ---
window.sendGungoMessage = function() {
    const input = document.getElementById('chat-input');
    const display = document.getElementById('chat-display');
    if(!input || !display) return;
    
    let msg = input.value.trim();
    if (msg === "") return;

    // Filtro Anti-Spam
    const prohibitedWords = ["http", ".com", "www", "spam", "puta", "mierda", "diablo", "estafa"]; 
    const isSpam = prohibitedWords.some(word => msg.toLowerCase().includes(word));

    if (isSpam) {
        if(typeof window.showToast === 'function') {
            window.showToast("Mensaje bloqueado: No se permiten enlaces ni groserías.");
        }
        input.value = "";
        return;
    }

    // Crear el mensaje y agregarlo
    const msgContainer = document.createElement('div');
    msgContainer.style.background = "#222";
    msgContainer.style.padding = "12px 18px";
    msgContainer.style.borderRadius = "12px";
    msgContainer.style.borderLeft = "4px solid #E50914";
    msgContainer.style.fontSize = "0.95rem";
    msgContainer.style.color = "#fff";
    msgContainer.style.marginBottom = "10px";
    
    // Usuario Anónimo VIP
    const randomUser = "Usuario" + Math.floor(Math.random() * 9999);
    
    msgContainer.innerHTML = `<strong style="color: #FFEB3B;">${randomUser}:</strong> ${msg}`;
    display.appendChild(msgContainer);
    
    display.scrollTop = display.scrollHeight; // Bajar scroll automático
    input.value = "";
};

// --- MOTOR DE VOZ TEXT-TO-SPEECH (ESPAÑOL) ---
if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

window.toggleSpeech = function() {
    const synth = window.speechSynthesis;
    const btn = document.getElementById('tts-button');
    
    if (synth.speaking) {
        synth.cancel();
        if(btn) {
            btn.classList.remove('playing');
            btn.innerHTML = '<i class="fas fa-volume-up"></i> Escuchar noticia';
        }
        return;
    }

    const title = document.getElementById('modalTitle').innerText;
    const description = document.getElementById('modalDesc').innerText;
    const currentUtterance = new SpeechSynthesisUtterance(`${title}. ${description}`);
    
    const voices = synth.getVoices();
    const spanishVoice = voices.find(v => v.lang.includes('es') || v.name.includes('Spanish') || v.name.includes('Español') || v.name.includes('Monica') || v.name.includes('Paulina'));
    
    if (spanishVoice) {
        currentUtterance.voice = spanishVoice;
        currentUtterance.lang = spanishVoice.lang;
    } else {
        currentUtterance.lang = 'es-ES'; 
    }

    currentUtterance.onend = () => {
        if(btn) {
            btn.classList.remove('playing');
            btn.innerHTML = '<i class="fas fa-volume-up"></i> Escuchar noticia';
        }
    };

    if(btn) {
        btn.classList.add('playing');
        btn.innerHTML = '<i class="fas fa-stop"></i> Detener lectura';
    }
    
    synth.speak(currentUtterance);
};