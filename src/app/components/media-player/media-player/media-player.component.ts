import { Component, HostListener, inject } from '@angular/core';
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

	pause(event: MouseEvent) {
		event.stopPropagation();
		this._bridgeService.requestMediaPause();
	}

	play(event: MouseEvent) {
		event.stopPropagation();
		this._bridgeService.requestMediaPlay();
	}

	getMediaThumbnail(base64?: string) {
		return `data:image/png;base64,${base64}`;
	}

	previous(event: MouseEvent) {
		event.stopPropagation();
		this._bridgeService.requestMediaSkipPrevious();
	}

	skip(event: MouseEvent) {
		event.stopPropagation();
		this._bridgeService.requestMediaSkipNext();
	}

	@HostListener('click')
	appLaunch() {
		this._bridgeService.requestMediaAppLaunch();
	}
}
