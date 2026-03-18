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
$$ \Omega = \int_{S^2} d\omega=\int_{0}^{\pi} \int_{0}^{\pi} sin\theta d\theta d\phi  = \int_{0}^{\pi}sin\theta d\theta \int_{0}^{\pi} d\phi  = -cos\theta |^{\pi}_{0}\pi = 2\pi  $$
(积分区域是矩形且被积函数是可分离的，所以可以化为两个独立定积分)


## 辐射强度（Radiant Intensity）
Radiant Flux描述的是光源向所有方向发射的总功率，但光源在不同方向发出的能量是不同的。辐射强度用于描述光源在特定方向上的发光能力。
- 定义：单位立体角内的 Radiant Flux 的变化率
- 符号：$I$
- 单位：瓦特每米平方 $W/sr$
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
