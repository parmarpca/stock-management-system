import { supabase } from "../src/integrations/supabase/client";
import {
  determineAction,
  QueryResponse,
  generateRandomString,
} from "../src/keep-alive/helper";
import { keepAliveConfig as config } from "../src/keep-alive/config";

const querySupabase = async (
  randomStringLength: number = 12
): Promise<QueryResponse> => {
  const currentRandomString = generateRandomString(randomStringLength);

  const { data, error } = await (supabase as any)
    .from(config.table)
    .select("*")
    .eq(config.column, currentRandomString);

  const messageInfo: string = `Results for retrieving '${currentRandomString}' from '${config.table}' at column '${config.column}'`;

  if (error) {
    const errorInfo = `${messageInfo}: ${error.message}`;
    if (config.consoleLogOnError) console.log(errorInfo);
    return {
      successful: false,
      message: errorInfo,
    };
  }

  return {
    successful: true,
    message: `${messageInfo}: ${JSON.stringify(data)}`,
  };
};

const fetchOtherEndpoints = async (): Promise<string[]> => {
  if (config?.otherEndpoints != null && config.otherEndpoints.length > 0) {
    const fetchPromises = config.otherEndpoints.map(async (endpoint) => {
      const endpointResults = await fetch(endpoint, { cache: "no-store" });
      const passOrFail = endpointResults?.status === 200 ? "Passed" : "Failed";
      return `${endpoint} - ${passOrFail}`;
    });

    return Promise.all(fetchPromises);
  }
  return [];
};

export default async function handler(req: any, res: any) {
  let responseMessage = "";
  let successfulResponses = true;

  if (config.disableRandomStringQuery === false) {
    const querySupabaseResponse = await querySupabase();

    successfulResponses =
      successfulResponses && querySupabaseResponse.successful;
    responseMessage += querySupabaseResponse.message + "\n\n";
  }

  if (config?.allowInsertionAndDeletion === true) {
    const insertOrDeleteResults = await determineAction(supabase as any);

    successfulResponses =
      successfulResponses && insertOrDeleteResults.successful;
    responseMessage += insertOrDeleteResults.message + "\n\n";
  }

  if (config?.otherEndpoints != null && config.otherEndpoints.length > 0) {
    const fetchResults = await fetchOtherEndpoints();
    responseMessage += `\n\nOther Endpoint Results:\n${fetchResults.join(
      "\n"
    )}`;
  }

  res.status(successfulResponses ? 200 : 400).send(responseMessage);
}
