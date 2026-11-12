# Evaluación de Personalidad Big Five (BFI-44)
### Web App 100% Gratuita · Base de Datos en Supabase · Reporte en PDF

---

## 📋 Resumen de la Solución

Esta aplicación web automatizada permite:
1. Realizar el test oficial **Big Five Inventory (BFI-44)** con cálculo e inversión de ítems automática.
2. Generar el reporte interactivo con gráfico de radar y permitir al usuario **descargar su PDF** con un clic.
3. Guardar todas las respuestas automáticamente en una **base de datos PostgreSQL gratuita en Supabase**.
4. Alojar la aplicación **gratis y sin límite de tiempo** en Netlify, Vercel o GitHub Pages.

---

## 🗄️ PARTE 1: Configurar Supabase (100% Gratis)

### Paso 1: Crear proyecto en Supabase
1. Ingresa a [supabase.com](https://supabase.com) y crea una cuenta gratuita (con GitHub o email).
2. Haz clic en **"New Project"**.
3. Elige un nombre (ej. `test-big5`), define una contraseña para la base de datos y selecciona una región cercana. Haz clic en **Create new project**.

### Paso 2: Crear la tabla con el script SQL
1. En el menú lateral izquierdo de tu proyecto Supabase, entra a **"SQL Editor"** (icono de terminal `>_`).
2. Haz clic en **"New Query"**.
3. Abre el archivo [`supabase.sql`](supabase.sql) de esta carpeta, copia todo su contenido, pégalo en el editor y pulsa el botón **"Run"**.
   - *Esto creará la tabla `big5_responses` con todos los campos (nombre, correo, puntajes de cada rasgo, porcentajes y las 44 respuestas en formato JSON) y configurará los permisos seguros para que los usuarios puedan guardar sus respuestas.*

### Paso 3: Obtener tus credenciales
1. En el menú lateral de Supabase, ve a **Project Settings** (icono de engranaje ⚙️) > **API**.
2. Copia estos dos valores:
   - **Project URL** (ejemplo: `https://xyzabcdefghijklm.supabase.co`)
   - **Project API Keys** -> Clave **`anon` `public`** (empieza por `eyJhbGciOi...`).

### Paso 4: Conectar la aplicación
Tienes dos opciones muy sencillas:
- **Opción A (Recomendada antes de subir a la web):** Abre el archivo [`config.js`](config.js) y pega tu `supabaseUrl` y tu `supabaseAnonKey`.
- **Opción B:** Abre la web en tu navegador, pulsa el botón superior **"Base de Datos / Supabase"**, pega los valores y haz clic en Guardar.

---

## 🚀 PARTE 2: Subir la web gratis (Netlify, GitHub Pages o Vercel)

Elige la opción que te resulte más cómoda:

### Opción A: Netlify Drop (La más rápida y sin código - 30 segundos)
1. Ve a [app.netlify.com/drop](https://app.netlify.com/drop) (inicia sesión gratis).
2. Arrastra y suelta la carpeta entera `big5-app` sobre la ventana del navegador.
3. ¡Listo! En 5 segundos Netlify te dará un enlace público HTTPS (ej. `https://mi-test-big5.netlify.app`) para compartir con quien quieras.

---

### Opción B: GitHub Pages (Ideal si usas GitHub)
1. Crea un repositorio público en [github.com](https://github.com).
2. Sube los archivos de la carpeta `big5-app`:
   ```bash
   cd ~/.gemini/antigravity/scratch/big5-app
   git init
   git add .
   git commit -m "Test Big Five inicial"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   git push -u origin main
   ```
3. En tu repositorio de GitHub, ve a **Settings** > **Pages**.
4. En **Branch**, selecciona `main` y la carpeta `/(root)`. Haz clic en **Save**.
5. En 1 minuto tu web estará activa en `https://TU_USUARIO.github.io/TU_REPOSITORIO/`.

---

### Opción C: Vercel
1. Ve a [vercel.com](https://vercel.com) e inicia sesión con GitHub.
2. Haz clic en **"Add New..." > "Project"** e importa el repositorio de GitHub donde subiste el proyecto.
3. Haz clic en **"Deploy"**. Vercel compilará y publicará tu web con certificado SSL gratuito al instante.

---

## 📊 ¿Cómo ver las respuestas guardadas?

1. **En Supabase:**
   - Entra al dashboard de tu proyecto en Supabase.
   - En el menú lateral izquierdo, haz clic en **Table Editor** y selecciona la tabla `big5_responses`.
   - Podrás ver cada registro en tiempo real con fecha, participante, puntajes desglosados e incluso exportar la tabla a CSV con un clic.
2. **En la propia Web:**
   - En cualquier momento puedes pulsar el botón **"Base de Datos / Supabase"** y hacer clic en *"Descargar Respuestas en Excel / CSV"* para descargar un respaldo local de las pruebas hechas en ese navegador.
