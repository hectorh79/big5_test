// Lógica principal de la aplicación Big Five (BFI-44)

const QUESTIONS_PER_PAGE = 6;
const TOTAL_QUESTIONS = BFI_QUESTIONS.length; // 44
const TOTAL_PAGES = Math.ceil(TOTAL_QUESTIONS / QUESTIONS_PER_PAGE);

// Estado de la aplicación
const state = {
  currentPage: 0,
  userInfo: {
    fullName: "",
    email: "",
    date: ""
  },
  answers: {}, // { [questionId]: number (1-5) }
  scores: {
    O: 0,
    C: 0,
    E: 0,
    A: 0,
    N: 0
  },
  percentages: {},
  levels: {},
  radarChartInstance: null,
  // Conexión Supabase
  supabaseUrl: (window.APP_CONFIG && window.APP_CONFIG.supabaseUrl) || localStorage.getItem("big5_supabase_url") || "",
  supabaseAnonKey: (window.APP_CONFIG && window.APP_CONFIG.supabaseAnonKey) || localStorage.getItem("big5_supabase_key") || "",
  supabaseClient: null,
  // Conexión Google Sheets
  webhookUrl: (window.APP_CONFIG && window.APP_CONFIG.googleSheetWebhookUrl) || localStorage.getItem("big5_webhook_url") || ""
};

// Escala Likert de 5 puntos
const LIKERT_OPTIONS = [
  { value: 1, label: "Muy en desacuerdo", short: "1", subtext: "Totalmente falso" },
  { value: 2, label: "En desacuerdo",     short: "2", subtext: "Algo falso" },
  { value: 3, label: "Neutral",           short: "3", subtext: "Ni falso ni verdadero" },
  { value: 4, label: "De acuerdo",        short: "4", subtext: "Algo verdadero" },
  { value: 5, label: "Muy de acuerdo",    short: "5", subtext: "Totalmente verdadero" }
];

// Inicialización al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

function initApp() {
  // Configuración de eventos de formularios y botones
  const startForm = document.getElementById("form-start");
  if (startForm) {
    startForm.addEventListener("submit", handleStartQuiz);
  }

  document.getElementById("btn-prev").addEventListener("click", goToPrevPage);
  document.getElementById("btn-next").addEventListener("click", handleNextOrFinish);
  document.getElementById("btn-download-pdf").addEventListener("click", downloadPDF);
  document.getElementById("btn-print").addEventListener("click", () => window.print());
  document.getElementById("btn-restart").addEventListener("click", restartTest);

  // Configuración de Webhook y Admin Modal
  const btnConfig = document.getElementById("btn-config");
  const modalConfig = document.getElementById("modal-config");
  const btnCloseModal = document.getElementById("btn-close-modal");
  const formSupabase = document.getElementById("form-supabase");
  const inputSupabaseUrl = document.getElementById("input-supabase-url");
  const inputSupabaseKey = document.getElementById("input-supabase-key");
  const formWebhook = document.getElementById("form-webhook");
  const inputWebhook = document.getElementById("input-webhook");
  const btnExportCsv = document.getElementById("btn-export-csv");

  // Iniciar cliente Supabase si ya hay credenciales
  initSupabaseClient();

  const btnFooterAdmin = document.getElementById("btn-footer-admin");

  function openAdminModal() {
    if (inputSupabaseUrl) inputSupabaseUrl.value = state.supabaseUrl;
    if (inputSupabaseKey) inputSupabaseKey.value = state.supabaseAnonKey;
    if (inputWebhook) inputWebhook.value = state.webhookUrl;
    updateSubmissionsCount();
    if (modalConfig) {
      modalConfig.classList.remove("hidden");
      modalConfig.style.display = "flex";
    }
  }

  function closeAdminModal() {
    if (modalConfig) {
      modalConfig.classList.add("hidden");
      modalConfig.style.display = "none";
    }
  }

  function revealAdminButton() {
    if (btnConfig) {
      btnConfig.classList.remove("hidden");
      btnConfig.style.display = "inline-flex";
    }
  }

  // 1. Acceso mediante Candado discreto en el pie de página
  if (btnFooterAdmin) {
    btnFooterAdmin.addEventListener("click", () => {
      openAdminModal();
    });
  }

  // 2. Acceso por URL: si tiene #admin o ?admin=1
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("admin") === "1" || urlParams.get("admin") === "true" || window.location.hash === "#admin") {
    revealAdminButton();
    openAdminModal();
  }

  // 3. Atajo de teclado: Ctrl + Shift + A (o Cmd + Shift + A en Mac)
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "a" || e.key === "A")) {
      e.preventDefault();
      revealAdminButton();
      openAdminModal();
      showNotification("Modo Administrador activado", "info");
    }
  });

  // 4. Doble clic en el logo morado
  const appLogo = document.getElementById("app-logo");
  if (appLogo) {
    appLogo.addEventListener("dblclick", () => {
      revealAdminButton();
      openAdminModal();
      showNotification("Modo Administrador activado", "info");
    });
  }

  if (btnConfig) {
    btnConfig.addEventListener("click", openAdminModal);
  }

  if (btnCloseModal) {
    btnCloseModal.addEventListener("click", closeAdminModal);
  }

  // Cerrar modal al hacer clic en el fondo oscuro
  if (modalConfig) {
    modalConfig.addEventListener("click", (e) => {
      if (e.target === modalConfig) {
        closeAdminModal();
      }
    });
  }

  if (formSupabase) {
    formSupabase.addEventListener("submit", (e) => {
      e.preventDefault();
      state.supabaseUrl = inputSupabaseUrl.value.trim();
      state.supabaseAnonKey = inputSupabaseKey.value.trim();
      localStorage.setItem("big5_supabase_url", state.supabaseUrl);
      localStorage.setItem("big5_supabase_key", state.supabaseAnonKey);
      initSupabaseClient();
      showNotification("¡Conexión con Supabase guardada exitosamente!", "success");
      closeAdminModal();
    });
  }

  if (formWebhook) {
    formWebhook.addEventListener("submit", (e) => {
      e.preventDefault();
      state.webhookUrl = inputWebhook.value.trim();
      localStorage.setItem("big5_webhook_url", state.webhookUrl);
      showNotification("Configuración de Google Sheets guardada.");
      closeAdminModal();
    });
  }

  if (btnExportCsv) {
    btnExportCsv.addEventListener("click", exportLocalSubmissionsToCSV);
  }
}

// Inicializar cliente Supabase
function initSupabaseClient() {
  if (window.supabase && state.supabaseUrl && state.supabaseAnonKey) {
    try {
      state.supabaseClient = window.supabase.createClient(state.supabaseUrl, state.supabaseAnonKey);
      console.log("Cliente Supabase inicializado correctamente.");
    } catch (e) {
      console.warn("Error al inicializar Supabase:", e);
    }
  }
}

// Iniciar cuestionario tras ingresar nombre y correo
function handleStartQuiz(e) {
  e.preventDefault();
  const nameInput = document.getElementById("input-name");
  const emailInput = document.getElementById("input-email");

  state.userInfo.fullName = nameInput.value.trim();
  state.userInfo.email = emailInput.value.trim();
  state.userInfo.date = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  document.getElementById("screen-intro").classList.add("hidden");
  document.getElementById("screen-quiz").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });

  state.currentPage = 0;
  renderCurrentPage();
}

// Renderizar la página actual de preguntas
function renderCurrentPage() {
  const container = document.getElementById("questions-container");
  container.innerHTML = "";

  const startIdx = state.currentPage * QUESTIONS_PER_PAGE;
  const endIdx = Math.min(startIdx + QUESTIONS_PER_PAGE, TOTAL_QUESTIONS);
  const currentQuestions = BFI_QUESTIONS.slice(startIdx, endIdx);

  // Actualizar barra de progreso
  const answeredCount = Object.keys(state.answers).length;
  const progressPercent = Math.round((answeredCount / TOTAL_QUESTIONS) * 100);
  
  document.getElementById("progress-bar").style.width = `${progressPercent}%`;
  document.getElementById("progress-text").textContent = `Respondidas: ${answeredCount} de ${TOTAL_QUESTIONS} (${progressPercent}%)`;
  document.getElementById("page-indicator").textContent = `Página ${state.currentPage + 1} de ${TOTAL_PAGES}`;

  // Botón atrás visible sólo a partir de la página 1
  const btnPrev = document.getElementById("btn-prev");
  if (state.currentPage === 0) {
    btnPrev.classList.add("opacity-0", "pointer-events-none");
  } else {
    btnPrev.classList.remove("opacity-0", "pointer-events-none");
  }

  // Cambiar texto de Siguiente a "Ver Resultados" en la última página
  const btnNext = document.getElementById("btn-next");
  if (state.currentPage === TOTAL_PAGES - 1) {
    btnNext.innerHTML = `
      <span>Finalizar y Ver Resultados</span>
      <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
    `;
    btnNext.classList.remove("bg-indigo-600", "hover:bg-indigo-700");
    btnNext.classList.add("bg-emerald-600", "hover:bg-emerald-700");
  } else {
    btnNext.innerHTML = `
      <span>Siguiente</span>
      <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
    `;
    btnNext.classList.remove("bg-emerald-600", "hover:bg-emerald-700");
    btnNext.classList.add("bg-indigo-600", "hover:bg-indigo-700");
  }

  // Generar tarjetas de preguntas
  currentQuestions.forEach((q, idx) => {
    const qNumber = startIdx + idx + 1;
    const card = document.createElement("div");
    card.id = `q-card-${q.id}`;
    card.className = "question-card bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-200 transition-all";

    const isAnswered = state.answers[q.id] !== undefined;

    let optionsHtml = "";
    LIKERT_OPTIONS.forEach(opt => {
      const isSelected = state.answers[q.id] === opt.value;
      optionsHtml += `
        <label class="likert-btn relative flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
          isSelected 
            ? "border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-sm" 
            : "border-slate-200 hover:border-indigo-200 hover:bg-slate-50 text-slate-700"
        }">
          <input 
            type="radio" 
            name="question_${q.id}" 
            value="${opt.value}" 
            ${isSelected ? "checked" : ""} 
            onchange="selectAnswer(${q.id}, ${opt.value})"
            class="sr-only"
          />
          <span class="w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm mb-1 ${
            isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
          }">${opt.short}</span>
          <span class="text-xs font-semibold text-center leading-tight hidden md:block">${opt.label}</span>
          <span class="text-[10px] text-slate-400 text-center leading-tight mt-0.5 hidden lg:block">${opt.subtext}</span>
        </label>
      `;
    });

    card.innerHTML = `
      <div class="flex items-start justify-between gap-3 mb-4">
        <div class="flex items-center gap-3">
          <span class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0">
            ${qNumber}
          </span>
          <p class="text-base md:text-lg font-medium text-slate-800">
            Me veo a mí mismo(a) como alguien que <span class="font-bold text-slate-900">${q.text.toLowerCase()}</span>
          </p>
        </div>
        <div id="check-icon-${q.id}" class="${isAnswered ? 'text-emerald-500' : 'text-slate-200'}">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
        </div>
      </div>
      <div class="grid grid-cols-5 gap-2 md:gap-3 mt-4">
        ${optionsHtml}
      </div>
      <!-- Leyenda móvil simplificada debajo de la escala -->
      <div class="flex justify-between text-[11px] text-slate-500 mt-2 px-1 md:hidden">
        <span>1: Muy en desacuerdo</span>
        <span>5: Muy de acuerdo</span>
      </div>
    `;

    container.appendChild(card);
  });
}

// Seleccionar respuesta para una pregunta
window.selectAnswer = function(questionId, value) {
  state.answers[questionId] = value;

  // Actualizar UI de la tarjeta actual
  const card = document.getElementById(`q-card-${questionId}`);
  if (card) {
    card.classList.remove("border-rose-400", "bg-rose-50/20");
    const checkIcon = document.getElementById(`check-icon-${questionId}`);
    if (checkIcon) {
      checkIcon.classList.remove("text-slate-200");
      checkIcon.classList.add("text-emerald-500");
    }

    // Actualizar estilos de los botones en esta tarjeta
    const labels = card.querySelectorAll(".likert-btn");
    labels.forEach(lbl => {
      const radio = lbl.querySelector("input[type=radio]");
      const badge = lbl.querySelector("span");
      if (radio && parseInt(radio.value) === value) {
        lbl.className = "likert-btn relative flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-sm";
        badge.className = "w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm mb-1 bg-indigo-600 text-white";
      } else {
        lbl.className = "likert-btn relative flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all border-slate-200 hover:border-indigo-200 hover:bg-slate-50 text-slate-700";
        badge.className = "w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm mb-1 bg-slate-100 text-slate-600";
      }
    });
  }

  // Actualizar progreso general
  const answeredCount = Object.keys(state.answers).length;
  const progressPercent = Math.round((answeredCount / TOTAL_QUESTIONS) * 100);
  document.getElementById("progress-bar").style.width = `${progressPercent}%`;
  document.getElementById("progress-text").textContent = `Respondidas: ${answeredCount} de ${TOTAL_QUESTIONS} (${progressPercent}%)`;
};

// Navegación
function goToPrevPage() {
  if (state.currentPage > 0) {
    state.currentPage--;
    renderCurrentPage();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function handleNextOrFinish() {
  // Validar si faltan preguntas en la página actual
  const startIdx = state.currentPage * QUESTIONS_PER_PAGE;
  const endIdx = Math.min(startIdx + QUESTIONS_PER_PAGE, TOTAL_QUESTIONS);
  const currentQuestions = BFI_QUESTIONS.slice(startIdx, endIdx);

  let firstUnanswered = null;
  for (const q of currentQuestions) {
    if (state.answers[q.id] === undefined) {
      firstUnanswered = q.id;
      const card = document.getElementById(`q-card-${q.id}`);
      if (card) {
        card.classList.add("border-rose-400", "bg-rose-50/20");
      }
    }
  }

  if (firstUnanswered) {
    const element = document.getElementById(`q-card-${firstUnanswered}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    showNotification("Por favor responde todas las preguntas antes de continuar.", "warning");
    return;
  }

  // Si no está en la última página, avanzar
  if (state.currentPage < TOTAL_PAGES - 1) {
    state.currentPage++;
    renderCurrentPage();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    // Es la última página -> Calcular y Mostrar Resultados
    finishTestAndShowResults();
  }
}

// Cálculo psicométrico del Big Five BFI-44
function calculateScores() {
  const traitSums = { O: 0, C: 0, E: 0, A: 0, N: 0 };
  const traitCounts = { O: 0, C: 0, E: 0, A: 0, N: 0 };

  BFI_QUESTIONS.forEach(q => {
    const rawVal = state.answers[q.id] || 3;
    // Si es inverso: valor invertido = 6 - respuesta
    const effectiveVal = q.reversed ? (6 - rawVal) : rawVal;

    traitSums[q.trait] += effectiveVal;
    traitCounts[q.trait] += 1;
  });

  const traits = ["O", "C", "E", "A", "N"];
  traits.forEach(t => {
    const mean = traitSums[t] / traitCounts[t]; // Escala de 1.00 a 5.00
    state.scores[t] = mean;

    // Normalizado a porcentaje (0% a 100%)
    state.percentages[t] = Math.round(((mean - 1) / 4) * 100);

    // Clasificación cualitativa
    if (mean < 2.80) {
      state.levels[t] = "Bajo";
    } else if (mean <= 3.80) {
      state.levels[t] = "Moderado";
    } else {
      state.levels[t] = "Alto";
    }
  });
}

// Finalizar test y procesar guardado
function finishTestAndShowResults() {
  calculateScores();

  // Guardar en almacenamiento local (localStorage) como respaldo
  saveToLocalStorage();

  // Guardar en Supabase (si está configurado)
  sendToSupabase();

  // Enviar a Google Sheets vía Webhook (si está configurado)
  sendToGoogleSheetsWebhook();

  // Mostrar la pantalla de resultados
  document.getElementById("screen-quiz").classList.add("hidden");
  document.getElementById("screen-results").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Rellenar datos en el encabezado del reporte
  document.getElementById("res-user-name").textContent = state.userInfo.fullName;
  document.getElementById("res-user-email").textContent = state.userInfo.email || "No especificado";
  document.getElementById("res-date").textContent = state.userInfo.date;

  // Renderizar Gráfico de Radar
  renderRadarChart();

  // Renderizar tarjetas descriptivas de los 5 rasgos
  renderTraitCards();
}

// Renderizado de Gráfico Radar con Chart.js
function renderRadarChart() {
  const ctx = document.getElementById("radar-chart").getContext("2d");

  if (state.radarChartInstance) {
    state.radarChartInstance.destroy();
  }

  const labels = [
    "Apertura (O)",
    "Responsabilidad (C)",
    "Extraversión (E)",
    "Amabilidad (A)",
    "Neuroticismo (N)"
  ];

  const dataValues = [
    state.percentages.O,
    state.percentages.C,
    state.percentages.E,
    state.percentages.A,
    state.percentages.N
  ];

  state.radarChartInstance = new Chart(ctx, {
    type: "radar",
    data: {
      labels: labels,
      datasets: [{
        label: "Tu Perfil (%)",
        data: dataValues,
        backgroundColor: "rgba(99, 102, 241, 0.25)",
        borderColor: "rgba(99, 102, 241, 1)",
        borderWidth: 2.5,
        pointBackgroundColor: "rgba(79, 70, 229, 1)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgba(79, 70, 229, 1)",
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 20,
            backdropColor: "transparent",
            color: "#64748B",
            font: { size: 10 }
          },
          grid: {
            color: "#E2E8F0"
          },
          angleLines: {
            color: "#E2E8F0"
          },
          pointLabels: {
            color: "#1E293B",
            font: {
              family: "'Plus Jakarta Sans', sans-serif",
              size: 12,
              weight: "600"
            }
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return ` Puntuación: ${context.raw}%`;
            }
          }
        }
      }
    }
  });
}

// Renderizado detallado de las 5 dimensiones
function renderTraitCards() {
  const container = document.getElementById("trait-cards-container");
  container.innerHTML = "";

  const traitKeys = ["O", "C", "E", "A", "N"];

  traitKeys.forEach(key => {
    const info = TRAIT_INFO[key];
    const scoreVal = state.scores[key].toFixed(2);
    const percent = state.percentages[key];
    const level = state.levels[key];

    let interpretation = "";
    if (level === "Bajo") interpretation = info.lowDesc;
    else if (level === "Moderado") interpretation = info.midDesc;
    else interpretation = info.highDesc;

    // Badges según nivel
    let badgeColor = "bg-slate-100 text-slate-700";
    if (level === "Alto") badgeColor = "bg-indigo-100 text-indigo-700 border border-indigo-200";
    else if (level === "Moderado") badgeColor = "bg-sky-100 text-sky-700 border border-sky-200";
    else badgeColor = "bg-amber-100 text-amber-800 border border-amber-200";

    const card = document.createElement("div");
    card.className = "print-break-inside-avoid print-shadow-none bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between";

    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm" style="background-color: ${info.color}">
              ${key}
            </span>
            <h4 class="font-bold text-slate-800 text-lg">${info.name}</h4>
          </div>
          <span class="text-xs px-2.5 py-1 rounded-full font-semibold ${badgeColor}">
            Nivel ${level}
          </span>
        </div>

        <p class="text-xs text-slate-500 mb-4 leading-relaxed">${info.description}</p>

        <!-- Barra de porcentaje -->
        <div class="mb-4">
          <div class="flex justify-between items-center text-sm font-semibold mb-1">
            <span class="text-slate-600">Puntaje: ${scoreVal} / 5.00</span>
            <span class="text-slate-800 font-bold">${percent}%</span>
          </div>
          <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div class="h-2.5 rounded-full transition-all duration-1000" style="width: ${percent}%; background-color: ${info.color}"></div>
          </div>
        </div>

        <!-- Interpretación cualitativa -->
        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs md:text-sm text-slate-700 leading-relaxed">
          <strong class="text-slate-900 block mb-1">Diagnóstico según tu resultado:</strong>
          ${interpretation}
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

// Descargar Reporte en PDF
function downloadPDF() {
  const element = document.getElementById("report-printable-area");
  const userNameClean = state.userInfo.fullName.replace(/[^a-zA-Z0-9]/g, "_") || "Usuario";
  const filename = `Reporte_Big5_${userNameClean}.pdf`;

  showNotification("Generando archivo PDF...", "info");

  // Configuración de html2pdf
  const opt = {
    margin: [10, 10, 10, 10],
    filename: filename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
  };

  if (window.html2pdf) {
    html2pdf().set(opt).from(element).save().then(() => {
      showNotification("¡PDF descargado con éxito!", "success");
    }).catch(err => {
      console.warn("Fallo html2pdf, abriendo diálogo de impresión estándar:", err);
      window.print();
    });
  } else {
    window.print();
  }
}

// Enviar datos a la base de datos Supabase
async function sendToSupabase() {
  if (!state.supabaseClient) {
    console.log("Supabase no está configurado aún. Las respuestas se almacenaron en el respaldo local.");
    return;
  }

  const record = {
    full_name: state.userInfo.fullName,
    email: state.userInfo.email || null,
    score_o: Number(state.scores.O.toFixed(2)),
    score_c: Number(state.scores.C.toFixed(2)),
    score_e: Number(state.scores.E.toFixed(2)),
    score_a: Number(state.scores.A.toFixed(2)),
    score_n: Number(state.scores.N.toFixed(2)),
    percent_o: state.percentages.O,
    percent_c: state.percentages.C,
    percent_e: state.percentages.E,
    percent_a: state.percentages.A,
    percent_n: state.percentages.N,
    level_o: state.levels.O,
    level_c: state.levels.C,
    level_e: state.levels.E,
    level_a: state.levels.A,
    level_n: state.levels.N,
    answers: state.answers
  };

  try {
    const { data, error } = await state.supabaseClient
      .from("big5_responses")
      .insert([record]);

    if (error) {
      console.warn("Error al registrar en Supabase:", error.message);
    } else {
      console.log("¡Respuesta registrada exitosamente en Supabase!");
    }
  } catch (err) {
    console.warn("Excepción al conectar con Supabase:", err);
  }
}

// Enviar datos al Webhook de Google Sheets
function sendToGoogleSheetsWebhook() {
  if (!state.webhookUrl) {
    console.log("No se configuró webhook de Google Sheets. Los datos se guardaron localmente.");
    return;
  }

  const payload = {
    timestamp: new Date().toISOString(),
    fullName: state.userInfo.fullName,
    email: state.userInfo.email,
    scores: state.scores,
    percentages: state.percentages,
    levels: state.levels,
    answers: state.answers
  };

  // Google Apps Script requiere mode 'no-cors' para evitar problemas de CORS en redirects
  fetch(state.webhookUrl, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  .then(() => {
    console.log("Datos sincronizados con Google Sheets.");
  })
  .catch(err => {
    console.warn("Error al enviar a Google Sheets:", err);
  });
}

// Guardar respuestas en localStorage
function saveToLocalStorage() {
  try {
    const existing = JSON.parse(localStorage.getItem("big5_submissions") || "[]");
    const record = {
      id: Date.now(),
      timestamp: state.userInfo.date,
      fullName: state.userInfo.fullName,
      email: state.userInfo.email,
      scores: state.scores,
      percentages: state.percentages,
      levels: state.levels,
      answers: state.answers
    };
    existing.push(record);
    localStorage.setItem("big5_submissions", JSON.stringify(existing));
    updateSubmissionsCount();
  } catch (e) {
    console.warn("No se pudo guardar en localStorage", e);
  }
}

// Exportar respuestas acumuladas a archivo CSV
function exportLocalSubmissionsToCSV() {
  const existing = JSON.parse(localStorage.getItem("big5_submissions") || "[]");
  if (existing.length === 0) {
    showNotification("No hay registros guardados localmente aún.", "warning");
    return;
  }

  // Encabezados
  const headers = [
    "Fecha",
    "Nombre",
    "Correo",
    "Apertura (O)",
    "Responsabilidad (C)",
    "Extraversión (E)",
    "Amabilidad (A)",
    "Neuroticismo (N)"
  ];
  for (let i = 1; i <= 44; i++) {
    headers.push(`P${i}`);
  }

  const rows = [headers.join(",")];

  existing.forEach(r => {
    const row = [
      `"${r.timestamp}"`,
      `"${(r.fullName || '').replace(/"/g, '""')}"`,
      `"${(r.email || '').replace(/"/g, '""')}"`,
      r.scores.O ? r.scores.O.toFixed(2) : "",
      r.scores.C ? r.scores.C.toFixed(2) : "",
      r.scores.E ? r.scores.E.toFixed(2) : "",
      r.scores.A ? r.scores.A.toFixed(2) : "",
      r.scores.N ? r.scores.N.toFixed(2) : ""
    ];
    for (let q = 1; q <= 44; q++) {
      row.push(r.answers && r.answers[q] !== undefined ? r.answers[q] : "");
    }
    rows.push(row.join(","));
  });

  const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(rows.join("\n"));
  const link = document.createElement("a");
  link.setAttribute("href", csvContent);
  link.setAttribute("download", `Respuestas_Big5_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showNotification("Archivo CSV descargado correctamente.", "success");
}

function updateSubmissionsCount() {
  const countEl = document.getElementById("local-count");
  if (countEl) {
    const existing = JSON.parse(localStorage.getItem("big5_submissions") || "[]");
    countEl.textContent = `${existing.length} respuestas guardadas`;
  }
}

// Reiniciar test
function restartTest() {
  state.currentPage = 0;
  state.answers = {};
  state.userInfo = { fullName: "", email: "", date: "" };

  document.getElementById("form-start").reset();
  document.getElementById("screen-results").classList.add("hidden");
  document.getElementById("screen-intro").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Toast de notificación ligero
function showNotification(message, type = "success") {
  const toast = document.createElement("div");
  let bg = "bg-slate-900 text-white";
  if (type === "warning") bg = "bg-amber-600 text-white";
  if (type === "info") bg = "bg-indigo-600 text-white";

  toast.className = `fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-medium transition-all duration-300 transform translate-y-4 opacity-0 ${bg}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove("translate-y-4", "opacity-0");
  }, 50);

  setTimeout(() => {
    toast.classList.add("translate-y-4", "opacity-0");
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3500);
}
