import { store } from "../main.js";

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
                                <p><strong>Email:</strong> {{ submission.userEmail }}</p>
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
                            placeholder="Поиск по email или нику..."
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
                                    <th>Email</th>
                                    <th>Ник в GD</th>
                                    <th>Дата регистрации</th>
                                    <th>Заявок</th>
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="account in filteredAccounts" :key="account.email">
                                    <td>{{ account.email }}</td>
                                    <td>{{ account.gdUsername }}</td>
                                    <td>{{ formatDate(account.createdAt) }}</td>
                                    <td>{{ getAccountSubmissions(account.email) }}</td>
                                    <td>
                                        <button
                                            v-if="account.email !== currentUserEmail"
                                            @click="deleteAccount(account.email)"
                                            class="btn-delete-small"
                                        >
                                            Удалить
                                        </button>
                                        <span v-else class="admin-badge">Вы</span>
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
            currentUserEmail: '',
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
                acc.email.toLowerCase().includes(query) ||
                acc.gdUsername.toLowerCase().includes(query)
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
            const currentUser = localStorage.getItem('userEmail');
            this.currentUserEmail = currentUser;

            // Проверяем email из конфига
            this.isAdmin = currentUser === ADMIN_CONFIG.adminEmail;

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
        loadData() {
            this.submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
            this.accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
        },
        updateSubmissionStatus(submissionId, status) {
            const index = this.submissions.findIndex(s => s.id === submissionId);
            if (index !== -1) {
                this.submissions[index].status = status;
                localStorage.setItem('submissions', JSON.stringify(this.submissions));
            }
        },
        deleteSubmission(submissionId) {
            if (confirm('Вы уверены, что хотите удалить эту заявку?')) {
                this.submissions = this.submissions.filter(s => s.id !== submissionId);
                localStorage.setItem('submissions', JSON.stringify(this.submissions));
            }
        },
        deleteAccount(email) {
            if (confirm(`Вы уверены, что хотите удалить аккаунт ${email}?`)) {
                this.accounts = this.accounts.filter(acc => acc.email !== email);
                localStorage.setItem('accounts', JSON.stringify(this.accounts));
            }
        },
        getAccountSubmissions(email) {
            return this.submissions.filter(s => s.userEmail === email).length;
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
