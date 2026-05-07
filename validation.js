/**
 * Módulo de validaciones del formulario de encuesta.
 */
import { hasSuspiciousChars } from './security.js';
import { showToast } from './ui.js';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^[\d\s\-\+\(\)]{7,15}$/;

// Dominios desechables bloqueados
const DISPOSABLE_DOMAINS = [
    'mailinator.com', 'tempmail.com', 'guerrillamail.com',
    '10minutemail.com', 'yopmail.com', 'trashmail.com',
    'temp-mail.org', 'throwaway.email', 'sharklasers.com',
    'fakeinbox.com', 'emailondeck.com', 'mintemail.com',
    'spam4.me', 'tempr.email', 'discard.email', 'maildrop.cc'
];

// Patrones de spam en la parte local
const SPAM_PATTERNS = [
    /^asdf/, /^qwerty/, /^test\d*$/, /^prueba\d*$/,
    /^aaaa/, /^hola\d*$/, /^xyz/, /^abc\d*$/,
    /^nadie/, /^alguien/, /^correo/, /^email\d*$/,
    /^usuario/, /^sinemail/, /^noemail/, /^falso/,
    /^fake/, /^basura/, /^spam/,
    /^[a-z]{1}$/  // Una sola letra
];

/**
 * Detecta patrones de tecleo aleatorio (keyboard mashing)
 * incluso en cadenas cortas.
 */
function isKeyboardMashing(str) {
    const lower = str.toLowerCase();

    // Patrones típicos de teclas adyacentes (sin sentido)
    const keyboardPatterns = [
        /asdf/, /qwer/, /zxcv/, /hjkl/, /tyui/, /bnmv/, /fghj/,
        /asdj/, /ajsk/, /djks/, /fjdk/, /ghjk/, /jsdh/, /kdjf/,
        /alsk/, /dksl/, /fjsl/, /hgjd/, /jskd/, /ksld/, /lsdk/,
        /akaj/, /ajsh/, /ksjd/, /sjda/, /dash/, /jash/, /ksjd/
    ];

    if (keyboardPatterns.some(p => p.test(lower))) {
        return true;
    }

    // Cadena con más de 7 caracteres: si >70% son consonantes → basura
    if (str.length >= 8) {
        const consonantsOnly = str.replace(/[aeiou]/gi, '');
        const consonantRatio = consonantsOnly.length / str.length;
        if (consonantRatio > 0.7) {
            return true;
        }
    }

    // Más de 4 consonantes consecutivas en cualquier parte
    if (/[bcdfghjklmnpqrstvwxyz]{5,}/i.test(str)) {
        return true;
    }

    return false;
}

/**
 * Verifica si el dominio (sin TLD) es sospechoso.
 */
function isSuspiciousDomain(domain) {
    const name = domain.split('.')[0].toLowerCase(); // parte antes del último punto
    if (!name || name.length < 2) return true; // dominio demasiado corto

    // Dominios que parecen tecleo aleatorio (aplica la misma lógica)
    if (isKeyboardMashing(name)) {
        return true;
    }

    // Dominio sin vocales (ej: "gmaal" tiene vocales, pero "gml" no)
    if (!/[aeiou]/.test(name)) {
        return true;
    }

    // Solo números en el nombre de dominio
    if (/^\d+$/.test(name)) {
        return true;
    }

    return false;
}

export function validateStep1() {
    const name = document.getElementById('c_name').value.trim();
    const phone = document.getElementById('c_phone').value.trim();
    const email = document.getElementById('c_email').value.trim();

    if (!name || name.length < 2) {
        showToast('El nombre debe tener al menos 2 caracteres.', 'error');
        return false;
    }
    if (hasSuspiciousChars(name)) {
        showToast('El nombre contiene caracteres no permitidos.', 'error');
        return false;
    }
    if (!phone || !PHONE_REGEX.test(phone)) {
        showToast('Introduzca un número de teléfono válido (mínimo 7 dígitos).', 'error');
        return false;
    }

    // ========== VALIDACIÓN DE EMAIL BLINDADA ==========
    if (!email) {
        showToast('El correo electrónico es obligatorio.', 'error');
        return false;
    }
    if (!EMAIL_REGEX.test(email)) {
        showToast('El formato del correo no es válido (ej: nombre@empresa.com).', 'error');
        return false;
    }
    if (hasSuspiciousChars(email)) {
        showToast('El correo contiene caracteres sospechosos.', 'error');
        return false;
    }
    if ((email.match(/@/g) || []).length > 1) {
        showToast('El correo contiene múltiples arrobas.', 'error');
        return false;
    }

    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) {
        showToast('El correo no tiene una estructura válida.', 'error');
        return false;
    }

    // 1. Longitud mínima de la parte local: al menos 2 caracteres y no solo números
    if (localPart.length < 2) {
        showToast('La parte local del correo es demasiado corta.', 'error');
        return false;
    }
    if (/^\d+$/.test(localPart)) {
        showToast('La parte local del correo no puede ser solo números.', 'error');
        return false;
    }

    // 2. Bloquear dominios desechables
    if (DISPOSABLE_DOMAINS.includes(domain.toLowerCase())) {
        showToast('No se permiten correos temporales o desechables.', 'error');
        return false;
    }

    // 3. Bloquear patrones de spam en parte local
    if (SPAM_PATTERNS.some(p => p.test(localPart.toLowerCase()))) {
        showToast('Por favor, introduzca un correo electrónico real.', 'error');
        return false;
    }

    // 4. Detectar tecleo aleatorio mejorado (desde 8 caracteres)
    if (isKeyboardMashing(localPart)) {
        showToast('El correo electrónico no parece ser válido. Verifíquelo.', 'error');
        return false;
    }

    // 5. Longitud máxima de la parte local
    if (localPart.length > 30) {
        showToast('La parte local del correo es demasiado larga.', 'error');
        return false;
    }

    // 6. Dominio sospechoso (sin vocales, tecleo, etc.)
    if (isSuspiciousDomain(domain)) {
        showToast('El dominio del correo no parece legítimo.', 'error');
        return false;
    }

    // 7. Extensión TLD válida
    const tld = domain.split('.').pop();
    if (!tld || tld.length < 2) {
        showToast('El dominio del correo no es válido.', 'error');
        return false;
    }

    return true;
}

export function validateStep2(questionsCount) {
    const answered = Object.keys(window.__surveyAnswers || {}).length;
    if (answered < questionsCount) {
        showToast('Debe responder todas las preguntas técnicas.', 'error');
        return false;
    }
    return true;
}

export function validateStep3() {
    const rating = document.querySelector('input[name="rating"]:checked');
    if (!rating) {
        showToast('Seleccione una calificación de 1 a 5 estrellas.', 'error');
        return false;
    }
    const comment = document.getElementById('c_comment').value.trim();
    if (comment && hasSuspiciousChars(comment)) {
        showToast('El comentario contiene caracteres no permitidos.', 'error');
        return false;
    }
    if (comment.length > 500) {
        showToast('El comentario no puede exceder los 500 caracteres.', 'error');
        return false;
    }
    return true;
}