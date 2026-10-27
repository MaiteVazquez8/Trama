<template>
  <div class="home">
    <section class="hero">
      <div class="hero-contenido">
        <h1>TRAMA</h1>
        <p class="subtitulo">Cooperativa escolar para la separación y gestión responsable de residuos.</p>
        <p class="lema">
          "Una acción individual puede parecer pequeña.<br />
          Cuando se convierte en una trama, puede generar un cambio."
        </p>
        <div class="hero-acciones">
          <button class="btn btn-primary" @click="irLogin">Ingresar al sistema</button>
          <button class="btn btn-outline" @click="irRegistro">Crear cuenta</button>
        </div>
      </div>
    </section>

    <section class="seccion" id="como-funciona">
      <h2>Cómo funciona</h2>
      <p class="texto">
        Trama organiza la separación de residuos en la escuela en seis etapas:
      </p>
      <div class="etapas">
        <div class="etapa" v-for="(e, i) in etapas" :key="i">
          <div class="numero">{{ i + 1 }}</div>
          <h3>{{ e.nombre }}</h3>
          <p>{{ e.descripcion }}</p>
        </div>
      </div>
    </section>

    <section class="seccion" id="organizacion">
      <h2>Organización de la cooperativa</h2>
      <p class="texto">
        Trama se organiza mediante comisiones con responsabilidades específicas.
      </p>
      <div class="tarjetas">
        <div class="tarjeta" v-for="(c, i) in comisiones" :key="i">
          <h3>{{ c.nombre }}</h3>
          <p>{{ c.funcion }}</p>
        </div>
      </div>
    </section>

    <section class="seccion" id="objetivos">
      <h2>Objetivos</h2>
      <div class="tarjetas">
        <div class="tarjeta" v-for="(o, i) in objetivos" :key="i">
          <h3>{{ o.nombre }}</h3>
          <p>{{ o.proposito }}</p>
        </div>
      </div>
    </section>

    <section class="seccion acceso-rapido" id="acceso">
      <h2>Acceso rápido</h2>
      <div class="tarjetas">
        <div class="tarjeta destacada">
          <h3>Panel de gestión</h3>
          <p>Registros de residuos, tareas, campañas, entregas y estadísticas del proyecto.</p>
          <button class="btn btn-primary" @click="irLogin">Ingresar al panel</button>
        </div>
        <div class="tarjeta">
          <h3>Consulta pública</h3>
          <p>Información sobre cómo separar residuos y resultados del proyecto.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const etapas = [
  { nombre: 'Separar', descripcion: 'Los residuos se depositan en tachos diferenciados según el tipo de material.' },
  { nombre: 'Concientizar', descripcion: 'Campañas, carteles y actividades para enseñar a separar correctamente.' },
  { nombre: 'Registrar', descripcion: 'Se registran materiales, cantidades, ubicaciones y posibles problemas de separación.' },
  { nombre: 'Organizar', descripcion: 'Las comisiones coordinan tareas, reuniones, mantenimiento y actividades.' },
  { nombre: 'Entregar', descripcion: 'Los materiales separados se entregan a la cooperativa externa para su clasificación y tratamiento.' },
  { nombre: 'Evaluar', descripcion: 'Se analizan los resultados para detectar problemas y mejorar el sistema.' },
]

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

function irLogin() { router.push({ name: 'login' }) }
function irRegistro() { router.push({ name: 'registro' }) }
</script>

<style scoped>
.home { max-width: 1000px; margin: 0 auto; padding: 0 20px; }

.hero {
  background-color: var(--color-verde-oscuro);
  color: var(--color-blanco);
  padding: 48px 20px;
  text-align: center;
  border-radius: 12px;
  margin-bottom: 40px;
}
.hero h1 { font-size: 2.5rem; margin-bottom: 10px; letter-spacing: 1px; }
.subtitulo { font-size: 1.25rem; margin-bottom: 16px; opacity: 0.95; }
.lema { font-size: 1.1rem; font-style: italic; margin-bottom: 24px; max-width: 620px; margin-left: auto; margin-right: auto; }
.hero-acciones { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

.seccion { margin-bottom: 48px; }
.seccion h2 {
  font-size: 1.5rem;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.texto { font-size: 1rem; margin-bottom: 24px; color: var(--color-texto-suave); max-width: 700px; }

.etapas { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
.etapa {
  background: var(--color-blanco);
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.numero {
  width: 32px; height: 32px;
  background: var(--color-verde);
  color: var(--color-blanco);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 800;
  flex-shrink: 0;
}
.etapa h3 { font-size: 1.1rem; margin: 0; color: var(--color-verde-oscuro); }
.etapa p { font-size: 0.9rem; margin: 0; color: var(--color-texto-suave); }

.tarjetas { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
.tarjeta {
  background: var(--color-blanco);
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.tarjeta h3 { font-size: 1.1rem; margin: 0; color: var(--color-verde-oscuro); }
.tarjeta p { font-size: 0.9rem; margin: 0; color: var(--color-texto-suave); }
.tarjeta.destacada { border-color: var(--color-verde); background: #F0F7EE; }

.acceso-rapido { background: var(--color-beige); border-radius: 8px; padding: 24px; }
</style>
