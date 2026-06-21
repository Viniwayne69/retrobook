# Retrobook

Retrobook e uma rede social literaria para leitores se conectarem pelos livros que estao lendo.

O MVP usa Vite com HTML, CSS e JavaScript puro no front-end, alem de Supabase para autenticacao, banco de dados e politicas de seguranca.

## Funcionalidades

- Cadastro e login com Supabase Auth
- Login e cadastro com slider visual de autores literarios
- Perfil de leitor com nome, ID de usuario, bio, livro atual, autor favorito e avatar opcional
- Feed social com posts reais, curtidas, salvamento visual e pagina separada para publicar
- Publicacao com texto, livro relacionado, autor opcional e foto opcional por URL
- Pesquisa de leitores por ID e clubes por nome
- Mensagens com estrutura para conversas individuais e conversas de clubes
- Tribos literarias com criacao, entrada e pagina de detalhes
- Discussoes por tribo com comentarios
- Dados iniciais de tribos quando o banco ainda esta vazio

## Instalacao

Instale as dependencias:

```bash
npm install
```

Crie o arquivo de ambiente local:

```bash
copy .env.example .env
```

Preencha o `.env` com as chaves do Supabase:

```bash
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publishable_do_supabase
```

## Criando o projeto no Supabase

1. Acesse o painel do Supabase e crie um novo projeto.
2. Abra Project Settings, depois API.
3. Copie a Project URL para `VITE_SUPABASE_URL`.
4. Copie a anon public key para `VITE_SUPABASE_ANON_KEY` ou a publishable key para `VITE_SUPABASE_PUBLISHABLE_KEY`.
5. Em Authentication, configure Email como provedor de login.
6. Para testar o MVP com menos friccao, voce pode desativar a confirmacao de email durante o desenvolvimento.

## Aplicando o banco de dados

1. No Supabase, abra SQL Editor.
2. Copie todo o conteudo de `supabase-schema.sql`.
3. Execute o SQL.

O schema cria as tabelas `profiles`, `posts`, `post_likes`, `tribes`, `tribe_members`, `discussions`, `comments`, `conversations`, `conversation_members` e `messages`, alem das politicas RLS e triggers.

O arquivo tambem adiciona campos opcionais em `posts` para `author_name` e `image_url`, usados pela tela Publicar. Se o app ja estiver em producao, execute novamente `supabase-schema.sql` no SQL Editor para aplicar essa evolucao sem apagar os dados existentes.

## Rodando localmente

Depois de configurar o `.env`, rode:

```bash
npm run dev
```

Abra a URL indicada pelo Vite no navegador.

## Deploy na Vercel

1. Envie o projeto para um repositorio Git.
2. Na Vercel, importe o repositorio.
3. Use Vite como preset.
4. Configure o build command como `npm run build`.
5. Configure o output directory como `dist`.
6. Adicione `VITE_SUPABASE_URL` e pelo menos uma chave, `VITE_SUPABASE_ANON_KEY` ou `VITE_SUPABASE_PUBLISHABLE_KEY`, em Environment Variables.
7. Faca o deploy.

O arquivo `vercel.json` mantem as rotas do SPA funcionando quando alguem acessa uma pagina interna diretamente.

## Estrutura

```text
src/
  main.js
  supabase.js
  router.js
  styles/
    style.css
  pages/
    Home.js
    Login.js
    Register.js
    Feed.js
    Publish.js
    Search.js
    Messages.js
    Tribes.js
    TribeDetails.js
    Author.js
    Discussion.js
    Profile.js
  components/
    AuthFrame.js
    Header.js
    PostCard.js
    TribeCard.js
    DiscussionCard.js
    ProfileCard.js
    Button.js
```

## Proximos passos naturais

- Criar upload real de avatar e fotos dos posts com Supabase Storage
- Adicionar comentarios por post
- Criar criacao direta de conversas individuais pela pesquisa
- Melhorar recomendacoes de leitores e clubes
