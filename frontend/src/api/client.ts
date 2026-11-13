import type { components, paths } from "./schema";

export type ErrorEnvelope = components["schemas"]["ErrorEnvelope"];

type JsonBody<Response> = Response extends {
  content: { "application/json": infer Body };
}
  ? Body
  : never;

type ResponseFor<Responses, Status extends PropertyKey> = Status extends keyof Responses
  ? JsonBody<Responses[Status]>
  : never;

type OperationBody<Operation> = Operation extends { responses: infer Responses }
  ? ResponseFor<Responses, "200" | "201" | "202">
  : never;

type ApiPath = keyof paths;
type ApiMethod<Path extends ApiPath> = Extract<keyof paths[Path], "get" | "post">;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly envelope: ErrorEnvelope | null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<
  Path extends ApiPath,
  Method extends ApiMethod<Path>,
>(
  path: Path,
  method: Method,
  init?: RequestInit,
): Promise<OperationBody<paths[Path][Method]>> {
  const response = await fetch(path, {
    ...init,
    method: method.toUpperCase(),
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const envelope =
      typeof body === "object" && body !== null && "error" in body
        ? (body as ErrorEnvelope)
        : null;
    throw new ApiError(
      envelope?.error.message ?? `Request failed with status ${response.status}`,
      response.status,
      envelope,
    );
  }
  return (await response.json()) as OperationBody<paths[Path][Method]>;
}
