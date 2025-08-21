export declare class PostizApiClientAlternative {
    private apiKey;
    private baseUrl;
    private client;
    constructor(apiKey: string, baseUrl: string);
    getChannelsStrategy1(): Promise<any>;
    getChannelsStrategy2(): Promise<any>;
    getChannelsStrategy3(): Promise<any>;
    getChannelsStrategy4(): Promise<any>;
    getChannelsStrategy5(): Promise<any>;
    getChannelsStrategy6(): Promise<any>;
    tryAllStrategies(): Promise<{
        strategy: string;
        result: any;
    }>;
}
//# sourceMappingURL=postiz-api-alternative.d.ts.map