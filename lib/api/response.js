export function apiOk(data, meta = {}) {
  const { _cacheSeconds, ...cleanMeta } = meta;
  const cacheHeader = _cacheSeconds
    ? `public, s-maxage=${_cacheSeconds}, stale-while-revalidate=${_cacheSeconds * 5}`
    : "private, no-store";
  return Response.json(
    { ok: true, data, meta: { generatedAt: new Date().toISOString(), ...cleanMeta } },
    { headers: { "Cache-Control": cacheHeader } }
  );
}

export function apiError(code, message, status = 400) {
  return Response.json(
    { ok: false, error: { code, message } },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}
