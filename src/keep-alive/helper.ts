import { SupabaseClient } from "@supabase/supabase-js";
import { keepAliveConfig as config } from "./config";

export type QueryResponse = {
  successful: boolean;
  message: string;
};

export type QueryResponseWithData = QueryResponse & {
  data: any[] | null;
};

const defaultRandomStringLength = 12;
const alphabetOffset = "a".charCodeAt(0);

export const generateRandomString = (
  length: number = defaultRandomStringLength
) => {
  let str = "";
  for (let i = 0; i < length; i++) {
    str += String.fromCharCode(alphabetOffset + Math.floor(Math.random() * 26));
  }
  return str;
};

export const retrieveEntries = async (
  supabase: SupabaseClient
): Promise<QueryResponseWithData> => {
  const { data, error } = await supabase
    .from(config.table)
    .select(config.column);

  const messageInfo = `Results for retrieving entries from '${config.table}' - '${config.column}' column`;

  if (error) {
    const errorInfo = `${messageInfo}: ${error.message}`;
    if (config.consoleLogOnError) console.log(errorInfo);
    return { successful: false, message: errorInfo, data: null };
  }

  return {
    successful: true,
    message: `${messageInfo}: ${JSON.stringify(data)}`,
    data,
  };
};

export const insertRandom = async (
  supabase: SupabaseClient,
  randomString: string
): Promise<QueryResponse> => {
  const { data, error } = await supabase
    .from(config.table)
    .upsert({ [config.column]: randomString })
    .select();

  const messageInfo = `Results for upserting '${randomString}' into '${config.table}'`;

  if (error) {
    const errorInfo = `${messageInfo}: ${error.message}`;
    if (config.consoleLogOnError) console.log(errorInfo);
    return { successful: false, message: errorInfo };
  }

  return {
    successful: true,
    message: `${messageInfo}: ${JSON.stringify(data)}`,
  };
};

export const deleteRandom = async (
  supabase: SupabaseClient,
  entryToDelete: any
): Promise<QueryResponse> => {
  const { error } = await supabase
    .from(config.table)
    .delete()
    .eq(config.column, entryToDelete);

  const messageInfo = `Results for deleting '${entryToDelete}' from '${config.table}'`;

  if (error) {
    const errorInfo = `${messageInfo}: ${error.message}`;
    if (config.consoleLogOnError) console.log(errorInfo);
    return { successful: false, message: errorInfo };
  }

  return { successful: true, message: `${messageInfo}: success` };
};

export const determineAction = async (
  supabase: SupabaseClient
): Promise<QueryResponse> => {
  const retrieval = await retrieveEntries(supabase);

  if (!retrieval.successful) {
    return {
      successful: false,
      message: `Failed to retrieve entries from ${config.table}: ${retrieval.message}`,
    };
  }

  const entries = retrieval.data ?? [];
  let resultMessage = `${retrieval.message}\n\n`;
  let success = true;

  if (entries.length > config.sizeBeforeDeletions) {
    const entryToDelete = entries.pop();
    const deletion = await deleteRandom(supabase, entryToDelete[config.column]);
    success &&= deletion.successful;
    resultMessage += deletion.message;
  } else if (config.allowInsertionAndDeletion) {
    const insert = await insertRandom(supabase, generateRandomString());
    success &&= insert.successful;
    resultMessage += insert.message;
  }

  return { successful: success, message: resultMessage };
};
