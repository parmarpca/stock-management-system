import { createClient } from "@supabase/supabase-js";

const config = {
  table: "keep-alive",
  column: "name",
  allowInsertionAndDeletion: true,
  sizeBeforeDeletions: 10,
  consoleLogOnError: true,
};

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const generateRandomString = (length = 12) => {
  const alphabetOffset = "a".charCodeAt(0);
  let str = "";
  for (let i = 0; i < length; i++) {
    str += String.fromCharCode(alphabetOffset + Math.floor(Math.random() * 26));
  }
  return str;
};

async function retrieveEntries() {
  const { data, error } = await supabase
    .from(config.table)
    .select(config.column);

  if (error) {
    console.error("Error retrieving entries:", error.message);
    return { successful: false, data: null };
  }

  return { successful: true, data };
}

async function insertRandom(randomString) {
  const { error } = await supabase
    .from(config.table)
    .upsert({ [config.column]: randomString });

  if (error) {
    console.error("Error inserting random string:", error.message);
    return false;
  }

  return true;
}

async function deleteRandom(entryToDelete) {
  const { error } = await supabase
    .from(config.table)
    .delete()
    .eq(config.column, entryToDelete);

  if (error) {
    console.error("Error deleting entry:", error.message);
    return false;
  }

  return true;
}

async function main() {
  try {
    console.log("Starting keep-alive process...");

    const { successful, data: entries } = await retrieveEntries();
    if (!successful) {
      console.error("Failed to retrieve entries");
      process.exit(1);
    }

    if (entries.length > config.sizeBeforeDeletions) {
      console.log("Table size exceeded threshold, removing oldest entry...");
      const entryToDelete = entries[0][config.column];
      const deleted = await deleteRandom(entryToDelete);
      if (!deleted) {
        console.error("Failed to delete entry");
        process.exit(1);
      }
    }

    if (config.allowInsertionAndDeletion) {
      console.log("Inserting new random entry...");
      const randomString = generateRandomString();
      const inserted = await insertRandom(randomString);
      if (!inserted) {
        console.error("Failed to insert new entry");
        process.exit(1);
      }
    }

    console.log("Keep-alive process completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Unexpected error:", error);
    process.exit(1);
  }
}

main();
