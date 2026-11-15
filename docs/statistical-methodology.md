# Metodología Estadística y Científica: Earth System Trend Detective

Este documento describe formalmente los métodos matemáticos, estadísticos y de inferencia implementados en el proyecto para el NASA Space Apps Challenge 2026 ("Be An Earth System Trend Detective!").

---

## 1. Pipeline de Procesamiento de Datos

1. **Adquisición**: Se obtienen observaciones mensuales desde la API NASA POWER
   (producto/modelo dependiente del parámetro) o el proveedor sintético demo.
2. **Ponderación espacial**: Para áreas regionales (*Bounding Box*), cada celda de cuadrícula $\phi_i$ se pondera por el coseno de su latitud:
   $$w_i = \cos(\text{latitud}_i), \quad \bar{X}_m = \frac{\sum_i X_{m, i} \cdot w_i}{\sum_i w_i}$$
3. **Conversión temporal**:
   - Variables de estado promedio (ej. Temperatura $T2M$, Humedad $RH2M$, Radiación): se conserva el promedio mensual.
   - Variables acumulativas (ej. Precipitación $PRECTOTCORR$ en $\text{mm/día}$): se multiplican por los días calendario de cada mes:
     $$P_{\text{mes}} = P_{\text{diario}} \times \text{días}(mes, año)$$
4. **Tratamiento estacional**:
   - El análisis principal usa agregados anuales (`analysis_method=annual_values`).
     No usa anomalías: la etiqueta anterior `annual_anomalies` era incorrecta.
    - El análisis no calcula ni ajusta anomalías mensuales; el Seasonal
      Mann-Kendall opera como método complementario sobre la serie mensual.
5. **Agregación anual**:
   - El ajuste de tendencia usa únicamente años calendario con 12 meses válidos.
   - Los años incompletos se excluyen; no se rellenan ni extrapolan. La API
     advierte de la exclusión cuando hay meses faltantes.
   - Para variables de suma (precipitación), se suman los 12 totales mensuales.
     Para variables de media, se calcula un promedio ponderado por los días de
     cada mes, incluyendo 29 días en febrero de años bisiestos.

---

## 2. Inferencia y Pruebas Estadísticas

### 2.1. Regresión Lineal por Mínimos Cuadrados Ordinarios (OLS)

Para la serie anual $(t_i, y_i)$ con $i = 1, \dots, n$:
- **Pendiente ($\beta_1$) e Intercepto ($\beta_0$)**:
  $$\beta_1 = \frac{\sum_{i=1}^n (t_i - \bar{t})(y_i - \bar{y})}{\sum_{i=1}^n (t_i - \bar{t})^2}, \quad \beta_0 = \bar{y} - \beta_1 \bar{t}$$
- **Tasa de cambio decadal**:
  $$\Delta_{\text{década}} = 10 \times \beta_1$$
- **Error estándar de la pendiente**:
  $$\text{SE}(\beta_1) = \sqrt{\frac{\sum_{i=1}^n (y_i - \hat{y}_i)^2 / (n - 2)}{\sum_{i=1}^n (t_i - \bar{t})^2}}$$
- **Significancia bilateral ($t$-test)**:
  $$t = \frac{\beta_1}{\text{SE}(\beta_1)}, \quad p = 2 \cdot \left[1 - F_t(|t|, \text{df}=n-2)\right]$$
- **Intervalo de Confianza del 95% para la tasa decadal**:
  $$\text{CI}_{95\%} = \left[ 10 \cdot (\beta_1 - t_{n-2, 0.975} \cdot \text{SE}), \; 10 \cdot (\beta_1 + t_{n-2, 0.975} \cdot \text{SE}) \right]$$
- **Banda de confianza de la recta para cada fecha mensual $t$**:
  $$\text{SE}(\hat{y}(t)) = \text{SE}_{\text{res}} \sqrt{\frac{1}{n} + \frac{(t - \bar{t})^2}{\sum_{i=1}^n (t_i - \bar{t})^2}}$$
   $$\text{banda}(t) = \hat{y}(t) \pm t_{n-2, 0.975} \cdot \text{SE}(\hat{y}(t))$$

Los años del ajuste se representan por su año entero, anclado al centro del año.
La evaluación mensual usa $t = año + (mes-0.5)/12 - 0.5$, para evitar desplazar
la recta medio año. En variables acumulativas, la API conserva el ajuste a
totales anuales; la gráfica mensual divide recta y banda entre 12 y las etiqueta
como **equivalentes mensuales**. No son predicciones del ciclo estacional mensual.
Las tarjetas y exportaciones conservan las magnitudes anuales originales.
El zoom filtra solo la vista; no vuelve a calcular significancia.

### 2.2. Test no paramétrico de Mann-Kendall (con corrección de empates)

Evalúa la hipótesis nula de ausencia de tendencia monótona contra la alternativa de tendencia creciente o decreciente:
- **Estadístico $S$**:
  $$S = \sum_{k=1}^{n-1} \sum_{j=k+1}^n \text{sign}(y_j - y_k)$$
- **Varianza con corrección por empates ($t_g$)**:
  $$\text{Var}(S) = \frac{n(n - 1)(2n + 5) - \sum_{g} t_g(t_g - 1)(2t_g + 5)}{18}$$
- **Estadístico normalizado $Z$ con corrección por continuidad**:
  $$Z = \begin{cases} \frac{S - 1}{\sqrt{\text{Var}(S)}} & \text{si } S > 0 \\ 0 & \text{si } S = 0 \\ \frac{S + 1}{\sqrt{\text{Var}(S)}} & \text{si } S < 0 \end{cases}$$
- **Valor $p$ bilateral**: $p = 2 \cdot [1 - \Phi(|Z|)]$.
- **Tau de Kendall ($\tau$)**:
  $$\tau = \frac{S}{n(n - 1) / 2}$$

### 2.3. Pendiente de Theil-Sen (Sen’s Slope)

La tasa de cambio no paramétrica es la mediana de todas las pendientes posibles entre cada par de observaciones:
$$\beta_{\text{Sen}} = \text{mediana} \left\{ \frac{y_j - y_k}{t_j - t_k} : 1 \le k < j \le n \right\}$$
Se calcula el intervalo de confianza del 95% empírico mediante `scipy.stats.theilslopes`.

### 2.4. Seasonal Mann-Kendall (Hirsch et al., 1982)

Para datos mensuales, se calculan $S_m$ y $\text{Var}(S_m)$ de forma independiente para cada uno de los 12 meses calendario ($m = 1, \dots, 12$), sumando sus contribuciones:
$$S_{\text{total}} = \sum_{m=1}^{12} S_m, \quad \text{Var}(S_{\text{total}}) = \sum_{m=1}^{12} \text{Var}(S_m)$$
Permite verificar la tendencia sin verse afectado por el ciclo intra-anual estacional.

---

## 3. Diagnósticos y Advertencias Estadísticas Automáticas

La API y la UI analizan la validez de los supuestos estadísticos y emiten alertas automáticas:
1. **Tamaño de muestra ($n < 10$)**: Alerta que la prueba estadística tiene baja potencia y recomienda ampliar el periodo a $\ge 20$ años.
2. **Autocorrelación residual ($|r_1| > 0.30$)**: Calcula el coeficiente de autocorrelación de rezago 1 en los residuos de regresión:
   $$r_1 = \frac{\sum_{i=1}^{n-1} (e_i - \bar{e})(e_{i+1} - \bar{e})}{\sum_{i=1}^n (e_i - \bar{e})^2}$$
   Si $|r_1| > 0.30$, se advierte de incumplimiento de independencia. Una
   autocorrelación positiva puede producir p-values demasiado pequeños y
   exagerar la significancia. No se aplica corrección automática.
3. **Discordancia metodológica**: Si OLS resulta significativo pero Mann-Kendall no (o viceversa), notifica la discrepancia sugiriendo la presencia de anomalías extremas o no-linealidades.
4. **Varianza cero**: Detecta series constantes ($\sigma^2 = 0$) y devuelve `status: constant_series` sin generar `NaN`.

---

## 4. Validación Numérica

El script `scripts/verify_analysis.py` evalúa de forma cruzada nuestras funciones puras contra las bibliotecas científicas de referencia `scipy.stats` y `pymannkendall`, garantizando diferencias idénticas a cero o menores a $1 \times 10^{-6}$.
