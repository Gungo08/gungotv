/* ========================================================
   GUNGO 2026 - SCRIPT PRINCIPAL (NOTICIAS Y DEBATE)
   ======================================================== */

/* --- FUNCIONES GLOBALES --- */

// 1. Buscador
window.toggleSearch = function() {
    const overlay = document.getElementById('searchOverlay');
    const input = document.getElementById('searchInput');
    if (!overlay) return;
    overlay.classList.toggle('active');
    if (overlay.classList.contains('active')) {
        setTimeout(() => input && input.focus(), 100);
    }
};

// 2. Reacciones (Emoji Count)
window.toggleReact = function(btn, e) {
    e.stopPropagation(); 
    btn.classList.toggle('active');
    const span = btn.querySelector('span');
    if (span) {
        let count = parseInt(span.innerText.replace(/,/g, '')) || 0;
        span.innerText = btn.classList.contains('active') ? count + 1 : count - 1;
    }
};

// 3. Compartir Nativo
window.shareNative = function(title, text) {
    if (navigator.share) {
        navigator.share({ title: title, text: text, url: window.location.href })
        .catch(console.error);
    } else {
        navigator.clipboard.writeText(window.location.href);
        showToast("¡Enlace copiado al portapapeles!");
    }
};

window.shareCurrentModal = function() {
    const title = document.getElementById('modalTitle')?.innerText || "Noticia GUNGO";
    window.shareNative(title, "¡Mira esta información en GUNGO.tv!");
};

// 4. Sistema de Notificaciones Toast
function showToast(msg) {
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
}

// 5. Encuestas
window.votePoll = function(id) {
    if (localStorage.getItem('gungo_poll_voted')) {
        showToast("¡Ya votaste en esta encuesta!");
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
    showToast("¡Gracias por tu voto!");
};

/* --- INICIALIZACIÓN DEL DOM --- */
document.addEventListener("DOMContentLoaded", () => {
    const newsGrid = document.querySelector('.news-grid');
    const searchInput = document.getElementById('searchInput');

    if (newsGrid) {
        fetch('data.json')
            .then(r => r.ok ? r.json() : Promise.reject("Error de Red"))
            .then(data => {
                window.allNewsData = [...(data.newsArticles || []), ...(data.loadMoreData || [])];
                renderNews(data.newsArticles || [], false); 
                setupLoadMore(data.loadMoreData || []);
                if (data.storiesData) renderStories(data.storiesData);
                if (data.tickerNews) updateTicker(data.tickerNews);
                if (data.pollData) initPoll(data.pollData);
            })
            .catch(err => {
                console.warn("Modo Offline o Error:", err);
            });
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
                <img src="${news.image}" alt="${news.title}" onerror="this.src='${fallbackImg}'">
                <div class="card-content">
                    <h3>${news.title}</h3>
                    <p>${news.summary}</p>
                    <div class="reaction-bar">
                        <button class="reaction-btn" onclick="toggleReact(this, event)">🔥 <span>${Math.floor(Math.random()*100)+10}</span></button>
                        <button class="share-btn-card" onclick="event.stopPropagation(); shareNative('${news.title}', 'Gungo.tv')"><i class="fas fa-share"></i></button>
                    </div>
                </div>
            `;
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button')) openModal(news);
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
        if (el && newsList) {
            el.innerText = newsList.map(item => item.title || item.text || "").join('   •   ') + '   •   ';
        }
    }

    function initPoll(data) {
        const title = document.querySelector('.poll-title-text');
        const optsContainer = document.querySelector('.poll-options');
        if (title) title.innerText = data.question;
        if (optsContainer && data.options) {
            optsContainer.innerHTML = data.options.map(opt => `
                <div class="poll-option" onclick="votePoll(${opt.id})">
                    <span class="poll-text">${opt.text}</span>
                    <div class="poll-bar" id="bar-${opt.id}"></div>
                    <span class="poll-percent" id="percent-${opt.id}">0%</span>
                </div>
            `).join('');
        }
    }

    function setupLoadMore(moreData) {
        if (moreData.length === 0) return;
        const btnContainer = document.createElement('div');
        btnContainer.className = 'load-more-container';
        btnContainer.innerHTML = '<button class="btn-secondary" id="loadMoreBtn">Ver más noticias <i class="fas fa-chevron-down"></i></button>';
        newsGrid.parentNode.insertBefore(btnContainer, newsGrid.nextSibling);

        const btn = document.getElementById('loadMoreBtn');
        btn.addEventListener('click', () => {
            renderNews(moreData, true);
            btn.remove();
        });
    }

    // --- MODAL Y FACEBOOK (CORREGIDO Y BLINDADO) ---
    function openModal(article) {
        const modal = document.getElementById('newsModal');
        if (!modal) return;
        
        document.getElementById('modalImg').src = article.image;
        document.getElementById('modalTitle').innerText = article.title;
        document.getElementById('modalCat').innerText = article.category;
        document.getElementById('modalDesc').innerText = article.longDescription || article.summary;
        
        // 1. BLOQUE FACEBOOK DINÁMICO
        const fbContainer = document.getElementById('fb-comment-box')?.parentNode;
        if (fbContainer) {
            // Destruimos el cuadro anterior si existe
            const oldFbBox = document.getElementById('fb-comment-box');
            if (oldFbBox) oldFbBox.remove();
            
            // Creamos uno nuevo con la URL de la noticia actual
            const newFbBox = document.createElement('div');
            newFbBox.className = 'fb-comments';
            newFbBox.id = 'fb-comment-box';
            newFbBox.setAttribute('data-href', 'https://gungotv.vercel.app/noticia/' + article.id);
            newFbBox.setAttribute('data-width', '100%');
            newFbBox.setAttribute('data-numposts', '5');
            newFbBox.setAttribute('data-colorscheme', 'dark');
            
            fbContainer.appendChild(newFbBox);
            
            // Obligamos a Facebook a escanear e inyectar el nuevo cuadro
            if (typeof FB !== 'undefined') {
                FB.XFBML.parse(fbContainer); 
            }
        }

        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    // --- CIERRE DE MODAL Y PARADA DE VOZ (CORREGIDO) ---
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            // Apagamos la voz de forma segura si está sonando
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

    // --- FILTRADO DE SECCIONES ---
    window.filtrarNoticias = function(categoria) {
        const botones = document.querySelectorAll('.filter-btn');
        botones.forEach(btn => btn.classList.remove('active', 'active-filter'));

        // Normalización para evitar errores por acentos
        const normalize = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
        
        const catBusqueda = normalize(categoria);
        let noticiasFiltradas;

        if (catBusqueda === 'TODO' || catBusqueda === 'INICIO') {
            noticiasFiltradas = window.allNewsData;
        } else {
            noticiasFiltradas = window.allNewsData.filter(item => normalize(item.category) === catBusqueda);
        }

        renderNews(noticiasFiltradas, false); 
        if (noticiasFiltradas.length === 0) showToast(`Sección ${categoria} sin noticias nuevas.`);
    };

    // --- BÚSQUEDA ---
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            document.querySelectorAll('.news-card').forEach(card => {
                card.classList.toggle('hidden', !card.innerText.toLowerCase().includes(term));
            });
        });
    }

        // --- MOTOR DE VOZ TEXT-TO-SPEECH (FORZADO EXTREMO A ESPAÑOL) ---
    // Cargar voces por adelantado
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();

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
        const textToRead = `${title}. ${description}`;

        const currentUtterance = new SpeechSynthesisUtterance(textToRead);
        
        // RASTREADOR DE VOZ LATINA/ESPAÑOLA
        const voices = synth.getVoices();
        const spanishVoice = voices.find(v => v.lang.includes('es') || v.name.includes('Spanish') || v.name.includes('Español') || v.name.includes('Monica') || v.name.includes('Jorge'));
        
        if (spanishVoice) {
            currentUtterance.voice = spanishVoice;
            currentUtterance.lang = spanishVoice.lang;
        } else {
            currentUtterance.lang = 'es-ES'; // Plan B
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

})

