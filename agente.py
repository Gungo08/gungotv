import os
import json
import time
from datetime import datetime, timezone
import google.generativeai as genai

# 1. Configurar la llave de acceso
genai.configure(api_key=os.environ["GEMINI_API_KEY"])
modelo = genai.GenerativeModel('gemini-2.5-pro')

# 2. Las instrucciones súper específicas para el periodista IA
instrucciones = """
Eres un periodista experto en farándula urbana dominicana, actualidad y béisbol invernal (LIDOM).
Escribe una noticia corta, jugosa y de última hora.

Debes entregar la respuesta ESTRICTAMENTE en este formato JSON exacto, llenando los datos:
{
  "id": 0,
  "slug": "titulo-separado-por-guiones",
  "category": "EXCLUSIVA",
  "badge": "NUEVO 🔥",
  "publishedAt": "",
  "title": "Titular explosivo de la noticia",
  "summary": "Resumen corto de una línea",
  "longDescription": "El cuerpo completo de la noticia, al menos dos párrafos bien redactados.",
  "image": "https://placehold.co/800x500/111/E50914/png?text=Noticia+Gungo",
  "altText": "Descripción exacta de lo que habría en la imagen para accesibilidad",
  "author": { "name": "Agente Gungo", "role": "Redacción IA" },
  "media": { "type": "image", "count": 1 },
  "metrics": { "views": "1K", "likes": 100, "shares": 50 },
  "tags": ["Gungo", "Viral", "Noticia"],
  "seo_vortex_x": "Nombres Propios y Acción Principal en la primera línea. Titular de impacto.",
  "seo_vortex_ig": "Storytelling natural integrando quién, qué, dónde. Máximo 3 hashtags al final.",
  "seo_vortex_tiktok_text": "Texto SBO exacto para el segundo 1 del video.",
  "seo_vortex_tiktok_filename": "sugerencia-nombre-archivo-hack-buscador.mp4"
}
"""

# 3. Pedir la noticia forzando el formato JSON
respuesta = modelo.generate_content(
    instrucciones,
    generation_config={"response_mime_type": "application/json"}
)

# 4. Convertir y preparar los datos automáticos (ID único y fecha actual)
nueva_noticia = json.loads(respuesta.text)
nueva_noticia["id"] = int(time.time()) # Crea un ID numérico único
nueva_noticia["publishedAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

# 5. Abrir la base de datos de Gungo
nombre_archivo = 'noticias.json' # Asegúrate de que este sea el nombre exacto de tu archivo

with open(nombre_archivo, 'r', encoding='utf-8') as archivo:
    datos_completos = json.load(archivo)

# 6. Inyectar la noticia en la sección correcta (newsArticles)
# Verificamos si existe la sección, si no, la crea (por seguridad)
if "newsArticles" not in datos_completos:
    datos_completos["newsArticles"] = []

# Coloca la noticia de número 1 en la lista
datos_completos["newsArticles"].insert(0, nueva_noticia)

# Actualiza la fecha de última modificación de la web
if "meta" in datos_completos:
    datos_completos["meta"]["lastUpdated"] = nueva_noticia["publishedAt"]

# 7. Guardar todo de vuelta en el archivo
with open(nombre_archivo, 'w', encoding='utf-8') as archivo:
    json.dump(datos_completos, archivo, indent=2, ensure_ascii=False)

print("¡Noticia inyectada con éxito en la sección newsArticles de Gungo!")
