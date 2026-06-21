import { createClient } from "@supabase/supabase-js";
import { slugify } from "./utils.js";

const fallbackSupabaseUrl = "https://aulzpeqfjbqoxfalirgm.supabase.co";
const fallbackSupabaseKey = "sb_publishable_elE0iBNf_UEB6PPb-9HHvQ_7iHeYec6";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || fallbackSupabaseUrl;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  fallbackSupabaseKey;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);
export const supabase = hasSupabaseConfig ? createClient(supabaseUrl, supabaseKey) : null;

export const defaultTribes = [
  {
    name: "Tribo Dostoiévski",
    slug: "tribo-dostoievski",
    description: "Um salão para leitores que gostam de culpa, fé, liberdade e personagens que parecem carregar tempestades por dentro.",
    main_book_or_author: "Fiódor Dostoiévski",
    category: "Romance russo"
  },
  {
    name: "Clube Machado de Assis",
    slug: "clube-machado-de-assis",
    description: "Leituras com ironia fina, narradores suspeitos e conversas sobre memória, desejo e linguagem.",
    main_book_or_author: "Machado de Assis",
    category: "Clássicos brasileiros"
  },
  {
    name: "Leituras Existenciais",
    slug: "leituras-existenciais",
    description: "Para quem procura livros que olham para o vazio sem perder a delicadeza do pensamento.",
    main_book_or_author: "Camus, Sartre, Clarice e Kafka",
    category: "Existencialismo"
  },
  {
    name: "Poesia e Devaneios",
    slug: "poesia-e-devaneios",
    description: "Uma tribo para versos, imagens, silêncios e cadernos onde a vida aprende outra música.",
    main_book_or_author: "Poesia",
    category: "Poesia"
  },
  {
    name: "Filosofia Antiga",
    slug: "filosofia-antiga",
    description: "Leitores de Platão, Aristóteles, Sêneca e Marco Aurélio em busca de uma vida examinada com serenidade.",
    main_book_or_author: "Filosofia clássica",
    category: "Filosofia"
  },
  {
    name: "Tolkien Sociedade",
    slug: "tolkien-sociedade",
    description: "Mapas, línguas antigas, jornadas longas e aquela coragem pequena que nasce quando alguém decide continuar.",
    main_book_or_author: "J. R. R. Tolkien",
    category: "Fantasia clássica"
  }
];

function client() {
  if (!supabase) {
    throw new Error("Configure o Supabase no arquivo .env para usar esta ação.");
  }

  return supabase;
}

export async function getSession() {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }

  return data.session;
}

export async function getProfile(userId) {
  if (!userId) {
    return null;
  }

  const { data, error } = await client()
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function registerUser(payload, redirectTo) {
  const database = client();
  const username = payload.username;

  const { data: existingUsername, error: usernameError } = await database
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (usernameError) {
    throw usernameError;
  }

  if (existingUsername) {
    throw new Error("Este username já está em uso.");
  }

  const profileData = {
    name: payload.name,
    username,
    bio: payload.bio,
    current_book: payload.current_book,
    favorite_author: payload.favorite_author,
    avatar_url: payload.avatar_url || ""
  };

  const { data, error } = await database.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      emailRedirectTo: redirectTo,
      data: profileData
    }
  });

  if (error) {
    throw error;
  }

  if (data.session && data.user) {
    await saveProfile(data.user.id, profileData);
  }

  return data;
}

export async function signInUser(email, password) {
  const { data, error } = await client().auth.signInWithPassword({ email, password });

  if (error) {
    throw error;
  }

  return data;
}

export async function resendConfirmationEmail(email, redirectTo) {
  const options = redirectTo ? { emailRedirectTo: redirectTo } : undefined;
  const { data, error } = await client().auth.resend({
    type: "signup",
    email,
    options
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOutUser() {
  const { error } = await client().auth.signOut();

  if (error) {
    throw error;
  }
}

export async function saveProfile(userId, payload) {
  const profile = {
    id: userId,
    name: payload.name,
    username: payload.username,
    bio: payload.bio || "",
    current_book: payload.current_book || "",
    current_book_id: payload.current_book_id || null,
    favorite_author: payload.favorite_author || "",
    avatar_url: payload.avatar_url || null
  };

  const result = await client()
    .from("profiles")
    .upsert(profile)
    .select()
    .single();

  const { data, error } = result.error && isMissingOptionalTable(result.error)
    ? await client()
      .from("profiles")
      .upsert({
        id: userId,
        name: payload.name,
        username: payload.username,
        bio: payload.bio || "",
        current_book: payload.current_book || "",
        favorite_author: payload.favorite_author || "",
        avatar_url: payload.avatar_url || null
      })
      .select()
      .single()
    : result;

  if (error) {
    throw error;
  }

  return data;
}

export async function getProfileStats(userId) {
  const database = client();
  const [postsResult, tribesResult] = await Promise.all([
    database.from("posts").select("id", { count: "exact", head: true }).eq("user_id", userId),
    database.from("tribes").select("id", { count: "exact", head: true }).eq("created_by", userId)
  ]);

  if (postsResult.error) {
    throw postsResult.error;
  }

  if (tribesResult.error) {
    throw tribesResult.error;
  }

  return {
    posts: postsResult.count || 0,
    tribes: tribesResult.count || 0
  };
}

export async function listPosts(userId) {
  const database = client();

  const extended = await database
    .from("posts")
    .select("*, profiles(name, username, avatar_url, current_book, current_book_id), books(title, author, cover_url, genre)")
    .order("created_at", { ascending: false })
    .limit(80);

  const { data, error } = extended.error && isMissingOptionalTable(extended.error)
    ? await database
      .from("posts")
      .select("*, profiles(name, username, avatar_url, current_book)")
      .order("created_at", { ascending: false })
      .limit(80)
    : extended;

  if (error) {
    throw error;
  }

  const posts = data || [];
  if (!posts.length) {
    return [];
  }

  const postIds = posts.map((post) => post.id);
  const { data: likes, error: likesError } = await database
    .from("post_likes")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", postIds);

  if (likesError) {
    throw likesError;
  }

  const likedIds = new Set((likes || []).map((like) => like.post_id));
  return posts.map((post) => ({
    ...post,
    user_liked: likedIds.has(post.id)
  }));
}

export async function createPost(userId, payload) {
  const database = client();
  const post = {
    user_id: userId,
    book_id: payload.book_id || null,
    book_title: payload.book_title || payload.book?.title || "Livro não informado",
    content: payload.content || "",
    author_name: payload.author_name || null,
    image_url: payload.image_url || null,
    visibility: payload.visibility || "public"
  };

  const { data, error } = await database
    .from("posts")
    .insert(post)
    .select()
    .single();

  if (error) {
    const message = String(error.message || "").toLowerCase();

    if (!message.includes("book_id") && !message.includes("author_name") && !message.includes("image_url") && !message.includes("visibility") && !message.includes("column")) {
      throw error;
    }

    const fallback = await database
      .from("posts")
      .insert({
        user_id: userId,
        book_title: post.book_title,
        content: payload.content || ""
      })
      .select()
      .single();

    if (fallback.error) {
      throw fallback.error;
    }

    return fallback.data;
  }

  return data;
}

export async function listPostsByUser(profileId, userId) {
  const database = client();

  const extended = await database
    .from("posts")
    .select("*, profiles(name, username, avatar_url, current_book, current_book_id), books(title, author, cover_url, genre)")
    .eq("user_id", profileId)
    .order("created_at", { ascending: false });

  const { data, error } = extended.error && isMissingOptionalTable(extended.error)
    ? await database
      .from("posts")
      .select("*, profiles(name, username, avatar_url, current_book)")
      .eq("user_id", profileId)
      .order("created_at", { ascending: false })
    : extended;

  if (error) {
    throw error;
  }

  const posts = data || [];
  if (!posts.length) {
    return [];
  }

  const postIds = posts.map((post) => post.id);
  const { data: likes, error: likesError } = await database
    .from("post_likes")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", postIds);

  if (likesError) {
    throw likesError;
  }

  const likedIds = new Set((likes || []).map((like) => like.post_id));
  return posts.map((post) => ({
    ...post,
    user_liked: likedIds.has(post.id)
  }));
}

export async function searchBooks(query) {
  const term = String(query || "").trim();

  if (term.length < 2) {
    return [];
  }

  const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(term)}&limit=10`);

  if (!response.ok) {
    throw new Error("Não foi possível buscar livros agora.");
  }

  const data = await response.json();
  return (data.docs || [])
    .filter((book) => book.title)
    .map((book) => ({
      open_library_id: book.key,
      title: book.title,
      author: book.author_name?.[0] || "Autor não informado",
      cover_url: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : "",
      description: Array.isArray(book.first_sentence) ? book.first_sentence[0] || "" : book.first_sentence || "",
      genre: book.subject?.[0] || book.first_publish_year?.toString() || ""
    }));
}

export async function saveBookFromOpenLibrary(book) {
  if (!book?.title) {
    throw new Error("Escolha um livro válido.");
  }

  const database = client();
  const record = {
    open_library_id: book.open_library_id || null,
    title: book.title,
    author: book.author || "Autor não informado",
    cover_url: book.cover_url || "",
    description: book.description || "",
    genre: book.genre || ""
  };

  const { data, error } = await database
    .from("books")
    .upsert(record, { onConflict: "open_library_id" })
    .select()
    .single();

  if (error) {
    if (isMissingOptionalTable(error)) {
      throw new Error("A tabela de livros ainda não foi aplicada no Supabase.");
    }

    throw error;
  }

  return data;
}

export async function setCurrentBook(userId, book) {
  const database = client();
  const savedBook = await saveBookFromOpenLibrary(book);

  const profileResult = await database
    .from("profiles")
    .update({
      current_book: savedBook.title,
      current_book_id: savedBook.id
    })
    .eq("id", userId)
    .select()
    .single();

  if (profileResult.error) {
    throw profileResult.error;
  }

  const readingResult = await database
    .from("user_books")
    .upsert({
      user_id: userId,
      book_id: savedBook.id,
      status: "reading"
    }, {
      onConflict: "user_id,book_id,status"
    });

  if (readingResult.error && !isMissingOptionalTable(readingResult.error)) {
    throw readingResult.error;
  }

  return savedBook;
}

export async function uploadPostImage(file, userId) {
  if (!file || !file.size) {
    return "";
  }

  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const maxSize = 5 * 1024 * 1024;

  if (!validTypes.includes(file.type)) {
    throw new Error("Use uma imagem JPG, PNG ou WEBP.");
  }

  if (file.size > maxSize) {
    throw new Error("A imagem precisa ter até 5 MB.");
  }

  const extension = file.name.split(".").pop() || "jpg";
  const cleanName = sanitizeStorageFilename(file.name.replace(/\.[^.]+$/, ""));
  const path = `${userId}/${Date.now()}-${cleanName}.${extension.toLowerCase()}`;
  const { error } = await client().storage
    .from("post_images")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false
    });

  if (error) {
    throw new Error("Não foi possível enviar a imagem. Verifique se o bucket post_images existe no Supabase.");
  }

  const { data } = client().storage.from("post_images").getPublicUrl(path);
  return data.publicUrl;
}

export function calculateAffinityScore(currentReader = {}, otherReader = {}) {
  let score = 0;

  if (currentReader.current_book_id && currentReader.current_book_id === otherReader.current_book_id) {
    score += 55;
  }

  if (currentReader.current_book && currentReader.current_book === otherReader.current_book) {
    score += 35;
  }

  if (currentReader.favorite_author && currentReader.favorite_author === otherReader.favorite_author) {
    score += 20;
  }

  if (Array.isArray(currentReader.topics) && Array.isArray(otherReader.topics)) {
    const currentTopics = new Set(currentReader.topics);
    otherReader.topics.forEach((topic) => {
      if (currentTopics.has(topic)) {
        score += 10;
      }
    });
  }

  return Math.min(score || 18, 100);
}

export async function findReaderMatches(userId) {
  const profile = await getProfile(userId);

  if (!profile) {
    return { sameBook: [], similarBooks: [], similarIdeas: [] };
  }

  const database = client();
  const sameBook = await findSameBookReaders(database, userId, profile);
  const similarBooks = await findSimilarBookReaders(database, userId, profile);
  const similarIdeas = await findSimilarIdeaReaders(database, userId, profile);

  return {
    sameBook,
    similarBooks,
    similarIdeas
  };
}

async function findSameBookReaders(database, userId, profile) {
  if (!profile.current_book_id && !profile.current_book) {
    return [];
  }

  const query = database
    .from("profiles")
    .select("id, name, username, bio, current_book, current_book_id, favorite_author, avatar_url")
    .neq("id", userId)
    .limit(10);

  const result = profile.current_book_id
    ? await query.eq("current_book_id", profile.current_book_id)
    : await query.eq("current_book", profile.current_book);

  if (result.error) {
    return [];
  }

  return (result.data || []).map((reader) => ({
    ...reader,
    match_kind: "Mesmo livro",
    affinity_score: calculateAffinityScore(profile, reader)
  }));
}

async function findSimilarBookReaders(database, userId, profile) {
  if (!profile.current_book_id) {
    return [];
  }

  const currentBook = await database
    .from("books")
    .select("author, genre")
    .eq("id", profile.current_book_id)
    .maybeSingle();

  if (currentBook.error || !currentBook.data) {
    return [];
  }

  const filters = [];
  if (currentBook.data.author) {
    filters.push(`books.author.eq.${currentBook.data.author}`);
  }

  if (currentBook.data.genre) {
    filters.push(`books.genre.eq.${currentBook.data.genre}`);
  }

  if (!filters.length) {
    return [];
  }

  const result = await database
    .from("user_books")
    .select("user_id, books(title, author, genre), profiles(id, name, username, bio, current_book, current_book_id, favorite_author, avatar_url)")
    .neq("user_id", userId)
    .or(filters.join(","))
    .limit(10);

  if (result.error) {
    return [];
  }

  const seen = new Set();
  return (result.data || [])
    .map((item) => ({
      ...item.profiles,
      related_book: item.books,
      match_kind: "Livro parecido",
      affinity_score: calculateAffinityScore(profile, item.profiles || {})
    }))
    .filter((reader) => {
      if (!reader.id || seen.has(reader.id)) {
        return false;
      }

      seen.add(reader.id);
      return true;
    });
}

async function findSimilarIdeaReaders(database, userId, profile) {
  if (!profile.favorite_author) {
    return [];
  }

  const result = await database
    .from("profiles")
    .select("id, name, username, bio, current_book, current_book_id, favorite_author, avatar_url")
    .neq("id", userId)
    .eq("favorite_author", profile.favorite_author)
    .limit(10);

  if (result.error) {
    return [];
  }

  return (result.data || []).map((reader) => ({
    ...reader,
    match_kind: "Ideia parecida",
    affinity_score: calculateAffinityScore(profile, reader)
  }));
}

export async function getFriendshipStatus(userId, otherUserId) {
  if (!userId || !otherUserId || userId === otherUserId) {
    return null;
  }

  const { data, error } = await client()
    .from("friendships")
    .select("*")
    .or(`and(requester_id.eq.${userId},addressee_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},addressee_id.eq.${userId})`)
    .maybeSingle();

  if (error) {
    if (isMissingOptionalTable(error)) {
      return null;
    }

    throw error;
  }

  return data;
}

export async function sendFriendRequest(requesterId, addresseeId) {
  if (requesterId === addresseeId) {
    throw new Error("Você não pode enviar amizade para si mesmo.");
  }

  const existing = await getFriendshipStatus(requesterId, addresseeId);
  if (existing) {
    return existing;
  }

  const { data, error } = await client()
    .from("friendships")
    .insert({
      requester_id: requesterId,
      addressee_id: addresseeId,
      status: "pending"
    })
    .select()
    .single();

  if (error) {
    if (isMissingOptionalTable(error)) {
      throw new Error("A tabela de amizades ainda não foi aplicada no Supabase.");
    }

    throw error;
  }

  return data;
}

export async function acceptFriendRequest(friendshipId, userId) {
  const { data, error } = await client()
    .from("friendships")
    .update({
      status: "accepted",
      responded_at: new Date().toISOString()
    })
    .eq("id", friendshipId)
    .eq("addressee_id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function rejectFriendRequest(friendshipId, userId) {
  const { data, error } = await client()
    .from("friendships")
    .update({
      status: "rejected",
      responded_at: new Date().toISOString()
    })
    .eq("id", friendshipId)
    .eq("addressee_id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

function sanitizeStorageFilename(value = "") {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 52) || "imagem";
}

export async function togglePostLike(userId, post) {
  const database = client();

  if (post.user_liked) {
    const { error } = await database
      .from("post_likes")
      .delete()
      .eq("post_id", post.id)
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    return;
  }

  const { error } = await database
    .from("post_likes")
    .insert({
      post_id: post.id,
      user_id: userId
    });

  if (error && error.code !== "23505") {
    throw error;
  }
}

export async function ensureInitialTribes(userId) {
  const database = client();
  const slugs = defaultTribes.map((tribe) => tribe.slug);

  const { data: existing, error } = await database
    .from("tribes")
    .select("slug")
    .in("slug", slugs);

  if (error) {
    throw error;
  }

  const existingSlugs = new Set((existing || []).map((tribe) => tribe.slug));
  const missing = defaultTribes
    .filter((tribe) => !existingSlugs.has(tribe.slug))
    .map((tribe) => ({
      ...tribe,
      created_by: userId
    }));

  if (!missing.length) {
    return;
  }

  const { error: insertError } = await database.from("tribes").insert(missing);

  if (insertError) {
    throw insertError;
  }
}

export async function listTribes(userId) {
  const database = client();
  const { data, error } = await database
    .from("tribes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const tribes = data || [];
  if (!tribes.length) {
    return [];
  }

  const tribeIds = tribes.map((tribe) => tribe.id);
  const { data: memberships, error: membershipsError } = await database
    .from("tribe_members")
    .select("tribe_id")
    .eq("user_id", userId)
    .in("tribe_id", tribeIds);

  if (membershipsError) {
    throw membershipsError;
  }

  const joinedIds = new Set((memberships || []).map((membership) => membership.tribe_id));
  return tribes.map((tribe) => ({
    ...tribe,
    user_joined: joinedIds.has(tribe.id)
  }));
}

export async function createTribe(userId, payload) {
  const baseSlug = slugify(payload.name);
  const { data, error } = await client()
    .from("tribes")
    .insert({
      created_by: userId,
      name: payload.name,
      slug: baseSlug,
      description: payload.description,
      main_book_or_author: payload.main_book_or_author,
      category: payload.category
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  await joinTribe(data.id, userId);
  return data;
}

export async function joinTribe(tribeId, userId) {
  const { error } = await client()
    .from("tribe_members")
    .upsert({
      tribe_id: tribeId,
      user_id: userId
    }, {
      onConflict: "tribe_id,user_id"
    });

  if (error) {
    throw error;
  }
}

export async function getTribeBySlug(slug, userId) {
  const database = client();
  const { data, error } = await database
    .from("tribes")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const { data: membership, error: membershipError } = await database
    .from("tribe_members")
    .select("id")
    .eq("tribe_id", data.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (membershipError) {
    throw membershipError;
  }

  return {
    ...data,
    user_joined: Boolean(membership)
  };
}

export async function getDostoevskyTribe(userId) {
  await ensureInitialTribes(userId);
  return getTribeBySlug("tribo-dostoievski", userId);
}

export async function listDiscussionsByTribe(tribeId) {
  const { data, error } = await client()
    .from("discussions")
    .select("id, tribe_id, user_id, title, question, book_title, chapter, created_at, profiles(name, username)")
    .eq("tribe_id", tribeId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function listRecentDiscussions(limit = 3) {
  const { data, error } = await client()
    .from("discussions")
    .select("id, tribe_id, user_id, title, question, book_title, chapter, created_at, profiles(name, username), tribes(name, slug)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data || [];
}

export async function createDiscussion(userId, payload) {
  const { data, error } = await client()
    .from("discussions")
    .insert({
      tribe_id: payload.tribe_id,
      user_id: userId,
      title: payload.title,
      question: payload.question,
      book_title: payload.book_title,
      chapter: payload.chapter
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function ensureInitialDiscussion(userId) {
  const tribe = await getDostoevskyTribe(userId);
  if (!tribe) {
    return null;
  }

  const database = client();
  const { data: existing, error } = await database
    .from("discussions")
    .select("*")
    .eq("tribe_id", tribe.id)
    .eq("title", "Crime e Castigo, Capítulo 5")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (existing) {
    return existing;
  }

  return createDiscussion(userId, {
    tribe_id: tribe.id,
    title: "Crime e Castigo, Capítulo 5",
    question: "O sonho do cavalo revela culpa, compaixão ou presságio dentro de Raskólnikov?",
    book_title: "Crime e Castigo",
    chapter: "Capítulo 5"
  });
}

export async function getDiscussion(id) {
  const { data, error } = await client()
    .from("discussions")
    .select("id, tribe_id, user_id, title, question, book_title, chapter, created_at, profiles(name, username), tribes(name, slug)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function listComments(discussionId) {
  const { data, error } = await client()
    .from("comments")
    .select("id, discussion_id, user_id, content, created_at, profiles(name, username)")
    .eq("discussion_id", discussionId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function addComment(userId, discussionId, content) {
  const { data, error } = await client()
    .from("comments")
    .insert({
      discussion_id: discussionId,
      user_id: userId,
      content
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function searchRetrobook(query, userId) {
  const term = String(query || "").trim();

  if (!term) {
    return { profiles: [], tribes: [] };
  }

  const database = client();
  const pattern = `%${term.replace(/[%_]/g, "")}%`;
  const [profilesResult, tribesResult] = await Promise.all([
    database
      .from("profiles")
      .select("id, name, username, bio, current_book, avatar_url")
      .or(`username.ilike.${pattern},name.ilike.${pattern}`)
      .limit(12),
    database
      .from("tribes")
      .select("*")
      .or(`name.ilike.${pattern},description.ilike.${pattern},category.ilike.${pattern}`)
      .limit(12)
  ]);

  if (profilesResult.error) {
    throw profilesResult.error;
  }

  if (tribesResult.error) {
    throw tribesResult.error;
  }

  const tribes = tribesResult.data || [];
  if (!tribes.length) {
    return { profiles: profilesResult.data || [], tribes: [] };
  }

  const membershipsResult = await database
    .from("tribe_members")
    .select("tribe_id")
    .eq("user_id", userId)
    .in("tribe_id", tribes.map((tribe) => tribe.id));

  if (membershipsResult.error) {
    throw membershipsResult.error;
  }

  const joinedIds = new Set((membershipsResult.data || []).map((membership) => membership.tribe_id));

  return {
    profiles: profilesResult.data || [],
    tribes: tribes.map((tribe) => ({
      ...tribe,
      user_joined: joinedIds.has(tribe.id)
    }))
  };
}

export async function listConversations(userId) {
  const database = client();

  const extended = await database
    .from("conversation_members")
    .select("conversation_id, unread_count, conversations(id, title, type, tribe_id, book_id, updated_at, tribes(name, members_count), books(title, author))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const { data, error } = extended.error && isMissingOptionalTable(extended.error)
    ? await database
      .from("conversation_members")
      .select("conversation_id, unread_count, conversations(id, title, type, tribe_id, updated_at, tribes(name, members_count))")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    : extended;

  if (error) {
    if (isMissingOptionalTable(error)) {
      return [];
    }

    throw error;
  }

  return (data || []).map((item) => ({
    ...item.conversations,
    unread_count: item.unread_count || 0
  }));
}

export async function listMessages(conversationId) {
  const { data, error } = await client()
    .from("messages")
    .select("id, conversation_id, sender_id, content, created_at, profiles(name, username, avatar_url)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingOptionalTable(error)) {
      return [];
    }

    throw error;
  }

  return data || [];
}

export async function sendMessage(conversationId, userId, content) {
  const { data, error } = await client()
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: userId,
      content
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getOrCreateConversation(currentUserId, otherUserId, bookId = null) {
  if (!otherUserId || currentUserId === otherUserId) {
    throw new Error("Escolha outro leitor para conversar.");
  }

  const database = client();
  const currentMemberships = await database
    .from("conversation_members")
    .select("conversation_id")
    .eq("user_id", currentUserId);

  if (currentMemberships.error) {
    if (isMissingOptionalTable(currentMemberships.error)) {
      throw new Error("A tabela de conversas ainda não foi aplicada no Supabase.");
    }

    throw currentMemberships.error;
  }

  const currentConversationIds = (currentMemberships.data || []).map((item) => item.conversation_id);

  if (currentConversationIds.length) {
    const otherMemberships = await database
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", otherUserId)
      .in("conversation_id", currentConversationIds);

    if (otherMemberships.error) {
      throw otherMemberships.error;
    }

    const sharedConversationIds = (otherMemberships.data || []).map((item) => item.conversation_id);

    if (sharedConversationIds.length) {
      const directConversation = await database
        .from("conversations")
        .select("id")
        .eq("type", "direct")
        .in("id", sharedConversationIds)
        .limit(1);

      if (directConversation.error) {
        throw directConversation.error;
      }

      const existingId = directConversation.data?.[0]?.id;
      if (existingId) {
        return { id: existingId };
      }
    }
  }

  const [currentProfile, otherProfile] = await Promise.all([
    getProfile(currentUserId),
    getProfile(otherUserId)
  ]);
  const title = `${currentProfile?.name || "Leitor"} e ${otherProfile?.name || "Leitor"}`;
  const conversation = {
    id: crypto.randomUUID(),
    title,
    type: "direct",
    created_by: currentUserId,
    book_id: bookId || null
  };
  const conversationResult = await database
    .from("conversations")
    .insert(conversation);

  if (conversationResult.error) {
    const message = String(conversationResult.error.message || "").toLowerCase();

    if (message.includes("book_id") || message.includes("column")) {
      const fallback = await database
        .from("conversations")
        .insert({
          id: conversation.id,
          title,
          type: "direct",
          created_by: currentUserId
        });

      if (fallback.error) {
        throw fallback.error;
      }
    } else {
      throw conversationResult.error;
    }
  }

  const membersResult = await database
    .from("conversation_members")
    .insert([
      { conversation_id: conversation.id, user_id: currentUserId },
      { conversation_id: conversation.id, user_id: otherUserId }
    ]);

  if (membersResult.error) {
    throw membersResult.error;
  }

  return conversation;
}

export function subscribeToConversation(conversationId, onMessage) {
  if (!supabase || !conversationId) {
    return null;
  }

  return supabase
    .channel(`conversation:${conversationId}`)
    .on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "messages",
      filter: `conversation_id=eq.${conversationId}`
    }, (payload) => onMessage?.(payload.new))
    .subscribe();
}

function isMissingOptionalTable(error) {
  const message = String(error?.message || "").toLowerCase();
  return error?.code === "42P01" || message.includes("does not exist") || message.includes("schema cache") || message.includes("relationship") || message.includes("column");
}
