#!/usr/bin/env python3
import os
import json
import sys
import errno
import google.generativeai as genai
import requests
import jsonschema
from dotenv import load_dotenv
from datetime import datetime

# --- Configuración de entorno ---
load_dotenv()  # útil para pruebas locales con .env

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("ERROR: No se encontró la API key en el entorno (GEMINI_API_KEY).", file=sys.stderr)
    sys.exit(1)

genai.configure(api_key=api_key)

# --- Esquema esperado para validar la respuesta ---
SCHEMA = {
    "type": "object",
    "properties": {
        "titulo": {"type": "string"},
        "descripcion": {"type": "string"},
        "hashtags": {"type": "array", "items": {"type": "string"}}
    },
    "required": ["titulo", "descripcion", "hashtags"]
}

# --- Funciones ---
def generar_idea_video():
    """
    Llama a Gemini para generar una idea de video en JSON y devuelve un dict validado.
    """
    prompt = """
Genera una idea para un video viral en formato JSON con los siguientes campos:
{
  "titulo": "Título corto y llamativo",
  "descripcion": "Descripción breve con gancho y llamada a la acción",
  "hashtags": ["#ejemplo", "#viral"]
}
Devuelve únicamente el objeto JSON sin explicaciones adicionales.
"""

    # Crear modelo y generar contenido
    model = genai.GenerativeModel("gemini-2.5-flash-lite")
    response = model.generate_content(prompt)

    # Obtener texto plano
    texto = getattr(response, "text", "") or str(response)
    texto = texto.strip()

    # Intentar parsear como JSON
    idea = None
    try:
        idea = json.loads(texto)
    except json.JSONDecodeError:
        inicio = texto.find("{")
        fin = texto.rfind("}")
        if inicio != -1 and fin != -1 and fin > inicio:
            try:
                idea = json.loads(texto[inicio:fin+1])
            except json.JSONDecodeError:
                pass

    if idea is None:
        raise ValueError("La respuesta del modelo no contiene JSON válido:\n" + texto)

    # Validar estructura con jsonschema
    jsonschema.validate(instance=idea, schema=SCHEMA)

    return idea

def ensure_dir(path):
    try:
        os.makedirs(path, exist_ok=True)
    except OSError as e:
        if e.errno != errno.EEXIST:
            raise

def save_idea(idea: dict, out_dir: str = "outputs"):
    """
    Guarda la idea en un archivo JSON con timestamp dentro de out_dir.
    Esto garantiza que el repo tenga cambios detectables por git.
    """
    ensure_dir(out_dir)
    timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    filename = f"video_idea_{timestamp}.json"
    path = os.path.join(out_dir, filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(idea, f, ensure_ascii=False, indent=2)
    return path

# --- Ejecución principal ---
def main():
    try:
        idea = generar_idea_video()
    except Exception as e:
        print("ERROR al generar la idea de video:", file=sys.stderr)
        print(str(e), file=sys.stderr)
        sys.exit(1)

    try:
        out_path = save_idea(idea, out_dir="outputs")
    except Exception as e:
        print("ERROR al guardar la idea de video:", file=sys.stderr)
        print(str(e), file=sys.stderr)
        sys.exit(1)

    # Imprimir ruta del archivo para que quede claro en los logs
    print("Idea de video viral generada y guardada en:", out_path)
    print(json.dumps(idea, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()







