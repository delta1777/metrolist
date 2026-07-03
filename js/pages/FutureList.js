import { embed } from '../util.js';
import { store } from '../main.js';
import Spinner from '../components/Spinner.js';

export default {
    components: { Spinner },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-future-list">
            <div class="future-list-container">
                <h1>{{ store.t('futureList.title') }}</h1>
                <p class="description">{{ store.t('futureList.description') }}</p>
                <div class="levels-grid">
                    <div v-for="level in levels" :key="level.id" class="level-card">
                        <div class="video-container">
                            <iframe
                                class="video"
                                :src="embed(level.showcase)"
                                frameborder="0"
                                allowfullscreen>
                            </iframe>
                        </div>
                        <div class="level-info">
                            <h2>{{ level.name }}</h2>
                            <div class="author-info">
                                <span class="label">{{ store.t('futureList.creator') }}:</span>
                                <span class="author">{{ level.creator }}</span>
                            </div>
                            <div class="verifier-info" v-if="level.verifier">
                                <span class="label">{{ store.t('futureList.verifier') }}:</span>
                                <span class="verifier">{{ level.verifier }}</span>
                            </div>
                        </div>
                        <div class="progress-info">
                            <span class="label">{{ store.t('futureList.bestProgress') }}</span>
                            <span class="progress">{{ level.progress }}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        levels: [],
        loading: true,
        store
    }),
    async mounted() {
        try {
            const response = await fetch('data/future_list.json');
            this.levels = await response.json();
        } catch (err) {
            console.error('Failed to load future list:', err);
            this.levels = [];
        }
        this.loading = false;
    },
    methods: {
        embed,
    },
};
