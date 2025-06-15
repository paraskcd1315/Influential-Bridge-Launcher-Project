export function parseTemperatureConversion(raw: string) {
	const tempMatch = raw.match(/^(-?\d+(?:\.\d+)?)\s*(c|celsius|°c)\s*(a|to|en|in)\s*(f|fahrenheit|°f)$/) || raw.match(/^(-?\d+(?:\.\d+)?)\s*(f|fahrenheit|°f)\s*(a|to|en|in)\s*(c|celsius|°c)$/);
	if (tempMatch) {
		const value = parseFloat(tempMatch[1]);
		const from = tempMatch[2];
		const to = tempMatch[4];
		if (/c/.test(from) && /f/.test(to)) {
			const result = (value * 9) / 5 + 32;
			return { value: result, unit: '°F' };
		} else if (/f/.test(from) && /c/.test(to)) {
			const result = ((value - 32) * 5) / 9;
			return { value: result, unit: '°C' };
		}
	}
	return null;
}
