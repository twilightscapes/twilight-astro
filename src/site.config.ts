import type { SiteConfig } from "@/types";
import { getEntry } from 'astro:content';

const pwaSettings = await getEntry('pwaSettings', 'index');

export const siteConfig: SiteConfig = {
	author: pwaSettings.data.name,
	description: pwaSettings.data.description,
	title: pwaSettings.data.name,
	date: {
		locale: "en",
		options: {
			day: "numeric",
			month: "short",
			year: "numeric",
		},
	},
	lang: "en",
	ogLocale: "en",
	sortPostsByUpdatedDate: false,
	webmentions: {
		link: "https://webmention.io/{{siteUrl}}/webmention",
	},
};

import { getMenuItems } from './utils/getMenuItems';

// Used to generate links in both the Header & Footer.
export const getMenuLinks = async () => {
	const menuItems = await getMenuItems();
	return menuItems;
};

// https://expressive-code.com/reference/configuration/
// export const expressiveCodeOptions: AstroExpressiveCodeOptions = {
// 	styleOverrides: {
// 		borderRadius: "4px",
// 		codeFontFamily:
// 			'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;',
// 		codeFontSize: "0.875rem",
// 		codeLineHeight: "1.7142857rem",
// 		codePaddingInline: "1rem",
// 		frames: {
// 			frameBoxShadowCssValue: "none",
// 		},
// 		uiLineHeight: "inherit",
// 	},
// 	themeCssSelector(theme, { styleVariants }) {
// 		// If one dark and one light theme are available
// 		// generate theme CSS selectors compatible with pirate-theme dark mode switch
// 		if (styleVariants.length >= 2) {
// 			const baseTheme = styleVariants[0]?.theme;
// 			const altTheme = styleVariants.find((v) => v.theme.type !== baseTheme?.type)?.theme;
// 			if (theme === baseTheme || theme === altTheme) return `[data-theme='${theme.type}']`;
// 		}
// 		// return default selector
// 		return `[data-theme="${theme.name}"]`;
// 	},
// 	// One dark, one light theme => https://expressive-code.com/guides/themes/#available-themes
// 	themes: ["dracula", "github-light"],
// 	useThemedScrollbars: false,
// };
