import { Router, type IRouter } from "express";
import {
  GetMusicChartsQueryParams,
  GetMusicChartsResponse,
  SearchMusicQueryParams,
  SearchMusicResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const SUPPORTED_COUNTRIES = new Set([
  "ae", "ar", "at", "au", "be", "br", "ca", "ch", "cl", "co", "de", "dk",
  "es", "fi", "fr", "gb", "hk", "id", "ie", "il", "in", "it", "jp", "kr",
  "mx", "my", "ng", "nl", "no", "nz", "ph", "pl", "pt", "ru", "sa", "se",
  "sg", "th", "tr", "tw", "ua", "us", "vn", "za",
]);

type AppleTrack = {
  trackId?: number;
  collectionId?: number;
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  trackTimeMillis?: number;
  releaseDate?: string;
  primaryGenreName?: string;
};

type AppleChartTrack = {
  id?: string;
  name?: string;
  artistName?: string;
  artworkUrl?: string;
  releaseDate?: string;
  genres?: Array<{ name?: string }>;
  url?: string;
};

function mapSearchTrack(item: AppleTrack) {
  return {
    id: String(item.trackId ?? item.collectionId ?? item.trackName ?? "unknown"),
    title: item.trackName ?? "Untitled",
    artist: item.artistName ?? "Unknown artist",
    album: item.collectionName ?? "Single",
    artworkUrl: (item.artworkUrl100 ?? "").replace(/\d+x\d+bb/, "600x600bb"),
    previewUrl: item.previewUrl ?? null,
    durationMs: item.trackTimeMillis ?? 0,
    releaseDate: item.releaseDate ?? null,
    genre: item.primaryGenreName ?? "Music",
  };
}

function mapChartTrack(item: AppleChartTrack) {
  return {
    id: item.id ?? item.name ?? "unknown",
    title: item.name ?? "Untitled",
    artist: item.artistName ?? "Unknown artist",
    album: item.name ?? "Single",
    artworkUrl: (item.artworkUrl ?? "").replace(/\d+x\d+bb/, "600x600bb"),
    previewUrl: null,
    durationMs: 0,
    releaseDate: item.releaseDate ?? null,
    genre: item.genres?.[0]?.name ?? "Music",
  };
}

async function addPreviewData(track: ReturnType<typeof mapChartTrack>, country: string) {
  const url = new URL("https://itunes.apple.com/search");
  url.searchParams.set("term", `${track.title} ${track.artist}`);
  url.searchParams.set("entity", "song");
  url.searchParams.set("limit", "5");
  url.searchParams.set("country", country);

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!response.ok) return track;
    const payload = (await response.json()) as { results?: AppleTrack[] };
    const matches = payload.results ?? [];
    const exactTitle = matches.find(
      (match) => match.trackName?.trim().toLowerCase() === track.title.trim().toLowerCase(),
    );
    const match = exactTitle ?? matches[0];
    if (!match) return track;
    const enriched = mapSearchTrack(match);
    return {
      ...track,
      album: enriched.album,
      artworkUrl: enriched.artworkUrl || track.artworkUrl,
      previewUrl: enriched.previewUrl,
      durationMs: enriched.durationMs,
      genre: enriched.genre || track.genre,
    };
  } catch {
    return track;
  }
}

function validCountry(country: string): boolean {
  return SUPPORTED_COUNTRIES.has(country);
}

router.get("/music/charts", async (req, res) => {
  const parsed = GetMusicChartsQueryParams.safeParse(req.query);
  if (!parsed.success || !validCountry(parsed.data.country)) {
    res.status(400).json({ error: "Choose a supported two-letter country code." });
    return;
  }

  const { country } = parsed.data;
  const url = `https://rss.applemarketingtools.com/api/v2/${country}/music/most-played/50/songs.json`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!response.ok) {
      req.log.warn({ status: response.status, country }, "Apple regional chart request failed");
      res.status(502).json({ error: "The regional chart is temporarily unavailable." });
      return;
    }

    const payload = (await response.json()) as {
      feed?: { results?: AppleChartTrack[] };
    };
    const rawTracks = payload.feed?.results ?? [];
    const tracks = await Promise.all(
      rawTracks.map((item, index) => {
        const track = mapChartTrack(item);
        return index < 10 ? addPreviewData(track, country) : track;
      }),
    );
    const validated = GetMusicChartsResponse.parse(tracks);
    res.setHeader("Cache-Control", "public, max-age=180");
    res.json(validated);
  } catch (error) {
    req.log.warn({ err: error, country }, "Apple regional chart request failed");
    res.status(502).json({ error: "Could not connect to the regional chart." });
  }
});

router.get("/music/search", async (req, res) => {
  const parsed = SearchMusicQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a search term and choose a valid result limit." });
    return;
  }

  const { term, limit } = parsed.data;
  const country = parsed.data.country ?? "us";
  if (!validCountry(country)) {
    res.status(400).json({ error: "Choose a supported two-letter country code." });
    return;
  }

  const url = new URL("https://itunes.apple.com/search");
  url.searchParams.set("term", term);
  url.searchParams.set("entity", "song");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("country", country);

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) {
      req.log.warn({ status: response.status, country }, "Apple catalog search failed");
      res.status(502).json({ error: "The music catalog is temporarily unavailable." });
      return;
    }

    const payload = (await response.json()) as { results?: AppleTrack[] };
    const tracks = (payload.results ?? []).map(mapSearchTrack);
    const validated = SearchMusicResponse.parse(tracks);
    res.setHeader("Cache-Control", "public, max-age=60");
    res.json(validated);
  } catch (error) {
    req.log.warn({ err: error, country }, "Apple catalog search failed");
    res.status(502).json({ error: "Could not connect to the music catalog." });
  }
});

export default router;
