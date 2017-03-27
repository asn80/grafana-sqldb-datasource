declare var _default: {
    clickhouse: {
        Aggregations: ({
            type: string;
        } | {
            type: string;
            params: {
                name: string;
                type: string;
                dynamicLookup: boolean;
            }[];
            defaultParams: string[];
        } | {
            type: string;
            params: ({
                name: string;
                type: string;
                dynamicLookup: boolean;
            } | {
                name: string;
                type: string;
                options: string[];
            })[];
            defaultParams: string[];
            renderer: string;
        })[];
        Transform: {
            type: string;
            params: {
                name: string;
                dynamicLookup: boolean;
            }[];
            defaultParams: string[];
        }[];
        Transform_Other: ({
            type: string;
        } | {
            type: string;
            params: ({
                name: string;
            } | {
                name: string;
                dynamicLookup: boolean;
            })[];
        })[];
        Transform_Bit: {
            type: string;
            params: {
                name: string;
                dynamicLookup: boolean;
            }[];
        }[];
        Transform_Casting: {
            type: string;
            params: ({
                name: string;
                dynamicLookup: boolean;
            } | {
                name: string;
                type: string;
            })[];
        }[];
        Transform_DateTime: ({
            type: string;
            params: {
                name: string;
                dynamicLookup: boolean;
            }[];
        } | {
            type: string;
        })[];
        Transform_String: {
            type: string;
            params: ({
                name: string;
                dynamicLookup: boolean;
            } | {
                name: string;
            })[];
        }[];
        Transform_Array: {
            type: string;
            params: ({
                name: string;
                dynamicLookup: boolean;
            } | {
                name: string;
            })[];
        }[];
        Transform_URL: {
            type: string;
            params: ({
                name: string;
                dynamicLookup: boolean;
            } | {
                name: string;
            })[];
        }[];
        Transform_IPAddress: {
            type: string;
            params: {
                name: string;
                dynamicLookup: boolean;
            }[];
        }[];
        Transform_Rand: {
            type: string;
            params: any[];
        }[];
        Transform_Hash: {
            type: string;
            params: {
                name: string;
                dynamicLookup: boolean;
            }[];
        }[];
        Transform_Encoding: {
            type: string;
            params: {
                name: string;
                dynamicLookup: boolean;
            }[];
        }[];
        Transform_Math: {
            type: string;
            params: ({
                name: string;
                dynamicLookup: boolean;
            } | {
                name: string;
            })[];
        }[];
        Transform_Dictionary: {
            type: string;
            params: ({
                name: string;
            } | {
                name: string;
                dynamicLookup: boolean;
            })[];
        }[];
    };
};
export default _default;
