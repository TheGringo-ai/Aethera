/* ================================================================
   CONFIG — Firebase, Translations, Constants, Global State
   Loads FIRST before all other modules.
   ================================================================ */

/* ════════════════════════════════════════════════════════════════
   TRANSLATIONS
   ════════════════════════════════════════════════════════════════ */
const translations = {
  en: {
    subtitle: "8 ancient divination systems. 1 cosmic reading. Powered by AI.",
    label_name: "Your Name", ph_name: "Enter your full name",
    label_email: "Your Email", ph_email: "your@email.com",
    label_dob: "Date of Birth",
    toggle_optional: "+ Birth time & location (optional)",
    label_time: "Birth Time", label_location: "Birth Location", ph_location: "City, Country",
    section_questions: "5 Quick Questions",
    q0: "When facing a challenge, you...", q0a1: "Analyze it", q0a2: "Feel through it", q0a3: "Act on instinct", q0a4: "Wait and observe",
    q1: "In a group, you naturally...", q1a1: "Lead", q1a2: "Listen", q1a3: "Create", q1a4: "Observe",
    q2: "Your ideal environment is...", q2a1: "Mountains", q2a2: "Ocean", q2a3: "City", q2a4: "Forest",
    q3: "You recharge by...", q3a1: "Solitude", q3a2: "Friends", q3a3: "Adventure", q3a4: "Creating",
    q4: "What draws you most?", q4a1: "Truth", q4a2: "Beauty", q4a3: "Power", q4a4: "Harmony",
    focus_q: "What's weighing on your mind right now?",
    focus_love: "Love", focus_work: "Work", focus_money: "Money", focus_health: "Health", focus_purpose: "Purpose",
    cta_reveal: "Reveal My Cosmic Profile",
    teaser_msg: "A message is waiting for you...", teaser_sub: "The cosmos has something to say",
    hint_continue: "continue",
    tension_label: "There is a tension within you",
    today_label: "Today's Cosmic Energy",
    full_title: "Your Cosmic Blueprint",
    palm_title: "Palm Reading", palm_subtitle: "AI-powered palmistry analysis",
    palm_upload_text: "Tap to take photo or upload", palm_upload_hint: "Flat hand, good lighting, palm facing camera",
    palm_change: "Change photo", palm_cta: "Read My Palm", palm_loading: "Reading the lines of your hand...",
    share_tagline: "More awaits...", share_sub: "Share your cosmic profile with friends",
    share_screenshot: "&#128248; Screenshot Card", share_copy: "&#128203; Copy Profile", share_native: "&#128228; Share",
    restart: "Get another reading",
    loading_msgs: ["Consulting the stars...","Reading your numerological signature...","Aligning the celestial patterns...","Channeling ancient wisdom...","Weaving your cosmic tapestry...","Connecting to the Mayan calendar...","Sensing your aura frequency...","Almost there..."],
    focus_labels: {love:"Your Love Reading",work:"Your Career Reading",money:"Your Abundance Reading",health:"Your Wellness Reading",purpose:"Your Purpose Reading"},
    sec_numerology:"Numerology",sec_astrology:"Western Astrology",sec_chinese:"Chinese Zodiac",
    sec_biorhythm:"Biorhythm (Today)",sec_celtic:"Celtic Tree",sec_mayan:"Mayan Tzolkin",sec_aura:"Aura & Palm Archetype",
  },
  es: {
    subtitle: "8 sistemas de adivinaci\u00f3n ancestrales. 1 lectura c\u00f3smica. Impulsada por IA.",
    label_name: "Tu Nombre", ph_name: "Ingresa tu nombre completo",
    label_email: "Tu Email", ph_email: "tu@email.com",
    label_dob: "Fecha de Nacimiento",
    toggle_optional: "+ Hora y lugar de nacimiento (opcional)",
    label_time: "Hora de Nacimiento", label_location: "Lugar de Nacimiento", ph_location: "Ciudad, Pa\u00eds",
    section_questions: "5 Preguntas R\u00e1pidas",
    q0: "Cuando enfrentas un desaf\u00edo, t\u00fa...", q0a1: "Lo analizas", q0a2: "Lo sientes", q0a3: "Act\u00faas por instinto", q0a4: "Esperas y observas",
    q1: "En un grupo, t\u00fa naturalmente...", q1a1: "Lideras", q1a2: "Escuchas", q1a3: "Creas", q1a4: "Observas",
    q2: "Tu ambiente ideal es...", q2a1: "Monta\u00f1as", q2a2: "Oc\u00e9ano", q2a3: "Ciudad", q2a4: "Bosque",
    q3: "Te recargas con...", q3a1: "Soledad", q3a2: "Amigos", q3a3: "Aventura", q3a4: "Creando",
    q4: "\u00bfQu\u00e9 te atrae m\u00e1s?", q4a1: "Verdad", q4a2: "Belleza", q4a3: "Poder", q4a4: "Armon\u00eda",
    focus_q: "\u00bfQu\u00e9 pesa en tu mente ahora?",
    focus_love: "Amor", focus_work: "Trabajo", focus_money: "Dinero", focus_health: "Salud", focus_purpose: "Prop\u00f3sito",
    cta_reveal: "Revela Mi Perfil C\u00f3smico",
    teaser_msg: "Un mensaje te espera...", teaser_sub: "El cosmos tiene algo que decir",
    hint_continue: "continuar",
    tension_label: "Hay una tensi\u00f3n dentro de ti",
    today_label: "Energ\u00eda C\u00f3smica de Hoy",
    full_title: "Tu Mapa C\u00f3smico",
    palm_title: "Lectura de Palma", palm_subtitle: "An\u00e1lisis de quiromnacia con IA",
    palm_upload_text: "Toca para tomar foto o subir", palm_upload_hint: "Mano abierta, buena luz, palma hacia la c\u00e1mara",
    palm_change: "Cambiar foto", palm_cta: "Leer Mi Palma", palm_loading: "Leyendo las l\u00edneas de tu mano...",
    share_tagline: "M\u00e1s te espera...", share_sub: "Comparte tu perfil c\u00f3smico con amigos",
    share_screenshot: "&#128248; Captura", share_copy: "&#128203; Copiar", share_native: "&#128228; Compartir",
    restart: "Obtener otra lectura",
    loading_msgs: ["Consultando las estrellas...","Leyendo tu firma numerol\u00f3gica...","Alineando patrones celestiales...","Canalizando sabidur\u00eda ancestral...","Tejiendo tu tapiz c\u00f3smico...","Casi listo..."],
    focus_labels: {love:"Tu Lectura de Amor",work:"Tu Lectura de Carrera",money:"Tu Lectura de Abundancia",health:"Tu Lectura de Bienestar",purpose:"Tu Lectura de Prop\u00f3sito"},
    sec_numerology:"Numerolog\u00eda",sec_astrology:"Astrolog\u00eda Occidental",sec_chinese:"Zod\u00edaco Chino",
    sec_biorhythm:"Biorritmo (Hoy)",sec_celtic:"\u00c1rbol Celta",sec_mayan:"Tzolkin Maya",sec_aura:"Aura y Arquetipo de Palma",
  },
  fr: {
    subtitle: "8 syst\u00e8mes de divination anciens. 1 lecture cosmique. Propuls\u00e9 par l'IA.",
    label_name: "Votre Nom", ph_name: "Entrez votre nom complet",
    label_email: "Votre Email", ph_email: "votre@email.com",
    label_dob: "Date de Naissance",
    toggle_optional: "+ Heure et lieu de naissance (optionnel)",
    label_time: "Heure de Naissance", label_location: "Lieu de Naissance", ph_location: "Ville, Pays",
    section_questions: "5 Questions Rapides",
    q0: "Face \u00e0 un d\u00e9fi, vous...", q0a1: "Analysez", q0a2: "Ressentez", q0a3: "Agissez par instinct", q0a4: "Observez",
    q1: "En groupe, vous...", q1a1: "Dirigez", q1a2: "\u00c9coutez", q1a3: "Cr\u00e9ez", q1a4: "Observez",
    q2: "Votre environnement id\u00e9al...", q2a1: "Montagnes", q2a2: "Oc\u00e9an", q2a3: "Ville", q2a4: "For\u00eat",
    q3: "Vous rechargez par...", q3a1: "Solitude", q3a2: "Amis", q3a3: "Aventure", q3a4: "Cr\u00e9ation",
    q4: "Qu'est-ce qui vous attire le plus?", q4a1: "V\u00e9rit\u00e9", q4a2: "Beaut\u00e9", q4a3: "Pouvoir", q4a4: "Harmonie",
    focus_q: "Qu'est-ce qui p\u00e8se sur votre esprit?",
    focus_love: "Amour", focus_work: "Travail", focus_money: "Argent", focus_health: "Sant\u00e9", focus_purpose: "But",
    cta_reveal: "R\u00e9v\u00e9ler Mon Profil Cosmique",
    teaser_msg: "Un message vous attend...", teaser_sub: "Le cosmos a quelque chose \u00e0 dire",
    hint_continue: "continuer",
    tension_label: "Il y a une tension en vous",
    today_label: "\u00c9nergie Cosmique d'Aujourd'hui",
    full_title: "Votre Plan Cosmique",
    palm_title: "Lecture de Paume", palm_subtitle: "Analyse de chiromancie par IA",
    palm_upload_text: "Touchez pour prendre une photo", palm_upload_hint: "Main ouverte, bonne lumi\u00e8re, paume face cam\u00e9ra",
    palm_change: "Changer photo", palm_cta: "Lire Ma Paume", palm_loading: "Lecture des lignes de votre main...",
    share_tagline: "Plus vous attend...", share_sub: "Partagez votre profil cosmique avec vos amis",
    share_screenshot: "&#128248; Capture", share_copy: "&#128203; Copier", share_native: "&#128228; Partager",
    restart: "Obtenir une autre lecture",
    loading_msgs: ["Consultation des \u00e9toiles...","Lecture de votre signature num\u00e9rologique...","Alignement des motifs c\u00e9lestes...","Canalisation de la sagesse ancienne...","Tissage de votre tapisserie cosmique...","Presque pr\u00eat..."],
    focus_labels: {love:"Votre Lecture d'Amour",work:"Votre Lecture de Carri\u00e8re",money:"Votre Lecture d'Abondance",health:"Votre Lecture de Bien-\u00eatre",purpose:"Votre Lecture de But"},
    sec_numerology:"Num\u00e9rologie",sec_astrology:"Astrologie Occidentale",sec_chinese:"Zodiaque Chinois",
    sec_biorhythm:"Biorythme (Aujourd'hui)",sec_celtic:"Arbre Celtique",sec_mayan:"Tzolkin Maya",sec_aura:"Aura et Arch\u00e9type de Paume",
  },
  pt: {
    subtitle: "8 sistemas de adivinha\u00e7\u00e3o ancestrais. 1 leitura c\u00f3smica. Impulsionada por IA.",
    label_name: "Seu Nome", ph_name: "Digite seu nome completo",
    label_email: "Seu Email", ph_email: "seu@email.com",
    label_dob: "Data de Nascimento",
    toggle_optional: "+ Hora e local de nascimento (opcional)",
    label_time: "Hora de Nascimento", label_location: "Local de Nascimento", ph_location: "Cidade, Pa\u00eds",
    section_questions: "5 Perguntas R\u00e1pidas",
    q0: "Diante de um desafio, voc\u00ea...", q0a1: "Analisa", q0a2: "Sente", q0a3: "Age por instinto", q0a4: "Observa",
    q1: "Em grupo, voc\u00ea naturalmente...", q1a1: "Lidera", q1a2: "Ouve", q1a3: "Cria", q1a4: "Observa",
    q2: "Seu ambiente ideal \u00e9...", q2a1: "Montanhas", q2a2: "Oceano", q2a3: "Cidade", q2a4: "Floresta",
    q3: "Voc\u00ea recarrega com...", q3a1: "Solid\u00e3o", q3a2: "Amigos", q3a3: "Aventura", q3a4: "Criando",
    q4: "O que mais te atrai?", q4a1: "Verdade", q4a2: "Beleza", q4a3: "Poder", q4a4: "Harmonia",
    focus_q: "O que pesa em sua mente agora?",
    focus_love: "Amor", focus_work: "Trabalho", focus_money: "Dinheiro", focus_health: "Sa\u00fade", focus_purpose: "Prop\u00f3sito",
    cta_reveal: "Revelar Meu Perfil C\u00f3smico",
    teaser_msg: "Uma mensagem espera por voc\u00ea...", teaser_sub: "O cosmos tem algo a dizer",
    hint_continue: "continuar",
    tension_label: "H\u00e1 uma tens\u00e3o dentro de voc\u00ea",
    today_label: "Energia C\u00f3smica de Hoje",
    full_title: "Seu Mapa C\u00f3smico",
    palm_title: "Leitura da Palma", palm_subtitle: "An\u00e1lise de quiromancia por IA",
    palm_upload_text: "Toque para tirar foto ou enviar", palm_upload_hint: "M\u00e3o aberta, boa luz, palma para c\u00e2mera",
    palm_change: "Mudar foto", palm_cta: "Ler Minha Palma", palm_loading: "Lendo as linhas da sua m\u00e3o...",
    share_tagline: "Mais te espera...", share_sub: "Compartilhe seu perfil c\u00f3smico",
    share_screenshot: "&#128248; Captura", share_copy: "&#128203; Copiar", share_native: "&#128228; Compartilhar",
    restart: "Obter outra leitura",
    loading_msgs: ["Consultando as estrelas...","Lendo sua assinatura numerol\u00f3gica...","Alinhando padr\u00f5es celestiais...","Canalizando sabedoria ancestral...","Tecendo sua tape\u00e7aria c\u00f3smica...","Quase pronto..."],
    focus_labels: {love:"Sua Leitura de Amor",work:"Sua Leitura de Carreira",money:"Sua Leitura de Abund\u00e2ncia",health:"Sua Leitura de Bem-estar",purpose:"Sua Leitura de Prop\u00f3sito"},
    sec_numerology:"Numerologia",sec_astrology:"Astrologia Ocidental",sec_chinese:"Zod\u00edaco Chin\u00eas",
    sec_biorhythm:"Biorritmo (Hoje)",sec_celtic:"\u00c1rvore Celta",sec_mayan:"Tzolkin Maia",sec_aura:"Aura e Arqu\u00e9tipo de Palma",
  },
  de: {
    subtitle: "8 uralte Wahrsagesysteme. 1 kosmische Lesung. KI-gest\u00fctzt.",
    label_name: "Dein Name", ph_name: "Gib deinen vollst\u00e4ndigen Namen ein",
    label_email: "Deine Email", ph_email: "deine@email.com",
    label_dob: "Geburtsdatum",
    toggle_optional: "+ Geburtszeit & Ort (optional)",
    label_time: "Geburtszeit", label_location: "Geburtsort", ph_location: "Stadt, Land",
    section_questions: "5 Schnelle Fragen",
    q0: "Bei einer Herausforderung...", q0a1: "Analysieren", q0a2: "F\u00fchlen", q0a3: "Instinkt folgen", q0a4: "Beobachten",
    q1: "In einer Gruppe...", q1a1: "F\u00fchren", q1a2: "Zuh\u00f6ren", q1a3: "Erschaffen", q1a4: "Beobachten",
    q2: "Deine ideale Umgebung...", q2a1: "Berge", q2a2: "Ozean", q2a3: "Stadt", q2a4: "Wald",
    q3: "Du l\u00e4dst auf durch...", q3a1: "Einsamkeit", q3a2: "Freunde", q3a3: "Abenteuer", q3a4: "Kreativit\u00e4t",
    q4: "Was zieht dich am meisten an?", q4a1: "Wahrheit", q4a2: "Sch\u00f6nheit", q4a3: "Macht", q4a4: "Harmonie",
    focus_q: "Was besch\u00e4ftigt dich gerade?",
    focus_love: "Liebe", focus_work: "Arbeit", focus_money: "Geld", focus_health: "Gesundheit", focus_purpose: "Sinn",
    cta_reveal: "Mein Kosmisches Profil Enth\u00fcllen",
    teaser_msg: "Eine Botschaft wartet auf dich...", teaser_sub: "Der Kosmos hat dir etwas zu sagen",
    hint_continue: "weiter",
    tension_label: "Es gibt eine Spannung in dir",
    today_label: "Heutige Kosmische Energie",
    full_title: "Dein Kosmischer Bauplan",
    palm_title: "Handlesung", palm_subtitle: "KI-gest\u00fctzte Handleseanalyse",
    palm_upload_text: "Tippe um Foto zu machen", palm_upload_hint: "Flache Hand, gutes Licht, Handfl\u00e4che zur Kamera",
    palm_change: "Foto \u00e4ndern", palm_cta: "Meine Hand Lesen", palm_loading: "Lese die Linien deiner Hand...",
    share_tagline: "Mehr wartet...", share_sub: "Teile dein kosmisches Profil",
    share_screenshot: "&#128248; Screenshot", share_copy: "&#128203; Kopieren", share_native: "&#128228; Teilen",
    restart: "Neue Lesung",
    loading_msgs: ["Befrage die Sterne...","Lese deine numerologische Signatur...","Richte himmlische Muster aus...","Kanalisiere uralte Weisheit...","Webe deinen kosmischen Wandteppich...","Fast fertig..."],
    focus_labels: {love:"Deine Liebes-Lesung",work:"Deine Karriere-Lesung",money:"Deine Wohlstands-Lesung",health:"Deine Gesundheits-Lesung",purpose:"Deine Sinn-Lesung"},
    sec_numerology:"Numerologie",sec_astrology:"Westliche Astrologie",sec_chinese:"Chinesisches Tierkreiszeichen",
    sec_biorhythm:"Biorhythmus (Heute)",sec_celtic:"Keltischer Baum",sec_mayan:"Maya Tzolkin",sec_aura:"Aura & Handarch\u00e4typ",
  },
  ja: {
    subtitle: "8\u3064\u306e\u53e4\u4ee3\u5360\u3044\u30b7\u30b9\u30c6\u30e0\u30021\u3064\u306e\u5b87\u5b99\u30ea\u30fc\u30c7\u30a3\u30f3\u30b0\u3002AI\u642d\u8f09\u3002",
    label_name: "\u304a\u540d\u524d", ph_name: "\u30d5\u30eb\u30cd\u30fc\u30e0\u3092\u5165\u529b",
    label_email: "\u30e1\u30fc\u30eb", ph_email: "your@email.com",
    label_dob: "\u751f\u5e74\u6708\u65e5",
    toggle_optional: "+ \u51fa\u751f\u6642\u523b\u30fb\u5834\u6240\uff08\u4efb\u610f\uff09",
    label_time: "\u51fa\u751f\u6642\u523b", label_location: "\u51fa\u751f\u5730", ph_location: "\u90fd\u5e02\u540d\u3001\u56fd",
    section_questions: "5\u3064\u306e\u8cea\u554f",
    q0: "\u8ab2\u984c\u306b\u76f4\u9762\u3057\u305f\u6642\u3001\u3042\u306a\u305f\u306f...", q0a1: "\u5206\u6790\u3059\u308b", q0a2: "\u611f\u3058\u308b", q0a3: "\u672c\u80fd\u3067\u52d5\u304f", q0a4: "\u89b3\u5bdf\u3059\u308b",
    q1: "\u30b0\u30eb\u30fc\u30d7\u3067\u306f...", q1a1: "\u30ea\u30fc\u30c9", q1a2: "\u50be\u8074", q1a3: "\u5275\u9020", q1a4: "\u89b3\u5bdf",
    q2: "\u7406\u60f3\u306e\u74b0\u5883\u306f...", q2a1: "\u5c71", q2a2: "\u6d77", q2a3: "\u90fd\u5e02", q2a4: "\u68ee",
    q3: "\u5145\u96fb\u65b9\u6cd5\u306f...", q3a1: "\u5b64\u72ec", q3a2: "\u53cb\u4eba", q3a3: "\u5192\u967a", q3a4: "\u5275\u4f5c",
    q4: "\u6700\u3082\u60f9\u304b\u308c\u308b\u3082\u306e\u306f?", q4a1: "\u771f\u5b9f", q4a2: "\u7f8e", q4a3: "\u529b", q4a4: "\u8abf\u548c",
    focus_q: "\u4eca\u3001\u5fc3\u306b\u304b\u304b\u3063\u3066\u3044\u308b\u3053\u3068\u306f\uff1f",
    focus_love: "\u604b\u611b", focus_work: "\u4ed5\u4e8b", focus_money: "\u304a\u91d1", focus_health: "\u5065\u5eb7", focus_purpose: "\u4f7f\u547d",
    cta_reveal: "\u5b87\u5b99\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u3092\u660e\u304b\u3059",
    teaser_msg: "\u30e1\u30c3\u30bb\u30fc\u30b8\u304c\u5f85\u3063\u3066\u3044\u307e\u3059...", teaser_sub: "\u5b87\u5b99\u304c\u4f55\u304b\u3092\u4f1d\u3048\u305f\u3044",
    hint_continue: "\u7d9a\u304f",
    tension_label: "\u3042\u306a\u305f\u306e\u4e2d\u306b\u7dca\u5f35\u304c\u3042\u308a\u307e\u3059",
    today_label: "\u4eca\u65e5\u306e\u5b87\u5b99\u30a8\u30cd\u30eb\u30ae\u30fc",
    full_title: "\u3042\u306a\u305f\u306e\u5b87\u5b99\u8a2d\u8a08\u56f3",
    palm_title: "\u624b\u76f8\u5360\u3044", palm_subtitle: "AI\u624b\u76f8\u5206\u6790",
    palm_upload_text: "\u30bf\u30c3\u30d7\u3057\u3066\u64ae\u5f71\u307e\u305f\u306f\u30a2\u30c3\u30d7\u30ed\u30fc\u30c9", palm_upload_hint: "\u624b\u3092\u5e73\u3089\u306b\u3001\u826f\u3044\u5149\u3067\u3001\u624b\u306e\u3072\u3089\u3092\u30ab\u30e1\u30e9\u306b",
    palm_change: "\u5199\u771f\u3092\u5909\u66f4", palm_cta: "\u624b\u76f8\u3092\u8aad\u3080", palm_loading: "\u624b\u306e\u7dda\u3092\u8aad\u3093\u3067\u3044\u307e\u3059...",
    share_tagline: "\u307e\u3060\u7d9a\u304d\u304c...", share_sub: "\u5b87\u5b99\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u3092\u53cb\u4eba\u3068\u5171\u6709",
    share_screenshot: "&#128248; \u30b9\u30af\u30ea\u30fc\u30f3\u30b7\u30e7\u30c3\u30c8", share_copy: "&#128203; \u30b3\u30d4\u30fc", share_native: "&#128228; \u5171\u6709",
    restart: "\u5225\u306e\u30ea\u30fc\u30c7\u30a3\u30f3\u30b0\u3092\u53d6\u5f97",
    loading_msgs: ["\u661f\u306b\u76f8\u8ac7\u4e2d...","\u6570\u79d8\u8853\u306e\u7f72\u540d\u3092\u8aad\u3093\u3067\u3044\u307e\u3059...","\u5929\u4f53\u306e\u30d1\u30bf\u30fc\u30f3\u3092\u6574\u5408\u4e2d...","\u53e4\u4ee3\u306e\u77e5\u6167\u3092\u30c1\u30e3\u30cd\u30ea\u30f3\u30b0...","\u3042\u306a\u305f\u306e\u5b87\u5b99\u306e\u30bf\u30da\u30b9\u30c8\u30ea\u30fc\u3092\u7e54\u3063\u3066\u3044\u307e\u3059...","\u3082\u3046\u3059\u3050..."],
    focus_labels: {love:"\u604b\u611b\u306e\u30ea\u30fc\u30c7\u30a3\u30f3\u30b0",work:"\u30ad\u30e3\u30ea\u30a2\u306e\u30ea\u30fc\u30c7\u30a3\u30f3\u30b0",money:"\u8c4a\u304b\u3055\u306e\u30ea\u30fc\u30c7\u30a3\u30f3\u30b0",health:"\u5065\u5eb7\u306e\u30ea\u30fc\u30c7\u30a3\u30f3\u30b0",purpose:"\u4f7f\u547d\u306e\u30ea\u30fc\u30c7\u30a3\u30f3\u30b0"},
    sec_numerology:"\u6570\u79d8\u8853",sec_astrology:"\u897f\u6d0b\u5360\u661f\u8853",sec_chinese:"\u5341\u4e8c\u652f",
    sec_biorhythm:"\u30d0\u30a4\u30aa\u30ea\u30ba\u30e0\uff08\u4eca\u65e5\uff09",sec_celtic:"\u30b1\u30eb\u30c8\u306e\u6728",sec_mayan:"\u30de\u30e4\u30c4\u30a9\u30eb\u30ad\u30f3",sec_aura:"\u30aa\u30fc\u30e9\u3068\u624b\u76f8\u30a2\u30fc\u30ad\u30bf\u30a4\u30d7",
  },
  ko: {
    subtitle: "8\uac1c\uc758 \uace0\ub300 \uc810\uc220 \uc2dc\uc2a4\ud15c. 1\uac1c\uc758 \uc6b0\uc8fc \ub9ac\ub529. AI \uae30\ubc18.",
    label_name: "\uc774\ub984", ph_name: "\uc804\uccb4 \uc774\ub984 \uc785\ub825",
    label_email: "\uc774\uba54\uc77c", ph_email: "your@email.com",
    label_dob: "\uc0dd\ub144\uc6d4\uc77c",
    toggle_optional: "+ \ucd9c\uc0dd \uc2dc\uac04 \ubc0f \uc7a5\uc18c (\uc120\ud0dd)",
    label_time: "\ucd9c\uc0dd \uc2dc\uac04", label_location: "\ucd9c\uc0dd \uc7a5\uc18c", ph_location: "\ub3c4\uc2dc, \uad6d\uac00",
    section_questions: "5\uac00\uc9c0 \uc9c8\ubb38",
    q0: "\ub3c4\uc804\uc5d0 \uc9c1\uba74\ud588\uc744 \ub54c...", q0a1: "\ubd84\uc11d", q0a2: "\ub290\ub08c", q0a3: "\ubcf8\ub2a5", q0a4: "\uad00\ucc30",
    q1: "\uadf8\ub8f9\uc5d0\uc11c...", q1a1: "\ub9ac\ub4dc", q1a2: "\uacbd\uccad", q1a3: "\ucc3d\uc870", q1a4: "\uad00\ucc30",
    q2: "\uc774\uc0c1\uc801\uc778 \ud658\uacbd...", q2a1: "\uc0b0", q2a2: "\ubc14\ub2e4", q2a3: "\ub3c4\uc2dc", q2a4: "\uc232",
    q3: "\ucda9\uc804 \ubc29\ubc95...", q3a1: "\uace0\ub3c5", q3a2: "\uce5c\uad6c", q3a3: "\ubaa8\ud5d8", q3a4: "\ucc3d\uc791",
    q4: "\uac00\uc7a5 \ub04c\ub9ac\ub294 \uac83\uc740?", q4a1: "\uc9c4\uc2e4", q4a2: "\uc544\ub984\ub2e4\uc6c0", q4a3: "\ud798", q4a4: "\uc870\ud654",
    focus_q: "\uc9c0\uae08 \ub9c8\uc74c\uc5d0 \ubb34\uac70\uc6b4 \uac83\uc740?",
    focus_love: "\uc0ac\ub791", focus_work: "\uc77c", focus_money: "\ub3c8", focus_health: "\uac74\uac15", focus_purpose: "\ubaa9\uc801",
    cta_reveal: "\ub098\uc758 \uc6b0\uc8fc \ud504\ub85c\ud544 \uacf5\uac1c",
    teaser_msg: "\uba54\uc2dc\uc9c0\uac00 \uae30\ub2e4\ub9ac\uace0 \uc788\uc2b5\ub2c8\ub2e4...", teaser_sub: "\uc6b0\uc8fc\uac00 \ub9d0\ud558\uace0 \uc2f6\uc740 \uac83\uc774 \uc788\uc2b5\ub2c8\ub2e4",
    hint_continue: "\uacc4\uc18d",
    tension_label: "\ub2f9\uc2e0 \uc548\uc5d0 \uae34\uc7a5\uc774 \uc788\uc2b5\ub2c8\ub2e4",
    today_label: "\uc624\ub298\uc758 \uc6b0\uc8fc \uc5d0\ub108\uc9c0",
    full_title: "\ub2f9\uc2e0\uc758 \uc6b0\uc8fc \uc124\uacc4\ub3c4",
    palm_title: "\uc190\uae08 \uc77d\uae30", palm_subtitle: "AI \uc190\uae08 \ubd84\uc11d",
    palm_upload_text: "\ud0ed\ud558\uc5ec \ucd2c\uc601 \ub610\ub294 \uc5c5\ub85c\ub4dc", palm_upload_hint: "\ud3b8 \uc190, \uc88b\uc740 \uc870\uba85, \uc190\ubc14\ub2e5\uc744 \uce74\uba54\ub77c\ub85c",
    palm_change: "\uc0ac\uc9c4 \ubcc0\uacbd", palm_cta: "\ub0b4 \uc190\uae08 \uc77d\uae30", palm_loading: "\uc190\uc758 \uc120\uc744 \uc77d\uace0 \uc788\uc2b5\ub2c8\ub2e4...",
    share_tagline: "\ub354 \ub9ce\uc740 \uac83\uc774 \uae30\ub2e4\ub9bd\ub2c8\ub2e4...", share_sub: "\uce5c\uad6c\uc640 \uc6b0\uc8fc \ud504\ub85c\ud544 \uacf5\uc720",
    share_screenshot: "&#128248; \uc2a4\ud06c\ub9b0\uc0f7", share_copy: "&#128203; \ubcf5\uc0ac", share_native: "&#128228; \uacf5\uc720",
    restart: "\ub2e4\ub978 \ub9ac\ub529 \ubc1b\uae30",
    loading_msgs: ["\ubcc4\uc5d0\uac8c \ubb3b\uace0 \uc788\uc2b5\ub2c8\ub2e4...","\uc218\ube44\ud559 \uc11c\uba85\uc744 \uc77d\uace0 \uc788\uc2b5\ub2c8\ub2e4...","\ucc9c\uccb4 \ud328\ud134\uc744 \uc815\ub82c\ud558\uace0 \uc788\uc2b5\ub2c8\ub2e4...","\uace0\ub300 \uc9c0\ud61c\ub97c \ucc44\ub110\ub9c1...","\uac70\uc758 \ub2e4 \ub418\uc5c8\uc2b5\ub2c8\ub2e4..."],
    focus_labels: {love:"\uc0ac\ub791 \ub9ac\ub529",work:"\ucee4\ub9ac\uc5b4 \ub9ac\ub529",money:"\ud48d\uc694 \ub9ac\ub529",health:"\uac74\uac15 \ub9ac\ub529",purpose:"\ubaa9\uc801 \ub9ac\ub529"},
    sec_numerology:"\uc218\ube44\ud559",sec_astrology:"\uc11c\uc591 \uc810\uc131\uc220",sec_chinese:"\ub744",
    sec_biorhythm:"\ubc14\uc774\uc624\ub9ac\ub4ec (\uc624\ub298)",sec_celtic:"\ucf08\ud2b8 \ub098\ubb34",sec_mayan:"\ub9c8\uc57c \ucd08\ub974\ud0a8",sec_aura:"\uc624\ub77c \ubc0f \uc190\uae08 \uc544\ud0a4\ud0c0\uc785",
  },
  zh: {
    subtitle: "8\u5927\u53e4\u4ee3\u5360\u535c\u7cfb\u7edf\u30021\u4e2a\u5b87\u5b99\u89e3\u8bfb\u3002AI\u9a71\u52a8\u3002",
    label_name: "\u4f60\u7684\u540d\u5b57", ph_name: "\u8f93\u5165\u4f60\u7684\u5168\u540d",
    label_email: "\u4f60\u7684\u90ae\u7bb1", ph_email: "your@email.com",
    label_dob: "\u51fa\u751f\u65e5\u671f",
    toggle_optional: "+ \u51fa\u751f\u65f6\u95f4\u548c\u5730\u70b9\uff08\u53ef\u9009\uff09",
    label_time: "\u51fa\u751f\u65f6\u95f4", label_location: "\u51fa\u751f\u5730\u70b9", ph_location: "\u57ce\u5e02\uff0c\u56fd\u5bb6",
    section_questions: "5\u4e2a\u5feb\u901f\u95ee\u9898",
    q0: "\u9762\u5bf9\u6311\u6218\u65f6\uff0c\u4f60...", q0a1: "\u5206\u6790", q0a2: "\u611f\u53d7", q0a3: "\u672c\u80fd\u884c\u52a8", q0a4: "\u89c2\u5bdf\u7b49\u5f85",
    q1: "\u5728\u56e2\u4f53\u4e2d\uff0c\u4f60...", q1a1: "\u5f15\u9886", q1a2: "\u503e\u542c", q1a3: "\u521b\u9020", q1a4: "\u89c2\u5bdf",
    q2: "\u7406\u60f3\u73af\u5883...", q2a1: "\u5c71\u8109", q2a2: "\u6d77\u6d0b", q2a3: "\u57ce\u5e02", q2a4: "\u68ee\u6797",
    q3: "\u4f60\u7684\u5145\u7535\u65b9\u5f0f...", q3a1: "\u72ec\u5904", q3a2: "\u670b\u53cb", q3a3: "\u5192\u9669", q3a4: "\u521b\u4f5c",
    q4: "\u6700\u5438\u5f15\u4f60\u7684\u662f?", q4a1: "\u771f\u7406", q4a2: "\u7f8e", q4a3: "\u529b\u91cf", q4a4: "\u548c\u8c10",
    focus_q: "\u73b0\u5728\u4f60\u5fc3\u91cc\u6700\u7262\u8bb0\u7684\u662f\u4ec0\u4e48\uff1f",
    focus_love: "\u7231\u60c5", focus_work: "\u5de5\u4f5c", focus_money: "\u8d22\u5bcc", focus_health: "\u5065\u5eb7", focus_purpose: "\u4f7f\u547d",
    cta_reveal: "\u63ed\u793a\u6211\u7684\u5b87\u5b99\u6863\u6848",
    teaser_msg: "\u6709\u4e00\u6761\u4fe1\u606f\u5728\u7b49\u4f60...", teaser_sub: "\u5b87\u5b99\u6709\u8bdd\u8981\u8bf4",
    hint_continue: "\u7ee7\u7eed",
    tension_label: "\u4f60\u5185\u5fc3\u6709\u4e00\u79cd\u5f20\u529b",
    today_label: "\u4eca\u5929\u7684\u5b87\u5b99\u80fd\u91cf",
    full_title: "\u4f60\u7684\u5b87\u5b99\u84dd\u56fe",
    palm_title: "\u624b\u76f8\u89e3\u8bfb", palm_subtitle: "AI\u624b\u76f8\u5206\u6790",
    palm_upload_text: "\u70b9\u51fb\u62cd\u7167\u6216\u4e0a\u4f20", palm_upload_hint: "\u624b\u638c\u5e73\u653e\uff0c\u5149\u7ebf\u826f\u597d\uff0c\u638c\u5fc3\u5bf9\u7740\u955c\u5934",
    palm_change: "\u66f4\u6362\u7167\u7247", palm_cta: "\u89e3\u8bfb\u6211\u7684\u624b\u76f8", palm_loading: "\u6b63\u5728\u89e3\u8bfb\u4f60\u624b\u4e0a\u7684\u7ebf\u6761...",
    share_tagline: "\u8fd8\u6709\u66f4\u591a...", share_sub: "\u4e0e\u670b\u53cb\u5206\u4eab\u4f60\u7684\u5b87\u5b99\u6863\u6848",
    share_screenshot: "&#128248; \u622a\u56fe", share_copy: "&#128203; \u590d\u5236", share_native: "&#128228; \u5206\u4eab",
    restart: "\u83b7\u53d6\u53e6\u4e00\u6b21\u89e3\u8bfb",
    loading_msgs: ["\u6b63\u5728\u54a8\u8be2\u661f\u8fb0...","\u8bfb\u53d6\u4f60\u7684\u6570\u5b57\u7b7e\u540d...","\u5bf9\u9f50\u5929\u4f53\u6a21\u5f0f...","\u5f15\u5bfc\u53e4\u4ee3\u667a\u6167...","\u7f16\u7ec7\u4f60\u7684\u5b87\u5b99\u7ec7\u9526...","\u5373\u5c06\u5b8c\u6210..."],
    focus_labels: {love:"\u7231\u60c5\u89e3\u8bfb",work:"\u4e8b\u4e1a\u89e3\u8bfb",money:"\u8d22\u5bcc\u89e3\u8bfb",health:"\u5065\u5eb7\u89e3\u8bfb",purpose:"\u4f7f\u547d\u89e3\u8bfb"},
    sec_numerology:"\u6570\u5b57\u547d\u7406\u5b66",sec_astrology:"\u897f\u65b9\u5360\u661f\u672f",sec_chinese:"\u751f\u8096",
    sec_biorhythm:"\u751f\u7269\u8282\u5f8b\uff08\u4eca\u5929\uff09",sec_celtic:"\u51ef\u5c14\u7279\u6811",sec_mayan:"\u739b\u96c5\u5353\u5c14\u91d1",sec_aura:"\u5149\u73af\u4e0e\u638c\u7eb9\u539f\u578b",
  },
};

/* ════════════════════════════════════════════════════════════════
   FIREBASE CONFIG
   ════════════════════════════════════════════════════════════════ */
const firebaseConfig = {
  apiKey: "AIzaSyB7IWdQPhGG2ZIG-ZNg7DVimV86aTaJXHU",
  authDomain: "fredfix.firebaseapp.com",
  projectId: "fredfix",
  storageBucket: "fredfix.firebasestorage.app",
  messagingSenderId: "650169261019",
  appId: "1:650169261019:web:e5fa6e19859aa993eca5fe",
  measurementId: "G-ZWL1PFRZG3",
};
firebase.initializeApp(firebaseConfig);
const fbAuth = firebase.auth();
const fbDb = firebase.firestore();

/* ════════════════════════════════════════════════════════════════
   GLOBAL STATE
   ════════════════════════════════════════════════════════════════ */
let currentLang = 'en';
let answers = [0,0,0,0,0];
let focusArea = '';
let palmFile = null;
let readingData = null;
let currentUser = null;        // Firebase user object
let userProfile = null;        // Firestore profile document
let isAuthMode = 'signup';     // 'signup' or 'signin'
let freeTrialMode = false;     // legacy — always false (account required)
let signupBannerDismissed = false;
let _currentAvatarBase64 = null;

const langFlags = [
  {code:'en',flag:'\ud83c\uddfa\ud83c\uddf8',label:'EN'},
  {code:'es',flag:'\ud83c\uddea\ud83c\uddf8',label:'ES'},
  {code:'fr',flag:'\ud83c\uddeb\ud83c\uddf7',label:'FR'},
  {code:'pt',flag:'\ud83c\udde7\ud83c\uddf7',label:'PT'},
  {code:'de',flag:'\ud83c\udde9\ud83c\uddea',label:'DE'},
  {code:'ja',flag:'\ud83c\uddef\ud83c\uddf5',label:'JA'},
  {code:'ko',flag:'\ud83c\uddf0\ud83c\uddf7',label:'KO'},
  {code:'zh',flag:'\ud83c\udde8\ud83c\uddf3',label:'ZH'},
];

/* ════════════════════════════════════════════════════════════════
   LANGUAGE HELPERS
   ════════════════════════════════════════════════════════════════ */
function buildLangBar() {
  const bar = document.getElementById('langBar');
  bar.innerHTML = langFlags.map(l =>
    `<button class="lang-btn${l.code === currentLang ? ' active' : ''}" onclick="setLang('${l.code}')">${l.flag} ${l.label}</button>`
  ).join('');
}

function setLang(code) {
  currentLang = code;
  buildLangBar();
  applyTranslations();
}

function t(key) {
  return (translations[currentLang] && translations[currentLang][key]) || translations.en[key] || key;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (val) el.innerHTML = val;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const val = t(key);
    if (val) el.placeholder = val;
  });
}
