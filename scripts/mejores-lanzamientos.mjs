const TOP_N = 30;
const LL2_URL =
	'https://ll.thespacedevs.com/2.3.0/launches/upcoming/?limit=40&mode=detailed';

async function getJson(url) {
	const res = await fetch(url, {
		signal: AbortSignal.timeout(15000),
		headers: {
			'User-Agent': 'SpaceLaunches/1.0 (+https://github.com/anomalyco/opencode)',
			Accept: 'application/json',
		},
	});
	if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
	const data = await res.json();
	if (typeof data !== 'object' || data === null) throw new Error('Respuesta no es JSON');
	return data;
}

function normalizeLL2(data) {
	return (data?.results ?? []).map((r) => ({
		id: `ll2:${r.id}`,
		name: r.name,
		date: r.net,
		agency: r.launch_service_provider?.name ?? null,
		rocket: r.rocket?.configuration?.name ?? null,
		pad: r.pad?.name ?? null,
		location: r.pad?.location?.name ?? null,
		status: r.status?.name ?? null,
		image: r.image?.image_url ?? null,
		url: r.url ?? null,
		mission: r.mission?.description ?? null,
		missionTypes: r.mission?.type ? [r.mission.type] : [],
		webcast: Boolean(r.webcast_live) || (Array.isArray(r.vid_urls) && r.vid_urls.length > 0),
	}));
}

function isCrewed(l) {
	return /human spaceflight|crewed|manned|tripulad/i.test(
		(l.missionTypes ?? []).join(' ') + ' ' + (l.name ?? '')
	);
}

function scoreLaunch(l) {
	const data =
		(l.image ? 2 : 0) +
		(l.agency ? 1.5 : 0) +
		(l.rocket ? 1.5 : 0) +
		(l.pad || l.location ? 1 : 0) +
		(l.mission && l.mission.length > 30 ? 2 : 0) +
		(l.missionTypes?.length ? 1 : 0) +
		(l.webcast ? 1 : 0);

	const date = l.date ? new Date(l.date) : null;
	const now = Date.now();
	let relevance = 0;
	if (date) {
		if (date.getTime() < now) relevance = -5;
		else {
			const days = (date.getTime() - now) / 86400000;
			relevance = Math.max(0, 4 - days / 30);
		}
	}

	const crewed = isCrewed(l) ? 4 : 0;
	return Number((data + relevance + crewed).toFixed(2));
}

async function main() {
	console.log('== Space Launches · Launch Library 2 (The Space Devs) ==\n');
	const raw = await getJson(LL2_URL);
	let launches = normalizeLL2(raw);
	launches.forEach((l) => (l.score = scoreLaunch(l)));
	launches.sort((a, b) => b.score - a.score);
	launches = launches.slice(0, TOP_N);

	const { writeFile, mkdir } = await import('node:fs/promises');
	const { fileURLToPath } = await import('node:url');
	const { dirname, join } = await import('node:path');
	const here = dirname(fileURLToPath(import.meta.url));
	const outPath = join(here, '..', 'src', 'data', 'launches.json');
	await mkdir(dirname(outPath), { recursive: true });
	await writeFile(outPath, JSON.stringify(launches, null, 2), 'utf8');

	console.log(`Lanzamientos obtenidos de LL2: ${raw?.count ?? '?'} (mostrando top ${launches.length})`);
	console.log('Top 5 (crema de la crema):');
	launches.slice(0, 5).forEach((l, i) => {
		console.log(`  #${i + 1} [${l.score}] ${l.name} — ${l.agency ?? '?'}`);
	});
	console.log(`\nGuardado en: ${outPath}`);
}

main().catch((err) => {
	console.error('Error fatal:', err);
	process.exit(1);
});
