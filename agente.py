import os
import json
from datetime import datetime
import google.generativeai as genai

# 1. Configurar la llave secreta de Gemini
genai.configure(api_key=os.environ["GEMINI_API_KEY"])

# Usar el modelo pro para una redacción de alta calidad
modelo = genai.GenerativeModel('gemini-2.5-pro')

# 2. Las instrucciones exactas para el periodista de IA
instrucciones = """
Actúa como un periodista experto en farándula, entretenimiento y cultura pop. 
Escribe una noticia corta sobre el evento más comentado de hoy.

Debes entregar la respuesta estrictamente con esta estructura:
{
  "titulo": "Titular de la noticia web",
  "contenido": "Párrafo principal para la página web",
  "instagram_copy": "Storytelling natural que integre quién, qué y dónde. Máximo 3 hashtags al final. Incluye también el Alt Text sugerido para la imagen.",
  "tiktok_sbo": "Texto exacto para colocar sobre el video en el segundo 1. Incluye también una sugerencia de cómo nombrar el archivo .mp4.",
  "x_twitter": "Titular de Impacto. La primera línea debe tener los Nombres Propios y la Acción Principal."
}
"""

# 3. Pedir a Gemini que genere el contenido forzando el formato JSON
respuesta = modelo.generate_content(
    instrucciones,
    generation_config={"response_mime_type": "application/json"}
)

# Convertir la respuesta de la IA a datos que Python pueda entender
nueva_noticia = json.loads(respuesta.text)

# Añadir la fecha y hora de la publicación automáticamente
nueva_noticia["fecha"] = datetime.now().strftime("%Y-%m-%d %H:%M")

# 4. Leer el archivo de tu repositorio
nombre_archivo = 'data.json'

try:
    with open(nombre_archivo, 'r', encoding='utf-8') as archivo:
        noticias = json.load(archivo)
except (FileNotFoundError, json.JSONDecodeError):
    # Si el archivo no existe o está vacío, crea una lista desde cero
    noticias = []

# 5. Poner la nueva noticia de primerita en la lista
noticias.insert(0, nueva_noticia)

# 6. Guardar los cambios en el archivo noticias.json
with open(nombre_archivo, 'w', encoding='utf-8') as archivo:
    json.dump(noticias, archivo, indent=4, ensure_ascii=False)


print("¡Noticia de Gungo generada y guardada en el JSON con éxito!")
