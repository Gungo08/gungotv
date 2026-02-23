import json
import re

def limpiar_y_cargar_json(texto_sucio):
    try:
        # Busca el bloque de código entre las llaves { }
        match = re.search(r'(\{.*\})', texto_sucio, re.DOTALL | re.MULTILINE)
        
        if match:
            json_str = match.group(1)
            return json.loads(json_str.strip())
        else:
            print("❌ ERROR: No se detectó un formato JSON válido.")
            return None
    except json.JSONDecodeError as e:
        print(f"❌ ERROR DE SINTAXIS JSON: {e}")
        return None

def ejecutar_estrategia_vortex(datos):
    if not datos:
        return

    print("\n" + "="*50)
    print("🚀 AGENTE: PROCESANDO PUBLICACIÓN")
    print("="*50)

    print(f"\n🔹 [X-STRATEGY]:")
    print(f"Cuerpo: {datos.get('seo_vortex_x', 'N/A')}")

    print(f"\n🔹 [IG-STRATEGY]:")
    print(f"Caption: {datos.get('seo_vortex_ig', 'N/A')}")
    print(f"Alt Text (SEO): {datos.get('altText', 'N/A')}")

    print(f"\n🔹 [TIKTOK-STRATEGY]:")
    print(f"Texto Gancho: {datos.get('seo_vortex_tiktok_text', 'N/A')}")
    print(f"Archivo MP4: {datos.get('seo_vortex_tiktok_filename', 'N/A')}")
    
    print("\n✅ Publicación enviada con éxito.")

# --- BLOQUE DE DATOS ENTRANTE ---
# AQUÍ ESTABA EL ERROR: Asegúrate de que las tres comillas del final existan.
texto_recibido_de_ia = """
{ "name": "Agente Gungo", "role": "Redacción IA" }
media: { "type": "image", "count": 1 }

```json
{
  "id": 0,
  "slug": "eliminacion-escogido-serie-del-caribe-2026",
  "title": "¡Impacto en LIDOM! El Escogido queda fuera de la Serie del Caribe",
  "altText": "Ramón Santiago, mánager de los Leones del Escogido, asumiendo la derrota.",
  "seo_vortex_x": "Leones del Escogido eliminados de la Serie del Caribe 2026. Ramón Santiago sin excusas. #LIDOM",
  "seo_vortex_ig": "La eliminación de los Leones del Escogido sigue siendo tema de debate. ¿Qué falló? #LIDOM #SerieDelCaribe",
  "seo_vortex_tiktok_text": "¡El Escogido fuera! Ramón Santiago rompe el silencio.",
  "seo_vortex_tiktok_filename": "escogido-eliminacion-serie-caribe-2026.mp4"
}```







