function cors(origin, allowedOrigin) {
  const accepted = origin === allowedOrigin || origin.startsWith("http://127.0.0.1:") || origin.startsWith("http://localhost:");
  return {
    "Access-Control-Allow-Origin": accepted ? origin : allowedOrigin,
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = cors(origin, env.ALLOWED_ORIGIN);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers });
    if (origin !== env.ALLOWED_ORIGIN && !origin.startsWith("http://127.0.0.1:") && !origin.startsWith("http://localhost:"))
      return Response.json({ error: "Origin not allowed" }, { status: 403, headers });

    const authorization = request.headers.get("Authorization") || "";
    const idToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!idToken) return Response.json({ error: "Unauthorized" }, { status: 401, headers });

    const firebaseResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(env.FIREBASE_API_KEY)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      },
    );
    if (!firebaseResponse.ok)
      return Response.json({ error: "Invalid session" }, { status: 401, headers });
    const firebaseUser = await firebaseResponse.json();
    if (firebaseUser.users?.[0]?.localId !== env.FIREBASE_ADMIN_UID)
      return Response.json({ error: "Forbidden" }, { status: 403, headers });

    const githubResponse = await fetch(
      `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/actions/workflows/${env.GITHUB_WORKFLOW}/dispatches`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          "User-Agent": "sdeskinfo-video-trigger",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({ ref: "main" }),
      },
    );
    if (!githubResponse.ok) {
      const detail = await githubResponse.text();
      console.error("GitHub dispatch failed", githubResponse.status, detail);
      return Response.json({ error: "Could not start workflow" }, { status: 502, headers });
    }
    return Response.json({ started: true }, { status: 202, headers });
  },
};
