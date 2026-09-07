/**
 * Plex API Client
 * Shared HTTP client for communicating with Plex Media Server.
 * Implements PlexAPIClient interface for Trakt sync compatibility.
 */
import { PlexConfig, LibraryMovieRecord } from "./types.js";
import { PlexAPIClient } from "../trakt/sync.js";
import { PlexMovie, PlexEpisode, PlexWatchSession } from "../trakt/mapper.js";
export declare class PlexClient implements PlexAPIClient {
    private config;
    constructor(config: PlexConfig);
    makeRequest(endpoint: string, params?: Record<string, string | number>, method?: string): Promise<Record<string, unknown>>;
    makeDiscoverRequest(endpoint: string, params?: Record<string, string | number>, method?: string): Promise<Record<string, unknown>>;
    getPlexTypeId(type: string): number;
    getWatchedMovies(userId?: number): Promise<PlexMovie[]>;
    getLibraryMoviesWithMeta(libraryKey: string, userId?: string): Promise<LibraryMovieRecord[]>;
    getWatchedEpisodes(userId?: number): Promise<PlexEpisode[]>;
    getCurrentSessions(): Promise<PlexWatchSession[]>;
    markAsWatched(ratingKey: string, userId?: number): Promise<void>;
    rateMedia(ratingKey: string, rating: number): Promise<void>;
    markAsUnwatched(ratingKey: string): Promise<void>;
    updateProgress(ratingKey: string, progress: number, userId?: number): Promise<void>;
}
