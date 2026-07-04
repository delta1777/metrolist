import { store } from "../main.js";

export default {
    template: `
        <main class="page-submit" :class="{ dark: store.dark }">
            <div class="submit-container">
                <h1 class="type-display-lg">Отправить заявку</h1>

                <div class="submit-type-selector">
                    <button
                        class="submit-type-btn"
                        :class="{ active: submitType === 'level' }"
                        @click="submitType = 'level'"
                    >
                        Отправить уровень
                    </button>
                    <button
                        class="submit-type-btn"
                        :class="{ active: submitType === 'record' }"
                        @click="submitType = 'record'"
                    >
                        Отправить прохождение
                    </button>
                </div>

                <form @submit.prevent="handleSubmit" class="submit-form">
                    <!-- Общие поля -->
                    <div class="form-group">
                        <label for="username">Ваш ник в GD</label>
                        <input
                            type="text"
                            id="username"
                            v-model="formData.username"
                            required
                            placeholder="Введите ваш ник"
                        />
                    </div>

                    <div class="form-group">
                        <label for="videoLink">Ссылка на видео</label>
                        <input
                            type="url"
                            id="videoLink"
                            v-model="formData.videoLink"
                            required
                            placeholder="https://www.youtube.com/watch?v=..."
                        />
                    </div>

                    <!-- Поля для отправки уровня -->
                    <template v-if="submitType === 'level'">
                        <div class="form-group">
                            <label for="levelName">Название уровня</label>
                            <input
                                type="text"
                                id="levelName"
                                v-model="formData.levelName"
                                required
                                placeholder="Введите название уровня"
                            />
                        </div>

                        <div class="form-group">
                            <label for="levelId">ID уровня</label>
                            <input
                                type="number"
                                id="levelId"
                                v-model="formData.levelId"
                                required
                                placeholder="12345678"
                            />
                        </div>

                        <div class="form-group">
                            <label for="creators">Создатели (через запятую)</label>
                            <input
                                type="text"
                                id="creators"
                                v-model="formData.creators"
                                required
                                placeholder="Creator1, Creator2"
                            />
                        </div>

                        <div class="form-group">
                            <label for="verifier">Верификатор</label>
                            <input
                                type="text"
                                id="verifier"
                                v-model="formData.verifier"
                                required
                                placeholder="Имя верификатора"
                            />
                        </div>

                        <div class="form-group">
                            <label for="password">Пароль (если есть)</label>
                            <input
                                type="text"
                                id="password"
                                v-model="formData.password"
                                placeholder="Пароль или 'Not Copyable'"
                            />
                        </div>
                    </template>

                    <!-- Поля для отправки прохождения -->
                    <template v-else>
                        <div class="form-group">
                            <label for="levelName">Название уровня</label>
                            <input
                                type="text"
                                id="levelName"
                                v-model="formData.levelName"
                                required
                                placeholder="Выберите уровень из листа"
                                list="levels-list"
                            />
                            <datalist id="levels-list">
                                <option v-for="level in availableLevels" :value="level">{{ level }}</option>
                            </datalist>
                        </div>

                        <div class="form-group">
                            <label for="progress">Процент прохождения</label>
                            <input
                                type="number"
                                id="progress"
                                v-model="formData.progress"
                                required
                                min="0"
                                max="100"
                                placeholder="100"
                            />
                        </div>

                        <div class="form-group">
                            <label>
                                <input
                                    type="checkbox"
                                    v-model="formData.completedOnMobile"
                                />
                                Пройдено на мобильном устройстве
                            </label>
                        </div>
                    </template>

                    <!-- Дополнительные комментарии -->
                    <div class="form-group">
                        <label for="comments">Дополнительные комментарии (опционально)</label>
                        <textarea
                            id="comments"
                            v-model="formData.comments"
                            rows="4"
                            placeholder="Любая дополнительная информация..."
                        ></textarea>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn-submit" :disabled="isSubmitting">
                            {{ isSubmitting ? 'Отправка...' : 'Отправить заявку' }}
                        </button>
                    </div>

                    <div v-if="submitMessage" class="submit-message" :class="{ error: submitError }">
                        {{ submitMessage }}
                    </div>
                </form>
            </div>
        </main>
    `,
    data() {
        return {
            store,
            submitType: 'level',
            formData: {
                username: '',
                videoLink: '',
                levelName: '',
                levelId: '',
                creators: '',
                verifier: '',
                password: '',
                progress: 100,
                completedOnMobile: false,
                comments: ''
            },
            availableLevels: ['P3tuh Wave', 'x2buff_clubstep'],
            isSubmitting: false,
            submitMessage: '',
            submitError: false
        };
    },
    methods: {
        async handleSubmit() {
            this.isSubmitting = true;
            this.submitMessage = '';
            this.submitError = false;

            try {
                const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                const submission = {
                    type: this.submitType,
                    timestamp: new Date().toISOString(),
                    ...this.formData,
                    username: this.formData.username || userData.username || 'anonymous'
                };

                // Сохранение заявки
                const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
                submission.id = Date.now() + Math.random();
                submission.status = 'pending';
                submissions.push(submission);
                localStorage.setItem('submissions', JSON.stringify(submissions));

                console.log('Submission:', submission);

                this.submitMessage = 'Заявка успешно отправлена! Ожидайте проверки модерацией.';
                this.resetForm();

                // Перенаправление на страницу профиля через 2 секунды
                setTimeout(() => {
                    this.$router.push('/profile');
                }, 2000);
            } catch (error) {
                console.error('Submit error:', error);
                this.submitMessage = 'Ошибка при отправке заявки. Попробуйте снова.';
                this.submitError = true;
            } finally {
                this.isSubmitting = false;
            }
        },
        resetForm() {
            this.formData = {
                username: '',
                videoLink: '',
                levelName: '',
                levelId: '',
                creators: '',
                verifier: '',
                password: '',
                progress: 100,
                completedOnMobile: false,
                comments: ''
            };
        }
    }
};
