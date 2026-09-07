/**
 * Plex API Client
 * Shared HTTP client for communicating with Plex Media Server.
 * Implements PlexAPIClient interface for Trakt sync compatibility.
 */
import axios from "axios";
import { PLEX_TYPE_IDS, PLEX_CONTAINER_SIZE } from "./constants.js";
import { validatePlexId } from "../shared/utils.js";
const PLEX_DISCOVER_BASE_URL = "https://discover.provider.plex.tv";
export class PlexClient {
    config;
    constructor(config) {
        this.config = config;
        // Strip trailing slashes to prevent double-slash in URLs
        this.config = {
            ...config,
            baseUrl: config.baseUrl.replace(/\/+$/, ""),
            clientIdentifier: config.clientIdentifier || "plex-mcp-server",
        };
    }
    async makeRequest(endpoint, params = {}, method = "GET") {
        const url = `${this.config.baseUrl}${endpoint}`;
        const axiosConfig = {
            method,
            headers: {
                "X-Plex-Token": this.config.token,
                Accept: "application/json",
            },
            params,
        };
        const response = await axios(url, axiosConfig);
        return response.data;
    }
    async makeDiscoverRequest(endpoint, params = {}, method = "GET") {
        const response = await axios(`${PLEX_DISCOVER_BASE_URL}${endpoint}`, {
            method,
            headers: {
                "X-Plex-Token": this.config.token,
                "X-Plex-Client-Identifier": this.config.clientIdentifier,
                "X-Plex-Product": "plex-mcp-server",
                Accept: "application/json",
            },
            params,
        });
        return response.data;
    }
    getPlexTypeId(type) {
        return PLEX_TYPE_IDS[type] || 1;
    }
    // PlexAPIClient implementation for Trakt sync
    async getWatchedMovies(userId) {
        const data = await this.makeRequest("/library/all", {
            type: 1,
            "X-Plex-Container-Size": PLEX_CONTAINER_SIZE,
        });
        const container = data;
        const movies = container.MediaContainer?.Metadata || [];
        return movies
            .filter((item) => item.viewCount > 0)
            .map((item) => ({
            ratingKey: item.ratingKey,
            title: item.title,
            year: item.year,
            guid: item.guid,
            duration: item.duration,
            viewCount: item.viewCount,
            lastViewedAt: item.lastViewedAt,
            addedAt: item.addedAt,
            updatedAt: item.updatedAt,
            genres: item.Genre?.map((g) => g.tag) || [],
            summary: item.summary,
        }));
    }
    async getLibraryMoviesWithMeta(libraryKey, userId) {
        const allMovies = [];
        let offset = 0;
        const pageSize = PLEX_CONTAINER_SIZE;
        while (true) {
            const params = {
                type: 1,
                "X-Plex-Container-Start": offset,
                "X-Plex-Container-Size": pageSize,
            };
            if (userId)
                params.accountID = userId;
            const data = await this.makeRequest(`/library/sections/${libraryKey}/all`, params);
            const container = data;
            const totalSize = container.MediaContainer?.totalSize || 0;
            const items = container.MediaContainer?.Metadata || [];
            for (const item of items) {
                allMovies.push({
                    ratingKey: item.ratingKey,
                    title: item.title,
                    year: item.year,
                    viewCount: item.viewCount || 0,
                    lastViewedAt: item.lastViewedAt,
                    rating: item.audienceRating ?? item.rating,
                    genres: item.Genre?.map((g) => g.tag) || [],
                    directors: item.Director?.map((d) => d.tag) || [],
                    actors: item.Role?.map((r) => r.tag) || [],
                });
            }
            offset += items.length;
            if (offset >= totalSize || items.length === 0)
                break;
        }
        return allMovies;
    }
    async getWatchedEpisodes(userId) {
        const episodes = [];
        const librariesData = await this.makeRequest("/library/sections");
        const libContainer = librariesData;
        const libraries = libContainer.MediaContainer?.Directory || [];
        const showLibraries = libraries.filter((lib) => lib.type === "show");
        for (const library of showLibraries) {
            const data = await this.makeRequest(`/library/sections/${library.key}/all`, {
                type: 4,
                "X-Plex-Container-Size": PLEX_CONTAINER_SIZE,
            });
            const epContainer = data;
            const libraryEpisodes = epContainer.MediaContainer?.Metadata || [];
            episodes.push(...libraryEpisodes
                .filter((item) => item.viewCount > 0)
                .map((item) => ({
                ratingKey: item.ratingKey,
                title: item.title,
                seasonNumber: item.parentIndex || 1,
                episodeNumber: item.index || 1,
                duration: item.duration,
                viewCount: item.viewCount,
                lastViewedAt: item.lastViewedAt,
                guid: item.guid,
                show: {
                    ratingKey: item.grandparentRatingKey,
                    title: item.grandparentTitle,
                    year: item.grandparentYear,
                    guid: item.grandparentGuid,
                },
            })));
        }
        return episodes;
    }
    async getCurrentSessions() {
        const data = await this.makeRequest("/status/sessions");
        const container = data;
        const sessions = container.MediaContainer?.Metadata || [];
        return sessions.map((session) => ({
            ratingKey: session.ratingKey,
            title: session.title,
            type: (session.type === "movie" ? "movie" : "episode"),
            viewOffset: session.viewOffset,
            duration: session.duration,
            progress: session.viewOffset && session.duration
                ? Math.round((session.viewOffset / session.duration) * 100)
                : 0,
            sessionKey: session.sessionKey,
            userId: session.User?.id,
            userName: session.User?.title,
            state: "playing",
            seasonNumber: session.parentIndex,
            episodeNumber: session.index,
        }));
    }
    async markAsWatched(ratingKey, userId) {
        validatePlexId(ratingKey, "ratingKey");
        await this.makeRequest("/:/scrobble", {
            key: ratingKey,
            identifier: "com.plexapp.plugins.library",
        });
    }
    async rateMedia(ratingKey, rating) {
        validatePlexId(ratingKey, "ratingKey");
        await this.makeRequest("/:/rate", {
            key: ratingKey,
            identifier: "com.plexapp.plugins.library",
            rating,
        }, "PUT");
    }
    async markAsUnwatched(ratingKey) {
        validatePlexId(ratingKey, "ratingKey");
        await this.makeRequest("/:/unscrobble", {
            key: ratingKey,
            identifier: "com.plexapp.plugins.library",
        });
    }
    async updateProgress(ratingKey, progress, userId) {
        validatePlexId(ratingKey, "ratingKey");
        await this.makeRequest("/:/progress", {
            key: ratingKey,
            time: progress,
            identifier: "com.plexapp.plugins.library",
        });
    }
}
