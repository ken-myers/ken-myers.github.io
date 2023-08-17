---
imgName: psonic.png
dingbat: psonic-dingbat.svg
date: "2020-05-01"
priority: 2

links:
    -   name: GitHub
        url: https://github.com/ken-myers/hackmhs

---

A password manager app I made with a friend that won first place at our high school hackathon. The app is built with Electron. It generates mnemonics that are always valid English sentences (or multiple sentences) and accounts for case, numbers, and special characters. E.g.,

```
u0mPhP.arLE&S! ---> "unbearable zero-mouthed Patricks hate Pontiacs. armies repair Lithuanian Esthers and Saturns!"
```

I designed and implemented the mnemonic algorithm and wrote most of the logic for the app. (My partner did the UI and password storage.)