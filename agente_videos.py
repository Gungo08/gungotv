import os
import sys
import json
import time
from datetime import datetime, timezone
from google import genai
from google.genai import types

try:
    # ====================== CLIENTE GEMINI ======================
    cliente = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

    nombre_archivo = 'data.json'

    with open(nombre_archivo, 'r', encoding='utf-8') as archivo:
        datos_completos = json.load(archivo)

    # ====================== PROMPT MEJORADO ======================
    fecha_hoy = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    system_instruction = """
    Eres un extractor profesional de contenido viral en República Dominicana.
    SIEMPRE responde **EXCLUSIVAMENTE** con un JSON válido y nada más.
    Sin explicaciones, sin ```json, sin texto adicional.
    """

    user_prompt = f"""
    Busca en internet el video MÁS VIRAL de HOY ({fecha_hoy}) en República Dominicana 
    sobre música, entretenimiento, béisbol o farándula (YouTube, TikTok o Instagram).

    Devuelve ESTRICTAMENTE este formato JSON exacto:

    {{
      "id": 0,
      "title": "Titular explosivo del video",
      "platform": "youtube", 
      "videoUrl": "URL_REAL_DEL_VIDEO_AQUI",
      "thumbnail": "URL_DE_LA_MINIATURA_O_IMAGEN",
      "description": "Breve descripción de por qué este video está rompiendo las redes hoy en RD.",
      "publishedAt": "",
      "category": "VIRAL 🚀"
    }}
    """

    # ====================== CONFIGURACIÓN (CORREGIDA) ======================
    config = types.GenerateContentConfig(
        tools=[types.Tool(google_search=types.GoogleSearch())],
        safety_settings=[
            types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH", threshold="BLOCK_NONE"),
            types.SafetySetting(category="HARM_CATEGORY_HARASSMENT", threshold="BLOCK_NONE"),
            types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="BLOCK_NONE"),
            types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="BLOCK_NONE"),
        ],
        # ←←← ESTA LÍNEA FUE ELIMINADA (era la que causaba el error 400)
        system_instruction=system_instruction
    )

    # ====================== LLAMADA CON RETRY ======================
    max_intentos = 3
    intento_actual = 0
    respuesta = None

    while intento_actual < max_intentos:
        try:
            respuesta = cliente.models.generate_content(
                model='gemini-2.5-flash',
                contents=user_prompt,
                config=config
            )
            break
        except Exception as e:
            error_str = str(e).lower()
            if "429" in error_str or "quota" in error_str or "rate limit" in error_str:
                intento_actual += 1
                print(f"⚠️ Rate limit. Esperando 30s... (Intento {intento_actual}/{max_intentos})")
                time.sleep(30)
            else:
                print(f"❌ Error inesperado en Gemini: {e}")
                sys.exit(1)

    if not respuesta or not respuesta.text:
        print("⚠️ Gemini no devolvió texto. Saliendo limpiamente.")
        sys.exit(0)

    # ====================== PROCESAR JSON ======================
    try:
        texto_limpio = respuesta.text.strip()
        if texto_limpio.startswith("```json"):
            texto_limpio = texto_limpio[7:-3].strip()
        elif texto_limpio.startswith("```"):
            texto_limpio = texto_limpio[3:-3].strip()
        nuevo_video = json.loads(texto_limpio)
    except json.JSONDecodeError as e:
        print(f"❌ Gemini devolvió JSON inválido: {e}")
        print("Texto crudo recibido:", respuesta.text[:500])
        sys.exit(1)

    # Completar campos automáticos
    nuevo_video["id"] = int(time.time())
    nuevo_video["publishedAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # ====================== GUARDAR ======================
    if "viralVideos" not in datos_completos:
        datos_completos["viralVideos"] = []

    datos_completos["viralVideos"].insert(0, nuevo_video)

    with open(nombre_archivo, 'w', encoding='utf-8') as archivo:
        json.dump(datos_completos, archivo, indent=2, ensure_ascii=False)

    print("✅ ¡Éxito total! Video viral de hoy inyectado en Gungo.")

except Exception as error:
    print(f"❌ ERROR GENERAL: {error}")
    sys.exit(1)


