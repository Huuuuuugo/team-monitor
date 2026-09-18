<template>
    <div class="member-workload mb-4">
        <div class="d-flex align-center ga-3">
            <MemberAvatar :member="member" :size="32" />
            <div class="flex-grow-1 min-width-0">
                <div class="d-flex align-center justify-space-between">
                    <span class="member-workload__name text-truncate">{{ name }}</span>
                    <span class="member-workload__count">{{ count }}</span>
                </div>
                <v-progress-linear
                    :model-value="percent"
                    color="primary"
                    height="5"
                    rounded
                    bg-color="surface-variant"
                    class="mt-1"
                />
            </div>
        </div>
    </div>
</template>

<script>
import MemberAvatar from '../member/MemberAvatar.vue'
import { memberName } from '../../utils/formatters.js'

export default {
    name: 'MemberWorkload',

    components: {
        MemberAvatar,
    },

    props: {
        member: { type: Object, default: null },
        count: { type: Number, default: 0 },
        percent: { type: Number, default: 0 },
    },

    computed: {
        name() {
            return this.member ? memberName(this.member) : 'Sem responsável'
        },
    },
}
</script>

<style scoped>
.member-workload__name {
    font-size: 13px;
    font-weight: 500;
    color: rgb(var(--v-theme-on-surface));
}

.member-workload__count {
    font-size: 11px;
    color: rgba(var(--v-theme-on-surface), 0.5);
    margin-left: 8px;
}
</style>
