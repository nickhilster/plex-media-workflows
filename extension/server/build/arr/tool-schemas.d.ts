/**
 * MCP tool schema definitions for Sonarr/Radarr tools.
 * Mirrors the pattern from plex/tool-schemas.ts and trakt/tool-schemas.ts.
 */
export declare const SONARR_TOOL_SCHEMAS: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            filter: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
                default: number;
            };
            query?: undefined;
            tvdbId?: undefined;
            title?: undefined;
            qualityProfileId?: undefined;
            rootFolderPath?: undefined;
            monitored?: undefined;
            seasonFolder?: undefined;
            monitorType?: undefined;
            searchForMissingEpisodes?: undefined;
            page?: undefined;
            pageSize?: undefined;
            startDate?: undefined;
            endDate?: undefined;
            seriesId?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            filter?: undefined;
            query: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
                default: number;
            };
            tvdbId?: undefined;
            title?: undefined;
            qualityProfileId?: undefined;
            rootFolderPath?: undefined;
            monitored?: undefined;
            seasonFolder?: undefined;
            monitorType?: undefined;
            searchForMissingEpisodes?: undefined;
            page?: undefined;
            pageSize?: undefined;
            startDate?: undefined;
            endDate?: undefined;
            seriesId?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            filter?: undefined;
            query?: undefined;
            tvdbId: {
                type: string;
                description: string;
            };
            title: {
                type: string;
                description: string;
            };
            qualityProfileId: {
                type: string;
                description: string;
            };
            rootFolderPath: {
                type: string;
                description: string;
            };
            monitored: {
                type: string;
                description: string;
                default: boolean;
            };
            seasonFolder: {
                type: string;
                description: string;
                default: boolean;
            };
            monitorType: {
                type: string;
                description: string;
                enum: string[];
                default: string;
            };
            searchForMissingEpisodes: {
                type: string;
                description: string;
                default: boolean;
            };
            page?: undefined;
            pageSize?: undefined;
            startDate?: undefined;
            endDate?: undefined;
            limit?: undefined;
            seriesId?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        required?: undefined;
        type: "object";
        properties: {
            filter?: undefined;
            query?: undefined;
            tvdbId?: undefined;
            title?: undefined;
            qualityProfileId?: undefined;
            rootFolderPath?: undefined;
            monitored?: undefined;
            seasonFolder?: undefined;
            monitorType?: undefined;
            searchForMissingEpisodes?: undefined;
            page: {
                type: string;
                description: string;
                default: number;
            };
            pageSize: {
                type: string;
                description: string;
                default: number;
            };
            startDate?: undefined;
            endDate?: undefined;
            limit?: undefined;
            seriesId?: undefined;
        };
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        required?: undefined;
        type: "object";
        properties: {
            filter?: undefined;
            query?: undefined;
            tvdbId?: undefined;
            title?: undefined;
            qualityProfileId?: undefined;
            rootFolderPath?: undefined;
            monitored?: undefined;
            seasonFolder?: undefined;
            monitorType?: undefined;
            searchForMissingEpisodes?: undefined;
            page?: undefined;
            pageSize?: undefined;
            limit: {
                type: string;
                description: string;
                default: number;
            };
            startDate?: undefined;
            endDate?: undefined;
            seriesId?: undefined;
        };
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        required?: undefined;
        type: "object";
        properties: {
            filter?: undefined;
            query?: undefined;
            tvdbId?: undefined;
            title?: undefined;
            qualityProfileId?: undefined;
            rootFolderPath?: undefined;
            monitored?: undefined;
            seasonFolder?: undefined;
            monitorType?: undefined;
            searchForMissingEpisodes?: undefined;
            page?: undefined;
            pageSize?: undefined;
            startDate: {
                type: string;
                description: string;
            };
            endDate: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
                default: number;
            };
            seriesId?: undefined;
        };
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        required?: undefined;
        type: "object";
        properties: {
            filter?: undefined;
            query?: undefined;
            tvdbId?: undefined;
            title?: undefined;
            qualityProfileId?: undefined;
            rootFolderPath?: undefined;
            monitored?: undefined;
            seasonFolder?: undefined;
            monitorType?: undefined;
            searchForMissingEpisodes?: undefined;
            page?: undefined;
            pageSize?: undefined;
            startDate?: undefined;
            endDate?: undefined;
            limit?: undefined;
            seriesId?: undefined;
        };
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        required?: undefined;
        type: "object";
        properties: {
            filter?: undefined;
            query?: undefined;
            tvdbId?: undefined;
            title?: undefined;
            qualityProfileId?: undefined;
            rootFolderPath?: undefined;
            monitored?: undefined;
            seasonFolder?: undefined;
            monitorType?: undefined;
            searchForMissingEpisodes?: undefined;
            page?: undefined;
            pageSize?: undefined;
            startDate?: undefined;
            endDate?: undefined;
            limit?: undefined;
            seriesId: {
                type: string;
                description: string;
            };
        };
    };
})[];
export declare const RADARR_TOOL_SCHEMAS: ({
    name: string;
    description: string;
    inputSchema: {
        required?: undefined;
        type: "object";
        properties: {
            query?: undefined;
            title?: undefined;
            qualityProfileId?: undefined;
            rootFolderPath?: undefined;
            monitored?: undefined;
            page?: undefined;
            pageSize?: undefined;
            startDate?: undefined;
            endDate?: undefined;
            filter: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
                default: number;
            };
            tmdbId?: undefined;
            minimumAvailability?: undefined;
            searchForMovie?: undefined;
            movieId?: undefined;
        };
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            filter?: undefined;
            title?: undefined;
            qualityProfileId?: undefined;
            rootFolderPath?: undefined;
            monitored?: undefined;
            page?: undefined;
            pageSize?: undefined;
            startDate?: undefined;
            endDate?: undefined;
            query: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
                default: number;
            };
            tmdbId?: undefined;
            minimumAvailability?: undefined;
            searchForMovie?: undefined;
            movieId?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            filter?: undefined;
            query?: undefined;
            page?: undefined;
            pageSize?: undefined;
            startDate?: undefined;
            endDate?: undefined;
            limit?: undefined;
            tmdbId: {
                type: string;
                description: string;
            };
            title: {
                type: string;
                description: string;
            };
            qualityProfileId: {
                type: string;
                description: string;
            };
            rootFolderPath: {
                type: string;
                description: string;
            };
            monitored: {
                type: string;
                description: string;
                default: boolean;
            };
            minimumAvailability: {
                type: string;
                description: string;
                enum: string[];
                default: string;
            };
            searchForMovie: {
                type: string;
                description: string;
                default: boolean;
            };
            movieId?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        required?: undefined;
        type: "object";
        properties: {
            filter?: undefined;
            query?: undefined;
            title?: undefined;
            qualityProfileId?: undefined;
            rootFolderPath?: undefined;
            monitored?: undefined;
            startDate?: undefined;
            endDate?: undefined;
            limit?: undefined;
            tmdbId?: undefined;
            minimumAvailability?: undefined;
            searchForMovie?: undefined;
            page: {
                type: string;
                description: string;
                default: number;
            };
            pageSize: {
                type: string;
                description: string;
                default: number;
            };
            movieId?: undefined;
        };
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        required?: undefined;
        type: "object";
        properties: {
            filter?: undefined;
            query?: undefined;
            title?: undefined;
            qualityProfileId?: undefined;
            rootFolderPath?: undefined;
            monitored?: undefined;
            page?: undefined;
            pageSize?: undefined;
            startDate?: undefined;
            endDate?: undefined;
            tmdbId?: undefined;
            minimumAvailability?: undefined;
            searchForMovie?: undefined;
            limit: {
                type: string;
                description: string;
                default: number;
            };
            movieId?: undefined;
        };
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        required?: undefined;
        type: "object";
        properties: {
            filter?: undefined;
            query?: undefined;
            title?: undefined;
            qualityProfileId?: undefined;
            rootFolderPath?: undefined;
            monitored?: undefined;
            page?: undefined;
            pageSize?: undefined;
            tmdbId?: undefined;
            minimumAvailability?: undefined;
            searchForMovie?: undefined;
            startDate: {
                type: string;
                description: string;
            };
            endDate: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
                default: number;
            };
            movieId?: undefined;
        };
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        required?: undefined;
        type: "object";
        properties: {
            filter?: undefined;
            query?: undefined;
            title?: undefined;
            qualityProfileId?: undefined;
            rootFolderPath?: undefined;
            monitored?: undefined;
            page?: undefined;
            pageSize?: undefined;
            startDate?: undefined;
            endDate?: undefined;
            limit?: undefined;
            tmdbId?: undefined;
            minimumAvailability?: undefined;
            searchForMovie?: undefined;
            movieId?: undefined;
        };
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        required?: undefined;
        type: "object";
        properties: {
            filter?: undefined;
            query?: undefined;
            title?: undefined;
            qualityProfileId?: undefined;
            rootFolderPath?: undefined;
            monitored?: undefined;
            page?: undefined;
            pageSize?: undefined;
            startDate?: undefined;
            endDate?: undefined;
            limit?: undefined;
            tmdbId?: undefined;
            minimumAvailability?: undefined;
            searchForMovie?: undefined;
            movieId: {
                type: string;
                description: string;
            };
        };
    };
})[];
export declare const ARR_CROSS_TOOL_SCHEMAS: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {};
    };
}[];
/** All 17 Arr tool schemas */
export declare const ARR_TOOL_SCHEMAS: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {};
    };
}[];
