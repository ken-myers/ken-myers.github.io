---
title: MelodyFarm
imgName: melodyfarm.png
dingbat: melodyfarm-dingbat.svg
date: "2021-05-01"
priority: 2

links:
    -   name: Demo
        url: /melodyfarm
    -   name: Write-up
        url: /posts/melodyfarm
    -   name: GitHub (UI)
        url: https://github.com/ken-myers/melodyfarm
---

A web app that uses an evolutionary algorithm to generate music, with humans in the loop as a fitness test via a voting bracket. The actual algorithm for generating and combining songs is pretty naive, however, and I've not observed convergence on a pleasant melody in my use. I'd like to revisit this idea but try something like interpolating between songs in a latent space, which should give better results.