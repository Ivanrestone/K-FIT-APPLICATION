declare namespace Deno {
  export interface ServeOptions {
    port?: number;
    hostname?: string;
  }
  export function serve(
    handler: (request: Request) => Promise<Response> | Response,
  ): void;
  export function serve(
    options: ServeOptions,
    handler: (request: Request) => Promise<Response> | Response,
  ): void;
  export namespace env {
    export function get(key: string): string | undefined;
  }
}
