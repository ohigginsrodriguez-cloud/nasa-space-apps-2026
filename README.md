# Earth System Trend Detective 🌍🔍

[![NASA Space Apps Challenge 2026](https://img.shields.io/badge/NASA_Space_Apps-2026-blue.svg)](https://www.spaceappschallenge.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](backend/)
[![React 19](https://img.shields.io/badge/react-19-61dafb.svg)](frontend/)
[![Pytest](https://img.shields.io/badge/tests-passing-brightgreen.svg)](tests/)

Herramienta científica e interactiva para el reto de la **NASA Space Apps Challenge 2026**: *"Be An Earth System Trend Detective!"*. Permite formular preguntas, seleccionar variables de misiones y modelos de la Tierra, adquirir series temporales para cualquier región del planeta, visualizar su evolución histórica y determinar cuantitativamente si los cambios observados son estadísticamente significativos.

**Contexto y cambios:** consulta [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md)
para retomar el proyecto, revisar decisiones, pruebas y pendientes.
NASA POWER regional admite rectángulos de **2° a 10° por eje**; para áreas
menores se puede seleccionar un punto.

---

## 🎯 Cumplimiento de Objetivos del Challenge

| Objetivo del Challenge | Estado | Implementación en este Repositorio |
| :--- | :---: | :--- |
| **1. Identificar variables de la Tierra** | 🟢 **100%** | Catálogo con 7 variables activas verificadas en NASA POWER (MERRA-2) y roadmap detallado para instrumentos satelitales (MODIS, GLDAS, SWOT, GPM, OMI). |
| **2. Definiciones sencillas y accesibles** | 🟢 **100%** | Glosario interactivo integrado en la UI y descripciones a nivel preparatoria para estudiantes y público general. |
| **3. Adquisición regional de datos** | 🟢 **100%** | 4 regiones predefinidas representativas, selector interactivo de coordenadas por punto y caja delimitadora (*Bounding Box*) con ponderación por latitud. |
| **4. Visualización de series temporales** | 🟢 **100%** | Gráficas compuestas en Recharts mostrando la serie mensual, la recta de tendencia estimada y la banda de confianza al 95%. |
| **5. Análisis estadístico: Tasa de cambio** | 🟢 **100%** | Cálculo de la tasa decadal ($\beta_1 \times 10$) y la pendiente mediana de Theil-Sen. |
| **6. Pruebas de significancia (t-test / MK)** | 🟢 **100%** | Doble prueba de significancia: $t$-test sobre regresión OLS y Test de Mann-Kendall con corrección por empates y continuidad ($\alpha = 0,05$). |
| **7. Intervalos de confianza** | 🟢 **100%** | Intervalo de confianza analítico del 95% para la tasa decadal y bandas de incertidumbre sobre la recta de regresión. |
| **8. Desestacionalización** | 🟢 **100%** | Climatología mensual, serie de anomalías y agregación anual tolerante ($\ge 9$ meses) para no perder años incompletos. |
| **9. "Detective de Datos" guiado** | 🟢 **100%** | Asistente en 3 pasos que orienta al usuario según fenómeno, ecosistema y profundidad temporal. |
| **10. Ejemplos demostrativos** | 🟢 **100%** | 3 casos de estudio de largo plazo ($\ge 20$ años) listos con 1 clic, incluyendo el caso de tendencias opuestas contrastantes. |
| **11. Detección de tendencias opuestas** | 🟢 **100%** | Modo de comparación bi-regional con detección automática de pendientes contrastantes ante un mismo proceso global. |

---

## 🧪 Hallazgo Científico: Tendencias Opuestas Reales con Datos de NASA

Uno de los puntos clave del reto es evidenciar cómo un mismo proceso impulsa tendencias en direcciones opuestas según la región:
- **Área Metropolitana de Nueva York**: Precipitación acumulada con tendencia al aumento (**$+72.30 \text{ mm/década}$**, $p = 0.050$, significativa).
- **Cuenca del Amazonas**: Precipitación acumulada con tendencia a la disminución/secamiento (**$-102.14 \text{ mm/década}$**, $p = 0.071$, reducción de $-10.2 \text{ mm/año}$).

*Ambos comportamientos son detectados y contrastados automáticamente por el modo de comparación de la herramienta.*

---

## 🚀 Inicio Rápido

### Requisitos previos
- Python 3.10 o superior
- Node.js ^22.12.0 o >=24.0.0 y npm

### 1. Backend (FastAPI)
```bash
# Crear entorno virtual e instalar dependencias
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
pip install pymannkendall

# Ejecutar el servidor backend
export PYTHONPATH=backend
uvicorn app.main:app --reload --port 8000
```
La documentación Swagger interactiva queda disponible en: `http://localhost:8000/docs`.

### 2. Frontend (React + TypeScript + Vite + TailwindCSS)
```bash
cd frontend
npm install
npm run dev
```
La aplicación web se abrirá en `http://localhost:5173`.

---

## 🔬 Validación Científica y Tests

Para ejecutar la suite completa de pruebas unitarias y de integración:
```bash
# Ejecutar tests de backend
.venv/bin/pytest

# Ejecutar benchmark de validación numérica contra scipy y pymannkendall
.venv/bin/python scripts/verify_analysis.py

# Verificar compilación estricta de TypeScript y build del frontend
npm --prefix frontend test
npm --prefix frontend run build
```

---

## 📊 Variables Científicas Activas

| ID | Variable | Fuente / Instrumento | Unidades | Agregación |
| :--- | :--- | :--- | :---: | :---: |
| `temperature` | Temperatura del aire (2 m) | NASA POWER / MERRA-2 (`T2M`) | °C | Promedio |
| `precipitation` | Precipitación acumulada | NASA POWER / MERRA-2 (`PRECTOTCORR`) | mm | Suma |
| `soil_moisture` | Humedad de suelo (raíz) | NASA POWER Land Assimilation (`GWETROOT`) | fracción | Promedio |
| `relative_humidity` | Humedad relativa (2 m) | NASA POWER / MERRA-2 (`RH2M`) | % | Promedio |
| `solar_radiation` | Radiación solar en superficie | NASA POWER Solar (`ALLSKY_SFC_SW_DWN`) | kW·h/m²/día | Promedio |
| `surface_pressure` | Presión en superficie | NASA POWER / MERRA-2 (`PS`) | kPa | Promedio |
| `wind_speed` | Velocidad del viento (10 m) | NASA POWER / MERRA-2 (`WS10M`) | m/s | Promedio |

---

## 🛰️ Roadmap Satelital (Earthdata Login)

Para instrumentos satelitales avanzados que requieren autenticación Bearer Token mediante NASA Earthdata Login:
- **MODIS NDVI (`MOD13C2`)**: Vía AppEEARS API / LP DAAC.
- **GLDAS Evapotranspiración**: Vía GES DISC OPeNDAP.
- **SWOT**: Elevación de aguas superficiales y lagos vía PO.DAAC Cloud.
- **GPM IMERG**: Precipitación satelital global de alta resolución.

Consulta los detalles en [`docs/statistical-methodology.md`](docs/statistical-methodology.md) y [`docs/variable-catalog.md`](docs/variable-catalog.md).
