/**
 * Módulo de interfaz de usuario.
 * Maneja el wizard, renderizado de preguntas, toast, dashboard y reseñas.
 */
import { escapeHTML } from './security.js';

// Estado global del wizard
let currentStep = 1;
const totalSteps = 3;
window.__surveyAnswers = {}; // accesible para validation.js

// Referencias a elementos del DOM
const btnNext = document.getElementById('btnNext');
const btnPrev = document.getElementById('btnPrev');
const progressFill = document.getElementById('progress-fill');
const questionsContainer = document.getElementById('questions-list');

const questions = [
    "Precisión técnica en los levantamientos ejecutados.",
    "Puntualidad del personal en campo.",
    "Calidad y claridad de los planos y carteras entregados.",
    "Uso de tecnología adecuada (GPS, Estación Total).",
    "Cumplimiento de normas de seguridad industrial.",
    "Tiempo de respuesta ante solicitudes urgentes.",
    "Comunicación técnica con el personal encargado.",
    "Orden y limpieza en el área de intervención."
];

// --- TOAST ---
export function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message; // seguro, textContent no evalúa HTML

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// --- WIZARD ---
export function updateWizard(step) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    const stepEl = document.querySelector(`.step[data-step="${step}"]`);
    if (stepEl) stepEl.classList.add('active');

    const progress = ((step - 1) / (totalSteps - 1)) * 100;
    progressFill.style.width = `${progress}%`;
    progressFill.setAttribute('aria-valuenow', Math.round(progress));

    btnPrev.style.visibility = step === 1 ? 'hidden' : 'visible';
    btnNext.textContent = step === totalSteps ? 'Enviar Encuesta' : 'Continuar';

    // Gestionar foco para accesibilidad
    const heading = stepEl?.querySelector('h2');
    if (heading) heading.focus();
}

export function getCurrentStep() {
    return currentStep;
}

export function setCurrentStep(val) {
    currentStep = val;
}

export function getTotalSteps() {
    return totalSteps;
}

export function getQuestionsCount() {
    return questions.length;
}

// --- RENDERIZAR PREGUNTAS CON DELEGACIÓN ---
export function renderQuestions() {
    questionsContainer.innerHTML = '';
    questions.forEach((q, i) => {
        const div = document.createElement('div');
        div.className = 'q-item';

        const span = document.createElement('span');
        span.className = 'q-text';
        span.textContent = `${i+1}. ${q}`;

        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'q-options';
        optionsDiv.dataset.qindex = i;

        ['Excelente', 'Bueno', 'Regular', 'Deficiente'].forEach(val => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'opt-btn';
            btn.textContent = val;
            btn.dataset.value = val;
            optionsDiv.appendChild(btn);
        });

        div.appendChild(span);
        div.appendChild(optionsDiv);
        questionsContainer.appendChild(div);
    });

    // Delegación de eventos para los botones de opción
    questionsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.opt-btn');
        if (!btn) return;

        const optionsDiv = btn.parentElement;
        const qIndex = parseInt(optionsDiv.dataset.qindex, 10);
        const value = btn.dataset.value;

        // Guardar respuesta
        window.__surveyAnswers[qIndex] = value;

        // Marcar activo
        optionsDiv.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
}

// --- ACTUALIZAR DASHBOARD ---
export function updateDashboard(avg, total) {
    document.getElementById('stat-avg').textContent = avg.toFixed(1);
    document.getElementById('stat-total').textContent = total;
}

// --- RENDERIZAR RESEÑAS DESDE DATOS SANITIZADOS ---
export function renderReviews(surveys) {
    const container = document.getElementById('reviews-container');
    if (!surveys || surveys.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 40px;">No hay encuestas registradas aún.</p>';
        return;
    }

    const fragment = document.createDocumentFragment();

    surveys.forEach(data => {
        const rating = data.rating || 0;
        const starsHTML = '★'.repeat(rating) + '☆'.repeat(5 - rating);

        const card = document.createElement('div');
        card.className = 'review-card';

        const header = document.createElement('div');
        header.className = 'review-header';

        const meta = document.createElement('div');
        meta.className = 'review-meta';

        const h4 = document.createElement('h4');
        h4.textContent = escapeHTML(data.nombre); // seguro

        const p = document.createElement('p');
        const empresa = escapeHTML(data.empresa || '');
        const fecha = data.fecha?.toDate ? data.fecha.toDate().toLocaleDateString() : '';
        p.textContent = `${empresa} • ${fecha}`;

        meta.appendChild(h4);
        meta.appendChild(p);

        const starsDiv = document.createElement('div');
        starsDiv.className = 'review-stars';
        starsDiv.textContent = starsHTML;

        header.appendChild(meta);
        header.appendChild(starsDiv);

        card.appendChild(header);

        if (data.comentario) {
            const commentP = document.createElement('p');
            commentP.className = 'review-comment';
            commentP.textContent = `"${escapeHTML(data.comentario)}"`;
            card.appendChild(commentP);
        }

        fragment.appendChild(card);
    });

    container.innerHTML = '';
    container.appendChild(fragment);
}

// --- SPINNER ---
export function showSpinner() {
    const container = document.getElementById('reviews-container');
    container.innerHTML = '<div class="spinner" aria-label="Cargando reseñas"></div>';
}