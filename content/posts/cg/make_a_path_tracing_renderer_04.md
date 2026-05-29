---
date : '2026-05-25T20:34:33+08:00'
draft : true
title : '【CG | Re0:PathTracing】| Specular Reflection | 0x04'
tags:
  - graphics

categories:
  - blog

math: true
---

# Abstract
上一节，我们学习并实现了简单的 Lambertian 漫反射材质模型，这一节我们将学习更复杂的 Cook-Torrance 材质模型并将其实现到我们现有的渲染器中。

# Microfacet Theory
上一节，我们也提到过“在 Re0:0x02 中我们给出了 BRDF 的定义，但是那只是定义式是没办法用于真正计算的，所以我们需要对真实的材质在我们的定义式下进行建模，通过建模后的式子才适合用于计算”，然后我们给出了简单的漫反射材质模型，这一节我们将学习更复杂的材质模型。而这个材质模型是由 Robert L. Cook（来自 Lucasfilm）和 Kenneth E. Torrance（来自康奈尔大学）于 1982 年发表的《计算机图形学的反射模型》（A Reflectance Model for Computer Graphics[^1]）所提出的。我们将结合这篇论文、 Google filament 的白皮书 《Physically Based Rendering in Filament[^2]》和 Real Shading in Unreal Engine 4[^3] 来仔细讲解和实现。

# Cook-Torrance Model
## Microfacet Theory
Cook-Torrance Model 假设所有的物体在微观层面上都是有一个个微小的“镜面”组成的，这些微小的“镜面”对光线作用完全符合镜面反射模型（我们高中学过，虽然我们没讲），这些微小的“镜面”是光滑的，但是其分布并不是光滑的，如果你对微积分很熟悉，那么就可以说这些由微小“镜面”组成的表面是“不可导”的  
![](images/cg/re0pt/0x04/1.png)

## Specular Reflection
Cook 和 Torrance 根据这个假设给出了这样一个 BRDF 公式：  
$$f_r = k_df_d + k_s f_s \qquad \text{where:} {k_d+k_s = 1}$$
$f_d$ 是漫反射BRDF , $f_s$ 是镜面反射BRDF , $k_d$ 是漫反射系数 , $k_s$ 是镜面反射系数  
这里的$f_d$ 就是我们熟悉的 Lambertian Model
$$f_d = \frac{\rho}{\pi}$$
而$f_s$ 就是 Cook-Torrance 提出的模型，在原论文中，$f_s$ 的公式如下：
$$f_s = \frac{F \cdot D \cdot G}{\pi(\mathbf{N} \cdot \mathbf{L})(\mathbf{N},\mathbf{V})}$$
而经过多年的发展现在更常用的形式是：
$$f_{s} = \frac{D \cdot F \cdot G}{4 (\mathbf{n} \cdot \mathbf{l})(\mathbf{n},\mathbf{v})}$$
可以看到原公式是除以 $\pi$，而现代是除以 $4$，这个问题我们在文章的最后进行解释，我们先仔细看看这个公式中不同的项到底是什么意思

### Normal Distribution Function
根据Microfacet假设，微观层面微小的“镜面”的法向分布并不是完全一致的，除非在宏观层面上是一致光滑的，但大部分情况下都是不一致的，我们没办法表示所有的“镜面”的法向分布，因此我们需要通过统计学方法表示一个微小区域的平均法线分布
$$D_{GGX}(\mathbf{h}, \alpha) = \frac{\alpha^2}{\pi((\mathbf{n}\cdot\mathbf{h})^2(\alpha^2-1)+1)^2}$$

# References
[^1]: https://cseweb.ucsd.edu/~viscomp/classes/cse168/sp26/readings/cookpaper.pdf
[^2]: https://google.github.io/filament/Filament.md.html
[^3]: https://cdn2-unrealengine-1251447533.file.myqcloud.com/Resources/files/2013SiggraphPresentationsNotes-26915738.pdf