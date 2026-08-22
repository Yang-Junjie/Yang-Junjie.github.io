---
date : '2026-08-22T20:42:39+08:00'
draft : false
title : '【CG】正确使用 C++ 写一个均匀半球采样'
tags:
  - graphics

categories:
  - blog

math: true
---
我们都知道标准的 Rendering Equation 是
$$
L_o(p, \omega_o) = L_e(p, \omega_o) + \int_{\Omega } f_r(p,\omega_i, \omega_o) L_i(p,\omega_i) (\mathbf{n}\cdot\omega_i)  d\omega_i
$$
而我们需要计算一个以 $p$ 点为球心，以 $p$ 点法线 $n$ 方向为半球区域 $\Omega$ 的积分
![](https://www.pbr-book.org/4ed/Radiometry,_Spectra,_and_Color/pha04f05.svg)
而这个积分没有解析解，所以我们通常需要通过 Monte Carlo 方法进行求解。
将 Rendering Equation 写成 Monte Carlo Estimator 得到
$$
\hat{L}_o(x, \omega_o) = L_e(p, \omega_o) + \frac{1}{N} \sum_{i=1}^{N} \frac{f_r(p, \omega_i, \omega_o) L_i(p, \omega_i) (\mathbf{n}\cdot\omega_i)}{p(\omega_i)}
$$
而我们要计算这个 Estimator ，就需要其中的参数 $\omega_i$。我们获取 $\omega_i$ 的方式就是采样，而采样的方法有很多种：均匀半球采样，采样BSDF，余弦加权采样等等。

而这篇文章将介绍均匀半球采样，以及给出 C++ 代码。


## 逆变换采样法
在开始介绍如何采样之前我们需要了解一个方法，就是逆变换采样法，也叫概率积分变换定理 

在计算机中我们通常很容易获取在 $[0,1)$ 之间均匀分布的随机数，但是我们不知道怎么获取一个指定的 pdf 的随机数，所以我们通常需要一种方法，将$[0,1)$区间上的均匀随机数，变换为符合特定概率密度分布的数值，而这个方法就是逆变换采样法  

聪明的数学家们发现 pdf 的积分 cdf (累积分布函数或者叫做连续型随机变量的分布函数) 在绝大多数情况是单调增的(拥有反函数)，并且值域是一定为$[0,1]$的（刚好适配我们的计算机的 $(0,1)$均匀随机数），那么我们就可以利用这个性质
如果一个连续随机变量的 CDF 是 $F(x) = P(X \le x)$，那么它的反函数 $F^{-1}(u)$：
- 定义域严格限制在 $[0, 1]$ 之间：因为 CDF 输出的是概率，概率只能在 0 到 1 之间
- 如果 $U$ 是一个在 $[0, 1]$ 上均匀分布的随机变量，那么随机变量 $X = F^{-1}(U)$ 的累积分布函数正好就是 $F(x)$，而 $X$ 就是我们要的符合我们分布的随机变量  

为了更直观地理解，我们可以看下面这张图。假设我们要生成服从标准正态分布的随机数：
从左侧的 PDF 可以看出，标准正态分布的随机数绝大部分都密集分布在 $(-2, 2)$ 这个区间内，而而观察右侧的 CDF 反函数 $F^{-1}(u)$ 就会发现，当我们对横轴（即输入 $U$）在 $[0, 1]$ 上进行均匀抽样时，纵轴输出的 $X = F^{-1}(U)$ 绝大部分的几率都会落在 $(-2, 2)$ 区间内（因为只有在 $U$ 极度逼近 0 或 1 的边缘时，$X$ 才会走向无穷大），正好满足正态分布
![](images/cg/re0pt/0x03/normal_pdf_cdf_inverse.png)

所以我们通常要使用服从在$(0,1)$区间均匀分布的随机数来获得服从其他分布的随机数时可以遵循下面这个步骤：
1. 让电脑生成一个 $0 \sim 1$ 的随机数 $u$
2. 把 $u$ 带入该分布的 CDF 反函数 $F^{-1}(u)$ 中
3. 得到的结果就是该分布的随机数
## 均匀半球采样
我们都知道半球的 服从均匀分布的概率密度函数（PDF）为 
$$
p(\omega_i) = \frac{1}{2\pi}
$$
它的自变量是 $\omega_i$ 即立体角，我们需要找到立体角与实数的对应关系(因为我们的随机数是"实数")，我们知道微分立体角与球坐标系下的角度的关系（我们一直使用单位球，因为我们讨论的是方向，而方向我们通常只使用单位向量）是 
 $$ d\omega = \sin \theta d\theta d\phi$$
而我们知道球坐标系与直角坐标系的关系是
$$\left\{\begin{matrix}
x =\sin\theta\cos\phi\\
y=\sin\theta\sin\phi \\
z=\cos\theta
\end{matrix}\right.$$

而随机数（$u_1, u_2 \sim U(0, 1)$）与角度（$\theta, \phi$）之间的关系，由 CDF 反函数确定，我们唯一需要解决的问题就是如何将 $p(\omega_i) = \frac{1}{2\pi}$ 的自变量转换为$\theta, \phi$  

根据连续型多元随机变量的概率积分定义，总概率在不同坐标系下表达时应当保持恒等  
所以
$$\iint p(\theta, \phi) \, d\theta \, d\phi = \int p(\omega) \, d\omega = \iint \left( \frac{1}{2\pi} \right) \sin\theta \, d\theta \, d\phi$$

由此，我们直接得到了关于 $\theta$ 和 $\phi$ 的联合概率密度函数

$$p(\theta, \phi) = \frac{\sin\theta}{2\pi}$$

而逆变换采样法在数学上是一个“一维定理”，它根本没办法直接处理多维的联合概率密度函数，所以我们需要将这个联合概率密度拆分为两个边缘概率密度


根据概率论对联合 PDF 的其中一个自变量在定义域上进行积分，就能得到另一个自变量的边缘概率密度函数

1. 方位角 $\phi$ 的边缘 PDF  
$\theta$ 的取值范围是半球的 $[0, \frac{\pi}{2}]$
$$p(\phi) = \int_{0}^{\frac{\pi}{2}} p(\theta, \phi) \, d\theta = \int_{0}^{\frac{\pi}{2}} \frac{\sin\theta}{2\pi}\, d\theta = \frac{1}{2\pi}$$

2. 天顶角 $\theta$ 的边缘 PDF  
$\phi$ 的取值范围是整个圆周的 $[0, 2\pi]$
$$p(\theta) = \int_{0}^{2\pi} p(\theta, \phi) \, d\phi = \int_{0}^{2\pi} \frac{\sin\theta}{2\pi} \, d\phi = \sin\theta$$

此时细心的你会发现，如果把我们求得的两个边缘 PDF 相乘

$$p(\theta) \cdot p(\phi) =  \frac{\sin\theta}{2\pi} = p(\theta, \phi)$$

它们相乘的结果刚好等于联合 PDF！在概率论中，这严格证明了随机变量 $\theta$ 和 $\phi$ 是相互独立的。正因为独立，我们接下来可以放心地对它们各自单独使用一维的逆变换采样

呼，终于解决了前置问题终于可以使用逆变换采样法了

对 $p(\phi)$ 在 $[0, \phi]$ 积分得到其 CDF $F(\phi)$
$$F(\phi) = \int_{0}^{\phi} \frac{1}{2\pi}  d\phi = \frac{\phi}{2\pi} $$

求反函数，我们令 $F(\phi)$ 的反函数为 $F^{-1}(u_1)$，我们令 $u_1 = F(\phi)$ 根据反函数的性质： 

$$F^{-1}(F(\phi)) = \phi$$
$$F^{-1}(u_1) =\phi =  2\pi u_1$$

同理我们可以得到

$$\cos\theta = u_2$$
我们没必要解出$\theta = \arccos(u_2)$，因为我们最终需要将其转化为直角坐标

再看我们的直角坐标与球坐标之间的转换关系
$$\left\{\begin{matrix}
x =\sin\theta\cos\phi\\
y=\sin\theta\sin\phi \\
z=\cos\theta
\end{matrix}\right.$$

其中 $\cos\theta$ 我们已经知道了，$\cos\phi,\sin\phi$ 我们也已经知道了  
就差最后一个 $\sin\theta$ 了，这个也非常好算根据$\sin^2\theta + \cos^2\theta = 1$，我们可以算出
$$\sin\theta = \sqrt{1 - (u_2)^2}$$
所以最终我们得到
$$\left\{\begin{matrix}
x = \sqrt{1 - (u_2)^2}\cdot \cos(2\pi u_1)\\
y = \sqrt{1 - (u_2)^2}\cdot \sin(2\pi u_1) \\
z = u_2
\end{matrix}\right.$$

即
$$
\omega_i = (\sqrt{1 - (u_2)^2}\cdot \cos(2\pi u_1),\sqrt{1 - (u_2)^2}\cdot \sin(2\pi u_1),u_2)
$$

我们可以写下这样的代码
```c++
Vec3 sample_hemisphere(const Vec3 &normal) {
  float z = random_float();
  float r = std::sqrt(1.0f - z * z);
  float phi = 2.0f * PI * random_float();
  Vec3 wi(r * std::cos(phi), r * std::sin(phi), z);
  return wi.unit_vector();
}
```
## 转换到世界坐标
这对吗？这明显不对，我们要做的是在 normal 方向上的半球进行采样，而我们现在这个函数中这个参数始终没有使用，这是为什么呢？  

事实上，你有没有发现我们定义的
$$
\left\{\begin{matrix}
x =\sin\theta\cos\phi\\
y=\sin\theta\sin\phi \\
z=\cos\theta
\end{matrix}\right.
$$
是在一个在坐标原点单位球上进行的，并且是以 z 轴为 normal的

所以这是一个局部坐标，我们需要通过唯一的 normal 信息将我们采样到的 wi 转换到世界坐标系中。

为此我们需要通过基变换

$$
\omega_i^{\prime} = \mathbf{P} \omega_i
$$
为此我们需要知道一个正交基，其中 normal 是这组基的 z 轴，但是我们现在只知道 normal，还有两个轴我们不知道，所以我们需要通过 normal 确定这两个轴

我们的想法是：构造一个垂直于 normal 的单位向量，再让 normal 与这个单位向量做叉乘，就能得到三个轴

而我们根据公式
$$
tangent = ref - (ref \cdot normal) \times normal
$$
这个公式表达的是：随便找个参考向量 ref，然后减去 ref 在 normal 上的投影，得到的差就是垂直于 normal 的，然后我们再让 normal 与 tangent 做叉乘，就能得到第三个轴

$$
\omega_i^{\prime} = [tangent\quad bitangent\quad normal] \omega_i
$$
代码我们可以这么写
```c++
Vec3 sample_hemisphere(const Vec3 &normal) {
  float z = random_float();
  float r = std::sqrt(1.0f - z * z);
  float phi = 2.0f * PI * random_float();
  Vec3 wi(r * std::cos(phi), r * std::sin(phi), z);
  Vec3 tangent;
  if (std::abs(normal.x) > 0.9f)// 不能让 ref 与 normal 平行 
    tangent = unit_vector(Vec3(0.0f, 1.0f, 0.0f) - normal * normal.y);// ref = Vec3(0.0f, 1.0f, 0.0f) , ref \ cdot normal = normal.y
  else
    tangent = unit_vector(Vec3(1.0f, 0.0f, 0.0f) - normal * normal.x);// ref = Vec3(1.0f, 0.0f, 0.0f) , ref \ cdot normal = normal.x
  Vec3 bitangent = cross(normal, tangent);
  return unit_vector(tangent * local.x + bitangent * local.y + normal * local.z);
}
```


-----
2026/8/22 23:18 +08:00 还有人会关心我吗