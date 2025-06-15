export function parseUnitConversions(raw: string) {
	const unitMatch = raw.match(
		/^(\d+(?:\.\d+)?)\s*(kg|kilograms?|kilogramos?|km|kilometers?|kilómetros?|l|liters?|litros?|cm|centimeters?|centímetros?|mm|milímetros?|m|meters?|metros?|yardas?|yards?|nm|nanometers?|nanómetros?|nautical miles?|millas náuticas?|light[-\s]?years?|años luz)\s*(a|en|to|in)\s*(pounds?|libras?|miles?|millas?|gallons?|galones?|inches?|pulgadas?|ft|pies?|feet|m|km|metros?|kilómetros?)$/i
	);
	if (unitMatch) {
		const value = parseFloat(unitMatch[1]);
		const from = unitMatch[2];
		const to = unitMatch[4];
		if ((from.includes('kg') || from.includes('kilo')) && (to.includes('pound') || to.includes('libra'))) {
			return { value: value * 2.20462, unit: 'lbs' };
		}
		if (from.includes('km') && (to.includes('mile') || to.includes('milla'))) {
			return { value: value * 0.621371, unit: 'miles' };
		}
		if (from.includes('l') && (to.includes('gallon') || to.includes('galon'))) {
			return { value: value * 0.264172, unit: 'gal' };
		}
		if ((from.includes('cm') || from.includes('centímetro') || from.includes('centimeter')) && (to.includes('inch') || to.includes('pulgada'))) {
			return { value: value * 0.393701, unit: 'in' };
		}
		if (from.includes('m') && !from.includes('ml') && (to.includes('ft') || to.includes('pie'))) {
			return { value: value * 3.28084, unit: 'ft' };
		}
		if (from.includes('mm') && (to.includes('inch') || to.includes('pulgada'))) {
			return { value: value * 0.0393701, unit: 'in' };
		}
		if ((from.includes('yard') || from.includes('yarda')) && to.includes('m')) {
			return { value: value * 0.9144, unit: 'm' };
		}
		if ((from.includes('nm') || from.includes('nanómetro') || from.includes('nanometer')) && to.includes('m')) {
			return { value: value * 1e-9, unit: 'm' };
		}
		if ((from.includes('nautical') || from.includes('náutica')) && to.includes('km')) {
			return { value: value * 1.852, unit: 'km' };
		}
		if ((from.includes('light') || from.includes('luz')) && to.includes('km')) {
			return { value: value * 9.461e12, unit: 'km' };
		}
	}
	return null;
}
