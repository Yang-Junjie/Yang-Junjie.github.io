---
date : '2026-03-22T11:56:58+08:00'
draft : false
title : '【CG】基于图像的光照 Image-based Lighting（实时渲染）'
tags:
  - graphics

categories:
  - blog

cover:
  image: "images/cg/ibl2.png"
  alt: "cover"
math: true
---

在看这一篇文章之前你需要有前置知识：我的另一篇文章“【CG】辐射度量学 & PBR”。  
这篇文章很大程度上参考了知乎上 Ubp.a大佬 的文章[^1]



# 基于图像的光照 Image-based Lighting
在基于物理的渲染中，想要获得非常好的渲染效果往往需要使用光线追踪，或者全局光照技术，
但是这些技术在实时渲染中往往非常复杂且实现起来非常困难。但如果只考虑光源的直接光照，渲染出来的效果又往往非常平淡。而 **基于图像的光照(IBL)** 则提供了一种简单的方式而提升了非常好的渲染效果。

IBL 通过将一张 cube map 或者 sphere map 贴图作为光源，它的每个像素都可以代表一个入射光。而对于一个着色点来说，
在这个着色点的法线方向的半球上，我们需要对cube map或者sphere map进行采样，我们让采样结果作为入射光 $L_i(p,\omega_i) = cubeMapSampling(p,\omega_i)$，然后计算反射方程（如果没有自发光项）。
$$L_o(p,\omega_o) = \int_{\mathcal{H} } f_r(p,\omega_i,\omega_o)L_i(p,\omega_i) n\cdot \omega_i d\omega_i$$
$$L_o(p,\omega_o) = \int_{\mathcal{H} } (k_df_d+f_s)L_i(p,\omega_i) n\cdot \omega_i d\omega_i$$
根据积分的线性性我们将积分拆成一个漫反射项和镜面反射项。  
$$L_o(p,\omega_o) = \int_{\mathcal{H} } k_df_dL_i(p,\omega_i) n\cdot \omega_i d\omega_i+\int_{\mathcal{H} } f_sL_i(p,\omega_i) n\cdot \omega_i d\omega_i$$
简化为
$$L_o(p,\omega_o) = L_d(\omega_o)+L_s(\omega_o)$$
而一旦在实时渲染中涉及到采样，直接来说这个方法是不可行的，所以在实时渲染中，我们需要对这个积分做一些近似，或者进行一些预计算，
把复杂的积分都先计算好，我们会分别预计算漫反射积分和镜面反射积分。

# Irradiance Map
慢反射项为
$$L_d(\omega_o) = \int_{\mathcal{H} }k_df_dL_i(\omega_i)n\cdot \omega_i d\omega_i$$
将与积分无关的项提出来
$$L_d(\omega_o) = \frac{\rho}{\pi}\int_{\mathcal{H} }k_dL_i(\omega_i)n\cdot \omega_i d\omega_i$$
其中
$$k_d = (1 - F) \cdot (1 - metallic)$$
其中 F 是菲涅尔项，而 $F$ 项包含了半程向量，而半程向量与入射角有关，所以不能提出到积分外部，所以我们需要对 $k_d$ 做一些简化
$$k_d \approx F_0+(max\left \{ 1-roughness,F_0 \right \}-F_0 )(1-(n\cdot \omega_o))^5$$
此时 $k_d$ 项与积分变量无关了
$$L_d(\omega_o) \approx k_d\frac{\rho}{\pi}\int_{\mathcal{H} }L_i(\omega_i)n\cdot \omega_i d\omega_i$$
展开
$$L_d(\omega_o) \approx k_d\frac{\rho}{\pi} \int_{0}^{2\pi}\int_{0}^{\frac{\pi}{2}}L_i(\omega_i)cos\theta \sin\theta d\theta d\phi$$
现在的积分值只取决于法向 $n$，在法线方向上的半球上决定了入射光的值。
![](https://learnopengl.com/img/pbr/ibl_hemisphere_sample.png)

所以我们可以使用一个 cube map 以提供光照来预计算这个积分，最后得到另一个cube map，这个新的cube map我们称作irradiance map。
![](https://learnopengl.com/img/pbr/ibl_irradiance.png)
要求解这个积分我们可以使用蒙特卡洛积分  

## 均匀采样
我们可以在半球上的角度进行角度空间的均匀采样，并假设 $\phi$ 和 $\theta$ 是独立的那么
它们在蒙特卡洛积分中的联合概率密度为
$$p(\theta, \phi) = p(\theta) \cdot p(\phi) = \frac{1}{\pi/2} \cdot \frac{1}{2\pi} = \frac{1}{0.5\pi \cdot 2\pi}$$
所以
$$L_d(\omega_o) \approx k_d\frac{\rho}{\pi}\frac{1}{N_1N_2} \sum_{i}^{N_1}\sum_{j}^{N_2}\frac{  L_i(\theta_i,\phi_j)cos\theta_i \sin\theta_i}{p(\theta_i,\phi_j)}$$
代入化简有
$$L_d(\omega_o) \approx k_d\rho\pi\frac{1}{N_1N_2} \sum_{i}^{N_1}\sum_{j}^{N_2}  L_i(\theta_i,\phi_j)cos\theta_i \sin\theta_i$$
## 余弦权重采样
使用余弦权重采样的 PDF 是 $p(\omega) = \frac{\cos\theta}{\pi}$
就有
$$L_d(\omega_o) \approx k_d\frac{\rho}{\pi}\frac{1}{N}\sum_{i}^{N}\frac{L_i(\omega_i)\cos \theta}{\frac{\cos\theta}{\pi}}=k_d\rho\frac{1}{N}\sum_{i}^{N}L(\omega_i)$$


# Speular
在镜面反射部分中，镜面反射不仅取决于法线 $n$，还取决于观察方向 $v$ 以及材质的粗糙度 $\alpha$。这意味着如果你想预计算，你需要一个五维的表格（法线3D + 观察方向2D + 粗糙度1D），这在实时渲染中是不可接受的。  

我们参考了 games202[^2] 中的描述 对于镜面反射的 BRDF 它非常满足使用下面这个近似公式的使用条件
$$\int_{\Omega} f(x)g(x)dx \approx \frac{\int_{\Omega_G}f(x)dx}{\int_{\Omega_G}dx}\cdot\int_{\Omega}g(x)dx$$
所以我们对积分做出一个拆分
$$L_o(p,\omega_o) \approx \frac{\int_{\Omega_{f_r}}L_i(p,\omega_i)d\omega_i}{\int_{\Omega_{f_r}}d\omega_i}\cdot\int_{\Omega^+}f_s(p,\omega_i,\omega_o)n\cdot \omega_i d\omega_i$$
使用蒙特卡洛积分
$$L_o(p,\omega_o) \approx \left( \frac{\sum_{k=1}^{N} L_i(p,\mathbf{\omega}_k)(n\cdot \omega_k)}{\sum_{k=1}^{N}(n\cdot \omega_k)} \right) \left( \frac{1}{N} \sum_{k=1}^{N} \frac{f(p,\mathbf{\omega}_k, \mathbf{\omega_o}) (n\cdot \omega_k)}{p(\mathbf{\omega}_k, \mathbf{\omega_o})} \right)$$

## 预滤波环境光 (Pre-filtered Environment Radiance)
注意到约等号右边的第一项是对 BRDF 中的 NDF 区域中所有的入射光的积分再归一化，这个操作就相当于对IBL 这张图进行 filtering, 在图上的任何一个点上，取这个点周围的一个范围进行平均操作。这个范围由roughness 决定，我们可以通过固定的 roughness 来预计算多张 cube map 并且使用 mipmap 进行保存，根据物体不同的 roughness 在不同的 mipmap 中进行插值获取 L 值 
![](images/cg/ibl1.png)
我们就是通过约等号右边的第一项进行预计算
$$\text{Part 1} = \frac{\sum_{k=1}^{N} L_i(p,\mathbf{\omega}_k)(n\cdot \omega_k)}{\sum_{k=1}^{N}(n\cdot \omega_k)}$$

##  BRDF LUT
我们处理完了第一项，还有一项我们没有处理。我们知道 $f_s = \frac{D(h)F(\omega_o, h)G(l, \omega_o)}{4(n \cdot \omega_o)(n \cdot \omega_i)}$，并且 GGX 重要性采样的标准 PDF 是 $p(h) = \frac{D(h)(n \cdot h)}{4(\omega_o \cdot h)}$ 我们将其代入第二项有
$$I \approx \frac{1}{N} \sum_{k=1}^{N} \frac{\frac{D(h_k)F(\omega_o, h_k)G(\omega_{i}^{(k)}, \omega_o)(\omega_o \cdot h_k)}{(n \cdot \omega_o)}}{\frac{D(h_k)(n \cdot h_k)}{4(\omega_o \cdot h_k)}}$$
消掉 $D(h_k)$，化简得：
$$I \approx \frac{1}{N} \sum_{k=1}^{N} F(\omega_o, h_k) \frac{G(\omega_{i}^{(k)}, \omega_o) \cdot 4(\omega_o \cdot h_k)^2}{(n \cdot \omega_o)(n \cdot h_k)}$$
其中 $F(\omega_o, h_k) = F_0 + (1 - F_0)(1 - \omega_o \cdot h_k)^5$  
我们令 $F_{base} = (1 - \omega_o \cdot h_k)^5$，则 $F = F_0(1 - F_{base}) + F_{base}$
代入公式
$$I \approx \frac{1}{N} \sum_{k=1}^{N} \left[ F_0(1 - F_{base}) + F_{base} \right] \frac{G(\omega_{i}^{(k)}, \omega_o)(\omega_o \cdot h_k)}{(n \cdot \omega_o)(n \cdot h_k)}$$
最后展开
$$I \approx F_0 \cdot \underbrace{\left( \frac{1}{N} \sum_{k=1}^{N} (1 - F_{base}) \frac{G(\omega_{i}^{(k)}, \omega_o)(\omega_o \cdot h_k)}{(n \cdot \omega_o)(n \cdot h_k)} \right)}_{\text{Scale}} + \underbrace{\left( \frac{1}{N} \sum_{k=1}^{N} F_{base} \frac{G(\omega_{i}^{(k)}, \omega_o)(\omega_o \cdot h_k)}{(n \cdot \omega_o)(n \cdot h_k)} \right)}_{\text{Bias}}$$

终于! 我们得到了最后的公式
$$ I \approx F_0 \times \text{Scale} + \text{Bias} $$
其中 Scale 和 Bias 我们可以通过预计算将其存储在一张只有两个通道(R,G)的纹理中，Scale存放在r通道bias存放在g通道，将 $x$ 轴（U 坐标）映射为 $\cos\theta_v$ ($n \cdot \omega_o$)， $y$ 轴（V 坐标）映射为 粗 Roughness，这张纹理我们称为 BRDF LUT  
下面是一张 BRDF LUT
![](https://learnopengl-cn.github.io/img/07/03/02/ibl_brdf_lut.png)

最后实现后类似这种效果
![](images/cg/ibl2.png)

# 参考
[^1]: [深入理解 PBR/基于图像照明 (IBL) ](https://zhuanlan.zhihu.com/p/66518450)
[^2]: [games202-高质量实时渲染](https://www.bilibili.com/video/BV1YK4y1T7yY?spm_id_from=333.788.videopod.episodes&vd_source=b60fadc84379e52fc7b933fab5a8751c&p=5)