// Le guide gourmand : les articles de presse affichés à chaque palier (mention, 1, 2 puis 3 étoiles).
// Tout est écrit au passé simple (c'est le temps du récit). Julie peut modifier les textes librement :
//   {R}  = nom du restaurant (choisi par le joueur)
//   {V1} {V2} {V3} = trois formes conjuguées servies pendant la partie (ex. « ils chantèrent »), mises en valeur dans l'article.
(function () {
  const JOURNAL = "LE GOURMET DU MATIN";
  const CRITIQUE = "Anatole Lefourchon, critique gastronomique";
  const ARTICLES = [
    {
      id: 0, etoiles: 0, rubrique: "Bonnes adresses",
      titre: "Une table à retenir !",
      chapeau: "Notre critique a poussé la porte de {R}. Il n’en est pas ressorti indifférent.",
      paragraphes: [
        "Hier soir, notre critique poussa la porte de {R}. Un serveur souriant l’accueillit, le conduisit à sa table et prit sa commande sans la moindre erreur.",
        "Dans la salle, on entendit tour à tour : {V1}, {V2} et {V3}. Chaque assiette arriva fumante, et chaque client repartit ravi.",
        "« Une adresse pleine de promesses », écrivit-il en quittant les lieux. Nous y retournerons !",
      ],
    },
    {
      id: 1, etoiles: 1, rubrique: "Le Guide gourmand",
      titre: "Première étoile pour {R} !",
      chapeau: "Le Guide gourmand vient de couronner la brigade du premier groupe.",
      paragraphes: [
        "Le Guide gourmand l’annonça ce matin : {R} décroche sa première étoile. Le chef, ému, ne put retenir ses larmes, et tout le personnel applaudit à tout rompre.",
        "Notre envoyé spécial s’installa, goûta, sourit. Il vit passer {V1}, puis {V2} ; il entendit même {V3}, tant la brigade se montra précise.",
        "« Un service d’une rare précision, conclut-il. » La cuisine du premier groupe n’eut bientôt plus de secrets pour cette maison.",
      ],
    },
    {
      id: 2, etoiles: 2, rubrique: "Le Guide gourmand",
      titre: "Deux étoiles : {R}, la révélation de l’année !",
      chapeau: "La foule se presse, les critiques se bousculent, le chef finit par sortir de sa cuisine.",
      paragraphes: [
        "Ce fut un triomphe. Dès l’ouverture, la foule se pressa devant {R}, et les critiques se bousculèrent pour réserver une table.",
        "Le chef finit par rejoindre la salle : il choisit, il réfléchit, il agit. Sous les yeux de l’inspecteur, on vit défiler {V1}, {V2} et {V3} sans la moindre hésitation.",
        "L’inspecteur applaudit, se leva et ne put s’empêcher de déclarer : « Deux étoiles ? Cette maison les mérite toutes les deux ! »",
      ],
    },
    {
      id: 3, etoiles: 3, rubrique: "Le Guide gourmand",
      titre: "Trois étoiles ! {R} entre dans la légende",
      chapeau: "Du premier groupe au troisième, plus une seule faute : le Guide n’avait jamais vu cela.",
      paragraphes: [
        "On ne vit jamais pareille unanimité. Le Guide gourmand, d’ordinaire avare de compliments, consacra {R} d’un seul mot : exceptionnel.",
        "Du premier groupe au troisième, tout y fut parfait : les clients prirent, mirent, vinrent et revinrent ; la brigade sut, put et voulut. On entendit {V1}, {V2} et {V3}, et l’on crut rêver.",
        "Le maire en personne remit au chef une toque dorée. Le chef, bouleversé, ne dit qu’une chose : « Merci à mes clients, qui ont si bien appris leurs verbes ! »",
      ],
    },
    {
      id: 4, etoiles: 3, rubrique: "Toque d’or",
      titre: "{R} : une légende de la gastronomie",
      chapeau: "Du village au Palace, la brigade a conquis toute la route. Le Guide gourmand s’incline.",
      paragraphes: [
        "On ne vit jamais pareil parcours. Partie d’un modeste bistrot de village, la maison {R} traversa la brasserie, le grand restaurant, et fit enfin son entrée au Palace, où le Tout-Paris la sacra.",
        "Au Palace, les clients ne pardonnaient rien : pourtant, on entendit {V1}, {V2} et {V3}, sans la moindre faute. Les critiques notèrent, goûtèrent, puis applaudirent.",
        "Le soir même, une équipe de télévision envahit la cuisine : le chef fut invité sur le plateau de « Toque chef ». Le Guide l’annonça d’un mot : légende.",
      ],
    },
  ];
  // L'émission « Toque chef » (chantier 7E) : une phrase à compléter, deux formes proposées (passé simple / imparfait).
  //   t = phrase (___ = le trou), ps = forme au passé simple, imp = forme à l'imparfait, bon = « ps » ou « imp » (la bonne), regle = explication affichée.
  // Julie peut ajouter des phrases : il suffit de copier une ligne. Chaque phrase doit n'avoir qu'UNE bonne réponse.
  const R_PS = "Le passé simple raconte une action précise qui fait avancer l’histoire.";
  const R_ACT = "Le passé simple sert aux actions qui s’enchaînent : l’une arrive, puis l’autre.";
  const R_DEC = "L’imparfait décrit le décor, l’ambiance, ce qui dure.";
  const R_HAB = "L’imparfait dit ce qui se répète, une habitude du passé.";
  const R_DUR = "Avec « pendant que » ou « quand », l’imparfait montre une action en train de se dérouler.";
  const EPREUVE = [
    { t: "Il pleuvait quand le critique ___ la porte du Palace.", ps: "poussa", imp: "poussait", bon: "ps", regle: "L’action de pousser la porte interrompt la pluie, qui dure : " + R_PS },
    { t: "Pendant que le chef ___ la sauce, le serveur dressait les tables.", ps: "remua", imp: "remuait", bon: "imp", regle: R_DUR },
    { t: "Dans la salle, les lustres ___ doucement.", ps: "brillèrent", imp: "brillaient", bon: "imp", regle: R_DEC },
    { t: "Soudain, un verre ___ sur le carrelage.", ps: "tomba", imp: "tombait", bon: "ps", regle: "« Soudain » annonce un événement bref : " + R_PS },
    { t: "Chaque dimanche, le grand-père ___ au village pour déjeuner.", ps: "vint", imp: "venait", bon: "imp", regle: "« Chaque dimanche » = une habitude. " + R_HAB },
    { t: "Tout à coup, le chef ___ : « Service ! »", ps: "cria", imp: "criait", bon: "ps", regle: "« Tout à coup » annonce un événement bref : " + R_PS },
    { t: "Le maire ___ une toque dorée au chef, puis tout le monde applaudit.", ps: "remit", imp: "remettait", bon: "ps", regle: R_ACT },
    { t: "Quand j’étais petit, nous ___ toujours chez ce restaurateur.", ps: "mangeâmes", imp: "mangions", bon: "imp", regle: "« Quand j’étais petit… toujours » = une habitude. " + R_HAB },
    { t: "Les clients ___ patiemment quand la cloche du passe-plats retentit.", ps: "attendirent", imp: "attendaient", bon: "imp", regle: "L’attente dure, la cloche l’interrompt. " + R_DUR },
    { t: "Il ___ la porte, salua, puis s’installa.", ps: "ouvrit", imp: "ouvrait", bon: "ps", regle: R_ACT },
    { t: "Le ciel était gris et le vent ___ fort.", ps: "souffla", imp: "soufflait", bon: "imp", regle: "C’est une description du décor, comme « le ciel était gris » : " + R_DEC },
    { t: "Le critique goûta le dessert, ___ un instant et sourit.", ps: "hésita", imp: "hésitait", bon: "ps", regle: "Les verbes « goûta », « hésita », « sourit » s’enchaînent : " + R_ACT },
    { t: "Autrefois, des charretiers ___ dans ce café de quartier.", ps: "s’arrêtèrent", imp: "s’arrêtaient", bon: "imp", regle: "« Autrefois » = une habitude. " + R_HAB },
    { t: "Au signal du chef, toute la brigade ___ en cuisine.", ps: "entra", imp: "entrait", bon: "ps", regle: "Un signal, puis une réaction immédiate : " + R_PS },
    { t: "À huit heures, il ___ déjà nuit et les lanternes éclairaient la rue.", ps: "fit", imp: "faisait", bon: "imp", regle: R_DEC },
    { t: "Elle ___ le plat sur la table, et le client la remercia.", ps: "posa", imp: "posait", bon: "ps", regle: R_ACT },
  ];
  const PAR_DEFAUT = ["il chanta", "nous mangeâmes", "ils finirent"];       // si le joueur n'a pas encore servi assez de verbes
  (typeof window !== "undefined" ? window : globalThis).PRESSE = { JOURNAL, CRITIQUE, ARTICLES, EPREUVE, PAR_DEFAUT };
})();
