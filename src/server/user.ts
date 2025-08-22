import { getDatabase } from "~/db";
import type { UserId } from "~/db/database.gen";

export const upsertUser = async (userId: UserId, userAgent: string) => {
  const db = getDatabase();
  const user = await db
    .selectFrom("users")
    .where("id", "=", userId)
    .select(["id", "name"])
    .executeTakeFirst();
  if (!user) {
    const newUser = await db
      .insertInto("users")
      .values({
        id: userId,
        userAgent: userAgent.slice(0, 1024),
      })
      .returning(["users.id", "users.name"])
      .executeTakeFirstOrThrow();
    return newUser;
  } else {
    void db
      .updateTable("users")
      .where("users.id", "=", userId)
      .set({ updatedAt: new Date() })
      .executeTakeFirst();
  }
  return user;
};
