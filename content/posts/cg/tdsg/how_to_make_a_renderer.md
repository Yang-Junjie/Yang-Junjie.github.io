---
date : '2026-06-28T17:31:24+08:00'
draft : true
title : '【TDSG | 番外】如何构建一个简单的渲染器'
tags:
  - graphics

categories:
  - blog

math: true
---
# 前言
在学习完 TDSG 的 阶段0、1、2 后你应该对基本的图形学概念/技术有一定了解了，在这个番外篇中我们将会手把手教你如何搭建一个简单的基于 Whitted-Style Ray Tracing 的渲染器，看完这个番外篇之后你会对渲染器的基本架构有基本的了解，你可以将此作为 阶段3 的参考

在这个教程中我们不会使用
- OpenGL,Vulkan 等图形API
- 引擎框架

我们会使用
- PPM 文件作为渲染输出
- C++ 编写

这个渲染器的架构只是基于我自己的理解，不保证是一定最好的，但是应该是适用于初学者的。如果你对软件架构不熟悉，请不要担心，因为我们将不会设计到各种复杂的设计模式，复杂的软件构建思想，你只需要会最基本的 OOP, C++ with class 就行了，我们这个 Demo 为了让大家更好理解，不一定是最好最安全的。

# 架构
在设计任何一个软件之前，我们通常需要思考这个软件有哪些功能，有哪些模块，有哪些抽象组成，简单说就是你得知道这个软件应该有哪些元素。

> Tips : 对于复杂软件来说通常我们还会设计 元素/模块/组件 之间的关系，但是对于我们初学来说暂时不考虑

比如我们要构建一个光线追踪渲染器，而渲染器这个软件的主要元素有
- Renderer
- Entity
   - Object
      - Mesh
      - ...
      - Material
   - Light
       - Directional Light
       - Point Light
       - ...
- Scene
- Camera

是的对于通用的渲染器来说，上面这个结构基本就够用了，但是抱着 如无必要，勿增实体 的理念我们需要对其简化
- Renderer
- Ray
- Object
   - Sphere
   - ...
- Material
- Scene
- Camera

## 各个部分的职责
### Renderer
Renderer 的定义在我来看是将虚拟场景（连续的三维抽象空间）中的数据映射到离散的屏幕空间（像素矩阵）上。  
更具体的来说就是将场景中的数据如物体对象，光照，材质等转换为像素，以及使用什么着色模型，什么渲染算法

### Ray
Ray 是对光线的抽象，本质是一个向量

### Object
Object 就是场景中的物体的抽象，通常由 Geometry 和 Material 组成，Geometry 可以是隐式表面，也可以是显式表面

### Material
Material 定义了物体的材质，比如材质参数有反射率，折射率，镜面反射率等等

### Scene
Scene 里面包含着所有的 Object 和 Light

### Camera
Camera 定义了场景的观测点，以及观测方向和观测范围，在 Ray Tracing 中 Camera 还担任着获取 Camera Ray 的角色

当然在通用渲染器中这些元素的职责可能与这里不一样

# 开始
## 框架
如果你对如何创建一个标准的基于 CMake 的 C++ 项目完全不明不的话，可以使用 TDSG 提供的[模板项目](https://github.com/TDS-Graphics/whitted-ray-tracing-demo/tree/framework)，这个模板可以作为你这个项目的起点

这个模板项目自带了一个我们需要使用的最基本的 Vec3 数学头文件，这样我们可以更加专注于编写核心代码（当然如果你拥有 C++ 项目管理能力的话可以选择自己熟悉的方式不必采用我们这个框架）

## PPM 
首先我们需要将渲染得到的像素输出到一个能被我们看到的载体上，这个载体可以是窗口、图片等，这里我们使用 PPM 图片格式（因为这对初学者来说最友好）。
因此我们需要一个类专门用于处理 PPM 文件的行为，由于我们几乎只需要写入 PPM 文件，不需要读取，所以这个类的职责就是写入 PPM 文件，这个类名我们叫做 `PPMWriter`  

很显然一个图片是有**长度高度**的，并且这个文件是**有名字的**，所以这个类应该包含这些属性，并且我们应该能够设置这些属性，并且还有一个最关键的行为就是**将像素数组数据写入到 PPM 文件中**的这个行为，所以我们就可以写出如下头文件
```cpp
#pragma once
#include "math/vec3.h"

#include <string>
#include <vector>

class PPMWriter {
public:
    PPMWriter(const std::string& fileName, unsigned int width, unsigned int height);
    ~PPMWriter();

    // data component should be in the range [0, 255]
    void save(const std::vector<Vec3>& data);

    void setFileName(const std::string& fileName);
    void setImageSize(unsigned int width, unsigned int height);

private:
    unsigned int m_image_width = 0;
    unsigned int m_image_height = 0;
    std::string m_file_name;
};
```
其中最关键的 `void save(const std::vector<Vec3>& data);`的实现如下
```cpp
void PPMWriter::save(const std::vector<Vec3>& data)
{
    if (data.size() != static_cast<std::size_t>(m_image_width * m_image_height)) {
        std::cerr << "Warning: data size doesn't match image dimensions" << std::endl;
        return;
    }

    std::ofstream ofs(m_file_name.c_str(), std::ios::binary);

    if (!ofs.is_open()) {
        std::cerr << "Failed to open file: " << m_file_name << std::endl;
        return;
    }

    ofs << "P6\n" << m_image_width << " " << m_image_height << "\n255\n";

    for (std::size_t i = 0; i < data.size(); ++i) {
        unsigned char r = clamp(data[i].x(),0.0f,255.0f);
        unsigned char g = clamp(data[i].y(),0.0f,255.0f);
        unsigned char b = clamp(data[i].z(),0.0f,255.0f);

        ofs.write((const char*) (&r), 1);
        ofs.write((const char*) (&g), 1);
        ofs.write((const char*) (&b), 1);
    }

    ofs.close();
    std::cout << "Saved image to: " << m_file_name << std::endl;
}  
```

好了现在我们可以写一个简单的代码测试一下这个类了
```cpp
// main.cpp
#include "math/vec3.h"
#include "ppm_writer.h"
#include <vector>

int main()
{
    const unsigned int image_width = 800;
    const unsigned int image_height = 800;
    std::vector<Vec3> frame_buffer(image_height * image_width, {0.0f, 0.0f, 0.0f});

    for (unsigned int j = 0; j < image_height; ++j) {
        for (unsigned int i = 0; i < image_width; ++i) {
            const float u = float(i) / float(image_width) * 255.0f;
            const float v = float(j) / float(image_height) * 255.0f;
            const Vec3 color(u, v, 0.0f);
            frame_buffer[j * image_width + i] = color;
        }
    }

    PPMWriter writer("output1.ppm", image_width, image_height);
    writer.save(frame_buffer);

    return 0;
}
```
输出的图片如下
![](images/cg/tdsg/whitted_ray_tracing/output1.png)
## Ray 
第一步就是实现一个 Ray 类，不仅仅是因为我们的 Ray Tracing Renderer 是模拟光线的，而且我们后面的结构都依赖于 Ray 这个结构，在图形学中一个光线通常认为是**一个由起点有方向的单位向量**，以及我们需要知道**这个光线在 t 时刻的位置在哪**，所以我们可以这么实现
```cpp
// ray.h
#pragma once
#include "math/vec3.h"

class Ray {
public:
    Ray(const Vec3& origin, const Vec3& direction)
        : m_origin(origin),
          m_direction(direction)
    {}

    Vec3 getOrigin() const
    {
        return m_origin;
    }

    Vec3 getDirection() const
    {
        return m_direction;
    }

    Vec3 at(float t) const
    {
        return m_origin + t * m_direction;
    }

private:
    Vec3 m_origin;
    Vec3 m_direction;
};

```

## Camera
下一步我认为最合适实现的就是 Camera 了，因为在 Ray Tracing 中所有的 Ray 都是从相机出发的，如果没有相机我们将看不到任何东西，没有相机看不到物体，那么物体，材质，场景，他们就没有存在的意义了

Camera 决定了我们渲染图的尺寸，以及我们还需要知道相机的 position ,target, up
camera 类应该包含这些属性，并且我们应该能够设置这些属性，并且有一个最关键行为就是**获取 Camera Ray**，所以我们就可以写出如下头文件
```cpp
#pragma once

#include "math/vec3.h"
#include "ray.h"

class Camera {
public:
    Camera(unsigned int viewport_width, unsigned int viewport_height);
    ~Camera() = default;

    Ray getRay(float i, float j) const;

    void setPosition(const Vec3& position);
    void setTarget(const Vec3& target);
    void setUp(const Vec3& up);

private:
    Vec3 m_position;
    Vec3 m_target;
    Vec3 m_up;

    unsigned int m_viewport_width;
    unsigned int m_viewport_height;
};
```
其中最关键的 `Vec3 getRay(float i, float j) const;`的实现如下
```cpp
Ray Camera::getRay(float i, float j) const
{
    // The computed results can be cached for optimization.
    Vec3 forward = unitVector(m_target - m_position);
    Vec3 right = unitVector(cross(forward, m_up));
    Vec3 up = unitVector(cross(right, forward));

    float aspect = (float) m_viewport_width / m_viewport_height;
    float viewport_height = 2.0f;
    float viewport_width = aspect * viewport_height;

    Vec3 horizontal = viewport_width * right;
    Vec3 vertical = viewport_height * -up;

    Vec3 pixel_delta_u = horizontal / (float) m_viewport_width;
    Vec3 pixel_delta_v = vertical / (float) m_viewport_height;

    Vec3 viewport_left_top = m_position + forward - horizontal / 2.0f - vertical / 2.0f;
    Vec3 pixel_left_top = viewport_left_top + 0.5f * (pixel_delta_u + pixel_delta_v);

    Vec3 pixel_center = pixel_left_top + pixel_delta_u * i + pixel_delta_v * j;
    Vec3 ray_direction = pixel_center - m_position;

    Ray ray{m_position, ray_direction};

    return ray;
}
```
### object
下一步实现的应该是 object , 没有 object scene 中将什么都不能存放，object 应该是一个抽象类，它将派生出 sphere, plane, triangle 等。学过阶段 2 后我们知道我们需要知道一个 Ray 什么时候与 Object 相交，以及相交时的信息如法线、相交点等等
```cpp
#pragma once
#include "math/vec3.h"
#include "ray.h"

struct HitRecord {
    bool is_hit{false};
    float t{0};
    Vec3 p{0.0f, 0.0f, 0.0f};
    Vec3 normal{0.0f, 0.0f, 0.0f};
};

class Object {
public:
    Object() = default;
    virtual ~Object() = default;
    virtual HitRecord hit(const Ray& ray) const = 0;
};

```

### Sphere
有了 Object 后我们就可以给它实现一个具体的类了，我们实现一个最简单的 Sphere，根据 阶段 2 的光线与球体相交的公式我们可以写出如下代码
```cpp
#pragma once

#include "object.h"
#include "ray.h"

class Sphere : public Object {
public:
    Sphere(const Vec3& center, float radius)
        : m_center(center),
          m_radius(radius)
    {}

    virtual ~Sphere() = default;

    virtual HitRecord hit(const Ray& ray) const override
    {
        Vec3 oc = ray.getOrigin() - m_center;
        float a = dot(ray.getDirection(), ray.getDirection());
        float b = 2.0 * dot(oc, ray.getDirection());
        float c = dot(oc, oc) - m_radius * m_radius;
        float discriminant = b * b - 4 * a * c;

        if (discriminant > 0) {
            float sqrt_disc = std::sqrt(discriminant);
            float t1 = (-b - sqrt_disc) / (2.0 * a);
            float t2 = (-b + sqrt_disc) / (2.0 * a);

            float t = t1 < t2 ? t1 : t2;
            if (t > 1e-8) {
                Vec3 hit_position = ray.at(t);
                return HitRecord{true, t, hit_position, ray.getDirection()};
            }
        }
        return HitRecord{false};
    }

private:
    Vec3 m_center;
    float m_radius;
};

```
### Scene
下一步就是来实现 Scene 类，这个类将保存所有的 Object，以及 Camera。相当于我们物体的数据库，所有的实体都保存在这，虽然在现实世界中 Ray 也算实体，但是我们的代码是一定不能按照现实世界的逻辑来写的
```cpp
#pragma once

#include "camera.h"
#include "object.h"
#include "sphere.h"
#include <vector>

class Scene {
public:
    Scene(const Camera& camera)
        : m_camera(camera)
    {}

    ~Scene(){
        for (auto object : m_objects)
            delete object;
    }

    Scene(const Scene&) = delete;
    Scene& operator=(const Scene&) = delete;

    void addObject(Object* object)
    {
        m_objects.push_back(object);
    }

    void addSphere(const Vec3& center, float radius)
    {
        m_objects.push_back(new Sphere(center, radius));
    }

    std::vector<Object*> getObjects() const
    {
        return m_objects;
    }

private:
    std::vector<Object*> m_objects;
    Camera m_camera;
};
```


