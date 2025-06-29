export const HEXTORGB = (hex: string): string => {
	const match = RegExp(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i).exec(hex);
	if (!match) return '0,0,0';
	return `${parseInt(match[1], 16)},${parseInt(match[2], 16)},${parseInt(match[3], 16)}`;
};
