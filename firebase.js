/**
 * Módulo de Firebase.
 * Inicializa la conexión con Firestore y exporta funciones para guardar/leer encuestas.
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    Timestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCHrOxQRyu-rH9tfcdWeYMw-lQY-990tg4",
    authDomain: "cstopoconstruccioones.firebaseapp.com",
    projectId: "cstopoconstruccioones",
    storageBucket: "cstopoconstruccioones.firebasestorage.app",
    messagingSenderId: "1052583549031",
    appId: "1:1052583549031:web:181a7801785ad3a845dcc2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Guarda una encuesta en Firestore.
 * @param {Object} payload - Datos de la encuesta.
 * @returns {Promise<void>}
 */
export async function saveSurvey(payload) {
    try {
        payload.fecha = Timestamp.now();
        await addDoc(collection(db, "encuestas"), payload);
    } catch (error) {
        console.error("Error guardando encuesta:", error);
        throw new Error("No se pudo guardar la encuesta. Verifique su conexión.");
    }
}

/**
 * Carga todas las encuestas ordenadas por fecha descendente.
 * @returns {Promise<Array>} Array de objetos con los datos de cada encuesta.
 */
export async function loadSurveys() {
    try {
        const q = query(collection(db, "encuestas"), orderBy("fecha", "desc"));
        const snapshot = await getDocs(q);
        const surveys = [];
        snapshot.forEach(doc => {
            surveys.push({ id: doc.id, ...doc.data() });
        });
        return surveys;
    } catch (error) {
        console.error("Error cargando encuestas:", error);
        throw new Error("No se pudieron cargar las reseñas.");
    }
}