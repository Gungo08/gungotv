import os
import json
import time
from datetime import datetime, timezone
from google import genai
from google.genai import types

try:
    # 1. Conectar con la NUEVA versión de Gemini
    cliente = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

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

    # 3. Generar contenido con la nueva sintaxis (Filtros apagados)
    respuesta = cliente.models.generate_content(
        model='gemini-2.5-pro',
        contents=instrucciones,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            safety_settings=[
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold=types.HarmBlockerThreshold.BLOCK_NONE,
                ),
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold=types.HarmBlockerThreshold.BLOCK_NONE,
                ),
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold=types.HarmBlockerThreshold.BLOCK_NONE,
                ),
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold=types.HarmBlockerThreshold.BLOCK_NONE,
                ),
            ]
        )
    )

    texto_limpio = respuesta.text
    if texto_limpio.startswith("```json"):
        texto_limpio = texto_limpio.replace("```json\n", "").replace("```", "").strip()

    # 4. Preparar la noticia
    nueva_noticia = json.loads(texto_limpio)
    nueva_noticia["id"] = int(time.time())
    nueva_noticia["publishedAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # 5. Abrir la base de datos (AHORA ES data.json)
    nombre_archivo = 'data.json' 
    
    if not os.path.exists(nombre_archivo):
        raise FileNotFoundError(f"¡Ojo! El archivo {nombre_archivo} no se encuentra en la carpeta principal.")

    with open(nombre_archivo, 'r', encoding='utf-8') as archivo:
        datos_completos = json.load(archivo)

    # 6. Inyectar la noticia
    if isinstance(datos_completos, list):
        datos_completos.insert(0, nueva_noticia)
    else:
        if "newsArticles" not in datos_completos:
            datos_completos["newsArticles"] = []
        datos_completos["newsArticles"].insert(0, nueva_noticia)
        
        if "meta" in datos_completos:
            datos_completos["meta"]["lastUpdated"] = nueva_noticia["publishedAt"]

    # 7. Guardar los cambios
    with open(nombre_archivo, 'w', encoding='utf-8') as archivo:
        json.dump(datos_completos, archivo, indent=2, ensure_ascii=False)

    print("¡Noticia de Gungo generada e inyectada con éxito en data.json!")

except Exception as error:
    print(f"ERROR DETECTADO PARA REVISAR: {str(error)}")
    raise error

