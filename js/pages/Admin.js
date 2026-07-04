import { store } from "../main.js";
import { getSupabase, verifyPassword } from "../supabase.js";
import { realtimeManager } from "../realtime.js";

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
                    <button
                        class="admin-tab-btn"
                        :class="{ active: activeTab === 'future' }"
                        @click="activeTab = 'future'"
                    >
                        Будущие Уровни ({{ futureLevels.length }})
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
                                    <p><strong>Тип списка:</strong> {{ getListTypeName(submission.listType) }}</p>
                                    <p v-if="submission.listType === 'future'"><strong>Лучший прогресс:</strong> {{ submission.bestProgress || 0 }}%</p>
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
                                    @click="openApprovalDialog(submission)"
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
                                    <th>Ник</th>
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

                <!-- Будущие Уровни -->
                <div v-if="activeTab === 'future'" class="admin-section">
                    <div v-if="futureLevels.length === 0" class="empty-state">
                        <p>Нет будущих уровней</p>
                    </div>

                    <div v-else class="future-levels-list">
                        <div
                            v-for="level in futureLevels"
                            :key="level.id"
                            class="level-card"
                        >
                            <div class="level-header">
                                <h3>{{ level.name }}</h3>
                                <span class="level-position">Позиция: {{ level.position }}</span>
                            </div>

                            <div class="level-body">
                                <p><strong>ID уровня:</strong> {{ level.id }}</p>
                                <p><strong>Создатель:</strong> {{ level.author }}</p>
                                <p><strong>Верификатор:</strong> {{ level.verifier }}</p>
                                <p><strong>Видео:</strong> <a :href="level.verification" target="_blank">{{ level.verification }}</a></p>
                                <p><strong>Лучший прогресс:</strong> {{ formatProgress(level) }}</p>
                            </div>

                            <div class="level-actions">
                                <button
                                    @click="editFutureLevel(level)"
                                    class="btn-edit"
                                >
                                    Изменить прогресс
                                </button>
                                <button
                                    @click="deleteFutureLevel(level.id)"
                                    class="btn-delete"
                                >
                                    Удалить
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Диалог редактирования будущего уровня -->
            <div v-if="showEditDialog" class="dialog-overlay" @click="closeEditDialog">
                <div class="dialog-box" @click.stop>
                    <h2 class="type-title-lg">Изменить лучший прогресс</h2>

                    <div class="dialog-content">
                        <p><strong>{{ editingLevel.name }}</strong></p>

                        <div class="form-group">
                            <label>
                                <input
                                    type="radio"
                                    v-model="editData.progressType"
                                    value="text"
                                />
                                Свободный ввод (например, 62%, 80-100, 80-100%)
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    v-model="editData.progressType"
                                    value="single"
                                />
                                Одно число
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    v-model="editData.progressType"
                                    value="range"
                                />
                                Диапазон
                            </label>
                        </div>

                        <div v-if="editData.progressType === 'text'" class="form-group">
                            <label for="edit-progress-text">Лучший прогресс</label>
                            <input
                                type="text"
                                id="edit-progress-text"
                                v-model="editData.progressText"
                                placeholder="Например: 62%, 80-100, 80-100%"
                                class="form-input"
                            />
                            <small>Можно писать в любом формате: 62%, 80-100, 80-100%</small>
                        </div>

                        <div v-if="editData.progressType === 'single'" class="form-group">
                            <label for="edit-progress-single">Лучший прогресс (%)</label>
                            <input
                                type="number"
                                id="edit-progress-single"
                                v-model.number="editData.progressSingle"
                                min="0"
                                max="100"
                                placeholder="85"
                                class="form-input"
                            />
                        </div>

                        <div v-if="editData.progressType === 'range'">
                            <div class="form-group">
                                <label for="edit-progress-start">Начальный процент (%)</label>
                                <input
                                    type="number"
                                    id="edit-progress-start"
                                    v-model.number="editData.progressStart"
                                    min="0"
                                    max="100"
                                    placeholder="80"
                                    class="form-input"
                                />
                            </div>

                            <div class="form-group">
                                <label for="edit-progress-end">Конечный процент (%)</label>
                                <input
                                    type="number"
                                    id="edit-progress-end"
                                    v-model.number="editData.progressEnd"
                                    min="0"
                                    max="100"
                                    placeholder="100"
                                    class="form-input"
                                />
                            </div>
                        </div>
                    </div>

                    <div class="dialog-actions">
                        <button @click="confirmEdit" class="btn-approve">Сохранить</button>
                        <button @click="closeEditDialog" class="btn-cancel">Отмена</button>
                    </div>
                </div>
            </div>

            <!-- Диалог одобрения уровня -->
            <div v-if="showApprovalDialog" class="dialog-overlay" @click="closeApprovalDialog">
                <div class="dialog-box" @click.stop>
                    <h2 class="type-title-lg">Одобрить уровень</h2>

                    <div class="dialog-content">
                        <p><strong>{{ currentSubmission.levelName }}</strong></p>

                        <div class="form-group">
                            <label for="list-type">Выберите список</label>
                            <select id="list-type" v-model="approvalData.listType" class="form-select">
                                <option value="main">Main List (Основной)</option>
                                <option value="challenge">Challenge List (Челлендж)</option>
                                <option value="future">Future List (Будущий)</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="position">Позиция в списке</label>
                            <input
                                type="number"
                                id="position"
                                v-model.number="approvalData.position"
                                min="1"
                                placeholder="Введите позицию (1, 2, 3...)"
                                class="form-input"
                            />
                            <small>Оставьте пустым для автоматической позиции в конце списка</small>
                        </div>

                        <div v-if="approvalData.listType === 'future'" class="form-group">
                            <label>
                                <input
                                    type="radio"
                                    v-model="approvalData.progressType"
                                    value="text"
                                />
                                Свободный ввод (например, 62%, 80-100, 80-100%)
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    v-model="approvalData.progressType"
                                    value="single"
                                />
                                Одно число
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    v-model="approvalData.progressType"
                                    value="range"
                                />
                                Диапазон
                            </label>
                        </div>

                        <div v-if="approvalData.listType === 'future' && approvalData.progressType === 'text'" class="form-group">
                            <label for="progress-text">Лучший прогресс</label>
                            <input
                                type="text"
                                id="progress-text"
                                v-model="approvalData.progressText"
                                placeholder="Например: 62%, 80-100, 80-100%"
                                class="form-input"
                            />
                            <small>Можно писать в любом формате: 62%, 80-100, 80-100%</small>
                        </div>

                        <div v-if="approvalData.listType === 'future' && approvalData.progressType === 'single'" class="form-group">
                            <label for="progress-single">Лучший прогресс (%)</label>
                            <input
                                type="number"
                                id="progress-single"
                                v-model.number="approvalData.progressSingle"
                                min="0"
                                max="100"
                                placeholder="85"
                                class="form-input"
                            />
                        </div>

                        <div v-if="approvalData.listType === 'future' && approvalData.progressType === 'range'">
                            <div class="form-group">
                                <label for="progress-start">Начальный процент (%)</label>
                                <input
                                    type="number"
                                    id="progress-start"
                                    v-model.number="approvalData.progressStart"
                                    min="0"
                                    max="100"
                                    placeholder="80"
                                    class="form-input"
                                />
                            </div>

                            <div class="form-group">
                                <label for="progress-end">Конечный процент (%)</label>
                                <input
                                    type="number"
                                    id="progress-end"
                                    v-model.number="approvalData.progressEnd"
                                    min="0"
                                    max="100"
                                    placeholder="100"
                                    class="form-input"
                                />
                            </div>
                        </div>
                    </div>

                    <div class="dialog-actions">
                        <button @click="confirmApproval" class="btn-approve">Одобрить</button>
                        <button @click="closeApprovalDialog" class="btn-cancel">Отмена</button>
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
            futureLevels: [],
            filterType: 'all',
            filterStatus: 'all',
            searchQuery: '',
            showApprovalDialog: false,
            currentSubmission: null,
            approvalData: {
                listType: 'main',
                position: null,
                progressType: 'text',
                progressText: '',
                progressSingle: 0,
                progressStart: 0,
                progressEnd: 100
            },
            showEditDialog: false,
            editingLevel: null,
            editData: {
                progressType: 'text',
                progressText: '',
                progressSingle: 0,
                progressStart: 0,
                progressEnd: 100
            }
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
        parseProgressText(text) {
            // Парсим текстовый ввод прогресса
            // Поддерживаемые форматы: "62%", "62", "80-100", "80-100%"
            if (!text || text.trim() === '') {
                return { start: 0, end: 0 };
            }

            const cleaned = text.trim().replace(/%/g, '');

            // Проверяем на диапазон (содержит тире)
            if (cleaned.includes('-')) {
                const parts = cleaned.split('-').map(p => p.trim());
                if (parts.length === 2) {
                    const start = parseInt(parts[0]) || 0;
                    const end = parseInt(parts[1]) || 0;
                    return { start, end };
                }
            }

            // Одно число
            const num = parseInt(cleaned) || 0;
            return { start: 0, end: num };
        },
        async generateAdminToken() {
            // Генерируем токен на основе пароля и временной метки
            const timestamp = Date.now();
            const tokenData = `${ADMIN_CONFIG.passwordHash}-${timestamp}`;
            const encoder = new TextEncoder();
            const data = encoder.encode(tokenData);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const token = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            return { token, timestamp };
        },
        async verifyAdminToken() {
            const storedToken = sessionStorage.getItem('adminToken');
            const storedTimestamp = sessionStorage.getItem('adminTimestamp');

            if (!storedToken || !storedTimestamp) {
                return false;
            }

            // Проверяем что токен не истек (8 часов)
            const now = Date.now();
            const tokenAge = now - parseInt(storedTimestamp);
            const EIGHT_HOURS = 8 * 60 * 60 * 1000;

            if (tokenAge > EIGHT_HOURS) {
                // Токен истек
                sessionStorage.removeItem('adminToken');
                sessionStorage.removeItem('adminTimestamp');
                return false;
            }

            // Проверяем валидность токена
            const tokenData = `${ADMIN_CONFIG.passwordHash}-${storedTimestamp}`;
            const encoder = new TextEncoder();
            const data = encoder.encode(tokenData);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const expectedToken = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            return storedToken === expectedToken;
        },
        async handleLogin() {
            this.loginError = '';

            try {
                // Проверяем пароль с использованием verifyPassword
                const isValid = await verifyPassword(this.passwordInput, ADMIN_CONFIG.passwordHash);

                if (isValid) {
                    // Генерируем токен вместо простого флага
                    const { token, timestamp } = await this.generateAdminToken();
                    sessionStorage.setItem('adminToken', token);
                    sessionStorage.setItem('adminTimestamp', timestamp.toString());

                    this.isAuthenticated = true;
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
        logout() {
            sessionStorage.removeItem('adminToken');
            sessionStorage.removeItem('adminTimestamp');
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
        async checkAuthentication() {
            // Проверяем что конфиг загружен
            this.configLoaded = ADMIN_CONFIG !== null;

            if (!this.configLoaded) {
                return;
            }

            // Проверяем валидность токена
            const isValidToken = await this.verifyAdminToken();
            this.isAuthenticated = isValidToken;

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
                        listType: s.list_type,
                        bestProgress: s.best_progress,
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

                // Загружаем будущие уровни
                const { data: futureLevels, error: futureLevelsError } = await supabase
                    .from('levels')
                    .select('*')
                    .eq('list_type', 'future')
                    .order('position', { ascending: true });

                if (futureLevelsError) {
                    console.error('Error loading future levels:', futureLevelsError);
                } else {
                    this.futureLevels = futureLevels;
                }
            } catch (error) {
                console.error('Error loading data:', error);
            }
        },
        openApprovalDialog(submission) {
            if (submission.type !== 'level') {
                // Для прохождений просто одобряем без диалога
                this.updateSubmissionStatus(submission.id, 'approved');
                return;
            }

            // Для уровней открываем диалог
            this.currentSubmission = submission;
            this.approvalData.listType = submission.listType || 'main';
            this.approvalData.position = null;
            this.approvalData.progressType = 'text';
            this.approvalData.progressText = '';
            this.approvalData.progressSingle = 0;
            this.approvalData.progressStart = 0;
            this.approvalData.progressEnd = 100;
            this.showApprovalDialog = true;
        },
        closeApprovalDialog() {
            this.showApprovalDialog = false;
            this.currentSubmission = null;
            this.approvalData.listType = 'main';
            this.approvalData.position = null;
            this.approvalData.progressType = 'text';
            this.approvalData.progressText = '';
            this.approvalData.progressSingle = 0;
            this.approvalData.progressStart = 0;
            this.approvalData.progressEnd = 100;
        },
        async confirmApproval() {
            if (!this.currentSubmission) return;

            let progressStart, progressEnd;

            if (this.approvalData.progressType === 'text') {
                // Парсим текстовый ввод
                const parsed = this.parseProgressText(this.approvalData.progressText);
                progressStart = parsed.start;
                progressEnd = parsed.end;
            } else if (this.approvalData.progressType === 'single') {
                // Одно число: храним как 0 до этого числа
                progressStart = 0;
                progressEnd = this.approvalData.progressSingle;
            } else {
                // Диапазон
                progressStart = this.approvalData.progressStart;
                progressEnd = this.approvalData.progressEnd;
            }

            await this.updateSubmissionStatus(
                this.currentSubmission.id,
                'approved',
                this.approvalData.listType,
                this.approvalData.position,
                progressStart,
                progressEnd
            );

            this.closeApprovalDialog();
        },
        async updateSubmissionStatus(submissionId, status, listType = 'main', position = null, progressStart = 0, progressEnd = 100) {
            const supabase = await getSupabase();
            if (!supabase) return;

            try {
                // Находим заявку
                const submission = this.submissions.find(s => s.id === submissionId);
                if (!submission) {
                    alert('Заявка не найдена');
                    return;
                }

                // Если одобряем, добавляем в базу данных
                if (status === 'approved') {
                    if (submission.type === 'level') {
                        // Проверяем, не существует ли уже уровень с таким ID
                        const { data: existingLevel } = await supabase
                            .from('levels')
                            .select('id')
                            .eq('id', submission.levelId)
                            .single();

                        if (!existingLevel) {
                            // Определяем позицию
                            let finalPosition = position;

                            if (!finalPosition || finalPosition < 1) {
                                // Получаем текущую максимальную позицию для выбранного списка
                                const { data: maxPosData } = await supabase
                                    .from('levels')
                                    .select('position')
                                    .eq('list_type', listType)
                                    .order('position', { ascending: false })
                                    .limit(1);

                                finalPosition = maxPosData && maxPosData.length > 0 ? maxPosData[0].position + 1 : 1;
                            } else {
                                // Если указана конкретная позиция, сдвигаем все уровни начиная с этой позиции
                                const { data: levelsToShift } = await supabase
                                    .from('levels')
                                    .select('id, position')
                                    .eq('list_type', listType)
                                    .gte('position', finalPosition)
                                    .order('position', { ascending: false });

                                if (levelsToShift && levelsToShift.length > 0) {
                                    // Сдвигаем позиции вниз
                                    for (const level of levelsToShift) {
                                        await supabase
                                            .from('levels')
                                            .update({ position: level.position + 1 })
                                            .eq('id', level.id);
                                    }
                                }
                            }

                            // Добавляем новый уровень в базу данных
                            const levelData = {
                                id: submission.levelId,
                                name: submission.levelName,
                                author: submission.creators,
                                creators: submission.creators ? submission.creators.split(',').map(c => c.trim()) : [],
                                verifier: submission.verifier || submission.username,
                                verification: submission.videoLink,
                                percent_to_qualify: 100,
                                password: submission.password || 'Not Copyable',
                                position: finalPosition,
                                list_type: listType
                            };

                            // Для будущих уровней добавляем progress_start и progress_end
                            if (listType === 'future') {
                                levelData.progress_start = progressStart || 0;
                                levelData.progress_end = progressEnd || 100;
                            }

                            const { error: insertError } = await supabase
                                .from('levels')
                                .insert([levelData]);

                            if (insertError) {
                                console.error('Error inserting level:', insertError);
                                alert(`Ошибка при добавлении уровня: ${insertError.message}`);
                                return;
                            }

                            const listNames = {
                                'main': 'Main List',
                                'challenge': 'Challenge List',
                                'future': 'Future List'
                            };
                            alert(`Уровень одобрен и добавлен в ${listNames[listType]} на позицию ${finalPosition}!`);
                        } else {
                            alert('Уровень уже существует в базе данных');
                        }

                    } else if (submission.type === 'record') {
                        // Получаем уровень по имени
                        const { data: level, error: levelError } = await supabase
                            .from('levels')
                            .select('*')
                            .eq('name', submission.levelName)
                            .single();

                        if (levelError || !level) {
                            alert('Уровень не найден в базе данных');
                            return;
                        }

                        // Проверяем, нет ли уже такого прохождения
                        const { data: existingRecord } = await supabase
                            .from('records')
                            .select('id')
                            .eq('level_id', level.id)
                            .eq('username', submission.username)
                            .eq('percent', submission.progress)
                            .single();

                        if (!existingRecord) {
                            // Извлекаем hz из комментариев
                            let hz = null;
                            if (submission.comments && submission.comments.includes('hz')) {
                                const hzMatch = submission.comments.match(/(\d+)\s*hz/i);
                                if (hzMatch) {
                                    hz = parseInt(hzMatch[1]);
                                }
                            }

                            // Добавляем новое прохождение
                            const { error: insertError } = await supabase
                                .from('records')
                                .insert([{
                                    level_id: level.id,
                                    username: submission.username,
                                    link: submission.videoLink,
                                    percent: submission.progress,
                                    hz: hz,
                                    mobile: submission.completedOnMobile || false
                                }]);

                            if (insertError) {
                                console.error('Error inserting record:', insertError);
                                alert(`Ошибка при добавлении прохождения: ${insertError.message}`);
                                return;
                            }

                            alert('Прохождение одобрено и добавлено!');
                        } else {
                            alert('Прохождение уже существует в базе данных');
                        }
                    }
                }

                // Обновляем статус заявки
                const { error } = await supabase
                    .from('submissions')
                    .update({ status: status, updated_at: new Date().toISOString() })
                    .eq('id', submissionId);

                if (error) {
                    console.error('Error updating submission:', error);
                    alert('Ошибка при обновлении статуса');
                    return;
                }

                // Обновляем локально
                const index = this.submissions.findIndex(s => s.id === submissionId);
                if (index !== -1) {
                    this.submissions[index].status = status;
                }
            } catch (error) {
                console.error('Error updating submission:', error);
                alert('Ошибка: ' + error.message);
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
        getListTypeName(listType) {
            const listTypes = {
                'main': 'Main List (Обычный)',
                'challenge': 'Challenge List (Челлендж)',
                'future': 'Future List (Будущий)'
            };
            return listTypes[listType] || 'Main List (Обычный)';
        },
        formatDate(timestamp) {
            if (!timestamp) return 'N/A';
            return new Date(timestamp).toLocaleString('ru-RU');
        },
        formatProgress(level) {
            const start = level.progress_start || 0;
            const end = level.progress_end || 0;

            if (start === 0 && end === 0) {
                return '0%';
            } else if (start === 0 && end !== 100) {
                // Одно число (лучший прогресс)
                return `${end}%`;
            } else if (start === 0 && end === 100) {
                return '0-100%';
            } else {
                // Диапазон
                return `${start}-${end}%`;
            }
        },
        setupRealtime() {
            // Подписываемся на изменения в таблице submissions
            realtimeManager.subscribe('submissions', (payload) => {
                const { eventType, new: newRecord, old: oldRecord } = payload;

                if (eventType === 'INSERT') {
                    // Новая заявка добавлена
                    this.submissions.unshift({
                        id: newRecord.id,
                        type: newRecord.type,
                        username: newRecord.username,
                        videoLink: newRecord.video_link,
                        levelName: newRecord.level_name,
                        levelId: newRecord.level_id,
                        creators: newRecord.creators,
                        verifier: newRecord.verifier,
                        password: newRecord.password,
                        progress: newRecord.progress,
                        completedOnMobile: newRecord.completed_on_mobile,
                        comments: newRecord.comments,
                        status: newRecord.status,
                        timestamp: newRecord.created_at
                    });
                } else if (eventType === 'UPDATE') {
                    // Заявка обновлена
                    const index = this.submissions.findIndex(s => s.id === newRecord.id);
                    if (index !== -1) {
                        this.submissions[index].status = newRecord.status;
                    }
                } else if (eventType === 'DELETE') {
                    // Заявка удалена
                    this.submissions = this.submissions.filter(s => s.id !== oldRecord.id);
                }
            });

            // Подписываемся на изменения в таблице users
            realtimeManager.subscribe('users', (payload) => {
                const { eventType, new: newRecord, old: oldRecord } = payload;

                if (eventType === 'INSERT') {
                    // Новый пользователь
                    this.accounts.unshift({
                        username: newRecord.username,
                        createdAt: newRecord.created_at
                    });
                } else if (eventType === 'DELETE') {
                    // Пользователь удален
                    this.accounts = this.accounts.filter(acc => acc.username !== oldRecord.username);
                } else if (eventType === 'UPDATE') {
                    // Пользователь обновлен (например, сменил ник)
                    const index = this.accounts.findIndex(acc => acc.username === oldRecord.username);
                    if (index !== -1) {
                        this.accounts[index].username = newRecord.username;
                    }
                }
            });
        },
        editFutureLevel(level) {
            this.editingLevel = level;

            // Определяем тип прогресса
            const start = level.progress_start || 0;
            const end = level.progress_end || 0;

            // По умолчанию используем текстовый ввод с текущим значением
            this.editData.progressType = 'text';

            if (start === 0 && end === 0) {
                this.editData.progressText = '0%';
            } else if (start === 0 && end !== 100) {
                // Одно число
                this.editData.progressText = `${end}%`;
            } else if (start === 0 && end === 100) {
                this.editData.progressText = '0-100%';
            } else {
                // Диапазон
                this.editData.progressText = `${start}-${end}%`;
            }

            this.editData.progressSingle = end;
            this.editData.progressStart = start;
            this.editData.progressEnd = end;

            this.showEditDialog = true;
        },
        closeEditDialog() {
            this.showEditDialog = false;
            this.editingLevel = null;
            this.editData.progressType = 'text';
            this.editData.progressText = '';
            this.editData.progressSingle = 0;
            this.editData.progressStart = 0;
            this.editData.progressEnd = 100;
        },
        async confirmEdit() {
            if (!this.editingLevel) return;

            const supabase = await getSupabase();
            if (!supabase) return;

            let progressStart, progressEnd;

            if (this.editData.progressType === 'text') {
                // Парсим текстовый ввод
                const parsed = this.parseProgressText(this.editData.progressText);
                progressStart = parsed.start;
                progressEnd = parsed.end;
            } else if (this.editData.progressType === 'single') {
                // Одно число: храним как 0 до этого числа
                progressStart = 0;
                progressEnd = this.editData.progressSingle;
            } else {
                // Диапазон
                progressStart = this.editData.progressStart;
                progressEnd = this.editData.progressEnd;
            }

            try {
                const { error } = await supabase
                    .from('levels')
                    .update({
                        progress_start: progressStart,
                        progress_end: progressEnd
                    })
                    .eq('id', this.editingLevel.id);

                if (error) {
                    console.error('Error updating level:', error);
                    alert('Ошибка при обновлении уровня');
                    return;
                }

                // Обновляем локально
                const index = this.futureLevels.findIndex(l => l.id === this.editingLevel.id);
                if (index !== -1) {
                    this.futureLevels[index].progress_start = progressStart;
                    this.futureLevels[index].progress_end = progressEnd;
                }

                alert('Лучший прогресс обновлен!');
                this.closeEditDialog();
            } catch (error) {
                console.error('Error updating level:', error);
                alert('Ошибка: ' + error.message);
            }
        },
        async deleteFutureLevel(levelId) {
            if (!confirm('Вы уверены, что хотите удалить этот будущий уровень?')) return;

            const supabase = await getSupabase();
            if (!supabase) return;

            try {
                const { error } = await supabase
                    .from('levels')
                    .delete()
                    .eq('id', levelId);

                if (error) {
                    console.error('Error deleting level:', error);
                    alert('Ошибка при удалении уровня');
                    return;
                }

                // Удаляем локально
                this.futureLevels = this.futureLevels.filter(l => l.id !== levelId);
                alert('Уровень удален!');
            } catch (error) {
                console.error('Error deleting level:', error);
                alert('Ошибка: ' + error.message);
            }
        }
    },
    mounted() {
        this.checkAuthentication();
        this.setupRealtime();
    },
    beforeUnmount() {
        // Отписываемся от всех обновлений при закрытии страницы
        realtimeManager.unsubscribeAll();
    },
};
