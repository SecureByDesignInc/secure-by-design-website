// Browser protections for everything the Worker answers. Static files get theirs from public/_headers.
// The pages need inline scripts and styles (React streaming), so the policy's job is to keep scripts,
// frames and form posts on this site and the few named services, and to stop other sites framing these pages.
export const contentSecurityPolicy=[
 "default-src 'self'",
 "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com",
 "style-src 'self' 'unsafe-inline'",
 "img-src 'self' data: blob:",
 "font-src 'self' data:",
 "connect-src 'self' https://cloudflareinsights.com",
 "media-src 'self' blob:",
 "frame-src 'self' https://www.youtube-nocookie.com",
 "worker-src 'self' blob:",
 "manifest-src 'self'",
 "object-src 'none'",
 "base-uri 'self'",
 "form-action 'self'",
 "frame-ancestors 'self'",
].join('; ');
export const securityHeaders={
 'x-content-type-options':'nosniff',
 'referrer-policy':'strict-origin-when-cross-origin',
 'x-frame-options':'SAMEORIGIN',
 'permissions-policy':'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), browsing-topics=()',
 'cross-origin-opener-policy':'same-origin-allow-popups',
};
export const hsts='max-age=31536000; includeSubDomains';
// Adds the protections a response doesn't already carry; HSTS only over HTTPS.
export function protect(response,https){
 const headers=new Headers(response.headers);
 if(https)headers.set('strict-transport-security',hsts);
 for(const [name,value] of Object.entries(securityHeaders))if(!headers.has(name))headers.set(name,value);
 // Pages that already set a stricter policy (the email-preference and owner pages) keep it.
 if((headers.get('content-type')||'').includes('text/html')&&!headers.has('content-security-policy'))headers.set('content-security-policy',contentSecurityPolicy);
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
