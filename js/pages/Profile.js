import { store } from "../main.js";
import { getSupabase, hashPassword, verifyPassword } from "../supabase.js";
import { realtimeManager } from "../realtime.js";
import { validateUsername, validatePassword } from "../validation.js";

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
                    <div class="header-actions">
                        <button v-if="isAdmin" @click="goToAdmin" class="btn-admin">Админ-панель</button>
                        <button @click="handleLogout" class="btn-logout">Выйти</button>
                    </div>
                </div>

                <div class="profile-info">
                    <div class="info-card">
                        <div class="username-section">
                            <h2 class="type-title-lg">{{ userData.username }}</h2>
                            <button @click="showUsernameDialog = true" class="btn-edit-username">✏️ Изменить ник</button>
                        </div>
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

            <!-- Диалог изменения ника -->
            <div v-if="showUsernameDialog" class="dialog-overlay" @click="closeUsernameDialog">
                <div class="dialog-box" @click.stop>
                    <h2 class="type-title-lg">Изменить ник</h2>

                    <div class="dialog-content">
                        <p>Текущий ник: <strong>{{ userData.username }}</strong></p>

                        <div class="form-group">
                            <label for="new-username">Новый ник</label>
                            <input
                                type="text"
                                id="new-username"
                                v-model="newUsername"
                                placeholder="Введите новый ник"
                                class="form-input"
                                required
                            />
                        </div>

                        <div v-if="usernameMessage" class="username-message" :class="{ error: usernameError }">
                            {{ usernameMessage }}
                        </div>
                    </div>

                    <div class="dialog-actions">
                        <button @click="changeUsername" class="btn-save">Сохранить</button>
                        <button @click="closeUsernameDialog" class="btn-cancel">Отмена</button>
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
            isAdmin: false,
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
            authError: false,
            showUsernameDialog: false,
            newUsername: '',
            usernameMessage: '',
            usernameError: false
        };
    },
    mounted() {
        this.checkAuth();
        if (this.isLoggedIn) {
            this.loadUserData();
            this.checkIfAdmin();
        }
    },
    methods: {
        checkAuth() {
            const userData = sessionStorage.getItem('userData');
            if (userData) {
                this.isLoggedIn = true;
                this.userData = JSON.parse(userData);
            }
        },
        async checkIfAdmin() {
            try {
                const configModule = await import('../admin-config.js');
                const ADMIN_CONFIG = configModule.ADMIN_CONFIG;

                if (this.userData.username === ADMIN_CONFIG.adminUsername) {
                    this.isAdmin = true;
                }
            } catch (error) {
                // Конфиг не найден, пользователь не админ
                this.isAdmin = false;
            }
        },
        goToAdmin() {
            this.$router.push('/admin');
        },
        closeUsernameDialog() {
            this.showUsernameDialog = false;
            this.newUsername = '';
            this.usernameMessage = '';
            this.usernameError = false;
        },
        async changeUsername() {
            this.usernameMessage = '';
            this.usernameError = false;

            if (!this.newUsername || this.newUsername.trim() === '') {
                this.usernameMessage = 'Введите новый ник';
                this.usernameError = true;
                return;
            }

            const trimmedUsername = this.newUsername.trim();

            if (trimmedUsername === this.userData.username) {
                this.usernameMessage = 'Новый ник совпадает с текущим';
                this.usernameError = true;
                return;
            }

            const supabase = await getSupabase();
            if (!supabase) {
                this.usernameMessage = 'Ошибка подключения к базе данных';
                this.usernameError = true;
                return;
            }

            try {
                // Проверяем, не занят ли новый ник
                const { data: existingUser } = await supabase
                    .from('users')
                    .select('username')
                    .eq('username', trimmedUsername)
                    .single();

                if (existingUser) {
                    this.usernameMessage = 'Этот ник уже занят';
                    this.usernameError = true;
                    return;
                }

                const oldUsername = this.userData.username;

                // Обновляем ник в таблице users
                const { error: updateUserError } = await supabase
                    .from('users')
                    .update({ username: trimmedUsername })
                    .eq('username', oldUsername);

                if (updateUserError) {
                    this.usernameMessage = 'Ошибка при обновлении ника';
                    this.usernameError = true;
                    return;
                }

                // Обновляем ник во всех submissions
                await supabase
                    .from('submissions')
                    .update({ username: trimmedUsername })
                    .eq('username', oldUsername);

                // Обновляем ник во всех records
                await supabase
                    .from('records')
                    .update({ username: trimmedUsername })
                    .eq('username', oldUsername);

                // Обновляем локально
                this.userData.username = trimmedUsername;
                sessionStorage.setItem('userData', JSON.stringify(this.userData));

                this.usernameMessage = 'Ник успешно изменен!';
                this.usernameError = false;

                // Закрываем диалог через 2 секунды
                setTimeout(() => {
                    this.closeUsernameDialog();
                    this.loadUserData(); // Перезагружаем данные
                }, 2000);

            } catch (error) {
                console.error('Error changing username:', error);
                this.usernameMessage = 'Произошла ошибка';
                this.usernameError = true;
            }
        },
        async handleAuth() {
            this.authMessage = '';
            this.authError = false;

            // Валидация username
            const usernameCheck = validateUsername(this.authData.username);
            if (!usernameCheck.valid) {
                this.authMessage = usernameCheck.error;
                this.authError = true;
                return;
            }

            // Валидация пароля
            const passwordCheck = validatePassword(this.authData.password);
            if (!passwordCheck.valid) {
                this.authMessage = passwordCheck.error;
                this.authError = true;
                return;
            }

            // Предупреждение о слабом пароле при регистрации
            if (this.isRegistering && passwordCheck.strength === 'weak') {
                this.authMessage = 'Внимание: пароль слабый. Рекомендуем использовать более сложный пароль.';
                this.authError = false;
                // Даем пользователю 2 секунды увидеть предупреждение
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

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
                    sessionStorage.setItem('userData', JSON.stringify(this.userData));

                    this.isLoggedIn = true;

                    // Мигрируем старые прохождения по нику
                    await this.migrateUserRecords(newUser.username);

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

                    // Проверяем пароль с новой функцией verifyPassword
                    const isValid = await verifyPassword(this.authData.password, user.password_hash);

                    if (!isValid) {
                        this.authMessage = 'Неверный пароль';
                        this.authError = true;
                        return;
                    }

                    // Если пароль в старом формате (без соли), обновляем на новый
                    if (!user.password_hash.includes(':')) {
                        const newHash = await hashPassword(this.authData.password);
                        await supabase
                            .from('users')
                            .update({ password_hash: newHash })
                            .eq('username', user.username);
                    }

                    this.userData = { username: user.username, id: user.id };
                    sessionStorage.setItem('userData', JSON.stringify(this.userData));

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
            sessionStorage.removeItem('userData');
            this.isLoggedIn = false;
            this.userData = { username: '' };
        },
        async migrateUserRecords(username) {
            const supabase = await getSupabase();
            if (!supabase) return;

            try {
                const migratedRecords = [];

                // Получаем все рекорды этого пользователя из базы данных
                const { data: existingRecords, error: recordsError } = await supabase
                    .from('records')
                    .select('level_id, percent, link, mobile, hz')
                    .eq('username', username);

                if (recordsError) {
                    console.error('Error fetching existing records:', recordsError);
                    return;
                }

                // Для каждого рекорда проверяем, есть ли уже заявка
                for (const record of existingRecords) {
                    const { data: existingSubmission } = await supabase
                        .from('submissions')
                        .select('id')
                        .eq('username', username)
                        .eq('level_id', record.level_id)
                        .eq('progress', record.percent)
                        .eq('type', 'record')
                        .eq('status', 'approved')
                        .single();

                    if (!existingSubmission) {
                        // Получаем информацию об уровне
                        const { data: level } = await supabase
                            .from('levels')
                            .select('name, id')
                            .eq('id', record.level_id)
                            .single();

                        if (level) {
                            // Создаём одобренную заявку
                            const { error: insertError } = await supabase
                                .from('submissions')
                                .insert([{
                                    type: 'record',
                                    username: username,
                                    level_name: level.name,
                                    level_id: level.id,
                                    video_link: record.link || '',
                                    progress: record.percent,
                                    completed_on_mobile: record.mobile || false,
                                    comments: record.hz ? `${record.hz} hz` : '',
                                    status: 'approved',
                                    created_at: new Date().toISOString()
                                }]);

                            if (!insertError) {
                                migratedRecords.push({
                                    levelName: level.name,
                                    percent: record.percent
                                });
                            }
                        }
                    }
                }

                if (migratedRecords.length > 0) {
                    console.log(`Migrated ${migratedRecords.length} records for ${username}`);
                    this.authMessage = `Добро пожаловать! Найдено и привязано ${migratedRecords.length} прохождений`;
                    this.authError = false;
                }
            } catch (error) {
                console.error('Migration error:', error);
                // Не показываем ошибку пользователю, т.к. это не критично
            }
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
        },
        setupRealtime() {
            // Подписываемся на изменения в submissions для текущего пользователя
            realtimeManager.subscribe('submissions', (payload) => {
                const { eventType, new: newRecord, old: oldRecord } = payload;

                // Проверяем, относится ли изменение к текущему пользователю
                const isCurrentUser = newRecord?.username === this.userData.username ||
                                     oldRecord?.username === this.userData.username;

                if (!isCurrentUser) return;

                if (eventType === 'INSERT' || eventType === 'UPDATE' || eventType === 'DELETE') {
                    // Перезагружаем данные пользователя
                    this.loadUserData();
                }
            });

            // Подписываемся на изменения в records для текущего пользователя
            realtimeManager.subscribe('records', (payload) => {
                const { eventType, new: newRecord, old: oldRecord } = payload;

                const isCurrentUser = newRecord?.username === this.userData.username ||
                                     oldRecord?.username === this.userData.username;

                if (!isCurrentUser) return;

                if (eventType === 'INSERT' || eventType === 'UPDATE' || eventType === 'DELETE') {
                    // Перезагружаем данные пользователя
                    this.loadUserData();
                }
            });
        }
    },
    mounted() {
        this.checkAuth();
        if (this.isLoggedIn) {
            this.loadUserData();
            this.checkIfAdmin();
            this.setupRealtime();
        }
    },
    beforeUnmount() {
        // Отписываемся от всех обновлений при закрытии страницы
        realtimeManager.unsubscribeAll();
    }
};
