import google.generativeai as genai   # Cliente oficial de Gemini
import requests                       # Para hacer peticiones HTTP
import jsonschema                     # Para validar estructuras JSON
from dotenv import load_dotenv        # Para cargar variables de entorno desde .env
import os                             # Para leer la API key desde el entorno
import json                           # Para manejar JSON en Python
genai.configure(api_key="TU_API_KEY")


def generar_noticia():
    # Prompt: instruimos a Gemini para que responda en JSON
    prompt = """
    Genera una noticia breve en formato JSON con los siguientes campos:
    {
      "titulo": "...",
      "resumen": "...",
      "fecha": "YYYY-MM-DD"
    }
    """

    # Llamada a la API SIN response_mime_type
    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=[{"role": "user", "parts": [{"text": prompt}]}]
    )

    # Obtenemos el texto plano
    texto = response.text.strip()

    # Intentamos parsear como JSON
    try:
        noticia = json.loads(texto)
    except json.JSONDecodeError:
        # Si Gemini devuelve texto con explicaciones, limpiamos
        # Aquí puedes aplicar regex o heurísticas para extraer el bloque JSON
        inicio = texto.find("{")
        fin = texto.rfind("}")
        if inicio != -1 and fin != -1:
            noticia = json.loads(texto[inicio:fin+1])
        else:
            raise ValueError("La respuesta no contiene JSON válido")

    return noticia

if __name__ == "__main__":
    noticia = generar_noticia()
    print("Noticia generada:")
    print(json.dumps(noticia, indent=2, ensure_ascii=False))













