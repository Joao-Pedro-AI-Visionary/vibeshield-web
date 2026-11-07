import { describe, expect, it, vi } from "vitest";
import { ApiError, ERROR_MESSAGES, scanRepo, validateRepoUrl } from "../../src/api/client";
import type { ApiErrorCode } from "../../src/api/types";
import sample from "../../e2e/fixtures/scan.json";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("validateRepoUrl (mesma regex do contrato)", () => {
  const valid = [
    "https://github.com/owner/repo",
    "https://github.com/owner/repo/",
    "https://github.com/owner/repo.git",
    "https://github.com/a/b",
    "https://github.com/my-org/my.repo_name-2",
    "https://github.com/vuejs/core",
  ];
  const invalid = [
    "http://github.com/owner/repo",
    "https://gitlab.com/owner/repo",
    "https://user:pass@github.com/owner/repo",
    "https://github.com/owner/repo?x=1",
    "https://github.com/owner/repo#readme",
    "https://github.com/owner/repo/tree/main",
    "https://github.com:443/owner/repo",
    "https://github.com/owner/..",
    "https://github.com/owner/.",
    "https://github.com/-owner/repo",
    "https://github.com/owner",
    "https://github.com/../repo",
    "",
    "github.com/owner/repo",
  ];
  it.each(valid)("aceita %s", (url) => {
    expect(validateRepoUrl(url)).toBeNull();
  });
  it.each(invalid)("rejeita %s", (url) => {
    expect(validateRepoUrl(url)).toMatch(/\S/);
  });
});

describe("scanRepo", () => {
  it("envia POST /scans com o corpo do contrato e devolve o resultado", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, sample));
    const result = await scanRepo(
      { repo_url: "https://github.com/owner/repo", check_dependencies: false },
      { fetchImpl: fetchMock, baseUrl: "http://x.test/api/v1" },
    );
    expect(result.score).toBe(sample.score);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://x.test/api/v1/scans");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      repo_url: "https://github.com/owner/repo",
      check_dependencies: false,
    });
  });

  it("não chama a API se a URL é inválida", async () => {
    const fetchMock = vi.fn();
    await expect(
      scanRepo({ repo_url: "https://github.com/owner/repo/tree/main" }, { fetchImpl: fetchMock }),
    ).rejects.toMatchObject({ code: "INVALID_REPO_URL" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  const cases: Array<[number, ApiErrorCode]> = [
    [400, "INVALID_REPO_URL"],
    [400, "INVALID_BODY"],
    [404, "REPO_NOT_FOUND"],
    [413, "REPO_TOO_LARGE"],
    [429, "RATE_LIMITED"],
    [502, "UPSTREAM_ERROR"],
    [504, "SCAN_TIMEOUT"],
    [500, "INTERNAL"],
  ];
  it.each(cases)("status %i / %s vira ApiError com mensagem amigável", async (status, code) => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(status, { error: { code, message: "server text" } }));
    const err = await scanRepo({ repo_url: "https://github.com/o/r" }, { fetchImpl: fetchMock }).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe(code);
    expect(err.status).toBe(status);
    expect(err.message).toBe(ERROR_MESSAGES[code]);
  });

  it("corpo de erro fora do formato vira UNKNOWN com status", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("<html>bad gateway</html>", { status: 502 }));
    const err = await scanRepo({ repo_url: "https://github.com/o/r" }, { fetchImpl: fetchMock }).catch((e) => e);
    expect(err.code).toBe("UNKNOWN");
    expect(err.status).toBe(502);
  });

  it("falha de rede vira NETWORK_ERROR (API fora do ar)", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    const err = await scanRepo({ repo_url: "https://github.com/o/r" }, { fetchImpl: fetchMock }).catch((e) => e);
    expect(err.code).toBe("NETWORK_ERROR");
    expect(err.message).toMatch(/API fora do ar/);
  });

  it("aborta após o timeout e devolve CLIENT_TIMEOUT", async () => {
    vi.useFakeTimers();
    try {
      const fetchMock = vi.fn(
        (_url: URL | RequestInfo, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
          }),
      );
      const promise = scanRepo({ repo_url: "https://github.com/o/r" }, { fetchImpl: fetchMock, timeoutMs: 90_000 }).catch(
        (e) => e,
      );
      await vi.advanceTimersByTimeAsync(89_999);
      expect((fetchMock.mock.calls[0]?.[1] as RequestInit).signal?.aborted).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      const err = await promise;
      expect(err.code).toBe("CLIENT_TIMEOUT");
    } finally {
      vi.useRealTimers();
    }
  });

  it("resposta 200 sem o formato esperado vira INVALID_RESPONSE", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    const err = await scanRepo({ repo_url: "https://github.com/o/r" }, { fetchImpl: fetchMock }).catch((e) => e);
    expect(err.code).toBe("INVALID_RESPONSE");
  });
});
