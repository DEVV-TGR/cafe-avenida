/**
 * Configuração do café — editar apenas este ficheiro (e menu.json / imagens) para outro estabelecimento.
 * @type {import('./js/types').CafeConfig}
 */
window.CAFE_CONFIG = {
  name: "Café Avenida",
  logo: {
    src: "images/logo-320.png",
    alt: "Café Avenida",
  },
  areaLabel: {
    pt: "Alpendurada · Marco de Canaveses",
    en: "Alpendurada · Marco de Canaveses", fr: "Alpendurada · Marco de Canaveses",
  },
  tagline: {
    pt: "Café, pequenos-almoços, refeições e petiscos num espaço acolhedor na Avenida.",
    en: "Coffee, breakfast, meals and snacks in a welcoming spot on the Avenida.", fr: "Café, petits-déjeuners, repas et en-cas dans un lieu chaleureux sur l’Avenida.",
  },
  about: {
    pt: "Na Avenida, em Alpendurada, o dia começa com um café bem tirado e acaba com um petisco entre amigos. Pelo meio, refeições caseiras, o jogo na televisão e a simpatia de quem gosta de receber.",
    en: "On the Avenida in Alpendurada, the day starts with a well-pulled coffee and ends with snacks among friends. In between, home-style meals, the match on TV and the warmth of people who love to welcome you.", fr: "Sur l’Avenida, à Alpendurada, la journée commence par un bon café et se termine par un en-cas entre amis. Entre les deux, des repas faits maison, le match à la télévision et le plaisir de vous accueillir.",
  },
  /** Email real do café; vazio esconde o contacto (não usar endereços de exemplo: o domínio pode receber o correio). */
  email: "avenidacafealp@gmail.com",
  phone: "+351255619414",
  phoneDisplay: "255 619 414",
  address: {
    street: "Av. Francisco Sá Carneiro 760",
    postalCode: "4575-052",
    city: "Alpendurada e Matos",
    country: "PT",
    full: "Av. Francisco Sá Carneiro 760, 4575-052 Alpendurada e Matos",
  },
  /** Café Avenida — Av. Francisco Sá Carneiro 760 (OpenStreetMap / Google) */
  coordinates: {
    lat: 41.08755,
    lng: -8.2481,
  },
  map: {
    image: "mapa/alpendurada.svg",
    pinPosition: { x: "58%", y: "52%" },
    alt: {
      pt: "Mapa ilustrado da zona do Café Avenida",
      en: "Illustrated map of the Café Avenida area", fr: "Carte illustrée des environs du Café Avenida",
    },
  },
  /** Domínio público do site (sem barra final) — usado em QR codes e meta tags */
  domain: "https://avenidacafe.pt",
  /** Imagem de partilha 1200×630 (gerada por scripts/otimizar-imagens.mjs a partir do hero). */
  shareImage: "images/partilha.jpg",
  /** Dados para o Google (JSON-LD): gama de preços e tipo de cozinha. */
  priceRange: "€",
  servesCuisine: "Portuguesa",
  social: {
    instagram: "https://www.instagram.com/cafeavenidasnack/",
    facebook: "https://www.facebook.com/AvenidaCafeBar/",
  },
  colors: {
    primary: "#D4A85A",
    secondary: "#4A382C",
    accent: "#9A7355",
    background: "#DAD2C6",
    text: "#3D3229",
    surface: "#EBE5DC",
  },
  /**
   * Horário por dia (0 = domingo … 6 = sábado, alinhado com Date.getDay()).
   * closeNextDay: true quando o encerramento é na madrugada do dia seguinte.
   */
  openingHours: {
    0: { open: "08:00", close: "01:00", closeNextDay: true },
    1: null,
    2: { open: "08:00", close: "01:00", closeNextDay: true },
    3: { open: "08:00", close: "01:00", closeNextDay: true },
    4: { open: "08:00", close: "01:00", closeNextDay: true },
    5: { open: "08:00", close: "03:00", closeNextDay: true },
    6: { open: "08:00", close: "03:00", closeNextDay: true },
  },
  media: {
    hero: {
      image: "images/88939391-3819-49a1-8059-53c54fed2bff.JPG",
      alt: {
        pt: "Interior acolhedor do café com mesas de madeira e iluminação suave",
        en: "Welcoming café interior with wooden tables and soft lighting", fr: "Intérieur chaleureux du café avec tables en bois et éclairage doux",
      },
    },
    /** Só fotografias do espaço (sem ementa, pratos nem vídeo). */
    gallery: [
      {
        type: "image",
        src: "images/97b00278-11d0-45e4-99b9-b783c8a5b37b.JPG",
        alt: { pt: "Salão com mesas de madeira e vista para a rua", en: "Dining room with wooden tables and street view", fr: "Salle avec tables en bois et vue sur la rue" },
      },
      {
        type: "image",
        src: "images/45e1f50a-d92d-4de1-b2a4-0a67cc43b04e.JPG",
        alt: { pt: "Logótipo do Café Avenida iluminado na parede", en: "Illuminated Café Avenida logo on the wall", fr: "Logo lumineux du Café Avenida au mur" },
      },
      {
        type: "image",
        src: "images/2711e9de-d12e-42ec-845a-2273c178a281.JPG",
        alt: { pt: "Balcão em azulejo verde com iluminação", en: "Green-tiled counter with lighting", fr: "Comptoir en carreaux verts éclairé" },
      },
      {
        type: "image",
        src: "images/8bd4af37-b7bb-4681-8240-f76e725bbf6b.JPG",
        alt: { pt: "Bancos corridos junto ao mural floral", en: "Bench seating by the floral mural", fr: "Banquettes près de la fresque florale" },
      },
      {
        type: "image",
        src: "images/5bb570ed-bfd8-4d96-90cf-05ef3375b6bd.JPG",
        alt: { pt: "Prateleiras iluminadas com garrafas", en: "Lit shelves with bottles", fr: "Étagères illuminées avec bouteilles" },
      },
      {
        type: "image",
        src: "images/0d743509-2ba2-43fc-b185-da6ae94f1041.JPG",
        alt: { pt: "Sala com mesas e balcão ao fundo", en: "Room with tables and the counter behind", fr: "Salle avec tables et comptoir au fond" },
      },
      {
        type: "image",
        src: "images/27fa2654-413e-4606-a3bb-50da93e5b9dc.JPG",
        alt: { pt: "Mesas junto à parede com mural", en: "Tables along the mural wall", fr: "Tables le long de la fresque murale" },
      },
      {
        type: "image",
        src: "images/d6657f57-90a3-48db-89b8-4530c93df692.JPG",
        alt: { pt: "Vista geral da sala até ao balcão", en: "Overview of the room towards the counter", fr: "Vue de la salle vers le comptoir" },
      },
      {
        type: "image",
        src: "images/27a76e09-8d58-4fcf-9c90-6948e6c0efc5.JPG",
        alt: { pt: "Detalhe do balcão com vitrine", en: "Counter detail with display case", fr: "Détail du comptoir avec vitrine" },
      },
      {
        type: "image",
        src: "images/3ef8d510-483a-4818-9733-e337667c043c.JPG",
        alt: { pt: "Bancos e candeeiros suspensos", en: "Benches and pendant lamps", fr: "Banquettes et suspensions" },
      },
      {
        type: "image",
        src: "images/0d948093-b9bb-4168-832d-5b993c43892b.JPG",
        alt: { pt: "Parede de azulejo verde no corredor", en: "Green tile wall in the corridor", fr: "Mur de carreaux verts dans le couloir" },
      },
      {
        type: "image",
        src: "images/a169a77e-964b-42e6-916b-808659173b8c.JPG",
        alt: { pt: "Mesas junto ao mural", en: "Tables by the mural", fr: "Tables près de la fresque" },
      },
      {
        type: "image",
        src: "images/4d84df99-7dfb-42b4-9327-dfc18da991e4.JPG",
        alt: { pt: "Sala com floreiras e candeeiros", en: "Room with planters and lamps", fr: "Salle avec jardinières et luminaires" },
      },
      {
        type: "image",
        src: "images/c29b7af7-8369-42fd-a7b7-22101a3b6d4a.JPG",
        alt: { pt: "Corredor com garrafeira iluminada", en: "Corridor with lit wine display", fr: "Couloir avec cave à vin éclairée" },
      },
      {
        type: "image",
        src: "images/7390af13-76f1-4b95-9907-d18f478198c0.JPG",
        alt: { pt: "Mesas e candeeiros suspensos", en: "Tables and pendant lamps", fr: "Tables et suspensions" },
      },
      {
        type: "image",
        src: "images/2c1d95d0-d2ef-4efb-86ef-1d7dfb8e187f.JPG",
        alt: { pt: "Balcão em azulejo verde iluminado", en: "Lit green-tiled counter", fr: "Comptoir lumineux en carreaux verts" },
      },
      {
        type: "image",
        src: "images/33a5edff-387e-49d6-b103-fe3325cfb425.JPG",
        alt: { pt: "Sala com mesas e floreiras", en: "Room with tables and planters", fr: "Salle avec tables et jardinières" },
      },
      {
        type: "image",
        src: "images/eaede5e1-0c6c-470b-ab46-5e9c166d7ef3.JPG",
        alt: { pt: "Entrada e corredor", en: "Entrance and corridor", fr: "Entrée et couloir" },
      },
      {
        type: "image",
        src: "images/4246467f-69b2-4d67-b04c-c443ed385b47.JPG",
        alt: { pt: "Mesas junto às janelas", en: "Tables by the windows", fr: "Tables près des fenêtres" },
      },
      {
        type: "image",
        src: "images/c8b54b91-0967-413f-8d3b-4035be5596d3.JPG",
        alt: { pt: "Sala com floreiras e televisão", en: "Room with planters and TV", fr: "Salle avec jardinières et télévision" },
      },
      {
        type: "image",
        src: "images/28fe4023-2078-445b-8b1a-cbba9c7b72b2.JPG",
        alt: { pt: "Balcão e mesas de apoio", en: "Counter and side tables", fr: "Comptoir et tables d’appoint" },
      },
      {
        type: "image",
        src: "images/f3cef86a-d2c8-488b-8970-07e3ee72a3aa.JPG",
        alt: { pt: "Mesas com floreiras", en: "Tables with planters", fr: "Tables avec jardinières" },
      },
      {
        type: "image",
        src: "images/88939391-3819-49a1-8059-53c54fed2bff.JPG",
        alt: { pt: "Salão principal", en: "Main dining room", fr: "Salle principale" },
      },
    ],
  },
  /** Dados do Google Maps (atualizar à mão). */
  googleReviews: {
    rating: 4.4,
    count: 259,
    placeId: "ChIJx7Lgu_ObJA0RNkcl-poQ5Dk",
  },
  /** Críticas do Google; sem rating, as estrelas não aparecem. */
  reviews: [
    {
      rating: 5,
      author: "At Home Finance France",
      text: {
        pt: "Um restaurante excelente! O espaço é muito limpo, os pratos são deliciosos e muito bem apresentados. O pessoal é de uma simpatia rara, acolhedor e sorridente. Sentimo-nos mesmo bem aqui — recomendo vivamente!",
        en: "An excellent restaurant! The place is very clean, the dishes are delicious and beautifully presented. The staff are exceptionally kind, welcoming and smiling. You really feel at home here — highly recommended!", fr: "Un excellent restaurant ! Les lieux sont très propres, les plats délicieux et très bien présentés. Le personnel est d’une gentillesse rare, accueillant et souriant. On s’y sent vraiment bien — je recommande vivement !",
      },
    },
    {
      rating: 5,
      author: "Rogner Quintela",
      text: {
        pt: "Comida boa e ótimo atendimento. O melhor cappuccino que já bebi.",
        en: "Good food and great service. Best cappuccino I've had.", fr: "Bonne cuisine et excellent accueil. Le meilleur cappuccino que j’aie jamais bu.",
      },
    },
    {
      author: { pt: "Excertos de críticas no Google", en: "From Google reviews", fr: "Extraits d’avis Google" },
      text: {
        pt: "Bom ambiente, equipa top. Espaço elegante, ótimo para ver futebol.",
        en: "Nice atmosphere, top team. Elegant space, great for watching football.", fr: "Bonne ambiance, équipe au top. Un lieu élégant, idéal pour regarder le football.",
      },
    },
  ],
  /** Categorias das sugestões: sweet, snack, meal ou drink. featured: false aparece apenas no seletor. */
  /** imagePosition: enquadramento da foto (valor de object-position). */
  suggestions: [
    {
      category: "snack", featured: false, menuId: "pao-chourico",
      name: { pt: "Pão com chouriço", en: "Chouriço bread", fr: "Pain au chouriço" },
      description: { pt: "Uma opção simples para petiscar.", en: "A simple bite to eat.", fr: "Une petite pause gourmande." }
    },
    {
      category: "snack", featured: false, menuId: "pao-alho-bacon-queijo",
      name: { pt: "Pão de alho, bacon e queijo", en: "Garlic bread, bacon and cheese", fr: "Pain à l’ail, au bacon et au fromage" },
      description: { pt: "Para quando apetece um snack salgado.", en: "For when you fancy a savoury snack.", fr: "Pour une envie de snack salé." }
    },
    {
      category: "snack", featured: false, menuId: "bolas-alheira",
      name: { pt: "Bolas de alheira", en: "Alheira sausage balls", fr: "Boulettes d’alheira" },
      description: { pt: "Uma entrada para começar ou partilhar.", en: "A starter to enjoy or share.", fr: "Une entrée à déguster ou à partager." }
    },
    {
      category: "sweet", featured: false, menuId: "crepes-crepe-avenida",
      name: { pt: "Crepe Avenida", en: "Avenida crêpe", fr: "Crêpe Avenida" },
      description: { pt: "Nutella, morangos e banana.", en: "Nutella, strawberries and banana.", fr: "Nutella, fraises et banane." }
    },
    {
      category: "drink", featured: false, menuId: "cafetaria-cappuccino-grande",
      name: { pt: "Cappuccino grande", en: "Large cappuccino", fr: "Grand cappuccino" },
      description: { pt: "Uma pausa com um cappuccino.", en: "Take a break with a cappuccino.", fr: "Une pause autour d’un cappuccino." }
    },
    {
      name: { pt: "Espetadinha do Mar", en: "Seafood skewer", fr: "Brochette de la mer" },
      menuId: "espetada-mar",
      description: {
        pt: "Camarão, lulas e legumes grelhados, servida no espeto suspenso.",
        en: "Grilled prawns, squid and vegetables, served on a hanging skewer.", fr: "Crevettes, calamars et légumes grillés, servis sur une brochette suspendue.",
      },
      image: "images/72a46fa8-8dee-4799-8f0f-1dbab267ffb4.JPG",
      imagePosition: "center 50%",
      category: "meal",
    },
    {
      name: { pt: "Naco de Carne", en: "Beef steak", fr: "Pavé de bœuf" },
      menuId: "naco-carne",
      description: {
        pt: "Naco grelhado no ponto, suculento e cheio de sabor.",
        en: "Grilled to order — juicy and full of flavour.", fr: "Grillé à votre goût, juteux et plein de saveur.",
      },
      image: "images/3093472a-3822-42c9-b2d6-0d08839e3046.JPG",
      imagePosition: "center 45%",
      category: "meal",
    },
    {
      name: { pt: "Espetada de Alcatra", en: "Rump steak skewer", fr: "Brochette de rumsteck" },
      menuId: "espetada-alcatra",
      description: {
        pt: "Alcatra grelhada no espeto, com batata frita e salada.",
        en: "Grilled rump steak skewer with fries and salad.", fr: "Rumsteck grillé en brochette, accompagné de frites et de salade.",
      },
      image: "images/espetada-alcatra.jpg",
      imagePosition: "center 35%",
      category: "meal",
    },
  ],
};
