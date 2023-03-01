import { CreateNextContextOptions } from "@trpc/server/adapters/next";
import { NextApiRequest, NextApiResponse } from "next";

export type UnauthorizedContext = {
	req: NextApiRequest;
	res: NextApiResponse;
};

export type AuthorizedContext = UnauthorizedContext & {
	foo: number;
};

export const createContext = ({
	req,
	res,
}: CreateNextContextOptions): UnauthorizedContext => ({ req, res });
