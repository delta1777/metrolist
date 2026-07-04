import { store } from "../main.js";
import { getSupabase } from "../supabase.js";

// Импортируем конфигурацию (файл не попадет в git)
let ADMIN_CONFIG = null;
try {
    const configModule = await import('../admin-config.js');
    ADMIN_CONFIG = configModule.ADMIN_CONFIG;
} catch (error) {
    console.error('Admin config not found. Please create admin-config.js from admin-config.example.js');
}

export default {
    template: `
        <main class="page-admin" :class="{ dark: store.dark }">
            <div v-if="!configLoaded" class="admin-denied">
                <h1 class="type-display-lg">Ошибка конфигурации</h1>
                <p>Файл admin-config.js не найден</p>
                <p class="config-instruction">
                    Скопируйте admin-config.example.js в admin-config.js<br>
                    и настройте свои данные администратора
                </p>
                <button @click="$router.push('/')" class="btn-back">Вернуться на главную</button>
            </div>

            <div v-else-if="!isAuthenticated" class="admin-login">
                <h1 class="type-display-lg">Вход в админпанель</h1>
                <form @submit.prevent="handleLogin" class="login-form">
                    <div class="form-group">
                        <label for="admin-password">Пароль администратора</label>
                        <input
                            type="password"
                            id="admin-password"
                            v-model="passwordInput"
                            placeholder="Введите пароль"
                            required
                        />
                    </div>
                    <button type="submit" class="btn-login">Войти</button>
                    <div v-if="loginError" class="login-error">{{ loginError }}</div>
                </form>
                <button @click="$router.push('/')" class="btn-back">Вернуться на главную</button>
            </div>

            <div v-else-if="!isAdmin" class="admin-denied">
                <h1 class="type-display-lg">Доступ запрещен</h1>
                <p>У вас нет прав администратора</p>
                <button @click="logout" class="btn-back">Выйти</button>
            </div>

            <div v-else class="admin-container">
                <div class="admin-header">
                    <h1 class="type-display-lg">Админ-панель</h1>
                    <button @click="logout" class="btn-logout">Выйти</button>
                </div>

                <div class="admin-tabs">
                    <button
                        class="admin-tab-btn"
                        :class="{ active: activeTab === 'submissions' }"
                        @click="activeTab = 'submissions'"
                    >
                        Заявки ({{ submissions.length }})
                    </button>
                    <button
                        class="admin-tab-btn"
                        :class="{ active: activeTab === 'accounts' }"
                        @click="activeTab = 'accounts'"
                    >
                        Аккаунты ({{ accounts.length }})
                    </button>
                </div>

                <!-- Заявки -->
                <div v-if="activeTab === 'submissions'" class="admin-section">
                    <div class="admin-filters">
                        <select v-model="filterType" class="filter-select">
                            <option value="all">Все заявки</option>
                            <option value="level">Только уровни</option>
                            <option value="record">Только прохождения</option>
                        </select>
                        <select v-model="filterStatus" class="filter-select">
                            <option value="all">Все статусы</option>
                            <option value="pending">В ожидании</option>
                            <option value="approved">Одобрено</option>
                            <option value="rejected">Отклонено</option>
                        </select>
                    </div>

                    <div v-if="filteredSubmissions.length === 0" class="empty-state">
                        <p>Нет заявок</p>
                    </div>

                    <div v-else class="submissions-list">
                        <div
                            v-for="submission in filteredSubmissions"
                            :key="submission.id"
                            class="submission-card"
                            :class="'status-' + submission.status"
                        >
                            <div class="submission-header">
                                <span class="submission-type">
                                    {{ submission.type === 'level' ? '🎮 Уровень' : '🏆 Прохождение' }}
                                </span>
                                <span class="submission-status">{{ getStatusText(submission.status) }}</span>
                            </div>

                            <div class="submission-body">
                                <h3>{{ submission.levelName }}</h3>
                                <p><strong>Ник:</strong> {{ submission.username }}</p>
                                <p><strong>Видео:</strong> <a :href="submission.videoLink" target="_blank">{{ submission.videoLink }}</a></p>

                                <template v-if="submission.type === 'level'">
                                    <p><strong>ID уровня:</strong> {{ submission.levelId }}</p>
                                    <p><strong>Создатели:</strong> {{ submission.creators }}</p>
                                    <p><strong>Верификатор:</strong> {{ submission.verifier }}</p>
                                    <p v-if="submission.password"><strong>Пароль:</strong> {{ submission.password }}</p>
                                </template>

                                <template v-else>
                                    <p><strong>Прогресс:</strong> {{ submission.progress }}%</p>
                                    <p><strong>Мобильное:</strong> {{ submission.completedOnMobile ? 'Да' : 'Нет' }}</p>
                                </template>

                                <p v-if="submission.comments"><strong>Комментарии:</strong> {{ submission.comments }}</p>
                                <p class="submission-date">{{ formatDate(submission.timestamp) }}</p>
                            </div>

                            <div class="submission-actions">
                                <button
                                    v-if="submission.status === 'pending'"
                                    @click="updateSubmissionStatus(submission.id, 'approved')"
                                    class="btn-approve"
                                >
                                    Одобрить
                                </button>
                                <button
                                    v-if="submission.status === 'pending'"
                                    @click="updateSubmissionStatus(submission.id, 'rejected')"
                                    class="btn-reject"
                                >
                                    Отклонить
                                </button>
                                <button
                                    @click="deleteSubmission(submission.id)"
                                    class="btn-delete"
                                >
                                    Удалить
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Аккаунты -->
                <div v-if="activeTab === 'accounts'" class="admin-section">
                    <div class="admin-search">
                        <input
                            v-model="searchQuery"
                            type="text"
                            placeholder="Поиск по нику..."
                            class="search-input"
                        />
                    </div>

                    <div v-if="filteredAccounts.length === 0" class="empty-state">
                        <p>Нет аккаунтов</p>
                    </div>

                    <div v-else class="accounts-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Ник в GD</th>
                                    <th>Дата регистрации</th>
                                    <th>Заявок</th>
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="account in filteredAccounts" :key="account.username">
                                    <td>{{ account.username }}</td>
                                    <td>{{ formatDate(account.createdAt) }}</td>
                                    <td>{{ getAccountSubmissions(account.username) }}</td>
                                    <td>
                                        <button
                                            v-if="account.username !== currentUsername"
                                            @click="deleteAccount(account.username)"
                                            class="btn-delete-small"
                                        >
                                            Удалить
                                        </button>
                                        <span v-else class="admin-badge">Админ</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    `,
    data() {
        return {
            store,
            configLoaded: false,
            isAuthenticated: false,
            isAdmin: false,
            currentUsername: '',
            passwordInput: '',
            loginError: '',
            activeTab: 'submissions',
            submissions: [],
            accounts: [],
            filterType: 'all',
            filterStatus: 'all',
            searchQuery: ''
        };
    },
    computed: {
        filteredSubmissions() {
            let filtered = this.submissions;

            if (this.filterType !== 'all') {
                filtered = filtered.filter(s => s.type === this.filterType);
            }

            if (this.filterStatus !== 'all') {
                filtered = filtered.filter(s => s.status === this.filterStatus);
            }

            return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        },
        filteredAccounts() {
            if (!this.searchQuery) {
                return this.accounts;
            }

            const query = this.searchQuery.toLowerCase();
            return this.accounts.filter(acc =>
                acc.username.toLowerCase().includes(query)
            );
        }
    },
    methods: {
        async handleLogin() {
            this.loginError = '';

            try {
                // Хешируем введенный пароль
                const hashedInput = await this.hashPassword(this.passwordInput);

                // Сравниваем с хешем из конфига
                if (hashedInput === ADMIN_CONFIG.passwordHash) {
                    this.isAuthenticated = true;
                    sessionStorage.setItem('adminAuth', 'true');
                    this.checkAdminAccess();
                } else {
                    this.loginError = 'Неверный пароль';
                }
            } catch (error) {
                console.error('Login error:', error);
                this.loginError = 'Ошибка авторизации';
            }

            this.passwordInput = '';
        },
        async hashPassword(password) {
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        },
        logout() {
            sessionStorage.removeItem('adminAuth');
            this.isAuthenticated = false;
            this.isAdmin = false;
            this.$router.push('/');
        },
        checkAdminAccess() {
            // Если пароль правильный - даём доступ
            this.isAdmin = true;
            this.currentUsername = ADMIN_CONFIG.adminUsername;

            if (this.isAdmin) {
                this.loadData();
            }
        },
        checkAuthentication() {
            // Проверяем что конфиг загружен
            this.configLoaded = ADMIN_CONFIG !== null;

            if (!this.configLoaded) {
                return;
            }

            const authSession = sessionStorage.getItem('adminAuth');
            this.isAuthenticated = authSession === 'true';

            if (this.isAuthenticated) {
                this.checkAdminAccess();
            }
        },
        async loadData() {
            const supabase = await getSupabase();
            if (!supabase) return;

            try {
                // Загружаем заявки
                const { data: submissions, error: submissionsError } = await supabase
                    .from('submissions')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (submissionsError) {
                    console.error('Error loading submissions:', submissionsError);
                } else {
                    // Преобразуем snake_case в camelCase для совместимости с шаблоном
                    this.submissions = submissions.map(s => ({
                        id: s.id,
                        type: s.type,
                        username: s.username,
                        videoLink: s.video_link,
                        levelName: s.level_name,
                        levelId: s.level_id,
                        creators: s.creators,
                        verifier: s.verifier,
                        password: s.password,
                        progress: s.progress,
                        completedOnMobile: s.completed_on_mobile,
                        comments: s.comments,
                        status: s.status,
                        timestamp: s.created_at
                    }));
                }

                // Загружаем аккаунты
                const { data: users, error: usersError } = await supabase
                    .from('users')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (usersError) {
                    console.error('Error loading users:', usersError);
                } else {
                    this.accounts = users.map(u => ({
                        username: u.username,
                        createdAt: u.created_at
                    }));
                }
            } catch (error) {
                console.error('Error loading data:', error);
            }
        },
        async updateSubmissionStatus(submissionId, status) {
            const supabase = await getSupabase();
            if (!supabase) return;

            try {
                const { error } = await supabase
                    .from('submissions')
                    .update({ status: status, updated_at: new Date().toISOString() })
                    .eq('id', submissionId);

                if (error) {
                    console.error('Error updating submission:', error);
                    alert('Ошибка при обновлении статуса');
                } else {
                    // Обновляем локально
                    const index = this.submissions.findIndex(s => s.id === submissionId);
                    if (index !== -1) {
                        this.submissions[index].status = status;
                    }
                }
            } catch (error) {
                console.error('Error updating submission:', error);
            }
        },
        async deleteSubmission(submissionId) {
            if (!confirm('Вы уверены, что хотите удалить эту заявку?')) return;

            const supabase = await getSupabase();
            if (!supabase) return;

            try {
                const { error } = await supabase
                    .from('submissions')
                    .delete()
                    .eq('id', submissionId);

                if (error) {
                    console.error('Error deleting submission:', error);
                    alert('Ошибка при удалении заявки');
                } else {
                    // Удаляем локально
                    this.submissions = this.submissions.filter(s => s.id !== submissionId);
                }
            } catch (error) {
                console.error('Error deleting submission:', error);
            }
        },
        async deleteAccount(username) {
            if (!confirm(`Вы уверены, что хотите удалить аккаунт ${username}?`)) return;

            const supabase = await getSupabase();
            if (!supabase) return;

            try {
                const { error } = await supabase
                    .from('users')
                    .delete()
                    .eq('username', username);

                if (error) {
                    console.error('Error deleting user:', error);
                    alert('Ошибка при удалении аккаунта');
                } else {
                    // Удаляем локально
                    this.accounts = this.accounts.filter(acc => acc.username !== username);
                }
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        },
        getAccountSubmissions(username) {
            return this.submissions.filter(s => s.username === username).length;
        },
        getStatusText(status) {
            const statuses = {
                pending: 'В ожидании',
                approved: 'Одобрено',
                rejected: 'Отклонено'
            };
            return statuses[status] || status;
        },
        formatDate(timestamp) {
            if (!timestamp) return 'N/A';
            return new Date(timestamp).toLocaleString('ru-RU');
        }
    },
    mounted() {
        this.checkAuthentication();
    }
};
