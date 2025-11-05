const fetchOptions = {
  credentials: "include",
  headers: { "X-IG-App-ID": "936619743392459" },
  method: "GET",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Recursively fetch all pages (followers or following)
const fetchAll = async (type, userId, nextMaxId = "") => {
  const url = `https://www.instagram.com/api/v1/friendships/${userId}/${type}/?count=50${nextMaxId ? `&max_id=${nextMaxId}` : ""}`;
  const res = await fetch(url, fetchOptions);
  const data = await res.json();

  if (data.next_max_id) {
    await sleep(random(100, 500)); // avoid rate limits
    return data.users.concat(await fetchAll(type, userId, data.next_max_id));
  }
  return data.users || [];
};

const getUserId = async (username) => {
  const url = `https://www.instagram.com/api/v1/web/search/topsearch/?context=blended&query=${username.toLowerCase()}`;
  const data = await fetch(url, fetchOptions).then((r) => r.json());
  const user = data.users?.find(
    (u) => u.user.username.toLowerCase() === username.toLowerCase()
  );
  return user?.user?.pk || null;
};

const getFriendshipStats = async (username) => {
  const userId = await getUserId(username);
  if (!userId) throw new Error(`User "${username}" not found`);

  const [followers, following] = await Promise.all([
    fetchAll("followers", userId),
    fetchAll("following", userId),
  ]);

  const followersSet = new Set(followers.map((u) => u.username.toLowerCase()));
  const followingSet = new Set(following.map((u) => u.username.toLowerCase()));

  return {
    PeopleIDontFollowBack: [...followersSet].filter((u) => !followingSet.has(u)),
    PeopleNotFollowingMeBack: [...followingSet].filter((u) => !followersSet.has(u)),
  };
};

// Example usage
getFriendshipStats("arshuls").then(console.log);
