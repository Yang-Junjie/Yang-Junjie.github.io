---
date : '2026-07-01T15:07:35+08:00'
draft : true
title : 'Stage1_1'
tags:
  - graphics

categories:
  - blog

math: true
---
# 线性代数
> tips：我们这里介绍的都是极为感性的认识，追求的是直观理解，绝对谈不上严谨。我们的终极目标是教会你如何操作和使用这个数学工具。更严谨的数学推导和定义，建议在学校课堂或专业教材中深入学习！

这篇文章将介绍 **矩阵及其运算**
# 矩阵
在计算机图形学中矩阵是一个**矩形数表**，其中可以放各种各样的数字，例如这样
$$
\mathbf{A} = \begin{bmatrix}
1  & \pi \\
2  & 1
\end{bmatrix} \quad \mathbf{B} = \begin{bmatrix}
\ln2  &\frac{1}{2}  &0.5 \\
78  & 88 &114514
\end{bmatrix}
$$
我们用 $\mathbf{A}_{i,j}$ 表示矩阵 $\mathbf{A}$ 的第 $i$ 行第 $j$ 列的元素，例如 $\mathbf{A}_{1,2}$ 表示矩阵 $\mathbf{A}$ 的第 1 行第 2 列的元素，也就是元素 $\pi$

# 矩阵的形状
通过上面的例子我们可以看到矩阵这个数表的行和列是可以不同的，上例中 $\mathbf{A}$ 是 2 行 2 列的矩阵， $\mathbf{B}$ 是 2 行 3 列的矩阵。我们一般可以记作 $shape(A) = 2 \times 2$ ,$shape(B) = 2 \times 3$ 
## 矩阵的运算
### 矩阵的加减法
矩阵的加减法规则简单到一句话就能概括：**对应位置的元素直接相加/相减。** 

既然要“对应位置”，那两个矩阵的**形状（行数和列数）必须完全相同**。  
例如:  
设 矩阵 $A$ 和 $B$ 形状都是 $n \times m$ 我们想计算：
$$\mathbf{C} = \mathbf{A} \pm \mathbf{B}$$
那我们只需要对所有下标 $i$ 和 $j$ 对应的元素进行实数加减法：$\mathbf{C}_{i,j} = \mathbf{A}_{i,j} \pm \mathbf{B}_{i,j}$。最后得到的矩阵 $\mathbf{C}$ 的形状和 $\mathbf{A}$、$\mathbf{B}$ 一模一样。  

我们拿加法举例：
$$
\mathbf{A} = \begin{bmatrix}
 1 & 1 & 1\\
 2 & 2 & 2\\
 3 & 3 & 3
\end{bmatrix} \quad \mathbf{B} = \begin{bmatrix}
 1 & 2 & 3\\
 1 & 2 & 3 \\
 1 & 2 & 3
\end{bmatrix}
$$
那么
$$
\mathbf{C} = \mathbf{A}+\mathbf{B} = \begin{bmatrix}
 1+1 & 2+1 & 1+3\\
 2+1 & 2+2 & 2+3\\
 3+1 & 3+2 & 3+3
\end{bmatrix}=\begin{bmatrix}
 2 & 3 & 4\\
 3 & 4 & 5\\
 4 & 5 & 6
\end{bmatrix}
$$
### 矩阵的转置
矩阵的转置是线性代数中的一种新的运算，它是一个一元运算，在我们之前学习的代数中是没有这个运算的，或者是说这个运算在我们之前学习的代数中是没有意义的。  

转置运算就是将矩阵的行和列进行交换，就像你拿着一个矩形的两个对角（不相邻的两个角）将这个矩形平面绕着这个轴旋转 180 度一样

假设我们有一个矩阵 $\mathbf{A}$ ，那么我们将矩阵 $\mathbf{A}$ 的转置记作 $\mathbf{A}^{T}$。
对每个元素 $\mathbf{A}_{i,j}$ 有 $\mathbf{A}^{T}_{i,j} = \mathbf{A}_{j,i}$

例如：
$$ 
\mathbf{A} = \begin{bmatrix}
 1 & 1 & 1\\
 2 & 2 & 2\\
 3 & 3 & 3
\end{bmatrix} \quad \mathbf{A}^{T} = \begin{bmatrix}
 1 & 2 & 3\\
 1 & 2 & 3 \\
 1 & 2 & 3
\end{bmatrix}
$$

> 为什么说在我们之前的代数中转置是没有意义的，因为对于一个 实数 $k$ 我们将它看作是一个 $1 \times 1$ 的矩阵对于一个 $ 1 \times 1$ 的矩阵做转置还是它本身
### 矩阵的数乘
矩阵的数乘很简单就是目标是让一个 实数 与 矩阵 相乘，那么规则是：对矩阵中的每个元素乘以这个数  
假设我们有一个矩阵 $\mathbf{A}$ 和 实数 $k$ ，那么对每个元素 $\mathbf{A}_{i,j}$ 乘以 $k$ ，即 $k \cdot \mathbf{A}_{i,j}$。

例如：
$$
\mathbf{A} = \begin{bmatrix}
 1 & 1 & 1\\
 2 & 2 & 2\\
 3 & 3 & 3
\end{bmatrix} \quad k = 2 \quad
k \cdot \mathbf{A} = 2 \cdot \mathbf{A} = \begin{bmatrix}
 2 & 2 & 2\\
 4 & 4 & 4\\
 6 & 6 & 6
\end{bmatrix}
$$
### 矩阵的乘法
在介绍矩阵的乘法前，我们先介绍一下向量（虽然你很熟悉，但是线性代数中的向量与高中阶段的向量有些不同的地方）
如果矩阵的形状是 $1 \times n$ 的，或者是 $n \times 1$的，这样形状的矩阵就是我们熟悉的向量了，所以向量其实是一种特殊的矩阵
例如：
$$
\mathbf{v} = \begin{bmatrix}
1  & 2 
\end{bmatrix}
$$
$$
\mathbf{x} = \begin{bmatrix}
1 \\
2 
\end{bmatrix}
$$
其中 $1 \times n$ 的向量我们叫做行向量， $n \times 1$ 的向量我们叫做列向量

我们现在知道了向量其实是特殊形状的矩阵，它相对简单，我们首先看看向量（简单的矩阵）之间的乘法是怎么做的。

我们高中阶段都知道向量的点乘运算是对应元素相乘再求和（显然他们的元素个数应该相同）。  

但是我们在线性代数中稍微有些不同，点乘（内积）在线性代数中定义为行向量与列向量的乘积，并且他们的元素个数也必须相同。

假设我们有向量 $1 \times 2$的行向量 $ \mathbf{v} $ ，以及 $2 \times 1$ 的列向量 $\mathbf{x} $ ，那么 他们做矩阵乘法就是 
$$ \sum_{i=1}^{2}\mathbf{v}_{1,i} \cdot \mathbf{x}_{i,1} = \mathbf{v}_{1,1} \cdot \mathbf{x}_{1,1} + \mathbf{v}_{1,2} \cdot \mathbf{x}_{2,1} $$

写成矩阵的形式：
$$ 
\mathbf{v} \mathbf{x} = \begin{bmatrix}
1  & 2 
\end{bmatrix}\begin{bmatrix}
1 \\
2 
\end{bmatrix} = 1 \cdot 1 + 2 \cdot 2 = 5
$$ 
注意，一定不能写成
$$ 
\mathbf{x} \mathbf{v} = \begin{bmatrix}
1 \\
2 
\end{bmatrix}\begin{bmatrix}
1  & 2 
\end{bmatrix} 
$$
这样它会等于
$$
\mathbf{x} \mathbf{v} = \begin{bmatrix}
1 \\
2 
\end{bmatrix}\mathbf{v} =
 \begin{bmatrix}
 1 \cdot \mathbf{v}\\ 
 2\cdot \mathbf{v}
\end{bmatrix}= \begin{bmatrix}
 1 &2 \\ 
2  &4
\end{bmatrix}
$$
这个叫做**向量的外积**


-----

现在我们扩展到通常意义上的矩阵上，我们直接看例子：

对于一个 $2 \times 2$ 的矩阵 $\mathbf{A}$ 
$$
\mathbf{A} = \begin{bmatrix}
1  & \pi \\
2  & 1
\end{bmatrix}
$$
我们可以把 $\mathbf{A}$ 写成这样：
$$
\mathbf{A}= \begin{bmatrix}
\mathbf{v}_1  &\mathbf{v}_2
\end{bmatrix}
$$
其中 $\mathbf{v}_1 = \begin{bmatrix}
1  & 2
\end{bmatrix}^T $ ，$\mathbf{v}_2 = \begin{bmatrix}
\pi  &  1
\end{bmatrix}^T $   

或者我们还可以把 $\mathbf{A}$ 写成：  
$$
\mathbf{A}= \begin{bmatrix}
\mathbf{v_3} \\
\mathbf{v_4}
\end{bmatrix}
$$
其中
$\mathbf{v}_3 = \begin{bmatrix}
1  & \pi
\end{bmatrix} $ ，$\mathbf{v}_4 = \begin{bmatrix}
2  &  1
\end{bmatrix}^T $  

可以看到矩阵的元素可以组合成向量，我们让矩阵与向量相乘

$$
\mathbf{A} \times \mathbf{x} = \begin{bmatrix}
1  & \pi \\
2  & 1
\end{bmatrix}\begin{bmatrix}
1 \\
2 
\end{bmatrix} = \begin{bmatrix}
\mathbf{v}_1  &\mathbf{v}_2
\end{bmatrix}\begin{bmatrix}
1 \\
2 
\end{bmatrix} =  \mathbf{v}_1 \cdot 1 +  \mathbf{v}_2  \cdot 2= \begin{bmatrix}
1\cdot 1 + \pi\cdot 2 \\
2\cdot 1 + 1\cdot 2
\end{bmatrix} = \begin{bmatrix}
1 + 2\pi \\
4
\end{bmatrix}
$$

有没有发现我们经过神奇的操作将矩阵乘法化为了我们熟悉的向量的点乘（行向量乘列向量），不过得到的结果依然是个向量，因为矩阵中的元素已经变成向量了

我们可以大胆一点
$$
\mathbf{A} \times \mathbf{A} = \begin{bmatrix}
1  & \pi \\
2  & 1
\end{bmatrix} \begin{bmatrix}
1  & \pi \\
2  & 1
\end{bmatrix} = \begin{bmatrix}
\mathbf{v}_1  &\mathbf{v}_2
\end{bmatrix}\begin{bmatrix}
\mathbf{v_3} \\
\mathbf{v_4}
\end{bmatrix} = \mathbf{v}_1 \mathbf{v}_3 + \mathbf{v}_2 \mathbf{v}_4 
$$
这是列向量乘以行向量的形式，得使用向量的外积
$$
\mathbf{A} \times \mathbf{A}  = \mathbf{v}_1 \mathbf{v}_3 + \mathbf{v}_2 \mathbf{v}_4  = \begin{bmatrix}
 1\\
2
\end{bmatrix} \mathbf{v}_3 + \begin{bmatrix}
 \pi \\
 1
 \end{bmatrix} \mathbf{v}_4 = \begin{bmatrix}
 1\mathbf{v}_3 + \pi\mathbf{v}_4\\
2\mathbf{v}_3 + 1\mathbf{v}_4
\end{bmatrix} = \begin{bmatrix} 1+2\pi & 2\pi \\ 4 & 1+2\pi \end{bmatrix}
$$

恭喜你通过向量运算发明了矩阵乘法，但是在日常计算或者写代码时，我们更常用的是下面这个法则。

假设我们有两个矩阵 $\mathbf{A}$ 和 $\mathbf{B}$，我们要计算 $\mathbf{C} = \mathbf{A}\mathbf{B}$。


矩阵乘法不是你想乘就能乘的。必须满足 $shape(\mathbf{A}) = n \times m$， $shape(\mathbf{B}) = m \times p$， **$\mathbf{A}$ 的列数（$m$）必须等于 $\mathbf{B}$ 的行数（$m$）**。
而乘完之后得到的矩阵 $\mathbf{C}$，它的形状是：$n \times p$。

对于结果矩阵 $\mathbf{C}$ 中的任意一个元素 $\mathbf{C}_{i,j}$，它的计算规则是：**拿矩阵 $\mathbf{A}$ 的第 $i$ 行，去和矩阵 $\mathbf{B}$ 的第 $j$ 列做向量点乘。**

写成数学公式就是：

$$\mathbf{C}_{i,j} = \sum_{k=1}^{m} \mathbf{A}_{i,k} \cdot \mathbf{B}_{k,j}$$

我们还拿矩阵 $\mathbf{A}$ 自己乘自己来试试：


$$\mathbf{A} = \begin{bmatrix} 1 & \pi \\ 2 & 1 \end{bmatrix}$$

我们要计算 $\mathbf{C} = \mathbf{A} \times \mathbf{A}$：

* **$\mathbf{C}_{1,1}$（第1行第1列）**：拿 $\mathbf{A}$ 的第1行 $\begin{bmatrix}1 & \pi\end{bmatrix}$ 乘第1列 $\begin{bmatrix}1 \\ 2\end{bmatrix}$ $\implies 1 \times 1 + \pi \times 2 = 1 + 2\pi$
* **$\mathbf{C}_{1,2}$（第1行第2列）**：拿 $\mathbf{A}$ 的第1行 $\begin{bmatrix}1 & \pi\end{bmatrix}$ 乘第2列 $\begin{bmatrix}\pi \\ 1\end{bmatrix}$ $\implies 1 \times \pi + \pi \times 1 = 2\pi$
* **$\mathbf{C}_{2,1}$（第2行第1列）**：拿 $\mathbf{A}$ 的第2行 $\begin{bmatrix}2 & 1\end{bmatrix}$ 乘第1列 $\begin{bmatrix}1 \\ 2\end{bmatrix}$ $\implies 2 \times 1 + 1 \times 2 = 4$
* **$\mathbf{C}_{2,2}$（第2行第2列）**：拿 $\mathbf{A}$ 的第2行 $\begin{bmatrix}2 & 1\end{bmatrix}$ 乘第2列 $\begin{bmatrix}\pi \\ 1\end{bmatrix}$ $\implies 2 \times \pi + 1 \times 1 = 1 + 2\pi$

把它们拼起来：


$$\mathbf{C} = \begin{bmatrix} 1+2\pi & 2\pi \\ 4 & 1+2\pi \end{bmatrix}$$

### 矩阵乘法的性质
1. $\mathbf{A}\mathbf{B} \neq \mathbf{B}\mathbf{A}$
2. $(\mathbf{A}\mathbf{B})\mathbf{C} = \mathbf{A}(\mathbf{B}\mathbf{C})$
3. $\mathbf{A}(\mathbf{B}+\mathbf{C}) = \mathbf{A}\mathbf{B} + \mathbf{A}\mathbf{C}$，($(\mathbf{A} +\mathbf{B})\mathbf{C} = \mathbf{A}\mathbf{C} + \mathbf{B}\mathbf{C}$)
4. $(\mathbf{A}\mathbf{B})^T = \mathbf{B}^T\mathbf{A}^T$

这些性质如果读者感兴趣自行验证吧


### 矩阵的逆
学了乘法我们来看看矩阵乘法的逆运算，或者称作矩阵的逆元，什么是逆元呢？在实数中 $k$ 的逆元是 $\frac{1}{k} = k^{-1} 、\quad k \neq 0$

在学习矩阵的逆这个概念之前我们看看单位矩阵的概念，在实数中我们有一个单位元也就是 $1$ ，1 乘任何实数 $k$ 都等于 $k$ ,那么我们矩阵中存不存在这样的单位元呢？令人失望的在所有形状的矩阵下不存在一个统一的单位元，但是对于定义在同一个线性空间中的 $n \times n$ 的矩阵来说存在单位元

对于元素是 $3 \times 3$ 的矩阵的线性空间，我们定义单位元为
$$ \mathbf{I} = \begin{bmatrix} 1 & 0 & 0 \\ 0 & 1 & 0 \\ 0 & 0 & 1 \end{bmatrix} $$

对于形状更大的方形矩阵来说也类似，就是从左上角，到右下角，都是1，其他都是0

我们上面提到过单位元：无论怎么乘单位元，结果等于它本身
$$
\mathbf{I} \times \mathbf{A} = \mathbf{A} \times \mathbf{I} = \mathbf{A}
$$
读者可以自行验证，可以发现无论怎么乘都是 $\mathbf{A}$ 本身

在实数中我们知道 当一个数乘以自己的逆的时候，结果等于 1
$$ k \times k^{-1} = 1$$

而在矩阵中，我们同样这么定义
$$ \mathbf{A} \times \mathbf{A}^{-1} = \mathbf{A}^{-1} \times \mathbf{A} = \mathbf{I} $$

由于我们的逆是定义在单位元下的，所以同样只有方形矩阵才有逆

### 逆的性质
1. $(\mathbf{A}^{-1})^{-1} = \mathbf{A}$
2. $(\mathbf{A}\mathbf{B})^{-1} = \mathbf{B}^{-1}\mathbf{A}^{-1}$
3. 如果一个矩阵的对角阵，则它的逆就是对主对角线上的元素取逆
4. 如果一个矩阵是正交矩阵，则它的逆就是它的转置矩阵，如果一个矩阵满足 $\mathbf{A}\mathbf{A}^T = \mathbf{I}$，则它是正交矩阵
5. 矩阵的逆是唯一的

