import google.generativeai as genai   # Cliente oficial de Gemini
import requests                       # Para peticiones HTTP si las necesitas
import jsonschema                     # Para validar estructuras JSON
from dotenv import load_dotenv        # Para pruebas locales con archivo .env
import os                             # Para leer variables de entorno (incluye secretos de GitHub)
import json                           # Para manejar JSON en Python

# --- Configuración de entorno ---
# Si existe un archivo .env local, lo carga (útil para pruebas fuera de GitHub)
load_dotenv()

# Leer la API key desde variable de entorno (en GitHub Actions se pasa como secreto)
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("No se encontró la API key en el entorno. Asegúrate de definir GEMINI_API_KEY en GitHub Secrets.")

# Configurar Gemini con la API key
genai.configure(api_key=api_key)

# --- Función principal ---
def generar_idea_video():
    # Prompt: instruimos a Gemini para que responda en JSON
    prompt = """
    Genera una idea para un video viral en formato JSON con los siguientes campos:
    {
      "titulo": "...",
      "descripcion": "...",
      "hashtags": ["...", "..."]
    }
    """

    # Crear modelo y generar contenido
    model = genai.GenerativeModel("gemini-2.5-flash-lite")
    response = model.generate_content(prompt)

    # Obtener texto plano
    texto = response.text.strip()

    # Intentar parsear como JSON
    try:
        idea = json.loads(texto)
    except json.JSONDecodeError:
        # Si Gemini devuelve texto con explicaciones, extraemos el bloque JSON
        inicio = texto.find("{")
        fin = texto.rfind("}")
        if inicio != -1 and fin != -1:
            idea = json.loads(texto[inicio:fin+1])
        else:
            raise ValueError("La respuesta no contiene JSON válido")

    # Validar estructura con jsonschema (opcional)
    schema = {
        "type": "object",
        "properties": {
            "titulo": {"type": "string"},
            "descripcion": {"type": "string"},
            "hashtags": {"type": "array", "items": {"type": "string"}}
        },
        "required": ["titulo", "descripcion", "hashtags"]
    }
    jsonschema.validate(instance=idea, schema=schema)

    return idea

# --- Ejecución ---
if __name__ == "__main__":
    video_idea = generar_idea_video()
    print("Idea de video viral:")
    print(json.dumps(video_idea, indent=2, ensure_ascii=False))






