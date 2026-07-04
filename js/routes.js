import List from './pages/List.js';
import ChallengeList from './pages/ChallengeList.js';
import Leaderboard from './pages/Leaderboard.js';
import FutureList from './pages/FutureList.js';
import Submit from './pages/Submit.js';
import Profile from './pages/Profile.js';
import Admin from './pages/Admin.js';

export default [
    { path: '/', component: List },
    { path: '/challenge-list', component: ChallengeList },
    { path: '/leaderboard', component: Leaderboard },
    { path: '/future-list', component: FutureList },
    { path: '/submit', component: Submit },
    { path: '/profile', component: Profile },
    { path: '/admin', component: Admin },
];
