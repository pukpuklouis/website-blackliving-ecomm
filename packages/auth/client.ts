import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "http://localhost:8787", // Always point to API server for auth
});

export const { signIn, signOut, signUp, useSession } = authClient;