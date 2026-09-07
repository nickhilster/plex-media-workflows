/**
 * Plex API constants and configuration defaults
 */
export declare const PLEX_TYPE_IDS: Record<string, number>;
/**
 * Numeric libtype IDs used inside smart playlist search URIs
 * (e.g. /library/sections/1/all?type=N). This is a superset of PLEX_TYPE_IDS
 * — it includes season/photoalbum/photo which are valid smart-playlist filter
 * targets but are not exposed elsewhere.
 */
export declare const SMART_PLAYLIST_LIBTYPE_IDS: Record<string, number>;
export declare const DEFAULT_LIMITS: {
    readonly recentlyAdded: 50;
    readonly recentlyWatched: 100;
    readonly watchHistory: 500;
    readonly fullyWatched: 500;
    readonly popularContent: 50;
    readonly libraryItems: 1000;
    readonly searchMedia: 500;
    readonly exportPageSize: 500;
    readonly recommendations: 10;
};
export declare const RECENCY_HALF_LIFE_DAYS = 180;
export declare const TASTE_TOP_GENRES = 10;
export declare const TASTE_TOP_DIRECTORS = 10;
export declare const TASTE_TOP_ACTORS = 20;
export declare const MIN_WATCHED_FOR_RECOMMENDATIONS = 5;
export declare const DEFAULT_PLEX_URL = "http://localhost:32400";
export declare const PLEX_CONTAINER_SIZE = 1000;
export declare const SUMMARY_PREVIEW_LENGTH = 500;
export declare const PLEX_MUTATIVE_OPS_ENV_VAR = "PLEX_ENABLE_MUTATIVE_OPS";
/** Standardized completion threshold (90%) — was inconsistent 85%/90% across codebase */
export declare const COMPLETION_THRESHOLD = 0.9;
/** Minimum duration (ms) before applying completion threshold logic.
 *  Content shorter than this is considered 'completed' if viewCount > 0.
 *  Prevents short trailers/clips from false-positive completion detection. */
export declare const MIN_COMPLETION_DURATION_MS: number;
export declare function isMutativeOpsEnabled(): boolean;
/**
 * Determine if item is completed, accounting for short-duration content.
 * Items shorter than MIN_COMPLETION_DURATION_MS require only viewCount > 0.
 * Longer items require progress >= COMPLETION_THRESHOLD.
 */
export declare function isContentCompleted(duration: number | undefined, viewOffset: number | undefined, viewCount: number | undefined): boolean;
