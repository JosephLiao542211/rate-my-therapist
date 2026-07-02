import "dotenv/config";
import readline from "readline";
import pg from "pg";

const WARNING = `
⚠️  WARNING: This will permanently delete ALL therapists, clinics, and
    therapist-clinic associations from the database.
    Reviews linked to therapists will also be deleted (CASCADE).

    This cannot be undone.
`;

async function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "yes");
    });
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("❌  DATABASE_URL is not set.");
    process.exit(1);
  }

  console.log(WARNING);

  const ok = await confirm('Type "yes" to continue: ');
  if (!ok) {
    console.log("Aborted.");
    process.exit(0);
  }

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const { rowCount: tc } = await pool.query("DELETE FROM therapist_clinics");
    const { rowCount: cl } = await pool.query("DELETE FROM clinics");
    const { rowCount: th } = await pool.query("DELETE FROM therapists");
    console.log(`\n✅  Deleted:`);
    console.log(`    ${th ?? 0} therapists`);
    console.log(`    ${cl ?? 0} clinics`);
    console.log(`    ${tc ?? 0} therapist-clinic links\n`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
