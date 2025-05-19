import { inject, Injectable, signal } from '@angular/core';
import { BridgeService } from '../bridge/bridge.service';

@Injectable({
	providedIn: 'root',
})
export class HomescreenService {
	private readonly _bridgeService = inject(BridgeService);
	wallpaper = signal<string>('');

	constructor() {
		this._init();
	}

	refreshWall() {
		this._bridgeService.refreshWallpaper();
		setTimeout(() => {
			this._init();
		}, 1000);
	}

	private _init() {
		this.wallpaper.set(this._bridgeService.getWallpaperInfo());
	}
}
