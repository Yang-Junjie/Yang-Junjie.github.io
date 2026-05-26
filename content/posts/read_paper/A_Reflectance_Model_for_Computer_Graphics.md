---
date : '2026-05-25T21:48:53+08:00'
draft : false
title : '【CG|Paper Reading】A Reflectance Model for Computer Graphics'
tags:
  - graphics

categories:
  - blog

math: true
---
# 前言
《A Reflectance Model for Computer Graphics[^1]》由 Robert L. Cook（来自 Lucasfilm）和 Kenneth E. Torrance（来自康奈尔大学）于 1982 年发表于 SIGGRAPH  
这篇论文是计算机图形学中最常用的反射模型，在看这篇论文之前我已经了解过论文中提到的模型了，不过是经过改进的现代模型，现在让我们看看原文是怎么写的，主要聚焦于Cook-Torrance 反射模型  

笔者学识浅薄，写出的内容不一定是正确的，请仔细甄别


# Abstract
这篇论文提出了在当时一种新型的反射模型，该模型考虑了在同一个场景中不同材质和光源的相对亮度，描述了反射光的方向分布和反射率随着入射光角度变化而产生的颜色变化现象。
并且提出了一种方法用于测量现实物体的材质的光谱能量分布，并讨论了精确再现与该光谱能量分布相关颜色的程序，他们提出的新的模型会被用于金属和塑料材质。

> 但是这个模型经过改进，现在已经能表示从完美镜面到粗糙漫反射之间的几乎所有不透明材质    

# Introduction
在提出这个模型之前，计算机图形学中的光照模型如 Phong,Blinn-Phong,Whitted 等模型都是经验模型，而Cook和Torrance提出了一种基于物理原理的光照模型，文中描述了一种从光谱能量分布计算红、绿、蓝值的方法。随后，将这个新的反射模型应用于金属和塑料的模拟，并解释了为何用以往模型渲染的图像常常呈现塑料感，以及如何避免这种塑料外观。

# THE REFLECTANCE MODEL
首先原文介绍了反射模型，给出了Irradiance
$$E_i = I_i(\mathbf{N}\cdot\mathbf{L})d\omega_i$$
对应着我们现代的
$$ E(p) = \int_{\Omega}L(p,\omega)\cos \theta d\omega$$
我们对其两边微分并将 $\cos$ 项显示写出，这在当时还是离散形式
$$ dE_i = L_i(\mathbf{N}\cdot\mathbf{L}) d\omega_i$$
可以发现不同的是以前人们用的是 Intensity 而不是 radiance 定义

然后原文定义了BRDF,不过那个时候叫做 bidirectional reflectance.
$$R = \frac{I_r}{E_i}$$
这和我们现在定义的BRDF基本一致：
$$f_r(x,\omega_i,\omega_o) = \frac{dL_o(x,\omega_o)}{dE(x,\omega_i)}$$
根据 bidirectional reflectance 得到了反射 radiance
$$I_r =RI_i(\mathbf{N}\cdot\mathbf{L})d\omega_i$$
我们现在一般写作
$$dI_o(x,\omega_o) = f_r(x,\omega_i,\omega_o) L_i(x,\omega_i)\cos\theta d\omega_i$$

然后他们给出他们这个模型的一个创新，bidirectional reflectance 可分解为两个分量：镜面反射分量和漫反射分量即：
$$R = sR_s + dR_d\qquad \text{其中} s + d = 1$$

除此之外原文还引入了一个环境光项，所有不是来自特定光源的直射光，都归入环境光，单个方向上的环境光值很小，但是对半球积分后贡献将会是一个可观的数值，因此，引入一个环境bidirectional reflectance会很方便：
$$I_{ra} = R_a I_{ia} f$$
其中$f$是照明半球中未被邻近物体（如角落）遮挡的部分所占的比例，其表达式可以表示为在照明半球未被遮挡的部分上进行积分：
$$f = \frac{1}{\pi} \int  \mathbf{N}\cdot\mathbf{L} d\omega_i$$
到达观察者的总 radiance，是所有光源引起的反射 radiance 与来自任何环境导致反射radiance之和。假定$f=1$本文所用的基本反射模型可表示为
$$I_r = I_{ia}R_a + \sum_{l}I_{il}(\mathbf{N}\cdot\mathbf{L}_l)d\omega_{il}(sR_s + dR_d)$$

文中提到由于环境光和漫反射光在各个方向上的反射率相同。因此$R_a$ 和 $R_d$ 与观察者的位置无关，将会是一个常数，而镜面反射与观察者位置有关，镜面反射分量的角度分布可以通过假设表面由微表面组成来描述，只有法线方向为 $\mathbf{N}$ 的微面才会对 $\mathbf{L}$ 到 $\mathbf{V}$ 方向的镜面反射分量产生贡献。所以镜面反射分量为

$$R_s = \frac{FDG}{\pi(\mathbf{N}\cdot\mathbf{L})(\mathbf{N}\cdot\mathbf{V})}$$

其中
- $F$：描述了光线如何从光滑的微表面反射
- $D$：描述了表面微平面的粗糙程度，即法线方向为 $\mathbf{H}$ 的微平面所占的比例
- $G$：考虑了一个微表面被另一个微面遮蔽和掩蔽的情况

# D: 微平面分布函数 (Facet Slope Distribution Function)
$D$：描述了表面微平面的粗糙程度，即法线方向为 $\mathbf{H}$ 的微平面所占的比例
论文重点推荐了 Beckmann 分布函数
$$D = \frac{1}{m^2\cos^4\alpha}e^{\frac{-\tan^2\alpha}{m^2}}$$
其中 $m$为粗糙度参数，是微平面斜率的均方根（rms）
- 当 m 较小时，表面较平滑，高光高度集中在镜面反射方向
- 当 m 较大时，表面较粗糙，高光会向四周扩散
# G：几何衰减因子 (Geometrical Attenuation Factor)
G 项考虑了微平面之间的相互干扰，想象一下，在微观情况下一片光打在这个物体上，有些微小的平面会被其他平面所遮挡而导致直射光无法打到这个微表面上(shadowing)，而光打到微小的平面上产生的反射光线也会被其他平面所遮蔽（Masking）,当然还有就是没有遮挡和掩蔽的情况
- 完全反射（没有遮挡Shadowing和Masking）：此时 $G = 1$
- Shadowing 反射出的光线被邻近的微平面挡住:此时 $G = \frac{2(\mathbf{N}\cdot\mathbf{H})(\mathbf{N}\cdot\mathbf{V})}{(\mathbf{V}\cdot\mathbf{H})}$
- Masking 射入的光线被邻近的微平面挡住：此时 $G = \frac{2(\mathbf{N}\cdot\mathbf{H})(\mathbf{N}\cdot\mathbf{L})}{\mathbf{V}\cdot\mathbf{H}}$

真实物理世界中，Masking 和 Shadowing 是同时发生、相互耦合的。一束光要完整完成反射，必须同时满足：
1. 入射不被挡
2. 反射不被挡
3. 不超过总能量   
 
因此几何衰减 G 要取三者的最小值  
所以 G 最后的表达式为  

$$G = \min\left(\frac{2(\mathbf{N}\cdot\mathbf{H})(\mathbf{N}\cdot\mathbf{V})}{\mathbf{V}\cdot\mathbf{H}}, \frac{2(\mathbf{N}\cdot\mathbf{H})(\mathbf{N}\cdot\mathbf{L})}{\mathbf{V}\cdot\mathbf{H}}\right)$$
# F 菲涅耳项 (Fresnel Term)
F 项描述了在单个平滑微平面上，入射光被反射的比例
公式为
$$F = \frac{(g-c)^2}{2(g+c)^2}(1+\frac{[c(g+c)-1]^2}{[c(g-c)+1]^2})$$
其中:
- c 是入射光与 half vector 的夹角余弦值 $\cos\theta = \mathbf{H}\cdot\mathbf{V}$
- n 是材质的折射率
- g 是一个基于折射率 n 和夹角余弦值 c 计算出的中间变量，定义为 $g^2 = n^2 + c^2 - 1$

# Summary
这篇论文提出的最关键的就是下面这个反射模型
$$R = sR_s + dR_d\qquad \text{其中} s + d = 1$$
以及其中的
$$R_s = \frac{FDG}{\pi(\mathbf{N}\cdot\mathbf{L})(\mathbf{N}\cdot\mathbf{V})}$$
Cook-Torrance 模型通过这三项的结合，精准地捕捉了真实世界材质的物理特性，后续人们将 Cook-Torrance 模型 进行了改进，大量使用在现代渲染器中
# References
[^1]: https://cseweb.ucsd.edu/~viscomp/classes/cse168/sp26/readings/cookpaper.pdf