export function parseMathCalculation(raw: string) {
	const contextual = raw
		// multiplicación con y sin espacios
		.replace(/(\d+)\s*[x×]\s*(\d+)/g, '$1 * $2')
		.replace(/(\d+)[x×](\d+)/g, '$1 * $2')
		// división con y sin espacios
		.replace(/(\d+)\s*÷\s*(\d+)/g, '$1 / $2')
		.replace(/(\d+)÷(\d+)/g, '$1 / $2');
	const normalized = contextual
		.replace(/what is|qué es|cuánto es|cuanto es|calculate|calcula|es|equals|equal to|igual a|=|result of/g, '')
		.replace(/el doble de\s*/g, '2 * ')
		.replace(/la mitad de\s*/g, '0.5 * ')
		.replace(/square root of|raíz cuadrada de|sqrt/g, 'Math.sqrt')
		.replace(/cubic root of|raíz cúbica de|cbrt/g, 'Math.cbrt')
		.replace(/(\d+)\s*(\^|\*\*)\s*(\d+)/g, 'Math.pow($1,$3)')
		.replace(/(\d+)\s*(e|×10\^?)\s*(-?\d+)/g, '($1 * Math.pow(10,$3))')
		.replace(/(\d+)\s*(potencia de|power of|elevado a)\s*(\d+)/g, 'Math.pow($1,$3)')
		.replace(/(\d+(\.\d+)?)\s*% de\s*(\d+(\.\d+)?)/g, '($1/100)*$3')
		.replace(/\b(pi|π)\b/g, 'Math.PI')
		.replace(/\be\b/g, 'Math.E')
		.replace(/\bsin\((.*?)(\s*grados?)\)/g, 'Math.sin(($1)*Math.PI/180)')
		.replace(/\bcos\((.*?)(\s*grados?)\)/g, 'Math.cos(($1)*Math.PI/180)')
		.replace(/\btan\((.*?)(\s*grados?)\)/g, 'Math.tan(($1)*Math.PI/180)')
		.replace(/\bsin\((.*?)\)/g, 'Math.sin($1)')
		.replace(/\bcos\((.*?)\)/g, 'Math.cos($1)')
		.replace(/\btan\((.*?)\)/g, 'Math.tan($1)')
		.replace(/\basin\((.*?)\)/g, 'Math.asin($1)')
		.replace(/\bacos\((.*?)\)/g, 'Math.acos($1)')
		.replace(/\batan\((.*?)\)/g, 'Math.atan($1)')
		.replace(/\blog\((.*?)\)/g, 'Math.log10($1)')
		.replace(/\bln\((.*?)\)/g, 'Math.log($1)')
		.replace(/\babs\((.*?)\)/g, 'Math.abs($1)')
		.replace(/\bceil\((.*?)\)/g, 'Math.ceil($1)')
		.replace(/\bfloor\((.*?)\)/g, 'Math.floor($1)')
		.replace(/modulo|mod|modulus/g, '%')
		.replace(/veces|times|x|por/g, '*')
		.replace(/más|plus|add|suma/g, '+')
		.replace(/menos|minus|subtract|resta/g, '-')
		.replace(/entre|divided by|over|divide|dividir/g, '/')
		.replace(/[^\d\.\+\-\*\/%\(\)\sMathsqrtMathcbrtMathpowMathPIEMathsinMathcosMathtanMathasinMathacosMathatanMathlog10MathlogMathabsMathceilMathfloor]/g, '');
	try {
		const fn = new Function(`return (${normalized})`);
		const result = fn();
		return isFinite(result) ? { value: result } : null;
	} catch {
		return null;
	}
}
