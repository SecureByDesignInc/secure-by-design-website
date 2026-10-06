import {scrypt, timingSafeEqual, randomBytes} from 'node:crypto';

// OWASP's memory-bounded scrypt configuration; supported by Workers nodejs_compat.
const options = {N:16384,r:8,p:5,maxmem:32*1024*1024};
const derive = (password,salt) => new Promise((resolve,reject)=>scrypt(password,salt,32,options,(error,key)=>error?reject(error):resolve(key)));
export function validPassword(password){
 return typeof password==='string' && [...password].length>=15 && [...password].length<=128 && !/^\s+$/.test(password);
}
export async function hashPassword(password){
 const salt=randomBytes(16).toString('hex');
 return `scrypt$16384$8$5$${salt}$${(await derive(password,salt)).toString('hex')}`;
}
export async function checkPassword(password,encoded){
 const match=/^scrypt\$16384\$8\$5\$([a-f0-9]{32})\$([a-f0-9]{64})$/.exec(encoded||'');
 // Equal KDF work for absent accounts, without exposing whether an email exists.
 const actual=await derive(password,match?.[1]||'0'.repeat(32));
 const equal=timingSafeEqual(actual,Buffer.from(match?.[2]||'0'.repeat(64),'hex'));
 return !!match&&equal;
}
