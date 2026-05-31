export function successResponse(data, status = 200) {
  return new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function errorResponse(error, code = 'error', status = 500) {
  return new Response(JSON.stringify({ success: false, error, code }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function validarEmail(email) {
  if (typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

export function validarCantidad(cantidad) {
  const numero = Number(cantidad);
  return Number.isInteger(numero) && numero >= 1 && numero <= 100;
}

export function sanitizar(str) {
  if (typeof str !== 'string') return '';
  const sinHtml = str.replace(/<[^>]*>/g, '').trim();
  return sinHtml.slice(0, 255);
}
