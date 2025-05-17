import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class IconsService {
	private readonly _httpClient = inject(HttpClient);
	private xmlIconMap: Record<string, string> = {};
	/**
	 * Constructor
	 */
	constructor() {
		const domSanitizer = inject(DomSanitizer);
		const matIconRegistry = inject(MatIconRegistry);

		// Register icon sets
		matIconRegistry.addSvgIconSetInNamespace('heroicons_outline', domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/heroicons-outline.svg'));
		matIconRegistry.addSvgIconSetInNamespace('heroicons_solid', domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/heroicons-solid.svg'));
		matIconRegistry.addSvgIconSetInNamespace('heroicons_mini', domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/heroicons-mini.svg'));

		this.loadXmlIconMap();
	}

	private async loadXmlIconMap() {
		const xmlString = await firstValueFrom(this._httpClient.get('assets/icons/icon-pack/appfilter.xml', { responseType: 'text' }));
		const parser = new DOMParser();
		const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
		const items = Array.from(xmlDoc.getElementsByTagName('item'));
		for (const item of items) {
			const componentAttr = item.getAttribute('component');
			const drawable = item.getAttribute('drawable');
			if (componentAttr && drawable) {
				const match = componentAttr.match(/ComponentInfo\{([^}]+)\}/);
				if (match) {
					const component = match[1].split('/')[0];
					this.xmlIconMap[component] = drawable;
				}
			}
		}
	}

	getAppIcon(packageName: string) {
		if (this.xmlIconMap[packageName]) {
			return `${this.xmlIconMap[packageName]}.png`;
		}

		return undefined;
	}
}
