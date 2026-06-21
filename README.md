# Retrobook

Retrobook é uma rede social literária para leitores se conectarem pelos livros que estão lendo.

O MVP usa Vite com HTML, CSS e JavaScript puro no front-end, além de Supabase para autenticação, banco de dados e políticas de segurança.

## Funcionalidades

- Cadastro e login com Supabase Auth
- Login e cadastro com slider visual de autores literários
- Perfil de leitor com nome, ID de usuário, bio, livro atual, autor favorito e avatar opcional
- Feed social com posts reais, curtidas, salvamento visual e página separada para publicar
- Publicação com texto, livro relacionado, autor opcional e foto opcional por URL
- Pesquisa de leitores por ID e clubes por nome
- Mensagens com estrutura para conversas individuais e conversas de clubes
- Tribos literárias com criação, entrada e página de detalhes
- Discussões por tribo com comentários
- Dados iniciais de tribos quando o banco ainda está vazio

## Instalação

Instale as dependências:

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
6. Para testar o MVP com menos fricção, você pode desativar a confirmação de email durante o desenvolvimento.

## Aplicando o banco de dados

1. No Supabase, abra SQL Editor.
2. Copie todo o conteúdo de `supabase-schema.sql`.
3. Execute o SQL.

O schema cria as tabelas `profiles`, `posts`, `post_likes`, `tribes`, `tribe_members`, `discussions`, `comments`, `conversations`, `conversation_members` e `messages`, além das políticas RLS e triggers.

O arquivo também adiciona campos opcionais em `posts` para `author_name` e `image_url`, usados pela tela Publicar. Se o app já estiver em produção, execute novamente `supabase-schema.sql` no SQL Editor para aplicar essa evolução sem apagar os dados existentes.

## Rodando localmente

Depois de configurar o `.env`, rode:

```bash
npm run dev
```

Abra a URL indicada pelo Vite no navegador.

## Deploy na Vercel

1. Envie o projeto para um repositório Git.
2. Na Vercel, importe o repositório.
3. Use Vite como preset.
4. Configure o build command como `npm run build`.
5. Configure o output directory como `dist`.
6. Adicione `VITE_SUPABASE_URL` e pelo menos uma chave, `VITE_SUPABASE_ANON_KEY` ou `VITE_SUPABASE_PUBLISHABLE_KEY`, em Environment Variables.
7. Faça o deploy.

O arquivo `vercel.json` mantém as rotas do SPA funcionando quando alguém acessa uma página interna diretamente.

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

## Próximos passos naturais

- Criar upload real de avatar e fotos dos posts com Supabase Storage
- Adicionar comentários por post
- Criar criação direta de conversas individuais pela pesquisa
- Melhorar recomendações de leitores e clubes
