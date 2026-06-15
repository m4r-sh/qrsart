// URL-Safe Base64 with QR- prefix (for URLs, filesystems, HTML/SVG)

export function encodeQRString(bytes) {
  return 'QR-' + toUrlSafeBase64(bytes)
}

export function decodeQRString(str) {
  const upper = str.toUpperCase();
  if (upper.startsWith('QR-')){ str = str.slice(3); }
  else if (upper.startsWith('QR')){ str = str.slice(2); }
  return fromUrlSafeBase64(str);
}

function toUrlSafeBase64(bytes) {
  let binary = '';
  for (let byte of bytes) { binary += String.fromCharCode(byte) }
  let b64 = btoa(binary);
  return b64.replace(/\+/g, '-') .replace(/\//g, '_') .replace(/=/g, '') 
}

function fromUrlSafeBase64(str) {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const binary = atob(b64);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}


