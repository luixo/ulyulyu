export type PageProps<P = unknown, T = object> = P & {
	params: T;
	searchParams?: { [key: string]: string | string[] | undefined };
};
