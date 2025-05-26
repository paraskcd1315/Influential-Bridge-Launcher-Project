import { DatePipe } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { AppGridService } from '../../utils/app-grid/app-grid.service';
import { HomescreenService } from '../../utils/homescreen/homescreen.service';

@Component({
	selector: 'app-date',
	imports: [DatePipe],
	templateUrl: './date.component.html',
	styleUrl: './date.component.scss',
})
export class DateComponent {
	private readonly _appGridService = inject(AppGridService);
	private readonly _homescreenService = inject(HomescreenService);
	isoDate = new Date().toISOString();

	editModeEnabled = this._appGridService.isEditMode;

	ngOnInit(): void {
		this._updateDate();
	}

	_updateDate() {
		this.isoDate = new Date().toISOString();

		setTimeout(() => this._updateDate(), 1000);
	}

	@HostListener('click')
	onClick() {
		this._homescreenService.refreshWall();
		setTimeout(() => {
			location.reload();
		}, 500);
	}

	cancelEditMode(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		this._appGridService.isEditMode.set(false);
	}
}
