---
date : '2026-05-25T20:34:33+08:00'
draft : false
title : '【CG | Re0:PathTracing】 Specular Reflection | 0x04'
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
$$f_r = f_d +  f_s$$
$f_d$ 是漫反射BRDF , $f_s$ 是镜面反射BRDF 
这里的$f_d$ 就是我们熟悉的 Lambertian Model
$$f_d = \frac{\rho}{\pi}$$
而$f_s$ 就是 Cook-Torrance 提出的模型，在原论文中，$f_s$ 的公式如下：
$$f_s = \frac{F \cdot D \cdot G}{\pi(\mathbf{N} \cdot \mathbf{L})(\mathbf{N},\mathbf{V})}$$
而经过多年的发展现在更常用的形式是：
$$f_{s} = \frac{D \cdot F \cdot G}{4 (\mathbf{n} \cdot \mathbf{l})(\mathbf{n},\mathbf{v})}$$
可以看到原公式是除以 $\pi$，而现代是除以 $4$，这个问题我们在文章的最后进行解释，我们先仔细看看这个公式中不同的项到底是什么意思

### Normal Distribution Function
根据Microfacet假设，微观层面微小的“镜面”的法向分布并不是完全一致的，除非在宏观层面上是一致光滑的，但大部分情况下都是不一致的，我们没办法表示所有的“镜面”的法向分布，因此我们需要通过统计学方法表示一个微小区域的平均法线分布，而Normal Distribution Function (NDF) 就是用来描述这种分布的函数。
> 看下面这幅图（来自games101） `glossy` 物体的法线基本上都是朝上的，对比`diffuse`物体要光滑些，平均在一个微元面中它的发线分布的范围就是蓝色区域，这个蓝色的区域是法线分布函数的lobe在二维上的切面，`diffuse`同理
![](images/cg/re0pt/0x04/2.png)

具体来说，NDF 描述了在微观表面上，有多少比例的微平面法线（Micro-normals）刚好与半角向量 $\mathbf{h}$ 一致。因为根据镜面反射原理，只有当微平面的法线刚好等于 $\mathbf{h} = \frac{\mathbf{l} + \mathbf{v}}{\|\mathbf{l} + \mathbf{v}\|}$ 时，才能将入射光 $\mathbf{l}$ 反射到观察方向 $\mathbf{v}$

一个正确的 NDF 必须满足宏观投影面积的一致性。简单来说，从宏观法线 $\mathbf{n}$ 的方向看去，所有微平面在 $\mathbf{n}$ 轴上的投影面积之和，必须等于宏观单位平面的面积。
其数学形式表现为在半球空间（$\Omega$）上的积分方程：
$$\int_{\Omega} D(\mathbf{h}) (\mathbf{n} \cdot \mathbf{h}) \, d\omega = 1$$
目前在实时渲染中，最常用的 NDF 是 Trowbridge-Reitz (GGX) 模型。它的数学表达式如下：
$$D_{GGX}(\mathbf{h}, \alpha) = \frac{\alpha^2}{\pi((\mathbf{n}\cdot\mathbf{h})^2(\alpha^2-1)+1)^2}$$
其中
- $\mathbf{n}$: 宏观表面的几何法向量（Macro-normal）
- $\mathbf{h}$: half vector
- $\alpha$: 表面粗糙度参数

在原论文[^1]中，cook 和 torrance 建议使用 beckmann NDF 
$$D_{Beckmann}(\mathbf{h}) = \frac{1}{\pi \alpha^2 (\mathbf{n} \cdot \mathbf{h})^4} \exp \left( \frac{(\mathbf{n} \cdot \mathbf{h})^2 - 1}{\alpha^2 (\mathbf{n} \cdot \mathbf{h})^2} \right)$$

那为什么更普遍采用 GGX 呢？  
我们来看一下下面这幅图
![](images/cg/re0pt/0x04/3.png) 
可以看到 Beckmann 曲线在横轴 35 以后全都变为 0 了，而 GGX 曲线依然保持着一定的数值，会体现出长尾效应

直观的我们可以继续看下面这副图：
如果我们把微平面的斜率（Slope）作为自变量，并将 NDF 的输出值取 $\log_{10}$ 对数进行可视化，在大斜率区域， Beckmann 分布在 $slope = 2.5$ 之外变成了黑色的区域（零值）；而 GGX，在边缘处依然保留着一定的数值即长尾效应。
![](images/cg/re0pt/0x04/4.png)

在真实世界中，许多材质哪怕整体看起来很光滑，在远离高光核心的区域依然会有过渡，而不是一下就完全切断，所以在实时渲染中，更推荐使用 GGX NDF

而在离线渲染中，我们一般使用 GTR 模型
$$D_{GTR}(H) = \frac{k(\alpha, \gamma)}{\pi \left( (\mathbf{n} \cdot \mathbf{h})^2 (\alpha^2 - 1)+1 \right)^\gamma}$$
长得和 GGX 基本一致，唯一的区别就是：标准 GGX 的长尾效应是固定的，而 GTR 引入了一个额外的参数 $\gamma$，允许自由控制高光“长尾”的粗细和长度  
其中
$$k(\alpha, \gamma) = \frac{(\gamma - 1)(\alpha^2 - 1)}{1 - (\alpha^2)^{1-\gamma}} \quad (\text{且 } \gamma \neq 1)$$
当 $\gamma = 2$ 时 就是标准的 GGX 模型

# Geometric shadowing Function
根据Microfacet假设，在微观层面，有时候光线入射被微平面自身挡住，导致光线无法照射到目标微平面，有时候光线反射出来向视线传播时，被微平面自身挡住，导致观察者无法看到该微平面的反射光，为了表示这种现象，我们需要使用几何衰减函数 $G$
![](images/cg/re0pt/0x04/5.png)
$G$ 项的作用，就是用来计算这些因为互相遮挡而损失的光线比例，它的取值在 $[0,1]$ 之间，它保证了能量守恒
- 值为 1.0 表示完全没有遮挡，光线完美反射
- 值越接近 0.0 表示 Masking 越严重，反射出的光线越少，表面看起来就越暗

$G$ 项一般都由两项构成
$$G(\mathbf{l}, \mathbf{v}, \mathbf{n},\alpha) = G_1(\mathbf{l}, \alpha) \cdot G_1(\mathbf{v}, \alpha)$$
其中
- $G_1(\mathbf{l}, \alpha)$计算的就是 Shadowing
- $G_1(\mathbf{v}, \alpha)$计算的就是 Masking  
- $\alpha$ 是粗糙度  

在 filament[^2] 中使用的是由 Trowbridge-Reitz (GGX) 模型推导出的 Smith-GGX 精确几何遮蔽函数
$$G_1(\mathbf{v}, \alpha) = \frac{2(\mathbf{n} \cdot \mathbf{v})}{\mathbf{n} \cdot \mathbf{v} + \sqrt{\alpha^2 + (1 - \alpha^2)(\mathbf{n} \cdot \mathbf{v})^2}}$$
$$G_1(\mathbf{l}, \alpha) = \frac{2(\mathbf{n} \cdot \mathbf{l})}{\mathbf{n} \cdot \mathbf{l} + \sqrt{\alpha^2 + (1 - \alpha^2)(\mathbf{n} \cdot \mathbf{l})^2}}$$
而在 早期 UE4 的白皮书[^3] 中使用的是Schlick 近似（Schlick Approximation） 替代了原本复杂的 Smith 根号公式，速度更快
$$G_1(\mathbf{v},\alpha) = \frac{\mathbf{n} \cdot \mathbf{v}}{(\mathbf{n} \cdot \mathbf{v})(1 - k) + k}$$
$$G_1(\mathbf{l},\alpha) = \frac{\mathbf{n} \cdot \mathbf{l}}{(\mathbf{n} \cdot \mathbf{l})(1 - k) + k}$$
$$k = \frac{(\alpha + 1)^2}{8}$$

# Fresnel
Fersnel 描述了这样一个现象：观察者从表面反射看到的光量取决于观察角度。你可以做个实验感受一下这个现象，如果你垂直于一块玻璃看向外面，那么你可以很轻松地看到外面的景色，如果你接近于平行的角度去看，则大概率你能看到你那张帅气/美丽的脸
![](images/cg/re0pt/0x04/6.png)
在 filament[^2] 中，Fresnel 函数使用 Schlick 近似
$$F_{Schlick} = f_0 + (f_{90} - f_0)(1 - \mathbf{v} \cdot \mathbf{h})^5$$
- $f_0$：垂直入射时的反射率（即正面看物体时的反光强度）
- $f_{90}$：掠射角（grazing angle）时的反射率。在绝大多数物理真实材质中，$f_{90}$ 都是 1.0，可以看到下面的 UE4 就直接是定值 1 了  

在 UE4 的白皮书[^3] 中，Fresnel 函数使用 Spherical Gaussian 极致优化版
$$F(\mathbf{v}, \mathbf{h}) = f_0 + (1 - f_0) 2^{(-5.55473(\mathbf{v} \cdot \mathbf{h}) - 6.98316)(\mathbf{v} \cdot \mathbf{h})}$$
使用极致的优化将 $(1 - \mathbf{v} \cdot \mathbf{h})^5$ 改为 $2^{(-5.55473(\mathbf{v} \cdot \mathbf{h}) - 6.98316)(\mathbf{v} \cdot \mathbf{h})}$ 速度快了2，3倍

![](images/cg/re0pt/0x04/7.png)
使用 $f_0 = 0.04$，$f_{90} = 1.0$，对比两个方案，可以发现曲线基本是一致的

# 待更新

# References
[^1]: https://cseweb.ucsd.edu/~viscomp/classes/cse168/sp26/readings/cookpaper.pdf
[^2]: https://google.github.io/filament/Filament.md.html
[^3]: https://cdn2-unrealengine-1251447533.file.myqcloud.com/Resources/files/2013SiggraphPresentationsNotes-26915738.pdf