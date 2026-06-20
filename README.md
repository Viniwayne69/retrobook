# Retrobooks

Retrobooks é uma rede social literária para leitores encontrarem pessoas que estão lendo o mesmo livro, criarem tribos, publicarem reflexões e participarem de discussões.

Este MVP usa Vite com HTML, CSS e JavaScript puro no front-end, além de Supabase para autenticação, banco de dados e políticas de segurança.

## Funcionalidades

- Cadastro e login com Supabase Auth
- Perfil de leitor com edição de nome, username, bio, livro atual, autor favorito e avatar URL opcional
- Feed com criação de posts, listagem, curtidas e salvamento visual no navegador
- Tribos literárias com criação, entrada e página de detalhes
- Discussões por tribo com comentários
- Página visual de Fiódor Dostoiévski com obras, citações e entrada na Tribo Dostoiévski
- Dados iniciais de tribos e posts simulados quando o banco ainda está vazio

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

O schema cria as tabelas `profiles`, `posts`, `post_likes`, `tribes`, `tribe_members`, `discussions` e `comments`, além das políticas RLS e triggers para criar perfil automaticamente, atualizar curtidas e atualizar contagem de membros.

As tribos iniciais inseridas são:

- Tribo Dostoiévski
- Clube Machado de Assis
- Leituras Existenciais
- Poesia e Devaneios
- Filosofia Antiga
- Tolkien Sociedade

## Rodando localmente

Depois de configurar o `.env`, rode:

```bash
npm run dev
```

Abra a URL indicada pelo Vite no navegador. O app redireciona usuários logados para o feed e protege as páginas internas para quem ainda não entrou.

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
    Tribes.js
    TribeDetails.js
    Author.js
    Discussion.js
    Profile.js
  components/
    Header.js
    PostCard.js
    TribeCard.js
    DiscussionCard.js
    ProfileCard.js
    Button.js
```

## Próximos passos naturais

- Criar upload real de avatar com Supabase Storage
- Adicionar edição e exclusão de posts
- Criar busca por livro, autor e tribo
- Criar notificações de comentários
- Melhorar ranking de posts e recomendações de leitores
