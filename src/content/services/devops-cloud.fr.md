---
slug: devops-cloud
lang: fr
kind: leaf
pillar: developpement
order: 7
title: "DevOps & Cloud"
seoTitle: "DevOps, cloud et déploiement continu — MAKRAZ"
lead: "Des déploiements que n'importe qui dans l'équipe peut lancer, et une infrastructure dont on connaît le coût et l'état."
included:
  - title: Pipelines de livraison
    description: "Tests, construction et déploiement automatisés à chaque modification. Livrer devient un geste banal plutôt qu'un événement redouté."
  - title: Environnements
    description: "Développement, préproduction, production — identiques et reproductibles, pour qu'un bug ne dépende plus de la machine sur laquelle il apparaît."
  - title: Infrastructure décrite en code
    description: "Ce qui tourne est écrit dans le dépôt, versionné et relisible. Fin des serveurs configurés à la main dont personne n'ose toucher les réglages."
  - title: Surveillance & alertes
    description: "Disponibilité, erreurs, temps de réponse, et une alerte qui part avant que le client n'appelle."
  - title: Sauvegardes & restauration
    description: "Sauvegardes automatiques et — la partie qu'on oublie — une restauration réellement testée. Une sauvegarde jamais restaurée n'est pas une sauvegarde."
  - title: Maîtrise des coûts
    description: "Dimensionnement honnête et suivi de la facture cloud, pour éviter de payer une infrastructure prévue pour dix fois votre trafic."
steps:
  - title: Auditer
    description: "Comment vous déployez aujourd'hui, qui sait le faire, et ce qui casse habituellement."
  - title: Automatiser
    description: "Le pipeline d'abord, parce que c'est ce qui rend tout le reste sûr : on ne peut pas améliorer ce qu'on a peur de redéployer."
  - title: Instrumenter
    description: "Surveillance, journaux et alertes — pour découvrir les pannes autrement que par un message de client."
  - title: Transmettre
    description: "Documentation courte et session de passation, afin que votre équipe opère sans nous."
engagement:
  model: "Forfait pour la mise en place, puis astreinte ou intervention à la demande. Tous les comptes cloud sont ouverts à votre nom : votre infrastructure ne doit jamais dépendre de notre compte."
  drivers: "Le nombre d'environnements et de services à orchestrer, les exigences de disponibilité, et l'état du point de départ — automatiser un déploiement manuel demande d'abord de le comprendre."
faq:
  - q: "Sommes-nous trop petits pour avoir besoin de tout cela ?"
    a: "Le pipeline et les sauvegardes, non : ils coûtent peu et évitent les pires journées. Kubernetes et l'autoscaling, probablement oui — nous vous le dirons plutôt que de vous les vendre."
  - q: "AWS, GCP ou Cloudflare ?"
    a: "Selon la charge réelle. Beaucoup d'applications tournent très bien, et pour bien moins cher, sur une plateforme simple que sur un cloud complet sous-utilisé."
  - q: "Une seule personne sait déployer chez nous. Est-ce grave ?"
    a: "C'est le risque le plus courant et le plus facile à supprimer. L'objectif d'une automatisation n'est pas la vitesse : c'est que le départ en vacances de cette personne cesse d'être un problème."
---

Dans beaucoup d'équipes, déployer est un rituel : une seule personne sait le faire, cela se fait le soir, et on évite le vendredi. La conséquence n'est pas seulement le stress — c'est que plus rien ne change. Les correctifs attendent, les améliorations s'accumulent, et le produit se dégrade parce que l'acte de livrer coûte trop cher psychologiquement.

Nous commençons donc toujours par le pipeline : rendre le déploiement banal, reproductible et lançable par n'importe qui. Le reste — environnements identiques, surveillance, sauvegardes réellement testées — vient ensuite, et devient possible précisément parce que redéployer ne fait plus peur.
