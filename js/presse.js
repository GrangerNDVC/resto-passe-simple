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
  ];
  const PAR_DEFAUT = ["il chanta", "nous mangeâmes", "ils finirent"];       // si le joueur n'a pas encore servi assez de verbes
  (typeof window !== "undefined" ? window : globalThis).PRESSE = { JOURNAL, CRITIQUE, ARTICLES, PAR_DEFAUT };
})();
