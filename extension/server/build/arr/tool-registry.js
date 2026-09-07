/**
 * Arr Tool Registry — eliminates switch statement for Sonarr/Radarr tool dispatch.
 * Reuses ToolRegistry class from plex/tool-registry.ts.
 */
import { ToolRegistry } from "../plex/tool-registry.js";
import { formatToolPayload } from "../shared/output-format.js";
export function createArrToolRegistry(arrFunctions) {
    const registry = new ToolRegistry();
    // ──── Sonarr tools ────
    registry.register("sonarr_get_series", (args) => arrFunctions.sonarrGetSeries({ filter: args.filter, limit: args.limit }).then(wrapResponse));
    registry.register("sonarr_search", (args) => arrFunctions.sonarrSearch({ query: args.query, limit: args.limit }).then(wrapResponse));
    registry.register("sonarr_add_series", (args) => arrFunctions.sonarrAddSeries({
        tvdbId: args.tvdbId,
        title: args.title,
        qualityProfileId: args.qualityProfileId,
        rootFolderPath: args.rootFolderPath,
        monitored: args.monitored,
        seasonFolder: args.seasonFolder,
        monitorType: args.monitorType,
        searchForMissingEpisodes: args.searchForMissingEpisodes,
    }).then(wrapResponse));
    registry.register("sonarr_get_missing", (args) => arrFunctions.sonarrGetMissing({
        page: args.page,
        pageSize: args.pageSize,
    }).then(wrapResponse));
    registry.register("sonarr_get_queue", (args) => arrFunctions.sonarrGetQueue({ limit: args.limit }).then(wrapResponse));
    registry.register("sonarr_get_calendar", (args) => arrFunctions.sonarrGetCalendar({
        startDate: args.startDate,
        endDate: args.endDate,
        limit: args.limit,
    }).then(wrapResponse));
    registry.register("sonarr_get_profiles", () => arrFunctions.sonarrGetProfiles().then(wrapResponse));
    registry.register("sonarr_trigger_search", (args) => arrFunctions.sonarrTriggerSearch({
        seriesId: args.seriesId,
    }).then(wrapResponse));
    // ──── Radarr tools ────
    registry.register("radarr_get_movies", (args) => arrFunctions.radarrGetMovies({ filter: args.filter, limit: args.limit }).then(wrapResponse));
    registry.register("radarr_search", (args) => arrFunctions.radarrSearch({ query: args.query, limit: args.limit }).then(wrapResponse));
    registry.register("radarr_add_movie", (args) => arrFunctions.radarrAddMovie({
        tmdbId: args.tmdbId,
        title: args.title,
        qualityProfileId: args.qualityProfileId,
        rootFolderPath: args.rootFolderPath,
        monitored: args.monitored,
        minimumAvailability: args.minimumAvailability,
        searchForMovie: args.searchForMovie,
    }).then(wrapResponse));
    registry.register("radarr_get_missing", (args) => arrFunctions.radarrGetMissing({
        page: args.page,
        pageSize: args.pageSize,
    }).then(wrapResponse));
    registry.register("radarr_get_queue", (args) => arrFunctions.radarrGetQueue({ limit: args.limit }).then(wrapResponse));
    registry.register("radarr_get_calendar", (args) => arrFunctions.radarrGetCalendar({
        startDate: args.startDate,
        endDate: args.endDate,
        limit: args.limit,
    }).then(wrapResponse));
    registry.register("radarr_get_profiles", () => arrFunctions.radarrGetProfiles().then(wrapResponse));
    registry.register("radarr_trigger_search", (args) => arrFunctions.radarrTriggerSearch({
        movieId: args.movieId,
    }).then(wrapResponse));
    // ──── Cross-service tools ────
    registry.register("arr_get_status", () => arrFunctions.arrGetStatus().then(wrapResponse));
    return registry;
}
function wrapResponse(data) {
    return { content: [{ type: "text", text: formatToolPayload(data) }] };
}
