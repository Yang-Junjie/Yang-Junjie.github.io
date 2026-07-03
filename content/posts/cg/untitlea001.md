---
date : '2026-07-03T21:08:35+08:00'
draft : false
title : '【CG】 屏幕空间导数'
tags:
  - graphics

categories:
  - blog

math: true
---
# 介绍
在光栅化中我们通过定义三角形的三个顶点的各种属性并对其进行重心坐标插值而得到三角形内部点的属性，而我们又经常需要知道**在屏幕空间中三角形内部两个相邻的像素间其对应的三维空间中点的属性的变化率**（在连续空间中变化率就是导数），简单说就是当像素变化了一个单位时其他属性的变化量是多少。

有的好奇宝宝又要问了，屏幕空间不是离散的吗，为什么还能求导？屏幕空间在最终阶段确实是离散的，但是在我们进行光栅化前，那些被投影到屏幕空间后被插值的属性都是连续的。而我们就是在这一阶段上进行求导。

# 推导
例如:  
我们给一个三角形的三个顶点定义了如下属性：
- Position : $\mathbf{P_0}(x_0,y_0,z_0), \mathbf{P_1}(x_1,y_1,z_1), \mathbf{P_2}(x_2,y_2,z_2)$
- TexCoord : $\mathbf{T_0}(u_0,v_0), \mathbf{T_1}(u_1,v_1), \mathbf{T_2}(u_2,v_2)$

使用重心坐标 $\alpha, \beta, \gamma$，插值后得到的任意 TexCoord
$$\mathbf{T}^{\prime}(u,v) = \alpha \mathbf{T_0} + \beta \mathbf{T_1} + \gamma \mathbf{T_2}$$
使用裁剪空间的 $ w_{i} \quad i= 1,2,3 $ 做完透视矫正后，可以得到：
$$\mathbf{T}(u,v) = \frac{\alpha \mathbf{T_0} \frac{1}{w_0} + \beta \mathbf{T_1}\frac{1}{w_1} + \gamma \mathbf{T_2}\frac{1}{w_2}}{\alpha \frac{1}{w_0} + \beta \frac{1}{w_1} + \gamma \frac{1}{w_2}}$$

我们令 $q_i = \frac{1}{w_i} \quad i= 1,2,3$

将公式改写为：
$$ \mathbf{T}(u,v) = \frac{\alpha q_0 \mathbf{T_0}  + \beta  q_1 \mathbf{T_1}  + \gamma  q_2 \mathbf{T_2}}{\alpha q_0 + \beta q_1 + \gamma q_2}$$
而我们又知道 $u,v$ 三角形内部的点的函数 $u(x,y) , v(x,y)$，将三角形内部的点 $(x,y)$ 映射到纹理空间得到纹理坐标 $(u,v)$  
所以
$$ \mathbf{T}(u(x,y),v(x,y)) = \frac{\alpha q_0 \mathbf{T_0}  + \beta  q_1 \mathbf{T_1}  + \gamma  q_2 \mathbf{T_2}}{\alpha q_0 + \beta q_1 + \gamma q_2}$$
而重心坐标也是和三角形内部的点 $\mathbf{P}(x,y)$ 相关的，我们一般通过面积求得重心坐标：
$$ \alpha = \frac{A_0}{A} , \beta = \frac{A_1}{A} , \gamma = \frac{A_2}{A}$$
其中
$$ A = (\mathbf{P_1}-\mathbf{P_0}) \times (\mathbf{P_2}-\mathbf{P_0})$$
$$ A_0 = (\mathbf{P_1}-\mathbf{P}) \times (\mathbf{P_2}-\mathbf{P})$$
$$ A_1 = (\mathbf{P_2}-\mathbf{P}) \times (\mathbf{P_0}-\mathbf{P})$$
$$ A_2 = (\mathbf{P_0}-\mathbf{P}) \times (\mathbf{P_1}-\mathbf{P})$$
而 $\mathbf{P}$ 是与 $x$ $y$ 相关的所以
$$ \mathbf{T}(x,y) = \frac{\alpha(x,y) q_0 \mathbf{T_0}  + \beta(x,y)  q_1 \mathbf{T_1}  + \gamma(x,y)  q_2 \mathbf{T_2}}{\alpha(x,y) q_0 + \beta(x,y) q_1 + \gamma(x,y) q_2}$$
所以我们要求的是
$$ \frac{\partial \mathbf{T}(x,y)}{\partial x}  \text{与} \frac{\partial \mathbf{T}(x,y)}{\partial y}$$

虽然这是一个向量值函数求导，但是我认为没必要引入雅可比矩阵，因为这会增加复杂度，我们直接使用小学二年级就会的对分式的求导法则  
$$(\frac{f(x)}{g(x)})^{\prime} = \frac{f'(x)g(x) - f(x)g'(x)}{g(x)^2}$$

即：上导下不导减去上不导下导除以分母的平方

我们令分子为
$$N(x,y) = \alpha(x,y) q_0 \mathbf{T_0}  + \beta(x,y)  q_1 \mathbf{T_1}  + \gamma(x,y)  q_2 \mathbf{T_2} $$
令分母为
$$D(x,y) = \alpha(x,y) q_0 + \beta(x,y) q_1 + \gamma(x,y) q_2$$

那么原公式写为
$$\mathbf{T}(x,y) = \frac{N(x,y)}{D(x,y)}$$

$$ \frac{\partial \mathbf{T}(x,y)}{\partial x} = \frac{N_x(x,y)D(x,y) - N(x,y)D_x(x,y)}{D(x,y)^2}$$
$$ \frac{\partial \mathbf{T}(x,y)}{\partial y} = \frac{N_y(x,y)D(x,y) - N(x,y)D_y(x,y)}{D(x,y)^2}$$

我们这里拿 $\mathbf{T}_x$ 举例， $\mathbf{T}_y$ 同理  

对于 $\mathbf{T}_x$ 我们只需求得 $N_x(x,y)$ 与 $D_x(x,y)$ 即可，而他们都是线性函数，求导非常简单，所以最终问题变为  $\alpha $、$\beta $、$\gamma$ 怎么求导

拿$\alpha$举例，其他同理 
  $$\alpha(x,y) = \frac{A_0(x,y)}{A}$$
我们将   
$$A_0(x,y) = (\mathbf{P_1}-\mathbf{P}) \times (\mathbf{P_2}-\mathbf{P}) = (x_1-x)(y_2-y)-(y_1-y)(x_2-x) $$ 
$$A_0(x,y) = x_1y_2-y_1x_2+x(y_1-y_2)+y(x_2-x_1)$$
代入
$$\alpha(x,y) = \frac{x_1y_2-y_1x_2+x(y_1-y_2)+y(x_2-x_1)}{A}$$
$$ \frac{\partial \alpha}{\partial x} = \frac{y_1-y_2}{A}$$
$$ \frac{\partial \alpha}{\partial y} = \frac{x_2-x_1}{A}$$

好了经过这些步骤其实我们就已经能将 $\mathbf{T}(x,y)$ 的导数求出来了，其实我们可以对 $\mathbf{T}_x$ 与 $\mathbf{T}_y$ 进行一步化简，因为我们知道
$$ \mathbf{T}(x,y) = \frac{N(x,y)}{D(x,y)}$$
而我们发现 $\mathbf{T}_x$ 与 $\mathbf{T}_y$ 中存在一个 $\frac{N(x,y)}{D(x,y)}$ 结构，所以可以将 $\mathbf{T}_x$ 写成  
$$ \frac{\partial \mathbf{T}(x,y)}{\partial x} = \frac{N_x(x,y) - \mathbf{T}(x,y)D_x(x,y)}{D(x,y)}$$
$\mathbf{T}_y$ 同理

最后我们发现 屏幕空间导数 其实只和 重心坐标 和 公式的结构 相关 与属性是无关的，所以我们可以将 $\mathbf{T}$ 换成任何三角形顶点的属性$\mathbf{A}$

# 应用
我们已经知道屏幕空间导数的解析解是什么样子了，但它有什么用呢？GPU 中是怎么计算的呢？

## 具体应用
还是拿纹理举例子，纹理也是光栅化中使用屏幕空间导数最常用的一个例子，在我们计算 Mipmap 的 LOD 时我们需要通过屏幕空间导数来自动判断 Mipmap 的 LOD 并进行 三线性插值。   
具体我们可以这么计算 ：  
已知屏幕空间导数
$$ \frac{\partial \mathbf{T}(u,v)}{\partial x} = \begin{bmatrix}
\frac{\partial u}{\partial x} \\
\frac{\partial v}{\partial x} 
\end{bmatrix}$$

$$ \frac{\partial \mathbf{T}(u,v)}{\partial y} = \begin{bmatrix}
\frac{\partial u}{\partial y} \\
\frac{\partial v}{\partial y} 
\end{bmatrix}$$

以及纹理的 宽度 $w$ 高度 $h$，那么
$$\mathbf{d}_x =  \begin{bmatrix}
\frac{\partial u}{\partial x} w\\
\frac{\partial v}{\partial x} h
\end{bmatrix}$$
$$\mathbf{d}_y =  \begin{bmatrix}
\frac{\partial u}{\partial y} w\\
\frac{\partial v}{\partial y} h
\end{bmatrix}$$
就代表一个像素在 纹理空间 里的两个边向量吗，这两个向量张成的平行四边形，就是一个屏幕像素在纹理中的近似 footprint
而如果我们不考虑各向异性过滤，只考虑 简单的 正方形 footprint
则
$$ l_x = \left \| \mathbf{d}_x \right \| $$
$$ l_y = \left \| \mathbf{d}_y \right \| $$
$$ l = \max(l_x,l_y) $$
那么 LOD 就可以计算为
$$ LOD = \log_2(l) $$
## GPU
而在 GPU 中并不会采用这种解析解的方式，GPU 采用是的非常简单粗暴的方式，直接对屏幕空间中三角形内部两个相邻的像素的属性做差的到差分值将其作为变化率，这是一个有限差分的近似估算，但在像素级别，这种精度已经足够应对绝大多数图形渲染需求了，并且这种方式也适合 GPU 的物理结构

