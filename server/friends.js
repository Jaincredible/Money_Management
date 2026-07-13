// Friends / social layer helpers.

// Only fields safe to show other users — NO email, address, income, savings, or transactions.
export function publicProfile(u) {
  if (!u) return null;
  return {
    username: u.username,
    fullName: u.fullName,
    level: u.level,
    xp: u.xp || 0,
    xpToNext: u.xpToNext || 300,
    badges: u.badges || [],
    collegeName: u.collegeName || '',
    agentPersona: u.agentPersona || 'Coach',
    memberSince: u.createdAt || null,
  };
}

// Stable key for a 1:1 chat thread regardless of who sends.
export function threadKey(a, b) {
  return [a, b].sort().join('|');
}

// Are two users accepted friends?
export async function areFriends(db, a, b) {
  const r = await db.collection('friend_requests').findOne({
    status: 'accepted',
    $or: [
      { fromUserId: a, toUserId: b },
      { fromUserId: b, toUserId: a },
    ],
  });
  return !!r;
}
