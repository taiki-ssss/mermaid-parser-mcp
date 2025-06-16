# テストケース

## ケース1
入力：

```
---
title: Animal example
---
classDiagram
    note "From Duck till Zebra"
    Animal <|-- Duck
    note for Duck "can fly\ncan swim\ncan dive\ncan help in debugging"
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    Animal: +mate()
    class Duck{
        +String beakColor
        +swim()
        +quack()
    }
    class Fish{
        -int sizeInFeet
        -canEat()
    }
    class Zebra{
        +bool is_wild
        +run()
    }
```

出力：

```json
{
    "classes": [
        {
            "name": "Animal",
            "attributes": [
                {
                    "visibility": "public",
                    "type": "int",
                    "name": "age"
                },
                {
                    "visibility": "public",
                    "type": "String",
                    "name": "gender"
                }
            ],
            "methods": [
                {
                    "visibility": "public",
                    "name": "isMammal",
                },
                {
                    "visibility": "public",
                    "name": "mate",
                },
            ]
        },
        {
            "name": "Duck",
            "attributes": [
                {
                    "visibility": "public",
                    "type": "String",
                    "name": "breakColor"
                }
            ],
            "methods": [
                {
                    "visibility": "public",
                    "name": "swim",
                },
                {
                    "visibility": "public",
                    "name": "quack",
                }
            ],
            "relation": {
                "from": "Duck",
                "to": "Animal",
                "relationType": "inheritance"
            }
        },
        {
            "name": "Fish",
            "attributes": [
                {
                    "visibility": "private",
                    "type": "int",
                    "name": "sizeInFeet"
                }
            ],
            "methods": [
                {
                    "visibility": "private",
                    "name": "canEat",
                }
            ],
            "relation": {
                "from": "Fish",
                "to": "Animal",
                "relationType": "inheritance"
            }
        },
        {
            "name": "Zebra",
            "genericType": "",
            "attributes": [
                {
                    "visibility": "public",
                    "type": "bool",
                    "name": "is_wild"
                }
            ],
            "methods": [
                {
                    "visibility": "public",
                    "name": "run",
                }
            ],
            "relation": {
                "from": "Zebra",
                "to": "Animal",
                "relationType": "inheritance"
            }
        }
    ]
}
```

## テストケース2

入力：

```
---
title: Bank example
---
classDiagram
    class BankAccount
    BankAccount : +String owner
    BankAccount : +Bigdecimal balance
    BankAccount : +deposit(amount)
    BankAccount : +withdrawal(amount)
```

出力：

```json
{
    "classes": [
        {
            "name": "BankAccount",
            "attributes": [
                {
                    "visibility": "public",
                    "type": "String",
                    "name": "owner"
                },
                {
                    "visibility": "public",
                    "type": "Bigdecimal",
                    "name": "balance"
                }
            ],
            "methods": [
                {
                    "visibility": "public",
                    "name": "deposit",
                    "parameters": [
                        {
                            "name": "amount"
                        }
                    ]
                },
                {
                    "visibility": "public",
                    "name": "withdrawal",
                    "parameters": [
                        {
                            "name": "amount"
                        }
                    ]
                }
            ]
        }
    ]
}
```


## テストケース3

入力：

```
classDiagram
class BankAccount{
    +String owner
    +BigDecimal balance
    +deposit(amount)
    +withdrawal(amount)
}
```

出力：

```json
{
    "classes": [
        {
            "name": "BankAccount",
            "attributes": [
                {
                    "visibility": "public",
                    "type": "String",
                    "name": "owner"
                },
                {
                    "visibility": "public",
                    "type": "Bigdecimal",
                    "name": "balance"
                }
            ],
            "methods": [
                {
                    "visibility": "public",
                    "name": "deposit",
                    "parameters": [
                        {
                            "name": "amount"
                        }
                    ]
                },
                {
                    "visibility": "public",
                    "name": "withdrawal",
                    "parameters": [
                        {
                            "name": "amount"
                        }
                    ]
                }
            ]
        }
    ]
}
```

## テストケース4

入力：

```
classDiagram
class BankAccount{
    +String owner
    +BigDecimal balance
    +deposit(amount) bool
    +withdrawal(amount) int
}
```

出力：

```json
{
    "classes": [
        {
            "name": "BankAccount",
            "attributes": [
                {
                    "visibility": "public",
                    "type": "String",
                    "name": "owner"
                },
                {
                    "visibility": "public",
                    "type": "Bigdecimal",
                    "name": "balance"
                }
            ],
            "methods": [
                {
                    "visibility": "public",
                    "name": "deposit",
                    "parameters": [
                        {
                            "name": "amount"
                        }
                    ],
                    "returnType": "bool"
                },
                {
                    "visibility": "public",
                    "name": "withdrawal",
                    "parameters": [
                        {
                            "name": "amount"
                        }
                    ],
                    "returnType": "int"
                }
            ]
        }
    ]
}
```

## テストケース5


入力：

```
classDiagram
class Square~Shape~{
    int id
    List~int~ position
    setPoints(List~int~ points)
    getPoints() List~int~
}

Square : -List~string~ messages
Square : +setMessages(List~string~ messages)
Square : +getMessages() List~string~
Square : +getDistanceMatrix() List~List~int~~
```

出力：

```json
{
     "classes": [
        {
            "name": "Square",
            "genericType": "Shape",
            "attributes": [
                {
                    "type": "int",
                    "name": "id"
                },
                {
                    "type": "List<int>",
                    "name": "position"
                },
                {
                    "visibility": "private",
                    "type": "List<string>",
                    "name": "messages"
                }
            ],
            "methods": [
                {
                    "name": "setPoints",
                    "parameters": [
                        {
                            "type": "List<int>",
                            "name": "points"
                        }
                    ]
                },
                {
                    "name": "getPoints",
                    "parameters": [],
                    "returnType": "List<int>"
                },
                {
                    "visibility": "public",
                    "name": "setMessages",
                    "parameters": [
                        {
                            "type": "List<string>",
                            "name": "messages"
                        }
                    ]
                },
                {
                    "visibility": "public",
                    "name": "getMessages",
                    "returnType": "List<string>"
                },
                {
                    "visibility": "public",
                    "name": "getDistanceMatrix",
                    "returnType": "List<List<int>>"
                }
            ]
        }
     ]
}
```

## テストケース6

入力：

```
classDiagram
namespace BaseShapes {
    class Triangle
    class Rectangle {
      double width
      double height
    }
}
```

出力：

```json
{
    "classes": [
        {
            "namespace": "BaseShapes",
            "name": "Triangle"
        },
        {
            "namespace": "BaseShapes",
            "name": "Rectangle",
            "attributes": [
                {
                    "type": "double",
                    "name": "width"
                },
                {
                    "type": "double",
                    "name": "height"
                }
            ]
        }
    ]
}
```

### テストケース7

入力：

```
classDiagram
class Shape{
    <<interface>>
    noOfVertices
    draw()
}
class Color{
    <<enumeration>>
    RED
    BLUE
    GREEN
    WHITE
    BLACK
}
```

出力：

```json
{
    "classes": [
        {
            "name": "Shape",
            "annotation": "interface",
            "attributes": [
                {
                    "name": "noOfVertices"
                }
            ],
            "methods": [
                {
                    "name": "draw"
                }
            ]
        },
        {
            "name": "Color",
            "annotation": "enumeration",
            "attributes": [
                {
                    "name": "RED"
                },
                {
                    "name": "BLUE"
                },
                {
                    "name": "GREEN"
                },
                {
                    "name": "WHITE"
                },
                {
                    "name": "BLACK"
                }
            ]
        }
    ]
}
```