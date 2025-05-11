import { computed, inject, Injectable, signal } from '@angular/core';
import { BridgeInstalledAppInfo } from '@bridgelauncher/api';
import { BridgeService } from '../../utils/bridge/bridge.service';

@Injectable({
    providedIn: 'root',
})
export class StartMenuService {
    private readonly _bridgeService = inject(BridgeService);

    filter = signal<string | undefined>(undefined);
    apps = this._bridgeService.apps;

    filteredApps = computed(() => {
        if ((this.filter() as string)?.length > 0) {
            return this.apps().filter((app) => app.label.includes(this.filter()!));
        }

        return [] as BridgeInstalledAppInfo[];
    });

    getAppIcon(packageName: string) {
        return this._bridgeService.getAppIcon(packageName);
    }

    openApp(packageName: string) {
        return this._bridgeService.requestLaunchApp(packageName);
    }
}
