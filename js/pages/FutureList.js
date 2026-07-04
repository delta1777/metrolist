import { embed } from '../util.js';
import { fetchList } from '../content.js';
import Spinner from '../components/Spinner.js';

export default {
    components: { Spinner },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-future-list">
            <div class="future-list-container">
                <h1>Будущие Уровни</h1>
                <p class="description">Уровни, которые сейчас верифицируются</p>
                <div class="levels-grid">
                    <div v-for="level in levels" :key="level.id" class="level-card">
                        <a
                            :href="level.showcase"
                            target="_blank"
                            class="video-container"
                            :style="{ backgroundImage: 'url(' + getThumbnail(level.showcase) + ')' }"
                        >
                        </a>
                        <div class="level-info">
                            <h2>{{ level.name }}</h2>
                            <div class="author-info">
                                <span class="label">Создатель:</span>
                                <span class="author">{{ level.creator }}</span>
                            </div>
                            <div class="verifier-info" v-if="level.verifier">
                                <span class="label">Верификатор:</span>
                                <span class="verifier">{{ level.verifier }}</span>
                            </div>
                        </div>
                        <div class="progress-info">
                            <span class="label">Лучший прогресс</span>
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
    }),
    async mounted() {
        try {
            const list = await fetchList('future');
            if (list) {
                this.levels = list.map(([level, err]) => {
                    if (err) return null;
                    return {
                        id: level.id,
                        name: level.name,
                        creator: level.author,
                        verifier: level.verifier,
                        showcase: level.verification,
                        progress: level.best_progress || 0
                    };
                }).filter(l => l !== null);
            }
        } catch (err) {
            console.error('Failed to load future list:', err);
            this.levels = [];
        }
        this.loading = false;
    },
    methods: {
        embed,
        getThumbnail(url) {
            // Extract video ID from YouTube URL
            const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
            if (videoId) {
                return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            }
            return '';
        }
    },
};
