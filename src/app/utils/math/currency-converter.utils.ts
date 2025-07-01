export async function parseCurrencyConversion(raw: string, currency_access_key?: string) {
	if (!currency_access_key) {
		return null;
	}
	const currencyMatch = raw.match(/^(\d+(?:\.\d+)?)\s*(usd|eur|gbp|ars|cad|mxn|inr|yen|jpy|dólares?|euros?|libras?)\s*(a|en|to|in)\s*(usd|eur|gbp|ars|cad|mxn|inr|yen|jpy|dólares?|euros?|libras?)$/);
	if (currencyMatch) {
		const amount = parseFloat(currencyMatch[1]);
		let from = currencyMatch[2];
		let to = currencyMatch[4];
		const normalize = (s: string) => {
			s = s.toLowerCase();
			if (s.startsWith('usd') || s.startsWith('dólar')) return 'USD';
			if (s.startsWith('eur') || s.startsWith('euro')) return 'EUR';
			if (s.startsWith('gbp') || s.startsWith('libra')) return 'GBP';
			if (s.startsWith('ars')) return 'ARS';
			if (s.startsWith('cad')) return 'CAD';
			if (s.startsWith('mxn')) return 'MXN';
			if (s.startsWith('inr')) return 'INR';
			if (s.startsWith('jpy') || s.startsWith('yen')) return 'JPY';
			return s.toUpperCase();
		};
		from = normalize(from);
		to = normalize(to);
		try {
			const res = await fetch(`https://api.exchangerate.host/convert?access_key=${currency_access_key}&from=${from}&to=${to}&amount=${amount}`);
			const data = await res.json();
			if (data.result) {
				return {
					value: data.result,
					unit: to,
					human: `${amount} ${from} ≈ ${data.result.toFixed(2)} ${to}`,
				};
			}
		} catch {
			return null;
		}
	}
	return null;
}
