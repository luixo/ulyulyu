/* eslint-disable @typescript-eslint/consistent-type-definitions */
/// <reference types="vite/client" />

interface ViteTypeOptions {
	strictImportMetaEnv: true;
}

interface ImportMetaEnv {
	VITE_PUSHER_APP_KEY?: string;
	VITE_PUSHER_CLUSTER?: string;
	VITE_PUSHER_HOST?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
