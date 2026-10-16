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
  // niveau 6 : 2e groupe (-is, -is, -it, -îmes, -îtes, -irent)
  finir: "finis finis finit finîmes finîtes finirent",
  choisir: "choisis choisis choisit choisîmes choisîtes choisirent",
  grandir: "grandis grandis grandit grandîmes grandîtes grandirent",
  "réussir": "réussis réussis réussit réussîmes réussîtes réussirent",
  remplir: "remplis remplis remplit remplîmes remplîtes remplirent",
  bondir: "bondis bondis bondit bondîmes bondîtes bondirent",
  "obéir": "obéis obéis obéit obéîmes obéîtes obéirent",
  punir: "punis punis punit punîmes punîtes punirent",
  applaudir: "applaudis applaudis applaudit applaudîmes applaudîtes applaudirent",
  rougir: "rougis rougis rougit rougîmes rougîtes rougirent",
  // niveau 7 : 3e groupe, famille -is
  partir: "partis partis partit partîmes partîtes partirent",
  sortir: "sortis sortis sortit sortîmes sortîtes sortirent",
  dormir: "dormis dormis dormit dormîmes dormîtes dormirent",
  servir: "servis servis servit servîmes servîtes servirent",
  ouvrir: "ouvris ouvris ouvrit ouvrîmes ouvrîtes ouvrirent",
  mettre: "mis mis mit mîmes mîtes mirent",
  prendre: "pris pris prit prîmes prîtes prirent",
  comprendre: "compris compris comprit comprîmes comprîtes comprirent",
  rire: "ris ris rit rîmes rîtes rirent",
  suivre: "suivis suivis suivit suivîmes suivîtes suivirent",
  // niveau 8 : 3e groupe, famille -us + auxiliaires
  avoir: "eus eus eut eûmes eûtes eurent",
  "être": "fus fus fut fûmes fûtes furent",
  boire: "bus bus but bûmes bûtes burent",
  croire: "crus crus crut crûmes crûtes crurent",
  lire: "lus lus lut lûmes lûtes lurent",
  vivre: "vécus vécus vécut vécûmes vécûtes vécurent",
  devoir: "dus dus dut dûmes dûtes durent",
  pouvoir: "pus pus put pûmes pûtes purent",
  vouloir: "voulus voulus voulut voulûmes voulûtes voulurent",
  savoir: "sus sus sut sûmes sûtes surent",
  "connaître": "connus connus connut connûmes connûtes connurent",
  plaire: "plus plus plut plûmes plûtes plurent",
  courir: "courus courus courut courûmes courûtes coururent",
  recevoir: "reçus reçus reçut reçûmes reçûtes reçurent",
  // niveau 9 : 3e groupe, famille -ins (venir, tenir et dérivés)
  venir: "vins vins vint vînmes vîntes vinrent",
  tenir: "tins tins tint tînmes tîntes tinrent",
  devenir: "devins devins devint devînmes devîntes devinrent",
  revenir: "revins revins revint revînmes revîntes revinrent",
  retenir: "retins retins retint retînmes retîntes retinrent",
  obtenir: "obtins obtins obtint obtînmes obtîntes obtinrent",
  // niveau 10 : irréguliers
  aller: "allai allas alla allâmes allâtes allèrent",
  faire: "fis fis fit fîmes fîtes firent",
  voir: "vis vis vit vîmes vîtes virent",
  dire: "dis dis dit dîmes dîtes dirent",
  "écrire": "écrivis écrivis écrivit écrivîmes écrivîtes écrivirent",
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
  // 3e groupe : formes du présent qui servent de pièges (il vint / il vient, vous dîtes / vous dites…)
  venir: "viens viens vient venons venez viennent",
  tenir: "tiens tiens tient tenons tenez tiennent",
  faire: "fais fais fait faisons faites font",
  dire: "dis dis dit disons dites disent",
  être: "suis es est sommes êtes sont",
  avoir: "ai as a avons avez ont",
  aller: "vais vas va allons allez vont",
  pouvoir: "peux peux peut pouvons pouvez peuvent",
  prendre: "prends prends prend prenons prenez prennent",
  voir: "vois vois voit voyons voyez voient",
  finir: "finis finis finit finissons finissez finissent",
  recevoir: "reçois reçois reçoit recevons recevez reçoivent",
};
const IMP = {
  manger: "mangeais mangeais mangeait mangions mangiez mangeaient",
  commencer: "commençais commençais commençait commencions commenciez commençaient",
  chanter: "chantais chantais chantait chantions chantiez chantaient",
  nettoyer: "nettoyais nettoyais nettoyait nettoyions nettoyiez nettoyaient",
  venir: "venais venais venait venions veniez venaient",
  faire: "faisais faisais faisait faisions faisiez faisaient",
  être: "étais étais était étions étiez étaient",
  finir: "finissais finissais finissait finissions finissiez finissaient",
};
const FUT = {
  chanter: "chanterai chanteras chantera chanterons chanterez chanteront",
  manger: "mangerai mangeras mangera mangerons mangerez mangeront",
  acheter: "achèterai achèteras achètera achèterons achèterez achèteront",
  appeler: "appellerai appelleras appellera appellerons appellerez appelleront",
  venir: "viendrai viendras viendra viendrons viendrez viendront",
  aller: "irai iras ira irons irez iront",
  être: "serai seras sera serons serez seront",
  faire: "ferai feras fera ferons ferez feront",
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

// 5. Élision : elle dépend de la forme « je », pas de l'infinitif (j'eus, j'allai, mais je fus, je devins)
for (const inf of ["ouvrir", "obéir", "applaudir", "avoir", "aller", "écrire", "obtenir", "aimer", "avancer", "espérer"]) egal(find(inf).voyelle, true, "élision attendue : " + inf);
for (const inf of ["être", "devenir", "revenir", "retenir", "finir", "venir", "faire", "voir", "chanter"]) egal(find(inf).voyelle, false, "pas d'élision : " + inf);

// 6. Choix du groupe : seuls les verbes du groupe, bons niveaux, bonne couleur, tous les verbes du groupe sortent
for (const g of [1, 2, 3]) {
  const { debut, fin } = V.GROUPES[g];
  for (let niv = debut; niv <= fin; niv++) {
    const vus = new Set();
    for (let k = 0; k < 3000; k++) {
      const c = V.nouvelleCommande(niv, rnd, g); cmds++;
      const v = find(c.verbe);
      if (v.groupe !== g) ko("groupe " + g + " : verbe d'un autre groupe : " + c.verbe);
      if (v.niveau > niv) ko("groupe " + g + " niveau " + niv + " : verbe trop avancé : " + c.verbe);
      if (c.couleur !== v.couleur || c.groupe !== g) ko("couleur ou groupe faux dans la commande : " + c.verbe);
      if (c.choix.length !== 4 || new Set(c.choix).size !== 4 || !c.choix.includes(c.bonne)) ko("choix invalides : " + JSON.stringify(c));
      vus.add(v.inf);
    }
    const attendus = V.VERBES.filter((v) => v.groupe === g && v.niveau <= niv).length;
    console.log("Groupe " + g + ", niveau " + niv + " : " + vus.size + "/" + attendus + " verbes vus");
    if (vus.size < attendus) ko("groupe " + g + " niveau " + niv + " : certains verbes ne sortent jamais");
  }
}
const couleurs = { g1: 0, g2: 0, g3: 0, aux: 0 };
for (const v of V.VERBES) couleurs[v.couleur]++;
console.log("Verbes par couleur : " + JSON.stringify(couleurs));
egal(couleurs.aux, 2, "deux auxiliaires (violet) : avoir et être");
egal(find("avoir").couleur + find("être").couleur, "auxaux", "avoir et être sont violets");
egal(find("finir").groupe + "" + find("finir").couleur, "2g2", "finir : 2e groupe, orange");
egal(find("venir").groupe + "" + find("venir").couleur, "3g3", "venir : 3e groupe, rouge");

// 7. Règles affichées pour les nouvelles familles
egal(V.regle(find("venir"), 3).texte, "nous → -înmes : v-înmes", "règle de « nous vînmes »");
egal(V.regle(find("finir"), 5).texte, "ils / elles → -irent : fin-irent", "règle de « ils finirent »");
egal(V.regle(find("recevoir"), 0).texte, "je → -us : reç-us", "règle de « je reçus »");
egal(V.regle(find("aller"), 5).texte, "ils / elles → -èrent : all-èrent", "règle de « ils allèrent »");
egal(V.regle(find("être"), 4).lettre, "u", "circonflexe sur le u : vous fûtes");
egal(V.regle(find("dire"), 4).lettre, "i", "circonflexe sur le i : vous dîtes");
egal(V.regle(find("chanter"), 4).lettre, "a", "circonflexe sur le a : vous chantâtes");

// 8. Les pièges du 3e groupe sortent bien (il vint / il vient, vous dîtes / vous dites, je fus / je fis)
const pieges = [["venir", 2, "vient"], ["venir", 5, "viennent"], ["dire", 4, "dites"], ["faire", 4, "faites"], ["faire", 5, "faisaient"], ["être", 0, "fis"], ["pouvoir", 0, "pris"], ["finir", 3, "finimes"], ["recevoir", 0, "recus"], ["venir", 3, "vinmes"], ["partir", 2, "parti"]];
for (const [inf, p, attendue] of pieges) {
  let vu = false;
  for (let k = 0; k < 3000 && !vu; k++) vu = V.distracteurs(find(inf), p, 10, 3, rnd).includes(attendue);
  if (!vu) ko("piège jamais proposé : « " + attendue + " » pour " + inf + " p" + p);
  verifs++;
}

console.log("\n" + cmds + " commandes générées. " + (erreurs ? "ÉCHEC : " + erreurs + " écart(s)" : "OK : 0 écart"));
process.exit(erreurs ? 1 : 0);
