---
imgName: wordhunter.gif
dingbat: wordhunter-dingbat.svg
dingbatHeight: 60px
date: "2024-05-01"
priority: 1

links:
    -   name: Demo
        url: /wordhunter
    -   name: GitHub
        url: https://github.com/ken-myers/wordhunter


---

A web-based solver for iMessage/GamePigeon Word Hunt. It uses OpenCV to identify the grid and letters and traverses a trie'd English dictionary to find all possible words, as well as summary stats like total available points and word count (finding these was the original motivation for this project). The app is completely client-based; all CV and solving logic happens in the browser through vanilla JS. 

I don't even have an iPhone---I had to test with screenshots I found on Google.
