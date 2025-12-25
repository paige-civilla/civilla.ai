import { Router, Request, Response } from "express";
import { randomBytes, createHash } from "crypto";
import { storage } from "./storage";

const router = Router();

function generateState(): string {
  return randomBytes(32).toString("hex");
}

function generateCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

function generateCodeChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

async function upsertUserWithIdentity(
  provider: string,
  providerUserId: string,
  email: string | null,
  req: Request
): Promise<string> {
  const existingIdentity = await storage.getAuthIdentity(provider, providerUserId);
  
  if (existingIdentity) {
    return existingIdentity.userId;
  }

  let user = email ? await storage.getUserByEmail(email) : null;
  
  if (!user && email) {
    user = await storage.createUser({ email, passwordHash: null });
  } else if (!user) {
    const tempEmail = `${provider}_${providerUserId}@temp.civilla.ai`;
    user = await storage.createUser({ email: tempEmail, passwordHash: null });
  }

  await storage.createAuthIdentity({
    userId: user.id,
    provider,
    providerUserId,
    emailAtProvider: email,
  });

  return user.id;
}

router.get("/google/start", (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URL;

  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: "Google OAuth not configured" });
  }

  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  req.session.oauthState = state;
  req.session.codeVerifier = codeVerifier;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    access_type: "offline",
    prompt: "consent",
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get("/google/callback", async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      console.error("Google OAuth error:", error);
      return res.redirect("/login?error=oauth_denied");
    }

    if (!code || typeof code !== "string") {
      return res.redirect("/login?error=missing_code");
    }

    if (state !== req.session.oauthState) {
      return res.redirect("/login?error=invalid_state");
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URL;
    const codeVerifier = req.session.codeVerifier;

    if (!clientId || !clientSecret || !redirectUri) {
      return res.redirect("/login?error=oauth_not_configured");
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code_verifier: codeVerifier || "",
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.id_token) {
      console.error("No ID token in response:", tokens);
      return res.redirect("/login?error=token_error");
    }

    const idTokenPayload = JSON.parse(
      Buffer.from(tokens.id_token.split(".")[1], "base64").toString()
    );

    const providerUserId = idTokenPayload.sub;
    const email = idTokenPayload.email;

    if (!providerUserId) {
      return res.redirect("/login?error=missing_user_id");
    }

    const userId = await upsertUserWithIdentity("google", providerUserId, email, req);

    delete req.session.oauthState;
    delete req.session.codeVerifier;
    req.session.userId = userId;

    res.redirect("/app/cases");
  } catch (error) {
    console.error("Google callback error:", error);
    res.redirect("/login?error=oauth_error");
  }
});

router.get("/apple/start", (req: Request, res: Response) => {
  const clientId = process.env.APPLE_CLIENT_ID;
  const redirectUri = process.env.APPLE_REDIRECT_URL;

  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: "Apple OAuth not configured" });
  }

  const state = generateState();
  req.session.oauthState = state;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code id_token",
    scope: "name email",
    response_mode: "form_post",
    state,
  });

  res.redirect(`https://appleid.apple.com/auth/authorize?${params}`);
});

router.post("/apple/callback", async (req: Request, res: Response) => {
  try {
    const { code, state, id_token, error, user } = req.body;

    if (error) {
      console.error("Apple OAuth error:", error);
      return res.redirect("/login?error=oauth_denied");
    }

    if (state !== req.session.oauthState) {
      return res.redirect("/login?error=invalid_state");
    }

    if (!id_token) {
      return res.redirect("/login?error=missing_token");
    }

    const idTokenPayload = JSON.parse(
      Buffer.from(id_token.split(".")[1], "base64").toString()
    );

    const providerUserId = idTokenPayload.sub;
    let email = idTokenPayload.email;

    if (user) {
      try {
        const userData = typeof user === "string" ? JSON.parse(user) : user;
        if (userData.email) {
          email = userData.email;
        }
      } catch (e) {
        console.log("Could not parse Apple user data");
      }
    }

    if (!providerUserId) {
      return res.redirect("/login?error=missing_user_id");
    }

    const userId = await upsertUserWithIdentity("apple", providerUserId, email, req);

    delete req.session.oauthState;
    req.session.userId = userId;

    res.redirect("/app/cases");
  } catch (error) {
    console.error("Apple callback error:", error);
    res.redirect("/login?error=oauth_error");
  }
});

declare module "express-session" {
  interface SessionData {
    oauthState?: string;
    codeVerifier?: string;
  }
}

export default router;
