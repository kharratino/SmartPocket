/**
 * SmartPocket — gestion locale du budget étudiant.
 * Toutes les données sont stockées dans localStorage (aucune API, aucun serveur).
 */
(function () {
  "use strict";

  const STORAGE_KEY = "smartpocket_v1";

  const CATEGORIES = [
    { id: "alimentation", label: "Alimentation", icon: "🍔", color: "#0f766e" },
    { id: "transport", label: "Transport", icon: "🚌", color: "#0284c7" },
    { id: "etudes", label: "Études", icon: "📚", color: "#7c3aed" },
    { id: "loisirs", label: "Loisirs", icon: "🎬", color: "#db2777" },
    { id: "logement", label: "Logement", icon: "🏠", color: "#b45309" },
    { id: "shopping", label: "Shopping", icon: "🛍️", color: "#0d9488" },
    { id: "sante", label: "Santé", icon: "💊", color: "#dc2626" },
    { id: "abonnements", label: "Abonnements", icon: "📱", color: "#4338ca" },
    { id: "autre", label: "Autre", icon: "📦", color: "#475569" }
  ];

  const MONTHS_FR = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre"
  ];

  /** @type {{ budget: number, epargneMensuelle: number, depenses: Array, objectif: object|null, demoChargee: boolean }} */
  let etat = null;
  let idEdition = null;
  let actionConfirmee = null;

  const el = (id) => document.getElementById(id);

  function donneesDemo() {
    return {
      budget: 600,
      epargneMensuelle: 100,
      demoChargee: true,
      objectif: {
        nom: "Nouveau PC",
        cible: 2500,
        economise: 650
      },
      depenses: [
        { id: "d1", description: "Bus universitaire", montant: 20, categorie: "transport", date: "2026-09-04" },
        { id: "d2", description: "Courses alimentaires", montant: 45, categorie: "alimentation", date: "2026-09-08" },
        { id: "d3", description: "Fournitures et copies", montant: 30, categorie: "etudes", date: "2026-09-12" },
        { id: "d4", description: "Sortie cinéma", montant: 25, categorie: "loisirs", date: "2026-09-18" }
      ]
    };
  }

  function charger() {
    try {
      const brut = localStorage.getItem(STORAGE_KEY);
      if (!brut) {
        etat = donneesDemo();
        sauvegarder();
        return;
      }
      etat = JSON.parse(brut);
      if (!etat || !Array.isArray(etat.depenses)) {
        etat = donneesDemo();
        sauvegarder();
      }
    } catch (erreur) {
      console.error("Impossible de lire localStorage :", erreur);
      etat = donneesDemo();
    }
  }

  function sauvegarder() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(etat));
  }

  function categorieParId(id) {
    return CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
  }

  function formaterMontant(valeur) {
    const nombre = Number(valeur) || 0;
    return new Intl.NumberFormat("fr-TN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(nombre) + " DT";
  }

  function formaterDate(iso) {
    if (!iso) return "Date inconnue";
    const [annee, mois, jour] = iso.split("-").map(Number);
    const date = new Date(annee, mois - 1, jour);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  }

  function dateDuJour() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const j = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${j}`;
  }

  function totalDepenses() {
    return etat.depenses.reduce((somme, d) => somme + Number(d.montant), 0);
  }

  function pourcentageBudget() {
    if (!etat.budget || etat.budget <= 0) return 0;
    return (totalDepenses() / etat.budget) * 100;
  }

  function niveauBudget(pct) {
    if (pct > 100) return "alert";
    if (pct >= 90) return "alert";
    if (pct >= 70) return "warn";
    return "ok";
  }

  function totauxParCategorie() {
    const map = {};
    CATEGORIES.forEach((c) => { map[c.id] = 0; });
    etat.depenses.forEach((d) => {
      if (map[d.categorie] === undefined) map[d.categorie] = 0;
      map[d.categorie] += Number(d.montant);
    });
    return map;
  }

  function afficherErreur(id, message) {
    const zone = el(id);
    if (!zone) return;
    if (!message) {
      zone.hidden = true;
      zone.textContent = "";
      return;
    }
    zone.hidden = false;
    zone.textContent = message;
  }

  function remplirSelectsCategories() {
    const selectAjout = el("input-categorie");
    const selectFiltre = el("filtre-categorie");
    CATEGORIES.forEach((c) => {
      const option = document.createElement("option");
      option.value = c.id;
      option.textContent = `${c.icon} ${c.label}`;
      selectAjout.appendChild(option);

      const optionFiltre = option.cloneNode(true);
      selectFiltre.appendChild(optionFiltre);
    });
  }

  function mettreAJourDashboard() {
    const depense = totalDepenses();
    const solde = (Number(etat.budget) || 0) - depense;
    const economise = etat.objectif ? Number(etat.objectif.economise) || 0 : 0;
    const pct = pourcentageBudget();
    const niveau = niveauBudget(pct);
    const now = new Date();

    el("periode-affichage").textContent =
      `Période : ${MONTHS_FR[now.getMonth()]} ${now.getFullYear()} · devise TND`;

    el("kpi-budget").textContent = formaterMontant(etat.budget);
    el("kpi-depense").textContent = formaterMontant(depense);
    el("kpi-solde").textContent = formaterMontant(solde);
    el("kpi-epargne").textContent = formaterMontant(economise);

    el("kpi-budget-hint").textContent = etat.epargneMensuelle
      ? `Objectif d'épargne mensuel : ${formaterMontant(etat.epargneMensuelle)}`
      : "Objectif du mois";
    el("kpi-depense-hint").textContent = `${etat.depenses.length} dépense(s) enregistrée(s)`;
    el("kpi-solde-hint").textContent = solde < 0 ? "Budget dépassé" : "Budget − dépenses";
    el("kpi-epargne-hint").textContent = etat.objectif
      ? `Vers « ${etat.objectif.nom} »`
      : "Aucun objectif d'épargne";

    const cardSolde = el("card-solde");
    cardSolde.classList.remove("ok", "warn", "alert");
    cardSolde.classList.add(niveau);

    const largeur = Math.min(pct, 100);
    const fill = el("progress-fill");
    fill.style.width = `${largeur}%`;
    fill.classList.remove("warn", "alert");
    if (niveau !== "ok") fill.classList.add(niveau);

    el("progress-percent").textContent = `${pct.toFixed(1).replace(".", ",")} %`;
    el("progress-bar").setAttribute("aria-valuenow", String(Math.round(Math.min(pct, 100))));

    const statut = el("budget-status");
    statut.className = `status-badge ${niveau}`;
    if (!etat.budget) {
      statut.textContent = "Définissez un budget mensuel pour suivre votre consommation.";
    } else if (pct > 100) {
      statut.textContent = "Alerte : le budget mensuel est dépassé.";
    } else if (pct >= 90) {
      statut.textContent = "Alerte : le budget est presque épuisé.";
    } else if (pct >= 70) {
      statut.textContent = "Attention : une grande partie du budget est déjà consommée.";
    } else {
      statut.textContent = "Situation normale : le budget est bien maîtrisé.";
    }
  }

  function depensesFiltreesTriees() {
    const filtre = el("filtre-categorie").value;
    const tri = el("tri-depenses").value;
    let liste = etat.depenses.slice();

    if (filtre !== "toutes") {
      liste = liste.filter((d) => d.categorie === filtre);
    }

    liste.sort((a, b) => {
      if (tri === "date-desc") return b.date.localeCompare(a.date);
      if (tri === "date-asc") return a.date.localeCompare(b.date);
      if (tri === "montant-asc") return Number(a.montant) - Number(b.montant);
      if (tri === "montant-desc") return Number(b.montant) - Number(a.montant);
      return 0;
    });

    return liste;
  }

  function afficherHistorique() {
    const liste = el("liste-depenses");
    const items = depensesFiltreesTriees();
    liste.innerHTML = "";

    if (etat.depenses.length === 0) {
      liste.innerHTML = '<li class="empty-state">Aucune dépense pour le moment. Ajoutez-en une pour commencer le suivi.</li>';
      return;
    }

    if (items.length === 0) {
      liste.innerHTML = '<li class="empty-state">Aucune dépense ne correspond au filtre sélectionné.</li>';
      return;
    }

    items.forEach((depense) => {
      const cat = categorieParId(depense.categorie);
      const li = document.createElement("li");
      li.className = "expense-item";
      li.innerHTML = `
        <span class="cat-icon" aria-hidden="true">${cat.icon}</span>
        <div>
          <p class="expense-title">${echapper(depense.description)}</p>
          <p class="expense-meta">${cat.label} · ${formaterDate(depense.date)}</p>
          <div class="expense-actions">
            <button type="button" class="btn btn-ghost btn-tiny" data-action="edit" data-id="${depense.id}">Modifier</button>
            <button type="button" class="btn btn-danger-ghost btn-tiny" data-action="delete" data-id="${depense.id}">Supprimer</button>
          </div>
        </div>
        <div class="amount-block">
          <p class="expense-amount">${formaterMontant(depense.montant)}</p>
        </div>
      `;
      liste.appendChild(li);
    });
  }

  function echapper(texte) {
    return String(texte)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function dessinerGraphique() {
    const canvas = el("graphique-categories");
    const ctx = canvas.getContext("2d");
    const totaux = totauxParCategorie();
    const total = totalDepenses();
    const taille = 320;
    canvas.width = taille;
    canvas.height = taille;

    ctx.clearRect(0, 0, taille, taille);
    const cx = taille / 2;
    const cy = taille / 2;
    const rayon = 118;

    if (total <= 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, rayon, 0, Math.PI * 2);
      ctx.fillStyle = "#e2e8f0";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, 68, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.fillStyle = "#4b5d67";
      ctx.font = "16px Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Pas de données", cx, cy + 5);
    } else {
      let angle = -Math.PI / 2;
      CATEGORIES.forEach((cat) => {
        const valeur = totaux[cat.id];
        if (valeur <= 0) return;
        const part = (valeur / total) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, rayon, angle, angle + part);
        ctx.closePath();
        ctx.fillStyle = cat.color;
        ctx.fill();
        angle += part;
      });
      ctx.beginPath();
      ctx.arc(cx, cy, 68, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.fillStyle = "#0f1c24";
      ctx.font = "bold 18px Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(formaterMontant(total), cx, cy + 6);
    }

    const legende = el("legende-categories");
    legende.innerHTML = "";
    CATEGORIES.forEach((cat) => {
      const valeur = totaux[cat.id];
      if (valeur <= 0 && total > 0) return;
      if (total <= 0 && cat.id !== "autre") return;
      if (total <= 0 && cat.id === "autre") {
        legende.innerHTML = "<li>Ajoutez des dépenses pour voir la répartition.</li>";
        return;
      }
      const pct = total > 0 ? ((valeur / total) * 100).toFixed(1).replace(".", ",") : "0";
      const li = document.createElement("li");
      li.innerHTML = `<span><span class="swatch" style="background:${cat.color}"></span>${cat.icon} ${cat.label}</span><strong>${formaterMontant(valeur)} · ${pct} %</strong>`;
      legende.appendChild(li);
    });
  }

  function afficherAssistant() {
    const liste = el("liste-conseils");
    const conseils = [];
    const pct = pourcentageBudget();
    const totaux = totauxParCategorie();
    const total = totalDepenses();

    if (!etat.budget) {
      conseils.push("Définissez un budget mensuel pour obtenir des conseils adaptés.");
    } else if (pct > 100) {
      conseils.push("🚨 Votre budget mensuel est dépassé.");
    } else if (pct >= 90) {
      conseils.push("🔴 Attention, votre budget est presque épuisé.");
    } else if (pct >= 70) {
      conseils.push("🟠 Attention, vous avez déjà utilisé une grande partie de votre budget.");
    } else {
      conseils.push("🟢 Votre budget est actuellement bien maîtrisé.");
    }

    if (total > 0) {
      let maxId = CATEGORIES[0].id;
      CATEGORIES.forEach((c) => {
        if (totaux[c.id] > totaux[maxId]) maxId = c.id;
      });
      const principale = categorieParId(maxId);
      conseils.push(`Votre catégorie de dépense principale est : ${principale.icon} ${principale.label}.`);

      const part = totaux[maxId] / total;
      if (part >= 0.35) {
        conseils.push(`${principale.label} représente une part importante de vos dépenses ce mois-ci (${(part * 100).toFixed(0)} %).`);
      }

      if (totaux.loisirs / total >= 0.25) {
        conseils.push("Les loisirs représentent une part importante de vos dépenses ce mois-ci.");
      }
      if (totaux.alimentation / total >= 0.4) {
        conseils.push("L'alimentation concentre une grande partie de votre budget. Planifier les repas peut aider.");
      }
      if (totaux.abonnements > 0 && totaux.abonnements / Math.max(etat.budget, 1) >= 0.15) {
        conseils.push("Vos abonnements pèsent sur le budget. Vérifiez ceux dont vous pouvez vous passer.");
      }
    } else {
      conseils.push("Aucune dépense enregistrée : le suivi commencera dès la première saisie.");
    }

    if (etat.objectif) {
      const reste = Math.max(0, etat.objectif.cible - etat.objectif.economise);
      const avancement = etat.objectif.cible > 0
        ? (etat.objectif.economise / etat.objectif.cible) * 100
        : 0;
      if (avancement >= 100) {
        conseils.push(`Objectif « ${etat.objectif.nom} » atteint. Bravo !`);
      } else {
        conseils.push(`Il vous reste ${formaterMontant(reste)} pour atteindre « ${etat.objectif.nom} ».`);
      }
    }

    if (etat.epargneMensuelle > 0) {
      const solde = (Number(etat.budget) || 0) - total;
      if (solde < etat.epargneMensuelle) {
        conseils.push("Le solde restant est inférieur à votre objectif d'épargne mensuel.");
      } else {
        conseils.push("Le solde actuel permet encore d'atteindre votre objectif d'épargne mensuel.");
      }
    }

    liste.innerHTML = conseils.map((c) => `<li>${echapper(c)}</li>`).join("");
  }

  function afficherObjectif() {
    const affichage = el("objectif-affichage");
    const form = el("form-objectif");
    if (!form.hidden) return;

    if (!etat.objectif) {
      el("objectif-nom").textContent = "Aucun objectif défini";
      el("objectif-cible").textContent = "—";
      el("objectif-economise").textContent = "—";
      el("objectif-progression").textContent = "—";
      el("objectif-fill").style.width = "0%";
      el("objectif-bar").setAttribute("aria-valuenow", "0");
      affichage.hidden = false;
      return;
    }

    const { nom, cible, economise } = etat.objectif;
    const pct = cible > 0 ? Math.max(0, (economise / cible) * 100) : 0;
    el("objectif-nom").textContent = nom;
    el("objectif-cible").textContent = formaterMontant(cible);
    el("objectif-economise").textContent = formaterMontant(economise);
    el("objectif-progression").textContent = `${pct.toFixed(1).replace(".", ",")} %`;
    el("objectif-fill").style.width = `${Math.min(pct, 100)}%`;
    el("objectif-bar").setAttribute("aria-valuenow", String(Math.round(Math.min(pct, 100))));
    affichage.hidden = false;
  }

  function rafraichirTout() {
    mettreAJourDashboard();
    afficherHistorique();
    dessinerGraphique();
    afficherAssistant();
    afficherObjectif();
  }

  function ouvrirBudget() {
    el("section-budget").hidden = false;
    el("input-budget").value = etat.budget || "";
    el("input-epargne-mensuelle").value = etat.epargneMensuelle || "";
    el("input-budget").focus();
  }

  function fermerBudget() {
    el("section-budget").hidden = true;
    afficherErreur("erreur-budget", "");
    afficherErreur("erreur-epargne-mensuelle", "");
  }

  function validerNombre(valeur, options) {
    const n = Number(valeur);
    if (valeur === "" || Number.isNaN(n)) return { ok: false, message: "Saisissez un montant valide." };
    if (options.minExclusif !== undefined && n <= options.minExclusif) {
      return { ok: false, message: options.messageMin || "Le montant doit être supérieur à zéro." };
    }
    if (options.min !== undefined && n < options.min) {
      return { ok: false, message: options.messageMin || "Le montant est trop petit." };
    }
    return { ok: true, valeur: n };
  }

  function confirmer(message, ensuite) {
    const dialog = el("dialog-confirm");
    el("dialog-message").textContent = message;
    actionConfirmee = ensuite;
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else if (window.confirm(message)) {
      ensuite();
    }
  }

  function nouveauId() {
    return "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function reinitialiserFormulaireDepense() {
    idEdition = null;
    el("form-depense").reset();
    el("input-date").value = dateDuJour();
    el("btn-submit-depense").textContent = "Ajouter la dépense";
    el("btn-annuler-edition").hidden = true;
    el("titre-ajout").textContent = "Ajouter une dépense";
    ["erreur-description", "erreur-montant", "erreur-date", "erreur-categorie"].forEach((id) => afficherErreur(id, ""));
  }

  function commencerEdition(id) {
    const depense = etat.depenses.find((d) => d.id === id);
    if (!depense) return;
    idEdition = id;
    el("input-description").value = depense.description;
    el("input-montant").value = depense.montant;
    el("input-categorie").value = depense.categorie;
    el("input-date").value = depense.date;
    el("btn-submit-depense").textContent = "Enregistrer les modifications";
    el("btn-annuler-edition").hidden = false;
    el("titre-ajout").textContent = "Modifier une dépense";
    el("input-description").focus();
    el("form-depense").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function supprimerDepense(id) {
    etat.depenses = etat.depenses.filter((d) => d.id !== id);
    if (idEdition === id) reinitialiserFormulaireDepense();
    sauvegarder();
    rafraichirTout();
  }

  function ouvrirFormObjectif() {
    const o = etat.objectif || { nom: "", cible: "", economise: "" };
    el("input-objectif-nom").value = o.nom || "";
    el("input-objectif-cible").value = o.cible || "";
    el("input-objectif-economise").value = o.economise || 0;
    el("form-objectif").hidden = false;
    el("objectif-affichage").hidden = true;
    el("input-objectif-nom").focus();
  }

  function fermerFormObjectif() {
    el("form-objectif").hidden = true;
    afficherErreur("erreur-objectif-nom", "");
    afficherErreur("erreur-objectif-cible", "");
    afficherErreur("erreur-objectif-economise", "");
    afficherObjectif();
  }

  function brancherEvenements() {
    el("btn-modifier-budget").addEventListener("click", ouvrirBudget);
    el("btn-annuler-budget").addEventListener("click", fermerBudget);

    el("form-budget").addEventListener("submit", (e) => {
      e.preventDefault();
      const budget = validerNombre(el("input-budget").value, { minExclusif: 0, messageMin: "Le budget doit être supérieur à zéro." });
      const epargneBrute = el("input-epargne-mensuelle").value;
      let epargneOk = { ok: true, valeur: 0 };
      if (epargneBrute !== "") {
        epargneOk = validerNombre(epargneBrute, { min: 0, messageMin: "L'épargne mensuelle ne peut pas être négative." });
      }
      afficherErreur("erreur-budget", budget.ok ? "" : budget.message);
      afficherErreur("erreur-epargne-mensuelle", epargneOk.ok ? "" : epargneOk.message);
      if (!budget.ok || !epargneOk.ok) return;
      etat.budget = budget.valeur;
      etat.epargneMensuelle = epargneOk.valeur;
      sauvegarder();
      fermerBudget();
      rafraichirTout();
    });

    el("form-depense").addEventListener("submit", (e) => {
      e.preventDefault();
      const description = el("input-description").value.trim();
      const montant = validerNombre(el("input-montant").value, { minExclusif: 0 });
      const categorie = el("input-categorie").value;
      const date = el("input-date").value;
      let ok = true;

      if (!description) {
        afficherErreur("erreur-description", "La description est obligatoire.");
        ok = false;
      } else {
        afficherErreur("erreur-description", "");
      }

      if (!montant.ok) {
        afficherErreur("erreur-montant", montant.message);
        ok = false;
      } else {
        afficherErreur("erreur-montant", "");
      }

      if (!categorie) {
        afficherErreur("erreur-categorie", "Choisissez une catégorie.");
        ok = false;
      } else {
        afficherErreur("erreur-categorie", "");
      }

      if (!date || Number.isNaN(new Date(date).getTime())) {
        afficherErreur("erreur-date", "Indiquez une date valide.");
        ok = false;
      } else {
        afficherErreur("erreur-date", "");
      }

      if (!ok) return;

      const payload = {
        id: idEdition || nouveauId(),
        description,
        montant: montant.valeur,
        categorie,
        date
      };

      if (idEdition) {
        const index = etat.depenses.findIndex((d) => d.id === idEdition);
        if (index >= 0) etat.depenses[index] = payload;
      } else {
        etat.depenses.push(payload);
      }

      sauvegarder();
      reinitialiserFormulaireDepense();
      rafraichirTout();
    });

    el("btn-annuler-edition").addEventListener("click", reinitialiserFormulaireDepense);

    el("liste-depenses").addEventListener("click", (e) => {
      const bouton = e.target.closest("button[data-action]");
      if (!bouton) return;
      const id = bouton.getAttribute("data-id");
      if (bouton.getAttribute("data-action") === "edit") {
        commencerEdition(id);
      } else if (bouton.getAttribute("data-action") === "delete") {
        confirmer("Supprimer cette dépense ? Cette action est définitive.", () => supprimerDepense(id));
      }
    });

    el("filtre-categorie").addEventListener("change", afficherHistorique);
    el("tri-depenses").addEventListener("change", afficherHistorique);

    el("btn-modifier-objectif").addEventListener("click", ouvrirFormObjectif);
    el("btn-annuler-objectif").addEventListener("click", fermerFormObjectif);

    el("form-objectif").addEventListener("submit", (e) => {
      e.preventDefault();
      const nom = el("input-objectif-nom").value.trim();
      const cible = validerNombre(el("input-objectif-cible").value, { minExclusif: 0, messageMin: "Le montant cible doit être supérieur à zéro." });
      const economise = validerNombre(el("input-objectif-economise").value, { min: 0, messageMin: "Le montant économisé ne peut pas être négatif." });
      let ok = true;
      if (!nom) {
        afficherErreur("erreur-objectif-nom", "Le nom de l'objectif est obligatoire.");
        ok = false;
      } else {
        afficherErreur("erreur-objectif-nom", "");
      }
      afficherErreur("erreur-objectif-cible", cible.ok ? "" : cible.message);
      afficherErreur("erreur-objectif-economise", economise.ok ? "" : economise.message);
      if (!cible.ok || !economise.ok) ok = false;
      if (!ok) return;
      etat.objectif = { nom, cible: cible.valeur, economise: economise.valeur };
      sauvegarder();
      fermerFormObjectif();
      rafraichirTout();
    });

    el("btn-supprimer-objectif").addEventListener("click", () => {
      if (!etat.objectif) return;
      confirmer("Supprimer l'objectif d'épargne ?", () => {
        etat.objectif = null;
        sauvegarder();
        fermerFormObjectif();
        rafraichirTout();
      });
    });

    el("btn-reinitialiser").addEventListener("click", () => {
      confirmer("Réinitialiser toutes les données et recharger l'exemple de démonstration ?", () => {
        etat = donneesDemo();
        sauvegarder();
        reinitialiserFormulaireDepense();
        fermerBudget();
        fermerFormObjectif();
        rafraichirTout();
      });
    });

    function fermerDialogue() {
      const dialog = el("dialog-confirm");
      if (dialog.open) dialog.close();
    }

    el("dialog-confirm-btn").addEventListener("click", () => {
      const fn = actionConfirmee;
      actionConfirmee = null;
      fermerDialogue();
      if (typeof fn === "function") fn();
    });

    el("dialog-annuler-btn").addEventListener("click", () => {
      actionConfirmee = null;
      fermerDialogue();
    });

    el("dialog-confirm").addEventListener("cancel", () => {
      actionConfirmee = null;
    });
  }

  function demarrer() {
    remplirSelectsCategories();
    charger();
    el("input-date").value = dateDuJour();
    brancherEvenements();
    rafraichirTout();
  }

  document.addEventListener("DOMContentLoaded", demarrer);
})();
