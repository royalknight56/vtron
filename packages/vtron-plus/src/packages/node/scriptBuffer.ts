import { Buffer } from 'buffer/';

// buffer@6 supports Base64 but omits Node's Base64URL output encoding. Apply
// this to the module's Buffer (never the browser's globals), so buffers returned
// by crypto and by Buffer factories expose the same encoding support.
const toString = Buffer.prototype.toString;
Buffer.prototype.toString = function (encoding?: string, start?: number, end?: number) {
  if (typeof encoding === 'string' && encoding.toLowerCase() === 'base64url') {
    return toString.call(this, 'base64', start, end).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  return toString.call(this, encoding as Parameters<typeof toString>[0], start, end);
};

export { Buffer };
