// Ambient declarations to silence TypeScript errors when editing Supabase Edge Functions
// These are only for local IDE IntelliSense and do not affect runtime.

// Minimal Deno global typings we rely on
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// Declare remote ESM modules so TypeScript doesn't complain
// Note: The actual implementation comes from the remote URL at runtime (Deno).
// We just export "any" to avoid type mismatches without installing full typings.

declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2.39.6" {
  // Re-export as any to keep typing simple for IDE; adjust as needed.
  const value: any;
  export = value;
}
