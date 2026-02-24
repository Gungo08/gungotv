import os
import sys
import json
import time
import logging
from datetime import datetime, timezone
from google import genai
from google.genai import types
from jsonschema import validate, ValidationError

# Configuración de logging
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

# Esquema JSON para validar la noticia
noticia_schema = {
    "type": "object",
    "properties": {
        "id": {"type": "integer"},
        "slug": {"type": "string"},
        "category": {"type": "string"},
        "badge": {"type": "string"},
        "publishedAt": {"type": "string"},
        "title": {"type": "string"},
        "summary": {"type": "string"},
        "longDescription": {"type": "string"},
        "image": {"type": "string"},
        "altText": {"type": "string"},
        "author": {"type": "object"},
        "media": {"type": "object"},
        "metrics": {"type": "object"},
        "tags": {"type": "array"},
        "seo_vortex_x": {"type": "string"},
        "seo_vortex_tiktok_text": {"type": "string"},
    },
    "required": [
        "slug", "title", "longDescription", "seo_vortex_x",
        "category", "badge", "summary", "image", "altText"
    ]
}

def cargar_base_datos(nombre_archivo):
    if not os.path.exists(nombre_archivo):
        logging.warning(f"El archivo {nombre_archivo} no existe. Creando uno nuevo...")
        return {"newsArticles": [], "meta": {"lastUpdated": None}}
    with open(nombre_archivo, 'r', encoding='utf-8') as archivo:
        return json.load(archivo)

def guardar_base_datos(nombre_archivo, datos):
    with open(nombre_archivo, 'w', encoding='utf-8') as archivo:
        json.dump(datos, archivo, indent=2, ensure_ascii=False)

def generar_noticia(cliente, instrucciones):
    esperas = [30, 60, 120]  # backoff exponencial
    for intento_actual, espera in enumerate(esperas, start=1):
        try:
            logging.info(f"Generando noticia con Gemini (intento {intento_actual})...")
            respuesta = cliente.models.generate_content(
                model='gemini-2.5-flash-lite',
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
            return respuesta.text
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower():
                logging.warning(f"Límite de cuota alcanzado. Esperando {espera} segundos...")
                time.sleep(espera)
            else:
                logging.error(f"Error de conexión: {str(e)}")
                sys.exit(1)
    logging.error("Error crítico: Se agotó la cuota de la API.")
    sys.exit(1)

def main():
    try:
        # 1. Conectar con Gemini
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            logging.error("No se encontró GEMINI_API_KEY en las variables de entorno.")
            sys.exit(1)
        cliente = genai.Client(api_key=api_key)

        # 2. Cargar base de datos
        nombre_archivo = 'data.json'
        datos_completos = cargar_base_datos(nombre_archivo)
        lista = datos_completos if isinstance(datos_completos, list) else datos_completos.get("newsArticles", [])
        titulos_existentes = [noticia.get("title", "") for noticia in lista[:5]]

        # 3. Instrucciones
        instrucciones = f"""
        Busca en internet la noticia más candente de hoy sobre farándula urbana dominicana.
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
          "seo_vortex_x": "Nombres Propios y Acción Principal en la primera línea. Titular de impacto.",
          "seo_vortex_tiktok_text": "Texto SBO exacto."
        }}
        """

        # 4. Generar noticia
        texto_limpio = generar_noticia(cliente, instrucciones)
        if texto_limpio.startswith("```json"):
            texto_limpio = texto_limpio.replace("```json\n", "").replace("```", "").strip()

        try:
            nueva_noticia = json.loads(texto_limpio)
            validate(instance=nueva_noticia, schema=noticia_schema)
        except (json.JSONDecodeError, ValidationError) as e:
            logging.error(f"Error crítico: La respuesta no es un JSON válido o está incompleta. {str(e)}")
            sys.exit(1)

        # 5. Inyectar noticia
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

        guardar_base_datos(nombre_archivo, datos_completos)
        logging.info("✅ ¡Éxito! Noticia validada, verificada contra duplicados e inyectada.")

    except Exception as error:
        logging.error(f"❌ ERROR GENERAL NO CONTROLADO: {str(error)}")
        sys.exit(1)

if __name__ == "__main__":
    main()











