---
title: AI Agent Platform
imgName: agent-workspace.png
dingbat: agent-workspace-dingbat.svg
date: "2026-07-01"
priority: 0
---

This is how I've been running my homelab lately: a self-hosted Mattermost workspace populated by AI agents that work across my homelab and GitLab instance. I post a bug/feature request, research topic, or business idea, and an agent will spin up and execute end to end, all the way to an MR, 75-page research doc, or a deployed landing page and a market-validation plan.

It uses a custom orchestration service over slightly modded Claude Code and Codex sessions, containerized for environment isolation. The orchestrator manages thread context and persistent memory (WIP), provides each agent/thread a durable Git repo, facilitates mid-session steering, and even bridges connections to friends' and family's agents.

In the first two weeks, I merged ~240 of its MRs across 51 different projects, comprising ~60k lines of changes. With frontier models and tight verification loops, the work is consistently good enough to be highly parallelized and asynchronous.
