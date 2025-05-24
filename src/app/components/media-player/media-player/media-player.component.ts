import { Component, inject } from '@angular/core';
import { BridgeService } from '../../../utils/bridge/bridge.service';
import { StatusbarService } from '../../../utils/statusbar/statusbar.service';

@Component({
	selector: 'app-media-player',
	imports: [],
	templateUrl: './media-player.component.html',
	styleUrl: './media-player.component.scss',
})
export class MediaPlayerComponent {
	private readonly _statusbarService = inject(StatusbarService);
	private readonly _bridgeService = inject(BridgeService);

	Object = Object;

	media = this._statusbarService.media;
	isPlaying = this._statusbarService.isPlaying;

	pause() {
		this._bridgeService.requestMediaPause();
	}

	play() {
		this._bridgeService.requestMediaPlay();
	}

	getMediaThumbnail(base64?: string) {
		return `data:image/png;base64,${base64}`;
	}

	previous() {
		this._bridgeService.requestMediaSkipPrevious();
	}

	skip() {
		this._bridgeService.requestMediaSkipNext();
	}
}
