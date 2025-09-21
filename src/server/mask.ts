import crypto from "crypto";

import type { GameId, UserId, WordId } from "~/server/validation";

const algorithm = "aes-128-cbc" as const;
const key = process.env.MASK_KEY || "1234567890abcdef";
const adjustIv = (rawIv: string) => rawIv.padEnd(16, "0").slice(0, 16);
const getEncryptor = (iv: string) =>
  crypto.createCipheriv(algorithm, key, adjustIv(iv));
const getDecryptor = (iv: string) =>
  crypto.createDecipheriv(algorithm, key, adjustIv(iv));

export const maskUserId = (
  userId: UserId,
  gameId: GameId,
  wordId: WordId,
): string => {
  const cipher = getEncryptor(gameId);
  let data = cipher.update(`${userId}/${wordId}`);
  data = Buffer.concat([data, cipher.final()]);
  return data.toString("hex");
};

export const demaskUserId = (maskedId: string, gameId: GameId): UserId => {
  const decipher = getDecryptor(gameId);
  let decrypted = decipher.update(Buffer.from(maskedId, "hex"));
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return decrypted.toString().split("/")[0]! as UserId;
};
