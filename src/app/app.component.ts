import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, computed, HostListener, inject } from '@angular/core';
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
import { BridgeService } from './utils/bridge/bridge.service';
import { HEXTORGB } from './utils/colors/colors.utils';
import { HomescreenService } from './utils/homescreen/homescreen.service';
import { PersistenceService } from './utils/persistence/persistence.service';
import { TouchStateService } from './utils/touch-state/touch-state.service';

@Component({
	selector: 'app-root',
	imports: [TaskbarComponent, StartMenuComponent, DateComponent, AppGridComponent, CommonModule, ContextMenuComponent, WeatherComponent, MediaPlayerComponent, SpotlightComponent],
	standalone: true,
	templateUrl: './app.component.html',
	styleUrl: './app.component.scss',
})
export class AppComponent implements AfterViewInit {
	private readonly _bridgeService = inject(BridgeService);
	private readonly _spotlightService = inject(SpotlightService);
	private readonly _homescreenService = inject(HomescreenService);
	private readonly _startMenuService = inject(StartMenuService);
	private readonly _touchState = inject(TouchStateService);
	private readonly _persistenceService = inject(PersistenceService);

	settings = this._persistenceService.settingsStore;
	colorSettings = this._persistenceService.colorSettingsStore;

	enableDateSetting = computed(() => {
		return this.settings().showHideHomescreenDate ?? true;
	});

	enableStatusbarSetting = computed(() => {
		return this.settings().showHideStatusbar ?? true;
	});

	enableSpotlightSetting = computed(() => {
		return this.settings().enableSpotlight ?? true;
	});

	enableMediaWidgetSetting = computed(() => {
		return this.settings().enableMediaWidget ?? true;
	});

	enableWeatherWidgetSetting = computed(() => {
		return this.settings().enableWeatherWidget ?? true;
	});

	moveAppGrid = computed(() => {
		return !this.enableMediaWidgetSetting() && !this.enableWeatherWidgetSetting();
	});

	ngAfterViewInit(): void {
		this._injectMonetColorsToCss();
	}

	wallpaper = this._homescreenService.wallpaper;

	startMenuActive = this._startMenuService.startMenuActive;

	openStartMenu() {
		this.startMenuActive.update((state) => !state);
	}

	private touchStartY = 0;
	private touchStartX = 0;

	private spotlightProgress = 0;
	private spotlightFrameRequested = false;

	@HostListener('touchstart', ['$event'])
	onTouchStart(event: TouchEvent) {
		this.touchStartY = event.touches[0].clientY;
		this.touchStartX = event.touches[0].clientX;
	}

	@HostListener('touchmove', ['$event'])
	onTouchMove(event: TouchEvent) {
		const target = event.target as HTMLElement;
		if (this._touchState.isGridScrollingHorizontally() || target.closest('.media-weather-scroll')) {
			return;
		}
		if (target.closest('[data-scrollable]')) {
			return; // Skip spotlight reveal if inside scrollable content
		}

		const currentX = event.touches[0].clientX;
		const deltax = Math.abs(currentX - this.touchStartX);
		const currentY = event.touches[0].clientY;
		const deltaY = currentY - this.touchStartY;
		const ratio = Math.abs(deltaY) / Math.abs(deltax);
		if (ratio < 1) {
			return;
		}
		let progress = 0;
		if (deltaY > 0) {
			this._spotlightService.openSpotlight();
			progress = Math.min(deltaY / 200, 1);
		} else if (deltaY < 0) {
			const currentReveal = this._spotlightService.spotlightReveal();
			progress = currentReveal + deltaY / 300;
			progress = Math.max(progress, 0);
		}

		const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
		progress = easeOut(progress);
		progress = Math.min(progress, 1);

		this.spotlightProgress = progress;

		if (progress === 0) {
			this.touchStartY = event.touches[0].clientY;
		}

		if (!this.spotlightFrameRequested) {
			this.spotlightFrameRequested = true;
			requestAnimationFrame(() => {
				this._spotlightService.updateReveal(this.spotlightProgress);
				this.spotlightFrameRequested = false;
			});
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

		const revealThreshold = 0.4;

		const currentReveal = this._spotlightService.spotlightReveal();

		if (deltaY > 60 || currentReveal >= revealThreshold) {
			this._spotlightService.openSpotlight();

			if (currentReveal === 1) return;

			const animateOpen = (now: number) => {
				const elapsed = now - start;
				const progress = Math.min(elapsed / duration, 1);
				const value = currentReveal + (1 - currentReveal) * progress;
				this._spotlightService.updateReveal(value);
				if (progress < 1) requestAnimationFrame(animateOpen);
			};

			requestAnimationFrame(animateOpen);
			return;
		}

		const animateClose = (now: number) => {
			const elapsed = now - start;
			const progress = Math.min(elapsed / duration, 1);
			const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
			const value = (1 - easeOut(progress)) * currentReveal;
			this._spotlightService.updateReveal(value);
			if (progress < 1) {
				requestAnimationFrame(animateClose);
			} else {
				this._spotlightService.updateReveal(0);
				this._spotlightService.closeSpotlight();
			}
		};
		requestAnimationFrame(animateClose);
	}

	private _injectMonetColorsToCss() {
		const palette = this._bridgeService.getMonetColors(); // Esto debe ser un objeto con las claves: accent, background, textPrimary
		if (!palette) return;

		for (const [key, value] of Object.entries(palette)) {
			let newValue = value;
			switch (key) {
				case 'accent':
					newValue = this.colorSettings().accent;
					break;
				case 'background':
					newValue = this.colorSettings().background;
					break;
				case 'textPrimary':
					newValue = this.colorSettings().textPrimary;
					break;
				default:
					newValue = value;
					break;
			}
			const hex = newValue;
			const rgb = HEXTORGB(hex);
			document.documentElement.style.setProperty(`--monet-${key}`, hex);
			document.documentElement.style.setProperty(`--monet-${key}-rgb`, rgb);
		}
	}
}
