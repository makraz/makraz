---
slug: api-integrations
lang: fr
kind: leaf
pillar: developpement
order: 6
title: "API & intégrations"
seoTitle: "Développement d'API et intégrations métier — MAKRAZ"
lead: "Faire parler vos outils entre eux : paiement, CRM, ERP, logistique — et des API que d'autres pourront consommer."
included:
  - title: Conception d'API
    description: "Points d'entrée, formats, versions, authentification. Documentés dès l'écriture, parce qu'une API sans documentation n'est utilisable que par son auteur."
  - title: Intégration de services tiers
    description: "Paiement, facturation, CRM, transporteurs, messagerie. Nous lisons leur documentation à votre place, y compris les parties gênantes."
  - title: Synchronisation des données
    description: "Qui fait référence en cas de conflit, à quelle fréquence, et ce qui se passe quand deux systèmes ne sont pas d'accord."
  - title: Gestion des erreurs
    description: "Reprises automatiques, file d'attente, alertes. La partie que l'on découvre trop tard : un service tiers tombe toujours un jour."
  - title: Surveillance
    description: "Journalisation et alertes sur les échanges critiques, pour que vous appreniez une panne d'intégration autrement que par un client mécontent."
steps:
  - title: Cartographier
    description: "Quels systèmes, quelles données circulent, dans quel sens, et lesquelles ne doivent jamais être dupliquées."
  - title: Concevoir
    description: "Contrats d'échange écrits et validés avant développement — c'est ce qui évite les mois d'allers-retours."
  - title: Construire
    description: "Développement contre les environnements de test des services tiers, avec les cas d'échec traités dès le départ."
  - title: Basculer
    description: "Passage en production progressif, surveillance rapprochée, et reprise des données déjà accumulées."
engagement:
  model: "Forfait par intégration lorsque le périmètre est connu, régie pour un chantier d'interconnexion plus large. Les clés d'API et les comptes restent chez vous."
  drivers: "Le nombre de systèmes à relier, la qualité de leur documentation, le volume de données à synchroniser, et l'existence ou non d'un environnement de test côté partenaire."
faq:
  - q: "Nos outils n'ont pas d'API. Est-ce bloquant ?"
    a: "Pas toujours. Selon le système, il reste l'export programmé, la base de données en lecture, ou un connecteur intermédiaire. C'est moins élégant, cela fonctionne, et nous le disons clairement avant de commencer."
  - q: "Que se passe-t-il si le service tiers change son API ?"
    a: "Nous isolons l'intégration derrière une couche à nous, précisément pour qu'un changement chez eux se corrige en un point unique plutôt que dans tout votre code."
  - q: "Pouvez-vous reprendre une intégration existante qui casse souvent ?"
    a: "Oui, et c'est une demande fréquente. Ces cassures viennent presque toujours de l'absence de reprise sur erreur et de surveillance — le code fonctionne, il n'a simplement jamais prévu l'échec."
---

Une intégration ne se casse pas le jour de sa livraison. Elle se casse trois mois plus tard, un vendredi soir : le service de paiement a renvoyé une erreur temporaire, personne ne l'a rattrapée, et deux cents commandes se sont accumulées sans être transmises à la logistique. Le code fonctionnait parfaitement — il n'avait simplement jamais envisagé l'échec.

Nous traitons donc les cas d'erreur comme le cœur du travail, pas comme un détail final : reprises automatiques, file d'attente, alertes quand une intégration décroche. Et nous isolons chaque service tiers derrière une couche à nous, pour qu'un changement dans leur API se répare en un endroit plutôt que partout.
