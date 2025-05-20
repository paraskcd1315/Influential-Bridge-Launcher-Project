import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, signal } from '@angular/core';
import { AppGridComponent } from './components/app-grid/app-grid.component';
import { ContextMenuComponent } from './components/context-menu/context-menu.component';
import { DateComponent } from './components/date/date.component';
import { StartMenuComponent } from './components/start-menu/start-menu.component';
import { TaskbarComponent } from './components/taskbar/taskbar.component';
import { WeatherComponent } from './components/weather/weather.component';
import { HomescreenService } from './utils/homescreen/homescreen.service';

@Component({
	selector: 'app-root',
	imports: [TaskbarComponent, StartMenuComponent, DateComponent, AppGridComponent, CommonModule, ContextMenuComponent, WeatherComponent],
	standalone: true,
	templateUrl: './app.component.html',
	styleUrl: './app.component.scss',
})
export class AppComponent implements AfterViewInit {
	private readonly _homescreenService = inject(HomescreenService);
	startMenuActive = signal<boolean>(false);

	wallpaper = this._homescreenService.wallpaper;

	openStartMenu() {
		this.startMenuActive.update((state) => !state);
	}

	ngAfterViewInit(): void {
		const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

		let targetX = 0;
		let targetY = 0;
		let currentX = 0;
		let currentY = 0;

		const lerp = (start: number, end: number, amt: number) => start + (end - start) * amt;

		const applyParallax = () => {
			currentX = lerp(currentX, targetX, 0.07);
			currentY = lerp(currentY, targetY, 0.07);

			const layers = [
				{ id: 'app-grid', intensity: 0.5 },
				{ id: 'weather', intensity: 0.6 },
				{ id: 'start-menu', intensity: 0.2 },
				{ id: 'taskbar', intensity: 0.2 },
			];

			layers.forEach(({ id, intensity }) => {
				const el = document.getElementById(id) || (this as any)[id]?.nativeElement;
				if (el) {
					const rotateX = clamp(currentY * intensity * 0.5, -4, 4);
					const rotateY = clamp(currentX * intensity * 0.5, -4, 4);
					const translateX = clamp(currentX * intensity * 4, -12, 12);
					const translateY = clamp(currentY * intensity * 4, -12, 12);
					const scale = clamp(1 + intensity * 0.01, 1, 1.02);

					el.style.transform = `
						perspective(800px)
						rotateX(${rotateX}deg)
						rotateY(${rotateY}deg)
						translateX(${translateX}px)
						translateY(${translateY}px)
						scale(${scale})
					`;

					el.style.transition = 'transform 0.05s ease-out';
					el.style.transformStyle = 'preserve-3d';
					el.style.willChange = 'transform';
				}
			});

			requestAnimationFrame(applyParallax);
		};

		window.addEventListener('deviceorientation', (e) => {
			const rawX = (e.gamma ?? 0) / 6;
			const rawY = (e.beta ?? 0) / 6;

			// Detect if the phone is lying flat (beta near ±90°)
			const beta = Math.abs(e.beta ?? 0);
			const isFlat = beta > 70;

			const lerpToZero = (v: number) => lerp(v, 0, 0.1);
			targetX = isFlat ? lerpToZero(targetX) : clamp(rawX, -6, 6);
			targetY = isFlat ? lerpToZero(targetY) : clamp(rawY, -6, 6);
		});

		requestAnimationFrame(applyParallax);
	}
}
