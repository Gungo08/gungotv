import os
import json
import time
from datetime import datetime, timezone
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockerThreshold

try:
    # 1. Configurar la llave
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    modelo = genai.GenerativeModel('gemini-2.5-pro')

    # 2. Instrucciones para GungoTV
    instrucciones = """
    Eres un periodista experto en farándula urbana dominicana, actualidad y béisbol invernal (LIDOM).
    Escribe una noticia corta, jugosa y de última hora.

    Debes entregar la respuesta ESTRICTAMENTE en este formato JSON exacto:
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
      "altText": "Descripción exacta de la imagen",
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

    # 3. Pedir la noticia con los filtros de censura APAGADOS
    respuesta = modelo.generate_content(
        instrucciones,
        generation_config={"response_mime_type": "application/json"},
        safety_settings={
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockerThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockerThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockerThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockerThreshold.BLOCK_NONE,
        }
    )

    # 4. Preparar la noticia
    nueva_noticia = json.loads(respuesta.text)
    nueva_noticia["id"] = int(time.time())
    nueva_noticia["publishedAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # 5. Abrir la base de datos
    nombre_archivo = 'noticias.json'
    
    if not os.path.exists(nombre_archivo):
        raise FileNotFoundError(f"¡Ojo! El archivo {nombre_archivo} no se encuentra en la carpeta principal.")

    with open(nombre_archivo, 'r', encoding='utf-8') as archivo:
        datos_completos = json.load(archivo)

    # 6. Inyectar la noticia (Se adapta a cualquier estructura)
    if isinstance(datos_completos, list):
        # Si tu archivo sigue siendo una lista vacía []
        datos_completos.insert(0, nueva_noticia)
    else:
        # Si tu archivo ya es el diccionario completo de GungoTV
        if "newsArticles" not in datos_completos:
            datos_completos["newsArticles"] = []
        datos_completos["newsArticles"].insert(0, nueva_noticia)
        
        if "meta" in datos_completos:
            datos_completos["meta"]["lastUpdated"] = nueva_noticia["publishedAt"]

    # 7. Guardar los cambios
    with open(nombre_archivo, 'w', encoding='utf-8') as archivo:
        json.dump(datos_completos, archivo, indent=2, ensure_ascii=False)

    print("¡Noticia de Gungo generada e inyectada con éxito!")

except Exception as error:
    print(f"ERROR DETECTADO PARA REVISAR: {str(error)}")
    raise error

