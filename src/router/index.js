import { createRouter, createWebHistory } from 'vue-router'

// Vistas (carga perezosa para no bloquear la arranque)
const HomeView = () => import('../views/HomeView.vue')
const LoginView = () => import('../views/LoginView.vue')
const RegisterView = () => import('../views/RegisterView.vue')
const PanelView = () => import('../views/PanelView.vue')
const UsuariosView = () => import('../views/UsuariosView.vue')
const ComisionesView = () => import('../views/ComisionesView.vue')
const TareasView = () => import('../views/TareasView.vue')
const TareaFormView = () => import('../views/TareaFormView.vue')
const ResiduoFormView = () => import('../views/ResiduoFormView.vue')
const ResiduoEditarView = () => import('../views/ResiduoFormView.vue')
const HistorialResiduosView = () => import('../views/HistorialResiduosView.vue')
const EstadisticasView = () => import('../views/EstadisticasView.vue')
const TachosView = () => import('../views/TachosView.vue')
const CampañasView = () => import('../views/CampañasView.vue')
const ReunionesView = () => import('../views/ReunionesView.vue')
const AcuerdosView = () => import('../views/AcuerdosView.vue')
const EntregasView = () => import('../views/EntregasView.vue')
const PerfilView = () => import('../views/PerfilView.vue')
const ConfiguracionView = () => import('../views/ConfiguracionView.vue')
const NotFoundView = () => import('../views/NotFoundView.vue')

export default [
  { path: '/', name: 'inicio', component: HomeView, meta: { soloVisitantes: false } },
  { path: '/login', name: 'login', component: LoginView, meta: { soloVisitantes: true } },
  { path: '/registro', name: 'registro', component: RegisterView, meta: { soloVisitantes: true } },

  { path: '/panel', name: 'panel', component: PanelView, meta: { requiereAuth: true } },
  { path: '/usuarios', name: 'usuarios', component: UsuariosView, meta: { requiereAuth: true, rol: 'administrador' } },
  { path: '/comisiones', name: 'comisiones', component: ComisionesView, meta: { requiereAuth: true } },
  { path: '/tareas', name: 'tareas', component: TareasView, meta: { requiereAuth: true } },
  { path: '/tareas/nuevo', name: 'tarea-nuevo', component: TareaFormView, meta: { requiereAuth: true } },
  { path: '/tareas/:id/editar', name: 'tarea-editar', component: TareaFormView, meta: { requiereAuth: true } },
  { path: '/residuos/nuevo', name: 'residuo-nuevo', component: ResiduoFormView, meta: { requiereAuth: true } },
  { path: '/residuos/:id/editar', name: 'residuo-editar', component: ResiduoEditarView, meta: { requiereAuth: true } },
  { path: '/residuos/historial', name: 'historial-residuos', component: HistorialResiduosView, meta: { requiereAuth: true } },
  { path: '/estadisticas', name: 'estadisticas', component: EstadisticasView, meta: { requiereAuth: true } },
  { path: '/tachos', name: 'tachos', component: TachosView, meta: { requiereAuth: true } },
  { path: '/campañas', name: 'campañas', component: CampañasView, meta: { requiereAuth: true } },
  { path: '/reuniones', name: 'reuniones', component: ReunionesView, meta: { requiereAuth: true } },
  { path: '/acuerdos', name: 'acuerdos', component: AcuerdosView, meta: { requiereAuth: true } },
  { path: '/entregas', name: 'entregas', component: EntregasView, meta: { requiereAuth: true } },
  { path: '/perfil', name: 'perfil', component: PerfilView, meta: { requiereAuth: true } },
  { path: '/configuracion', name: 'configuracion', component: ConfiguracionView, meta: { requiereAuth: true, rol: 'administrador' } },

  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
]
