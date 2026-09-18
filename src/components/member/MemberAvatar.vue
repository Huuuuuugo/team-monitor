<template>
    <v-tooltip :text="displayName" location="top">
        <template #activator="{ props }">
            <v-avatar v-bind="props" :size="size" :color="avatarUrl ? undefined : color" class="member-avatar">
                <v-img v-if="avatarUrl" :src="avatarUrl" :alt="displayName" cover />
                <v-icon v-else-if="!member" size="16">mdi-account-off-outline</v-icon>
                <span v-else class="text-caption font-weight-medium">{{ initials(displayName) }}</span>
            </v-avatar>
        </template>
    </v-tooltip>
</template>

<script>
import { memberName, memberAvatar, initials } from '../../utils/formatters.js'
import { assetUrl } from '../../services/planeApi.js'

const PALETTE = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777', '#0284c7']

export default {
    name: 'MemberAvatar',

    props: {
        member: { type: Object, default: null },
        size: { type: [Number, String], default: 32 },
    },

    computed: {
        displayName() {
            if (!this.member) return 'Sem responsável'
            return memberName(this.member)
        },

        avatarUrl() {
            return assetUrl(memberAvatar(this.member))
        },

        color() {
            const name = this.displayName || ''
            let hash = 0
            for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 997
            return PALETTE[hash % PALETTE.length]
        },
    },

    methods: {
        initials,
    },
}
</script>
