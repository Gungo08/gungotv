import json
import re

def limpiar_y_cargar_json(texto_sucio):
    """
    Extrae el objeto JSON de una cadena que contiene texto extra o 
    bloques de código Markdown (```json ... ```).
    """
    try:
        # Buscamos el contenido entre las primeras { y las últimas } 
        # El flag re.DOTALL permite que el punto (.) incluya saltos de línea
        match = re.search(r'(\{.*\})', texto_sucio, re.DOTALL)
        
        if match:
            json_str = match.group(1)
            # Cargamos el JSON extraído
            datos = json.loads(json_str)
            return datos
        else:
            print("❌ Error: No se encontró ningún bloque JSON en la respuesta.")
            return None
            
    except json.JSONDecodeError as e:
        print(f"❌ Error crítico de formato JSON: {e}")
        return None

def ejecutar_publicacion_vortex(datos):
    """
    Simula el envío a redes sociales aplicando tus reglas de SEO-VORTEX.
    """
    if not datos:
        return

    print("--- 🚀 INICIANDO AUTOMATIZACIÓN SEO-VORTEX ---")
    
    # 1. ESTRATEGIA X (TWITTER) - Indexación en tiempo real
    print(f"\n[X - Publicando]")
    print(f"Contenido: {datos.get('seo_vortex_x')}")

    # 2. ESTRATEGIA INSTAGRAM - Storytelling + Alt Text
    print(f"\n[Instagram - Publicando]")
    print(f"Caption: {datos.get('seo_vortex_ig')}")
    print(f"Alt Text Sugerido: {datos.get('altText')}")

    # 3. ESTRATEGIA TIKTOK - SBO (Search Bar Optimization)
    print(f"\n[TikTok - Publicando]")
    print(f"Texto en segundo 1: {datos.get('seo_vortex_tiktok_text')}")
    print(f"Nombre de archivo hack: {datos.get('seo_vortex_tiktok_filename')}")
    
    print("\n✅ Proceso completado con éxito.")

# --- SIMULACIÓN DEL ERROR QUE TUVISTE ---
texto_recibido_de_ia = """
Aquí tienes la noticia solicitada:
{ "name": "Agente Gungo", "role": "Redacción IA" }
media: { "type": "image", "count": 1 }
```json
{
  "id": 0,
  "slug": "la-dolorosa-eliminacion-del-escogido-en-la-serie-del-caribe-2026",
  "title": "¡Impacto en LIDOM! La Dolorosa Eliminación del Escogido en la Serie del Caribe 2026",
  "altText": "Ramón Santiago en rueda de prensa tras la eliminación.",
  "seo_vortex_x": "Leones del Escogido eliminados de la Serie del Caribe 2026: Ramón Santiago sin excusas.",
  "seo_vortex_ig": "La eliminación de los Leones del Escogido sigue siendo tema de debate... #LIDOM #Escogido",
  "seo_vortex_tiktok_text": "¡El Escogido fuera! Ramón Santiago rompe el silencio.",
  "seo_vortex_tiktok_filename": "escogido-eliminacion-serie-caribe-2026.mp4"
}





