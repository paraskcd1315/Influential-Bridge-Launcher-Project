import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { DialogService } from './dialog.service';

@Component({
	selector: 'app-dialog',
	imports: [CommonModule],
	templateUrl: './dialog.component.html',
	styleUrl: './dialog.component.scss',
})
export class DialogComponent {
	private readonly _dialogService = inject(DialogService);
	isVisible = this._dialogService.isVisible;
	selectedApp = this._dialogService.selectedApp;

	dismiss() {
		this._dialogService.dismissDialog();
	}

	remove() {
		this._dialogService.removeAppFromFavourites();
	}

	uninstall() {
		this._dialogService.uninstallApp();
	}
}
