import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { BridgeService } from './utils/bridge/bridge.service';
import { provideIcons } from './utils/icons/icons.provider';

export const appConfig: ApplicationConfig = {
    providers: [
        provideHttpClient(),
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        provideIcons(),
        provideAppInitializer(() => {
            const bridgeService = inject(BridgeService);
        }),
    ],
};
