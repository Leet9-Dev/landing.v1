export function apiOk(data, meta = {}) {
  return Response.json({
    ok: true,
    data,
    meta: { source: "mock", generatedAt: new Date().toISOString(), ...meta },
  });
}

export function apiError(code, message, status = 400) {
  return Response.json(
    { ok: false, error: { code, message } },
    { status }
  );
}
