<template>
    <v-dialog
        :model-value="modelValue"
        max-width="720"
        scrollable
        @update:model-value="value => $emit('update:modelValue', value)"
    >
        <v-card>
            <div class="info-head">
                <v-icon color="primary" size="22">mdi-target</v-icon>
                <div class="min-width-0 flex-grow-1">
                    <div class="info-head__title">Como o Foco é calculado</div>
                    <div class="info-head__sub">Sem jargão: o que entra na conta e o que as etiquetas querem dizer</div>
                </div>
                <v-btn icon="mdi-close" variant="text" aria-label="Fechar" @click="close" />
            </div>

            <v-divider />

            <v-card-text class="info-body">
                <p class="info-lead">
                    O Foco responde uma pergunta simples: <strong>em quais projetos cada pessoa está
                    mexendo agora</strong>. Para isso, olhamos o que ela andou fazendo em cada projeto e
                    transformamos isso em uma pontuação. O projeto com maior pontuação é o foco principal;
                    os outros vêm na sequência.
                </p>

                <section class="info-section">
                    <h3 class="info-section__title">O que faz um projeto subir</h3>
                    <ul class="info-list">
                        <li>
                            <strong>Atualizações recentes</strong> — quanto mais recente foi a mexida, mais
                            conta. Uma atualização de hoje vale mais que uma da semana passada.
                        </li>
                        <li>
                            <strong>Tarefas em andamento</strong> — o que a pessoa está tocando de fato agora.
                        </li>
                        <li>
                            <strong>Tarefas urgentes ou altas</strong> — o que tem prioridade definida.
                        </li>
                        <li>
                            <strong>Tarefas atrasadas</strong> — sinal de risco/pendência.
                        </li>
                        <li>
                            <strong>Tarefas abertas</strong> — o volume também conta, mas com peso pequeno.
                        </li>
                    </ul>
                    <p class="info-note">
                        É por isso que 80 tarefas paradas em backlog não passam na frente de 3 tarefas em
                        andamento recentes. Quantidade sozinha não domina o resultado.
                    </p>
                </section>

                <section class="info-section">
                    <h3 class="info-section__title">O que é a porcentagem</h3>
                    <p>
                        É a fatia daquele projeto no foco total da pessoa. Exemplo: 40% significa que quase
                        metade do foco dela está nesse projeto. Os projetos menores continuam contando e
                        aparecem agrupados como <strong>"Demais projetos · X% (N)"</strong> no card. O botão
                        <strong>Detalhes</strong> mostra todos, com a fatia de cada um.
                    </p>
                </section>

                <section class="info-section">
                    <h3 class="info-section__title">Por que aparecem de 1 a {{ config.selection.maxProjects }} projetos</h3>
                    <p>
                        Mostramos no card os projetos principais até somar
                        {{ pct(config.selection.coverage) }}% do foco. Para a lista não ficar mudando toda
                        hora: um projeto que já aparecia só sai quando perde peso de verdade, e um projeto
                        novo só entra quando já representa uma fatia relevante.
                    </p>
                </section>

                <section class="info-section">
                    <h3 class="info-section__title">O que significam as etiquetas</h3>
                    <ul class="info-list">
                        <li><strong>Focado</strong> — concentrado em um projeto principal.</li>
                        <li><strong>Dividido</strong> — divide o foco entre 2 ou 3 projetos, sem um dominante.</li>
                        <li>
                            <strong>Muitas frentes</strong> — muita coisa ao mesmo tempo em vários projetos.
                            Não é sobre a pessoa ser desorganizada: é volume acumulado em frentes diferentes.
                        </li>
                        <li><strong>Sem dados</strong> — sem atividade recente e sem tarefas abertas.</li>
                    </ul>
                </section>

                <section class="info-section">
                    <h3 class="info-section__title">E as tarefas?</h3>
                    <p>
                        Cada projeto mostra a tarefa mais importante do momento. Para ver a lista completa,
                        use <strong>Ver tarefas</strong>: a aba Lista abre já filtrada por aquele projeto e
                        pelo responsável.
                    </p>
                </section>

                <p class="info-foot">Datas e prazos seguem o fuso {{ config.timeZone }}.</p>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script>
import { FOCUS_CONFIG } from '../../utils/focusHelpers.js'

export default {
    name: 'FocusInfoDialog',

    props: {
        modelValue: { type: Boolean, default: false },
    },

    emits: ['update:modelValue'],

    computed: {
        config() {
            return FOCUS_CONFIG
        },
    },

    methods: {
        close() {
            this.$emit('update:modelValue', false)
        },

        pct(value) {
            return Math.round(value * 100)
        },
    },
}
</script>

<style scoped>
.info-head {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
}

.info-head__title {
    font-size: 15px;
    font-weight: 700;
    color: rgb(var(--v-theme-on-surface));
}

.info-head__sub {
    font-size: 12px;
    color: rgba(var(--v-theme-on-surface), 0.5);
}

.info-body {
    padding: 16px;
}

.info-lead {
    margin-bottom: 18px;
    padding: 12px 14px;
    border-radius: 8px;
    background: rgba(var(--v-theme-primary), 0.07);
    font-size: 13px;
    line-height: 1.6;
    color: rgba(var(--v-theme-on-surface), 0.75);
}

.info-section + .info-section {
    margin-top: 18px;
}

.info-section__title {
    margin-bottom: 8px;
    font-size: 13px;
    font-weight: 700;
    color: rgb(var(--v-theme-on-surface));
}

.info-section p {
    font-size: 12.5px;
    line-height: 1.6;
    color: rgba(var(--v-theme-on-surface), 0.65);
}

.info-list {
    margin: 0;
    padding-left: 18px;
    font-size: 12.5px;
    line-height: 1.6;
    color: rgba(var(--v-theme-on-surface), 0.65);
}

.info-list li + li {
    margin-top: 6px;
}

.info-note {
    margin-top: 8px;
    font-size: 12px;
    color: rgba(var(--v-theme-on-surface), 0.5);
}

.info-foot {
    margin-top: 18px;
    font-size: 11px;
    color: rgba(var(--v-theme-on-surface), 0.4);
}
</style>
