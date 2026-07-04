import { round, score } from './score.js';
import { getSupabase } from './supabase.js';

/**
 * Fetch list from Supabase
 * @param {string} listType - 'main', 'challenge', or 'future'
 */
export async function fetchList(listType = 'main') {
    const supabase = await getSupabase();
    if (!supabase) {
        console.error('Failed to connect to Supabase');
        return null;
    }

    try {
        // Получаем уровни из базы данных
        const { data: levels, error: levelsError } = await supabase
            .from('levels')
            .select('*')
            .eq('list_type', listType)
            .order('position', { ascending: true });

        if (levelsError) {
            console.error('Failed to load levels:', levelsError);
            return null;
        }

        // Для каждого уровня получаем его рекорды
        const list = await Promise.all(
            levels.map(async (level) => {
                const { data: records, error: recordsError } = await supabase
                    .from('records')
                    .select('*')
                    .eq('level_id', level.id);

                if (recordsError) {
                    console.error(`Failed to load records for level ${level.name}:`, recordsError);
                    return [null, level.name];
                }

                return [
                    {
                        id: level.id,
                        name: level.name,
                        author: level.author,
                        creators: level.creators,
                        verifier: level.verifier,
                        verification: level.verification,
                        percentToQualify: level.percent_to_qualify,
                        password: level.password,
                        best_progress: level.best_progress,
                        records: records.map(r => ({
                            user: r.username,
                            link: r.link,
                            percent: r.percent,
                            hz: r.hz,
                            mobile: r.mobile
                        })).sort((a, b) => b.percent - a.percent),
                    },
                    null,
                ];
            })
        );

        return list;
    } catch (error) {
        console.error('Failed to fetch list:', error);
        return null;
    }
}

export async function fetchEditors() {
    // Editors.json больше не используется
    // Можно добавить таблицу editors в базу данных при необходимости
    return null;
}

export async function fetchLeaderboard() {
    const list = await fetchList('main');
    if (!list) return [[], []];

    const scoreMap = {};
    const errs = [];

    list.forEach(([level, err], rank) => {
        if (err) {
            errs.push(err);
            return;
        }

        // Verification
        const verifier = Object.keys(scoreMap).find(
            (u) => u.toLowerCase() === level.verifier.toLowerCase(),
        ) || level.verifier;
        scoreMap[verifier] ??= {
            verified: [],
            completed: [],
            progressed: [],
        };
        const { verified } = scoreMap[verifier];
        verified.push({
            rank: rank + 1,
            level: level.name,
            score: score(rank + 1, 100, level.percentToQualify),
            link: level.verification,
        });

        // Records
        level.records.forEach((record) => {
            const user = Object.keys(scoreMap).find(
                (u) => u.toLowerCase() === record.user.toLowerCase(),
            ) || record.user;
            scoreMap[user] ??= {
                verified: [],
                completed: [],
                progressed: [],
            };
            const { completed, progressed } = scoreMap[user];
            if (record.percent === 100) {
                completed.push({
                    rank: rank + 1,
                    level: level.name,
                    score: score(rank + 1, 100, level.percentToQualify),
                    link: record.link,
                });
                return;
            }

            progressed.push({
                rank: rank + 1,
                level: level.name,
                percent: record.percent,
                score: score(rank + 1, record.percent, level.percentToQualify),
                link: record.link,
            });
        });
    });

    // Wrap in extra Object containing the user and total score
    const res = Object.entries(scoreMap).map(([user, scores]) => {
        const { verified, completed, progressed } = scores;
        const total = [verified, completed, progressed]
            .flat()
            .reduce((prev, cur) => prev + cur.score, 0);

        return {
            user,
            total: round(total),
            ...scores,
        };
    });

    // Sort by total score
    return [res.sort((a, b) => b.total - a.total), errs];
}
