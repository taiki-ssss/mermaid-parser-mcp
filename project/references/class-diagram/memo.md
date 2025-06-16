### visibility

- `+` → `public`
- `-` → `private`
- `#` → `protected`
- `~` → `package/internal`
- ` ` → `public` (デフォルト)

### return type

- ` ` → `void`


### relationship

`[classA][Arrow][ClassB]`

- `<|--` → `inheritance`
- `*--` → `composition`
- `o--` → `aggregation`
- `-->` → `association`
- `--` → `link (solid)`
- `..>` → `dependency`
- `..|>` → `realization`
- `..` → `link (dashed)`


### two-way relations

`[Relation Type][Link][Relation Type]`

- `<|` → `inheritance`
- `\*`→ `composition`
- `o` → `aggregation`
- `>` → `association`
- `<` → `association`
- `|>` → `realization`


- `--` → `solid`
- `..` → `dashed`


### generic type

`~int~` → `<int>`