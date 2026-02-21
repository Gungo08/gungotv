 /* ========================================================
   GUNGO 2025 - SCRIPT PRINCIPAL (CORREGIDO)
   ======================================================== */

/* --- CONFIGURACIÓN GLOBAL DE DATOS --- */
const viralVideos = [
    {
        title: "Las Últimas de la Farándula | Peleas y Más",
        sourceId: "ZU1YKt_jCUE", 
        description: "Un resumen semanal de las peleas y escándalos más picantes.",
        category: "CHISME HOT"
    },
    {
        title: "Farándula, Amor Libre y Noticias Bizarras",
        sourceId: "aKcoQtvOSCk",
        description: "Análisis completo de lo más extraño y viral del espectáculo.",
        category: "TRENDING"
    }
];

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
    const title = document.getElementById('modalTitle')?.innerText || "Chisme GUNGO";
    window.shareNative(title, "¡Mira este escándalo en GUNGO!");
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
    toast.innerHTML = `
        <div class="toast-header">NOTIFICACIÓN</div>
        <div class="toast-body">${msg}</div>
    `;
    
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

    // Renderizar Videos (video-reel-container)
    const reelContainer = document.getElementById('video-reel-container');
    if (reelContainer) {
        viralVideos.forEach(video => {
            const card = document.createElement('div');
            card.style.cssText = "background:#111; border-radius:12px; overflow:hidden; box-shadow:0 10px 30px rgba(229,9,20,0.3);";
            card.innerHTML = `
                <div style="position:relative; padding-bottom:56.25%; height:0;">
                    <iframe style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;"
                        src="https://www.youtube.com/embed/${video.sourceId}" 
                        title="${video.title}" allowfullscreen>
                    </iframe>
                </div>
                <div style="padding:20px; color:white;">
                    <span class="category-tag" style="position:relative; top:0; left:0; margin-bottom:10px; display:inline-block;">${video.category}</span>
                    <h3 style="margin:5px 0 10px; color:#E50914; font-size:1.4rem;">${video.title}</h3>
                    <p style="margin:0; opacity:0.9;">${video.description}</p>
                </div>
            `;
            reelContainer.appendChild(card);
        });
    }

    // Cargar Data JSON
    if (newsGrid || reelContainer) {
        fetch('data.json')
            .then(r => r.ok ? r.json() : Promise.reject("Error de Red"))
            .then(data => {
                
                // 1. LÓGICA PARA INDEX.HTML (Noticias)
                if (newsGrid) {
                    window.allNewsData = [...(data.newsArticles || []), ...(data.loadMoreData || [])];
                    renderNews(data.newsArticles || [], false); 
                    setupLoadMore(data.loadMoreData || []);
                    initFilters();
                }

                // 2. LÓGICA PARA VIDEOS.HTML (Videos Virales)
                if (reelContainer && data.viralVideos) {
                    renderViralVideos(data.viralVideos);
                }

                // 3. LÓGICA COMPARTIDA (Historias, Ticker, Encuestas)
                if (data.storiesData) renderStories(data.storiesData);
                
                // AQUÍ ESTABA EL ERROR: Faltaba llamar a la función
                if (data.tickerNews) updateTicker(data.tickerNews);
                
                if (data.pollData) initPoll(data.pollData);
            })
            .catch(err => {
                console.warn("Modo Offline o Error:", err);
                if(newsGrid && newsGrid.children.length === 0) {
                     newsGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:50px;">
                        <h3>Cargando contenido...</h3>
                     </div>`;
                }
            });
    }

    // --- FUNCIONES DE DIBUJADO (RENDER) ---
function renderViralVideos(videos) {
        if (!reelContainer) return;
        reelContainer.innerHTML = ''; 

        videos.forEach(video => {
            const card = document.createElement('div');
            // Manteniendo tu diseño exacto
            card.style.cssText = "background:#111; border-radius:12px; overflow:hidden; box-shadow:0 10px 30px rgba(229,9,20,0.3); transition: transform 0.3s;";
            
            // --- EL MOTOR DETECTIVE DE VIDEOS ---
            let url = video.videoUrl || "";
            let reproductorHTML = "";

            // 1. Si el agente trae un video de YouTube
            if (url.includes("youtube.com") || url.includes("youtu.be")) {
                let videoId = "";
                const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
                if (match && match[1]) videoId = match[1];
                
                reproductorHTML = `<iframe style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;" src="https://www.youtube.com/embed/${videoId}" title="${video.title}" allowfullscreen></iframe>`;
            } 
            // 2. Si el agente trae un video de TikTok
            else if (url.includes("tiktok.com")) {
                let videoId = "";
                const match = url.match(/video\/(\d+)/);
                if (match && match[1]) videoId = match[1];
                
                reproductorHTML = `<iframe style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;" src="https://www.tiktok.com/embed/v2/${videoId}" title="${video.title}" allowfullscreen></iframe>`;
            } 
            // 3. Respaldo de seguridad (Si es una red que bloquea iframes)
            else {
                reproductorHTML = `
                    <a href="${url}" target="_blank" rel="noopener noreferrer">
                        <img src="${video.thumbnail}" alt="Portada del video" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; opacity:0.8;">
                        <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); font-size:4rem; color:#E50914; text-shadow: 0 4px 15px rgba(0,0,0,0.8);"><i class="fas fa-play-circle"></i></div>
                    </a>`;
            }
            
            // --- CONSTRUCCIÓN DE LA TARJETA ---
            card.innerHTML = `
                <div style="position:relative; padding-bottom:56.25%; height:0; background:#000;">
                    ${reproductorHTML}
                </div>
                <div style="padding:20px; color:white;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px; align-items:center;">
                        <span class="category-tag">${video.category || 'VIRAL 🚀'}</span>
                        <span style="font-size:0.75rem; color:#888; text-transform:uppercase; font-weight:bold; letter-spacing:1px;">
                            ${video.platform || 'WEB'}
                        </span>
                    </div>
                    <h3 style="margin:5px 0 10px; color:#E50914; font-size:1.2rem; line-height:1.3;">${video.title}</h3>
                    <p style="margin:0; opacity:0.8; font-size:0.9rem; line-height:1.5;">${video.description}</p>
                </div>
            `;
            reelContainer.appendChild(card);
        });
    }

    function renderNews(articles, append = false) {
        if (!newsGrid) return;
        if (!append) newsGrid.innerHTML = ''; 
        
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        articles.forEach(news => {
            const card = document.createElement('div');
            card.className = 'news-card';
            card.dataset.id = news.id;
            card.dataset.category = news.category;

            const words = (news.longDescription || news.summary || "").split(" ").length;
            const mins = Math.ceil(words / 200);
            const fallbackImg = "https://placehold.co/600x400/111/E50914/png?text=GUNGO+NEWS";

            card.innerHTML = `
                <span class="category-tag ${news.category === 'EXCLUSIVA' ? 'exclusiva' : ''}">${news.category}</span>
                <img src="${news.image}" alt="${news.title}" loading="lazy" onerror="this.onerror=null;this.src='${fallbackImg}'">
                <div class="card-content">
                    <div class="reading-time"><i class="far fa-clock"></i> ${mins} min de lectura</div>
                    <h3>${news.title}</h3>
                    <p>${news.summary}</p>
                    <div class="reaction-bar">
                        <button class="reaction-btn" onclick="toggleReact(this, event)">🔥 <span>${Math.floor(Math.random()*100)+10}</span></button>
                        <button class="reaction-btn" onclick="toggleReact(this, event)">😱 <span>${Math.floor(Math.random()*50)+5}</span></button>
                        <button class="share-btn-card" onclick="event.stopPropagation(); shareNative('${news.title}', 'Mira esto en GUNGO')" title="Compartir">
                            <i class="fas fa-share"></i>
                        </button>
                    </div>
                </div>
            `;
            
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button')) openModal(news);
            });

            newsGrid.appendChild(card);
            observer.observe(card);
        });
    }

    function renderStories(stories) {
        const container = document.getElementById('storiesFeed');
        if (!container || !stories) return;
        const avatarFallback = "https://placehold.co/150x150/222/FFFFFF/png?text=User";

        container.innerHTML = stories.map(s => `
            <div>
                <div class="story-circle">
                    <img src="${s.img}" alt="${s.name}" 
                         onerror="this.onerror=null;this.src='${avatarFallback}'">
                </div>
                <p class="story-name">${s.name}</p>
            </div>
        `).join('');
    }

    // --- FUNCIÓN CORREGIDA DEL CINTILLO (TICKER) ---
    function updateTicker(newsList) {
        const el = document.querySelector('.breaking-text');
        
        if (el && newsList) {
            // Mapeamos para sacar solo el TITULO si viene un objeto
            const textArray = newsList.map(item => {
                if (typeof item === 'object' && item !== null) {
                    return item.title || item.text || item.summary || ""; 
                }
                return item;
            });

            // Ahora sí unimos los textos
            el.innerText = textArray.join('   •   ') + '   •   ';
        }
    }

    function initPoll(data) {
        const title = document.querySelector('.poll-title-text');
        const optsContainer = document.querySelector('.poll-options');
        const footer = document.querySelector('.poll-footer');
        
        if (title) title.innerText = data.question;
        if (footer) footer.innerText = data.footerText;
        
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
        btnContainer.innerHTML = '<button class="btn-secondary" id="loadMoreBtn">Ver más chismes <i class="fas fa-chevron-down"></i></button>';
        newsGrid.parentNode.insertBefore(btnContainer, newsGrid.nextSibling);

        const btn = document.getElementById('loadMoreBtn');
        btn.addEventListener('click', () => {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
            setTimeout(() => {
                renderNews(moreData, true);
                btn.remove();
                showToast("¡Nuevas noticias cargadas!");
            }, 800);
        });
    }

    // --- MODAL Y FILTROS ---
    function openModal(article) {
        const modal = document.getElementById('newsModal');
        if (!modal) return;
        
        const imgEl = document.getElementById('modalImg');
        imgEl.src = article.image;
        imgEl.onerror = function() { 
            this.onerror=null; 
            this.src="https://placehold.co/800x600/111/E50914/png?text=Sin+Imagen"; 
        };

        document.getElementById('modalTitle').innerText = article.title;
        document.getElementById('modalCat').innerText = article.category;
        document.getElementById('modalDesc').innerText = article.longDescription || article.summary;
        
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            document.getElementById('newsModal').classList.remove('open');
            document.body.style.overflow = 'auto';
        });
    }

    function initFilters() {
        const buttons = document.querySelectorAll('.filter-btn');
        const grid = document.querySelector('.news-grid');
        
        if (!buttons.length) return;

        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filter = btn.dataset.filter;
                let hasResults = false;

                document.querySelectorAll('.news-card').forEach(card => {
                    const cardCategory = (card.dataset.category || "").trim(); 
                    if (filter === 'all' || cardCategory === filter) {
                        card.classList.remove('hidden');
                        card.style.display = 'block';
                        setTimeout(() => card.style.opacity = '1', 50);
                        hasResults = true;
                    } else {
                        card.style.opacity = '0';
                        card.classList.add('hidden');
                        setTimeout(() => card.style.display = 'none', 300);
                    }
                });

                if (window.innerWidth < 768 && grid) {
                    const yOffset = -120;
                    const y = grid.getBoundingClientRect().top + window.pageYOffset + yOffset;
                    window.scrollTo({top: y, behavior: 'smooth'});
                }

                if (!hasResults) {
                    showToast("No hay noticias en esta categoría por ahora.");
                }
            });
        });
    }

    // Búsqueda
    let timeout;
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                const term = e.target.value.toLowerCase();
                document.querySelectorAll('.news-card').forEach(card => {
                    const text = card.innerText.toLowerCase();
                    card.classList.toggle('hidden', !text.includes(term));
                });
            }, 300);
        });
    }

    console.log("GUNGO Engine Cargado sin errores.");
    // Efecto Scroll en Navbar
    window.addEventListener('scroll', () => {
        const header = document.querySelector('header');
        if (header) {
            header.classList.toggle('scrolled', window.scrollY > 50);
        }
    });

});

