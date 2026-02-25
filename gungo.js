/* ========================================================
   GUNGO 2026 - SCRIPT PRINCIPAL (SIN VIDEOS)
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
    e.stopPropagation(); // Evita que se abra el modal al dar like
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

    // Cargar Data JSON (Solo para Noticias, Historias y Encuestas)
    if (newsGrid) {
        fetch('data.json')
            .then(r => r.ok ? r.json() : Promise.reject("Error de Red"))
            .then(data => {
                
                // 1. Lógica para Noticias
                if (newsGrid) {
                    window.allNewsData = [...(data.newsArticles || []), ...(data.loadMoreData || [])];
                    renderNews(data.newsArticles || [], false); 
                    setupLoadMore(data.loadMoreData || []);
                }

                // 2. Lógica Compartida (Historias, Ticker, Encuestas)
                if (data.storiesData) renderStories(data.storiesData);
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
    
    function renderNews(articles, append = false) {
        if (!newsGrid) return;
        if (!append) newsGrid.innerHTML = ''; 
        
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
                window.renderNews = renderNews;
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

    function updateTicker(newsList) {
        const el = document.querySelector('.breaking-text');
        
        if (el && newsList) {
            const textArray = newsList.map(item => {
                if (typeof item === 'object' && item !== null) {
                    return item.title || item.text || item.summary || ""; 
                }
                return item;
            });

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

    /* ========================================================
       LÓGICA DE FILTRADO (ESTRATEGIA 3 PILARES)
       ======================================================== */
    window.filtrarNoticias = function(categoria) {
        const grid = document.querySelector('.news-grid');
        const botones = document.querySelectorAll('.filter-btn');

        // Efecto Visual
        botones.forEach(btn => {
            btn.classList.remove('active', 'active-filter');
        });

        const botonActivo = Array.from(botones).find(b => 
            b.textContent.toUpperCase().includes(categoria.toUpperCase()) || 
            (categoria === 'todo' && b.textContent === 'INICIO')
        );
        
        if(botonActivo) {
            botonActivo.classList.add('active', 'active-filter');
        }

        // Filtrado de Datos
        if (!window.allNewsData || window.allNewsData.length === 0) {
            console.warn("No hay noticias cargadas para filtrar");
            return;
        }

        let noticiasFiltradas;

        if (categoria === 'todo') {
            noticiasFiltradas = window.allNewsData; // Mostrar todo
        } else {
            noticiasFiltradas = window.allNewsData.filter(item => item.category === categoria);
        }

        renderNews(noticiasFiltradas, false); 

        // Scroll suave hacia arriba si está en móvil
        if (window.innerWidth < 768) {
            const yOffset = -120;
            const y = grid.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({top: y, behavior: 'smooth'});
        }

        if (noticiasFiltradas.length === 0) {
            showToast(`No hay contenido en ${categoria} por ahora.`);
        }
    };

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

    console.log("GUNGO Engine Cargado (Modo Noticias).");
    
    // Efecto Scroll en Navbar
    window.addEventListener('scroll', () => {
        const header = document.querySelector('header');
        if (header) {
            header.classList.toggle('scrolled', window.scrollY > 50);
        }
    });
});
