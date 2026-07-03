import List from './pages/List.js';
import ChallengeList from './pages/ChallengeList.js';
import Leaderboard from './pages/Leaderboard.js';
import FutureList from './pages/FutureList.js';

export default [
    { path: '/', component: List },
    { path: '/challenge-list', component: ChallengeList },
    { path: '/leaderboard', component: Leaderboard },
    { path: '/future-list', component: FutureList },
];
