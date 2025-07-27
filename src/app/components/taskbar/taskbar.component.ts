import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, HostListener, inject, output, viewChild } from '@angular/core';
import { BridgeInstalledAppInfo } from '@bridgelauncher/api';
import { BridgeService } from '../../utils/bridge/bridge.service';
import { IconsService } from '../../utils/icons/icons.service';
import { PersistenceService } from '../../utils/persistence/persistence.service';
import { StatusbarService } from '../../utils/statusbar/statusbar.service';
import { ContextMenuService } from '../context-menu/context-menu.service';
import { StartButtonComponent } from './components/start-button/start-button.component';

@Component({
	selector: 'app-taskbar',
	imports: [StartButtonComponent, CommonModule],
	standalone: true,
	templateUrl: './taskbar.component.html',
	styleUrl: './taskbar.component.scss',
})
export class TaskbarComponent {
	private readonly _statusbarService = inject(StatusbarService);
	private readonly _iconService = inject(IconsService);
	private readonly _bridgeService = inject(BridgeService);
	private readonly _persistenceService = inject(PersistenceService);
	private readonly _contextMenuService = inject(ContextMenuService);
	pinnedApps = this._persistenceService.pinnedDockAppsStore;
	settings = this._persistenceService.settingsStore;

	statusbarEnabled = computed(() => {
		return this.settings().showHideStatusbar;
	});

	openStartMenuEventEmitter = output({ alias: 'openStartMenu' });
	taskbarRef = viewChild<ElementRef>('taskbarRef');

	wifiBars = ['', 'icon-ic_fluent_wifi_4_24_regular', 'icon-ic_fluent_wifi_3_24_regular', 'icon-ic_fluent_wifi_2_24_regular', 'icon-ic_fluent_wifi_1_24_regular'];

	telephonyBars = ['', 'icon-ic_fluent_cellular_data_5_24_regular', 'icon-ic_fluent_cellular_data_4_24_regular', 'icon-ic_fluent_cellular_data_3_24_regular', 'icon-ic_fluent_cellular_data_2_24_regular', 'icon-ic_fluent_cellular_data_1_24_regular'];

	batteryCharging = 'icon-ic_fluent_battery_charge_24_regular';

	batteryBars = [
		'icon-ic_fluent_battery_0_24_regular',
		'icon-ic_fluent_battery_1_24_regular',
		'icon-ic_fluent_battery_2_24_regular',
		'icon-ic_fluent_battery_3_24_regular',
		'icon-ic_fluent_battery_4_24_regular',
		'icon-ic_fluent_battery_5_24_regular',
		'icon-ic_fluent_battery_6_24_regular',
		'icon-ic_fluent_battery_7_24_regular',
		'icon-ic_fluent_battery_8_24_regular',
		'icon-ic_fluent_battery_9_24_regular',
		'icon-ic_fluent_battery_10_24_regular',
	];

	fullyCharged = 'icon-ic_fluent_battery_10_24_regular';

	batteryLevel = this._statusbarService.batteryLevel;
	batteryIsCharging = this._statusbarService.batteryIsCharging;
	wifiLevel = this._statusbarService.wifiLevel;
	mobileLevel = this._statusbarService.mobileLevel;
	mobileNetworkType = this._statusbarService.mobileNetworkType;
	notifications = this._statusbarService.notificationCounts;

	getAppIcon(packageName: string) {
		// Attempt to match any icon filename containing the iconName
		const matchedIcon = this._iconService.getAppIcon(packageName);
		if (matchedIcon) {
			return `assets/icons/icon-pack/${matchedIcon}`;
		}
		return this._bridgeService.getAppIcon(packageName);
	}

	openApp(packageName: string) {
		this._bridgeService.requestLaunchApp(packageName);
	}

	getBatteryIcon() {
		if (this.batteryLevel() < 100) {
			return this.batteryBars[Math.ceil(this.batteryLevel() / 10)];
		} else {
			return this.fullyCharged;
		}
	}

	onContextMenu(event: MouseEvent, app: BridgeInstalledAppInfo) {
		event.preventDefault();

		const { clientX, clientY } = event;
		const maxX = window.innerWidth;
		const maxY = window.innerHeight;
		const taskbarHeight = this.taskbarRef()?.nativeElement?.offsetHeight ?? 0;

		const contextMenuHeight = 290;
		let safeY = clientY;

		if (clientY + contextMenuHeight > maxY - taskbarHeight) {
			safeY = maxY - taskbarHeight - contextMenuHeight - 8;
		}

		const contextMenuWidth = 200;
		let safeX = clientX;

		if (clientX + contextMenuWidth > maxX) {
			safeX = maxX - contextMenuWidth - 8;
		}

		this._contextMenuService.initializeAppContextMenu(app, safeX, safeY);
	}

	@HostListener('document:click', ['$event'])
	onClick(event: MouseEvent) {
		this._contextMenuService.closeContextMenu();
	}

	expandNotificationShade() {
		this._bridgeService.requestExpandNotificationShade();
	}

	private _accentVariant(base: string, variation: number): string {
		// Convierte #rrggbb a r, g, b
		const r = parseInt(base.slice(1, 3), 16);
		const g = parseInt(base.slice(3, 5), 16);
		const b = parseInt(base.slice(5, 7), 16);

		// Aplica una variación aleatoria
		const delta = () => Math.max(0, Math.min(255, Math.floor(Math.random() * variation * 2 - variation)));

		const rV = Math.min(255, r + delta());
		const gV = Math.min(255, g + delta());
		const bV = Math.min(255, b + delta());

		return `rgb(${rV}, ${gV}, ${bV})`;
	}

	hasMatchedIcon(packageName?: string): boolean {
		if (!packageName) {
			return false;
		}
		const matchedIcon = this._iconService.getAppIcon(packageName);
		if (matchedIcon) {
			return true;
		}

		return false;
	}
}
