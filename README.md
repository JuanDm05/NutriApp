# NutriSMAE — Sistema Profesional de Nutrición Clínica

Aplicación web profesional que sustituye el Excel del Sistema Mexicano de Alimentos Equivalentes (SMAE), optimizada para uso en consulta nutricional.

## Instalación y ejecución

### 1. Instalar Python (3.9+)
Asegúrate de tener Python instalado: https://python.org

### 2. Instalar dependencias
```bash
pip install flask
```

### 3. Ejecutar la aplicación
```bash
python app.py
```

### 4. Abrir en el navegador
```
http://localhost:5000
```

## Funcionalidades

- **Módulo de Pacientes** — Registro, listado y selección de pacientes (SQLite)
- **Calculadora TMB** — Mifflin-St Jeor con 5 niveles de actividad
- **Calorías Inteligentes** — Mantenimiento, volumen ligero/moderado, definición ligera/moderada
- **Macros Personalizables** — Proteína y grasa en g/kg; CHO calculado automáticamente
- **Sistema SMAE** — 12 grupos de alimentos con equivalentes editables
- **Distribución por Comidas** — Asigna equivalentes a Desayuno, Colación AM, Comida, Colación PM, Cena
- **Comparación Objetivo vs SMAE** — % de adecuación con barras visuales
- **Modo Oscuro** — Toggle dark/light con preferencia guardada
- **Diseño Responsive** — Funciona en móvil y escritorio

## Estructura del proyecto
```
nutriapp/
├── app.py              # Backend Flask + SQLite
├── requirements.txt    # Dependencias
├── templates/
│   └── index.html      # Interfaz principal
└── static/
    ├── css/
    │   └── style.css   # Estilos premium
    └── js/
        └── app.js      # Lógica del frontend
```
