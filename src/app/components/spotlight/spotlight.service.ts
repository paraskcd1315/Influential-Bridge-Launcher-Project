import { computed, inject, Injectable, signal } from '@angular/core';
import { AppGridService } from '../../utils/app-grid/app-grid.service';
import { BridgeService } from '../../utils/bridge/bridge.service';
import { StartMenuService } from '../start-menu/start-menu.service';

@Injectable({
	providedIn: 'root',
})
export class SpotlightService {
	private readonly _appgridService = inject(AppGridService);
	private readonly _bridgeService = inject(BridgeService);
	private readonly _startMenuService = inject(StartMenuService);

	spotlightActive = signal<boolean>(false);
	spotlightReveal = signal<number>(0);

	searchQuery = signal<string | undefined>(undefined);

	apps = this._bridgeService.apps;

	suggestions = computed(() => {
		const query = this.searchQuery();
		if (!query) {
			return [];
		}
		return JSON.parse(this._bridgeService.getGoogleSearchSuggestions(query) || '[]').slice(0, 5);
	});

	filteredApps = computed(() => {
		const query = this.searchQuery();
		if (!query) {
			return [];
		}
		return this.apps()
			.filter((app) => app.label.toLowerCase().includes(query.toLowerCase()))
			.slice(0, 5);
	});

	openSpotlight() {
		if (!this._appgridService.isEditMode() && !this._startMenuService.startMenuActive()) {
			this.spotlightActive.set(true);
		}
	}

	updateReveal(progress: number) {
		if (!this._appgridService.isEditMode() && !this._startMenuService.startMenuActive()) {
			this.spotlightReveal.set(progress);
		}
	}

	closeSpotlight() {
		this.searchQuery.set(undefined);
		this.spotlightActive.set(false);
	}

	toggleSpotlight() {
		this.spotlightActive.update((state) => !state);
	}

	updateSearchQuery(query: string | undefined) {
		this.searchQuery.set(query);
	}

	getAppIcon(packageName: string) {
		return this._bridgeService.getAppIcon(packageName);
	}

	openSuggestion(suggestion: string) {
		this._bridgeService.requestGoogleSearch(suggestion);
		this.closeSpotlight();
	}

	openApp(packageName: string) {
		this._bridgeService.requestLaunchApp(packageName);
		this.closeSpotlight();
	}
}
