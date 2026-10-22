// Server-side loader for dossier feeds (vault, saved list, dashboard). Returns
// the rows plus this user's votes and saves so every card renders in the right
// state.
export async function loadFeed(supabase, user, { sort = "new", ids, mine } = {}) {
  let query = supabase
    .from("generation_feed")
    .select("*")
    .order(sort === "top" ? "score" : "created_at", { ascending: false });

  if (sort === "top") query = query.order("created_at", { ascending: false });
  if (ids) query = query.in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  if (mine) query = query.eq("user_id", user.id);

  const [{ data: rows, error }, { data: votes }, { data: saves }] = await Promise.all([
    query,
    supabase.from("votes").select("generation_id, value").eq("user_id", user.id),
    supabase.from("saves").select("generation_id").eq("user_id", user.id),
  ]);

  return {
    rows: rows ?? [],
    error,
    voteMap: new Map((votes ?? []).map((v) => [v.generation_id, v.value])),
    savedSet: new Set((saves ?? []).map((s) => s.generation_id)),
  };
}

export async function loadSavedIds(supabase, user) {
  const { data } = await supabase
    .from("saves")
    .select("generation_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return (data ?? []).map((s) => s.generation_id);
}
