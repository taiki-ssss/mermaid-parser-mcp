# テストケース

## テストケース1
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
      "members": [
        {
          "name": "age",
          "type": "property",
          "visibility": "public",
          "dataType": "int"
        },
        {
          "name": "gender",
          "type": "property",
          "visibility": "public",
          "dataType": "String"
        },
        {
          "name": "isMammal",
          "type": "method",
          "visibility": "public"
        },
        {
          "name": "mate",
          "type": "method",
          "visibility": "public"
        }
      ]
    },
    {
      "name": "Duck",
      "members": [
        {
          "name": "beakColor",
          "type": "property",
          "visibility": "public",
          "dataType": "String"
        },
        {
          "name": "swim",
          "type": "method",
          "visibility": "public"
        },
        {
          "name": "quack",
          "type": "method",
          "visibility": "public"
        }
      ]
    },
    {
      "name": "Fish",
      "members": [
        {
          "name": "sizeInFeet",
          "type": "property",
          "visibility": "private",
          "dataType": "int"
        },
        {
          "name": "canEat",
          "type": "method",
          "visibility": "private"
        }
      ]
    },
    {
      "name": "Zebra",
      "members": [
        {
          "name": "is_wild",
          "type": "property",
          "visibility": "public",
          "dataType": "bool"
        },
        {
          "name": "run",
          "type": "method",
          "visibility": "public"
        }
      ]
    }
  ],
  "relationships": [
    {
      "from": "Animal",
      "to": "Duck",
      "type": "inheritance"
    },
    {
      "from": "Animal",
      "to": "Fish",
      "type": "inheritance"
    },
    {
      "from": "Animal",
      "to": "Zebra",
      "type": "inheritance"
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
      "members": [
        {
          "name": "owner",
          "type": "property",
          "visibility": "public",
          "dataType": "String"
        },
        {
          "name": "balance",
          "type": "property",
          "visibility": "public",
          "dataType": "Bigdecimal"
        },
        {
          "name": "deposit",
          "type": "method",
          "visibility": "public",
          "parameters": [
            {
              "name": "amount"
            }
          ]
        },
        {
          "name": "withdrawal",
          "type": "method",
          "visibility": "public",
          "parameters": [
            {
              "name": "amount"
            }
          ]
        }
      ]
    }
  ],
  "relationships": []
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
      "members": [
        {
          "name": "owner",
          "type": "property",
          "visibility": "public",
          "dataType": "String"
        },
        {
          "name": "balance",
          "type": "property",
          "visibility": "public",
          "dataType": "BigDecimal"
        },
        {
          "name": "deposit",
          "type": "method",
          "visibility": "public",
          "parameters": [
            {
              "name": "amount"
            }
          ]
        },
        {
          "name": "withdrawal",
          "type": "method",
          "visibility": "public",
          "parameters": [
            {
              "name": "amount"
            }
          ]
        }
      ]
    }
  ],
  "relationships": []
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
      "members": [
        {
          "name": "owner",
          "type": "property",
          "visibility": "public",
          "dataType": "String"
        },
        {
          "name": "balance",
          "type": "property",
          "visibility": "public",
          "dataType": "BigDecimal"
        },
        {
          "name": "deposit",
          "type": "method",
          "visibility": "public",
          "parameters": [
            {
              "name": "amount"
            }
          ],
          "returnType": "bool"
        },
        {
          "name": "withdrawal",
          "type": "method",
          "visibility": "public",
          "parameters": [
            {
              "name": "amount"
            }
          ],
          "returnType": "int"
        }
      ]
    }
  ],
  "relationships": []
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
      "members": [
        {
          "name": "id",
          "type": "property",
          "visibility": "public",
          "dataType": "int"
        },
        {
          "name": "position",
          "type": "property",
          "visibility": "public",
          "dataType": "List<int>"
        },
        {
          "name": "setPoints",
          "type": "method",
          "visibility": "public",
          "parameters": [
            {
              "name": "points",
              "type": "List<int>"
            }
          ]
        },
        {
          "name": "getPoints",
          "type": "method",
          "visibility": "public",
          "returnType": "List<int>"
        },
        {
          "name": "messages",
          "type": "property",
          "visibility": "private",
          "dataType": "List<string>"
        },
        {
          "name": "setMessages",
          "type": "method",
          "visibility": "public",
          "parameters": [
            {
              "name": "messages",
              "type": "List<string>"
            }
          ]
        },
        {
          "name": "getMessages",
          "type": "method",
          "visibility": "public",
          "returnType": "List<string>"
        },
        {
          "name": "getDistanceMatrix",
          "type": "method",
          "visibility": "public",
          "returnType": "List<List<int>>"
        }
      ],
      "genericType": "Shape"
    }
  ],
  "relationships": []
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
      "name": "Triangle",
      "members": []
    },
    {
      "name": "Rectangle",
      "members": [
        {
          "name": "width",
          "type": "property",
          "visibility": "public",
          "dataType": "double"
        },
        {
          "name": "height",
          "type": "property",
          "visibility": "public",
          "dataType": "double"
        }
      ]
    }
  ],
  "relationships": [],
  "namespaces": [
    {
      "name": "BaseShapes",
      "classes": [
        "Triangle",
        "Rectangle"
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
      "annotations": [
        "interface"
      ],
      "members": [
        {
          "name": "noOfVertices",
          "type": "property",
          "visibility": "public"
        },
        {
          "name": "draw",
          "type": "method",
          "visibility": "public"
        }
      ]
    },
    {
      "name": "Color",
      "annotations": [
        "enumeration"
      ],
      "members": [
        {
          "name": "RED",
          "type": "property",
          "visibility": "public"
        },
        {
          "name": "BLUE",
          "type": "property",
          "visibility": "public"
        },
        {
          "name": "GREEN",
          "type": "property",
          "visibility": "public"
        },
        {
          "name": "WHITE",
          "type": "property",
          "visibility": "public"
        },
        {
          "name": "BLACK",
          "type": "property",
          "visibility": "public"
        }
      ]
    }
  ],
  "relationships": []
}
```