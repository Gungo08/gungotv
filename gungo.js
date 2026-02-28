/* ========================================================
   GUNGO 2026 - SCRIPT PRINCIPAL (FIREBASE, CHAT VIP, ZONATUBER, TTS)
   ======================================================== */

// --- CONFIGURACIÓN DE FIREBASE (REEMPLAZA CON TUS DATOS) ---
const firebaseConfig = {
    apiKey: "AIzaSyBv849w6NNk_4QhOnaY3x7LOE38apvc6o4",
    authDomain: "gungo-tv.firebaseapp.com",
    projectId: "gungo-tv",
    storageBucket: "gungo-tv.firebasestorage.app",
    messagingSenderId: "132166094948",
    appId: "1:132166094948:web:0ca391d2dc20306e85cf71",
    measurementId: "G-MFNZH83Y1X"
};

// Inicializar Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
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

/* --- CARGA INTELIGENTE DESDE FIREBASE --- */
document.addEventListener("DOMContentLoaded", () => {
    const newsGrid = document.querySelector('.news-grid');
    const searchInput = document.getElementById('searchInput');

    if (newsGrid) {
        // LECTURA DIRECTA DE FIRESTORE (Ordenado por fecha)
        db.collection("noticias")
            .orderBy("publishedAt", "desc")
            .get()
            .then((snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                window.allNewsData = data;
                
                // 1. CARGA INMEDIATA: Las primeras 9 noticias
                const initialNews = window.allNewsData.slice(0, 9);
                renderNews(initialNews, false); 
                
                // 2. CARGA DIFERIDA: El resto al hacer scroll
                let scrollLoaded = false;
                window.addEventListener('scroll', function loadRestOnScroll() {
                    if (!scrollLoaded && window.scrollY > 300) {
                        scrollLoaded = true;
                        const remainingNews = window.allNewsData.slice(9);
                        renderNews(remainingNews, true);
                        window.removeEventListener('scroll', loadRestOnScroll);
                    }
                });
            })
            .catch(error => {
                console.error("Error conectando a Firebase:", error);
                newsGrid.innerHTML = "<p style='color:#fff;'>Error cargando noticias. Verifica la conexión.</p>";
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
                <span class="category-tag">${news.category || 'Noticia'}</span>
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

    // --- ZONATUBER (Reemplaza TikTok por 2 videos de YouTube) ---
    function renderZonaTuber() {
        const ytGrid = document.getElementById('youtube-grid');
        if (!ytGrid) return;
        
        // Coloca aquí los IDs de los 2 videos de YouTube que quieras mostrar
        const videosYouTube = ["dQw4w9WgXcQ", "3JZ_D3ELwOQ"]; 
        
        videosYouTube.forEach(videoId => {
            const iframe = document.createElement('iframe');
            iframe.setAttribute('src', `https://www.youtube.com/embed/${videoId}`);
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
            iframe.setAttribute('allowfullscreen', 'true');
            // Estilos profesionales para el video
            iframe.style.width = "100%";
            iframe.style.height = "300px";
            iframe.style.maxWidth = "600px";
            iframe.style.borderRadius = "15px";
            iframe.style.boxShadow = "0 10px 30px rgba(0,0,0,0.5)";
            iframe.style.border = "2px solid #333";
            
            ytGrid.appendChild(iframe);
        });
    }
    renderZonaTuber();
});

// --- MODAL ---
window.openModal = function(article) {
    const modal = document.getElementById('newsModal');
    if (!modal) return;
    
    document.getElementById('modalImg').src = article.image;
    document.getElementById('modalTitle').innerText = article.title;
    document.getElementById('modalCat').innerText = article.category || 'Gungo';
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

// --- FILTROS DE CATEGORÍA ---
window.filtrarNoticias = function(categoria) {
    const botones = document.querySelectorAll('.filter-btn');
    botones.forEach(btn => btn.classList.remove('active', 'active-filter'));

    const normalize = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    const catBusqueda = normalize(categoria);
    let noticiasFiltradas;

    if (catBusqueda === 'TODO' || catBusqueda === 'INICIO') {
        noticiasFiltradas = window.allNewsData;
    } else {
        noticiasFiltradas = window.allNewsData.filter(item => item.category && normalize(item.category) === catBusqueda);
    }

    const newsGrid = document.querySelector('.news-grid');
    newsGrid.innerHTML = ''; 
    // Reutilizamos la lógica de renderizado
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
                    <button class="reaction-btn">🔥 <span>15</span></button>
                    <button class="share-btn-card"><i class="fas fa-share"></i></button>
                </div>
            </div>
        `;
        card.onclick = () => window.openModal(news);
        newsGrid.appendChild(card);
    });

    if (noticiasFiltradas.length === 0) window.showToast(`Sección ${categoria} sin noticias nuevas.`);
};

// --- CHAT INTERNO REDISEÑADO (MODERNO Y PROFESIONAL) ---
window.sendGungoMessage = function() {
    const input = document.getElementById('chat-input');
    const display = document.getElementById('chat-display');
    if(!input || !display) return;
    
    let msg = input.value.trim();
    if (msg === "") return;

    const prohibitedWords = ["http", ".com", "www", "spam", "puta", "mierda", "diablo", "estafa"]; 
    const isSpam = prohibitedWords.some(word => msg.toLowerCase().includes(word));

    if (isSpam) {
        window.showToast("Mensaje bloqueado: Sistema de seguridad activo.");
        input.value = "";
        return;
    }

    // Diseño de Burbuja de Chat Premium
    const msgContainer = document.createElement('div');
    msgContainer.style.background = "linear-gradient(145deg, #1a1a1a, #222)";
    msgContainer.style.padding = "15px 20px";
    msgContainer.style.borderRadius = "0px 20px 20px 20px"; // Efecto burbuja moderna
    msgContainer.style.border = "1px solid #333";
    msgContainer.style.borderLeft = "4px solid #FFEB3B";
    msgContainer.style.fontSize = "0.95rem";
    msgContainer.style.color = "#fff";
    msgContainer.style.boxShadow = "0 5px 15px rgba(0,0,0,0.3)";
    msgContainer.style.marginBottom = "5px";
    
    const randomUser = "UsuarioVIP_" + Math.floor(Math.random() * 999);
    
    msgContainer.innerHTML = `<strong style="color: #FFEB3B; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 5px;"><i class="fas fa-user-circle"></i> ${randomUser}</strong> ${msg}`;
    display.appendChild(msgContainer);
    
    display.scrollTop = display.scrollHeight; 
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
