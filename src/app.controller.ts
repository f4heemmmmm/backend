import { AppService } from "./app.service";
import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("Application")
@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get("health")
    @ApiOperation({ summary: "Get application health status. "})
    @ApiResponse({ status: 200, description: "Returns the health status of the application." })
    getHealth() {
        return this.appService.getHealth();
    }

    @Get("information")
    @ApiOperation({ summary: "Get application information "})
    @ApiResponse({ status: 200, description: "Returns basic information about the application "})
    gettAppInformation() {
        return this.appService.getAppInformation();
    }
}