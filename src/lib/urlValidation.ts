/**
 * Validates that a URL is safe to fetch (prevents SSRF attacks).
 * Blocks private/internal IP ranges and non-HTTP protocols.
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Only allow http and https
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block localhost variants
    if (hostname === "localhost" || hostname === "[::1]") {
      return false;
    }

    // Block private IP ranges:
    // 127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 0.0.0.0
    const privateIpPattern =
      /^(127\.\d{1,3}\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|0\.0\.0\.0|169\.254\.\d{1,3}\.\d{1,3})$/;

    if (privateIpPattern.test(hostname)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
