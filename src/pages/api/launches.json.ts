import type { APIRoute } from 'astro';
import { getLaunches } from '../../services/launches';

export const GET: APIRoute = async () => {
	const launches = await getLaunches();
	return new Response(JSON.stringify(launches), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'no-store',
		},
	});
};
