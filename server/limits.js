// Keys for rate limits, normalized so they can't be sidestepped cheaply.
//
// - IPv6: one subscriber usually holds a whole /64, so counting each address separately lets one
//   person rotate through billions of "different" clients. Group IPv6 addresses by /64.
// - Email: name+anything@example.com reaches the same inbox as name@example.com, so +tags are
//   dropped before counting. The address itself is still used as typed everywhere else.

function expandIPv6(address) {
  let value = address.toLowerCase().split('%')[0];
  // IPv4-mapped or -embedded forms (::ffff:192.0.2.1) end with a dotted quad.
  const dotted = /(\d+\.\d+\.\d+\.\d+)$/.exec(value);
  if (dotted) {
    const octets = dotted[1].split('.').map(Number);
    if (octets.length !== 4 || octets.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return null;
    value = value.slice(0, -dotted[1].length) + ((octets[0] << 8) | octets[1]).toString(16) + ':' + ((octets[2] << 8) | octets[3]).toString(16);
  }
  const halves = value.split('::');
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const fill = halves.length === 2 ? 8 - head.length - tail.length : 0;
  if (fill < 0 || (halves.length === 1 && head.length !== 8)) return null;
  const groups = [...head, ...Array(fill).fill('0'), ...tail];
  if (groups.length !== 8 || groups.some(g => !/^[0-9a-f]{1,4}$/.test(g))) return null;
  return groups.map(g => g.padStart(4, '0'));
}

// The client address to count against: IPv4 as is, IPv4-mapped IPv6 as IPv4, other IPv6 as its /64.
export function ipLimitKey(ip) {
  if (typeof ip !== 'string' || !ip) return ip;
  if (!ip.includes(':')) return ip;
  const groups = expandIPv6(ip);
  if (!groups) return ip;
  if (groups.slice(0, 5).every(g => g === '0000') && groups[5] === 'ffff') {
    const n = parseInt(groups[6], 16), m = parseInt(groups[7], 16);
    return `${n >> 8}.${n & 255}.${m >> 8}.${m & 255}`;
  }
  return `${groups.slice(0, 4).join(':')}::/64`;
}

// The inbox to count against: lowercase, without a +tag in the local part.
export function emailLimitKey(email) {
  if (typeof email !== 'string') return email;
  const value = email.trim().toLowerCase();
  const at = value.lastIndexOf('@');
  if (at < 1) return value;
  const local = value.slice(0, at).split('+')[0] || value.slice(0, at);
  return `${local}@${value.slice(at + 1)}`;
}
