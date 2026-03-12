# 🛡️ Política de Seguridad de Gungo

**Gungo** (Farándula y Noticias Latam) toma muy en serio la seguridad de su plataforma. Esta política describe cómo gestionamos vulnerabilidades y qué versiones mantenemos.

## Versiones soportadas con actualizaciones de seguridad

| Versión     | Soporte de seguridad | Notas |
|-------------|----------------------|-------|
| **2.x**     | ✅ Activo            | Versión actual (recomendada) |
| **1.x**     | ✅ Activo            | Mantenimiento crítico hasta junio 2026 |
| **0.x**     | ❌ No soportado      | Actualiza inmediatamente |
| < 1.0       | ❌ No soportado      | Fuera de soporte |

**Nota**: Solo las versiones marcadas con ✅ reciben parches de seguridad urgentes.

## Cómo reportar una vulnerabilidad

Si descubres una vulnerabilidad (XSS, inyección SQL, fuga de datos, etc.):

1. **NO abras un Issue público** (evitamos que sea explotada).
2. Envía un reporte privado a:  
   **seguridad@gungo.tv**  
   o usa el formulario seguro: https://gungo.tv/security-report

**Qué debes incluir**:
- Descripción clara del problema
- Pasos para reproducirlo
- Impacto estimado (CVSS si lo sabes)
- Versión afectada

### Tiempo de respuesta garantizado
- **Confirmación**: en 48 horas
- **Actualización**: cada 5 días hábiles
- **Parche**: en máximo 14 días (críticas en < 72 horas)

### Qué pasa después
- Si se acepta → parcheamos y te damos crédito público (si lo deseas).
- Si se declina → te explicamos por qué con detalle.
- Todas las vulnerabilidades confirmadas se publican en esta sección de GitHub Security y en nuestro changelog.

## Cómo protegemos Gungo automáticamente

Tu pipeline CI/CD (que ya tienes activado) escanea **cada PR y push** con:
- Semgrep (OWASP Top 10 2025)
- SonarQube (Quality Gate + NIST/PCI-DSS)
- TruffleHog (secrets)
- npm audit + pip-audit
- W3C + ESLint + Stylelint

Cualquier vulnerabilidad crítica **bloquea el merge** automáticamente.  
Eso significa que ya estamos aplicando las mejores prácticas de Google, Meta y Tesla directamente en tu proyecto.

## Créditos y agradecimientos
Todo investigador que reporte una vulnerabilidad válida recibirá mención pública en nuestro changelog y en la página de seguridad de Gungo.

---

**Última actualización**: 12 de marzo de 2026  
**Mantenedor responsable**: Equipo de Ciberseguridad Gungo

¡Gracias por ayudar a mantener Gungo seguro! 🚀
