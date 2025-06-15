import { parseCurrencyConversion } from './currency-converter.utils';
import { parseDateExpressions } from './date-parser.utils';
import { parseMathCalculation } from './math-calculations.utils';
import { parseTemperatureConversion } from './temperature-converter.utils';
import { parseUnitConversions } from './unit-converter.utils';

export async function evaluateMathExpression(input: string, currency_access_key?: string): Promise<{ value: number; human?: string; unit?: string } | null> {
	const raw = (() => {
		let raw = input.toLowerCase().trim();
		const verbalNumbers = [
			{ regex: /\bmil millones\b/g, value: 1_000_000_000 },
			{ regex: /\bmil\b/g, value: 1000 },
			{ regex: /\bbillion\b/g, value: 1_000_000_000 },
			{ regex: /\bmillion\b/g, value: 1_000_000 },
			{ regex: /\bone\b/g, value: 1 },
		];
		for (const { regex, value } of verbalNumbers) {
			raw = raw.replace(regex, `${value}`);
		}
		return raw;
	})();

	// --- Main body: delegate to helpers in order ---
	const dateResult = parseDateExpressions(raw);
	if (dateResult) return dateResult;

	const unitResult = parseUnitConversions(raw);
	if (unitResult) return unitResult;

	const tempResult = parseTemperatureConversion(raw);
	if (tempResult) return tempResult;

	const currencyResult = await parseCurrencyConversion(raw, currency_access_key);
	if (currencyResult) return currencyResult;

	const mathResult = parseMathCalculation(raw);
	if (mathResult) return mathResult;

	return null;
}
