export function encryptObject(body: Record<string, unknown>) {
    return encrypt(body);
}

const keyIvMap = [
    "wN/6nM2MnGnKYxPnxzs97Eqf9r6azZIp0E5TA9IP8Vc=", "SuWJ7BKJRJi6Nlta9srEQQ==",
    "IZMzIj6ojv/aV2HPLZh6jSZO+PaW23pJ/mzLvm5VMkA=", "fhNm1BVTvRC6QM2ZJeSx3Q==",
    "KRFhYwTLn8NE8JQ0AbHUshwRMVKiN58st4D9tT4eKTs=", "xZsktnbLaXSr4ZtbS375tg==",
    "YdjXbbP1c8Uyrvd6EqSRkIIRzb6PJuULCOVUgpRjw54=", "1vW3zeV5FzRPcKblbbn6ug==",
    "x3OmZ1qxMGnsCykczS/TzKXUkXZQQV2KpMWFzXCOY3E=", "++/KVr1XV0HfDVSSzzJYvw==",
    "XV+DYLyNXy65F/onA35bJFqsiy7hojBuUG51w+9DET8=", "/RgU47gCd47boCaxKN9MNw==",
    "2GHi8cBG8LFBDFg2LX4AX3V4SqNuguyDZFGQgnx/Kgs=", "ALQfJtXRm72B640HaD05YQ==",
    "x8g418pW+Skbys4EMpbv8NNL/ooafZ8Qpv0Y5N0tb3E=", "JOK+r5y7acLCv39/NzoCzg==",
    "4f1/tgz4eRmj5AumR14lFbcG4EjPCeRiSDkr2vYs5mk=", "OlfomlqkalsfHL33YfYukw==",
    "BQOmmAQN+f2mLy/G+mn2BMBO48eEsTgYthJP86Pb7zQ=", "U0Tky61XJdwTWC3H800XpQ=="
];

function encrypt(json: Record<string, unknown>) {
    const text = JSON.stringify(json);
    const ts = new Date().getTime();
    const keyIndex = (ts % 10) * 2;
    const key = keyIvMap[keyIndex];
    const iv = keyIvMap[keyIndex + 1];
    const v = CryptoJS.AES.encrypt(text, CryptoJS.enc.Base64.parse(key), {iv: CryptoJS.enc.Base64.parse(iv)}).toString();
    return JSON.stringify({ts: ts, v: v});
}