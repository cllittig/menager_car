# Diagrama De Classes (Backend)

Este documento representa as classes principais do backend NestJS.

## 1) Dominio (Entidades E DTOs)

```mermaid
classDiagram
direction LR

class Categoria {
	+number id
	+string nome
	+string descricao
	+boolean ativa
	+Produto[] produto
}

class Fornecedor {
	+number id
	+string nome
	+string empresa
	+string email
	+string telefone
	+string endereco
	+Produto[] produto
}

class Produto {
	+number id
	+string nome
	+string descricao
	+number preco
	+number quantidade
	+number fornecedorId
	+number categoriaId
	+Date deleted_at
	+Movimentacao[] movimentacao
}

class Usuario {
	+number id
	+string nome
	+string email
	+string senha
	+string tipo
	+Date datacriacao
	+Movimentacao[] movimentacao
}

class Movimentacao {
	+number id
	+ENTRADA|SAIDA tipo
	+number quantidade
	+string observacao
	+Date data_criacao
	+Date data_exclusao
	+number usuarioId
	+number produtoId
}

class CreateCategoriaDto {
	+string nome
	+string descricao
}

class UpdateCategoriaDto {
	+number id?
	+string nome?
	+string descricao?
	+boolean ativa?
}

class CreateFornecedorDto {
	+string nome
	+string empresa
	+string email
	+string telefone
	+string endereco
}

class UpdateFornecedorDto {
	+string nome?
	+string contato?
	+string telefone?
	+string endereco?
}

class CreateProdutoDto {
	+string nome
	+string descricao?
	+number preco
	+number quantidade
	+number fornecedorId
	+number categoriaId
}

class UpdateProdutoDto {
	+string nome?
	+string descricao?
	+number preco?
}

class CreateMovimentacaoDto {
	+number produtoId
	+ENTRADA|SAIDA tipo
	+number quantidade
	+string observacao
}

class UpdateMovimentacaoDto {
	+number id?
	+ENTRADA|SAIDA tipo?
	+number quantidade?
	+string observacao?
}

class CreateUsuarioDto {
	+string nome
	+string email
	+string senha
}

class UpdateUsuarioDto {
	+string nome?
	+string email?
	+string senha?
}

class LoginDto {
	+string email
	+string senha
}

Fornecedor "1" --> "0..*" Produto : fornece
Categoria "1" --> "0..*" Produto : classifica
Usuario "1" --> "0..*" Movimentacao : realiza
Produto "1" --> "0..*" Movimentacao : possui

UpdateCategoriaDto --|> CreateCategoriaDto : PartialType
UpdateFornecedorDto --|> CreateFornecedorDto : PartialType
UpdateMovimentacaoDto --|> CreateMovimentacaoDto : PartialType
UpdateUsuarioDto --|> CreateUsuarioDto : PartialType

CreateMovimentacaoDto ..> Produto : produtoId
CreateProdutoDto ..> Fornecedor : fornecedorId
CreateProdutoDto ..> Categoria : categoriaId
LoginDto ..> Usuario : autentica por email/senha
```

## 2) Camada De Aplicacao (Controller, Service, Auth)

```mermaid
classDiagram
direction TB

class CategoriaController
class CategoriaService
class FornecedorController
class FornecedorService
class ProdutoController
class ProdutoService
class MovimentacaoController
class MovimentacaoService
class UsuarioController
class UsuarioService
class AuthController
class AuthService
class AuthGuard {
	+canActivate(context)
}
class JwtAuthGuard
class PassportAuthGuard
class JwtService
class PrismaService

CategoriaController --> CategoriaService
FornecedorController --> FornecedorService
ProdutoController --> ProdutoService
MovimentacaoController --> MovimentacaoService
UsuarioController --> UsuarioService
AuthController --> AuthService

CategoriaService ..> Categoria
FornecedorService ..> Fornecedor
ProdutoService ..> Produto
MovimentacaoService ..> Movimentacao
UsuarioService ..> Usuario

MovimentacaoService --> ProdutoService : atualiza estoque
AuthService --> UsuarioService : busca usuario
AuthService --> JwtService : gera token
UsuarioService --> PrismaService : findByEmail/resetLoginAttempts

AuthGuard --> JwtService : valida token
JwtAuthGuard --|> PassportAuthGuard
```

## Observacoes

- O codigo contem imports mistos para algumas entidades (`src/fornecedor/fornecedor` e `src/fornecedor/entities/fornecedor.entity`, por exemplo).
- O projeto tambem mistura acesso via TypeORM e Prisma no `UsuarioService`.
- O diagrama acima reflete o estado atual do codigo, sem normalizacao arquitetural.
