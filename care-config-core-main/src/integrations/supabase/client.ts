import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { shouldBlockWrite, createMockWriteError } from "@/lib/demoModeGuard";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Create the base Supabase client
const baseSupabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Wraps the Supabase client to block write operations in demo mode.
 * This ensures demo mode is read-only as per CARE_SYSTEM_CONTEXT.md requirements.
 */
function createDemoGuardedClient(client: SupabaseClient): SupabaseClient {
  return new Proxy(client, {
    get(target, prop) {
      const value = target[prop as keyof SupabaseClient];

      // Intercept the 'from' method to wrap table operations
      if (prop === "from") {
        return function (table: string) {
          const queryBuilder = value.call(target, table);

          // Wrap write operations on the query builder
          return new Proxy(queryBuilder, {
            get(queryTarget, queryProp) {
              const queryValue = queryTarget[queryProp as keyof typeof queryTarget];

              // Intercept write operations
              if (queryProp === "insert" || queryProp === "upsert") {
                return function (...args: any[]) {
                  const operation = queryProp === "insert" ? "insert" : "upsert";
                  if (shouldBlockWrite(operation)) {
                    return Promise.resolve(createMockWriteError(operation));
                  }
                  return queryValue.apply(queryTarget, args);
                };
              }

              if (queryProp === "update") {
                return function (...args: any[]) {
                  if (shouldBlockWrite("update")) {
                    return Promise.resolve(createMockWriteError("update"));
                  }
                  return queryValue.apply(queryTarget, args);
                };
              }

              if (queryProp === "delete") {
                return function (...args: any[]) {
                  if (shouldBlockWrite("delete")) {
                    return Promise.resolve(createMockWriteError("delete"));
                  }
                  return queryValue.apply(queryTarget, args);
                };
              }

              // For all other operations, return as-is (reads are allowed)
              if (typeof queryValue === "function") {
                return queryValue.bind(queryTarget);
              }
              return queryValue;
            },
          });
        };
      }

      // For all other properties/methods, return as-is
      if (typeof value === "function") {
        return value.bind(target);
      }
      return value;
    },
  }) as SupabaseClient;
}

// Export the demo-guarded Supabase client
export const supabase = createDemoGuardedClient(baseSupabase);
