/**
 * Módulo de seguridad: sanitización y prevención de XSS.
 * Se utiliza en todo el proyecto para escapar contenido dinámico.
 */

/**
 * Escapa caracteres HTML para prevenir inyección de scripts.
 * @param {string} str - Texto potencialmente peligroso.
 * @returns {string} Texto seguro para insertar en el DOM.
 */
export function escapeHTML(str) {
    if (!str || typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Valida si un string contiene solo caracteres seguros (sin scripts).
 * @param {string} str
 * @returns {boolean}
 */
export function hasSuspiciousChars(str) {
    const pattern = /<script|javascript:|on\w+\s*=/gi;
    return pattern.test(str);
}