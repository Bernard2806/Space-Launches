// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	site: 'https://bernard2806.github.io',
	base: '/Space-Launches/',
	vite: {
		plugins: [tailwindcss()],
	},
});
