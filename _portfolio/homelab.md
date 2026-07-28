---
title: Homelab
imgName: homelab.webp
dingbat: homelab-dingbat.svg
date: "2026-07-01"
displayDate: "Since 2023"
priority: 1
---

An extremely (over)engineered personal cloud running mostly out of a server rack in my home-office closet. It spans 18 hosts (bare metal + VMs). The hardware and network layer includes a ~100 TB Unraid NAS; an OPNsense router, managed switch, and wireless access points; and an RTX 4090 rig for local AI inference. The software stack includes Proxmox for VMs; NixOS for declarative host configuration; self-hosted GitLab and CI; a three-node k3s cluster running ~80 pods; Vault for secret management; centralized logging and metrics; custom agent orchestrators; and a growing pile of other custom software.

Nearly all of it is declared in code and managed through GitOps, making it legible to the agents running inside it and allowing them to continuously improve the lab with minimal human bottlenecking.
