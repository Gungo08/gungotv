// ========================================================
// URBANO & REDES - SCRIPT LÓGICO Y ANIMACIONES (V6.0 PRO)
// ========================================================

var firebaseConfig = {
    apiKey: "AIzaSyBv849w6NNk_4QhOnaY3x7LOE38apvc6o4",
    authDomain: "gungo-tv.firebaseapp.com",
    projectId: "gungo-tv",
    storageBucket: "gungo-tv.firebasestorage.app",
    messagingSenderId: "132166094948",
    appId: "1:132166094948:web:0ca391d2dc20306e85cf71",
    measurementId: "G-MFNZH83Y1X"
};

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
var db = firebase.firestore();

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
    toast.innerHTML = `<div class="toast-header">URBANO & REDES</div><div class="toast-body">${msg}</div>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
};

window.shareNative = function(title, text) {
    if (navigator.share) {
        navigator.share({ title: title, text: text, url: window.location.href }).catch(console.error);
    } else {
        navigator.clipboard.writeText(window.location.href);
        window.showToast("¡Enlace copiado al portapapeles!");
    }
};

window.shareCurrentModal = function() {
    const title = document.getElementById('modalTitle')?.innerText || "Noticia GUNGO";
    window.shareNative(title, "¡Mira esta información en GUNGO.tv!");
};

window.triggerIsland = function(msg) {
    const island = document.getElementById('gungo-island');
    const text = document.getElementById('island-text');
    if (island && text) {
        text.innerText = msg;
        island.classList.add('show');
        setTimeout(() => { island.classList.remove('show'); }, 4000);
    }
};

// --- MOTOR DE REACCIONES Y LLUVIA DE FUEGO ---
window.toggleReact = function(btn, e) {
    e.stopPropagation(); 
    btn.classList.toggle('active');
    
    const span = btn.querySelector('span');
    if (span) {
        let count = parseInt(span.innerText.replace(/,/g, '')) || 0;
        span.innerText = btn.classList.contains('active') ? count + 1 : count - 1;
    }

    if (btn.classList.contains('active')) {
        const rect = btn.getBoundingClientRect();
        for (let i = 0; i < 6; i++) {
            const fire = document.createElement('div');
            fire.innerText = '🔥';
            fire.style.position = 'fixed';
            fire.style.left = (rect.left + (rect.width / 2) + (Math.random() * 40 - 20)) + 'px';
            fire.style.top = rect.top + 'px';
            fire.style.fontSize = (Math.random() * 1.5 + 1) + 'rem';
            fire.style.pointerEvents = 'none';
            fire.style.zIndex = '9999';
            fire.style.transition = 'transform 1s ease-out, opacity 1s ease-out';
            fire.style.transform = 'translateY(0) scale(1)';
            fire.style.opacity = '1';
            document.body.appendChild(fire);
            
            requestAnimationFrame(() => {
                fire.style.transform = `translateY(-${Math.random() * 100 + 50}px) scale(1.5) rotate(${Math.random() * 40 - 20}deg)`;
                fire.style.opacity = '0';
            });
            setTimeout(() => fire.remove(), 1000);
        }
    }
};

// --- MOTOR DEL MODAL (RÉPLICA EXACTA DE LA PÁGINA PRINCIPAL) ---
window.openModal = function(article) {
    const modal = document.getElementById('newsModal');
    if (!modal) return;
    
    // 1. Configuramos la Foto de Portada (Libre y manejada por gungo.css)
    let mainImg = document.getElementById('modalImg');
    if (!mainImg) {
        mainImg = document.createElement('img');
        mainImg.id = 'modalImg';
        const modalTextContainer = document.querySelector('.modal-text');
        document.querySelector('.modal-content').insertBefore(mainImg, modalTextContainer);
    }
    mainImg.src = article.image;
    mainImg.onerror = function() { this.src = "https://placehold.co/1280x720/1a1a1a/FFEB3B/png?text=URBANO+REDES"; };

    // 2. Datos de la noticia
    document.getElementById('modalTitle').innerText = article.title || '';
    
    const textContent = article.longDescription || article.summary || '';
    const wordCount = textContent.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200) || 1;
    const liveViewers = Math.floor(Math.random() * (120 - 35 + 1)) + 35;

    const modalCat = document.getElementById('modalCat');
    if (modalCat) {
        modalCat.innerHTML = `
            ${article.category || 'Urbano & Redes'} 
            <span class="live-readers"><i class="fas fa-circle" style="color:#FF1744; font-size:0.6rem;"></i> ${liveViewers} leyendo ahora</span>
        `;
    }

    const readTimeBadge = document.getElementById('read-time-badge');
    if (readTimeBadge) {
        readTimeBadge.innerHTML = `<div class="smart-read-time"><i class="far fa-clock"></i> Tiempo estimado: ${readingTime} min</div>`;
    }
    
    // 3. Magia de Imágenes Embebidas
    let contenidoFinal = textContent;
    if (article.image2 && article.image2.trim() !== "") {
        contenidoFinal += `<img src="${article.image2}" alt="Imagen adicional" loading="lazy">`;
    }
    if (article.image3 && article.image3.trim() !== "") {
        contenidoFinal += `<img src="${article.image3}" alt="Tercera imagen" loading="lazy">`;
    }

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

    if (window.instgrm) window.instgrm.Embeds.process();
};

const closeModalBtn = document.querySelector('.close-modal');
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        if (window.speechSynthesis) window.speechSynthesis.cancel(); 
        const btn = document.getElementById('tts-button');
        if (btn) { btn.classList.remove('playing'); btn.innerHTML = '<i class="fas fa-volume-up"></i> Escuchar noticia'; }
        document.getElementById('newsModal').classList.remove('open');
        document.body.style.overflow = 'auto';
    });
}

window.onclick = function(event) {
    const modal = document.getElementById('newsModal');
    if (event.target == modal) { 
        if (closeModalBtn) closeModalBtn.click(); 
    }
};

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

// --- VIP HISTORIAS ---
window.renderStories = function(stories) {
    const container = document.getElementById('storiesFeed');
    if (!container) return;
    container.innerHTML = stories.map(s => `
        <div>
            <div class="story-circle ${s.hasNew ? 'new-story' : ''}">
                <img src="${s.img}" alt="${s.name}" onerror="this.src='https://placehold.co/150x150/222/FFEB3B/png?text=VIP'">
            </div>
            <p class="story-name">${s.name}</p>
        </div>
    `).join('');
};

// --- MOTOR HÍBRIDO ---
document.addEventListener("DOMContentLoaded", () => {
    
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('is-visible'); });
    }, { threshold: 0.15 });

    document.querySelectorAll('.scroll-anim').forEach(el => scrollObserver.observe(el));

    Promise.all([
        db.collection("noticias").where("category", "==", "Urbano & Redes").orderBy("publishedAt", "desc").get().catch(e => ({ docs: [] })),
        fetch('urbano_data.json').then(r => r.ok ? r.json() : null).catch(e => null)
    ]).then(([firebaseSnapshot, jsonData]) => {
        
        const firebaseNews = firebaseSnapshot.docs ? firebaseSnapshot.docs.map(doc => doc.data()) : [];
        const jsonNews = jsonData && jsonData.newsArticles ? jsonData.newsArticles : [];

        const allNews = [...firebaseNews, ...jsonNews];
        const grid = document.getElementById('urbano-grid');

        if (allNews.length === 0) {
            grid.innerHTML = "<div style='text-align:center; width:100%; padding: 40px; background: #111; border-radius: 20px; color:#FFEB3B;'>🔥 Sube exclusivas de Urbano & Redes...</div>";
        } else {
            grid.innerHTML = '';
            allNews.forEach(news => {
                const card = document.createElement('div');
                card.className = 'news-card scroll-anim'; 
                
                const fallbackImg = "https://placehold.co/600x400/1a1a1a/FFEB3B/png?text=URBANO+REDES";
                let textoLimpio = news.summary ? news.summary.replace(/<[^>]*>?/gm, '') : '';
                
                card.innerHTML = `
                    <span class="category-tag" style="background: linear-gradient(90deg, #E1306C, #FFEB3B); color:#000; font-weight:bold;">#Movimiento</span>
                    <img src="${news.image}" alt="${news.title}" onerror="this.src='${fallbackImg}'" loading="lazy" style="aspect-ratio: 16/9; object-fit: cover; width: 100%;">
                    <div class="card-content">
                        <h3 class="card-title-fix">${news.title}</h3>
                        <p class="summary-text">${textoLimpio}</p>
                        <div class="reaction-bar">
                            <button class="reaction-btn" onclick="window.toggleReact(this, event)">🔥 <span>${Math.floor(Math.random()*100)+10}</span></button>
                            <button class="share-btn-card" onclick="event.stopPropagation(); window.shareNative('${news.title}', 'Gungo.tv')"><i class="fas fa-share"></i></button>
                        </div>
                    </div>
                `;
                
                card.addEventListener('click', (e) => {
                    if (!e.target.closest('button')) { window.openModal(news); }
                });
                
                grid.appendChild(card);
                scrollObserver.observe(card);
            });
            
            if (window.instgrm) window.instgrm.Embeds.process();
            window.triggerIsland("🔥 Conexión Urbano & Redes Activa");
        }

        if (jsonData && jsonData.storiesData) {
            window.renderStories(jsonData.storiesData);
        }

    }).catch(err => console.error("Error crítico de carga:", err));

    const island = document.getElementById('gungo-island');
    const islandText = document.getElementById('island-text');
    if (island && islandText) {
        const mensajes = [
            "🎵 El género está encendido ahora", 
            "📸 Nuevo post viral detectado", 
            "🔥 Más de 500 personas leyendo Urbano & Redes"
        ];
        setInterval(() => {
            islandText.innerText = mensajes[Math.floor(Math.random() * mensajes.length)];
            island.classList.add('show');
            setTimeout(() => island.classList.remove('show'), 5000);
        }, 30000);
    }
});
 
// Mejora de rendimiento: usamos requestAnimationFrame para evitar repaints excesivos
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

      // Comprobamos con >= y <= para incluir bordes
      if (x >= 0 && y >= 0 && x <= rect.width && y <= rect.height) {
        // Usar backgroundImage evita sobreescribir otras propiedades de background accidentalmente
        card.style.backgroundImage = `radial-gradient(circle at ${Math.round(x)}px ${Math.round(y)}px, rgba(255,235,59,0.12) 0%, rgba(26,26,26,1) 50%)`;
        card.style.borderColor = "rgba(255,235,59,0.5)";
      } else {
        // Restaurar: quitar backgroundImage para respetar estilos CSS originales
        card.style.backgroundImage = '';
        card.style.borderColor = '';
      }
    });
  });
});
// Hype Engine mejorado y seguro
(function () {
  // Configuración
  const DEFAULT_INTERVAL_MS = 45000;
  const eventosHype = [
    "🔥 ¡VIRAL! 1,200 personas compartiendo la última exclusiva",
    "📈 Tendencia en RD: Urbano & Redes sube al #1",
    "💬 45 usuarios VIP están debatiendo ahora mismo",
    "📸 ¡Nuevo post en el Radar! La calle está encendida",
    "⚡ Noticia de último minuto enviada a 5,000 dispositivos"
  ];

  // Estado interno
  let intervalId = null;
  let intervalMs = DEFAULT_INTERVAL_MS;
  let isPaused = false;

  // Función para obtener mensaje aleatorio
  function obtenerMensaje() {
    return eventosHype[Math.floor(Math.random() * eventosHype.length)];
  }

  // Función que dispara el mensaje (usa triggerIsland si existe)
  function dispararMensaje() {
    const msg = obtenerMensaje();
    if (typeof window.triggerIsland === "function") {
      try {
        window.triggerIsland(msg);
      } catch (err) {
        // Si triggerIsland falla, lo registramos para debugging
        console.error("triggerIsland falló:", err);
      }
    } else {
      // Fallback seguro: emitir evento personalizado y log
      console.info("HypeEngine fallback:", msg);
      const ev = new CustomEvent("hypeEngineMessage", { detail: msg });
      window.dispatchEvent(ev);
    }
  }

  // Inicia el intervalo (evita duplicados)
  function start() {
    if (intervalId) return;
    intervalId = setInterval(() => {
      if (!isPaused) dispararMensaje();
    }, intervalMs);
    // Disparar uno inmediato al iniciar para feedback instantáneo
    dispararMensaje();
  }

  // Detiene el intervalo
  function stop() {
    if (!intervalId) return;
    clearInterval(intervalId);
    intervalId = null;
  }

  // Pausar temporalmente (no limpia el intervalo)
  function pause() {
    isPaused = true;
  }

  // Reanudar después de pausa
  function resume() {
    isPaused = false;
  }

  // Cambiar intervalo en tiempo real
  function setIntervalMs(ms) {
    if (typeof ms !== "number" || ms < 1000) return;
    intervalMs = ms;
    if (intervalId) {
      stop();
      start();
    }
  }

  // Pausar cuando la pestaña no está visible para ahorrar recursos
  function handleVisibility() {
    if (document.hidden) pause();
    else resume();
  }
  document.addEventListener("visibilitychange", handleVisibility);

  // Exponer API controlada en window.hypeEngine
  window.hypeEngine = {
    start,
    stop,
    pause,
    resume,
    setIntervalMs,
    dispararMensaje // útil para pruebas manuales
  };

  // Autoarranque seguro
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

/* ========================================================
   🎊 GRAND LAUNCH CELEBRATION  — Production Ready
   Append to the end of urbano.js
   ======================================================== */
(function () {
  'use strict';

  // Configuración por defecto
  const DEFAULTS = {
    confettiCount: 50,
    confettiLifetimeMs: 5000,
    confettiBurstDelayMs: 500,
    messageIntervalMs: 6500,
    initialDelayMs: 2000,
    sessionKey: 'gungo_launch_done',
    zIndex: 10000,
    colors: ['#FFEB3B', '#FF6B00', '#FFFFFF', '#FFD700'],
    emojiSet: ['✨', '🎉', '💫'],
    maxConcurrentConfetti: 150
  };

  // Estado interno
  let activeConfetti = 0;
  let isRunning = false;

  // Utilidades
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }
  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  // Respect user reduced motion preference
  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Create a container for confetti to avoid layout thrash
  function ensureContainer() {
    let container = document.getElementById('gungo-confetti-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'gungo-confetti-container';
      Object.assign(container.style, {
        position: 'fixed',
        left: '0',
        top: '0',
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: String(DEFAULTS.zIndex)
      });
      document.body.appendChild(container);
    }
    return container;
  }

  // Create single confetti element and animate using Web Animations API when available
  function createConfettiElement(colors, emoji) {
    const el = document.createElement('div');
    el.className = 'gungo-confetti';
    el.textContent = emoji;
    const sizeRem = rand(0.9, 1.8);
    Object.assign(el.style, {
      position: 'absolute',
      left: `${rand(0, 100)}vw`,
      top: '-2rem',
      fontSize: `${sizeRem}rem`,
      color: colors[Math.floor(rand(0, colors.length))],
      transform: `translateX(${rand(-50, 50)}px) rotate(${rand(0, 360)}deg)`,
      opacity: '1',
      pointerEvents: 'none',
      willChange: 'transform, opacity'
    });
    return el;
  }

  // Animate confetti with fallback to CSS transitions if Web Animations API not available
  function animateConfetti(el, lifetimeMs) {
    const horizontalDrift = rand(-120, 120);
    const rotate = rand(180, 1080);
    const endY = window.innerHeight + 100;
    const keyframes = [
      { transform: el.style.transform, opacity: 1 },
      { transform: `translateY(${endY}px) translateX(${horizontalDrift}px) rotate(${rotate}deg)`, opacity: 0 }
    ];
    const options = {
      duration: lifetimeMs,
      easing: 'cubic-bezier(.2,.8,.2,1)',
      fill: 'forwards'
    };

    if (el.animate) {
      const anim = el.animate(keyframes, options);
      anim.onfinish = () => {
        if (el.parentNode) el.parentNode.removeChild(el);
        activeConfetti = Math.max(0, activeConfetti - 1);
      };
    } else {
      // Fallback: use transition
      el.style.transition = `transform ${lifetimeMs}ms cubic-bezier(.2,.8,.2,1), opacity ${Math.min(lifetimeMs, 2000)}ms ease-out`;
      requestAnimationFrame(() => {
        el.style.transform = keyframes[1].transform;
        el.style.opacity = '0';
      });
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
        activeConfetti = Math.max(0, activeConfetti - 1);
      }, lifetimeMs + 50);
    }
  }

  // Public confetti launcher with safety checks
  function launchConfetti(options = {}) {
    if (prefersReducedMotion) {
      // Emit event for analytics but do not animate heavy visuals
      const ev = new CustomEvent('gungoConfettiSkipped', { detail: { reason: 'reduced-motion' } });
      window.dispatchEvent(ev);
      return;
    }

    const cfg = Object.assign({}, DEFAULTS, options);
    const container = ensureContainer();

    // Prevent runaway creation
    const allowed = clamp(cfg.maxConcurrentConfetti - activeConfetti, 0, cfg.confettiCount);
    if (allowed <= 0) return;

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < allowed; i++) {
      const emoji = cfg.emojiSet[Math.floor(rand(0, cfg.emojiSet.length))];
      const confetti = createConfettiElement(cfg.colors, emoji);
      fragment.appendChild(confetti);
      activeConfetti++;
    }
    container.appendChild(fragment);

    // Animate each child
    Array.from(container.children).slice(-allowed).forEach(el => animateConfetti(el, cfg.confettiLifetimeMs));
    // Emit event for telemetry
    window.dispatchEvent(new CustomEvent('gungoConfettiLaunched', { detail: { count: allowed } }));
  }

  // Launch hype messages sequence with confetti hooks
  function startLaunchHype(options = {}) {
    if (isRunning) return;
    isRunning = true;

    const cfg = Object.assign({}, DEFAULTS, options);
    const launchMessages = options.launchMessages || [
      "🚀 ¡BIENVENIDOS AL LANZAMIENTO OFICIAL!",
      "🔥 El género urbano tiene un nuevo dueño: GUNGO.tv",
      "💎 Acceso VIP activado para toda la comunidad",
      "🌐 Conectando el movimiento con el mundo entero",
      "⚡ Gracias por ser parte de la historia..."
    ];

    // Fire initial confetti burst after small delay
    setTimeout(() => launchConfetti({ confettiCount: cfg.confettiCount }), cfg.confettiBurstDelayMs);

    // Sequence messages
    let delay = 1000;
    launchMessages.forEach((msg, index) => {
      setTimeout(() => {
        try {
          if (typeof window.triggerIsland === 'function') {
            window.triggerIsland(msg);
          } else {
            window.dispatchEvent(new CustomEvent('gungoLaunchMessage', { detail: msg }));
            console.info('gungoLaunchMessage', msg);
          }
        } catch (err) {
          console.error('triggerIsland error', err);
        }

        // Extra confetti on final message
        if (index === launchMessages.length - 1) {
          setTimeout(() => launchConfetti({ confettiCount: Math.min(cfg.confettiCount * 1.5, 100) }), 1000);
        }
      }, delay);
      delay += cfg.messageIntervalMs;
    });

    // Mark session done
    try {
      sessionStorage.setItem(cfg.sessionKey, 'true');
    } catch (err) {
      console.warn('sessionStorage unavailable', err);
    }
  }

  // Auto-run once per session with safe guards
  function autoStartIfNeeded(options = {}) {
    try {
      const already = sessionStorage.getItem(DEFAULTS.sessionKey);
      if (already) return;
    } catch (err) {
      // If sessionStorage blocked, still allow a single run per page load
      if (window.__gungo_launch_ran) return;
      window.__gungo_launch_ran = true;
    }

    // Defer until DOM ready
    const run = () => setTimeout(() => startLaunchHype(options), DEFAULTS.initialDelayMs);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run);
    } else {
      run();
    }
  }

  // Expose controlled API
  window.gungoCelebration = {
    launchConfetti,
    startLaunchHype,
    autoStartIfNeeded,
    defaults: Object.assign({}, DEFAULTS)
  };

  // Auto-start by default
  autoStartIfNeeded();

})();
