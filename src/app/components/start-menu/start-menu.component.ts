import { CommonModule } from '@angular/common';
import { Component, computed, effect, ElementRef, HostListener, inject, input, OnInit, signal, viewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ContextMenuService } from '../context-menu/context-menu.service';
import { DialogComponent } from './dialog/dialog.component';
import { StartMenuDialogService } from './dialog/dialog.service';
import { DialogAction, DialogType, IDialogConfig } from './dialog/dialog.types';
import { StartMenuService } from './start-menu.service';
import { StartMenuTab } from './start-menu.types';
import { AppsTabComponent } from './tabs/apps-tab/apps-tab.component';
import { CalendarTabComponent } from './tabs/calendar-tab/calendar-tab.component';
import { ContactsComponent } from './tabs/contacts/contacts.component';
import { SettingsTabComponent } from './tabs/settings-tab/settings-tab.component';

@Component({
	selector: 'app-start-menu',
	imports: [CommonModule, MatIconModule, CalendarTabComponent, AppsTabComponent, SettingsTabComponent, ContactsComponent, DialogComponent],
	standalone: true,
	templateUrl: './start-menu.component.html',
	styleUrl: './start-menu.component.scss',
})
export class StartMenuComponent implements OnInit {
	Object = Object;
	startMenuTab = StartMenuTab;
	isoDate = new Date().toISOString();

	private readonly _startMenuService = inject(StartMenuService);
	private readonly _contextMenuService = inject(ContextMenuService);
	private readonly _dialogService = inject(StartMenuDialogService);

	active = input<boolean>();
	apps = this._startMenuService.apps;

	scrollAnchorContainer = viewChild<ElementRef<HTMLDivElement>>('scrollAnchorContainer');

	selectedTab = signal<StartMenuTab>(this.startMenuTab.Apps);

	activeLetter = this._startMenuService.activeLetter;

	enableCalendarTab = computed(() => this._startMenuService.settings().showHideStartMenuCalendar);
	enableContactsTab = computed(() => this._startMenuService.settings().showHideStartMenuContacts);
	enableAppsTab = computed(() => this._startMenuService.settings().showHideStartMenuApps);

	dialogConfig = signal<IDialogConfig | null>(null);
	selectedDialogAction = signal<DialogAction | null>(null);

	constructor() {
		effect(() => {
			if (this.active()) {
				setTimeout(() => {
					this.scrollAnchorContainer()?.nativeElement?.scrollTo({ top: 0, behavior: 'instant' });
				}, 0);
			}
		});
	}

	ngOnInit(): void {
		this._setActiveTab();
	}

	selectTab(tab: StartMenuTab) {
		setTimeout(() => {
			this.selectedTab.set(tab);
		}, 0);
	}

	@HostListener('document:click', ['$event'])
	onClick(event: MouseEvent) {
		this._contextMenuService.closeContextMenu();
	}

	openDialog(event: DialogAction) {
		switch (event) {
			case DialogAction.ResetSettings:
				this.dialogConfig.set({
					title: 'Reset Settings',
					message: 'Are you sure you want to reset all settings? This action cannot be undone.',
					confirmButtonText: 'Reset',
					cancelButtonText: 'Cancel',
				});
				this.selectedDialogAction.set(DialogAction.ResetSettings);
				this._dialogService.initializeDialog(DialogType.Confirmation);
				break;
			case DialogAction.ResetPinnedApps:
				this.dialogConfig.set({
					title: 'Reset Pinned Apps',
					message: 'Are you sure you want to reset all pinned apps? This action cannot be undone.',
					confirmButtonText: 'Reset',
					cancelButtonText: 'Cancel',
				});
				this.selectedDialogAction.set(DialogAction.ResetPinnedApps);
				this._dialogService.initializeDialog(DialogType.Confirmation);
				break;
			case DialogAction.ResetColors:
				this.dialogConfig.set({
					title: 'Reset Colors',
					message: 'Are you sure you want to reset all color settings? This action cannot be undone.',
					confirmButtonText: 'Reset',
					cancelButtonText: 'Cancel',
				});
				this.selectedDialogAction.set(DialogAction.ResetColors);
				this._dialogService.initializeDialog(DialogType.Confirmation);
				break;
			case DialogAction.AddWeatherApiKey:
				this.dialogConfig.set({
					title: 'Add Weather API Key',
					textFieldPlaceholder: 'Enter your Weather API key',
					confirmButtonText: 'Add',
					cancelButtonText: 'Cancel',
				});
				this.selectedDialogAction.set(DialogAction.AddWeatherApiKey);
				this._dialogService.initializeDialog(DialogType.Prompt);
				break;
			case DialogAction.AddCurrencyApiKey:
				this.dialogConfig.set({
					title: 'Add Currency API Key',
					textFieldPlaceholder: 'Enter your Currency API key',
					confirmButtonText: 'Add',
					cancelButtonText: 'Cancel',
				});
				this.selectedDialogAction.set(DialogAction.AddCurrencyApiKey);
				this._dialogService.initializeDialog(DialogType.Prompt);
				break;
			default:
				this._dialogService.dismissDialog();
				break;
		}
	}

	invokeDialogAction() {
		if (!this.selectedDialogAction()) return;

		switch (this.selectedDialogAction()) {
			case DialogAction.ResetSettings:
				this._dialogService.resetSettings();
				break;
			case DialogAction.ResetPinnedApps:
				this._dialogService.resetPinnedApps();
				break;
			case DialogAction.ResetColors:
				this._dialogService.resetColors();
				break;
			case DialogAction.AddWeatherApiKey:
				this._dialogService.addWeatherApiKey();
				break;
			case DialogAction.AddCurrencyApiKey:
				this._dialogService.addCurrencyApiKey();
				break;
		}

		this.resetDialog();
	}

	resetDialog() {
		this.dialogConfig.set(null);
		this.selectedDialogAction.set(null);
	}

	private _setActiveTab() {
		if (this.enableAppsTab()) {
			this.selectedTab.set(StartMenuTab.Apps);
		} else {
			this.selectedTab.set(StartMenuTab.Settings);
		}
	}
}
