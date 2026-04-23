---
date : '2026-04-17T16:17:50+08:00'
draft : false
title : '【CG】Re0:从零开始搓一个路径追踪渲染器（待完结）'
tags:
  - graphics

categories:
  - blog

math: true
---
# 背景
你在一个教室中趴在桌子上睡觉，天色开始逐渐变红，教室中的窗帘被一阵风拍的开始乱飞，你被惊醒，发现同学都不见了，你跑出教室，下楼的时候你突然脚滑摔晕。

等你醒来的时候已经晚上，周围的环境让你感到陌生，“有人吗？你好？！”，并没有得到回复。  

你看向唯一发光的物体，是一台笔记本，上面写着你必须实现一个路径追踪渲染器，否则你将一直被关在这个纯黑的密室中，没有时间限制，我们提供了必要的文件，最后需要渲染出一个标准的CornellBox场景，没有性能要求，并发送到邮箱cglab@cglab.top，你发现这台电脑并不能连接网络，“岂可休！”。  

你身为一个计算机系的学生，你对计算机图形学一窍不通只知道计算机图形学是门研究渲染，动画，模拟，几何等等的一门学科，但是你学过C++,cmake,概率论基础，线性代数基础，微积分基础，并且你懂得如何构建让C++代码成功编译并运行。  

你打开了神秘人提供的文件，开打了README.md：  

# README
你好啊。当你看到这个文件的时候，说明你已经被邀请加入CGLab了。  

你可能会问：为什么是我？  

这个我们也不知道，我们加入CGLab的原因我们自己也没有搞明白，我们至今只知道拥有图形学潜力的人会被邀请加入CGLab。  

每个被 **xxx** 邀请加入CGLab的人都会和你一样突然进入这个神秘的空间，并且每个人进入这个空间都会被分配一个任务，每个人的任务都是不一样的这次你被分配的任务是实现一个路径追踪渲染器。

如果这个任务没有完成你会永远被关在这个密室中，自生自灭。  
但如果你完成了任务你将会得到对应的 “**加护**”，你被分配的是渲染领域的任务，**xxx** 认为你在渲染领域非常有潜力。

不过不用担心，我们会在这个README中逐步教你实现一个Path Tracing Renderer。让我们开始吧！！

## PPM
在计算机图形学渲染领域学习的时候我们通常需要渲染一张图片或者多张图片所组成一个连续的动画，在这里我们只需要渲染一张图片，我们都知道图片是由一系列像素组成的，我们可以吧像素理解为一个小方块，每个小方块都有自己的颜色属性，由许多不同颜色的像素就可以组成一张图片。  

这就需要我们使用程序将数据写入一张图片中，但是通常我们使用的 png,jpg 等图片格式并不适合我们进行学习，所以我们这里使用一种格式为 ppm 的图片格式，这种图片格式是一种文本图片格式，
它是由一系列字符串表示的。  

ppm 文件有两种数据格式，一种是 **ASCII** 格式，一种是 **BINARY** 格式。我们将使用第一种格式，这种格式下我们可以轻松的知道每个像素是什么颜色。

### 举个例子
假设我们要创建一个 $2 \times 2$ 像素的微型图片，包含红、绿、蓝和黄四种颜色。它的文件内容看起来是这样的：
```text
P3
2 2
255
255 0 0    
0 255 0
0 0 255
255 255 0
```
- P3: 告诉解析器这是ASCII格式PPM文件
- 2 2: 宽 2 像素，高 2 像素,定义图片的大小
- 255: 颜色范围从 0 到 255，图形学中我们通常使用一个三维向量表示颜色，这个向量中的三个分量分别表示红、绿、蓝的权重。如果如果学过美术的应该很容易懂就类似美术中的红黄蓝可以调配出大部分颜色
- 后面的就是颜色值，通常我们每行一个颜色值

所以我们第一步就是写一个写PPM文件的程序，在图形学中底层中我们通常选择C++进行编写程序
```c++
// 身为被选中的你，应该不需要我门对这段简单的C++代码做出解释了
#include <filesystem>
#include <fstream>
#include <iostream>
#include <vector>

struct Color {
    int r, g, b;
};

void writePPM(const std::filesystem::path& path, int width, int height, const std::vector<Color>& data)
{
    std::ofstream ofs(path);

    ofs << "P3\n" << width << " " << height << "\n255\n";

    for (int i = 0; i < width * height; ++i) {
        int r = data[i].r;
        int g = data[i].g;
        int b = data[i].b;

        ofs << r << " " << g << " " << b << "\n";
    }

    ofs.close();
}
```

我们可以测试 `writePPM` 渲染一个简单的图，我们让图片中的像素的2维坐标 $(u,v)$ 作为图片的颜色 $(u,v,0)$ 

```c++
int main()
{
    int width = 100;
    int height = 100;
    std::vector<Color> data(width * height);

    for (int i = 0; i < height; ++i) {
        for (int j = 0; j < width; ++j) {
            data[i * width + j] = {i, j, 0};
        }
    }

    writePPM("out.ppm", width, height, data);

    return 0;
}
```
渲染出来的结果是
![out.ppm](images/cg/re0pt/out1.png)

## Path Tracing
好了我们已经拥有渲染图片的能力了，让我们正式开始学习Path Tracing的概念，在Path Tracing中我们使用的是几何光学，我们假设光线从我们的眼睛（或者叫Camera）出发经过视口（我们最终渲染出来的图）后在场景中经过一系列弹射最后打到光源的这么一个过程。  

我们可以这么理解，我们通过数学的方式定义了一个在抽象空间的场景，我们想通过我们的眼睛在电脑的显示器上看到这个场景，我们需要通过渲染器才能有办法看到这个场景，这个渲染器会模拟我们的行为，渲染器中会定义我们的眼睛（Camera），我们想以什么角度看这个场景，以及我们的眼睛（Camera）的参数也可以调整，然后定义我们的眼睛最终看到的图片的大小，也就是可视范围，然后模拟光线的弹射，根据光线的弹射将场景中的信息写入可视范围中最后保存为一张图片。  

这其中有很多我们需要解决的问题
- 为什么光线是从相机出发不是从光源出发
- 光线是怎么从相机打出去的
- 光线怎么知道与物体作用了
- 光线与物体作用了之后怎么弹射
- 光线怎么知道打到了光源
- 怎么让渲染的结果与真实物理世界一致  

我们先回答这些问题
### 1. 为什么光线是从相机出发而不是从光源出发
从光源出发向四面八方发射数百万条光线。其中大部分光线会撞到墙角、地板或天花板，经过多次反弹后能量耗尽，永远无法进入你的瞳孔。对于计算机来说，计算这些光线完全是浪费资源。  

而从相机出发我们只需要处理那些“注定”会影响屏幕像素的光线。每一条从相机射出的射线，只要撞击到物体，就必然对应着屏幕上的一个点。

### 2. 光线是怎么从相机打出去的
我们先定义我们使用的坐标系，我们使用的坐标系是这样的：  
我们以标准坐姿面向显示器正面，原点位于你显示器正中心，z轴垂直于显示器向外（也就是指向你），y轴与你显示器垂直方向平行向上，x轴与显示器水平方向平行向右。  

我们可以在抽象空间中定义一个点表示我们的相机的位置，我们假设相机的向上方向永远是与y轴正方向一致，并且位于(1,0,0)看向原点，视口是我们最终渲染的图片，或者说是我们的屏幕。  
 
我们还需要了解屏幕空间和像素空间  
- 屏幕空间是一个2维空间，定义原点在左上角，x轴向右，y轴向下。假设你的屏幕的宽度是1920，高度是1080，那么屏幕空间就是(0,0)到(1920,1080)。  
- 像素空间是离散的网格系统  
像素空间与屏幕空间的映射关系是：像素空间中的点$(x,y)$对应屏幕空间中的点$(x+0.5,y+0.5)$，屏幕空间中的点$(x,y)$对应像素空间中的点$(\left \lfloor x\right \rfloor ,\left \lfloor y\right \rfloor )$
我们在抽象空间中从相机点出发与像素空间中的点进行连线，这就构成了一个射线或者称作向量，我们遍历像素空间中所有的点即可渲染出我们所需的可视图了

### 3. 光线怎么知道与物体作用了
我们需要定义光线的方程，然后通过解析的方式判断这个方程在某些几何体表面上是否有解，如果有解则说明相交了，回想一下我们怎么计算两个直线的交点你就明白了

### 4. 光线与物体作用了之后怎么弹射
我们需要定义物体的材质，材质决定了光线在这个物体作用后怎么弹射

### 5. 光线怎么知道打到了光源
我们让光线在场景中不断的弹射，再定义哪些物体是光源，每次光线与改物体相交之后询问一下你是光源吗

### 6. 怎么让渲染的结果与真实物理世界一致  
我们需要使用物理的方式去渲染一张图，而不是随便定义



在开始实现其他的代码之前我们提供一个Vec3向量运算头文件给你

```cpp
#pragma once

#include <cmath>
#include <cstddef>

#include <array>
#include <iostream>

class Vec3 {
public:
    constexpr Vec3() noexcept = default;

    constexpr Vec3(double x, double y, double z) noexcept
        : elements_{x, y, z}
    {}

    [[nodiscard]] constexpr double x() const noexcept
    {
        return elements_[0];
    }

    [[nodiscard]] constexpr double y() const noexcept
    {
        return elements_[1];
    }

    [[nodiscard]] constexpr double z() const noexcept
    {
        return elements_[2];
    }

    [[nodiscard]] constexpr Vec3 operator-() const noexcept
    {
        return Vec3{-elements_[0], -elements_[1], -elements_[2]};
    }

    [[nodiscard]] constexpr double operator[](std::size_t index) const noexcept
    {
        return elements_[index];
    }

    constexpr double& operator[](std::size_t index) noexcept
    {
        return elements_[index];
    }

    constexpr Vec3& operator+=(const Vec3& other) noexcept
    {
        elements_[0] += other.elements_[0];
        elements_[1] += other.elements_[1];
        elements_[2] += other.elements_[2];
        return *this;
    }

    constexpr Vec3& operator*=(double scalar) noexcept
    {
        elements_[0] *= scalar;
        elements_[1] *= scalar;
        elements_[2] *= scalar;
        return *this;
    }

    constexpr Vec3& operator/=(double scalar) noexcept
    {
        return *this *= 1.0 / scalar;
    }

    [[nodiscard]] double length() const noexcept
    {
        return std::sqrt(lengthSquared());
    }

    [[nodiscard]] constexpr double lengthSquared() const noexcept
    {
        return elements_[0] * elements_[0] + elements_[1] * elements_[1] + elements_[2] * elements_[2];
    }

    [[nodiscard]] bool nearZero() const noexcept
    {
        constexpr auto threshold = 1e-8;
        return std::abs(elements_[0]) < threshold && std::abs(elements_[1]) < threshold &&
               std::abs(elements_[2]) < threshold;
    }

private:
    std::array<double, 3> elements_{};
};

inline std::ostream& operator<<(std::ostream& out, const Vec3& v)
{
    return out << v.x() << ' ' << v.y() << ' ' << v.z();
}

[[nodiscard]] constexpr Vec3 operator+(const Vec3& lhs, const Vec3& rhs) noexcept
{
    return Vec3{lhs.x() + rhs.x(), lhs.y() + rhs.y(), lhs.z() + rhs.z()};
}

[[nodiscard]] constexpr Vec3 operator-(const Vec3& lhs, const Vec3& rhs) noexcept
{
    return Vec3{lhs.x() - rhs.x(), lhs.y() - rhs.y(), lhs.z() - rhs.z()};
}

[[nodiscard]] constexpr Vec3 operator*(const Vec3& lhs, const Vec3& rhs) noexcept
{
    return Vec3{lhs.x() * rhs.x(), lhs.y() * rhs.y(), lhs.z() * rhs.z()};
}

[[nodiscard]] constexpr Vec3 operator*(double scalar, const Vec3& v) noexcept
{
    return Vec3{scalar * v.x(), scalar * v.y(), scalar * v.z()};
}

[[nodiscard]] constexpr Vec3 operator*(const Vec3& v, double scalar) noexcept
{
    return scalar * v;
}

[[nodiscard]] constexpr Vec3 operator/(const Vec3& v, double scalar) noexcept
{
    return (1.0 / scalar) * v;
}

[[nodiscard]] constexpr double dot(const Vec3& lhs, const Vec3& rhs) noexcept
{
    return lhs.x() * rhs.x() + lhs.y() * rhs.y() + lhs.z() * rhs.z();
}

[[nodiscard]] constexpr Vec3 cross(const Vec3& lhs, const Vec3& rhs) noexcept
{
    return Vec3{
        lhs.y() * rhs.z() - lhs.z() * rhs.y(),
        lhs.z() * rhs.x() - lhs.x() * rhs.z(),
        lhs.x() * rhs.y() - lhs.y() * rhs.x(),
    };
}

[[nodiscard]] inline Vec3 unitVector(const Vec3& v)
{
    return v / v.length();
}

```


## 光线
我们先定义一下光线，光线在图形学中我们定义为：
$$\mathbf{r}(t) = \mathbf{o} + t\mathbf{d} \quad 0\le t < \infty$$
其中
- $\mathbf{o}$ 表示光线的起点
- $\mathbf{d}$ 表示光线的方向是一个单位向量，后续只要提到方向都是单位向量
- $t$  表示光线的步进，可以这样想象，我们的光线从点 $\mathbf{o}$ 出发，沿着 $\mathbf{d}$ 方向走过时间 $t$ 到达的位置
所以我们可这写出这样的代码
```cpp
#pragma once
#include "Vec3.h"

class Ray {
public:
    Ray(const Vec3& origin, const Vec3& direction, double t = 0.0)
        : origin_(origin),
          direction_(direction),
          t_(t)
    {}

    Vec3 getOrigin() const
    {
        return origin_;
    }

    Vec3 getDirection() const
    {
        return direction_;
    }

    Vec3 operator()(double t) const
    {
        return origin_ + direction_ * t;
    }

private:
    Vec3 origin_;
    Vec3 direction_;
    double t_;
};
```

## 相机
我们再定义一下相机，相机定义了我们以什么角度什么位置看向场景，所以它应该有以下属性
- Position 相机的位置
- Traget 相机看向哪个位置
- Up 相机的向上方向，就像我们让一个向量从我们的大脑中心指向我们头顶的最高点一样，这个方向决定了相机的是怎么以z为轴旋转的（翻滚角），就像你用手机拍照可以竖着拍，也可以横着拍
- Vertical Fov 垂直可视范围，定义了我们在垂直方向上能看到多少内容，就像我们的眼睛一样，我们看到的东西的范围是有限的，我们没办法看到我们头顶上的东西   

除此之外我们还需要存放图片信息
- Image Width 像素空间的宽度
- Image Height 像素空间的高度
- Aspect Ratio 宽高比，保留计算结果，后续多次使用
- Frame Buffer 像素空间，存放我们渲染的结果  

除此之外我们还需要预计算图片上的像素是怎么偏移的，这个偏移值不一定是1，因为我们的fov会影响图片的偏移量，为什么会被多次使用？因为我们上面提到过，我们会遍历像素空间多次获取光线
- Pixel Left Top 左上角第一个像素(0,0)的中心点空间坐标，保留计算结果，后续多次使用
- Pixel DeltaU 水平方向移动一个像素的向量差，保留计算结果，后续多次使用
- Pixel DeltaV 垂直方向移动一个像素的向量差，保留计算结果，后续多次使用

我们需要从相机中发射出一条光线所以它应该需要一个获得光线的方法   
获取光线很简单，获取一个像素点的位置，用像素点的位置减去相机原点位置就得到了一根光线。  
所以最重要的问题是怎么获取一个像素点的位置 
我们需要通过相机的除了我们需要计算的属性计算出 Pixel Left Top 、Pixel DeltaU 、Pixel DeltaV  

vertical_fov_ 的定义：一个平面与经过了相机点，并且垂直于视口，这个平面会与视口平面相交，交线与相机点会形成一个三角形，在这个三角形中相机点这个这个顶点的角度就是Vertical Fov  
我们假设我们的相机的焦距（相机与视口之间的距离）始终是1。 
下面的图片解释了如何计算
![](images/cg/re0pt/1.jpg)

使用代码实现
```cpp
void initCamera()
{
    Vec3 forward = unitVector(target_ - position_);
    Vec3 right = unitVector(cross(forward, up_));
    Vec3 camera_up = unitVector(cross(right, forward));

    double theta = vertical_fov_ * 3.141592653589793 / 180.0;
    double viewport_height = 2.0 * std::tan(theta / 2.0);
    double viewport_width = aspect_ratio_ * viewport_height;

    Vec3 viewport_u = right * viewport_width;
    Vec3 viewport_v = camera_up * (-viewport_height);

    pixel_delta_u_ = viewport_u / image_width_;
    pixel_delta_v_ = viewport_v / image_height_;

    Vec3 viewport_left_top_ = position_ + forward - (viewport_u / 2.0) - (viewport_v / 2.0);

    pixel_left_top_ = viewport_left_top_ + 0.5 * (pixel_delta_u_ + pixel_delta_v_);
}
```
现在我们能够获取像素空间中任意像素的位置了，通过pixel_left_top_，pixel_delta_u_和pixel_delta_v_
```cpp
Ray getRay(int i, int j) const
{
    Vec3 pixel_center = pixel_left_top_ + (i * pixel_delta_u_) + (j * pixel_delta_v_);
    Vec3 ray_direction = unitVector(pixel_center - position_);
    return Ray{position_, ray_direction};
}
```
最终我们的相机长这样
```cpp
#pragma once
#include "Ray.h"
#include "Vec3.h"

#include <cmath>

#include <vector>

class Camera {
public:
    Camera(int image_width, int image_height)
        : position_(Vec3(278, 273, -800)),
          target_(Vec3(0, 0, 0)),
          up_(Vec3(0, 1, 0)),
          vertical_fov_(90),
          image_width_(image_width),
          image_height_(image_height),
          aspect_ratio_(static_cast<double>(image_width) / image_height),
          frame_buffer_(image_width * image_height)
    {
        initCamera();
    }

    int getImageWidth() const
    {
        return image_width_;
    }

    int getImageHeight() const
    {
        return image_height_;
    }

    std::vector<Vec3>& getFrameBuffer()
    {
        return frame_buffer_;
    }

    const std::vector<Vec3>& getFrameBuffer() const
    {
        return frame_buffer_;
    }

    Ray getRay(int i, int j) const
    {
        Vec3 pixel_center = pixel_left_top_ + (i * pixel_delta_u_) + (j * pixel_delta_v_);
        Vec3 ray_direction = unitVector(pixel_center - position_);
        return Ray{position_, ray_direction};
    }

private:
    Vec3 position_;
    Vec3 target_;
    Vec3 up_;
    double vertical_fov_;
    int image_width_;
    int image_height_;
    double aspect_ratio_;
    std::vector<Vec3> frame_buffer_;

    Vec3 pixel_left_top_;
    Vec3 pixel_delta_u_;
    Vec3 pixel_delta_v_;

    void initCamera()
    {
        Vec3 forward = unitVector(target_ - position_);
        Vec3 right = unitVector(cross(forward, up_));
        Vec3 camera_up = unitVector(cross(right, forward));

        double theta = vertical_fov_ * 3.141592653589793 / 180.0;
        double viewport_height = 2.0 * std::tan(theta / 2.0);
        double viewport_width = aspect_ratio_ * viewport_height;

        Vec3 viewport_u = right * viewport_width;
        Vec3 viewport_v = camera_up * (-viewport_height);

        pixel_delta_u_ = viewport_u / image_width_;
        pixel_delta_v_ = viewport_v / image_height_;

        Vec3 viewport_left_top_ = position_ + forward - (viewport_u / 2.0) - (viewport_v / 2.0);

        pixel_left_top_ = viewport_left_top_ + 0.5 * (pixel_delta_u_ + pixel_delta_v_);
    }
};

```
## 光源与物体求交
相机和光线我们解决了，接下来我们解决光线如何与物体作用中的光线如何判断与物体相交
我们首先看看光线如何与球体求交
我们知道光线的方程是
$$\mathbf{r}(t) = \mathbf{o} + t\mathbf{d} \quad 0\le t < \infty$$
球体的方程是
$$\mathbf{p}:(\mathbf{p}-\mathbf{c})^2 -R^2 = 0$$
我们令
$$\mathbf{r}(t) =\mathbf{p}$$
有
$$(\mathbf{o} + t\mathbf{d}-\mathbf{c})^2 -R^2 = 0$$
方程中 $\mathbf{o}$ 、$\mathbf{d}$、$\mathbf{c}$都是向量和$R$是已知的，展开我们得到
$$\mathbf{d}\cdot\mathbf{d}t^2+2(\mathbf{o}-\mathbf{c})\cdot\mathbf{d}t+(\mathbf{o}-\mathbf{c})\cdot(\mathbf{o}-\mathbf{c})-R^2=0$$
可以看到向量之间都变为了点乘运算，最后算出来的是t是一个标量，这也符合这个方程，而且这是一个二次方程，所以我们可以直接使用求根公式
我们令
- $a = \mathbf{d}\cdot\mathbf{d}$
- $b = 2(\mathbf{o}-\mathbf{c})\cdot\mathbf{d}$
- $c = (\mathbf{o}-\mathbf{c})\cdot(\mathbf{o}-\mathbf{c})-R^2$
使用求根公式
$$t = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$我们取 t>0 的就行
使用代码实现，我们首先需要实现一个 Object 基类表示我们所有可以被光线击中的物体，其次我们需要记录我们的交点的信息，比如交点的坐标,是否相交，交点的材质（后续添加）等等
```cpp
#pragma once
#include "Ray.h"
#include "Vec3.h"

#include <optional>

struct InterInfo {
    bool is_Intersected = false;
    Vec3 position;
};

class Object {
    Object() = default;
    virtual ~Object() = default;
    virtual bool intersect(const Ray& ray) const = 0;

    virtual InterInfo getInterInfo(const Ray& ray) const = 0;

protected:
    InterInfo inter_info_;
};
```
我们再实现一个Sphere子类，通过我们上面的公式可以实现
```cpp
#include "Object.h"

class Sphere final : public Object {
public:
    Sphere(const Vec3& center, double radius)
        : center_(center),
          radius_(radius)
    {}

    ~Sphere() noexcept override = default;

    // 使用 b^2 - 4ac > 0 来判断是否有实根，如果有实根则说明与球相交
    bool intersect(const Ray& ray) const override
    {
        Vec3 oc = ray.getOrigin() - center_;
        double a = dot(ray.getDirection(), ray.getDirection());
        double b = 2.0 * dot(oc, ray.getDirection());
        double c = dot(oc, oc) - radius_ * radius_;
        double discriminant = b * b - 4 * a * c;
        return discriminant > 0;
    }

    InterInfo getInterInfo(const Ray& ray) const override
    {
        Vec3 oc = ray.getOrigin() - center_;
        double a = dot(ray.getDirection(), ray.getDirection());
        double b = 2.0 * dot(oc, ray.getDirection());
        double c = dot(oc, oc) - radius_ * radius_;
        double discriminant = b * b - 4 * a * c;

        if (discriminant > 0) {
            double sqrt_disc = std::sqrt(discriminant);
            double t1 = (-b - sqrt_disc) / (2.0 * a);
            double t2 = (-b + sqrt_disc) / (2.0 * a);

            double t = (t1 < t2 && t1 > 1e-8) ? t1 : t2; // 选择较小的正根
            if (t > 1e-8) {
                Vec3 hit_position = ray(t);
                return InterInfo{true, hit_position};
            }
        }

        return InterInfo{false, Vec3()};
    }

private:
    Vec3 center_;
    double radius_;
};
```
我们再定义一个场景类，用于存放我们场景中存在的东西
```cpp
#pragma once
#include "Camera.h"
#include "Object.h"
#include "Sphere.h"
#include "Vec3.h"

#include <memory>
#include <vector>

class Scene {

public:
    Scene(Camera camera)
        : camera_(camera)
    {}

    ~Scene() = default;

    void addObject(std::unique_ptr<Object> object)
    {
        objects_.push_back(std::move(object));
    }

    void addSphere(const Vec3& center, double radius)
    {
        addObject(std::make_unique<Sphere>(center, radius));
    }

    void clearObjects()
    {
        objects_.clear();
    }

    Camera& getCamera()
    {
        return camera_;
    }

    const Camera& getCamera() const
    {
        return camera_;
    }

    const std::vector<std::unique_ptr<Object>>& getObjects() const
    {
        return objects_;
    }

private:
    Camera camera_;
    std::vector<std::unique_ptr<Object>> objects_;
};

```
我们再定义一个渲染器用于渲染我们最终的图
```cpp
#include "Camera.h"
#include "Ray.h"
#include "Scene.h"
#pragma once

class Renderer {
public:
    Renderer() = default;
    ~Renderer() = default;

    void render(Camera& camera, const std::vector<std::unique_ptr<Object>>& objects)
    {
        for (int j = 0; j < camera.getImageHeight(); ++j) {
            for (int i = 0; i < camera.getImageWidth(); ++i) {
                Ray ray = camera.getRay(i, j);
                Vec3 pixel_color = traceRay(ray, objects);
                camera.getFrameBuffer()[j * camera.getImageWidth() + i] = pixel_color;
            }
        }
    }

private:
    Vec3 traceRay(const Ray& ray, const std::vector<std::unique_ptr<Object>>& objects)
    {
        for (const auto& object : objects) {
            if (object->intersect(ray)) {
                // 如果击中物体则显示红色
                return Vec3(255.0, 0.0, 0.0);
            }
        }
        // 否则显示黑色
        return Vec3(0.0, 0.0, 0.0);
    }
};
```

最后我们修改mian.cpp
```cpp
#include "Camera.h"
#include "Object.h"
#include "Renderer.h"
#include "Scene.h"
#include "Vec3.h"

#include <filesystem>
#include <fstream>
#include <iostream>
#include <memory>
#include <vector>

void writePPM(const std::filesystem::path& path, int width, int height, const std::vector<Vec3>& data)
{
    std::ofstream ofs(path);

    ofs << "P3\n" << width << " " << height << "\n255\n";

    for (int i = 0; i < width * height; ++i) {
        int r = data[i].x();
        int g = data[i].y();
        int b = data[i].z();

        ofs << r << " " << g << " " << b << "\n";
    }

    ofs.close();
}

int main()
{
    int width = 600;
    int height = 600;
    Camera camera(width, height);

    std::unique_ptr<Object> sphere1 = std::make_unique<Sphere>(Vec3(0, 0, 0), 600);
    Scene scene(camera);
    scene.addObject(std::move(sphere1));

    Renderer renderer;
    renderer.render(scene.getCamera(), scene.getObjects());
    renderer.render(camera, scene.getObjects());

    writePPM("out.ppm", width, height, camera.getFrameBuffer());

    return 0;
}
```
最后我们能渲染出来这个图，跟着代码的思路来有一些C++项目开发经验应该就能懂
![](images/cg/re0pt/image2.png)