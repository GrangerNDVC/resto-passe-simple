// Données de conjugaison — passé simple de l'indicatif : 1er groupe, 2e groupe, 3e groupe et auxiliaires, 10 niveaux.
// Personnes : 0=je 1=tu 2=il/elle/on 3=nous 4=vous 5=ils/elles
//
// Un verbe est décrit par :
//   inf      infinitif
//   niveau   niveau d'apparition (1 à 10)
//   groupe   1, 2 ou 3 (les auxiliaires avoir et être sont du 3e groupe)
//   couleur  "g1" (vert) | "g2" (orange) | "g3" (rouge) | "aux" (violet) : couleur de la brique et du plat
//   famille  1er groupe : "reg" | "ger" | "cer" | "ier" (voyelles qui se suivent) | "yer" | "emuet"
//            2e et 3e groupes : "g2" | "is" | "us" | "ins" (famille de terminaisons du passé simple)
//   voyelle  true si la forme « je » commence par une voyelle (J’aimai, J’eus) : calculé automatiquement
//   1er groupe :  r radical, rs radical du présent (personnes 0, 1, 2, 5), rf radical du futur, fs radicaux fautifs plausibles
//   2e et 3e groupes : rps radical du passé simple (les terminaisons viennent de la famille) et tab,
//            les formes du présent, de l'imparfait et du futur (utilisées seulement comme pièges)
//   note     phrase affichée à l'erreur (sinon la note de la famille)
(function () {
  "use strict";

  const V = (inf, niveau, o) => {
    const v = Object.assign({ inf, niveau, groupe: 1, couleur: "g1", famille: "reg" }, o || {});
    v.r = v.r || inf.slice(0, -2);
    v.rs = v.rs || v.r;
    v.rf = v.rf || inf;
    v.fs = v.fs || [];
    return v;
  };

  // 2e et 3e groupes : W(infinitif, niveau, groupe, couleur, famille, radical du passé simple, présent, imparfait, futur)
  const W = (inf, niveau, groupe, couleur, famille, rps, pres, imp, fut, note) => {
    const v = { inf, niveau, groupe, couleur, famille: famille || "reg", fs: [] };
    if (famille) v.rps = rps; else { v.r = inf.slice(0, -2); v.rs = v.r; v.rf = inf; }       // aller : passé simple comme le 1er groupe
    v.tab = { pres: pres.split(" "), imp: imp.split(" "), fut: fut.split(" ") };
    if (note) v.note = note;
    return v;
  };

  const VERBES = [
    // niveau 1 : réguliers courts et fréquents
    V("chanter", 1), V("parler", 1), V("regarder", 1), V("danser", 1), V("jouer", 1), V("donner", 1),
    V("trouver", 1), V("porter", 1), V("marcher", 1), V("laver", 1), V("goûter", 1), V("cuisiner", 1),
    V("aimer", 1), V("écouter", 1),
    // niveau 2 : -ger et -cer
    V("manger", 2, { famille: "ger" }), V("ranger", 2, { famille: "ger" }), V("nager", 2, { famille: "ger" }),
    V("voyager", 2, { famille: "ger" }),
    V("commencer", 2, { famille: "cer" }), V("lancer", 2, { famille: "cer" }), V("placer", 2, { famille: "cer" }),
    V("avancer", 2, { famille: "cer" }),
    // niveau 3 : -ier, -uer, -éer (voyelles qui se suivent)
    V("crier", 3, { famille: "ier", fs: ["cr"] }), V("étudier", 3, { famille: "ier", fs: ["étud"] }),
    V("remercier", 3, { famille: "ier", fs: ["remerc"] }), V("continuer", 3, { famille: "ier", fs: ["contin"] }),
    V("tuer", 3, { famille: "ier", fs: ["tue"] }),
    V("créer", 3, { famille: "ier", fs: ["cre"] }),
    // niveau 4 : -yer et e muet (le présent change de radical, pas le passé simple)
    V("payer", 4, { famille: "yer", rs: "pai", rf: "paier", fs: ["pai"] }),
    V("nettoyer", 4, { famille: "yer", rs: "nettoi", rf: "nettoier", fs: ["nettoi"] }),
    V("essuyer", 4, { famille: "yer", rs: "essui", rf: "essuier", fs: ["essui"] }),
    V("acheter", 4, { famille: "emuet", rs: "achèt", rf: "achèter", fs: ["achèt"] }),
    V("appeler", 4, { famille: "emuet", rs: "appell", rf: "appeller", fs: ["appell"] }),
    V("jeter", 4, { famille: "emuet", rs: "jett", rf: "jetter", fs: ["jett"] }),
    V("lever", 4, { famille: "emuet", rs: "lèv", rf: "lèver", fs: ["lèv"] }),
    V("espérer", 4, { famille: "emuet", rs: "espèr", fs: ["espèr"] }),
    // niveaux 6 à 10 : 2e groupe, 3e groupe (familles -is, -us, -ins), auxiliaires, irréguliers
    W("finir", 6, 2, "g2", "g2", "fin", "finis finis finit finissons finissez finissent", "finissais finissais finissait finissions finissiez finissaient", "finirai finiras finira finirons finirez finiront"),
    W("choisir", 6, 2, "g2", "g2", "chois", "choisis choisis choisit choisissons choisissez choisissent", "choisissais choisissais choisissait choisissions choisissiez choisissaient", "choisirai choisiras choisira choisirons choisirez choisiront"),
    W("grandir", 6, 2, "g2", "g2", "grand", "grandis grandis grandit grandissons grandissez grandissent", "grandissais grandissais grandissait grandissions grandissiez grandissaient", "grandirai grandiras grandira grandirons grandirez grandiront"),
    W("réussir", 6, 2, "g2", "g2", "réuss", "réussis réussis réussit réussissons réussissez réussissent", "réussissais réussissais réussissait réussissions réussissiez réussissaient", "réussirai réussiras réussira réussirons réussirez réussiront"),
    W("remplir", 6, 2, "g2", "g2", "rempl", "remplis remplis remplit remplissons remplissez remplissent", "remplissais remplissais remplissait remplissions remplissiez remplissaient", "remplirai rempliras remplira remplirons remplirez rempliront"),
    W("bondir", 6, 2, "g2", "g2", "bond", "bondis bondis bondit bondissons bondissez bondissent", "bondissais bondissais bondissait bondissions bondissiez bondissaient", "bondirai bondiras bondira bondirons bondirez bondiront"),
    W("obéir", 6, 2, "g2", "g2", "obé", "obéis obéis obéit obéissons obéissez obéissent", "obéissais obéissais obéissait obéissions obéissiez obéissaient", "obéirai obéiras obéira obéirons obéirez obéiront"),
    W("punir", 6, 2, "g2", "g2", "pun", "punis punis punit punissons punissez punissent", "punissais punissais punissait punissions punissiez punissaient", "punirai puniras punira punirons punirez puniront"),
    W("applaudir", 6, 2, "g2", "g2", "applaud", "applaudis applaudis applaudit applaudissons applaudissez applaudissent", "applaudissais applaudissais applaudissait applaudissions applaudissiez applaudissaient", "applaudirai applaudiras applaudira applaudirons applaudirez applaudiront"),
    W("rougir", 6, 2, "g2", "g2", "roug", "rougis rougis rougit rougissons rougissez rougissent", "rougissais rougissais rougissait rougissions rougissiez rougissaient", "rougirai rougiras rougira rougirons rougirez rougiront"),
    W("partir", 7, 3, "g3", "is", "part", "pars pars part partons partez partent", "partais partais partait partions partiez partaient", "partirai partiras partira partirons partirez partiront"),
    W("sortir", 7, 3, "g3", "is", "sort", "sors sors sort sortons sortez sortent", "sortais sortais sortait sortions sortiez sortaient", "sortirai sortiras sortira sortirons sortirez sortiront"),
    W("dormir", 7, 3, "g3", "is", "dorm", "dors dors dort dormons dormez dorment", "dormais dormais dormait dormions dormiez dormaient", "dormirai dormiras dormira dormirons dormirez dormiront"),
    W("servir", 7, 3, "g3", "is", "serv", "sers sers sert servons servez servent", "servais servais servait servions serviez servaient", "servirai serviras servira servirons servirez serviront"),
    W("ouvrir", 7, 3, "g3", "is", "ouvr", "ouvre ouvres ouvre ouvrons ouvrez ouvrent", "ouvrais ouvrais ouvrait ouvrions ouvriez ouvraient", "ouvrirai ouvriras ouvrira ouvrirons ouvrirez ouvriront"),
    W("mettre", 7, 3, "g3", "is", "m", "mets mets met mettons mettez mettent", "mettais mettais mettait mettions mettiez mettaient", "mettrai mettras mettra mettrons mettrez mettront"),
    W("prendre", 7, 3, "g3", "is", "pr", "prends prends prend prenons prenez prennent", "prenais prenais prenait prenions preniez prenaient", "prendrai prendras prendra prendrons prendrez prendront"),
    W("comprendre", 7, 3, "g3", "is", "compr", "comprends comprends comprend comprenons comprenez comprennent", "comprenais comprenais comprenait comprenions compreniez comprenaient", "comprendrai comprendras comprendra comprendrons comprendrez comprendront"),
    W("rire", 7, 3, "g3", "is", "r", "ris ris rit rions riez rient", "riais riais riait riions riiez riaient", "rirai riras rira rirons rirez riront"),
    W("suivre", 7, 3, "g3", "is", "suiv", "suis suis suit suivons suivez suivent", "suivais suivais suivait suivions suiviez suivaient", "suivrai suivras suivra suivrons suivrez suivront"),
    W("avoir", 8, 3, "aux", "us", "e", "ai as a avons avez ont", "avais avais avait avions aviez avaient", "aurai auras aura aurons aurez auront"),
    W("être", 8, 3, "aux", "us", "f", "suis es est sommes êtes sont", "étais étais était étions étiez étaient", "serai seras sera serons serez seront"),
    W("boire", 8, 3, "g3", "us", "b", "bois bois boit buvons buvez boivent", "buvais buvais buvait buvions buviez buvaient", "boirai boiras boira boirons boirez boiront"),
    W("croire", 8, 3, "g3", "us", "cr", "crois crois croit croyons croyez croient", "croyais croyais croyait croyions croyiez croyaient", "croirai croiras croira croirons croirez croiront"),
    W("lire", 8, 3, "g3", "us", "l", "lis lis lit lisons lisez lisent", "lisais lisais lisait lisions lisiez lisaient", "lirai liras lira lirons lirez liront"),
    W("vivre", 8, 3, "g3", "us", "véc", "vis vis vit vivons vivez vivent", "vivais vivais vivait vivions viviez vivaient", "vivrai vivras vivra vivrons vivrez vivront"),
    W("devoir", 8, 3, "g3", "us", "d", "dois dois doit devons devez doivent", "devais devais devait devions deviez devaient", "devrai devras devra devrons devrez devront"),
    W("pouvoir", 8, 3, "g3", "us", "p", "peux peux peut pouvons pouvez peuvent", "pouvais pouvais pouvait pouvions pouviez pouvaient", "pourrai pourras pourra pourrons pourrez pourront"),
    W("vouloir", 8, 3, "g3", "us", "voul", "veux veux veut voulons voulez veulent", "voulais voulais voulait voulions vouliez voulaient", "voudrai voudras voudra voudrons voudrez voudront"),
    W("savoir", 8, 3, "g3", "us", "s", "sais sais sait savons savez savent", "savais savais savait savions saviez savaient", "saurai sauras saura saurons saurez sauront"),
    W("connaître", 8, 3, "g3", "us", "conn", "connais connais connaît connaissons connaissez connaissent", "connaissais connaissais connaissait connaissions connaissiez connaissaient", "connaîtrai connaîtras connaîtra connaîtrons connaîtrez connaîtront"),
    W("plaire", 8, 3, "g3", "us", "pl", "plais plais plaît plaisons plaisez plaisent", "plaisais plaisais plaisait plaisions plaisiez plaisaient", "plairai plairas plaira plairons plairez plairont"),
    W("courir", 8, 3, "g3", "us", "cour", "cours cours court courons courez courent", "courais courais courait courions couriez couraient", "courrai courras courra courrons courrez courront"),
    W("recevoir", 8, 3, "g3", "us", "reç", "reçois reçois reçoit recevons recevez reçoivent", "recevais recevais recevait recevions receviez recevaient", "recevrai recevras recevra recevrons recevrez recevront"),
    W("venir", 9, 3, "g3", "ins", "v", "viens viens vient venons venez viennent", "venais venais venait venions veniez venaient", "viendrai viendras viendra viendrons viendrez viendront"),
    W("tenir", 9, 3, "g3", "ins", "t", "tiens tiens tient tenons tenez tiennent", "tenais tenais tenait tenions teniez tenaient", "tiendrai tiendras tiendra tiendrons tiendrez tiendront"),
    W("devenir", 9, 3, "g3", "ins", "dev", "deviens deviens devient devenons devenez deviennent", "devenais devenais devenait devenions deveniez devenaient", "deviendrai deviendras deviendra deviendrons deviendrez deviendront"),
    W("revenir", 9, 3, "g3", "ins", "rev", "reviens reviens revient revenons revenez reviennent", "revenais revenais revenait revenions reveniez revenaient", "reviendrai reviendras reviendra reviendrons reviendrez reviendront"),
    W("retenir", 9, 3, "g3", "ins", "ret", "retiens retiens retient retenons retenez retiennent", "retenais retenais retenait retenions reteniez retenaient", "retiendrai retiendras retiendra retiendrons retiendrez retiendront"),
    W("obtenir", 9, 3, "g3", "ins", "obt", "obtiens obtiens obtient obtenons obtenez obtiennent", "obtenais obtenais obtenait obtenions obteniez obtenaient", "obtiendrai obtiendras obtiendra obtiendrons obtiendrez obtiendront"),
    W("aller", 10, 3, "g3", null, null, "vais vas va allons allez vont", "allais allais allait allions alliez allaient", "irai iras ira irons irez iront"),
    W("faire", 10, 3, "g3", "is", "f", "fais fais fait faisons faites font", "faisais faisais faisait faisions faisiez faisaient", "ferai feras fera ferons ferez feront"),
    W("voir", 10, 3, "g3", "is", "v", "vois vois voit voyons voyez voient", "voyais voyais voyait voyions voyiez voyaient", "verrai verras verra verrons verrez verront"),
    W("dire", 10, 3, "g3", "is", "d", "dis dis dit disons dites disent", "disais disais disait disions disiez disaient", "dirai diras dira dirons direz diront"),
    W("écrire", 10, 3, "g3", "is", "écriv", "écris écris écrit écrivons écrivez écrivent", "écrivais écrivais écrivait écrivions écriviez écrivaient", "écrirai écriras écrira écrirons écrirez écriront"),
  ];

  const NIVEAUX = {
    1: { titre: "verbes réguliers", detail: "chanter, parler, aimer…" },
    2: { titre: "-ger et -cer", detail: "manger, commencer…" },
    3: { titre: "-ier, -uer, -éer", detail: "crier, tuer, créer…" },
    4: { titre: "-yer et e muet", detail: "nettoyer, acheter, appeler…" },
    5: { titre: "tous mélangés", detail: "tous les verbes du 1er groupe", focus: false },
    6: { titre: "2e groupe", detail: "finir, choisir, grandir…", focus: true },
    7: { titre: "3e groupe : -is", detail: "partir, mettre, prendre…", focus: true },
    8: { titre: "3e groupe : -us", detail: "avoir, être, lire, pouvoir…", focus: true },
    9: { titre: "3e groupe : -ins", detail: "venir, tenir et leurs dérivés", focus: true },
    10: { titre: "irréguliers", detail: "aller, faire, voir, dire, écrire", focus: true },
  };
  NIVEAUX[1].focus = false;
  for (const n of [2, 3, 4]) NIVEAUX[n].focus = true;
  const NIVEAU_MAX = 10;

  // Choix de groupe à l'écran titre : 0 = tous (progression complète) ; sinon un seul groupe.
  const GROUPES = {
    0: { titre: "Tous", debut: 1, fin: 10 },
    1: { titre: "1er groupe", debut: 1, fin: 5 },
    2: { titre: "2e groupe", debut: 6, fin: 6 },
    3: { titre: "3e groupe", debut: 7, fin: 10 },
  };

  // Terminaisons du passé simple
  const END = {
    ps:   ["ai", "as", "a", "âmes", "âtes", "èrent"],
    pres: ["e", "es", "e", "ons", "ez", "ent"],
    imp:  ["ais", "ais", "ait", "ions", "iez", "aient"],
    fut:  ["ai", "as", "a", "ons", "ez", "ont"],
  };
  const FIN = {                                              // 2e et 3e groupes : terminaisons du passé simple par famille
    g2:  ["is", "is", "it", "îmes", "îtes", "irent"],
    is:  ["is", "is", "it", "îmes", "îtes", "irent"],
    us:  ["us", "us", "ut", "ûmes", "ûtes", "urent"],
    ins: ["ins", "ins", "int", "înmes", "întes", "inrent"],
  };

  // Orthographe devant a, â, o : mangeai, commençai
  function adapter(v, s, fin) {
    const c = fin[0];
    if (v.famille === "ger" && "aâo".includes(c)) return s + "e" + fin;
    if (v.famille === "cer" && "aâo".includes(c)) return s.slice(0, -1) + "ç" + fin;
    return s + fin;
  }

  function conj(v, temps, p) {
    if (v.tab && temps !== "ps") return v.tab[temps][p];                 // 2e et 3e groupes : présent, imparfait, futur (pièges)
    if (FIN[v.famille]) return v.rps + FIN[v.famille][p];                // passé simple en -is, -us, -ins
    const fin = END[temps][p];
    if (temps === "fut") return v.rf + fin;
    if (temps === "pres") return adapter(v, p === 3 || p === 4 ? v.r : v.rs, fin);
    return adapter(v, v.r, fin);            // passé simple et imparfait
  }

  // J’ devant une voyelle : cela dépend de la forme (j’eus, j’allai) et non de l'infinitif (je fus, bien que « être » commence par une voyelle)
  const VOYELLE = /^[aeiouyàâäéèêëîïôöùûü]/i;
  for (const v of VERBES) v.voyelle = VOYELLE.test(conj(v, "ps", 0));

  const PRONOMS = [
    { txt: "Je", p: 0 }, { txt: "Tu", p: 1 }, { txt: "Il", p: 2 }, { txt: "Elle", p: 2 }, { txt: "On", p: 2 },
    { txt: "Nous", p: 3 }, { txt: "Vous", p: 4 }, { txt: "Ils", p: 5 }, { txt: "Elles", p: 5 },
  ];

  function pronomAffiche(pr, v) {
    return pr.p === 0 && v.voyelle ? "J’" : pr.txt;
  }

  // ------------------------------------------------------------------ fautes plausibles (distracteurs d'orthographe)
  // 1er groupe : piège de famille dès le niveau 2 (mangai, commencai, nettoiai, achètai…),
  // piège d'accent dès le niveau 3 (chantames, ils chantérent).
  // 2e et 3e groupes : accent circonflexe oublié (nous partimes), terminaison du 1er groupe (il partit → il parta),
  // participe passé à la place du passé simple (il parti), cédille oubliée (je recus).
  function fautesG23(v, p) {
    const bonne = conj(v, "ps", p), res = [];
    if (p === 3 || p === 4) res.push(bonne.replace(/[âîû]/, (c) => ({ â: "a", î: "i", û: "u" })[c]));
    if (FIN[v.famille]) {
      const r = v.inf.replace(/(oir|re|ir)$/, "");                                                            // fin(ir), mett(re), recev(oir)
      if (r.length >= 3 && /[^aeiouyîâ]$/.test(r)) res.push(r + END.ps[p]);                                  // il parta, ils partèrent
      if (p === 2 && v.famille !== "ins") res.push(bonne.slice(0, -1));                                      // il parti, il lu
    }
    if (bonne.includes("ç")) res.push(bonne.replace("ç", "c"));
    return res;
  }

  function fautes(v, p, niveau) {
    const res = [], fin = END.ps[p], bonne = conj(v, "ps", p);
    if (niveau >= 2) {
      if (v.tab) {
        const vraies = new Set();
        for (const t of ["ps", "pres", "imp", "fut"]) for (let q = 0; q < 6; q++) vraies.add(conj(v, t, q));
        for (const f of fautesG23(v, p)) if (!vraies.has(f)) res.push(f);
      } else {
        if (v.famille === "ger") res.push(p === 5 ? v.r + "e" + fin : v.r + fin);                    // mangai / mangeèrent
        if (v.famille === "cer") res.push(p === 5 ? v.r.slice(0, -1) + "ç" + fin : v.r + fin);       // commencai / commençèrent
        for (const s of v.fs) res.push(s + fin);                                                       // nettoiai, achètai…
      }
    }
    if (niveau >= 3 && p >= 3 && !v.tab) {
      const rad = bonne.slice(0, -fin.length);
      res.push(rad + { 3: "ames", 4: "ates", 5: "érent" }[p]);                                       // chantames, chantérent
    }
    return res.filter((f, i) => f !== bonne && res.indexOf(f) === i);
  }

  // Confusions classiques entre deux verbes du 3e groupe : même personne, passé simple de l'autre verbe (je fus / je fis)
  const CONFUSIONS = {
    "être": ["faire"], faire: ["être", "dire"], dire: ["faire"], pouvoir: ["prendre"], prendre: ["pouvoir", "mettre"],
    mettre: ["prendre"], venir: ["voir", "tenir"], tenir: ["venir"], voir: ["venir", "vivre"],
  };
  const trouver = (inf) => VERBES.find((x) => x.inf === inf);
  function croisees(v, p) {
    return (CONFUSIONS[v.inf] || []).map((inf) => conj(trouver(inf), "ps", p)).filter((f) => f !== conj(v, "ps", p));
  }

  // ------------------------------------------------------------------ distracteurs
  // T : autre temps, même personne (présent, imparfait, futur) ; P : passé simple, autres personnes ;
  // F : une seule faute d'orthographe au plus par question ; C : confusion avec un autre verbe.
  const PROBA_FAUTE = { 1: 0, 2: 0.6, 3: 0.7, 4: 0.8, 5: 0.75, 6: 0.7, 7: 0.7, 8: 0.7, 9: 0.7, 10: 0.7 };
  const PROBA_TEMPS = { 1: 0.7, 2: 0.45, 3: 0.35, 4: 0.3, 5: 0.3, 6: 0.4, 7: 0.4, 8: 0.4, 9: 0.45, 10: 0.45 };
  const PROBA_CROIS = 0.35;

  const pick = (a, rnd) => a[Math.floor(rnd() * a.length)];

  function melanger(a, rnd) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function distracteurs(v, p, niveau, n, rnd) {
    const bonne = conj(v, "ps", p), res = [];
    const T = ["pres", "imp", "fut"].map((t) => conj(v, t, p));
    const P = []; for (let q = 0; q < 6; q++) if (q !== p) P.push(conj(v, "ps", q));
    const F = fautes(v, p, niveau), C = croisees(v, p);
    if (F.length && rnd() < PROBA_FAUTE[niveau]) res.push(pick(F, rnd));
    if (C.length && rnd() < PROBA_CROIS) { const c = pick(C, rnd); if (!res.includes(c)) res.push(c); }
    let garde = 0;
    while (res.length < n && garde++ < 200) {
      const s = pick(rnd() < PROBA_TEMPS[niveau] ? T : P, rnd);
      if (s !== bonne && !res.includes(s)) res.push(s);
    }
    for (const s of T.concat(P)) if (res.length < n && s !== bonne && !res.includes(s)) res.push(s);
    return res.slice(0, n);
  }

  // ------------------------------------------------------------------ règle affichée à l'erreur
  const TERM = ["-ai", "-as", "-a", "-âmes", "-âtes", "-èrent"];
  const LIB = ["je", "tu", "il / elle / on", "nous", "vous", "ils / elles"];
  const NOTES = {
    ger: "Verbe en -ger : on garde le e devant a et â (mangeai), pas devant -èrent.",
    cer: "Verbe en -cer : ç devant a et â (commençai), c devant -èrent.",
    ier: "Les voyelles du radical restent toutes : crier → cri-ai, créer → cré-ai.",
    yer: "Verbe en -yer : le y reste au passé simple (nettoyai) ; il ne devient i qu'au présent.",
    emuet: "Au passé simple, pas d'accent ni de consonne double : achetai, appelai.",
    g2: "2e groupe : au passé simple, pas de -iss- (finis, finîmes, finirent).",
    is: "Famille en -is : le radical change parfois (mettre → mis, prendre → pris).",
    us: "Famille en -us : le radical change (avoir → eus, vivre → vécus, recevoir → reçus).",
    ins: "Venir, tenir et leurs dérivés : vins, vins, vint, vînmes, vîntes, vinrent. « Il vint » n’est pas « il vient ».",
  };

  function regle(v, p) {
    const f = FIN[v.famille], fin = f ? f[p] : END.ps[p], bonne = conj(v, "ps", p), rad = bonne.slice(0, -fin.length);
    const court = LIB[p] + " → " + (f ? "-" + fin : TERM[p]);
    return {
      terminaison: f ? "-" + fin : TERM[p],
      court,                                              // « il / elle / on → -a »
      decoupe: rad + "-" + fin,                           // « chant-a »
      texte: court + " : " + rad + "-" + fin,
      circonflexe: p === 3 || p === 4,
      lettre: f ? (v.famille === "us" ? "u" : "i") : "a",   // lettre qui porte l'accent circonflexe
      note: v.note || NOTES[v.famille] || "",
    };
  }

  // ------------------------------------------------------------------ commandes
  function construire(v, pr, niveau, rnd) {
    const p = pr.p, bonne = conj(v, "ps", p);
    const choix = melanger([bonne].concat(distracteurs(v, p, niveau, 3, rnd)), rnd);
    return { pronom: pronomAffiche(pr, v), verbe: v.inf, bonne, choix, p, niveau, groupe: v.groupe, couleur: v.couleur, regle: regle(v, p) };
  }

  // Fabrique une commande : { pronom, verbe, bonne, choix[4], p, niveau, groupe, couleur, regle }
  // groupe (facultatif) : 1, 2 ou 3 pour ne proposer que les verbes de ce groupe ; 0 ou absent : tous les groupes.
  function nouvelleCommande(niveau, rnd, groupe) {
    niveau = Math.max(1, Math.min(NIVEAU_MAX, Math.floor(niveau) || 1));
    const dansGroupe = (v) => !groupe || v.groupe === groupe;
    let pool = VERBES.filter((v) => v.niveau <= niveau && dansGroupe(v));
    // aux niveaux d'apprentissage, une commande sur deux porte sur la famille du niveau (celle qu'on vient d'apprendre)
    if (NIVEAUX[niveau].focus && rnd() < 0.5) {
      const focus = pool.filter((v) => v.niveau === niveau);
      if (focus.length) pool = focus;
    }
    return construire(pick(pool, rnd), pick(PRONOMS, rnd), niveau, rnd);
  }

  // Même verbe, même personne, nouveaux distracteurs (nouvelle tentative après une erreur)
  function refaireChoix(cmd, rnd) {
    const v = trouver(cmd.verbe);
    return melanger([cmd.bonne].concat(distracteurs(v, cmd.p, cmd.niveau, 3, rnd)), rnd);
  }

  // La forme refusée est-elle celle d'un AUTRE verbe (« pas le plat demandé ») ou une mauvaise forme du bon verbe (« pas la bonne cuisson ») ?
  function autreVerbe(cmd, forme) {
    return (CONFUSIONS[cmd.verbe] || []).some((inf) => { const v = trouver(inf); return v && conj(v, "ps", cmd.p) === forme; });
  }

  const api = { autreVerbe, conj, nouvelleCommande, refaireChoix, regle, fautes, distracteurs, VERBES, PRONOMS, NIVEAUX, NIVEAU_MAX, GROUPES, END, FIN };
  (typeof window !== "undefined" ? window : globalThis).VERBES = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
