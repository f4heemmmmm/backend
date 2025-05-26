export declare class AppService {
    getHealth(): {
        status: string;
        timestamp: string;
        uptime: number;
        environment: string;
        version: string;
    };
    getAppInformation(): {
        name: string;
        version: string;
        description: string;
        environment: string;
        author: string;
        license: string;
    };
}
