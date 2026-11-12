// Banco de 44 preguntas estándar del Big Five Inventory (BFI-44)
// O: Apertura a la experiencia (Openness)
// C: Responsabilidad / Tesón (Conscientiousness)
// E: Extraversión (Extraversion)
// A: Amabilidad / Afabilidad (Agreeableness)
// N: Neuroticismo / Estabilidad emocional (Neuroticism)

const BFI_QUESTIONS = [
  // 1 - 10
  { id: 1, trait: "E", reversed: false, text: "Es comunicativo, hablador." },
  { id: 2, trait: "A", reversed: true,  text: "Tiende a encontrar defectos en los demás." },
  { id: 3, trait: "C", reversed: false, text: "Hace un trabajo minucioso y detallado." },
  { id: 4, trait: "N", reversed: false, text: "Es depresivo, melancólico." },
  { id: 5, trait: "O", reversed: false, text: "Es original, se le ocurren ideas nuevas." },
  { id: 6, trait: "E", reversed: true,  text: "Es reservado o callado." },
  { id: 7, trait: "A", reversed: false, text: "Es servicial y generoso con los demás." },
  { id: 8, trait: "C", reversed: true,  text: "Puede ser algo descuidado o negligente." },
  { id: 9, trait: "N", reversed: true,  text: "Es relajado, maneja bien el estrés." },
  { id: 10, trait: "O", reversed: false, text: "Siente curiosidad por muchas cosas diferentes." },

  // 11 - 20
  { id: 11, trait: "E", reversed: false, text: "Está lleno de energía y vitalidad." },
  { id: 12, trait: "A", reversed: true,  text: "Inicia disputas o discusiones con los demás." },
  { id: 13, trait: "C", reversed: false, text: "Es un trabajador confiable y cumplidor." },
  { id: 14, trait: "N", reversed: false, text: "Se pone tenso fácilmente." },
  { id: 15, trait: "O", reversed: false, text: "Es ingenioso, un pensador profundo." },
  { id: 16, trait: "E", reversed: false, text: "Genera mucho entusiasmo." },
  { id: 17, trait: "A", reversed: false, text: "Es de naturaleza comprensiva y perdonadora." },
  { id: 18, trait: "C", reversed: true,  text: "Tiende a ser desorganizado." },
  { id: 19, trait: "N", reversed: false, text: "Se preocupa mucho por las cosas." },
  { id: 20, trait: "O", reversed: false, text: "Tiene una imaginación activa y vívida." },

  // 21 - 30
  { id: 21, trait: "E", reversed: true,  text: "Tiende a ser silencioso o poco expresivo." },
  { id: 22, trait: "A", reversed: false, text: "Generalmente es confiado y bondadoso." },
  { id: 23, trait: "C", reversed: true,  text: "Tiende a ser perezoso o postergar tareas." },
  { id: 24, trait: "N", reversed: true,  text: "Es emocionalmente estable, no se altera fácilmente." },
  { id: 25, trait: "O", reversed: false, text: "Es creativo e inventivo." },
  { id: 26, trait: "E", reversed: false, text: "Tiene una personalidad asertiva y segura." },
  { id: 27, trait: "A", reversed: true,  text: "Puede ser frío, distante y poco empático." },
  { id: 28, trait: "C", reversed: false, text: "Persevera hasta que la tarea esté totalmente terminada." },
  { id: 29, trait: "N", reversed: false, text: "Puede ser temperamental o cambiar de humor con rapidez." },
  { id: 30, trait: "O", reversed: false, text: "Valora el arte, la belleza y las experiencias estéticas." },

  // 31 - 40
  { id: 31, trait: "E", reversed: true,  text: "Es a veces tímido e inhibido socialmente." },
  { id: 32, trait: "A", reversed: false, text: "Es considerado y amable con casi todo el mundo." },
  { id: 33, trait: "C", reversed: false, text: "Hace las cosas de manera eficiente y ordenada." },
  { id: 34, trait: "N", reversed: true,  text: "Permanece en calma en situaciones de alta presión o conflicto." },
  { id: 35, trait: "O", reversed: true,  text: "Prefiere el trabajo rutinario a las tareas novedosas." },
  { id: 36, trait: "E", reversed: false, text: "Es sociable, extrovertido y amistoso." },
  { id: 37, trait: "A", reversed: true,  text: "A veces es cortante, crítico o grosero con los demás." },
  { id: 38, trait: "C", reversed: false, text: "Hace planes y los sigue con disciplina." },
  { id: 39, trait: "N", reversed: false, text: "Se pone nervioso o ansioso con facilidad." },
  { id: 40, trait: "O", reversed: false, text: "Le gusta reflexionar y jugar con ideas complejas." },

  // 41 - 44
  { id: 41, trait: "O", reversed: true,  text: "Tiene poco interés en las artes o la cultura." },
  { id: 42, trait: "A", reversed: false, text: "Le gusta cooperar y trabajar en equipo." },
  { id: 43, trait: "C", reversed: true,  text: "Se distrae con facilidad de sus objetivos." },
  { id: 44, trait: "O", reversed: false, text: "Es sofisticado y con gusto por el arte, música o literatura." }
];

const TRAIT_INFO = {
  O: {
    name: "Apertura a la Experiencia",
    acronym: "O",
    color: "#8B5CF6", // Violeta
    bgLight: "bg-purple-50 text-purple-700 border-purple-200",
    description: "Refleja el grado de curiosidad intelectual, creatividad, aprecio por el arte y preferencia por la variedad.",
    lowDesc: "Práctico, tradicional, orientado a lo concreto y a métodos probados. Prefiere la rutina sobre la incertidumbre.",
    midDesc: "Equilibrio entre pensamiento pragmático e interés por nuevas ideas. Abierto al cambio cuando tiene sentido práctico.",
    highDesc: "Altamente imaginativo, curioso, innovador y flexible. Disfruta explorando conceptos abstractos, arte y nuevas experiencias."
  },
  C: {
    name: "Responsabilidad (Tesón)",
    acronym: "C",
    color: "#3B82F6", // Azul
    bgLight: "bg-blue-50 text-blue-700 border-blue-200",
    description: "Mide el autocontrol, la disciplina, la orientación al logro, la organización y la confiabilidad.",
    lowDesc: "Espontáneo, flexible, adaptable pero a veces desorganizado o propenso a procrastinar en tareas estructuradas.",
    midDesc: "Capaz de cumplir con metas y plazos manteniendo cierta flexibilidad según lo demande la situación.",
    highDesc: "Sumamente metódico, disciplinado, orientado a la excelencia y confiable. Planifica rigurosamente sus metas."
  },
  E: {
    name: "Extraversión",
    acronym: "E",
    color: "#F59E0B", // Ámbar
    bgLight: "bg-amber-50 text-amber-700 border-amber-200",
    description: "Evalúa la energía social, asertividad, entusiasmo y preferencia por la interacción con otras personas.",
    lowDesc: "Introvertido, reflexivo, reservado. Se recarga en soledad y prefiere círculos sociales íntimos o trabajo individual.",
    midDesc: "Ambivertido; disfruta compartir con otros pero también valora y necesita sus momentos de privacidad.",
    highDesc: "Muy extrovertido, dinámico, expresivo y comunicativo. Se energiza en grupos y asume roles de liderazgo con naturalidad."
  },
  A: {
    name: "Amabilidad (Afabilidad)",
    acronym: "A",
    color: "#10B981", // Esmeralda
    bgLight: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description: "Indica la tendencia hacia la compasión, cooperación, confianza y consideración hacia los sentimientos ajenos.",
    lowDesc: "Competitivo, escéptico, frontal y analítico. Prioriza la objetividad o el debate sobre la diplomacia.",
    midDesc: "Amigable y respetuoso, pero capaz de defender su postura con firmeza cuando es necesario.",
    highDesc: "Empático, solidario, confiable y cooperativo. Busca la armonía en sus relaciones y apoya desinteresadamente."
  },
  N: {
    name: "Neuroticismo (Reactividad Emocional)",
    acronym: "N",
    color: "#EF4444", // Rojo
    bgLight: "bg-rose-50 text-rose-700 border-rose-200",
    description: "Mide la propensión a experimentar emociones negativas como ansiedad, vulnerabilidad al estrés o cambios de humor.",
    lowDesc: "Muy estable emocionalmente, calmado, resiliente frente a la presión y poco propenso a la preocupación.",
    midDesc: "Nivel moderado de reactividad emocional; experimenta estrés normal ante situaciones difíciles pero se recupera bien.",
    highDesc: "Sensible, vigilante, reactivo ante el estrés. Tiende a preocuparse con anticipación y siente las emociones intensamente."
  }
};
