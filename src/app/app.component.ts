import { CommonModule } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { AppGridComponent } from './components/app-grid/app-grid.component';
import { ContextMenuComponent } from './components/context-menu/context-menu.component';
import { DateComponent } from './components/date/date.component';
import { MediaPlayerComponent } from './components/media-player/media-player/media-player.component';
import { SpotlightComponent } from './components/spotlight/spotlight.component';
import { SpotlightService } from './components/spotlight/spotlight.service';
import { StartMenuComponent } from './components/start-menu/start-menu.component';
import { StartMenuService } from './components/start-menu/start-menu.service';
import { TaskbarComponent } from './components/taskbar/taskbar.component';
import { WeatherComponent } from './components/weather/weather.component';
import { HomescreenService } from './utils/homescreen/homescreen.service';

@Component({
	selector: 'app-root',
	imports: [TaskbarComponent, StartMenuComponent, DateComponent, AppGridComponent, CommonModule, ContextMenuComponent, WeatherComponent, MediaPlayerComponent, SpotlightComponent],
	standalone: true,
	templateUrl: './app.component.html',
	styleUrl: './app.component.scss',
})
export class AppComponent {
	private readonly _spotlightService = inject(SpotlightService);
	private readonly _homescreenService = inject(HomescreenService);
	private readonly _startMenuService = inject(StartMenuService);

	wallpaper = this._homescreenService.wallpaper;

	startMenuActive = this._startMenuService.startMenuActive;

	openStartMenu() {
		this.startMenuActive.update((state) => !state);
	}

	private touchStartY = 0;
	private touchStartX = 0;

	@HostListener('touchstart', ['$event'])
	onTouchStart(event: TouchEvent) {
		this.touchStartY = event.touches[0].clientY;
		this.touchStartX = event.touches[0].clientX;
	}

	@HostListener('touchmove', ['$event'])
	onTouchMove(event: TouchEvent) {
		const currentX = event.touches[0].clientX;
		const deltax = Math.abs(currentX - this.touchStartX);
		if (deltax > 30) {
			return;
		}
		const currentY = event.touches[0].clientY;
		const deltaY = currentY - this.touchStartY;
		if (deltaY > 0) {
			this._spotlightService.openSpotlight();
			const progress = Math.min(deltaY / 200, 1);
			this._spotlightService.updateReveal(progress);
		} else if (deltaY < 0) {
			const currentReveal = this._spotlightService.spotlightReveal();
			const progress = Math.max(currentReveal + deltaY / 200, 0);
			this._spotlightService.updateReveal(progress);
		}
	}

	@HostListener('touchend', ['$event'])
	onTouchEnd(event: TouchEvent) {
		const endY = event.changedTouches[0].clientY;
		const endX = event.changedTouches[0].clientX;
		const deltaY = endY - this.touchStartY;
		const deltaX = endX - this.touchStartX;

		// If movement is minimal, treat it as a tap and do nothing
		if (Math.abs(deltaY) < 10 && Math.abs(deltaX) < 10) {
			return;
		}

		const duration = 200;
		const start = performance.now();

		if (deltaY > 60) {
			if (this._spotlightService.spotlightReveal() === 1) return;
			this._spotlightService.openSpotlight();
			const animateOpen = (now: number) => {
				const elapsed = now - start;
				const progress = Math.min(elapsed / duration, 1);
				this._spotlightService.updateReveal(progress);
				if (progress < 1) requestAnimationFrame(animateOpen);
			};
			requestAnimationFrame(animateOpen);
		} else {
			// Don't close immediately, animate reveal back to 0
			const currentReveal = this._spotlightService.spotlightReveal();
			const animateClose = (now: number) => {
				const elapsed = now - start;
				const progress = Math.min(elapsed / duration, 1);
				this._spotlightService.updateReveal(currentReveal * (1 - progress));
				if (progress < 1) {
					requestAnimationFrame(animateClose);
				} else {
					this._spotlightService.updateReveal(0);
					this._spotlightService.closeSpotlight();
				}
			};
			requestAnimationFrame(animateClose);
		}
	}
}
