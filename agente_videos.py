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

    instrucciones = """
    Busca en internet el video más viral de HOY en República Dominicana (YouTube, TikTok o Instagram) sobre música, entretenimiento, béisbol o farándula.
    Devuelve ESTRICTAMENTE este formato JSON exacto:
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

    max_intentos = 3
    intento_actual = 0
    respuesta = None

    while intento_actual < max_intentos:
        try:
            respuesta = cliente.models.generate_content(
                model='gemini-2.5-flash',
                contents=instrucciones,
                config=types.GenerateContentConfig(
                    tools=[{"google_search": {}}], 
                    safety_settings=[
                        types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH", threshold="BLOCK_NONE"),
                        types.SafetySetting(category="HARM_CATEGORY_HARASSMENT", threshold="BLOCK_NONE"),
                        types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="BLOCK_NONE"),
                        types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="BLOCK_NONE"),
                    ]
                )
            )
            break
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower():
                intento_actual += 1
                print(f"⚠️ Límite de velocidad. Esperando 30 segundos... (Intento {intento_actual}/{max_intentos})")
                time.sleep(30)
                if intento_actual == max_intentos:
                    print("❌ Error crítico: Se agotó la paciencia de la API.")
                    sys.exit(1)
            else:
                print(f"❌ Error de conexión: {str(e)}")
                sys.exit(1)

    # ESCUDO ANTI-CENSURA
    if not respuesta or not hasattr(respuesta, 'text') or not respuesta.text:
        print("⚠️ Advertencia: La IA no devolvió texto. Posiblemente Google bloqueó la noticia por exceso de lenguaje sensible. Intentaremos en el próximo ciclo.")
        sys.exit(0) # Sale pacíficamente sin dar error rojo

    texto_bruto = respuesta.text
    inicio = texto_bruto.find('{')
    fin = texto_bruto.rfind('}')
    
    if inicio != -1 and fin != -1:
        texto_limpio = texto_bruto[inicio:fin+1]
    else:
        print("❌ Error crítico: La IA no devolvió JSON en videos.")
        sys.exit(1)

    nuevo_video = json.loads(texto_limpio)
    nuevo_video["id"] = int(time.time())
    nuevo_video["publishedAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    if "viralVideos" not in datos_completos:
        datos_completos["viralVideos"] = []
    datos_completos["viralVideos"].insert(0, nuevo_video)

    with open(nombre_archivo, 'w', encoding='utf-8') as archivo:
        json.dump(datos_completos, archivo, indent=2, ensure_ascii=False)

    print("✅ ¡Éxito! Video viral extraído e inyectado.")

except Exception as error:
    print(f"❌ ERROR GENERAL NO CONTROLADO EN VIDEOS: {str(error)}")
    sys.exit(1)


