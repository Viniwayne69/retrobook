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
  const { data, error } = await client()
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
    .single();

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
  const { data, error } = await database
    .from("posts")
    .select("id, user_id, book_title, content, likes_count, created_at, profiles(name, username, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(80);

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
  const { data, error } = await client()
    .from("posts")
    .insert({
      user_id: userId,
      book_title: payload.book_title,
      content: payload.content
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
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
