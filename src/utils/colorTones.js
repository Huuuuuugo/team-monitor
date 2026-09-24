function parseHex(color) {
    const value = String(color || '').replace('#', '').trim()
    const full = value.length === 3 ? value.split('').map(char => char + char).join('') : value
    const int = parseInt(full, 16)
    if (!/^[0-9a-f]{6}$/i.test(full) || Number.isNaN(int)) return { r: 148, g: 163, b: 184 }
    return {
        r: (int >> 16) & 255,
        g: (int >> 8) & 255,
        b: int & 255,
    }
}

function mix({ r, g, b }, target, amount) {
    return {
        r: Math.round(r + (target - r) * amount),
        g: Math.round(g + (target - g) * amount),
        b: Math.round(b + (target - b) * amount),
    }
}

export function toneFromColor(color, isDark) {
    const rgb = parseHex(color)
    const text = isDark ? mix(rgb, 255, 0.5) : mix(rgb, 0, 0.45)
    const alpha = isDark ? 0.2 : 0.14
    return {
        backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`,
        color: `rgb(${text.r}, ${text.g}, ${text.b})`,
    }
}
