---
date : '2026-03-18T22:14:42+08:00'
draft : false
title : '【CG】辐射度量学在图形学中基础应用'
tags:
  - graphics

categories:
  - blog

cover:
  image: "images/cg/radiance.png"
  alt: "cover"
math: true
---

在没有将辐射度量学引入计算机图形学中用于渲染之前程序员或者美术师们都是通过凭感觉或者经验调整Phong或者Blinn-Phong模型的参数的像做出非常精美的效果非常困难。  
而且Phong和Blinn-Phong模型都是经验模型，它们都没办法表示真实的物理效果。因此我们引入了辐射度量学来以科学的角度定量地、物理正确地描述光。

# 辐射度量学

## 辐射能（Radiant Energy）
光本质上是电磁波，而只要是波就能携带能量。我们将光所携带的能量称为辐射能。  
符号：$Q$， 单位：焦耳 $J$

## 辐射通量 （Radiant Flux）
在图形学中我们通常不会使用**辐射能**来计算光照，因为如果一个光源一直发光那么它释放的能量是无限变大的。
而在图形学中，我们更关注一帧画面中的能量。即**辐射通量（Radiant Flux）**  
- 定义：单位时间内 **Radiant Energy** 的变化量
- 符号：$\Phi$
- 单位：瓦特 $W$，或者焦耳每秒 $J/s$  
公式：
$$\Phi = \frac{dQ}{dt}$$

## 立体角 （Solid Angle）
在介绍其他的物理量之前先介绍一下**立体角**，因为这些物理量需要使用到立体角。  
立体角是一个数学中的概念，类似于二维平面上，我们使用弧度表示来表示一个二维角度 $\theta = \frac{s}{r} $。    
类似的，在三维空间中，我们使用类似的定义来表示立体角。  
（除以半径的平方对应了物理中的平方反比定律）  
$$ \Omega = \frac{A}{r^2} $$  
- 单位: 球面度 (Steradian, sr)
![](images/cg/solid_angle.png)

例1：  
计算整个球体和半球的立体角：   
根据球体面积公式: $A = 4\pi r^2$

$$ \Omega_1 = \frac{A}{r^2}  = \frac{4\pi r^2}{r^2} = 4\pi$$  
$$ \Omega_2 = \frac{\Omega_1}{2}= 2\pi$$  

### 微分立体角
在球体上我们通常使用经纬度来表示一个点的位置
- 极角 $\theta$ ：与 $z$ 轴的夹角 $[0, \pi]$
- 方位角 $\phi$ ：在 $xy$ 平面上的投影与 $x$ 轴的夹角，范围 $[0, 2\pi]$。
- 定义
$$ d\omega = \frac{dA}{r^2} $$
其中 

$$ dA = (rd\theta)(rsin\theta d\phi) = r^2sin\theta d\theta d\phi $$
![](images/cg/differential_solid_angle.png)
所以原公式可以化简为
$$ d\omega = sin\theta d\theta d\phi  $$

例2    
使用微分立体角计算半个球体的立体角：  
$$ \Omega = \int_{S^2} d\omega=\int_{0}^{2\pi} \int_{0}^{\frac{\pi}{2}} sin\theta d\theta d\phi  = \int_{0}^{\frac{\pi}{2}}sin\theta d\theta \int_{0}^{2\pi} d\phi  = \left [ -cos\theta \right ] ^{\pi}_{0}2\pi = 2\pi  $$
(积分区域是矩形且被积函数是可分离的，所以可以化为两个独立定积分)


## 辐射强度（Radiant Intensity）
Radiant Flux描述的是光源向所有方向发射的总功率，但光源在不同方向发出的能量是不同的。辐射强度用于描述光源在特定方向上的发光能力。
- 定义：单位立体角内的 Radiant Flux 的变化率
- 符号：$I$
- 单位：瓦特每立体角 $W/sr$
- 公式：
$$ I(\omega) =\lim_{\Delta\omega \to 0}\frac{\Delta \Phi}{\Delta \omega}= \frac{d\Phi}{d\omega} $$
如果一个光源是各项同性的，那么它的 Radiant Intensity 是 $I = \frac{\Phi}{4\pi}$（$4\pi$ 是整个球的立体角）
![](images/cg/intensity.png)

## 辐照度（irradiance）
Irradiance 描述了某一个表面上接受的 Radiant Flux。
- 定义: 单位面积内的接受的 Radiant Flux 的变化率
- 符号：$E$
- 单位：瓦特每平方米 $W/m^2$
- 公式：
$$ E(p) =\lim_{\Delta A \to 0}\frac{\Delta \Phi(p)}{\Delta A}= \frac{d\Phi(p)}{ dA} $$

![](images/cg/irradiance.png)

## 辐射亮度 (Radiance) 
它结合了方向和面积，描述了**光线在空间中沿一条射线的强度**
- 定义： 单位立体角、单位投影面积上的辐射通量。
- 符号：$L$
- 单位：$\frac{W}{sr\cdot m^2}$
- 公式：
$$L(p, \omega)= \lim_{\Delta\omega \to 0}\frac{\Delta E_{\omega}(p)}{\Delta \omega}=\frac{d E_{\omega}(p)}{d\omega}= \frac{d^2\Phi}{d\omega dA }$$
（其中 $p$ 是表面上的点，$\omega$ 是光线方向，$\theta$ 是光线方向与表面法线的夹角）。

![](images/cg/radiance.png)

实际上 $ dA cos\theta $才是radiance中所定义的面积
![](images/cg/radiance_area.png)
所以原方程为
$$ L(p, \omega)= \frac{d E_{\omega}(p)}{d\omega cos\theta}=\frac{d^2\Phi}{d\omega dA cos\theta} $$

# BRDF 双向反射分布函数
BRDF（双向反射分布函数，Bidirectional Reflectance Distribution Function）是计算机图形学和光学中用于描述光线在不透明表面如何反射的核心概念。它定义的物体的材质，描述了入射光是如何被反射到其他方向上去的。它的定义是：“在某个点上，在某个给定方向上反射出去的辐射能（Radiance），与 **从某个给定方向入射的辐射照度（Irradiance）** 之间的比例关系”。    
根据其定义：  

$$f_r(\omega_i, \omega_o) = \frac{dL_r(\omega_o)}{dE_i(\omega_i)} = \frac{dL_r(\omega_o)}{L_i(\omega_i) \cos\theta_i d\omega_i}$$
- $\omega_i$：入射光方向
- $\omega_o$：反射光方向
- $dL_r(\omega_o)$：表面在 $\omega_o$ 方向反射出去的radiance
- $dE_i(\omega_i)$：来自 $\omega_i$ 方向的微分入射irradiance
- $\theta_i$：入射光与表面法线的夹角

为什么要这么定义呢？我个人是这么理解的：物体所表现出来的材质是一种固有属性（从某个方向接受到的光能有多少反射到另外一个方向所以是比值，当irradiance增大2倍，那么反射出来的光也是原来的2倍，BRDF是不会变的），所表现出来的颜色是没有被物体所吸收出来的光，我们从不同角度观察物体所表现出来的“颜色”是不同的(radiance)，并且与表面上接受入射光的角度、强度都有关（irradiance）。
## 反射方程 
有了 BRDF 那么我们就可以定义出反射方程了。很显然观察者接受到的物体的反射光是由不同方向上照射到物体表面经过材质反射的入射光贡献而来的。对 BRDF 方程两边同时乘以分子再对整个半球做积分就得到了：  
$$ L_r( \omega_o) = \int_{S^2} f_r(\omega_i, \omega_o) L_i(\omega_i) \cos\theta_i  d\omega_i $$
由此我们可以根据这个方程计算出出射光了。

## Cook-Torrance BRDF
然而上面给出的是 BRDF 的定义式，我们不能使用它来计算，在工程上如果你非得使用上面那个式子进行计算的话那么你得对所有的像素进行预计算，将所有预计算的存入一个4维数组然后进行查表，这是绝对不可接受的。  
所以我们需要一个解析模型从而便于我们的计算而 **Cook-Torrance BRDF** 就是最成功的一个，他是基于 **微表面模型** 的

### 微表面模型
这是 Cook-Torrance 最核心的物理假设。它假设物体的表面在微观层面上都是由无数个以随机方向（实际上与材质有关）的镜面反射平面构成的。
![](images/cg/microsurface.png)
- 当这些微小的镜面的法线方向较为集中一致的时候，从宏观角度来看，物体的镜面反射会比较明显。
- 当这些微小镜面的法线方向较为杂乱，分布均匀的时候，物体表面则会相对粗糙。
![](images/cg/microsurface2.png)
其中只有法线刚好指向入射光与观察者中间位置的微表面，才能把光线反射到你的眼睛里。这个中间位置的方向被称为半程向量 $h = \frac{v + l}{\|v + l\|}$

但是上面只解释了镜面反射现象，对于漫反射则是在镜面反射的基础上加上了折射。
当光照射到漫反射物体时，一部分会与微表面镜面进行反射，而一部分会发生折射进入物体内部与物体内部的原子不断发生碰撞并散射到随机方同时消耗光的能量。  
Cook-Torrance BRDF正是考虑了这两种情形的BRDF，它的定义如下：
 $$f_r = k_d f_{lambert} + k_s f_{cook-torrance}$$
- $k_d$有多少比例发生了漫反射
- $k_s$有多少比例发生了镜面反射
- 并且由能量守恒 $k_d + k_s \leq 1.0$
- $f_{lambert}$：漫反射 BRDF
- $f_{cook-torrance}$：镜面反射 BRDF
既然我们说 Cook-Torrance BRDF 便于计算，那么$f_{lambert}$，$f_{cook-torrance}$是怎么计算的呢？
### 漫反射项推导
漫反射会均匀的向每个方向反射所以 BRDF 将会是一个常数，一个理想漫反射表面，在任何观察方向 $\omega_o$ 看到的 radiance 都是相同的，
![](images/cg/diffuse.png)
根据反射方程：
$$ L_r( \omega_o) = \int_{S^2} f_r(\omega_i, \omega_o) L_i(\omega_i) \cos\theta_i  d\omega_i $$
$$ L_r = f_rL_i\int_{0}^{2\pi}\int_{0}^{\frac{\pi}{2}}cos\theta_i d\omega_i = f_rL_i\pi  $$
设反射率为 $\rho$ 有 $L_r = \rho L_i$
则

$$ f_r = \frac{\rho}{\pi}$$
###  镜面反射项推导
我们先给出镜面反射项的 BRDF 的公式：
$$f_{specular} = \frac{D \cdot F \cdot G}{4(\mathbf{n} \cdot \mathbf{l})(\mathbf{n} \cdot \mathbf{v})}$$
这里只做简单的介绍不做推导（等以后更新把）
- $D$ (Normal Distribution Function, NDF)：
有多少微表面指向 $\mathbf{h}$？ 它是材质粗糙度的核心。如果表面很光滑，$D$ 在 $\mathbf{h}$ 方向会形成一个极高的峰值；如果很粗糙，$D$ 就会摊平。
- $F$ (Fresnel Term)：
反射了多少光？ 描述光线在不同角度下的反射强度。最著名的现象就是：当你斜着看（掠射角）时，几乎所有东西都会变得像镜子一样亮
- $G$ (Geometry Function)：
有多少光没被挡住？ 微观小山丘之间会互相遮挡（Shadowing）或掩盖（Masking）。粗糙度越高，被挡住的光越多

### 渲染方程
渲染方程知识在反射方程的基础之上添加了一个自发光项(Emission term)
$$L_o( \omega_o) = L_e( \omega_o) + \int_{S^2} f_r(\omega_i, \omega_o) L_i(\omega_i) \cos\theta_i  d\omega_i$$