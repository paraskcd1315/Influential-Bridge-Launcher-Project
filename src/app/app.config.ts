import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { BridgeService } from './utils/bridge/bridge.service';
import { provideIcons } from './utils/icons/icons.provider';

export const appConfig: ApplicationConfig = {
	providers: [
		provideHttpClient(),
		provideZoneChangeDetection({ eventCoalescing: true }),
		provideRouter(routes),
		provideIcons(),
		provideAnimations(),
		provideAppInitializer(() => {
			const bridgeService = inject(BridgeService);
		}),
	],
};
