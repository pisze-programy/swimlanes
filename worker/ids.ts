const alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function randomId(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let result = "";
  for (const byte of bytes) {
    result += alphabet.charAt(byte % alphabet.length);
  }
  return result;
}

const idPattern = /^[0-9A-Za-z_-]{4,64}$/;

export function isValidId(id: string): boolean {
  return idPattern.test(id);
}
