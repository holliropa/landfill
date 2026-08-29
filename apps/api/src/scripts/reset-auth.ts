export {};

if (!process.argv.includes("--yes")) {
  console.error(
    "Refusing to reset authentication without --yes. This removes the owner password and all sessions.",
  );
  process.exitCode = 1;
} else {
  const [{ resetAuthentication }, { default: db }] = await Promise.all([
    import("@/application/auth/auth-service"),
    import("@/infrastructure/db"),
  ]);

  try {
    resetAuthentication();
    console.log(
      "Authentication reset. Restart Landfill and use the new setup code printed in the API logs.",
    );
  } finally {
    db.$client.close();
  }
}
