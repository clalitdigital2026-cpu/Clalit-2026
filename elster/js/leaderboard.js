/* חביתת אלסטר – leaderboard: shared online (Firebase Firestore REST API) with an on-device fallback */
(function () {
  'use strict';
  const U = ELSTER.U;
  const COLL = 'scores';
  const LOCAL_KEY = 'localScores';

  function cfg() {
    const c = window.ELSTER_FIREBASE || {};
    return c.apiKey && c.projectId ? c : null;
  }
  function base(c) {
    return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(c.projectId)}/databases/(default)/documents`;
  }
  function withTimeout(promise, ms) {
    return Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
  }
  /** one stable id per device, so each player keeps a single row */
  function deviceId() {
    let id = U.store.get('playerId', null);
    if (!id) {
      id = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      U.store.set('playerId', id);
    }
    return id;
  }
  function toFields(e) {
    return {
      name: { stringValue: e.name },
      score: { integerValue: String(e.score) },
      stage: { integerValue: String(e.stage) },
      diff: { stringValue: e.diff },
      char: { stringValue: e.char },
      updated: { timestampValue: new Date().toISOString() },
    };
  }
  function fromDoc(doc) {
    const f = doc.fields || {};
    return {
      id: doc.name.split('/').pop(),
      name: (f.name && f.name.stringValue) || '',
      score: Number((f.score && f.score.integerValue) || 0),
      stage: Number((f.stage && f.stage.integerValue) || 0),
      diff: (f.diff && f.diff.stringValue) || '',
      char: (f.char && f.char.stringValue) || '',
    };
  }

  function localList() {
    const l = U.store.get(LOCAL_KEY, []);
    return Array.isArray(l) ? l : [];
  }
  function localSubmit(e) {
    const l = localList();
    const i = l.findIndex((x) => x.id === e.id);
    if (i >= 0) {
      if (e.score <= l[i].score) return;
      l[i] = e;
    } else l.push(e);
    l.sort((a, b) => b.score - a.score);
    U.store.set(LOCAL_KEY, l.slice(0, 50));
  }

  const LB = (ELSTER.Leaderboard = {
    online() {
      return !!cfg();
    },
    myId: deviceId,

    /** save this player's result; keeps only their best score */
    async submit(entry) {
      const name = String(entry.name || '').slice(0, 16);
      let h = 5381;
      for (const ch of name) h = ((h * 33) ^ ch.codePointAt(0)) >>> 0;
      const e = {
        id: deviceId() + '-' + h.toString(36) + '-' + (entry.diff || 'x'),
        name,
        score: Math.max(0, Math.round(entry.score)),
        stage: entry.stage | 0,
        diff: entry.diff || '',
        char: entry.char || '',
      };
      if (!e.name || !e.score) return false;
      localSubmit(e);
      const c = cfg();
      if (!c) return false;
      try {
        const url = `${base(c)}/${COLL}/${e.id}?key=${encodeURIComponent(c.apiKey)}`;
        // only raise the stored best
        const cur = await withTimeout(fetch(url), 8000);
        if (cur.ok) {
          const prev = fromDoc(await cur.json());
          if (prev.score >= e.score && prev.name === e.name) return true;
          if (prev.score > e.score) e.score = prev.score, e.stage = Math.max(prev.stage, e.stage);
        }
        const r = await withTimeout(fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: toFields(e) }),
        }), 8000);
        return r.ok;
      } catch (err) {
        return false;
      }
    },

    /** top players: resolves { list, online, error } */
    /** top players of one difficulty: resolves { list, online, error } */
    async top(diff, limit) {
      limit = limit || 20;
      const pick = (rows) => {
        // keep each player's best for this difficulty (older rows had no difficulty in their id)
        const best = new Map();
        rows.filter((e) => e.diff === diff).forEach((e) => {
          const key = String(e.id).replace(/-(easy|medium|hard)$/, '');
          const cur = best.get(key);
          if (!cur || e.score > cur.score) best.set(key, e);
        });
        return [...best.values()].sort((a, b) => b.score - a.score).slice(0, limit);
      };
      const c = cfg();
      if (!c) return { list: pick(localList()), online: false };
      try {
        const r = await withTimeout(fetch(`${base(c)}:runQuery?key=${encodeURIComponent(c.apiKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            structuredQuery: {
              from: [{ collectionId: COLL }],
              orderBy: [{ field: { fieldPath: 'score' }, direction: 'DESCENDING' }],
              limit: 300,
            },
          }),
        }), 8000);
        if (!r.ok) throw new Error('http ' + r.status);
        const rows = await r.json();
        const list = rows.filter((x) => x.document).map((x) => fromDoc(x.document));
        return { list: pick(list), online: true };
      } catch (err) {
        return { list: pick(localList()), online: false, error: true };
      }
    },
  });
})();
