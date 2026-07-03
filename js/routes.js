import List from './pages/List.js';
import Leaderboard from './pages/Leaderboard.js';
import FutureList from './pages/FutureList.js';

export default [
    { path: '/', component: List },
    { path: '/leaderboard', component: Leaderboard },
    { path: '/future-list', component: FutureList },
];
