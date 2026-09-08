#pragma once
struct Vec2{};
enum class ShapeType{
    Circle,
    Box,
    Polygon
};

enum class BodyType{
    Static,
    Dynamic
};


struct BodyCreateInfo{
    BodyType type;
    ShapeType shape;
    Vec2 position;
};

class Body{};