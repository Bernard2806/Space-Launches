import type { APIRoute } from 'astro';
import { getDailyApod } from '../../services/apod';

export const GET: APIRoute = async () => {
	const apod = await getDailyApod();
	return new Response(JSON.stringify(apod), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'public, max-age=3600',
		},
	});
};
