export function parseDateExpressions(raw: string) {
	const weekdays = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
	const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
	const weekdays_en = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
	const months_en = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

	const namedDayMatch = raw.match(/^(el\s*)?(lunes|martes|miércoles|jueves|viernes|sábado|domingo)(\s+que\s+viene|\s+pasado)?$/);
	if (namedDayMatch) {
		const targetDay = weekdays.indexOf(namedDayMatch[2]);
		const offsetType = namedDayMatch[3]?.trim();
		const today = new Date();
		const currentDay = today.getDay();
		let delta = targetDay - currentDay;
		if (offsetType === 'pasado') delta -= delta >= 0 ? 7 : 0;
		else if (offsetType === 'que viene') delta += delta <= 0 ? 7 : 0;
		const result = new Date(today);
		result.setDate(today.getDate() + delta);
		return {
			value: Math.floor(result.getTime() / 1000),
			unit: 'timestamp',
			human: result.toLocaleString('default', {
				weekday: 'long',
				month: 'long',
				day: 'numeric',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			}),
		};
	}
	const namedDayMatchEn = raw.match(/^(next|last)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/);
	if (namedDayMatchEn) {
		const offsetType = namedDayMatchEn[1];
		const targetDay = weekdays_en.indexOf(namedDayMatchEn[2]);
		const today = new Date();
		const currentDay = today.getDay();
		let delta = targetDay - currentDay;
		if (offsetType === 'last') delta -= delta >= 0 ? 7 : 0;
		else if (offsetType === 'next') delta += delta <= 0 ? 7 : 0;
		const result = new Date(today);
		result.setDate(today.getDate() + delta);
		return {
			value: Math.floor(result.getTime() / 1000),
			unit: 'timestamp',
			human: result.toLocaleString('en', {
				weekday: 'long',
				month: 'long',
				day: 'numeric',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			}),
		};
	}
	const ordinalDayMatch = raw.match(/^(first|second|third|fourth|last)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+of\s+(january|february|march|april|may|june|july|august|september|october|november|december)$/);
	if (ordinalDayMatch) {
		const [_, pos, weekday, monthName] = ordinalDayMatch;
		const targetDay = weekdays_en.indexOf(weekday);
		const targetMonth = months_en.indexOf(monthName);
		const now = new Date();
		const year = now.getFullYear();
		let date: Date;
		if (/last/.test(pos)) {
			date = new Date(year, targetMonth + 1, 0); // last day of month
			while (date.getDay() !== targetDay) date.setDate(date.getDate() - 1);
		} else {
			const countMap = { first: 1, second: 2, third: 3, fourth: 4 };
			const nth = countMap[pos as keyof typeof countMap] ?? 1;
			date = new Date(year, targetMonth, 1);
			let matches = 0;
			while (matches < nth) {
				if (date.getDay() === targetDay) matches++;
				if (matches < nth) date.setDate(date.getDate() + 1);
			}
		}
		return {
			value: Math.floor(date.getTime() / 1000),
			unit: 'timestamp',
			human: date.toLocaleString('en', {
				weekday: 'long',
				month: 'long',
				day: 'numeric',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			}),
		};
	}
	const ordinalDayMatchEs = raw.match(/^(primer|primero|segundo|tercero|cuarto|último)\s+(lunes|martes|miércoles|jueves|viernes|sábado|domingo)\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)$/);
	if (ordinalDayMatchEs) {
		const [_, pos, weekday, monthName] = ordinalDayMatchEs;
		const targetDay = weekdays.indexOf(weekday);
		const targetMonth = months.indexOf(monthName);
		const year = new Date().getFullYear();
		let date: Date;
		if (/último/.test(pos)) {
			date = new Date(year, targetMonth + 1, 0);
			while (date.getDay() !== targetDay) date.setDate(date.getDate() - 1);
		} else {
			const countMap = { primer: 1, primero: 1, segundo: 2, tercero: 3, cuarto: 4 };
			const nth = countMap[pos as keyof typeof countMap] ?? 1;
			date = new Date(year, targetMonth, 1);
			let matches = 0;
			while (matches < nth) {
				if (date.getDay() === targetDay) matches++;
				if (matches < nth) date.setDate(date.getDate() + 1);
			}
		}
		return {
			value: Math.floor(date.getTime() / 1000),
			unit: 'timestamp',
			human: date.toLocaleString('default', {
				weekday: 'long',
				month: 'long',
				day: 'numeric',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			}),
		};
	}
	const dateLiteralMatchEn = raw.match(/^(march|april|may|june|july|august|september|october|november|december|january|february)\s*(\d{1,2})$/);
	if (dateLiteralMatchEn) {
		const month = months_en.indexOf(dateLiteralMatchEn[1]);
		const day = parseInt(dateLiteralMatchEn[2]);
		const today = new Date();
		const year = today.getMonth() > month || (today.getMonth() === month && today.getDate() > day) ? today.getFullYear() + 1 : today.getFullYear();
		const result = new Date(year, month, day);
		return {
			value: Math.floor(result.getTime() / 1000),
			unit: 'timestamp',
			human: result.toLocaleString('en', {
				weekday: 'long',
				month: 'long',
				day: 'numeric',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			}),
		};
	}
	const dateLiteralMatch = raw.match(/^el\s*(\d{1,2})\s*de\s*(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)$/);
	if (dateLiteralMatch) {
		const day = parseInt(dateLiteralMatch[1]);
		const month = months.indexOf(dateLiteralMatch[2]);
		const today = new Date();
		const year = today.getMonth() > month || (today.getMonth() === month && today.getDate() > day) ? today.getFullYear() + 1 : today.getFullYear();
		const result = new Date(year, month, day);
		return {
			value: Math.floor(result.getTime() / 1000),
			unit: 'timestamp',
			human: result.toLocaleString('default', {
				weekday: 'long',
				month: 'long',
				day: 'numeric',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			}),
		};
	}
	// Fecha: ejemplo "today + 3 months", "yesterday - 2 days", "yesteryear + 2 months"
	const dateMatch = raw.match(/^(today|hoy|tomorrow|mañana|yesterday|ayer|yesteryear|añopasado)\s*([\+\-])\s*(\d+)\s*(days?|días?|weeks?|semanas?|months?|meses?|years?|años?)$/);
	if (dateMatch) {
		const baseDate = (() => {
			if (/tomorrow|mañana/.test(dateMatch[1])) return new Date(Date.now() + 86400000);
			if (/yesterday|ayer/.test(dateMatch[1])) return new Date(Date.now() - 86400000);
			if (/yesteryear|añopasado/.test(dateMatch[1])) {
				const d = new Date();
				d.setFullYear(d.getFullYear() - 1);
				return d;
			}
			return new Date();
		})();
		const op = dateMatch[2];
		const amount = parseInt(dateMatch[3]);
		const unit = dateMatch[4];
		const deltaFn = {
			day: (d: Date, amt: number) => d.setDate(d.getDate() + amt),
			week: (d: Date, amt: number) => d.setDate(d.getDate() + amt * 7),
			month: (d: Date, amt: number) => d.setMonth(d.getMonth() + amt),
			year: (d: Date, amt: number) => d.setFullYear(d.getFullYear() + amt),
		};
		const targetDate = new Date(baseDate);
		if (/day/.test(unit) || /día/.test(unit)) deltaFn.day(targetDate, op === '+' ? amount : -amount);
		else if (/week|semana/.test(unit)) deltaFn.week(targetDate, op === '+' ? amount : -amount);
		else if (/month|mes/.test(unit)) deltaFn.month(targetDate, op === '+' ? amount : -amount);
		else if (/year|año/.test(unit)) deltaFn.year(targetDate, op === '+' ? amount : -amount);
		return {
			value: Math.floor(targetDate.getTime() / 1000),
			unit: 'timestamp',
			human: targetDate.toLocaleString('default', {
				weekday: 'long',
				month: 'long',
				day: 'numeric',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			}),
		};
	}
	return null;
}
