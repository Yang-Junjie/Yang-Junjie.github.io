---
date : '2026-05-25T20:34:33+08:00'
draft : true
title : '【CG | Re0:PathTracing】| Microfacet Theory | 0x04'
tags:
  - graphics

categories:
  - blog

math: true
---

# Abstract
上一节，我们学习并实现了简单的 Lambertian 漫反射材质模型，这一节我们将学习更复杂的 Cook-Torrance 材质模型并将其实现到我们现有的渲染器中。

# Microfacet Theory
上一节，我们也提到过“在 Re0:0x02 中我们给出了 BRDF 的定义，但是那只是定义式是没办法用于真正计算的，所以我们需要对真实的材质在我们的定义式下进行建模，通过建模后的式子才适合用于计算”，然后我们给出了简单的漫反射材质模型，这一节我们将学习更复杂的材质模型。而这个材质模型是由 Robert L. Cook（来自 Lucasfilm）和 Kenneth E. Torrance（来自康奈尔大学）于 1982 年发表的《计算机图形学的反射模型》（A Reflectance Model for Computer Graphics[^1]）所提出的。我们将结合这篇论文和 Google filament 的白皮书 《Physically Based Rendering in Filament[^2]》来仔细讲解和实现。

# Cook-Torrance model

# References
[^1]: https://cseweb.ucsd.edu/~viscomp/classes/cse168/sp26/readings/cookpaper.pdf
[^2]: https://google.github.io/filament/Filament.md.html