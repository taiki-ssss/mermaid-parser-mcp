# テストケース

## テストケース1

入力：

```
---
title: Order example
---
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses
```

出力：

```json
{
    "entities": [
        {
            "name": "CUSTOMER"
        },
        {
            "name": "ORDER"
        },
        {
            "name": "LINE-ITEM"
        },
        {
            "name" :"DELIVERY-ADDRESS"
        }
    ],
    "relationships": [
        {
            "from": "CUSTOMER",
            "to": "ORDER",
            "left": "exactly one",
            "right": "zero or more"
        },
        {
            "from": "ORDER",
            "to": "LINE-ITEM",
            "left": "exactly one",
            "right": "one or more"
        },
        {
            "from": "CUSTOMER",
            "to": "DELIVERY-ADDRESS",
            "left": "one or more",
            "right": "one or more"
        }
    ]
}
```

## テストケース2

入力：

```
erDiagram
    CUSTOMER ||--o{ ORDER : places
    CUSTOMER {
        string name
        string custNumber
        string sector
    }
    ORDER ||--|{ LINE-ITEM : contains
    ORDER {
        int orderNumber
        string deliveryAddress
    }
    LINE-ITEM {
        string productCode
        int quantity
        float pricePerUnit
    }
```

出力：

```json
{
  "entities": [
    {
      "name": "CUSTOMER",
      "members": [
        {
          "name": "name",
          "dataType": "string"
        },
        {
          "name": "custNumber",
          "dataType": "string"
        },
        {
          "name": "sector",
          "dataType": "string"
        }
      ]
    },
    {
      "name": "ORDER",
      "members": [
        {
          "name": "orderNumber",
          "dataType": "int"
        },
        {
          "name": "deliveryAddress",
          "dataType": "string"
        }
      ]
    },
    {
      "name": "LINE-ITEM",
      "members": [
        {
          "name": "productCode",
          "dataType": "string"
        },
        {
          "name": "quantity",
          "dataType": "int"
        },
        {
          "name": "pricePerUnit",
          "dataType": "float"
        }
      ]
    }
  ],
  "relationships": [
    {
      "from": "CUSTOMER",
      "to": "ORDER",
      "type": "ONE_TO_MANY",
      "label": "places",
      "cardinality": {
        "from": "exactly one",
        "to": "zero or more"
      }
    },
    {
      "from": "ORDER",
      "to": "LINE-ITEM",
      "type": "ONE_TO_MANY",
      "label": "contains",
      "cardinality": {
        "from": "exactly one",
        "to": "one or more"
      }
    }
  ]
}
```

## テストケース3

入力：

```
erDiagram
    CAR ||--o{ NAMED-DRIVER : allows
    PERSON }o..o{ NAMED-DRIVER : is
```

出力：

```json
{
  "entities": [
    {
      "name": "CAR"
    },
    {
      "name": "NAMED-DRIVER"
    },
    {
      "name": "PERSON"
    }
  ],
  "relationships": [
    {
      "from": "CAR",
      "to": "NAMED-DRIVER",
      "type": "ONE_TO_MANY",
      "label": "allows",
      "cardinality": {
        "from": "exactly one",
        "to": "zero or more"
      }
    },
    {
      "from": "PERSON",
      "to": "NAMED-DRIVER",
      "type": "MANY_TO_MANY",
      "label": "is",
      "cardinality": {
        "from": "zero or more",
        "to": "zero or more"
      }
    }
  ]
}
```

## テストケース4

入力：

```
erDiagram
    CAR 1 to zero or more NAMED-DRIVER : allows
    PERSON many(0) optionally to 0+ NAMED-DRIVER : is
```

出力：

```json
{
  "entities": [
    {
      "name": "CAR"
    },
    {
      "name": "NAMED-DRIVER"
    },
    {
      "name": "PERSON"
    }
  ],
  "relationships": [
    {
      "from": "CAR",
      "to": "NAMED-DRIVER",
      "type": "ONE_TO_ZERO_OR_MANY",
      "label": "allows",
      "cardinality": {
        "from": "exactly one",
        "to": "zero or more"
      }
    },
    {
      "from": "PERSON",
      "to": "NAMED-DRIVER",
      "type": "MANY_TO_MANY",
      "label": "is",
      "cardinality": {
        "from": "zero or more",
        "to": "zero or more"
      }
    }
  ]
}
```

## テストケース5

入力：

```
erDiagram
    CAR ||--o{ NAMED-DRIVER : allows
    CAR {
        string registrationNumber PK
        string make
        string model
        string[] parts
    }
    PERSON ||--o{ NAMED-DRIVER : is
    PERSON {
        string driversLicense PK "The license #"
        string(99) firstName "Only 99 characters are allowed"
        string lastName
        string phone UK
        int age
    }
    NAMED-DRIVER {
        string carRegistrationNumber PK, FK
        string driverLicence PK, FK
    }
    MANUFACTURER only one to zero or more CAR : makes
```


出力：

```json
{
  "entities": [
    {
      "name": "CAR",
      "members": [
        {
          "name": "registrationNumber",
          "dataType": "string",
          "keys": [
            "PK"
          ]
        },
        {
          "name": "make",
          "dataType": "string"
        },
        {
          "name": "model",
          "dataType": "string"
        },
        {
          "name": "parts",
          "dataType": "string[]"
        }
      ]
    },
    {
      "name": "NAMED-DRIVER",
      "members": [
        {
          "name": "carRegistrationNumber",
          "dataType": "string",
          "keys": [
            "PK",
            "FK"
          ]
        },
        {
          "name": "driverLicence",
          "dataType": "string",
          "keys": [
            "PK",
            "FK"
          ]
        }
      ]
    },
    {
      "name": "PERSON",
      "members": [
        {
          "name": "driversLicense",
          "dataType": "string",
          "keys": [
            "PK"
          ],
          "comment": "The license #"
        },
        {
          "name": "firstName",
          "dataType": "string",
          "comment": "Only 99 characters are allowed",
          "length": 99
        },
        {
          "name": "lastName",
          "dataType": "string"
        },
        {
          "name": "phone",
          "dataType": "string",
          "keys": [
            "UK"
          ]
        },
        {
          "name": "age",
          "dataType": "int"
        }
      ]
    },
    {
      "name": "MANUFACTURER"
    }
  ],
  "relationships": [
    {
      "from": "CAR",
      "to": "NAMED-DRIVER",
      "type": "ONE_TO_MANY",
      "label": "allows",
      "cardinality": {
        "from": "exactly one",
        "to": "zero or more"
      }
    },
    {
      "from": "PERSON",
      "to": "NAMED-DRIVER",
      "type": "ONE_TO_MANY",
      "label": "is",
      "cardinality": {
        "from": "exactly one",
        "to": "zero or more"
      }
    },
    {
      "from": "MANUFACTURER",
      "to": "CAR",
      "type": "ONE_TO_ZERO_OR_MANY",
      "label": "makes",
      "cardinality": {
        "from": "exactly one",
        "to": "zero or more"
      }
    }
  ]
}
```