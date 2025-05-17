import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';

@Component({
	selector: 'app-date',
	imports: [DatePipe],
	templateUrl: './date.component.html',
	styleUrl: './date.component.scss',
})
export class DateComponent {
	isoDate = new Date().toISOString();

	ngOnInit(): void {
		this._updateDate();
	}

	_updateDate() {
		this.isoDate = new Date().toISOString();

		setTimeout(() => this._updateDate(), 1000);
	}
}
