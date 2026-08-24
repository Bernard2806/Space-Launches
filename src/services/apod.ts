export interface ApodData {
	imageUrl: string;
	hdImageUrl?: string;
	title: string;
	date: string;
	copyright?: string;
	explanation?: string;
	mediaType: 'image' | 'video' | 'other';
}

const APOD_BASE_URL = 'https://apod.nasa.gov/apod/';
const APOD_PAGE_URL = `${APOD_BASE_URL}astropix.html`;

const FALLBACK_APOD: ApodData = {
	imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop',
	hdImageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop',
	title: 'Deep Space Galaxy',
	date: new Date().toISOString().split('T')[0],
	copyright: 'NASA / Space Launches',
	explanation: 'Fotografía astronómica del espacio profundo.',
	mediaType: 'image',
};

export async function getDailyApod(): Promise<ApodData> {
	try {
		const response = await fetch(APOD_PAGE_URL, {
			signal: AbortSignal.timeout(8000),
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
			},
		});

		if (!response.ok) {
			console.warn(`[APOD] Error al obtener página: ${response.status} ${response.statusText}`);
			return FALLBACK_APOD;
		}

		const html = await response.text();

		// 1. Extraer imagen principal
		// Busca <a href="image/..."> <IMG SRC="image/..."> o variaciones con mayúsculas/minúsculas y espacios
		const imgTagMatch = html.match(/<IMG\s+[^>]*SRC=["']?([^"'>\s]+)["']?[^>]*>/i);
		const anchorTagMatch = html.match(/<a\s+[^>]*href=["']?(image\/[^"'>\s]+)["']?[^>]*>/i);

		let imageRelative = imgTagMatch ? imgTagMatch[1] : null;
		let hdRelative = anchorTagMatch ? anchorTagMatch[1] : null;

		// Si no se encuentra <IMG>, verificar si es un iframe (video como YouTube/Vimeo)
		const iframeMatch = html.match(/<iframe\s+[^>]*src=["']?([^"'>\s]+)["']?[^>]*>/i);

		if (!imageRelative && iframeMatch) {
			return {
				imageUrl: FALLBACK_APOD.imageUrl,
				hdImageUrl: FALLBACK_APOD.hdImageUrl,
				title: 'NASA APOD (Video del día)',
				date: new Date().toISOString().split('T')[0],
				mediaType: 'video',
			};
		}

		if (!imageRelative) {
			return FALLBACK_APOD;
		}

		const imageUrl = imageRelative.startsWith('http')
			? imageRelative
			: `${APOD_BASE_URL}${imageRelative.replace(/^\/+/, '')}`;

		const hdImageUrl = hdRelative
			? (hdRelative.startsWith('http') ? hdRelative : `${APOD_BASE_URL}${hdRelative.replace(/^\/+/, '')}`)
			: imageUrl;

		// 2. Extraer título (suele estar en <center><b> Title </b><br>)
		const titleMatch = html.match(/<center>\s*<b>\s*([^<]+?)\s*<\/b>\s*<br>/i) ||
			html.match(/<title>\s*Astronomy Picture of the Day\s*:\s*([^<]+?)\s*<\/title>/i) ||
			html.match(/<b>\s*([^<]+?)\s*<\/b>\s*<br>\s*<b>\s*Image Credit/i);

		const title = titleMatch ? titleMatch[1].replace(/\r?\n|\r/g, ' ').trim() : 'NASA Astronomy Picture of the Day';

		// 3. Extraer crédito / copyright si existe
		const creditMatch = html.match(/Image Credit\s*(?:&amp;|&)\s*Copyright:?\s*<\/b>\s*([^<]+|<a[^>]*>[^<]+<\/a>)/i);
		let copyright: string | undefined = undefined;
		if (creditMatch) {
			copyright = creditMatch[1].replace(/<[^>]+>/g, '').replace(/\r?\n|\r/g, ' ').trim();
		}

		// 4. Extraer fecha (formato YYYY Month DD)
		const dateMatch = html.match(/(\d{4}\s+[A-Za-z]+\s+\d{1,2})/);
		const date = dateMatch ? dateMatch[1].trim() : new Date().toLocaleDateString('es-ES');

		return {
			imageUrl,
			hdImageUrl,
			title,
			date,
			copyright,
			mediaType: 'image',
		};
	} catch (error) {
		console.error('[APOD] Error procesando imagen diaria:', error);
		return FALLBACK_APOD;
	}
}
