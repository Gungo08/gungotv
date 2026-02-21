import os
import sys
import json
import time
from datetime import datetime, timezone
from google import genai
from google.genai import types

try:
    cliente = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    nombre_archivo = 'data.json' 

    with open(nombre_archivo, 'r', encoding='utf-8') as archivo:
        datos_completos = json.load(archivo)

    # Instrucciones para el Cazador de Videos
    instrucciones = """
    Busca en internet el video más viral de HOY en República Dominicana (YouTube, TikTok o Instagram) sobre farándula urbana, música o béisbol.
    Devuelve ESTRICTAMENTE este formato JSON:
    {
      "id": 0,
      "title": "Titular explosivo del video",
      "platform": "youtube", 
      "videoUrl": "URL_REAL_DEL_VIDEO_AQUI",
      "thumbnail": "URL_DE_LA_MINIATURA_O_IMAGEN",
      "description": "Breve descripción de por qué este video está rompiendo las redes hoy.",
      "publishedAt": "",
      "category": "VIRAL 🚀"
    }
    """

    respuesta = cliente.models.generate_content(
        model='gemini-2.5-flash',
        contents=instrucciones,
        config=types.GenerateContentConfig(
            tools=[{"google_search": {}}], 
            safety_settings=[
                types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH", threshold="BLOCK_ONLY_HIGH"),
                types.SafetySetting(category="HARM_CATEGORY_HARASSMENT", threshold="BLOCK_ONLY_HIGH"),
                types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="BLOCK_ONLY_HIGH"),
                types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="BLOCK_ONLY_HIGH"),
            ]
        )
    )

    texto_limpio = respuesta.text
    if texto_limpio.startswith("```json"):
        texto_limpio = texto_limpio.replace("```json\n", "").replace("```", "").strip()

    nuevo_video = json.loads(texto_limpio)
    nuevo_video["id"] = int(time.time())
    nuevo_video["publishedAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # Inyectar en la sección de videos (crea la sección si no existe)
    if "viralVideos" not in datos_completos:
        datos_completos["viralVideos"] = []
    datos_completos["viralVideos"].insert(0, nuevo_video)

    with open(nombre_archivo, 'w', encoding='utf-8') as archivo:
        json.dump(datos_completos, archivo, indent=2, ensure_ascii=False)

    print("✅ ¡Éxito! Video viral inyectado en la base de datos.")

except Exception as error:
    print(f"❌ ERROR EN VIDEOS: {str(error)}")
    sys.exit(1)