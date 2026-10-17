# Design System & Brand Guidelines
**Marca:** Electrónica & Más EIRL  
**Versión:** 1.0.0  
**Ámbito:** Web, Mobile App (iOS / Android) y Dashboard Administrativo  

---

## 1. Identidad Visual y Logotipo

### 1.1 Elementos del Logo
* **Isotipo (Símbolo):** Esfera con degradado verde azulado atravesada por una onda sinusoidal blanca y una línea horizontal de referencia de señal. Representa electrónica, osciloscopios, señal alterna y precisión técnica.
* **Logotipo (Texto):** Tipografía sin serifa redondeada.
  * La letra inicial **"e"** se destaca en círculo/tono rojo de acento.
  * El texto base **"electrónica"** en blanco con contorno/sombra suave.
  * Leyenda inferior **"& Más EIRL"** alineada a la derecha en tipografía condensada.

### 1.2 Variantes de Uso
1. **Principal (Full Color / Fondo Verde):** Uso prioritario en banners, encabezados de apps y splash screens.
2. **Horizontal (Navbar / Header):** Isotipo a la izquierda y denominación a la derecha en una sola línea horizontal.
3. **Isotipo Aislado (Icon Only):** Esfera con onda sinusoidal utilizada para:
   * Favicon web (16x16, 32x32, 48x48 px).
   * App Icon para Google Play Store y Apple App Store.
   * Avatar oficial en perfiles sociales y badges de estado.
4. **Versión Monocromática / Negativa:** Para aplicaciones en fondos oscuros neutros (`#1F2926`) o documentos impresos en escala de grises.

### 1.3 Área de Reserva y Tamaño Mínimo
* **Margen de seguridad:** Equivalente a la mitad del alto de la esfera ($X/2$) en todos los extremos.
* **Tamaño mínimo digital:** 
  * Logo completo: ancho mínimo de $140\text{ px}$.
  * Isotipo: $24\times24\text{ px}$ (web favicon / status bar).

---

## 2. Paleta de Colores (Design Tokens)

### 2.1 Colores Principales de Marca

| Token CSS / Flutter | Nombre | HEX | RGB | Uso Recomendado |
| :--- | :--- | :--- | :--- | :--- |
| `--color-primary` | Verde Principal | `#0D6950` | `rgb(13, 105, 80)` | Barras de navegación, encabezados, estados activos |
| `--color-primary-dark`| Verde Oscuro / Hover | `#0B533E` | `rgb(11, 83, 62)` | Hover de botones verdes, footers, contrastes |
| `--color-accent` | Rojo Acento | `#A8262B` | `rgb(168, 38, 43)` | Botones de compra (CTA principal), alertas, badges |
| `--color-accent-hover`| Rojo Hover | `#8A1E22` | `rgb(138, 30, 34)` | Estado hover y active de botones de acento |

### 2.2 Colores Neutros y de Soporte

| Token CSS | Nombre | HEX | RGB | Uso Recomendado |
| :--- | :--- | :--- | :--- | :--- |
| `--color-text-primary` | Gris Oscuro Técnico | `#1F2926` | `rgb(31, 41, 38)` | Tipografía principal, títulos en fondo claro |
| `--color-text-secondary`| Gris Neutro Medio | `#78909C` | `rgb(120, 144, 156)` | Subtítulos, labels secundarios, bordes inactivos |
| `--color-bg-app` | Blanco Nieve / Fondo | `#F4F6F6` | `rgb(244, 246, 246)` | Fondo del dashboard y paneles de administración |
| `--color-surface` | Blanco Puro | `#FFFFFF` | `rgb(255, 255, 255)` | Tarjetas, modales, campos de formulario |
| `--color-border` | Borde Estándar | `#E0E6E4` | `rgb(224, 230, 228)` | Separadores y contornos de inputs |

### 2.3 Variables CSS Listas para Integrar
```css
:root {
  /* Brand */
  --brand-green-primary: #0D6950;
  --brand-green-dark: #0B533E;
  --brand-red-accent: #A8262B;
  --brand-red-hover: #8A1E22;

  /* Neutrals */
  --neutral-dark: #1F2926;
  --neutral-gray: #78909C;
  --neutral-light-bg: #F4F6F6;
  --neutral-card-bg: #FFFFFF;
  --neutral-border: #E0E6E4;

  /* Feedback */
  --status-success: #0D6950;
  --status-error: #A8262B;
  --status-warning: #E29528;
  --status-info: #2B7A9B;
}
```

---

## 3. Tipografía

* **Familia Primaria:** `Montserrat` (Alternativa web: `Inter` o sistema `sans-serif`)
* **Familia Secundaria (Datos / Monospace):** `JetBrains Mono` o `Roboto Mono` (para valores de sensores, voltajes, seriales y métricas de dashboard).

### 3.1 Escala Tipográfica (Desktop & Mobile)

| Nivel | Peso | Tamaño Desktop | Tamaño Mobile | Line Height | Uso |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **H1** | Bold (700) | $32\text{ px}$ | $26\text{ px}$ | $1.2$ | Títulos principales de sección |
| **H2** | SemiBold (600) | $24\text{ px}$ | $20\text{ px}$ | $1.3$ | Encabezados de tarjetas, paneles |
| **H3** | Medium (500) | $18\text{ px}$ | $16\text{ px}$ | $1.4$ | Subtítulos de módulo |
| **Body Large** | Regular (400) | $16\text{ px}$ | $15\text{ px}$ | $1.5$ | Párrafos introductorios |
| **Body Regular**| Regular (400) | $14\text{ px}$ | $14\text{ px}$ | $1.5$ | Texto general de lectura, tablas |
| **Caption** | Light (300) / Regular | $12\text{ px}$ | $11\text{ px}$ | $1.4$ | Notas al pie, labels de sensores |

---

## 4. Recursos Gráficos y Elementos de Soporte

### 4.1 La Onda Sinusoidal (Graphic Device)
* Se utiliza como textura o marca de agua sutil (opacidad entre $5\%$ y $12\%$) en encabezados de tarjetas métricas, pantallas de carga o banners promocionales.
* Representa frecuencia, oscilación y actividad constante del hardware/software.

### 4.2 Iconografía
* **Estilo:** Lineal (outline), grosor de trazo uniforme de $2\text{ px}$, terminaciones redondeadas (`stroke-linecap: round`).
* **Temática:** 
  * Electrónica y hardware: chips, placas, ondas de señal, antenas de conectividad, engranajes.
  * Operaciones: gráficos ascendentes, carritos de compras, perfiles de usuario y notificaciones.
* **Colores de iconos:** `#0D6950` para navegación activa, `#78909C` para inactiva, y `#A8262B` para alertas o insignias pendientes.

---

## 5. Componentes de Interfaz (UI Components)

### 5.1 Botones

* **Botón Primario (Verde Corporativo):**
  * Fondo: `#0D6950`
  * Texto: `#FFFFFF`
  * Hover: `#0B533E`
  * Radio de borde (`border-radius`): $8\text{ px}$
  * Uso: Acciones estándar de avance, confirmación y guardado.

* **Botón Call to Action / Destacado (Rojo Acento):**
  * Fondo: `#A8262B`
  * Texto: `#FFFFFF`
  * Hover: `#8A1E22`
  * Radio de borde: $8\text{ px}$
  * Uso: Comprar ahora, Realizar pedido, Descargar reporte crítico.

* **Botón Fantasma / Outline:**
  * Borde: $1.5\text{ px}$ sólido `#0D6950`
  * Fondo: Transparente
  * Texto: `#0D6950`
  * Hover: Fondo `#0D6950` con texto `#FFFFFF`
  * Uso: Acciones secundarias (Cancelar, Filtrar, Ver detalles).

### 5.2 Tarjetas y Contenedores (Dashboard Cards)
* Fondo: `#FFFFFF`
* Radio de borde: $12\text{ px}$
* Sombra (`box-shadow`): `0px 4px 16px rgba(31, 41, 38, 0.06)`
* Borde exterior: $1\text{ px}$ sólido `#E0E6E4`
* Encabezado de métrica: Número principal en peso Bold ($24\text{ px}$) acompañado de un indicador circular o gráfico de línea en verde `#0D6950`.

### 5.3 Campos de Formulario (Inputs)
* Fondo: `#FFFFFF`
* Altura: $44\text{ px}$ (web) / $48\text{ px}$ (mobile para touch target óptimo).
* Borde por defecto: $1\text{ px}$ sólido `#E0E6E4`
* Borde en foco (`focus`): $2\text{ px}$ sólido `#0D6950`
* Radio de borde: $8\text{ px}$

---

## 6. Reglas de Accesibilidad y Buenas Prácticas

1. **Contraste de Color (WCAG AA):**
   * Texto `#FFFFFF` sobre fondo verde `#0D6950`: Contraste de $4.8:1$ (Aprobado).
   * Texto `#FFFFFF` sobre fondo rojo `#A8262B`: Contraste de $5.2:1$ (Aprobado).
   * No utilizar el rojo `#A8262B` para bloques largos de texto; reservarlo estrictamente para elementos interactivos y palabras clave.
2. **Espaciado y Retícula:**
   * Basado en múltiplos de $8\text{ px}$ ($8\text{ px}, 16\text{ px}, 24\text{ px}, 32\text{ px}, 48\text{ px}$).
3. **Consistencia en Plataformas:**
   * En la **App Móvil**, mantener la barra inferior de navegación en fondo `#FFFFFF` con iconos activos en `#0D6950`.
   * En el **Dashboard Web**, usar sidebar lateral fija en tono neutro oscuro `#1F2926` o verde `#0B533E` para máxima jerarquía visual.