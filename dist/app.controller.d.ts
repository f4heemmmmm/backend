import { AppService } from "./app.service";
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
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
