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

在没有将辐射度量学引入计算机图形学中用于渲染之前程序员或者美术师们都是通过凭感觉或者经验调整Phong或者Blinn-Phong模型的参数，想做出非常精美的效果非常困难。  
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
### 渲染方程
渲染方程知识在反射方程的基础之上添加了一个自发光项(Emission term)
$$L_o( \omega_o) = L_e( \omega_o) + \int_{S^2} f_r(\omega_i, \omega_o) L_i(\omega_i) \cos\theta_i  d\omega_i$$
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
漫反射会均匀的向每个方向反射，一个理想漫反射表面，在任何观察方向 $\omega_o$ 看到的 radiance 都是相同的，所以 BRDF 将会是一个常数，
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
#### 法线分布函数 $D$ (Normal Distribution Function, NDF)
法线分布函数 $D$ 的物理意义是描述微面元法线的统计分布，它表示在微观表面上，有多少比例的微面元的法线 $m$ 是与半程向量 $h$ 一致的。
- 如果表面很光滑：绝大多数微面元的法线都集中在宏观表面法线 $n$ 的附近。这会导致 NDF 在 $h$ 接近 $n$ 时给出一个极高的值，从而产生非常小且非常明亮的高光。
- 如果表面很粗糙：微面元的法线分布非常杂乱、广泛。这意味着在任何给定的 $h$ 方向上，都有一定数量的微面元。这会导致 NDF 的值比较平缓，从而产生面积大且相对暗淡的高光。  
$D(m)$ 的严格定义是：**单位立体角内、单位宏观面积上，法线朝向 $m$ 的微面元的真实面积**
即
$$ D(m) = \frac{dA_m}{dAd\omega_m}$$
- $A_m$: 微面元微观面积
- $A$：微面元宏观面积 
- $\omega_m$ ：立体角  
然而这个是 NDF 的定义式，我们无法直接计算。
为了保证物理上的能量守恒，任何合格的 NDF 都必须满足微面元投影面积等于宏观表面投影面积的条件  
即
$$\int_{\Omega} D(m) (n \cdot m) d\omega_m = 1$$
如果不满足这个条件，例如：如果微面元投影面积大于宏面投影面积，意味着微面元无中生有地多出了一部分面积去接收和反射光线。这会导致表面反射出的光线数量，多于光源打在宏观表面上的光线数量——这就如同表面自带了发电机，违反了能量守恒定律。  
推导：  
$$一个微元的投影面积 = dA_m \cdot (n \cdot m) = D(m) \cdot dA \cdot (n \cdot m) \cdot d\omega_m$$
这是一个微元的投影面积，我们对它在半球上积分  
$$所有微元的投影面积 = \int_{\Omega} D(m) \cdot dA \cdot (n \cdot m) d\omega_m$$
我们让它等于宏观面积  
$$\int_{\Omega} D(m) \cdot dA \cdot (n \cdot m) d\omega_m = dA$$
$dA$ 约去得到  
$$\int_{\Omega} D(m) (n \cdot m) d\omega_m = 1$$
这里给出一个 NDF 的计算式： **GGX (Trowbridge-Reitz) 分布**这是目前游戏引擎和影视特效界绝对的工业标准
$$D_{GGX}(m) = \frac{\alpha^2}{\pi \left( (n \cdot m)^2 (\alpha^2 - 1) + 1 \right)^2}$$
- 其中$\alpha$为 粗糙度（Roughness）  
- $n$ 为宏观法线方向
- $m$ 为微面元法线方向  
我们可以通过能量守恒式子验证一下（保姆式）  
$$I = \int_{\Omega}D_{GGX}\left(m\right)cos\theta d\omega$$
代入  
$$I=\int_{\Omega}\frac{\alpha^2}{\pi\left ( \left( n\cdot m\right)^{2} \left( \alpha^2-1\right)+1\right )^2 }cos\theta d\omega $$
展开  
$$I=\int_{0}^{2\pi}\int_{0}^{\frac{\pi}{2}}\frac{\alpha^2cos\theta sin\theta}{\pi\left (  \left( \alpha^2-1\right)cos^2\theta+1\right )^2 } d\theta d\phi$$
积分区域是矩形且被积函数是可分离的，拆分积分，并将常数项提出
$$I=\frac{\alpha^2}{\pi}\int_{0}^{2\pi}d\phi\int_{0}^{\frac{\pi}{2}}\frac{ cos\theta sin\theta}{\left (  \left( \alpha^2-1\right)cos^2\theta+1\right )^2 } d\theta$$
对 $d\phi$ 的积分为$2\pi$ 我们将 2 在放入积分中$\pi$约掉
$$I=\alpha^2\int_{0}^{\frac{\pi}{2}}\frac{2 cos\theta sin\theta}{\left (  \left( \alpha^2-1\right)cos^2\theta+1\right )^2 } d\theta$$
分母有一个 $cos^2\theta$，注意到 $cos^2\theta$ 的导数是 $-2cos\theta sin\theta$，所以我们可以凑微分
$$I=-\alpha^2\int_{0}^{\frac{\pi}{2}}\frac{1}{\left (  \left( \alpha^2-1\right)cos^2\theta+1\right )^2 } dcos^2\theta$$
现在的积分变得非常简单了，继续凑微分
$$I=-\frac{\alpha^2}{ \alpha^2-1}\int_{0}^{\frac{\pi}{2}}\frac{1}{\left (  \left( \alpha^2-1\right)cos^2\theta+1\right )^2 } d\left(\left( \alpha^2-1\right)cos^2\theta+1\right)$$
最后得到
$$I=\frac{\alpha^2}{ \alpha^2-1}\left [ \frac{1}{\left ( \alpha^2-1 \right )cos^2\theta +1} \right ]_{0}^{\frac{\pi}{2}}=\frac{\alpha^2}{ \alpha^2-1}\left [ 1-\frac{1}{\alpha^2} \right ] =1$$

#### 菲涅尔方程（Fresnel Equation，$F$ ）
菲涅尔反射：你可以做个实验感受一下这个现象，如果你垂直于一块玻璃看向外面，那么你可以很轻松地看到外面的景色，如果你接近于平行的角度去看，则大概率你能看到你那张帅气/美丽的脸，这种反射强度随观察角度（入射角）变化的现象，就是菲涅尔效应。
![](images/cg/Fresnel.png)
从物理学上讲，菲涅尔方程描述了光在两种不同折射率（$n_1, n_2$）的介质交界面上的反射比例。完整的物理公式非常复杂，涉及光的横电波和横磁波等非常复杂的概念，这里只做简单的介绍，不需要掌握。  
横电波  
$$R_s = \left| \frac{n_1\cos\theta_i - n_2\cos\theta_t}{n_1\cos\theta_i + n_2\cos\theta_t} \right|^2$$
横磁波
$$R_p = \left| \frac{n_1\cos\theta_t - n_2\cos\theta_i}{n_1\cos\theta_t + n_2\cos\theta_i} \right|^2$$
菲涅尔方程    
$$F = \frac{R_s + R_p}{2}$$
![](images/cg/Fresnel_2.png)
这个式子太复杂了不适合在计算机图形学中用于实时计算（也许离线渲染中可以使用，暂未了解）。  
所以在实时渲染中，我们一般使用 **Schlick 近似**公式来计算菲涅尔项
1994 年，Christophe Schlick 提出了一个极其经典的近似公式，它用一个简单的插值函数取代了复杂的三角函数和折射率计算
$$F_{Schlick}(v, h) = F_0 + (1 - F_0)(1 - (v \cdot h))^5$$
- $F_0$ 基础反射率，当观察方向垂直于表面时的反射能量。这是材质的固有属性
- $v$ 观察方向
- $h$ 半程向量

#### 几何函数（Geometry Function，$G$ ）
微表面模型假设表面是由无数的微小高低分布不同的微元镜面组成的。当光线以很斜的角度射入，或者你以很斜的角度观察时，就会发生两种几何现象
1. **Shadowing**：光线还没打到某个微面元，就被它前面的微元面挡住了，形成微观阴影
2. **Masking**： 微面元反射了光线，但在飞向你眼睛的途中，被旁边其他的微面元挡住了
![](images/cg/geometry_function1.png)
如果没有几何函数，那么在物体的边缘会变得异常明亮，因为没有处理Shadowing和Masking现象。而 $G$ 项的作用就是通过一个 $0 \sim 1$ 之间的系数，把那些被挡住的光“扣掉”。  
$G$ 项本质上是一个概率：它表示在给定入射方向 $l$ 和出射方向 $v$ 的情况下，法线为 $m$ 的微面元既不被遮蔽也不被掩盖的比例。
$$G(l, v, h) = G_1(l) \cdot G_1(v)$$
- $G_1(l)$：由于入射光被Shadowing而损失的能量
- $G_1(v)$：由于视线被Masking而看不到的能量
我们工业中通常使用**Schlick-GGX 几何函数**来计算：
$$G_1(v) = \frac{n \cdot v}{(n \cdot v)(1 - k) + k}$$
$$G_1(l) = \frac{n \cdot l}{(n \cdot l)(1 - k) + k}$$
其中$k$为：  
$$k = \frac{(Roughness + 1)^2}{8}$$
G 项会与BRDF的分母产生非常奇妙的反应，分母中当观察角度和光照角度趋近 90 度的时候 $(n \cdot l)$ 或 $(n \cdot v)$ 会趋近于 $0$ 会导致BRDF的高光项非常的大，导致边缘处亮度爆炸亮，而 G 项的的两个分母刚好可以与分子约去从而防止这个现象。  
### 再看 BRDF
 $$f_r = k_d f_{lambert} + k_s f_{cook-torrance}$$

这个形式是理论教科书式这种写法为了强调“能量守恒”的概念，手动指定 $k_s$ 和 $k_d$。  
但是在工程实践中我们通常使用下面这种形式
$$f_r = (1 - F) \cdot (1 - metallic)\cdot f_{lambert} + f_{specular}$$
$f_{specular}$中的 $F$ 直接充当了 $k_s$ 的角色。如果你在 $f_s$ 前面再乘一个 $k_s$，就相当于“收了两遍税”，会导致高光能量过暗。
###  总结
| 组件 | 物理含义 | 决定了什么？ |
| :--: | :--: | :--: |
| **$D$ (NDF)** | 法线分布 | 高光的**形状**（锐利还是模糊） |
| **$F$ (Fresnel)** | 菲涅尔反射 | 高光的**强度**（金属感和角度变化） |
| **$G$ (Geometry)** | 几何遮挡 | 高光的**能量衰减**（防止边缘过亮） |

