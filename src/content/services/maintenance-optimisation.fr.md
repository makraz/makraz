---
slug: maintenance-optimisation
lang: fr
kind: leaf
pillar: developpement
order: 8
title: "Maintenance & optimisation"
seoTitle: "Maintenance et reprise d'application existante — MAKRAZ"
lead: "Reprendre, sécuriser et accélérer une application existante — y compris quand ce n'est pas nous qui l'avons écrite."
included:
  - title: Audit de reprise
    description: "Lecture du code, de l'infrastructure et des dépendances avant tout engagement. Nous vous disons ce que nous trouvons, y compris quand la réponse est inconfortable."
  - title: Correctifs de sécurité
    description: "Mise à jour des dépendances vulnérables, revue des accès et des secrets, et fermeture de ce qui ne devrait pas être exposé."
  - title: Optimisation des performances
    description: "Mesure d'abord, correction ensuite : requêtes lentes, images non optimisées, pages qui se chargent trois fois. On ne devine pas, on mesure."
  - title: Évolutions fonctionnelles
    description: "Ajouts et modifications au rythme de votre activité, sur un code qu'on a d'abord pris le temps de comprendre."
  - title: Reprise de la documentation
    description: "Comment l'application se déploie, où sont les secrets, ce qui est fragile. Écrit une fois, utile pendant des années."
  - title: Plan de sortie de dette
    description: "Ce qui doit être réécrit, dans quel ordre, et ce qui peut rester tel quel — la plupart du code hérité n'a pas besoin d'être touché."
steps:
  - title: Lire
    description: "Quelques jours dans le code et l'infrastructure avant toute promesse. Reprendre l'existant sans le comprendre est la façon la plus sûre de le casser."
  - title: Sécuriser
    description: "D'abord ce qui présente un risque immédiat : dépendances vulnérables, accès trop larges, absence de sauvegarde testée."
  - title: Stabiliser
    description: "Les irritants quotidiens de vos utilisateurs, et les erreurs qui remplissent les journaux sans que personne ne les lise."
  - title: Améliorer
    description: "Performance et évolutions, une fois la base saine. Dans cet ordre, jamais l'inverse."
engagement:
  model: "Audit de reprise facturé seul, sans engagement de suite — vous pouvez repartir avec ses conclusions. Ensuite, forfait mensuel avec un volume d'heures, ou intervention à la demande."
  drivers: "L'âge et la taille du code, la qualité de la documentation existante, le nombre de dépendances à jour ou non, et le niveau de disponibilité attendu."
faq:
  - q: "Reprenez-vous du code écrit par quelqu'un d'autre ?"
    a: "Régulièrement, et sans jugement : la plupart des bases héritées sont le résultat de contraintes réelles. Nous commençons toujours par un audit, parce que promettre un délai sur du code qu'on n'a pas lu n'a aucune valeur."
  - q: "Faut-il tout réécrire ?"
    a: "Presque jamais. La réécriture complète est la décision la plus risquée et la plus coûteuse ; elle se justifie sur une partie du système, rarement sur l'ensemble. Nous cherchons d'abord ce qui peut être sauvé."
  - q: "Notre développeur est parti sans documentation. Est-ce récupérable ?"
    a: "Oui, c'est le cas de figure le plus fréquent. Le premier livrable est alors la documentation elle-même : comment déployer, où sont les accès, ce qui est fragile — pour que la situation ne se reproduise pas."
---

Une application héritée arrive rarement avec une notice. Elle arrive avec un développeur parti, des dépendances de trois ans, un déploiement que personne n'ose lancer, et une liste de choses « à ne pas toucher » transmise oralement. La tentation est alors de tout réécrire — la décision la plus coûteuse et la plus risquée qu'on puisse prendre à ce stade.

Nous commençons donc par lire, puis par sécuriser, avant d'améliorer quoi que ce soit. Dans la grande majorité des cas, le code hérité est bien plus récupérable qu'il n'y paraît : ce qui manquait n'était pas la qualité, mais quelqu'un qui prenne le temps de le comprendre et d'écrire ce qu'il a compris.
