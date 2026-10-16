// Test automatique de la conjugaison : compare TOUTES les formes à une table de référence saisie à la main.
// À relire par Julie : une ligne = un verbe, les 6 formes du passé simple (je, tu, il/elle/on, nous, vous, ils/elles).
// Usage : node tools/test_conjugaison.js
"use strict";
const V = require("../js/verbes.js");

const PS = {
  // niveau 1
  chanter: "chantai chantas chanta chantâmes chantâtes chantèrent",
  parler: "parlai parlas parla parlâmes parlâtes parlèrent",
  regarder: "regardai regardas regarda regardâmes regardâtes regardèrent",
  danser: "dansai dansas dansa dansâmes dansâtes dansèrent",
  jouer: "jouai jouas joua jouâmes jouâtes jouèrent",
  donner: "donnai donnas donna donnâmes donnâtes donnèrent",
  trouver: "trouvai trouvas trouva trouvâmes trouvâtes trouvèrent",
  porter: "portai portas porta portâmes portâtes portèrent",
  marcher: "marchai marchas marcha marchâmes marchâtes marchèrent",
  laver: "lavai lavas lava lavâmes lavâtes lavèrent",
  goûter: "goûtai goûtas goûta goûtâmes goûtâtes goûtèrent",
  cuisiner: "cuisinai cuisinas cuisina cuisinâmes cuisinâtes cuisinèrent",
  aimer: "aimai aimas aima aimâmes aimâtes aimèrent",
  écouter: "écoutai écoutas écouta écoutâmes écoutâtes écoutèrent",
  // niveau 2 : -ger (e devant a, â) et -cer (ç devant a, â)
  manger: "mangeai mangeas mangea mangeâmes mangeâtes mangèrent",
  ranger: "rangeai rangeas rangea rangeâmes rangeâtes rangèrent",
  nager: "nageai nageas nagea nageâmes nageâtes nagèrent",
  voyager: "voyageai voyageas voyagea voyageâmes voyageâtes voyagèrent",
  commencer: "commençai commenças commença commençâmes commençâtes commencèrent",
  lancer: "lançai lanças lança lançâmes lançâtes lancèrent",
  placer: "plaçai plaças plaça plaçâmes plaçâtes placèrent",
  avancer: "avançai avanças avança avançâmes avançâtes avancèrent",
  // niveau 3 : -ier, -uer, -éer
  crier: "criai crias cria criâmes criâtes crièrent",
  étudier: "étudiai étudias étudia étudiâmes étudiâtes étudièrent",
  remercier: "remerciai remercias remercia remerciâmes remerciâtes remercièrent",
  continuer: "continuai continuas continua continuâmes continuâtes continuèrent",
  tuer: "tuai tuas tua tuâmes tuâtes tuèrent",
  créer: "créai créas créa créâmes créâtes créèrent",
  // niveau 4 : -yer et e muet (au passé simple le radical ne change pas)
  payer: "payai payas paya payâmes payâtes payèrent",
  nettoyer: "nettoyai nettoyas nettoya nettoyâmes nettoyâtes nettoyèrent",
  essuyer: "essuyai essuyas essuya essuyâmes essuyâtes essuyèrent",
  acheter: "achetai achetas acheta achetâmes achetâtes achetèrent",
  appeler: "appelai appelas appela appelâmes appelâtes appelèrent",
  jeter: "jetai jetas jeta jetâmes jetâtes jetèrent",
  lever: "levai levas leva levâmes levâtes levèrent",
  espérer: "espérai espéras espéra espérâmes espérâtes espérèrent",
};

// Quelques formes du présent (elles servent de pièges : elles doivent être justes aussi).
const PRES = {
  nettoyer: "nettoie nettoies nettoie nettoyons nettoyez nettoient",
  payer: "paie paies paie payons payez paient",
  acheter: "achète achètes achète achetons achetez achètent",
  appeler: "appelle appelles appelle appelons appelez appellent",
  jeter: "jette jettes jette jetons jetez jettent",
  lever: "lève lèves lève levons levez lèvent",
  espérer: "espère espères espère espérons espérez espèrent",
  manger: "mange manges mange mangeons mangez mangent",
  commencer: "commence commences commence commençons commencez commencent",
  chanter: "chante chantes chante chantons chantez chantent",
};
const IMP = {
  manger: "mangeais mangeais mangeait mangions mangiez mangeaient",
  commencer: "commençais commençais commençait commencions commenciez commençaient",
  chanter: "chantais chantais chantait chantions chantiez chantaient",
  nettoyer: "nettoyais nettoyais nettoyait nettoyions nettoyiez nettoyaient",
};
const FUT = {
  chanter: "chanterai chanteras chantera chanterons chanterez chanteront",
  manger: "mangerai mangeras mangera mangerons mangerez mangeront",
  acheter: "achèterai achèteras achètera achèterons achèterez achèteront",
  appeler: "appellerai appelleras appellera appellerons appellerez appelleront",
};

let erreurs = 0, verifs = 0;
const ko = (msg) => { erreurs++; console.log("  ÉCART : " + msg); };
const egal = (a, b, msg) => { verifs++; if (a !== b) ko(msg + " — obtenu « " + a + " », attendu « " + b + " »"); };

// 1. Toutes les formes du passé simple, et tous les verbes de la liste sont dans la table
for (const v of V.VERBES) {
  if (!PS[v.inf]) { ko("verbe sans valeurs de référence : " + v.inf); continue; }
  PS[v.inf].split(" ").forEach((f, p) => egal(V.conj(v, "ps", p), f, v.inf + " passé simple p" + p));
}
for (const inf of Object.keys(PS)) if (!V.VERBES.some((v) => v.inf === inf)) ko("verbe de référence absent de la liste : " + inf);
const find = (inf) => V.VERBES.find((v) => v.inf === inf);
for (const [t, T] of [["pres", PRES], ["imp", IMP], ["fut", FUT]])
  for (const inf of Object.keys(T)) T[inf].split(" ").forEach((f, p) => egal(V.conj(find(inf), t, p), f, inf + " " + t + " p" + p));
console.log("Formes comparées à la table de référence : " + verifs + ", écarts : " + erreurs);

// 2. Générateur : 4 choix distincts, la bonne forme présente une seule fois, pas de forme vide, niveaux respectés
let seed = 12345;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
let cmds = 0;
for (let niv = 1; niv <= V.NIVEAU_MAX; niv++) {
  const vus = new Set(), fautesVues = new Set();
  for (let k = 0; k < 4000; k++) {
    const c = V.nouvelleCommande(niv, rnd); cmds++;
    const v = find(c.verbe);
    if (!v) { ko("commande sur un verbe inconnu : " + c.verbe); break; }
    if (v.niveau > niv) ko("verbe de niveau " + v.niveau + " proposé au niveau " + niv + " : " + v.inf);
    if (c.choix.length !== 4 || new Set(c.choix).size !== 4) ko("choix non distincts : " + JSON.stringify(c.choix));
    if (c.choix.filter((x) => x === c.bonne).length !== 1) ko("bonne forme absente ou en double : " + JSON.stringify(c));
    if (c.choix.some((x) => !x || /\s/.test(x))) ko("forme vide ou avec espace : " + JSON.stringify(c.choix));
    egal(c.bonne, V.conj(v, "ps", c.p), "bonne forme de la commande " + c.verbe);
    if (c.pronom === "J’" && !v.voyelle) ko("élision à tort : " + c.verbe);
    if (c.pronom === "Je" && v.voyelle) ko("élision oubliée : " + c.verbe);
    if (niv === 1 && c.choix.some((x) => V.fautes(v, c.p, 1).includes(x))) ko("faute d'orthographe au niveau 1");
    for (const f of V.fautes(v, c.p, niv)) if (c.choix.includes(f)) fautesVues.add(f);
    // nouvelle tentative : même bonne forme, 4 choix distincts, la bonne est dedans
    const r = V.refaireChoix(c, rnd);
    if (r.length !== 4 || new Set(r).size !== 4 || !r.includes(c.bonne)) ko("refaireChoix invalide : " + JSON.stringify(r));
    // règle
    if (!c.regle.texte.includes(c.regle.terminaison) || !c.regle.decoupe.includes("-")) ko("règle incomplète : " + JSON.stringify(c.regle));
    vus.add(v.inf);
  }
  const attendus = V.VERBES.filter((v) => v.niveau <= niv).length;
  console.log("Niveau " + niv + " : " + vus.size + "/" + attendus + " verbes vus, " + fautesVues.size + " fautes d'orthographe différentes proposées");
  if (vus.size < attendus) ko("niveau " + niv + " : certains verbes ne sortent jamais");
  if (niv === 1 && fautesVues.size) ko("niveau 1 : fautes d'orthographe proposées");
  if (niv >= 2 && !fautesVues.size) ko("niveau " + niv + " : aucune faute d'orthographe proposée");
}

// 3. Les fautes ne doivent jamais être de vraies formes (passé simple, présent, imparfait, futur) du verbe
for (const v of V.VERBES) for (let p = 0; p < 6; p++) {
  const vraies = new Set();
  for (const t of ["ps", "pres", "imp", "fut"]) for (let q = 0; q < 6; q++) vraies.add(V.conj(v, t, q));
  for (const f of V.fautes(v, p, 5)) if (vraies.has(f)) ko("une « faute » est une vraie forme : " + v.inf + " " + f);
}

// 4. Règles affichées (exemples)
const rg = V.regle(find("chanter"), 2);
egal(rg.texte, "il / elle / on → -a : chant-a", "règle de « il chanta »");
egal(V.regle(find("chanter"), 4).circonflexe, true, "circonflexe signalé pour vous");
egal(V.regle(find("chanter"), 2).circonflexe, false, "pas de circonflexe pour il");
egal(V.regle(find("manger"), 3).decoupe, "mange-âmes","découpe de « nous mangeâmes »");

console.log("\n" + cmds + " commandes générées. " + (erreurs ? "ÉCHEC : " + erreurs + " écart(s)" : "OK : 0 écart"));
process.exit(erreurs ? 1 : 0);
