# 📊 PDR & Especificación Técnica: Integración Financiera ActivaQR → CRM Central

**Documento de Especificación de Integración para el Desarrollador del CRM de Finanzas**  
**Proyecto emisor:** ActivaQR (`registraya_vcard`)  
**Dominio Producción:** `https://activaqr.com`  
**Versión de Especificación:** 2.0 (Febrero 2026)  
**Estado:** ✅ **SISTEMA CONSTRUIDO Y LISTO PARA CONEXIÓN**  

---

## 🔑 1. Credenciales y Autenticación de Producción

Para consultar cualquier API de ActivaQR, debes enviar la API Key en el encabezado (Header) de la petición HTTP:

| Parámetro | Valor |
| :--- | :--- |
| **Header Name** | `x-crm-api-key` |
| **API Key de Producción** | `aqr-crm-fin-2026-x7k9m2p4q8r1` |
| **Base URL** | `https://activaqr.com` |

---

## 📑 2. Resumen de Integración y Flujo de Datos

La integración opera bajo dos modalidades complementarias:

1. **Push (Webhooks en Tiempo Real):** ActivaQR notificará a tu servidor automáticamente cada vez que ocurra un pago o registro.
2. **Pull (APIs REST):** Tu CRM puede consultar el listado de clientes, vendedores, transacciones e ingresos históricos en cualquier momento.

```
[ Cliente paga en ActivaQR ] ──► [ Push Webhook a tu CRM ] ──► [ Registra Ingreso ]
                             └──► [ GET /api/crm/transactions ] ──► [ Sincronización DB ]
```

---

## 🌐 3. Catálogo Completo de Endpoints API REST

Todos los endpoints requieren el encabezado `x-crm-api-key: aqr-crm-fin-2026-x7k9m2p4q8r1`.

### 1. Listar Transacciones / Historial de Ingresos Financieros
- **Endpoint:** `GET https://activaqr.com/api/crm/transactions`
- **Query Params:**
  - `status`: `pagado` | `pendiente` | `all` (default: `pagado`)
  - `from`: Fecha inicio (`YYYY-MM-DD`)
  - `to`: Fecha fin (`YYYY-MM-DD`)
  - `seller_id`: ID del vendedor
  - `limit`: Paginación (default: `100`)
  - `offset`: Desplazamiento (default: `0`)
- **Respuesta JSON:**
```json
{
  "success": true,
  "data": [
    {
      "transaction_id": "TX-AQR-c1f7a2d8",
      "project_code": "ACTIVAQR",
      "client": {
        "id": "c1f7a2d8-4b2e-41a2-901a-123456789abc",
        "slug": "dr-cesar-reyes",
        "nombre": "César Reyes",
        "email": "cesar@ejemplo.com"
      },
      "financials": {
        "plan": "PLAN_PRO",
        "monto_bruto": 49.99,
        "comision_vendedor_monto": 14.997,
        "comision_porcentaje": 30,
        "monto_neto_empresa": 34.993,
        "metodo_pago": "paypal",
        "estado_pago": "pagado",
        "paid_at": "2026-08-12T00:29:55.000Z"
      },
      "seller": {
        "id": "sel_007",
        "codigo": "007",
        "nombre": "Carlos Vendedor",
        "commission_status": "completed"
      }
    }
  ],
  "meta": {
    "total": 1,
    "limit": 100,
    "offset": 0,
    "has_more": false
  }
}
```

### 2. Listar Clientes (Con Filtros Avanzados)
- **Endpoint:** `GET https://activaqr.com/api/crm/clients`
- **Query Params:** `status=pagado|pendiente|all`, `plan`, `search`, `from`, `to`, `limit`, `offset`.

### 3. Obtener Clientes Pendientes de Pago
- **Endpoint:** `GET https://activaqr.com/api/crm/clients-pending`

### 4. Obtener Detalle de un Cliente Específico por ID
- **Endpoint:** `GET https://activaqr.com/api/crm/client/:id`

### 5. Red de Vendedores y Jerarquía
- **Endpoint:** `GET https://activaqr.com/api/crm/sellers?include_stats=1`

### 6. Catálogo de Productos y Planes
- **Endpoint:** `GET https://activaqr.com/api/crm/products`

---

## 🔔 4. Configuración del Webhook Push (Notificación en Tiempo Real)

Para recibir pagos e ingresos en tiempo real en tu CRM sin hacer polling:

1. Proporciónanos la **URL pública de tu Webhook** en tu servidor CRM (Ejemplo: `https://tu-crm-finanzas.com/api/webhooks/activaqr`).
2. Configuraremos esa URL en la variable `CRM_EXTERNAL_WEBHOOK_URL` de ActivaQR.
3. Cada vez que entre un pago confirmado vía PayPal, Crypto o Pasarela, ActivaQR enviará un `POST` con la siguiente estructura:

### Header enviado por ActivaQR
```http
POST /api/webhooks/activaqr HTTP/1.1
Host: tu-crm-finanzas.com
Content-Type: application/json
X-Source: ActivaQR
X-Event-Type: payment.succeeded
```

### Body JSON recibido en tu servidor:
```json
{
  "event": "payment.succeeded",
  "timestamp": "2026-08-12T00:30:00.000Z",
  "data": {
    "project_code": "ACTIVAQR",
    "transaction_reference": "PAYID-M12345678",
    "client": {
      "id": "c1f7a2d8-4b2e-41a2-901a-123456789abc",
      "slug": "dr-cesar-reyes",
      "nombre": "César Reyes",
      "nombre_negocio": "Consultoría Reyes & Asoc",
      "email": "cesar@ejemplo.com",
      "whatsapp": "+593991234567",
      "tipo_perfil": "profesional",
      "profesion": "Consultor de Negocios"
    },
    "order": {
      "plan": "PLAN_PRO",
      "status": "pagado",
      "metodo_pago": "paypal",
      "referencia_externa": "PAYID-M12345678",
      "paid_at": "2026-08-12T00:29:55Z",
      "created_at": "2026-08-12T00:20:00Z",
      "expires_at": "2027-08-12T00:29:55Z"
    },
    "attribution": {
      "seller_id": "sel_007",
      "seller_codigo": "007",
      "seller_nombre": "Carlos Vendedor",
      "comision_porcentaje": 30.00,
      "parent_seller_id": "sel_001",
      "lider_codigo": "001",
      "lider_nombre": "César Líder",
      "lider_comision_porcentaje": 50.00
    }
  }
}
```

---

## 🗄️ 5. Esquema de Tablas Recomendado para la BD del CRM

```sql
-- 1. Clientes Unificados
CREATE TABLE crm_clients (
    id VARCHAR(36) PRIMARY KEY,
    project_code VARCHAR(50) DEFAULT 'ACTIVAQR',
    nombre VARCHAR(255) NOT NULL,
    nombre_negocio VARCHAR(255),
    email VARCHAR(255),
    whatsapp VARCHAR(50),
    status ENUM('pendiente', 'pagado', 'cancelado') DEFAULT 'pendiente',
    seller_id VARCHAR(36),
    created_at DATETIME,
    paid_at DATETIME,
    expires_at DATETIME
);

-- 2. Transacciones Financieras
CREATE TABLE crm_transactions (
    id VARCHAR(64) PRIMARY KEY,
    project_code VARCHAR(50) DEFAULT 'ACTIVAQR',
    client_id VARCHAR(36) NOT NULL,
    plan VARCHAR(50) NOT NULL,
    monto_bruto DECIMAL(10,2) NOT NULL,
    monto_comision_vendedor DECIMAL(10,2) DEFAULT 0.00,
    monto_neto_empresa DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL,
    estado_pago VARCHAR(50) NOT NULL,
    paid_at DATETIME NOT NULL,
    FOREIGN KEY (client_id) REFERENCES crm_clients(id)
);

-- 3. Vendedores y Afiliados
CREATE TABLE crm_sellers (
    id VARCHAR(36) PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(50) DEFAULT 'seller',
    comision_porcentaje DECIMAL(5,2) DEFAULT 30.00,
    parent_id VARCHAR(36),
    banco_nombre VARCHAR(100),
    banco_numero_cuenta VARCHAR(100),
    banco_cedula VARCHAR(20)
);
```
