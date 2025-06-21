export function parseUnitConversions(raw: string) {
	const unitMatch = raw.match(
		/^(\d+(?:\.\d+)?)\s*(kg|kilograms?|kilogramos?|km|kilometers?|kilómetros?|l|liters?|litros?|cm|centimeters?|centímetros?|mm|milímetros?|m|meters?|metros?|yardas?|yards?|nm|nanometers?|nanómetros?|nautical miles?|millas náuticas?|light[-\s]?years?|años luz)\s*(a|en|to|in)\s*(pounds?|libras?|miles?|millas?|gallons?|galones?|inches?|pulgadas?|ft|pies?|feet|m|km|metros?|kilómetros?)$/i
	);
	if (unitMatch) {
		const value = parseFloat(unitMatch[1]);
		const from = unitMatch[2];
		const to = unitMatch[4];
		if ((from.includes('kg') || from.includes('kilo')) && (to.includes('pound') || to.includes('libra'))) {
			const converted = value * 2.20462;
			const grams = value * 1000;
			return {
				value: converted,
				unit: 'lbs',
				human: `${converted.toFixed(2)} lbs`,
				altHuman: value < 1 ? `${grams.toFixed(0)} g` : value >= 1000 ? `${(value / 1000).toFixed(2)} tons` : undefined,
			};
		}
		if (from.includes('km') && (to.includes('mile') || to.includes('milla'))) {
			const converted = value * 0.621371;
			return {
				value: converted,
				unit: 'miles',
				human: `${converted.toFixed(2)} miles`,
				altHuman: undefined,
			};
		}
		if (from.includes('l') && (to.includes('gallon') || to.includes('galon'))) {
			const converted = value * 0.264172;
			return {
				value: converted,
				unit: 'gal',
				human: `${converted.toFixed(2)} gal`,
				altHuman: undefined,
			};
		}
		if ((from.includes('cm') || from.includes('centímetro') || from.includes('centimeter')) && (to.includes('inch') || to.includes('pulgada'))) {
			const converted = value * 0.393701;
			const feet = converted / 12;
			return {
				value: converted,
				unit: 'in',
				human: `${converted.toFixed(2)} in`,
				altHuman: feet >= 1 ? `${feet.toFixed(2)} ft` : undefined,
			};
		}
		if ((from === 'm' || from === 'meter' || from === 'meters' || from === 'metro' || from === 'metros') && (to.includes('ft') || to.includes('pie'))) {
			const converted = value * 3.28084;
			const inches = converted * 12;
			return {
				value: converted,
				unit: 'ft',
				human: `${converted.toFixed(2)} ft`,
				altHuman: converted < 1 ? `${inches.toFixed(2)} in` : undefined,
			};
		}
		if (from.includes('mm') && (to.includes('inch') || to.includes('pulgada'))) {
			const converted = value * 0.0393701;
			return {
				value: converted,
				unit: 'in',
				human: `${converted.toFixed(2)} in`,
				altHuman: undefined,
			};
		}
		if ((from.includes('yard') || from.includes('yarda')) && to.includes('m')) {
			const converted = value * 0.9144;
			return {
				value: converted,
				unit: 'm',
				human: `${converted.toFixed(2)} m`,
				altHuman: undefined,
			};
		}
		if ((from.includes('nm') || from.includes('nanómetro') || from.includes('nanometer')) && to.includes('m')) {
			const converted = value * 1e-9;
			return {
				value: converted,
				unit: 'm',
				human: `${converted.toExponential(2)} m`,
				altHuman: undefined,
			};
		}
		if ((from.includes('nautical') || from.includes('náutica')) && to.includes('km')) {
			const converted = value * 1.852;
			return {
				value: converted,
				unit: 'km',
				human: `${converted.toFixed(2)} km`,
				altHuman: undefined,
			};
		}
		if ((from.includes('light') || from.includes('luz')) && to.includes('km')) {
			const converted = value * 9.461e12;
			return {
				value: converted,
				unit: 'km',
				human: `${converted.toExponential(2)} km`,
				altHuman: undefined,
			};
		}
	}
	return null;
}
