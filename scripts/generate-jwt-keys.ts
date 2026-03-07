import crypto from 'crypto';

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
    },
});

console.log("JWT_PRIVATE_KEY:");
console.log(Buffer.from(privateKey).toString('base64'));
console.log("\nJWT_PUBLIC_KEY:");
console.log(Buffer.from(publicKey).toString('base64'));
