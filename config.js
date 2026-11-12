// Configuración de conexiones (Supabase y Google Sheets)
// Puedes colocar tus credenciales aquí antes de subir a Netlify / Vercel / GitHub Pages.

window.APP_CONFIG = {
  // 1. SUPABASE (Recomendado para base de datos PostgreSQL gratuita)
  // Obtenlos en: Supabase Dashboard > Tu Proyecto > Project Settings > API
  supabaseUrl: "https://vwzinjynamhwllanfazc.supabase.co/rest/v1/",      // Ejemplo: "https://abcdefghijklm.supabase.co"
  supabaseAnonKey: "sb_publishable_-B_5omcrAYJdZSROcKMwlA_GDOIukR7",  // La clave "anon" "public" (empieza por eyJhbGci...)

  // 2. GOOGLE SHEETS (Opcional)
  // Si prefieres o también quieres respaldo en Google Sheets
  googleSheetWebhookUrl: ""
};
