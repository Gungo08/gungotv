import os
import sys
import json
import time
from datetime import datetime, timezone
from google import genai
from google.genai import types

try:
    # 1. Conectar con Gemini
    cliente = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

    # 2. ABRIR LA BASE DE DATOS PRIMERO (Para evitar repetidos)
    nombre_archivo = 'data.json' 
    titulos_existentes = []
    
    if os.path.exists(nombre_archivo):
        with open(nombre_archivo, 'r', encoding='utf-8') as archivo:
            datos_completos = json.load(archivo)
            # Extraer los últimos 5 titulares para decirle a la IA que NO los repita
            lista = datos_completos if isinstance(datos_completos, list) else datos_completos.get("newsArticles", [])
            titulos_existentes = [noticia.get("title", "") for noticia in lista[:5]]
    else:
        raise FileNotFoundError(f"¡Ojo! El archivo {nombre_archivo} no existe.")

    # 3. Instrucciones Inteligentes para GungoTV
    instrucciones = f"""
    Busca en internet la noticia más candente de hoy sobre farándula urbana dominicana o béisbol invernal (LIDOM).
    Escribe una noticia real, jugosa y confirmada.

    ⚠️ REGLA DE ORO - NO REPITAS ESTAS NOTICIAS QUE YA PUBLICAMOS:
    {titulos_existentes}

    Debes entregar la respuesta ESTRICTAMENTE en este formato JSON exacto:
    {{
      "id": 0,
      "slug": "titulo-separado-por-guiones",
      "category": "EXCLUSIVA",
      "badge": "NUEVO 🔥",
      "publishedAt": "",
      "title": "Titular explosivo de la noticia",
      "summary": "Resumen corto de una línea",
      "longDescription": "El cuerpo completo de la noticia, al menos dos párrafos.",
      "image": "PEGAR_LINK_AQUI",
      "altText": "Describe qué imagen buscar",
      "author": {{ "name": "Agente Gungo", "role": "Redacción IA" }},
      "media": {{ "type": "image", "count": 1 }},
      "metrics": {{ "views": "1K", "likes": 100, "shares": 50 }},
      "tags": ["Gungo", "Viral"],
      "seo_vortex_x": "Titular de impacto.",
      "seo_vortex_ig": "Storytelling integrando quién, qué, dónde. Máximo 3 hashtags.",
      "seo_vortex_tiktok_text": "Texto SBO exacto.",
      "seo_vortex_tiktok_filename": "hack-buscador.mp4"
    }}
    """

    # 4. Generación con Filtros y Amortiguador de Cuota
    max_intentos = 3
    intento_actual = 0
    respuesta = None

    while intento_actual < max_intentos:
        try:
            respuesta = cliente.models.generate_content(
                model='gemini-2.5-pro',
                contents=instrucciones,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    tools=[{"google_search": {}}], 
                    safety_settings=[
                        types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH", threshold="BLOCK_ONLY_HIGH"),
                        types.SafetySetting(category="HARM_CATEGORY_HARASSMENT", threshold="BLOCK_ONLY_HIGH"),
                        types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="BLOCK_ONLY_HIGH"),
                        types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="BLOCK_ONLY_HIGH"),
                    ]
                )
            )
            break 
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower():
                intento_actual += 1
                print(f"⚠️ Límite de cuota. Esperando 60 segundos... (Intento {intento_actual}/{max_intentos})")
                time.sleep(60)
                if intento_actual == max_intentos:
                    print("❌ Error crítico: Se agotó la cuota de la API.")
                    sys.exit(1) # Freno de emergencia
            else:
                print(f"❌ Error de conexión: {str(e)}")
                sys.exit(1)

    # 5. VALIDACIÓN ESTRICTA DE DATOS (Lo que pidió Copilot)
    texto_limpio = respuesta.text
    if texto_limpio.startswith("```json"):
        texto_limpio = texto_limpio.replace("```json\n", "").replace("```", "").strip()

    try:
        nueva_noticia = json.loads(texto_limpio)
        # Verificar que la IA no omitió campos vitales
        claves_requeridas = ["slug", "title", "longDescription", "seo_vortex_x"]
        if not all(k in nueva_noticia for k in claves_requeridas):
            print("❌ Error crítico: La IA generó un formato incompleto.")
            sys.exit(1) # Freno de emergencia
            
    except json.JSONDecodeError:
        print("❌ Error crítico: La respuesta no es un código JSON válido.")
        sys.exit(1) # Freno de emergencia

    # 6. Inyectar la noticia validada
    nueva_noticia["id"] = int(time.time())
    nueva_noticia["publishedAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    if isinstance(datos_completos, list):
        datos_completos.insert(0, nueva_noticia)
    else:
        if "newsArticles" not in datos_completos:
            datos_completos["newsArticles"] = []
        datos_completos["newsArticles"].insert(0, nueva_noticia)
        if "meta" in datos_completos:
            datos_completos["meta"]["lastUpdated"] = nueva_noticia["publishedAt"]

    with open(nombre_archivo, 'w', encoding='utf-8') as archivo:
        json.dump(datos_completos, archivo, indent=2, ensure_ascii=False)

    print("✅ ¡Éxito! Noticia validada, verificada contra duplicados e inyectada.")

except Exception as error:
    print(f"❌ ERROR GENERAL NO CONTROLADO: {str(error)}")
    sys.exit(1) # Si algo falla, aborta todo y NO crea el borrador

