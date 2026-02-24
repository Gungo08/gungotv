#!/usr/bin/env python3
import os
import sys
import json
import time
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from google import genai
from google.genai import types
from jsonschema import validate, ValidationError

# -------------------- Configuración de logging --------------------
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

# -------------------- Esquema JSON para validar el video --------------------
video_schema = {
    "type": "object",
    "properties": {
        "id": {"type": "integer"},
        "title": {"type": "string"},
        "platform": {"type": "string"},
        "videoUrl": {"type": "string"},
        "thumbnail": {"type": "string"},
        "description": {"type": "string"},
        "publishedAt": {"type": "string"},
        "category": {"type": "string"}
    },
    "required": ["title", "platform", "videoUrl", "thumbnail", "description", "category"]
}

# -------------------- Utilidades de archivo --------------------
def cargar_base_datos(nombre_archivo: str) -> Dict[str, Any]:
    if not os.path.exists(nombre_archivo):
        logging.warning(f"El archivo {nombre_archivo} no existe. Creando estructura inicial.")
        return {"viralVideos": [], "meta": {"lastUpdated": None}}
    try:
        with open(nombre_archivo, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        logging.error(f"El archivo {nombre_archivo} contiene JSON inválido. Respaldando y creando uno nuevo.")
        backup = f"{nombre_archivo}.bak.{int(time.time())}"
        os.rename(nombre_archivo, backup)
        logging.info(f"Respaldo creado: {backup}")
        return {"viralVideos": [], "meta": {"lastUpdated": None}}

def guardar_base_datos(nombre_archivo: str, datos: Dict[str, Any]) -> None:
    tmp = f"{nombre_archivo}.tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(datos, f, indent=2, ensure_ascii=False)
    os.replace(tmp, nombre_archivo)
    logging.info(f"Datos guardados en {nombre_archivo}")

# -------------------- Generación con backoff y manejo de cuota --------------------
def generar_con_gemini(cliente: genai.Client, prompt: str, max_intentos: int = 4) -> str:
    # Backoff exponencial con jitter (segundos)
    base = 20
    for intento in range(1, max_intentos + 1):
        try:
            logging.info(f"Solicitando generación a Gemini (intento {intento}/{max_intentos})...")
            respuesta = cliente.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    tools=[types.Tool(google_search=types.GoogleSearch())],
                    safety_settings=[
                        types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH", threshold="BLOCK_NONE"),
                        types.SafetySetting(category="HARM_CATEGORY_HARASSMENT", threshold="BLOCK_NONE"),
                        types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="BLOCK_NONE"),
                        types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="BLOCK_NONE"),
                    ],
                ),
            )
            if not respuesta or not getattr(respuesta, "text", None):
                raise RuntimeError("Respuesta vacía de Gemini")
            return respuesta.text
        except Exception as e:
            err = str(e).lower()
            if "429" in err or "quota" in err or "rate limit" in err:
                # Exponencial con jitter para reducir colisiones
                espera = base * (2 ** (intento - 1))
                jitter = int(espera * 0.2)
                espera_final = espera + (jitter if intento % 2 == 0 else -jitter)
                espera_final = max(5, espera_final)
                logging.warning(f"Límite detectado. Esperando {espera_final}s antes de reintentar (intento {intento}).")
                time.sleep(espera_final)
                continue
            logging.error(f"Error inesperado al llamar a Gemini: {e}")
            raise
    logging.error("Se agotaron los intentos por límite de cuota.")
    raise RuntimeError("Se agotaron los intentos por límite de cuota.")

# -------------------- Limpieza y parseo de la respuesta --------------------
def limpiar_y_parsear_texto(texto: str) -> Dict[str, Any]:
    texto = texto.strip()
    # Eliminar bloques de código si los hubiera
    if texto.startswith("```json"):
        texto = texto.replace("```json", "", 1).rstrip("`").strip()
    elif texto.startswith("```"):
        texto = texto.replace("```", "", 1).rstrip("`").strip()
    # A veces la IA añade comillas o texto extra; intentar parsear
    try:
        parsed = json.loads(texto)
        return parsed
    except json.JSONDecodeError:
        # Intentar localizar el primer "{" y el último "}" y parsear ese fragmento
        start = texto.find("{")
        end = texto.rfind("}")
        if start != -1 and end != -1 and end > start:
            fragment = texto[start:end+1]
            try:
                parsed = json.loads(fragment)
                return parsed
            except json.JSONDecodeError as e:
                logging.debug("Fallo al parsear fragmento JSON: %s", e)
        logging.debug("Texto crudo recibido (primeros 1000 chars): %s", texto[:1000])
        raise

# -------------------- Validación estricta con jsonschema --------------------
def validar_video(video: Dict[str, Any]) -> None:
    try:
        validate(instance=video, schema=video_schema)
    except ValidationError as e:
        raise ValueError(f"El JSON generado no cumple el esquema requerido: {e.message}")

# -------------------- Función principal --------------------
def main() -> None:
    nombre_archivo = "data.json"

    # 1) Leer API key
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        logging.error("No se encontró GEMINI_API_KEY en las variables de entorno.")
        sys.exit(1)

    # 2) Inicializar cliente
    try:
        cliente = genai.Client(api_key=api_key)
    except Exception as e:
        logging.error(f"No se pudo inicializar el cliente Gemini: {e}")
        sys.exit(1)

    # 3) Cargar base de datos
    datos_completos = cargar_base_datos(nombre_archivo)
    lista_videos = datos_completos.get("viralVideos", [])
    titulos_existentes = [v.get("title", "") for v in lista_videos[:10]]

    # 4) Preparar prompt (solo user prompt; evitar system_instruction en config si causa errores)
    fecha_hoy = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    user_prompt = f"""
Busca en internet el video MÁS VIRAL de HOY ({fecha_hoy}) en República Dominicana
sobre música, entretenimiento, béisbol o farándula (YouTube, TikTok o Instagram).

NO repitas títulos ya publicados: {titulos_existentes}

Devuelve EXCLUSIVAMENTE un JSON válido con este formato EXACTO:
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
Sin texto adicional, sin explicaciones, sin bloques de código.
"""

    # 5) Llamada a la API con reintentos y backoff
    try:
        texto_respuesta = generar_con_gemini(cliente, user_prompt)
    except Exception as e:
        logging.error(f"Fallo al generar contenido: {e}")
        sys.exit(1)

    # 6) Parsear y validar JSON
    try:
        nuevo_video = limpiar_y_parsear_texto(texto_respuesta)
    except Exception as e:
        logging.error(f"Respuesta inválida de Gemini: {e}")
        logging.debug("Respuesta cruda: %s", texto_respuesta[:2000])
        sys.exit(1)

    try:
        validar_video(nuevo_video)
    except ValueError as e:
        logging.error(str(e))
        logging.debug("Objeto parseado: %s", json.dumps(nuevo_video, ensure_ascii=False)[:2000])
        sys.exit(1)

    # 7) Completar campos automáticos y evitar duplicados por URL o título
    nuevo_video["id"] = int(time.time())
    nuevo_video["publishedAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # Evitar duplicados simples (por videoUrl o title)
    existing_urls = {v.get("videoUrl") for v in lista_videos if v.get("videoUrl")}
    existing_titles = {v.get("title") for v in lista_videos if v.get("title")}
    if nuevo_video.get("videoUrl") in existing_urls or nuevo_video.get("title") in existing_titles:
        logging.warning("El video generado ya existe en la base de datos. Abortando inserción.")
        sys.exit(0)

    # 8) Insertar y actualizar meta
    datos_completos.setdefault("viralVideos", [])
    datos_completos["viralVideos"].insert(0, nuevo_video)
    datos_completos.setdefault("meta", {})
    datos_completos["meta"]["lastUpdated"] = nuevo_video["publishedAt"]

    # 9) Guardar en disco
    try:
        guardar_base_datos(nombre_archivo, datos_completos)
    except Exception as e:
        logging.error(f"No se pudo guardar el archivo {nombre_archivo}: {e}")
        sys.exit(1)

    logging.info("✅ Éxito: Video viral de hoy inyectado correctamente.")
    sys.exit(0)

if __name__ == "__main__":
    main()




