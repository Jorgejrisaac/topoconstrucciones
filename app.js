/**
 * Módulo principal.
 * Orquesta la aplicación: eventos, navegación del wizard, envío y carga de datos.
 */
import { escapeHTML } from './security.js';
import { validateStep1, validateStep2, validateStep3 } from './validation.js';
import {
    updateWizard,
    setCurrentStep,
    getCurrentStep,
    getTotalSteps,
    getQuestionsCount,
    renderQuestions,
    updateDashboard,
    renderReviews,
    showSpinner,
    showToast
} from './ui.js';
import { saveSurvey, loadSurveys } from './firebase.js';

// Referencias DOM
const btnNext = document.getElementById('btnNext');
const btnPrev = document.getElementById('btnPrev');

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    renderQuestions();
    updateWizard(1);
    loadReviewsAndUpdateDashboard();
    lucide.createIcons();
});

// --- NAVEGACIÓN DEL WIZARD ---
btnNext.addEventListener('click', async () => {
    const step = getCurrentStep();

    // Validar según paso actual
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2(getQuestionsCount())) return;

    if (step < getTotalSteps()) {
        setCurrentStep(step + 1);
        updateWizard(step + 1);
        // Mover foco al inicio del paso
        document.querySelector(`.step[data-step="${step+1}"]`)?.scrollIntoView({ behavior: 'smooth' });
    } else {
        // Último paso: validar rating y enviar
        if (!validateStep3()) return;

        // Verificar reCAPTCHA
        const captchaResponse = grecaptcha.getResponse();
        if (!captchaResponse) {
            showToast('Por favor verifique que no es un robot.', 'error');
            return;
        }

        // Prevenir doble envío
        btnNext.disabled = true;
        btnNext.innerHTML = '<span class="spinner" style="width:20px;height:20px;border-width:2px;margin:0;"></span> Enviando...';

        try {
            await submitSurvey();
        } finally {
            btnNext.disabled = false;
            btnNext.textContent = 'Enviar Encuesta';
        }
    }
});

btnPrev.addEventListener('click', () => {
    const step = getCurrentStep();
    if (step > 1) {
        setCurrentStep(step - 1);
        updateWizard(step - 1);
        document.querySelector(`.step[data-step="${step-1}"]`)?.scrollIntoView({ behavior: 'smooth' });
    }
});

// --- ENVÍO DE ENCUESTA ---
async function submitSurvey() {
    const ratingInput = document.querySelector('input[name="rating"]:checked');
    const ratingValue = parseInt(ratingInput.value, 10);

    const payload = {
        nombre: escapeHTML(document.getElementById('c_name').value.trim()),
        empresa: escapeHTML(document.getElementById('c_company').value.trim()) || "N/A",
        telefono: escapeHTML(document.getElementById('c_phone').value.trim()),
        correo: escapeHTML(document.getElementById('c_email').value.trim()),
        respuestas: { ...window.__surveyAnswers },
        rating: ratingValue,
        comentario: escapeHTML(document.getElementById('c_comment').value.trim())
    };

    try {
        await saveSurvey(payload);
        showToast('Encuesta enviada con éxito. ¡Muchas gracias!', 'success');

        // Reiniciar formulario
        document.getElementById('mainForm').reset();
        window.__surveyAnswers = {};
        // Desmarcar todas las opciones de preguntas
        document.querySelectorAll('.opt-btn.active').forEach(b => b.classList.remove('active'));
        // Resetear captcha
        grecaptcha.reset();

        setCurrentStep(1);
        updateWizard(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Recargar reseñas
        await loadReviewsAndUpdateDashboard();

    } catch (error) {
        showToast(error.message || 'Error al guardar la encuesta.', 'error');
    }
}

// --- CARGA DE RESEÑAS Y ACTUALIZACIÓN DEL DASHBOARD ---
async function loadReviewsAndUpdateDashboard() {
    showSpinner();
    try {
        const surveys = await loadSurveys();
        let totalStars = 0;
        surveys.forEach(s => { totalStars += s.rating || 0; });
        const avg = surveys.length > 0 ? totalStars / surveys.length : 0;
        const count = surveys.length;

        updateDashboard(avg, count);
        renderReviews(surveys);
    } catch (error) {
        showToast('Error al cargar las reseñas. Intente de nuevo.', 'error');
        document.getElementById('reviews-container').innerHTML =
            '<p style="color: red; text-align: center;">Error al cargar datos.</p>';
    }
}