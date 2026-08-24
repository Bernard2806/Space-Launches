export interface Launch {
	id: string;
	name: string;
	date: string | null;
	agency: string | null;
	rocket: string | null;
	pad: string | null;
	location: string | null;
	status: string | null;
	image: string | null;
	url: string | null;
	mission: string | null;
	missionTypes: string[];
	webcast: boolean;
	score: number;
}

const LL2_URL =
	'https://ll.thespacedevs.com/2.3.0/launches/upcoming/?limit=40&mode=detailed';

export const STATUS_LABELS: Record<string, string> = {
	'Go for Launch': 'Listo para lanzamiento',
	'To Be Determined': 'Por determinar',
	'TBD': 'Por determinar',
	'Success Launch Successful': 'Lanzamiento exitoso',
	'Launch Successful': 'Lanzamiento exitoso',
	'In Flight': 'En vuelo',
	'Failed': 'Fallido',
	'Partial Failure': 'Fallo parcial',
	'Hold': 'En espera',
	'In Review': 'En revisión',
	'Prelaunch': 'Pre-lanzamiento',
	'Launch is Schedule': 'Programado',
};

export function statusLabel(raw?: string | null): string {
	if (!raw) return 'Estado desconocido';
	return STATUS_LABELS[raw] ?? raw;
}

export function statusBadgeClass(raw?: string | null): string {
	const key = raw ?? '';
	if (/success/i.test(key)) return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
	if (/fail/i.test(key)) return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
	if (/go for launch/i.test(key)) return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
	if (/determined|tbd/i.test(key)) return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
	return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
}

export function formatLaunchDate(iso?: string | null): string {
	if (!iso) return 'Fecha por confirmar';
	const d = new Date(iso);
	if (isNaN(d.getTime())) return 'Fecha por confirmar';
	const fecha = d.toLocaleDateString('es-ES', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});
	const hora = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
	return `${fecha} · ${hora}`;
}

function normalizeLL2(r: any): Launch {
	return {
		id: `ll2:${r.id}`,
		name: r.name,
		date: r.net ?? null,
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
		score: 0,
	};
}

function isCrewed(l: Launch): boolean {
	return /human spaceflight|crewed|manned|tripulad/i.test(
		(l.missionTypes ?? []).join(' ') + ' ' + (l.name ?? '')
	);
}

function scoreLaunch(l: Launch): number {
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

async function fetchLive(): Promise<Launch[]> {
	const res = await fetch(LL2_URL, {
		signal: AbortSignal.timeout(15000),
		headers: {
			'User-Agent': 'SpaceLaunches/1.0 (+https://github.com/anomalyco/opencode)',
			Accept: 'application/json',
		},
	});
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	const json = (await res.json()) as any;
	const list = (json.results ?? []).map(normalizeLL2);
	list.forEach((l) => (l.score = scoreLaunch(l)));
	list.sort((a, b) => b.score - a.score);
	return list.slice(0, 30);
}

export async function getLaunches(): Promise<Launch[]> {
	try {
		return await fetchLive();
	} catch (err) {
		console.warn(
			'[launches] API no disponible, usando caché local:',
			err instanceof Error ? err.message : String(err)
		);
		try {
			const cached = (await import('../data/launches.json')).default as Launch[];
			return cached ?? [];
		} catch {
			return [];
		}
	}
}
