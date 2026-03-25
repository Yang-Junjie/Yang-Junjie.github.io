---
title: "Hugo 功能测试文章"
date: 2026-03-15
draft: false

tags:
  - hugo
  - graphics
  - math
  - test

categories:
  - blog

cover:
  image: "images/head1.jpg"
  alt: "test cover"

math: true
---

# Hugo 全功能测试

这是一篇用于测试 **Hugo + PaperMod** 博客功能是否正常的文章。

目录应该会自动生成。

---

# 1. 行内公式

这是一个行内公式：

$E = mc^2$

这是另一个：

$\mathbf{v'} = R_z(\theta)\mathbf{v}$

---

# 2. 块级公式

$$
f(x) = x^2 + 2x + 1
$$

---

# 3. 矩阵测试（图形学重要）

$$
R_z(\theta) =
\begin{pmatrix}
\cos\theta & -\sin\theta & 0 \\\\
\sin\theta & \cos\theta & 0 \\\\
0 & 0 & 1
\end{pmatrix}
$$

---

# 4. 多行公式

$$
\begin{aligned}
x' &= x\cos\theta - y\sin\theta \\\\
y' &= x\sin\theta + y\cos\theta
\end{aligned}
$$

---

# 5. 代码高亮 (C++)

```cpp
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>

glm::mat4 model = glm::rotate(
    glm::mat4(1.0f),
    glm::radians(45.0f),
    glm::vec3(0,0,1)
);
```

---

# 6. Shader 代码 (GLSL)

```glsl
vec3 rotateZ(vec3 p, float theta)
{
    mat3 R = mat3(
        cos(theta), -sin(theta), 0.0,
        sin(theta), cos(theta), 0.0,
        0.0,        0.0,        1.0
    );

    return R * p;
}
```

---

# 7. Python 代码

```python
import numpy as np

theta = np.pi / 4

R = np.array([
    [np.cos(theta), -np.sin(theta), 0],
    [np.sin(theta), np.cos(theta), 0],
    [0,0,1]
])
```

---

# 8. 表格

| Algorithm | Complexity | Notes |
|----------|-----------|------|
| Ray Tracing | O(n) | realistic |
| Rasterization | O(1) | fast |
| Path Tracing | expensive | global illumination |

---

# 9. 引用

> Computer graphics is the art of turning mathematics into images.

---

# 10. 列表

## 无序列表

- Rendering
- Geometry
- Shaders
- Ray Tracing

## 有序列表

1. Camera
2. Transform
3. Lighting
4. Shading

---

# 11. 图片测试

![test image](https://picsum.photos/800/400)

---

# 12. 链接

访问：

Hugo 官网：

https://gohugo.io

---

# 13. 行内代码

这是一个 `glm::mat4` 示例。

---

# 14. 分隔线

---

# 15. 数学符号测试

$$
\int_0^1 x^2 dx = \frac{1}{3}
$$

---

# 16. 大公式测试

$$
L_o(\mathbf{p}, \omega_o) = L_e(\mathbf{p}, \omega_o) + \int_{\mathcal{S}^2} f_r(\mathbf{p}, \omega_i, \omega_o) L_i(\mathbf{p}, \omega_i) (\omega_i \cdot \mathbf{n}) d\omega_i
$$

$$
M_{proj} = \begin{pmatrix} 
\frac{n}{r} & 0 & 0 & 0 \\\\ 
0 & \frac{n}{t} & 0 & 0 \\\\ 
0 & 0 & -\frac{f+n}{f-n} & -\frac{2fn}{f-n} \\\\ 
0 & 0 & -1 & 0 
\end{pmatrix}
$$

$$
f_r = \frac{D(\omega_h) F(\omega_i, \omega_h) G(\omega_i, \omega_o, \omega_h)}{4 (\omega_i \cdot \mathbf{n})(\omega_o \cdot \mathbf{n})}
$$

$$
F_{Schlick}(R_0, \theta) = R_0 + (1 - R_0)(1 - \cos\theta)^5
$$

$$
f(x) = \begin{cases} 
\frac{1}{b-a} & \text{for } a \le x \le b \\\\ 
0 & \text{for } x < a \text{ or } x > b 
\end{cases}
$$


$$
\begin{aligned}
\nabla \cdot \mathbf{E} &= \frac{\rho}{\varepsilon_0} \\\\
\nabla \cdot \mathbf{B} &= 0 \\\\
\nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} \\\\
\nabla \times \mathbf{B} &= \mu_0\left(\mathbf{J} + \varepsilon_0\frac{\partial \mathbf{E}}{\partial t}\right)
\end{aligned}
$$
---

# 17. 脚注测试

这里有一个脚注[^1]

[^1]: 这是一个脚注示例。

---

# 18. 任务列表

- [x] 数学公式
- [x] 代码高亮
- [x] 表格
- [x] 图片
- [x] markdown

---

# 19. Emoji

😀 🚀 🧠 🎮

---

# 20. 总结

如果这篇文章显示正常，说明：

- 数学公式正常
- 代码高亮正常
- markdown 渲染正常
- TOC 正常
- 搜索正常