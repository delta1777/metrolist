import { fetchLeaderboard } from '../content.js';
import { localize } from '../util.js';

import Spinner from '../components/Spinner.js';

export default {
    components: {
        Spinner,
    },
    data: () => ({
        mainLeaderboard: [],
        challengeLeaderboard: [],
        loading: true,
        selected: 0,
        activeTab: 'main',
        mainErr: [],
        challengeErr: [],
    }),
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-leaderboard-container">
            <div class="page-leaderboard">
                <div class="leaderboard-tabs">
                    <button
                        class="leaderboard-tab-btn"
                        :class="{ active: activeTab === 'main' }"
                        @click="switchTab('main')"
                    >
                        Main List
                    </button>
                    <button
                        class="leaderboard-tab-btn"
                        :class="{ active: activeTab === 'challenge' }"
                        @click="switchTab('challenge')"
                    >
                        Challenge List
                    </button>
                </div>
                <div class="error-container">
                    <p class="error" v-if="err.length > 0">
                        Таблица лидеров может быть неточной, так как следующие уровни не удалось загрузить: {{ err.join(', ') }}
                    </p>
                </div>
                <div class="board-container">
                    <table class="board">
                        <tr v-for="(ientry, i) in leaderboard">
                            <td class="rank">
                                <p class="type-label-lg">#{{ i + 1 }}</p>
                            </td>
                            <td class="total">
                                <p class="type-label-lg">{{ localize(ientry.total) }}</p>
                            </td>
                            <td class="user" :class="{ 'active': selected == i }">
                                <button @click="selected = i">
                                    <span class="type-label-lg">{{ ientry.user }}</span>
                                </button>
                            </td>
                        </tr>
                    </table>
                </div>
                <div class="player-container">
                    <div class="player">
                        <h1>#{{ selected + 1 }} {{ entry.user }}</h1>
                        <h3>{{ entry.total }}</h3>
                        <h2 v-if="entry.verified.length > 0">Верифицированные ({{ entry.verified.length}})</h2>
                        <table class="table">
                            <tr v-for="score in entry.verified">
                                <td class="rank">
                                    <p>#{{ score.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">{{ score.level }}</a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>
                        <h2 v-if="entry.completed.length > 0">Завершённые ({{ entry.completed.length }})</h2>
                        <table class="table">
                            <tr v-for="score in entry.completed">
                                <td class="rank">
                                    <p>#{{ score.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">{{ score.level }}</a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>
                        <h2 v-if="entry.progressed.length > 0">В прогрессе ({{entry.progressed.length}})</h2>
                        <table class="table">
                            <tr v-for="score in entry.progressed">
                                <td class="rank">
                                    <p>#{{ score.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">{{ score.percent }}% {{ score.level }}</a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    `,
    computed: {
        leaderboard() {
            return this.activeTab === 'main' ? this.mainLeaderboard : this.challengeLeaderboard;
        },
        err() {
            return this.activeTab === 'main' ? this.mainErr : this.challengeErr;
        },
        entry() {
            return this.leaderboard[this.selected];
        },
    },
    async mounted() {
        const [mainLeaderboard, mainErr] = await fetchLeaderboard('main');
        const [challengeLeaderboard, challengeErr] = await fetchLeaderboard('challenge');

        this.mainLeaderboard = mainLeaderboard;
        this.mainErr = mainErr;
        this.challengeLeaderboard = challengeLeaderboard;
        this.challengeErr = challengeErr;

        this.loading = false;
    },
    methods: {
        localize,
        switchTab(tab) {
            this.activeTab = tab;
            this.selected = 0;
        }
    },
};
