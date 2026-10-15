import { connection } from "next/server";
import { todayInAppTz } from "./domain/dates";

/**
 * Today's date in the app timezone, evaluated per request (not at build time).
 * Pass it to client components instead of reading the clock during render.
 */
export async function requestToday(): Promise<string> {
  await connection();
  return todayInAppTz();
}
