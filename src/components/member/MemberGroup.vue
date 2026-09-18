<template>
    <v-card variant="flat" class="member-group tone-card mb-3">
        <div class="d-flex align-center ga-3 pa-3">
            <MemberAvatar :member="member" :size="36" />
            <div class="flex-grow-1 min-width-0">
                <div class="member-group__name">{{ displayName }}</div>
                <div class="member-group__count">
                    {{ issues.length }} {{ issues.length === 1 ? 'tarefa' : 'tarefas' }}
                </div>
            </div>
            <span class="member-group__badge">{{ issues.length }}</span>
        </div>

        <v-divider />

        <div class="pa-3">
            <IssueCard
                v-for="issue in issues"
                :key="issue.id"
                :issue="issue"
                :show-project="showProject"
            />
        </div>
    </v-card>
</template>

<script>
import IssueCard from '../issue/IssueCard.vue'
import MemberAvatar from './MemberAvatar.vue'
import { memberName } from '../../utils/formatters.js'

export default {
    name: 'MemberGroup',

    components: {
        IssueCard,
        MemberAvatar,
    },

    props: {
        member: { type: Object, default: null },
        issues: { type: Array, default: () => [] },
        showProject: { type: Boolean, default: true },
    },

    computed: {
        displayName() {
            return this.member ? memberName(this.member) : 'Sem responsável'
        },
    },
}
</script>

<style scoped>
.member-group__name {
    font-size: 13px;
    font-weight: 600;
    color: rgb(var(--v-theme-on-surface));
}

.member-group__count {
    font-size: 11px;
    color: rgba(var(--v-theme-on-surface), 0.5);
    margin-top: 2px;
}

.member-group__badge {
    min-width: 22px;
    height: 22px;
    padding: 0 7px;
    border-radius: 4px;
    display: inline-grid;
    place-items: center;
    font-size: 11px;
    font-weight: 600;
    background: rgba(var(--v-theme-primary), 0.16);
    color: rgb(var(--v-theme-primary));
}
</style>
