import { expectedStatusJsonSchema, httpHeadersJsonSchema } from '@uptimer/db';
import { z } from 'zod';

function isValidPort(n: number): boolean {
  return Number.isInteger(n) && n >= 1 && n <= 65535;
}

// v0.x baseline:
// - allow 80/443
// - allow >=1024 to avoid obvious port-scanning of well-known ports
function isAllowedPort(n: number): boolean {
  return n === 80 || n === 443 || (n >= 1024 && n <= 65535);
}

function isIpv4Literal(host: string): boolean {
  const parts = host.split('.');
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    if (p.length === 0) return false;
    if (!/^[0-9]+$/.test(p)) return false;
    const n = Number(p);
    return Number.isInteger(n) && n >= 0 && n <= 255;
  });
}

function ipv4ToInt(host: string): number {
  const parts = host.split('.');
  if (parts.length !== 4) {
    throw new Error('Invalid IPv4 literal');
  }
  const [aStr, bStr, cStr, dStr] = parts as [string, string, string, string];
  const a = Number(aStr);
  const b = Number(bStr);
  const c = Number(cStr);
  const d = Number(dStr);
  return ((a << 24) | (b << 16) | (c << 8) | d) >>> 0;
}

function ipv4InCidr(ip: number, base: string, maskBits: number): boolean {
  const baseInt = ipv4ToInt(base);
  const mask = maskBits === 0 ? 0 : ((0xffffffff << (32 - maskBits)) >>> 0);
  return (ip & mask) === (baseInt & mask);
}

function isBlockedIpLiteral(host: string): boolean {
  const lower = host.toLowerCase();
  if (lower === '::1' || lower === '::') return true;
  if (lower === '0:0:0:0:0:0:0:1' || lower === '0:0:0:0:0:0:0:0') return true;
  if (lower.includes(':')) {
    if (lower.startsWith('fe80:')) return true; // IPv6 link-local
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // IPv6 ULA (fc00::/7)
  }

  if (!isIpv4Literal(host)) return false;
  const ip = ipv4ToInt(host);

  return (
    ipv4InCidr(ip, '0.0.0.0', 8) || // "this" network
    ipv4InCidr(ip, '10.0.0.0', 8) ||
    ipv4InCidr(ip, '100.64.0.0', 10) || // carrier-grade NAT
    ipv4InCidr(ip, '127.0.0.0', 8) ||
    ipv4InCidr(ip, '169.254.0.0', 16) || // link-local
    ipv4InCidr(ip, '172.16.0.0', 12) ||
    ipv4InCidr(ip, '192.168.0.0', 16) ||
    ipv4InCidr(ip, '192.0.2.0', 24) || // TEST-NET-1
    ipv4InCidr(ip, '198.18.0.0', 15) || // benchmark
    ipv4InCidr(ip, '224.0.0.0', 4) || // multicast
    ipv4InCidr(ip, '240.0.0.0', 4) // reserved
  );
}

function validateHttpTarget(target: string): string | null {
  let url: URL;
  try {
    url = new URL(target);
  } catch {
    return 'target must be a valid URL';
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return 'target protocol must be http or https';
  }

  const hostname = url.hostname;
  if (!hostname) return 'target must include a hostname';
  if (hostname.toLowerCase() === 'localhost') return 'target hostname is not allowed';
  if (isBlockedIpLiteral(hostname)) return 'target hostname is not allowed';

  const port = url.port ? Number(url.port) : url.protocol === 'http:' ? 80 : 443;
  if (!isValidPort(port)) return 'target port is invalid';
  if (!isAllowedPort(port)) return 'target port is not allowed';

  return null;
}

function parseTcpTarget(target: string): { host: string; port: number } | null {
  const trimmed = target.trim();
  if (trimmed.length === 0) return null;

  // IPv6 form: [::1]:443
  if (trimmed.startsWith('[')) {
    const end = trimmed.indexOf(']');
    if (end === -1) return null;
    const host = trimmed.slice(1, end);
    const rest = trimmed.slice(end + 1);
    if (!rest.startsWith(':')) return null;
    const port = Number(rest.slice(1));
    if (!isValidPort(port)) return null;
    return { host, port };
  }

  const idx = trimmed.lastIndexOf(':');
  if (idx <= 0) return null;
  const host = trimmed.slice(0, idx);
  const port = Number(trimmed.slice(idx + 1));
  if (!isValidPort(port)) return null;
  return { host, port };
}

function validateTcpTarget(target: string): string | null {
  const parsed = parseTcpTarget(target);
  if (!parsed) return 'target must be in host:port format (IPv6: [addr]:port)';

  const host = parsed.host.trim();
  if (host.length === 0) return 'target host is required';
  if (host.toLowerCase() === 'localhost') return 'target host is not allowed';
  if (isBlockedIpLiteral(host)) return 'target host is not allowed';

  if (!isAllowedPort(parsed.port)) return 'target port is not allowed';
  return null;
}

export const createMonitorInputSchema = z
  .object({
    name: z.string().min(1),
    type: z.enum(['http', 'tcp']),
    target: z.string().min(1),

    interval_sec: z.number().int().min(60).optional(),
    timeout_ms: z.number().int().min(1000).optional(),

    http_method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD']).optional(),
    http_headers_json: httpHeadersJsonSchema.optional(),
    http_body: z.string().optional(),
    expected_status_json: expectedStatusJsonSchema.optional(),
    response_keyword: z.string().min(1).optional(),
    response_forbidden_keyword: z.string().min(1).optional(),

    is_active: z.boolean().optional(),
  })
  .superRefine((val, ctx) => {
    const err = val.type === 'http' ? validateHttpTarget(val.target) : validateTcpTarget(val.target);
    if (err) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: err, path: ['target'] });
    }

    if (
      val.type === 'tcp' &&
      (val.http_method !== undefined ||
        val.http_headers_json !== undefined ||
        val.http_body !== undefined ||
        val.expected_status_json !== undefined ||
        val.response_keyword !== undefined ||
        val.response_forbidden_keyword !== undefined)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'http_* fields are not allowed for tcp monitors',
      });
    }
  });

export type CreateMonitorInput = z.infer<typeof createMonitorInputSchema>;
