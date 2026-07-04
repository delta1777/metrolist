import { store } from "../main.js";

export default {
    template: `
        <main class="page-profile" :class="{ dark: store.dark }">
            <div v-if="!isLoggedIn" class="auth-container">
                <div class="auth-form">
                    <h1 class="type-display-lg">{{ isRegistering ? 'Регистрация' : 'Вход' }}</h1>

                    <form @submit.prevent="handleAuth">
                        <div class="form-group">
                            <label for="username">Ник в GD</label>
                            <input
                                type="text"
                                id="username"
                                v-model="authData.username"
                                required
                                placeholder="Введите ваш ник"
                            />
                        </div>

                        <div class="form-group">
                            <label for="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                v-model="authData.email"
                                required
                                placeholder="your@email.com"
                            />
                        </div>

                        <div class="form-group" v-if="isRegistering">
                            <label for="password">Пароль</label>
                            <input
                                type="password"
                                id="password"
                                v-model="authData.password"
                                required
                                placeholder="Минимум 6 символов"
                                minlength="6"
                            />
                        </div>

                        <div class="form-actions">
                            <button type="submit" class="btn-submit">
                                {{ isRegistering ? 'Зарегистрироваться' : 'Войти' }}
                            </button>
                        </div>

                        <div class="auth-toggle">
                            <button type="button" @click="isRegistering = !isRegistering" class="btn-link">
                                {{ isRegistering ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться' }}
                            </button>
                        </div>

                        <div v-if="authMessage" class="auth-message" :class="{ error: authError }">
                            {{ authMessage }}
                        </div>
                    </form>
                </div>
            </div>

            <div v-else class="profile-container">
                <div class="profile-header">
                    <h1 class="type-display-lg">Профиль игрока</h1>
                    <button @click="handleLogout" class="btn-logout">Выйти</button>
                </div>

                <div class="profile-info">
                    <div class="info-card">
                        <h2 class="type-title-lg">{{ userData.username }}</h2>
                        <p class="type-body">{{ userData.email }}</p>
                    </div>

                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value type-display-md">{{ userStats.position || 'N/A' }}</div>
                            <div class="stat-label type-label-lg">Место в лидерах</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value type-display-md">{{ userStats.completedLevels }}</div>
                            <div class="stat-label type-label-lg">Пройденных уровней</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value type-display-md">{{ userStats.totalScore }}</div>
                            <div class="stat-label type-label-lg">Всего очков</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value type-display-md">{{ userStats.pendingSubmissions }}</div>
                            <div class="stat-label type-label-lg">Заявок на рассмотрении</div>
                        </div>
                    </div>
                </div>

                <div class="profile-sections">
                    <div class="section">
                        <h2 class="type-title-lg">Мои прохождения</h2>
                        <div v-if="userRecords.length === 0" class="empty-state">
                            <p class="type-body">У вас пока нет прохождений в листе</p>
                        </div>
                        <div v-else class="records-list">
                            <div v-for="record in userRecords" :key="record.id" class="record-item">
                                <div class="record-info">
                                    <h3 class="type-label-lg">{{ record.levelName }}</h3>
                                    <p class="type-body-sm">{{ record.progress }}% • {{ record.date }}</p>
                                </div>
                                <div class="record-link">
                                    <a :href="record.videoLink" target="_blank" class="btn-link">Видео</a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="section">
                        <h2 class="type-title-lg">Мои отправленные уровни</h2>
                        <div v-if="userLevels.length === 0" class="empty-state">
                            <p class="type-body">Вы еще не отправляли уровни в лист</p>
                        </div>
                        <div v-else class="levels-list">
                            <div v-for="level in userLevels" :key="level.id" class="level-item">
                                <div class="level-info">
                                    <h3 class="type-label-lg">{{ level.levelName }}</h3>
                                    <p class="type-body-sm">ID: {{ level.levelId }} • {{ level.date }}</p>
                                </div>
                                <div class="level-status" :class="'status-' + level.status">
                                    {{ getStatusText(level.status) }}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="section">
                        <h2 class="type-title-lg">Ожидающие рассмотрения</h2>
                        <div v-if="pendingSubmissions.length === 0" class="empty-state">
                            <p class="type-body">Нет заявок на рассмотрении</p>
                        </div>
                        <div v-else class="pending-list">
                            <div v-for="submission in pendingSubmissions" :key="submission.id" class="pending-item">
                                <div class="pending-info">
                                    <h3 class="type-label-lg">{{ submission.levelName }}</h3>
                                    <p class="type-body-sm">
                                        {{ submission.type === 'level' ? 'Уровень' : 'Прохождение' }} •
                                        {{ formatDate(submission.timestamp) }}
                                    </p>
                                </div>
                                <div class="pending-status">
                                    <span class="status-badge">На рассмотрении</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    `,
    data() {
        return {
            store,
            isLoggedIn: false,
            isRegistering: false,
            authData: {
                username: '',
                email: '',
                password: ''
            },
            userData: {
                username: '',
                email: ''
            },
            userStats: {
                position: null,
                completedLevels: 0,
                totalScore: 0,
                pendingSubmissions: 0
            },
            userRecords: [],
            userLevels: [],
            pendingSubmissions: [],
            authMessage: '',
            authError: false
        };
    },
    mounted() {
        this.checkAuth();
        if (this.isLoggedIn) {
            this.loadUserData();
        }
    },
    methods: {
        checkAuth() {
            const userData = localStorage.getItem('userData');
            if (userData) {
                this.isLoggedIn = true;
                this.userData = JSON.parse(userData);
            }
        },
        async handleAuth() {
            this.authMessage = '';
            this.authError = false;

            try {
                if (this.isRegistering) {
                    // Регистрация
                    const users = JSON.parse(localStorage.getItem('users') || '[]');

                    if (users.find(u => u.email === this.authData.email)) {
                        this.authMessage = 'Пользователь с таким email уже существует';
                        this.authError = true;
                        return;
                    }

                    const newUser = {
                        id: Date.now().toString(),
                        username: this.authData.username,
                        email: this.authData.email,
                        password: this.authData.password, // В реальном проекте нужно хешировать
                        createdAt: new Date().toISOString()
                    };

                    users.push(newUser);
                    localStorage.setItem('users', JSON.stringify(users));

                    this.userData = { username: newUser.username, email: newUser.email };
                    localStorage.setItem('userData', JSON.stringify(this.userData));
                    localStorage.setItem('userId', newUser.id);

                    this.isLoggedIn = true;
                    this.loadUserData();
                } else {
                    // Вход
                    const users = JSON.parse(localStorage.getItem('users') || '[]');
                    const user = users.find(u => u.email === this.authData.email);

                    if (!user) {
                        this.authMessage = 'Пользователь не найден';
                        this.authError = true;
                        return;
                    }

                    this.userData = { username: user.username, email: user.email };
                    localStorage.setItem('userData', JSON.stringify(this.userData));
                    localStorage.setItem('userId', user.id);

                    this.isLoggedIn = true;
                    this.loadUserData();
                }
            } catch (error) {
                console.error('Auth error:', error);
                this.authMessage = 'Произошла ошибка. Попробуйте снова.';
                this.authError = true;
            }
        },
        handleLogout() {
            localStorage.removeItem('userData');
            localStorage.removeItem('userId');
            this.isLoggedIn = false;
            this.userData = { username: '', email: '' };
        },
        loadUserData() {
            const userId = localStorage.getItem('userId');
            const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');

            // Фильтруем заявки текущего пользователя
            const userSubmissions = submissions.filter(s =>
                s.userEmail === this.userData.email
            );

            // Разделяем на категории
            this.pendingSubmissions = userSubmissions.filter(s => s.status === undefined || s.status === 'pending');

            this.userLevels = userSubmissions
                .filter(s => s.type === 'level' && s.status === 'approved')
                .map(s => ({
                    id: s.timestamp,
                    levelName: s.levelName,
                    levelId: s.levelId,
                    date: this.formatDate(s.timestamp),
                    status: s.status || 'pending'
                }));

            this.userRecords = userSubmissions
                .filter(s => s.type === 'record' && s.status === 'approved')
                .map(s => ({
                    id: s.timestamp,
                    levelName: s.levelName,
                    progress: s.progress,
                    videoLink: s.videoLink,
                    date: this.formatDate(s.timestamp)
                }));

            // Обновляем статистику
            this.userStats.completedLevels = this.userRecords.length;
            this.userStats.pendingSubmissions = this.pendingSubmissions.length;
            this.userStats.totalScore = this.userRecords.length * 100; // Упрощенный подсчет
        },
        formatDate(timestamp) {
            const date = new Date(timestamp);
            return date.toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        },
        getStatusText(status) {
            const statusMap = {
                pending: 'На рассмотрении',
                approved: 'Одобрено',
                rejected: 'Отклонено'
            };
            return statusMap[status] || 'На рассмотрении';
        }
    }
};
