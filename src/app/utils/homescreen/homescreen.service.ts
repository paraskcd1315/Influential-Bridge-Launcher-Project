import { inject, Injectable, signal } from '@angular/core';
import { BridgeService } from '../bridge/bridge.service';

@Injectable({
	providedIn: 'root',
})
export class HomescreenService {
	private readonly _bridgeService = inject(BridgeService);
	wallpaper = signal<string>('');

	constructor() {
		this.wallpaper.set(this._bridgeService.getWallpaper());
	}

	refreshWall() {
		this._bridgeService.refreshWallpaper();
	}
}
