# ActivaQR Technical Backlog

> [!IMPORTANT]
> **[CONSULTAR FABLE PROTOCOL](.agent/skills/fable-protocol/SKILL.md)** — Punto 0 obligatorio antes de cualquier tarea no-trivial.
> **[CONSULTAR SKILL MADRE (MASTER CORTEX)](file:///c:/Users/Cesar/Documents/GRUPO%20EMPRESARIAL%20REYES/PROYECTOS/Contacto-QR/.agent/skills/master-cortex/SKILL.md)** antes de modificar lógica de negocio.


## 🚀 Sesión 4 Mayo 2026 — Reingeniería de Seguridad y Bridge

### ✅ Completado

#### 🔥 Seguridad
- [x] 3 claves hardcodeadas eliminadas (Bunny, Evolution, Bridge)
- [x] Auth unificada en 7 endpoints (`requireAdmin`, `requireCron`)
- [x] Password de vendedores hasheados con scrypt + salt
- [x] Sesión de vendedores con token HMAC-SHA256 (24h expiración)
- [x] `lib/auth.ts` reforzada: `hashPassword`, `generateSellerToken`, `requireSellerAuth`
- [x] Login de vendedor: verifica hash + retorna token
- [x] `GET /api/seller/me` protegido por token
- [x] Dashboard de vendedor: token en localStorage, `MOCK_SELLER` eliminado
- [x] `console.log` con datos sensibles limpiados (4 archivos)
- [x] Bridge: fallback hardcodeado `activaqr_bridge_secret_2026` eliminado en ambos proyectos

#### 🏗️ Arquitectura
- [x] 40 archivos temporales movidos de raíz → `/tmp/`
- [x] Plantillas Hedkandi movidas de `/hedkandi/` a `/demo/hedkandi/` y `/demo/hedkandi-hype/`
- [x] Templates Industrial y Carrocerias conectados al switch de `VCardClient.tsx`
- [x] `TemplatePreviewModal` actualizado con rutas nuevas bajo `/demo/`

#### 🔗 Bridge Contacto-QR ↔ ActivaQR2
- [x] Bridge funcional: HMAC-SHA256 verificado y probado
- [x] Payload completo: password, companyName, plan mapeado, monthlyPrice
- [x] Mapeo de planes: digital→solo, business→empresa_10, catalogo→empresa_50
- [x] Fallback `targetUrl` corregido a `localhost` para desarrollo
- [x] Endpoint ActivaQR2 corregido por Antigravity (columnas inexistentes)

#### 🖼️ Slides y Landing Pages
- [x] 20 slides (4 por plan) optimizados a WebP en `/public/images/slides/`
- [x] `contacto-digital-v2`: actualizado con `digital_s1..s4_final.webp`
- [x] `contacto-business-catalogo-v2`: actualizado con `catalogo_s1..s4_final.webp`
- [x] `sitio-web-completo-v2`: actualizado con `imperio_s1..s4_final.webp` (reemplaza Unsplash)
- [x] `auditoria-operativa`: actualizado con `auditoria_s1..s4_final.webp`
- [x] Opacidad del slider corregida de `0.65` a `1`
- [x] Tiempo de transición: 8s (era 5s/4s)
- [x] Dots de navegación agregados
- [x] Botón "SOLICITAR ASESORÍA" verde para TODOS los planes

---

## 🚀 Active Phase: Modernización Landing Contacto Digital

### UI/UX (Frontend Expert)
- [x] Hero: Estandarización de proporciones (min-h-screen, padding).
- [x] Hero: Corrección de capitalización (Sentence Case).
- [x] Hero: Cambio de Badge a "Identidad Digital • vCard 3.0".
- [x] Identidad: Rediseño completo con tarjetas de beneficio y brillo.
- [ ] SEO: Verificación de meta-tags y OG Image.

### Estrategia (Commercial Steerer)
- [x] ADN v3: Integrado en el Córtex.
- [ ] Tabla comparativa: Costo de un cliente perdido vs. $35/año.
- [ ] FAQ: Integrar lógica de "Reseñas en Esteroides".

### Próximos Pasos Técnicos
- [ ] Implementar validación de correos únicos en el registro (actualmente acepta repetidos de forma temporal).
- [ ] Limpiar código muerto en `PlanContactoDigitalClient.tsx` resultante de iteraciones fallidas.
- [ ] Optimizar pesos de imágenes en `/images/Reingenierìa/`.
- [ ] Pendiente: generar 5ª imagen de Auditoría (Flotas comparte con Educación).

---

## 🆕 Sesión 22 Mayo 2026 — Módulo de Contrato y Onboarding

### ✅ Completado
- [x] Tabla `contratos` con metadatos forenses (IP, geolocalización, fingerprint)
- [x] API: `POST /api/contratos/generar` — genera UUID + link
- [x] API: `GET /api/contratos/[uuid]` — obtiene datos del contrato
- [x] API: `PATCH /api/contratos/[uuid]` — auto-save del formulario
- [x] API: `POST /api/contratos/[uuid]/firmar` — firma con snapshot inmutable + hash SHA-256 + registro en consentimientos
- [x] Página: `app/contrato/[uuid]/page.tsx` con validación de UUID
- [x] Componentes: StepIndicator, DatosForm, DatosFacturacion (acordeón), ContratoDinamico, SubidaMateriales, FirmaSection
- [x] Utilidades: validación cédula/RUC Ecuador (Módulo 10), hash SHA-256, fingerprint, geolocalización
- [x] Skill de documentación: `.agent/skills/contrato-onboarding/SKILL.md`
- [x] Notas para Cheche: `.agent/skills/contrato-onboarding/CHECHE_NOTES.md`
- [x] `AGENTS.md` actualizado con nuevo skill
- [x] Multi-producto: checkboxes en lugar de selector único, auto-cálculo de total
- [x] Contrato redactado con César Augusto Reyes Jaramillo (C.I. 1103421531001) como proveedor
- [x] Contrato: cláusula de autogestión (clave de edición), vigencia 1 año, firmado en Loja
- [x] Compilación TypeScript: 0 errores

### 🔲 Pendiente para próxima sesión
- [ ] Interfaz admin para generar contratos (formulario + botón "Generar link")
- [ ] Envío de email automático al cliente con copia del contrato
- [ ] Sección "Contratos" en el panel admin (listar, filtrar, cambiar estado de pago)
- [ ] Texto final de términos redactado por Cheche (reemplazar template en `lib/contrato-utils.ts`)
