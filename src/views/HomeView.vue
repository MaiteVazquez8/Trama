<template>
  <div class="landing">
    <!-- Hero -->
    <section class="hero">
      <div class="hero-contenido">
        <span class="hero-badge">Organizamos también transforma</span>
        <h1>Una comunidad que separa, aprende y coopera.</h1>
        <p class="hero-texto">
          Trama conecta a la comunidad educativa para recuperar residuos, organizar acciones y
          sostener un vínculo justo con cooperativas recicladoras.
        </p>
        <div class="hero-acciones">
          <button class="btn btn-primary btn-lg" type="button" @click="irRegistro">Quiero participar</button>
          <button class="btn btn-outline btn-lg" type="button" @click="irASeccion('como-funciona')">Conocer el proyecto</button>
        </div>
      </div>
      <div class="hero-ilustracion" aria-hidden="true">
        <img src="/img/hero-personas.png" alt="" />
      </div>
    </section>

    <!-- Qué es Trama -->
    <section id="que-es-trama" class="fila-resumen fondo-blanco">
      <div class="fila-texto">
        <span class="etiqueta-seccion">Qué es Trama</span>
        <h2>Una red para convertir hábitos en acción colectiva</h2>
        <p>Estudiantes, docentes, familias y cooperativistas coordinan la separación, el aprendizaje y la entrega responsable.</p>
      </div>
      <div class="tarjeta-dato">
        <p class="dato-valor">420 personas</p>
        <p class="dato-nota">Impacto compartido y visible para toda la comunidad.</p>
      </div>
    </section>

    <!-- Visión -->
    <section class="fila-resumen fondo-beige">
      <div class="fila-texto">
        <span class="etiqueta-seccion">Visión</span>
        <h2>Cuidar el ambiente también es cuidar los vínculos</h2>
        <p>Cada residuo separado fortalece el aprendizaje compartido y el trabajo cooperativo digno.</p>
      </div>
      <div class="tarjeta-dato">
        <p class="dato-valor">1.280 kg</p>
        <p class="dato-nota">Impacto compartido y visible para toda la comunidad.</p>
      </div>
    </section>

    <!-- Valores -->
    <section id="valores" class="fila-resumen fondo-blanco">
      <div class="fila-texto">
        <span class="etiqueta-seccion">Valores</span>
        <h2>Cuidado · Cooperación · Trazabilidad · Inclusión</h2>
        <p>Cuatro principios para tomar decisiones, distribuir tareas y reconocer cada aporte.</p>
      </div>
      <div class="tarjeta-dato">
        <p class="dato-valor">4 valores</p>
        <p class="dato-nota">Impacto compartido y visible para toda la comunidad.</p>
      </div>
    </section>

    <!-- Cómo funciona -->
    <section id="como-funciona" class="fila-resumen fondo-beige">
      <div class="fila-texto">
        <span class="etiqueta-seccion">Cómo funciona</span>
        <h2>Separar · Registrar · Coordinar · Entregar</h2>
        <p>Un circuito claro que acompaña el trabajo sin reemplazar el encuentro ni la organización.</p>
      </div>
      <div class="tarjeta-dato">
        <p class="dato-valor">4 pasos</p>
        <p class="dato-nota">Impacto compartido y visible para toda la comunidad.</p>
      </div>
    </section>

    <!-- Separación de residuos -->
    <section class="fila-resumen fila-imagen fondo-blanco">
      <div class="fila-texto">
        <span class="etiqueta-seccion">Separación de residuos</span>
        <h2>Limpios, secos y separados</h2>
        <p>Papel y cartón · Plásticos · Metales · Vidrio. Una buena clasificación mejora la recuperación.</p>
      </div>
      <figure class="fila-foto">
        <img src="/img/separando.jpg" alt="Tachos de colores con materiales separados: botellas, latas, papel y metal" loading="lazy" />
      </figure>
    </section>

    <!-- Concientización -->
    <section class="fila-resumen fila-imagen fondo-beige">
      <div class="fila-texto">
        <span class="etiqueta-seccion">Concientización</span>
        <h2>Aprender para sostener el hábito</h2>
        <p>Talleres y guías sobre consumo responsable, compostaje, reducción y economía circular.</p>
      </div>
      <figure class="fila-foto">
        <img src="/img/taller-reciclaje.jpg" alt="Taller de reciclaje con la comunidad educativa en un galpón" loading="lazy" />
      </figure>
    </section>

    <!-- Comunidad educativa -->
    <section id="comunidad" class="fila-resumen fila-imagen fondo-blanco">
      <div class="fila-texto">
        <span class="etiqueta-seccion">Comunidad educativa</span>
        <h2>Cada rol suma una parte de la trama</h2>
        <p>Estudiantes impulsan, docentes integran, familias acompañan y equipos de gestión facilitan.</p>
      </div>
      <figure class="fila-foto">
        <img src="/img/reciclaje3.jpg" alt="Persona clasificando cartón y vidrio sobre una tarima de madera" loading="lazy" />
      </figure>
    </section>

    <!-- Cooperativa externa -->
    <section class="fila-resumen fila-imagen fondo-beige">
      <div class="fila-texto">
        <span class="etiqueta-seccion">Cooperativa externa</span>
        <h2>La entrega continúa fuera de la escuela</h2>
        <p>Coordinamos retiros respetando criterios de recepción y visibilizando el valor social del trabajo.</p>
      </div>
      <figure class="fila-foto">
        <img src="/img/residuos.webp" alt="Materiales reciclables acopiados a la espera del retiro de la cooperativa" loading="lazy" />
      </figure>
    </section>

    <!-- Organización y objetivos -->
    <section class="seccion-adicional fondo-blanco">
      <div class="seccion-adicional-inner">
        <span class="etiqueta-seccion">Organización</span>
        <h2 class="seccion-adicional-titulo">Cinco comisiones, un mismo tejido</h2>
        <div class="tarjetas-grid">
          <div class="tarjeta-mini" v-for="c in comisiones" :key="c.nombre">
            <h3>{{ c.nombre }}</h3>
            <p>{{ c.funcion }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="seccion-adicional fondo-beige">
      <div class="seccion-adicional-inner">
        <span class="etiqueta-seccion">Objetivos</span>
        <h2 class="seccion-adicional-titulo">Por qué hacemos lo que hacemos</h2>
        <div class="tarjetas-grid objetivos-grid">
          <div class="tarjeta-mini" v-for="o in objetivos" :key="o.nombre">
            <h3>{{ o.nombre }}</h3>
            <p>{{ o.proposito }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section id="impacto" class="cta-banda">
      <h2>Hagamos visible todo lo que podemos transformar juntos.</h2>
      <p>Sumate a una organización ambiental concreta, cercana y cooperativa.</p>
      <button class="btn btn-oscuro btn-lg" type="button" @click="irRegistro">Crear mi cuenta</button>
    </section>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const comisiones = [
  { nombre: 'Organización', funcion: 'Coordina las actividades y el funcionamiento general de la cooperativa.' },
  { nombre: 'Concientización', funcion: 'Desarrolla campañas y materiales informativos.' },
  { nombre: 'Mantenimiento', funcion: 'Controla los tachos, la señalización y su estado.' },
  { nombre: 'Registro', funcion: 'Registra los residuos y los datos obtenidos durante el proyecto.' },
  { nombre: 'Vinculación', funcion: 'Mantiene el contacto y coordina las entregas con la cooperativa externa.' },
]

const objetivos = [
  { nombre: 'Separación', proposito: 'Mejorar la separación de residuos dentro de la escuela.' },
  { nombre: 'Reducción', proposito: 'Disminuir la cantidad de residuos mezclados.' },
  { nombre: 'Concientización', proposito: 'Promover hábitos responsables con el ambiente.' },
  { nombre: 'Participación', proposito: 'Involucrar a estudiantes y a la comunidad educativa.' },
  { nombre: 'Organización', proposito: 'Facilitar el trabajo de las diferentes comisiones.' },
  { nombre: 'Registro', proposito: 'Registrar y analizar los materiales recolectados.' },
]

function irRegistro() { router.push({ name: 'registro' }) }

function irASeccion(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<style scoped>
.landing { width: 100%; }

/* ---------- Hero ---------- */
.hero {
  background: var(--fondo-crema);
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  align-items: center;
  gap: 32px;
  padding: 44px 56px 52px 56px;
  max-width: 1280px;
  margin: 0 auto;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  background: var(--color-verde);
  color: #FFFFFF;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 6px 14px;
  border-radius: var(--radio-pill);
  margin-bottom: 18px;
}

.hero h1 {
  font-size: clamp(2rem, 4.4vw, 3.4rem);
  line-height: 1.04;
  letter-spacing: -0.02em;
  margin: 0 0 16px 0;
  color: var(--texto);
  max-width: 620px;
}

.hero-texto {
  font-size: 1.02rem;
  color: var(--texto-suave);
  max-width: 480px;
  margin-bottom: 26px;
}

.hero-acciones {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.hero-ilustracion {
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-ilustracion img {
  width: min(100%, 420px);
  height: auto;
}

/* ---------- Filas de resumen ---------- */
.fila-resumen {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 32px;
  align-items: center;
  padding: 30px 56px;
}

.fila-resumen > * {
  max-width: 100%;
}

.fila-texto, .tarjeta-dato, .fila-foto {
  max-width: 1160px;
  justify-self: stretch;
}

.fondo-blanco { background: var(--fondo-tarjeta); }
.fondo-beige { background: var(--fondo-beige); }

.etiqueta-seccion {
  display: block;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-verde);
  margin-bottom: 6px;
}

.fila-texto h2 {
  font-size: clamp(1.35rem, 2.4vw, 1.85rem);
  line-height: 1.15;
  letter-spacing: -0.01em;
  margin: 0 0 8px 0;
  max-width: 560px;
}

.fila-texto p {
  color: var(--texto-suave);
  font-size: 0.95rem;
  max-width: 460px;
}

.tarjeta-dato {
  background: var(--fondo-crema);
  border: 1px solid var(--borde);
  border-radius: var(--radio-tarjeta);
  padding: 16px 20px;
  justify-self: end;
  width: min(100%, 340px);
}

.dato-valor {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--verde-valor);
  margin-bottom: 4px;
}

.dato-nota {
  font-size: 0.78rem;
  color: var(--texto-suave);
}

.fila-imagen {
  grid-template-columns: 1fr 1fr;
}

.fila-foto {
  margin: 0;
  justify-self: end;
  width: min(100%, 430px);
}

.fila-foto img {
  width: 100%;
  height: 170px;
  object-fit: cover;
  border-radius: var(--radio-tarjeta);
  display: block;
}

/* ---------- Secciones adicionales ---------- */
.seccion-adicional {
  padding: 30px 56px;
}

.seccion-adicional-inner {
  max-width: 1168px;
  margin: 0 auto;
}

.seccion-adicional-titulo {
  font-size: clamp(1.35rem, 2.4vw, 1.85rem);
  margin: 0 0 16px 0;
}

.tarjetas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 12px;
}

.objetivos-grid {
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
}

.tarjeta-mini {
  background: var(--fondo-tarjeta);
  border: 1px solid var(--borde);
  border-radius: var(--radio-tarjeta);
  padding: 16px 18px;
}

.fondo-beige .tarjeta-mini {
  background: var(--fondo-crema);
}

.tarjeta-mini h3 {
  font-size: 1rem;
  margin-bottom: 4px;
}

.tarjeta-mini p {
  font-size: 0.85rem;
  color: var(--texto-suave);
}

/* ---------- CTA ---------- */
.cta-banda {
  background: var(--cta-bg);
  color: var(--cta-texto);
  text-align: center;
  padding: 52px 24px;
}

.cta-banda h2 {
  color: #FFFFFF;
  font-size: clamp(1.5rem, 3.2vw, 2.2rem);
  letter-spacing: -0.01em;
  margin: 0 auto 10px auto;
  max-width: 900px;
}

.cta-banda p {
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.95rem;
  margin-bottom: 22px;
}

/* ---------- Responsive ---------- */
@media (max-width: 900px) {
  .hero {
    grid-template-columns: 1fr;
    padding: 28px 18px 36px 18px;
    text-align: left;
    gap: 26px;
  }
  .hero-ilustracion { justify-content: flex-start; }
  .hero-ilustracion img { width: min(100%, 320px); }
  .hero-acciones .btn { flex: 1 1 auto; }

  .fila-resumen,
  .fila-imagen {
    grid-template-columns: 1fr;
    padding: 24px 18px;
    gap: 16px;
  }

  .tarjeta-dato { justify-self: stretch; width: 100%; }
  .fila-foto { justify-self: stretch; width: 100%; }
  .fila-foto img { height: 200px; }

  .seccion-adicional { padding: 24px 18px; }
  .cta-banda { padding: 40px 18px; }
  .cta-banda .btn { width: 100%; max-width: 340px; }
}
</style>
