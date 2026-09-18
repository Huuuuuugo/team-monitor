import { createRouter, createWebHashHistory } from 'vue-router'
import HojeView from '../views/HojeView.vue'
import EmAndamentoView from '../views/EmAndamentoView.vue'
import PanoramaView from '../views/PanoramaView.vue'
import KanbanView from '../views/KanbanView.vue'
import ListaView from '../views/ListaView.vue'

const routes = [
    { path: '/', redirect: '/hoje' },
    { path: '/hoje', component: HojeView, name: 'hoje' },
    { path: '/em-andamento', component: EmAndamentoView, name: 'em-andamento' },
    { path: '/panorama', component: PanoramaView, name: 'panorama' },
    { path: '/kanban', component: KanbanView, name: 'kanban' },
    { path: '/lista', component: ListaView, name: 'lista' },
]

const router = createRouter({
    history: createWebHashHistory(),
    routes,
    scrollBehavior() {
        return { top: 0 }
    },
})

export default router
