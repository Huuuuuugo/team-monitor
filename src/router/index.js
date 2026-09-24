import { createRouter, createWebHashHistory } from 'vue-router'
import HojeView from '../views/HojeView.vue'
import EmAndamentoView from '../views/EmAndamentoView.vue'
import PanoramaView from '../views/PanoramaView.vue'
import CalendarioView from '../views/CalendarioView.vue'
import KanbanView from '../views/KanbanView.vue'
import ListaView from '../views/ListaView.vue'
import ModulosView from '../views/ModulosView.vue'
import StatusView from '../views/StatusView.vue'
import ActivitiesView from '../views/ActivitiesView.vue'

const routes = [
    { path: '/', redirect: '/hoje' },
    { path: '/hoje', component: HojeView, name: 'hoje' },
    { path: '/em-andamento', component: EmAndamentoView, name: 'em-andamento' },
    { path: '/panorama', component: PanoramaView, name: 'panorama' },
    { path: '/calendario', component: CalendarioView, name: 'calendario' },
    { path: '/kanban', component: KanbanView, name: 'kanban' },
    { path: '/modulos', component: ModulosView, name: 'modulos' },
    { path: '/lista', component: ListaView, name: 'lista' },
    { path: '/status', component: StatusView, name: 'status' },
    { path: '/atividades', component: ActivitiesView, name: 'atividades' },
]

const router = createRouter({
    history: createWebHashHistory(),
    routes,
    scrollBehavior() {
        return { top: 0 }
    },
})

export default router
