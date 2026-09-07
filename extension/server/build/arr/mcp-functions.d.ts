/**
 * Arr MCP Functions
 * MCP tool implementations for Sonarr and Radarr integration.
 * Follows lazy initialization pattern from trakt/mcp-functions.ts.
 */
export declare class ArrMCPFunctions {
    private sonarrClient;
    private radarrClient;
    private sonarrInitialized;
    private radarrInitialized;
    private ensureSonarr;
    private ensureRadarr;
    sonarrGetSeries(args: {
        filter?: string;
        limit?: number;
    }): Promise<Record<string, unknown>>;
    sonarrSearch(args: {
        query: string;
        limit?: number;
    }): Promise<Record<string, unknown>>;
    sonarrAddSeries(args: {
        tvdbId: number;
        title: string;
        qualityProfileId?: number;
        rootFolderPath?: string;
        monitored?: boolean;
        seasonFolder?: boolean;
        monitorType?: string;
        searchForMissingEpisodes?: boolean;
    }): Promise<Record<string, unknown>>;
    sonarrGetMissing(args: {
        page?: number;
        pageSize?: number;
    }): Promise<Record<string, unknown>>;
    sonarrGetQueue(args?: {
        limit?: number;
    }): Promise<Record<string, unknown>>;
    sonarrGetCalendar(args: {
        startDate?: string;
        endDate?: string;
        limit?: number;
    }): Promise<Record<string, unknown>>;
    sonarrGetProfiles(): Promise<Record<string, unknown>>;
    sonarrTriggerSearch(args: {
        seriesId?: number;
    }): Promise<Record<string, unknown>>;
    radarrGetMovies(args: {
        filter?: string;
        limit?: number;
    }): Promise<Record<string, unknown>>;
    radarrSearch(args: {
        query: string;
        limit?: number;
    }): Promise<Record<string, unknown>>;
    radarrAddMovie(args: {
        tmdbId: number;
        title: string;
        qualityProfileId?: number;
        rootFolderPath?: string;
        monitored?: boolean;
        minimumAvailability?: string;
        searchForMovie?: boolean;
    }): Promise<Record<string, unknown>>;
    radarrGetMissing(args: {
        page?: number;
        pageSize?: number;
    }): Promise<Record<string, unknown>>;
    radarrGetQueue(args?: {
        limit?: number;
    }): Promise<Record<string, unknown>>;
    radarrGetCalendar(args: {
        startDate?: string;
        endDate?: string;
        limit?: number;
    }): Promise<Record<string, unknown>>;
    radarrGetProfiles(): Promise<Record<string, unknown>>;
    radarrTriggerSearch(args: {
        movieId?: number;
    }): Promise<Record<string, unknown>>;
    arrGetStatus(): Promise<Record<string, unknown>>;
}
