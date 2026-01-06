import { hashPassword } from "better-auth/crypto";

async function main() {
  const password = "password1234";
  try {
    const hash = await hashPassword(password);
    console.log(`Password: ${password}`);
    console.log(`Hash: ${hash}`);
  } catch (error) {
    console.error("Error hashing password:", error);
    // Fallback if named export fails, try default
    try {
      const crypto = await import("better-auth/crypto");
      console.log("Available exports:", Object.keys(crypto));
      if (crypto.default && crypto.default.hashPassword) {
        const hash = await crypto.default.hashPassword(password);
        console.log(`Hash (via default): ${hash}`);
      }
    } catch (e) {
      console.error("Inspection failed", e);
    }
  }
}

main();
