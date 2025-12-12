/// <reference types="vite/client" />

declare global {
	interface Window {
		__ASGARDEO_CONFIG?: {
			signInRedirectURL?: string;
			signOutRedirectURL?: string;
			clientID?: string;
			baseUrl?: string;
			scope?: string | string[];
		};
	}
}

export {};
