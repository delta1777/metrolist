import { embed } from '../util.js';
import Spinner from '../components/Spinner.js';

export default {
    components: { Spinner },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-future-list">
            <div class="future-list-container">
                <h1>Future List</h1>
                <p class="description">Levels that are currently being verified</p>
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
                            <div class="progress-info">
                                <span class="label">Best Progress:</span>
                                <span class="progress">{{ level.progress }}%</span>
                            </div>
                            <div class="author-info">
                                <span class="label">Creator:</span>
                                <span class="author">{{ level.creator }}</span>
                            </div>
                            <div class="verifier-info" v-if="level.verifier">
                                <span class="label">Verifier:</span>
                                <span class="verifier">{{ level.verifier }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        levels: [],
        loading: true,
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
