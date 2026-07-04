import { store } from "../main.js";
import { getSupabase, hashPassword } from "../supabase.js";

export default {
    template: `
        <main class="page-profile" :class="{ dark: store.dark }">
            <div v-if="!isLoggedIn" class="auth-container">
                <div class="auth-form">
                    <h1 class="type-display-lg">{{ isRegistering ? 'Регистрация' : 'Вход' }}</h1>

                    <form @submit.prevent="handleAuth">
                        <div class="form-group">
                            <label for="username">Ваш ник</label>
                            <input
                                type="text"
                                id="username"
                                v-model="authData.username"
                                required
                                placeholder="Введите ваш ник"
                            />
                        </div>

                        <div class="form-group">
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
                password: ''
            },
            userData: {
                username: ''
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

            const supabase = await getSupabase();
            if (!supabase) {
                this.authMessage = 'Ошибка подключения к базе данных';
                this.authError = true;
                return;
            }

            try {
                if (this.isRegistering) {
                    // Регистрация
                    // Проверяем, существует ли пользователь
                    const { data: existingUser } = await supabase
                        .from('users')
                        .select('username')
                        .eq('username', this.authData.username)
                        .single();

                    if (existingUser) {
                        this.authMessage = 'Пользователь с таким ником уже существует';
                        this.authError = true;
                        return;
                    }

                    // Создаём нового пользователя
                    const passwordHash = await hashPassword(this.authData.password);
                    const { data: newUser, error } = await supabase
                        .from('users')
                        .insert([{
                            username: this.authData.username,
                            password_hash: passwordHash
                        }])
                        .select()
                        .single();

                    if (error) {
                        console.error('Registration error:', error);
                        this.authMessage = 'Ошибка при регистрации';
                        this.authError = true;
                        return;
                    }

                    this.userData = { username: newUser.username, id: newUser.id };
                    localStorage.setItem('userData', JSON.stringify(this.userData));

                    this.isLoggedIn = true;
                    this.loadUserData();
                } else {
                    // Вход
                    const { data: user, error } = await supabase
                        .from('users')
                        .select('*')
                        .eq('username', this.authData.username)
                        .single();

                    if (error || !user) {
                        this.authMessage = 'Пользователь не найден';
                        this.authError = true;
                        return;
                    }

                    // Проверяем пароль
                    const passwordHash = await hashPassword(this.authData.password);
                    if (user.password_hash !== passwordHash) {
                        this.authMessage = 'Неверный пароль';
                        this.authError = true;
                        return;
                    }

                    this.userData = { username: user.username, id: user.id };
                    localStorage.setItem('userData', JSON.stringify(this.userData));

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
            this.isLoggedIn = false;
            this.userData = { username: '' };
        },
        async loadUserData() {
            const supabase = await getSupabase();
            if (!supabase) return;

            try {
                // Загружаем заявки пользователя
                const { data: submissions, error } = await supabase
                    .from('submissions')
                    .select('*')
                    .eq('username', this.userData.username)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error loading submissions:', error);
                    return;
                }

                // Разделяем на категории
                this.pendingSubmissions = submissions.filter(s => s.status === 'pending');

                this.userLevels = submissions
                    .filter(s => s.type === 'level' && s.status === 'approved')
                    .map(s => ({
                        id: s.id,
                        levelName: s.level_name,
                        levelId: s.level_id,
                        date: this.formatDate(s.created_at),
                        status: s.status
                    }));

                this.userRecords = submissions
                    .filter(s => s.type === 'record' && s.status === 'approved')
                    .map(s => ({
                        id: s.id,
                        levelName: s.level_name,
                        progress: s.progress,
                        videoLink: s.video_link,
                        date: this.formatDate(s.created_at)
                    }));

                // Обновляем статистику
                this.userStats.completedLevels = this.userRecords.length;
                this.userStats.pendingSubmissions = this.pendingSubmissions.length;
                this.userStats.totalScore = this.userRecords.length * 100;
            } catch (error) {
                console.error('Error loading user data:', error);
            }
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
