---
slug: devops-cloud
lang: en
kind: leaf
pillar: developpement
order: 7
title: "DevOps & Cloud"
seoTitle: "DevOps, cloud and continuous delivery — MAKRAZ"
lead: "Deployments anyone on the team can run, and infrastructure whose cost and state are actually known."
included:
  - title: Delivery pipelines
    description: "Automated tests, build and deploy on every change. Shipping becomes unremarkable rather than an event people dread."
  - title: Environments
    description: "Development, staging, production — identical and reproducible, so a bug no longer depends on which machine it appeared on."
  - title: Infrastructure as code
    description: "What runs is written in the repository, versioned and reviewable. No more hand-configured servers whose settings nobody dares touch."
  - title: Monitoring & alerting
    description: "Uptime, errors, response times, and an alert that fires before the customer phones."
  - title: Backups & restore
    description: "Automated backups and — the part everyone forgets — a restore that has actually been tested. A backup never restored is not a backup."
  - title: Cost control
    description: "Honest sizing and tracking of the cloud bill, so you are not paying for infrastructure built for ten times your traffic."
steps:
  - title: Audit
    description: "How you deploy today, who knows how, and what usually breaks."
  - title: Automate
    description: "The pipeline first, because it makes everything else safe: you cannot improve what you are afraid to redeploy."
  - title: Instrument
    description: "Monitoring, logs and alerts — so outages are discovered by something other than a customer message."
  - title: Hand over
    description: "Short documentation and a handover session, so your team operates it without us."
engagement:
  model: "Fixed price for the setup, then on-call or on-demand help. Cloud accounts are opened in your name: your infrastructure must never depend on our account."
  drivers: "How many environments and services need orchestrating, your availability requirements, and the state of the starting point — automating a manual deploy means understanding it first."
faq:
  - q: "Are we too small to need any of this?"
    a: "Not for the pipeline and backups: they cost little and prevent your worst days. Kubernetes and autoscaling, probably yes — we will tell you so rather than sell them to you."
  - q: "AWS, GCP or Cloudflare?"
    a: "It depends on the real load. Plenty of applications run perfectly well, and for far less, on a simple platform than on an underused full cloud."
  - q: "Only one person here can deploy. Is that bad?"
    a: "It is the most common risk and the easiest to remove. The point of automation is not speed: it is that this person going on holiday stops being a problem."
---

In many teams, deploying is a ritual: one person knows how, it happens in the evening, and Fridays are avoided. The cost is not only stress — it is that nothing changes any more. Fixes wait, improvements queue up, and the product decays because the act of shipping is psychologically too expensive.

So we always start with the pipeline: make deployment unremarkable, reproducible and runnable by anyone. Everything else — identical environments, monitoring, backups that have actually been restored — follows, and becomes possible precisely because redeploying is no longer frightening.
